#!/usr/bin/env python3
"""
CV Rater (flexible JSON + ONNX/SBERT backends)
----------------------------------------------

- Default backend: ONNX (onnxruntime + transformers tokenizer).
- Optional fallback: sentence-transformers (if EMBEDDINGS_BACKEND=st AND package is installed).

ENV VARS (recommended on Heroku):
  EMBEDDINGS_BACKEND=onnx             # "onnx" (default) or "st"
  EMBEDDINGS_MODEL_DIR=models/all-MiniLM-L6-v2
  EMBEDDINGS_ONNX_FILE=model.onnx     # or model.int8.onnx if you quantized
  ORT_INTRA_OP_NUM_THREADS=1
  ORT_INTER_OP_NUM_THREADS=1
  TRANSFORMERS_OFFLINE=1              # avoid network calls on dyno

The ONNX folder must contain:
  - model.onnx (or model.int8.onnx)
  - tokenizer.json / tokenizer_config.json / special_tokens_map.json / vocab.txt / config.json
"""

from __future__ import annotations
import os, re, math, json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Set

import numpy as np

# -----------------------------
# Backends: ONNX (default) / ST
# -----------------------------
_BACKEND = os.getenv("EMBEDDINGS_BACKEND", "onnx").strip().lower()

# Soft-import sentence-transformers (optional)
try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    _HAS_ST = True
except Exception:
    _HAS_ST = False

# -----------------------------
# Small helpers
# -----------------------------
def _read_lines(path: Path) -> List[str]:
    if not path.exists():
        return []
    return [
        ln.strip()
        for ln in path.read_text(encoding="utf-8").splitlines()
        if ln.strip() and not ln.strip().startswith("#")
    ]

def _lower_set(lines: Iterable[str]) -> Set[str]:
    return {l.lower() for l in lines}

def _sigmoid(x: float) -> float:
    import math
    return 1.0 / (1.0 + math.exp(-x))

def _normalize_0_100(x: float, lo: float, hi: float) -> float:
    if hi == lo:
        return 0.0
    return max(0.0, min(100.0, 100.0 * (x - lo) / (hi - lo)))

def _flatten_strings(obj: Any) -> List[str]:
    out: List[str] = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, (int, float)):
        out.append(str(obj))
    elif isinstance(obj, list):
        for it in obj:
            out.extend(_flatten_strings(it))
    elif isinstance(obj, dict):
        for v in obj.values():
            out.extend(_flatten_strings(v))
    return out

def _extract_email(text: str):
    m = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    return m.group(0) if m else None

def _extract_phone(text: str):
    m = re.search(r"(\+?\d[\d\-\s()]{7,}\d)", text)
    return m.group(0) if m else None

def _tokenize(text: str) -> List[str]:
    parts = re.findall(r"[A-Za-z][A-Za-z0-9.+#]*|\+\+|R|C\+\+|C#", text)
    return [p for p in parts if p]

def _generate_ngrams(tokens: List[str], max_n: int = 3) -> List[str]:
    out = []
    n = len(tokens)
    for L in range(1, max_n + 1):
        for i in range(n - L + 1):
            out.append(" ".join(tokens[i : i + L]))
    return out

# -----------------------------
# Embedding backends
# -----------------------------
class _EmbedderBase:
    def encode(self, texts: List[str]) -> np.ndarray:
        raise NotImplementedError

class _STEmbedder(_EmbedderBase):
    """Sentence-Transformers backend (requires sentence-transformers + a heavy wheel)."""
    def __init__(self, model_name: str, device: Optional[str] = None):
        if not _HAS_ST:
            raise ImportError("sentence-transformers is not installed")
        self._model = SentenceTransformer(model_name, device=device)

    def encode(self, texts: List[str]) -> np.ndarray:
        # L2-normalized vectors (float32)
        vecs = self._model.encode(texts, normalize_embeddings=True)
        return np.asarray(vecs, dtype="float32")

class _ONNXEmbedder(_EmbedderBase):
    """
    ONNX backend: loads model.onnx + tokenizer from a local folder (committed to repo).
    Zero downloads on dyno.
    """
    def __init__(self, model_dir: str, onnx_file: str = "model.onnx"):
        from transformers import AutoTokenizer  # light dep
        import onnxruntime as ort

        self.model_dir = model_dir
        self.onnx_path = os.path.join(model_dir, onnx_file)

        # Offline by default
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

        # Tokenizer files must be present in model_dir
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

        # Threading controls (keep small on 512 MB dyno)
        intra = int(os.getenv("ORT_INTRA_OP_NUM_THREADS", "1"))
        inter = int(os.getenv("ORT_INTER_OP_NUM_THREADS", "1"))

        so = ort.SessionOptions()
        so.intra_op_num_threads = intra
        so.inter_op_num_threads = inter

        self.session = ort.InferenceSession(
            self.onnx_path, sess_options=so, providers=["CPUExecutionProvider"]
        )

    @staticmethod
    def _mean_pool(last_hidden_state: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
        mask = attention_mask[..., None].astype(last_hidden_state.dtype)  # (B, T, 1)
        summed = (last_hidden_state * mask).sum(axis=1)                   # (B, H)
        counts = np.clip(mask.sum(axis=1), 1e-9, None)                    # (B, 1)
        return summed / counts

    def encode(self, texts: List[str]) -> np.ndarray:
        enc = self.tokenizer(
            texts, padding=True, truncation=True, max_length=256, return_tensors="np"
        )
        (last_hidden_state,) = self.session.run(
            None,
            {"input_ids": enc["input_ids"], "attention_mask": enc["attention_mask"]},
        )
        vecs = self._mean_pool(last_hidden_state, enc["attention_mask"])
        # L2 normalize (Sentence-Transformers convention)
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        vecs = vecs / np.clip(norms, 1e-9, None)
        return vecs.astype("float32")

# -----------------------------
# Scoring data classes
# -----------------------------
@dataclass
class ComponentScores:
    education: float
    experience: float
    skills: float
    ai_signal: float
    def overall(self, w: Tuple[float, float, float, float]) -> float:
        e, x, s, a = self.education, self.experience, self.skills, self.ai_signal
        total = e * w[0] + x * w[1] + s * w[2] + a * w[3]
        return max(0.0, min(100.0, total))

# -----------------------------
# Rater
# -----------------------------
class CVRater:
    def __init__(
        self,
        data_dir: str = "data",
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: Optional[str] = None,
        weights: Tuple[float, float, float, float] = (0.25, 0.35, 0.20, 0.20),
    ):
        self.data_dir = Path(data_dir)
        self.model_name = model_name
        self.device = device
        self.weights = weights

        self._embedder: Optional[_EmbedderBase] = None

        self.skills_lex = _lower_set(_read_lines(self.data_dir / "skills.txt"))
        self.tool_keywords = _lower_set(_read_lines(self.data_dir / "tooling_keywords.txt"))
        self.stem_terms = _lower_set(_read_lines(self.data_dir / "stem_terms.txt"))

        self.archetypes: Dict[str, str] = {}
        for ln in _read_lines(self.data_dir / "archetypes.txt"):
            if ":" in ln:
                name, desc = ln.split(":", 1)
                self.archetypes[name.strip()] = desc.strip()
        if not self.archetypes:
            self.archetypes = {
                "general": "Well-rounded candidate with education, experience, and relevant skills."
            }

    # ---- embeddings ---------------------------------------------------------
    def _ensure_embedder(self):
        if self._embedder is not None:
            return

        backend = _BACKEND
        if backend == "st":
            if not _HAS_ST:
                # If requested ST but it's not installed, fall back to ONNX.
                backend = "onnx"
            else:
                self._embedder = _STEmbedder(self.model_name, device=self.device)
                return

        # ONNX path: models/all-MiniLM-L6-v2/model(.int8).onnx
        model_dir = os.getenv("EMBEDDINGS_MODEL_DIR", "models/all-MiniLM-L6-v2")
        onnx_file = os.getenv("EMBEDDINGS_ONNX_FILE", "model.onnx")
        self._embedder = _ONNXEmbedder(model_dir=model_dir, onnx_file=onnx_file)

    def _encode(self, texts: List[str]) -> np.ndarray:
        self._ensure_embedder()
        assert self._embedder is not None
        return self._embedder.encode(texts)

    # ---- public API ---------------------------------------------------------
    def rate(self, cv: Dict[str, Any], explain: bool = True) -> Dict[str, Any]:
        f = self._flex_parse(cv)
        ed = self._score_education(f)
        ex = self._score_experience(f)
        sk = self._score_skills(f)
        ai = self._score_ai_signal(f)
        comps = ComponentScores(ed, ex, sk, ai)
        out = {
            "overall_score": round(comps.overall(self.weights), 1),
            "components": {
                "education": round(ed, 1),
                "experience": round(ex, 1),
                "skills": round(sk, 1),
                "ai_signal": round(ai, 1),
            },
            "weights": {
                "education": self.weights[0],
                "experience": self.weights[1],
                "skills": self.weights[2],
                "ai_signal": self.weights[3],
            },
        }
        if explain:
            out["explanation"] = self._explain(f, comps)
        return out

    # ---- parsing & heuristics ----------------------------------------------
    def _flex_parse(self, cv: Dict[str, Any]) -> Dict[str, Any]:
        all_strings = _flatten_strings(cv)
        aggregate_text = "\n".join([s for s in all_strings if isinstance(s, str)])

        # email/phone anywhere
        email = None
        for s in all_strings:
            if isinstance(s, str):
                em = _extract_email(s)
                if em:
                    email = em
                    break
        phone = None
        for s in all_strings:
            if isinstance(s, str):
                ph = _extract_phone(s)
                if ph:
                    phone = ph
                    break

        # degree text (ignore if it's an email)
        degree_text = ""
        deg_field = cv.get("degree")
        if isinstance(deg_field, str):
            degree_text = deg_field
        elif isinstance(deg_field, list):
            degree_text = " ".join([str(x) for x in deg_field if isinstance(x, (str, int, float))])
        if _extract_email(degree_text or ""):
            degree_text = ""

        college_text = cv.get("college_name") if isinstance(cv.get("college_name"), str) else ""

        # skills: provided + extracted via lexicon
        skills: Set[str] = set()
        if isinstance(cv.get("skills"), list):
            for s in cv["skills"]:
                if isinstance(s, str) and s.strip():
                    skills.add(s.strip().lower())
        tokens = _tokenize(aggregate_text.lower())
        for ng in _generate_ngrams(tokens, 3):
            if ng in self.skills_lex:
                skills.add(ng)

        # years
        years = None
        if isinstance(cv.get("total_experience"), (int, float)):
            years = float(cv["total_experience"])
        if years is None:
            years = self._infer_years_from_text(aggregate_text)

        # experience text
        exp_text = ""
        for k in ("experience", "work_experience", "employment", "positions"):
            if k in cv and isinstance(cv[k], list):
                exp_text = " ".join([str(x) for x in cv[k] if isinstance(x, (str, int, float))])
                break
        if not exp_text:
            exp_text = aggregate_text

        return {
            "aggregate_text": aggregate_text,
            "email": email,
            "phone": phone,
            "degree_text": degree_text,
            "college_text": college_text,
            "skills": sorted(skills),
            "experience_text": exp_text,
            "total_experience_years": years,
        }

    def _infer_years_from_text(self, text: str) -> float:
        spans = re.findall(
            r"(19|20)\d{2}\s*[-\u2013]\s*((?:19|20)\d{2}|present|now|current)", text.lower()
        )

        months = 0
        from datetime import datetime

        cur = datetime.now().year
        for a, b in re.findall(r"(\d{4})\s*[-\u2013]\s*(\d{4}|present|now|current)", text.lower()):
            y1 = int(a)
            y2 = cur if not b.isdigit() else int(b)
            if 1950 <= y1 <= y2 <= 2100:
                months += max(0, (y2 - y1)) * 12

        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", text))
        months += int(bullets * 0.5)

        return months / 12.0 if months else 0.0

    # ---- component scoring --------------------------------------------------
    def _score_education(self, f: Dict[str, Any]) -> float:
        deg = (f.get("degree_text") or "").lower()
        college = (f.get("college_text") or "").strip()
        email = (f.get("email") or "")

        base = 20.0
        if any(k in deg for k in ("phd", "doctor", "md", "jd", "dphil")):
            base += 55
        elif any(k in deg for k in ("master", "msc", "m.s", "m.eng", "ms ")):
            base += 45
        elif any(k in deg for k in ("bachelor", "b.sc", "beng", "b.s", "ba ")):
            base += 35
        elif any(k in deg for k in ("high school", "secondary", "undergrad")):
            base += 15
        else:
            base += 10

        if any(t in deg for t in self.stem_terms):
            base += 7
        if college:
            base += 5
        if isinstance(email, str) and email.endswith(".edu"):
            base += 5

        return max(0.0, min(100.0, base))

    def _score_experience(self, f: Dict[str, Any]) -> float:
        years = f.get("total_experience_years") or 0.0

        s = 100.0 * _sigmoid(0.55 * (years - 2.5))
        s = 20 + 0.8 * (s - 50)
        s = max(0.0, min(100.0, s))

        text = (f.get("experience_text") or "").lower()
        for kw, bonus in [("intern", 6), ("lecturer", 6), ("postdoc", 6), ("research assistant", 4)]:
            if kw in text:
                s += bonus
        for kw in self.tool_keywords:
            if kw in text:
                s += 1.5

        return max(0.0, min(100.0, s))

    def _score_skills(self, f: Dict[str, Any]) -> float:
        skills = [s.lower() for s in (f.get("skills") or [])]
        unique = sorted(set(skills))
        n = len(unique)

        breadth = 100.0 * (1 - math.exp(-n / 10.0))
        buckets = {
            "programming": {"python", "java", "c", "c++", "r", "sql"},
            "cad_eng": {"solidworks", "cad", "engineering", "electrical", "mechanical"},
            "analytics": {"analytics", "statistics", "excel", "microsoft office", "data analysis", "modeling"},
            "science": {"biology", "chemistry", "physics", "geochemistry", "petrology", "earth", "ocean"},
            "language": {"spanish"},
            "teaching": {"teaching", "mentoring"},
        }
        coverage = 0.0
        for keys in buckets.values():
            if any(k in unique for k in keys):
                coverage += 1.0
        coverage = _normalize_0_100(coverage, 0, len(buckets))

        strong = {
            "python",
            "java",
            "solidworks",
            "analytics",
            "biology",
            "chemistry",
            "physics",
            "modeling",
            "research",
        }
        depth = 60.0 if any(s in strong for s in unique) else 30.0

        return max(0.0, min(100.0, 0.5 * breadth + 0.3 * coverage + 0.2 * depth))

    def _score_ai_signal(self, f: Dict[str, Any]) -> float:
        text = f.get("aggregate_text") or ""
        if not text.strip():
            return 0.0

        # ONNX/ST embeddings (already L2-normalized)
        resume = self._encode([text])  # (1, d)
        names = list(self.archetypes.keys())
        descs = [self.archetypes[k] for k in names]
        arch = self._encode(descs)     # (N, d)

        # cosine (dot of normalized vectors) → scale to [0,100]
        sims = (resume @ arch.T).flatten().astype(np.float64)
        sims = np.clip((sims + 1.0) / 2.0, 0.0, 1.0) * 100.0

        topk = min(4, sims.size)
        ai = 0.7 * float(np.mean(np.sort(sims)[-topk:])) + 0.3 * float(np.mean(sims))

        txt = text.lower()
        if any(k in txt for k in ("vice-president", "vice president", "lecturer", "postdoc")):
            ai += 3.0
        if "intern" in txt or "research assistant" in txt:
            ai += 3.0

        return max(0.0, min(100.0, ai))

    def _select_strengths_weaknesses(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, list]:
        import re
        txt = (f.get("aggregate_text") or "").lower()
        exp_txt = (f.get("experience_text") or "").lower()
        skills = {s.lower() for s in (f.get("skills") or [])}
        years = float(f.get("total_experience_years") or 0.0)
        email = f.get("email") or ""
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", f.get("aggregate_text") or ""))

        try:
            tokens = set(_tokenize(txt))
        except Exception:
            tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9\+\-#\.]*", txt))

        def has_any(keys, haystack):
            if isinstance(haystack, set):
                return any(k in haystack for k in keys)
            return any(k in txt for k in keys)

        def contains(*subs):
            return any(s in txt for s in subs)

        def count_metrics():
            return len(re.findall(r"\b\d+(?:\.\d+)?\s*%|\$\s*\d|\b\d{2,}\b", txt))

        strengths_candidates = []
        if has_any({"python", "java", "c++", "c#", "javascript", "sql"}, skills | tokens):
            strengths_candidates.append("Solid programming foundation is evident.")
        if has_any({"statistics", "analytics", "modeling", "excel", "data analysis"}, skills | tokens):
            strengths_candidates.append("Strong analytical/statistical skills are demonstrated.")
        if has_any({"solidworks", "cad", "mechanical", "electrical"}, skills | tokens):
            strengths_candidates.append("Hands-on CAD/engineering design experience.")
        if has_any({"biology", "chemistry", "physics", "geochemistry", "petrology"}, skills | tokens):
            strengths_candidates.append("Cross-disciplinary scientific background.")
        if contains("vice-president", "vice president", "president", "led", "leader", "organized", "coordinated"):
            strengths_candidates.append("Clear leadership/ownership experience.")
        if contains("teaching", "mentoring", "tutoring", "lecturer"):
            strengths_candidates.append("Experience mentoring/teaching others.")
        if contains("published", "peer-reviewed", "in press", "conference abstract"):
            strengths_candidates.append("Publication/peer-review track record.")
        if contains("field sampling", "expedition", "submersible", "rov", "fluid sampling"):
            strengths_candidates.append("Field/expedition experience adds real-world depth.")
        if contains("presented", "conference", "symposium", "workshop"):
            strengths_candidates.append("Public speaking/presentation exposure.")
        if contains("github", "gitlab", "bitbucket"):
            strengths_candidates.append("Evidence of code sharing or open-source involvement.")
        if any(kw in txt for kw in getattr(self, "tool_keywords", [])):
            strengths_candidates.append("Good familiarity with process/tooling keywords.")
        if comps.education >= 70:
            strengths_candidates.append("Strong academic credentials.")
        if years >= 3:
            strengths_candidates.append("Meaningful professional experience (3+ years).")
        if len(skills) >= 12:
            strengths_candidates.append("Broad skill coverage across multiple areas.")
        if comps.ai_signal >= 70:
            strengths_candidates.append("Profile closely aligns with target role archetypes.")
        if contains("spanish", "bilingual", "multilingual", "international"):
            strengths_candidates.append("International/cross-cultural communication capability.")
        if contains("certified", "certification", "aws certified", "azure", "gcp", "pmp", "scrum"):
            strengths_candidates.append("Relevant professional certifications.")
        if contains("created", "implemented", "built", "designed", "launched", "initiated"):
            strengths_candidates.append("Shows initiative and end-to-end project ownership.")
        if contains("shipped", "deployed", "released", "production"):
            strengths_candidates.append("Proven track record of shipping to production.")
        if contains("data", "statistic", "model", "hypothesis", "experiment"):
            strengths_candidates.append("Data-driven approach to problem solving.")
        if contains("laboratory", "methods", "protocol", "standard operating"):
            strengths_candidates.append("Laboratory methods and protocol experience.")
        if contains("iso", "rohs", "compliance", "regulatory", "quality"):
            strengths_candidates.append("Awareness of standards, quality, or compliance.")
        if contains("docker", "kubernetes", "ci", "cd", "pipeline", "terraform"):
            strengths_candidates.append("DevOps/automation exposure.")
        if bullets >= 10:
            strengths_candidates.append("Well-structured resume with clear bulleting.")
        if comps.skills >= 70:
            strengths_candidates.append("Skills mix indicates both breadth and depth.")

        weaknesses_candidates = []
        if years < 1.0:
            weaknesses_candidates.append("Limited professional experience (<1 year).")
        if len(skills) < 5:
            weaknesses_candidates.append("Narrow skills list—consider broadening toolset.")
        if count_metrics() == 0:
            weaknesses_candidates.append("Few quantified outcomes—add metrics (%, $, time saved).")
        if not contains("github", "portfolio", "personal website", "linkedin"):
            weaknesses_candidates.append("No work links (GitHub/portfolio/LinkedIn) included.")
        if not (f.get("degree_text") or "").strip():
            weaknesses_candidates.append("Education details are minimal or unclear.")
        if not contains("led", "leader", "leadership", "organized", "coordinated", "managed"):
            weaknesses_candidates.append("No explicit leadership examples.")
        if not contains("team", "collaborat", "cross-functional", "stakeholder"):
            weaknesses_candidates.append("Teamwork/collaboration not highlighted.")
        if not contains("shipped", "deployed", "released", "production", "launched"):
            weaknesses_candidates.append("Production delivery not emphasized.")
        if not contains("test", "qa", "pytest", "junit", "verification", "validation"):
            weaknesses_candidates.append("Testing/QA practices not visible.")
        if not contains("docker", "kubernetes", "ci", "cd", "pipeline", "terraform"):
            weaknesses_candidates.append("DevOps/CI-CD exposure appears limited.")
        if not has_any({"statistics", "analytics", "modeling", "excel", "data analysis"}, skills | tokens):
            weaknesses_candidates.append("Analytical/statistical skills not clearly evidenced.")
        if len(txt) < 800:
            weaknesses_candidates.append("Resume may be too brief—add scope, context, and impact.")
        if len(txt) > 8000:
            weaknesses_candidates.append("Resume may be overly long—tighten to key wins and scope.")
        if not skills:
            weaknesses_candidates.append("Skills section is sparse or missing.")
        if not email and not f.get("phone"):
            weaknesses_candidates.append("Contact info (email/phone) is missing.")
        if sum(1 for kw in getattr(self, "tool_keywords", []) if kw in txt) < 3:
            weaknesses_candidates.append("Process/tooling keywords are light—add relevant methods/tools.")
        if comps.ai_signal < 35:
            weaknesses_candidates.append("Overall role alignment seems weak—tailor to the target role.")
        if comps.education < 40:
            weaknesses_candidates.append("Education signal is low—clarify degree/major or coursework.")
        if not contains("mentor", "mentoring", "tutor", "coached", "supervised"):
            weaknesses_candidates.append("Mentoring/coaching not demonstrated.")
        if not contains("publication", "published", "peer-review", "conference"):
            weaknesses_candidates.append("Publications or knowledge sharing are not highlighted.")
        if not contains("healthcare", "finance", "retail", "manufacturing", "energy", "telecom", "domain", "industry"):
            weaknesses_candidates.append("Domain focus is unclear—specify industries/projects.")
        if "responsible for" in txt:
            weaknesses_candidates.append("Language is passive—rephrase with strong action verbs.")
        if bullets < 3:
            weaknesses_candidates.append("Use bullet points to improve scanability.")
        if not contains("roi", "revenue", "cost", "throughput", "latency", "accuracy", "precision", "recall", "nps"):
            weaknesses_candidates.append("Business or quality impact metrics are missing.")
        if not contains("roadmap", "scope", "estimate", "prioritize", "stakeholder", "requirements"):
            weaknesses_candidates.append("Product/requirements ownership not highlighted.")

        def dedup(seq):
            seen = set()
            out = []
            for x in seq:
                if x not in seen:
                    out.append(x)
                    seen.add(x)
            return out

        strengths = dedup(strengths_candidates)[:3]
        weaknesses = dedup(weaknesses_candidates)[:3]

        fallback_strengths = [
            "Evidence of continuous learning and upskilling.",
            "Clear problem-solving orientation is visible.",
            "Good mix of theory and practical application.",
            "Communication artifacts (talks/docs) strengthen the profile.",
            "Ability to work across disciplines and contexts.",
        ]
        fallback_weaknesses = [
            "Tailor the summary to the specific role and company.",
            "Add more concrete outcomes for major projects.",
            "Clarify your role and scope within each project.",
            "Include the most relevant tools/technologies for the target role.",
            "Tighten wording and remove repetition.",
        ]

        for pool, target in ((fallback_strengths, strengths), (fallback_weaknesses, weaknesses)):
            i = 0
            while len(target) < 3 and i < len(pool):
                if pool[i] not in target:
                    target.append(pool[i])
                i += 1

        return {"strengths": strengths, "weaknesses": weaknesses}

    def _explain(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, Any]:
        txt = (f.get("aggregate_text") or "").lower()
        highlights = []
        if any(k in txt for k in ("intern", "lecturer", "postdoc", "research assistant")):
            highlights.append("Internship/lecturing/research signals present.")
        if any(k in txt for k in ("vice-president", "vice president", "leader", "led")):
            highlights.append("Leadership signals detected.")
        if any(k in txt for k in self.tool_keywords):
            highlights.append("Process/tooling keywords detected.")

        top_arch = []
        try:
            resume = self._encode([f.get("aggregate_text") or ""])
            names = list(self.archetypes.keys())
            descs = [self.archetypes[k] for k in names]
            arch = self._encode(descs)
            sims = (resume @ arch.T).flatten()
            sims = ((sims + 1.0) / 2.0) * 100.0
            order = np.argsort(-sims)[:3]
            for i in order:
                top_arch.append({"name": names[int(i)], "match_pct": round(float(sims[int(i)]), 1)})
        except Exception:
            pass

        return {
            "highlights": highlights,
            "top_archetype_matches": top_arch,
            "component_details": {
                "education": round(comps.education, 1),
                "experience": round(comps.experience, 1),
                "skills": round(comps.skills, 1),
                "ai_signal": round(comps.ai_signal, 1),
            },
            "notes": self._select_strengths_weaknesses(f, comps),
        }

# -----------------------------
# Module-level shared instance
# -----------------------------
_SHARED_RATER: Optional["CVRater"] = None

def get_shared_rater(
    data_dir: str = "data",
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    device: Optional[str] = None,
    weights: Tuple[float, float, float, float] = (0.25, 0.25, 0.20, 0.35),
) -> "CVRater":
    global _SHARED_RATER
    if _SHARED_RATER is None:
        _SHARED_RATER = CVRater(
            data_dir=data_dir,
            model_name=model_name,
            device=device,
            weights=weights,
        )
    return _SHARED_RATER

# -----------------------------
# Convenience function
# -----------------------------
def rate_dict(cv_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Take a CV payload as a Python dict and return the rating result as a dict.
    """
    if not isinstance(cv_data, dict):
        raise TypeError("cv_data must be a dict")
    return get_shared_rater().rate(cv_data)
