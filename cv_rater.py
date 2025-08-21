#!/usr/bin/env python3
"""
CV Rater (flexible JSON + open-source)
--------------------------------------

Robust parser + editable lexicons in ./data and AI embeddings.
"""
from __future__ import annotations
import argparse, json, math, re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Set

import numpy as np

# boolean flag that checks whether the language model has
try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True # boolean flag that checks whether the language model has been imported
except Exception:
    _HAS_ST = False

# method that returns the file as a string array with lines as elements
def _read_lines(path: Path) -> List[str]:
    if not path.exists():
        return []
    return [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.strip().startswith("#")]

# method that returns the lines as lower case lines
def _lower_set(lines: Iterable[str]) -> Set[str]:
    return {l.lower() for l in lines}

def _sigmoid(x: float) -> float:
    import math
    return 1.0 / (1.0 + math.exp(-x))

def _normalize_0_100(x: float, lo: float, hi: float) -> float:
    if hi == lo: return 0.0
    return max(0.0, min(100.0, 100.0 * (x - lo) / (hi - lo)))

#return the object as list of strings
def _flatten_strings(obj: Any) -> List[str]:
    out: List[str] = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, (int, float)):
        out.append(str(obj))
    elif isinstance(obj, list):
        for it in obj: out.extend(_flatten_strings(it))
    elif isinstance(obj, dict):
        for v in obj.values(): out.extend(_flatten_strings(v))
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
            out.append(" ".join(tokens[i:i+L]))
    return out

#data class that mimics the json output.
@dataclass
class ComponentScores:
    education: float
    experience: float
    skills: float
    ai_signal: float
    #returns the overall score after the rating if json
    def overall(self, w: Tuple[float,float,float,float]) -> float:
        e,x,s,a = self.education, self.experience, self.skills, self.ai_signal
        total = e*w[0] + x*w[1] + s*w[2] + a*w[3]
        return max(0.0, min(100.0, total))

#implementation of the actual rater
class CVRater:
    def __init__(self, data_dir: str = "data", model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
                 device: Optional[str] = None, weights: Tuple[float,float,float,float]=(0.25,0.35,0.20,0.20)):
        self.data_dir = Path(data_dir)
        self.model_name = model_name
        self.device = device
        self.weights = weights
        self._model = None

        self.skills_lex = _lower_set(_read_lines(self.data_dir / "skills.txt"))
        self.tool_keywords = _lower_set(_read_lines(self.data_dir / "tooling_keywords.txt"))
        self.stem_terms = _lower_set(_read_lines(self.data_dir / "stem_terms.txt"))

        self.archetypes: Dict[str,str] = {}
        for ln in _read_lines(self.data_dir / "archetypes.txt"):
            if ":" in ln:
                name, desc = ln.split(":", 1)
                self.archetypes[name.strip()] = desc.strip()
        if not self.archetypes:
            self.archetypes = {"general": "Well-rounded candidate with education, experience, and relevant skills."}

    def _ensure_model(self):
        if self._model is None:
            if not _HAS_ST:
                raise ImportError("sentence-transformers is required. pip install sentence-transformers")
            self._model = SentenceTransformer(self.model_name, device=self.device)

    def rate(self, cv: Dict[str,Any], explain: bool=True) -> Dict[str,Any]:
        f = self._flex_parse(cv)
        ed = self._score_education(f)
        ex = self._score_experience(f)
        sk = self._score_skills(f)
        ai = self._score_ai_signal(f)
        comps = ComponentScores(ed, ex, sk, ai)
        out = {
            "overall_score": round(comps.overall(self.weights), 1),
            "components": {"education": round(ed,1), "experience": round(ex,1), "skills": round(sk,1), "ai_signal": round(ai,1)},
            "weights": {"education": self.weights[0], "experience": self.weights[1], "skills": self.weights[2], "ai_signal": self.weights[3]}
        }
        if explain: out["explanation"] = self._explain(f, comps)
        return out

    def _flex_parse(self, cv: Dict[str,Any]) -> Dict[str,Any]:
        all_strings = _flatten_strings(cv)
        aggregate_text = "\n".join([s for s in all_strings if isinstance(s, str)])

        # email/phone anywhere
        email = None
        for s in all_strings:
            if isinstance(s, str):
                em = _extract_email(s)
                if em: email = em; break
        phone = None
        for s in all_strings:
            if isinstance(s, str):
                ph = _extract_phone(s)
                if ph: phone = ph; break

        # degree text (ignore if it's an email)
        degree_text = ""
        deg_field = cv.get("degree")
        if isinstance(deg_field, str): degree_text = deg_field
        elif isinstance(deg_field, list): degree_text = " ".join([str(x) for x in deg_field if isinstance(x, (str,int,float))])
        if _extract_email(degree_text or ""): degree_text = ""

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
        if isinstance(cv.get("total_experience"), (int,float)):
            years = float(cv["total_experience"])
        if years is None:
            years = self._infer_years_from_text(aggregate_text)

        # experience text
        exp_text = ""
        for k in ("experience","work_experience","employment","positions"):
            if k in cv and isinstance(cv[k], list):
                exp_text = " ".join([str(x) for x in cv[k] if isinstance(x, (str,int,float))])
                break
        if not exp_text: exp_text = aggregate_text

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
        """
        Heuristically infer total experience (in years) from free text.

        Approach:
          1) Look for year ranges like "2016–2020" or "2018-2021" (also supports 'present/now/current' as end).
          2) Sum the span lengths (in months) for each detected range (clamped to sensible bounds).
          3) Add a tiny heuristic for bullet density (±0.5 months per bullet) to avoid zero when dates are sparse.
          4) Return months converted to years (float).

        Args:
            text: Raw resume / experience text.

        Returns:
            float: Estimated years of experience (>= 0.0).
        """
        # Detect explicit year spans such as "2014-2018" or "2019–present".
        # NOTE: We normalize to lowercase to match 'present|now|current'.
        spans = re.findall(
            r"(19|20)\d{2}\s*[-\u2013]\s*((?:19|20)\d{2}|present|now|current)",
            text.lower()
        )

        months = 0
        from datetime import datetime
        cur = datetime.now().year

        # Iterate again with capturing groups for start and end years/keywords.
        for a, b in re.findall(r"(\d{4})\s*[-\u2013]\s*(\d{4}|present|now|current)", text.lower()):
            y1 = int(a)
            # If end is not a digit (present/now/current), treat it as the current year.
            y2 = cur if not b.isdigit() else int(b)

            # Sanity-check year bounds and order to avoid pathological matches.
            if 1950 <= y1 <= y2 <= 2100:
                months += max(0, (y2 - y1)) * 12

        # Light bullet-count heuristic: each bullet contributes ~0.5 months.
        # This helps when explicit dates are missing but dense responsibilities suggest tenure.
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", text))
        months += int(bullets * 0.5)

        return months / 12.0 if months else 0.0

    def _score_education(self, f: Dict[str, Any]) -> float:
        """
        Compute the education component score on a 0–100 scale.

        Signal sources:
          - Degree text: maps common levels (PhD/Master/Bachelor/HS) to a base.
          - STEM keywords (self.stem_terms) add a small bonus.
          - Presence of college text and *.edu email each add a small bonus.

        Args:
            f: Feature dict with keys such as 'degree_text', 'college_text', 'email'.

        Returns:
            float: Education score bounded to [0, 100].
        """
        deg = (f.get("degree_text") or "").lower()
        college = (f.get("college_text") or "").strip()
        email = (f.get("email") or "")

        base = 20.0
        # Degree-level tiers (pick the highest match).
        if any(k in deg for k in ("phd", "doctor", "md", "jd", "dphil")):
            base += 55
        elif any(k in deg for k in ("master", "msc", "m.s", "m.eng", "ms ")):
            base += 45
        elif any(k in deg for k in ("bachelor", "b.sc", "beng", "b.s", "ba ")):
            base += 35
        elif any(k in deg for k in ("high school", "secondary", "undergrad")):
            base += 15
        else:
            base += 10  # Unknown or unparsed degree → conservative base.

        # STEM keyword bonus.
        if any(t in deg for t in self.stem_terms):
            base += 7

        # Light bonuses for any college/university text and academic email TLD.
        if college:
            base += 5
        if isinstance(email, str) and email.endswith(".edu"):
            base += 5

        return max(0.0, min(100.0, base))

    def _score_experience(self, f: Dict[str, Any]) -> float:
        """
        Compute the experience component score on a 0–100 scale.

        Steps:
          - Apply a sigmoid over total years to get a smooth curve (centered ~2.5 years).
          - Re-scale and shift to keep mid-career candidates away from extremes.
          - Add small bonuses for academic/early-career signals (intern/lecturer/postdoc/RA).
          - Add tiny increments for each tooling keyword found in the experience text.

        Args:
            f: Feature dict with keys like 'total_experience_years' and 'experience_text'.

        Returns:
            float: Experience score bounded to [0, 100].
        """
        years = f.get("total_experience_years") or 0.0

        # Smooth sigmoid centered near 2.5 years; then shifted/scaled to relax extremes.
        s = 100.0 * _sigmoid(0.55 * (years - 2.5))
        s = 20 + 0.8 * (s - 50)  # Re-center + compress
        s = max(0.0, min(100.0, s))

        # Keyword-driven small bonuses.
        text = (f.get("experience_text") or "").lower()
        for kw, bonus in [("intern", 6), ("lecturer", 6), ("postdoc", 6), ("research assistant", 4)]:
            if kw in text:
                s += bonus

        # Each tooling/process keyword adds a tiny bump; capped afterward.
        for kw in self.tool_keywords:
            if kw in text:
                s += 1.5

        return max(0.0, min(100.0, s))

    def _select_strengths_weaknesses(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, list]:
        """
        Select exactly 3 strengths and exactly 3 weaknesses from curated pools (25 each),
        based on resume signals. Priority is defined by rule order (deterministic).
        """
        import re
        txt = (f.get("aggregate_text") or "").lower()
        exp_txt = (f.get("experience_text") or "").lower()
        skills = {s.lower() for s in (f.get("skills") or [])}
        years = float(f.get("total_experience_years") or 0.0)
        email = f.get("email") or ""
        bullets = len(re.findall(r"(^|\n)\s*[\-\u2022\u25CF\u25A0•]", f.get("aggregate_text") or ""))

        # Tokenize if helper exists; otherwise a simple fallback tokenizer
        try:
            tokens = set(_tokenize(txt))  # your existing helper
        except Exception:
            tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9\+\-#\.]*", txt))

        def has_any(keys, haystack):
            if isinstance(haystack, set):
                return any(k in haystack for k in keys)
            return any(k in txt for k in keys)

        def contains(*subs):
            return any(s in txt for s in subs)

        def count_metrics():
            # Numbers, percentages, currency — signals for quantified impact
            return len(re.findall(r"\b\d+(?:\.\d+)?\s*%|\$\s*\d|\b\d{2,}\b", txt))

        # ----------------------------
        # Strength candidates (25)
        # ----------------------------
        strengths_candidates = []

        # 1
        if has_any({"python", "java", "c++", "c#", "javascript", "sql"}, skills | tokens):
            strengths_candidates.append("Solid programming foundation is evident.")
        # 2
        if has_any({"statistics", "analytics", "modeling", "excel", "data analysis"}, skills | tokens):
            strengths_candidates.append("Strong analytical/statistical skills are demonstrated.")
        # 3
        if has_any({"solidworks", "cad", "mechanical", "electrical"}, skills | tokens):
            strengths_candidates.append("Hands-on CAD/engineering design experience.")
        # 4
        if has_any({"biology", "chemistry", "physics", "geochemistry", "petrology"}, skills | tokens):
            strengths_candidates.append("Cross-disciplinary scientific background.")
        # 5
        if contains("vice-president", "vice president", "president", "led", "leader", "organized", "coordinated"):
            strengths_candidates.append("Clear leadership/ownership experience.")
        # 6
        if contains("teaching", "mentoring", "tutoring", "lecturer"):
            strengths_candidates.append("Experience mentoring/teaching others.")
        # 7
        if contains("published", "peer-reviewed", "in press", "conference abstract"):
            strengths_candidates.append("Publication/peer-review track record.")
        # 8
        if contains("field sampling", "expedition", "submersible", "rov", "fluid sampling"):
            strengths_candidates.append("Field/expedition experience adds real-world depth.")
        # 9
        if contains("presented", "conference", "symposium", "workshop"):
            strengths_candidates.append("Public speaking/presentation exposure.")
        # 10
        if contains("github", "gitlab", "bitbucket"):
            strengths_candidates.append("Evidence of code sharing or open-source involvement.")
        # 11
        if any(kw in txt for kw in getattr(self, "tool_keywords", [])):
            strengths_candidates.append("Good familiarity with process/tooling keywords.")
        # 12
        if comps.education >= 70:
            strengths_candidates.append("Strong academic credentials.")
        # 13
        if years >= 3:
            strengths_candidates.append("Meaningful professional experience (3+ years).")
        # 14
        if len(skills) >= 12:
            strengths_candidates.append("Broad skill coverage across multiple areas.")
        # 15
        if comps.ai_signal >= 70:
            strengths_candidates.append("Profile closely aligns with target role archetypes.")
        # 16
        if contains("spanish", "bilingual", "multilingual", "international"):
            strengths_candidates.append("International/cross-cultural communication capability.")
        # 17
        if contains("certified", "certification", "aws certified", "azure", "gcp", "pmp", "scrum"):
            strengths_candidates.append("Relevant professional certifications.")
        # 18
        if contains("created", "implemented", "built", "designed", "launched", "initiated"):
            strengths_candidates.append("Shows initiative and end-to-end project ownership.")
        # 19
        if contains("shipped", "deployed", "released", "production"):
            strengths_candidates.append("Proven track record of shipping to production.")
        # 20
        if contains("data", "statistic", "model", "hypothesis", "experiment"):
            strengths_candidates.append("Data-driven approach to problem solving.")
        # 21
        if contains("laboratory", "methods", "protocol", "standard operating"):
            strengths_candidates.append("Laboratory methods and protocol experience.")
        # 22
        if contains("iso", "rohs", "compliance", "regulatory", "quality"):
            strengths_candidates.append("Awareness of standards, quality, or compliance.")
        # 23
        if contains("docker", "kubernetes", "ci", "cd", "pipeline", "terraform"):
            strengths_candidates.append("DevOps/automation exposure.")
        # 24
        if bullets >= 10:
            strengths_candidates.append("Well-structured resume with clear bulleting.")
        # 25
        if comps.skills >= 70:
            strengths_candidates.append("Skills mix indicates both breadth and depth.")

        # ----------------------------
        # Weakness candidates (25)
        # ----------------------------
        weaknesses_candidates = []

        # 1
        if years < 1.0:
            weaknesses_candidates.append("Limited professional experience (<1 year).")
        # 2
        if len(skills) < 5:
            weaknesses_candidates.append("Narrow skills list—consider broadening toolset.")
        # 3
        if count_metrics() == 0:
            weaknesses_candidates.append("Few quantified outcomes—add metrics (%, $, time saved).")
        # 4
        if not contains("github", "portfolio", "personal website", "linkedin"):
            weaknesses_candidates.append("No work links (GitHub/portfolio/LinkedIn) included.")
        # 5
        if not (f.get("degree_text") or "").strip():
            weaknesses_candidates.append("Education details are minimal or unclear.")
        # 6
        if not contains("led", "leader", "leadership", "organized", "coordinated", "managed"):
            weaknesses_candidates.append("No explicit leadership examples.")
        # 7
        if not contains("team", "collaborat", "cross-functional", "stakeholder"):
            weaknesses_candidates.append("Teamwork/collaboration not highlighted.")
        # 8
        if not contains("shipped", "deployed", "released", "production", "launched"):
            weaknesses_candidates.append("Production delivery not emphasized.")
        # 9
        if not contains("test", "qa", "pytest", "junit", "verification", "validation"):
            weaknesses_candidates.append("Testing/QA practices not visible.")
        # 10
        if not contains("docker", "kubernetes", "ci", "cd", "pipeline", "terraform"):
            weaknesses_candidates.append("DevOps/CI-CD exposure appears limited.")
        # 11
        if not has_any({"statistics", "analytics", "modeling", "excel", "data analysis"}, skills | tokens):
            weaknesses_candidates.append("Analytical/statistical skills not clearly evidenced.")
        # 12
        if len(txt) < 800:
            weaknesses_candidates.append("Resume may be too brief—add scope, context, and impact.")
        # 13
        if len(txt) > 8000:
            weaknesses_candidates.append("Resume may be overly long—tighten to key wins and scope.")
        # 14
        if not skills:
            weaknesses_candidates.append("Skills section is sparse or missing.")
        # 15
        if not email and not f.get("phone"):
            weaknesses_candidates.append("Contact info (email/phone) is missing.")
        # 16
        if sum(1 for kw in getattr(self, "tool_keywords", []) if kw in txt) < 3:
            weaknesses_candidates.append("Process/tooling keywords are light—add relevant methods/tools.")
        # 17
        if comps.ai_signal < 35:
            weaknesses_candidates.append("Overall role alignment seems weak—tailor to the target role.")
        # 18
        if comps.education < 40:
            weaknesses_candidates.append("Education signal is low—clarify degree/major or coursework.")
        # 19
        if not contains("mentor", "mentoring", "tutor", "coached", "supervised"):
            weaknesses_candidates.append("Mentoring/coaching not demonstrated.")
        # 20
        if not contains("publication", "published", "peer-review", "conference"):
            weaknesses_candidates.append("Publications or knowledge sharing are not highlighted.")
        # 21
        if not contains("healthcare", "finance", "retail", "manufacturing", "energy", "telecom", "domain", "industry"):
            weaknesses_candidates.append("Domain focus is unclear—specify industries/projects.")
        # 22
        if "responsible for" in txt:
            weaknesses_candidates.append("Language is passive—rephrase with strong action verbs.")
        # 23
        if bullets < 3:
            weaknesses_candidates.append("Use bullet points to improve scanability.")
        # 24
        if not contains("roi", "revenue", "cost", "throughput", "latency", "accuracy", "precision", "recall", "nps"):
            weaknesses_candidates.append("Business or quality impact metrics are missing.")
        # 25
        if not contains("roadmap", "scope", "estimate", "prioritize", "stakeholder", "requirements"):
            weaknesses_candidates.append("Product/requirements ownership not highlighted.")

        # ----------------------------
        # Post-processing: dedup, cap to exactly 3, top up from fallbacks
        # ----------------------------
        def dedup(seq):
            seen = set();
            out = []
            for x in seq:
                if x not in seen:
                    out.append(x);
                    seen.add(x)
            return out

        strengths = dedup(strengths_candidates)
        weaknesses = dedup(weaknesses_candidates)

        # Priority is rule order → take first 3
        strengths = strengths[:3]
        weaknesses = weaknesses[:3]

        # Fallback catalogs to ensure exactly 3 of each
        fallback_strengths = [
            "Evidence of continuous learning and upskilling.",
            "Clear problem-solving orientation is visible.",
            "Good mix of theory and practical application.",
            "Communication artifacts (talks/docs) strengthen the profile.",
            "Ability to work across disciplines and contexts."
        ]
        fallback_weaknesses = [
            "Tailor the summary to the specific role and company.",
            "Add more concrete outcomes for major projects.",
            "Clarify your role and scope within each project.",
            "Include the most relevant tools/technologies for the target role.",
            "Tighten wording and remove repetition."
        ]

        # Top up to exactly 3 (no duplicates)
        for pool, target in ((fallback_strengths, strengths), (fallback_weaknesses, weaknesses)):
            i = 0
            while len(target) < 3 and i < len(pool):
                if pool[i] not in target:
                    target.append(pool[i])
                i += 1

        return {"strengths": strengths, "weaknesses": weaknesses}

    def _score_skills(self, f: Dict[str, Any]) -> float:
        """
        Compute the skills component score on a 0–100 scale.

        Components:
          - Breadth: grows with the number of unique skills (diminishing returns).
          - Coverage: credit for touching multiple predefined skill buckets.
          - Depth: bonus if any 'strong' signals appear (e.g., Python/Java/SolidWorks/Research).

        Args:
            f: Feature dict with 'skills' (list[str]) at minimum.

        Returns:
            float: Skills score bounded to [0, 100].
        """
        # Normalize skills → lowercase, deduplicate.
        skills = [s.lower() for s in (f.get("skills") or [])]
        unique = sorted(set(skills))
        n = len(unique)

        # Breadth: 100 * (1 - e^{-n/10}) → fast rise, then plateau.
        breadth = 100.0 * (1 - math.exp(-n / 10.0))

        # Buckets: recognize presence across categories for a 'coverage' component.
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

        # Depth: simple presence check of 'strong' signals.
        strong = {"python", "java", "solidworks", "analytics", "biology", "chemistry", "physics", "modeling",
                  "research"}
        depth = 60.0 if any(s in strong for s in unique) else 30.0

        # Weighted blend; tune weights to taste.
        return max(0.0, min(100.0, 0.5 * breadth + 0.3 * coverage + 0.2 * depth))

    def _score_ai_signal(self, f: Dict[str, Any]) -> float:
        """
        Compute the 'AI signal' component score on a 0–100 scale using embedding similarity.

        Method:
          - Ensure an embedding model is loaded (SentenceTransformers).
          - Encode the resume's aggregate text and each archetype description.
          - Cosine similarity → scale from [-1, 1] to [0, 100].
          - Aggregate by a weighted mean of the top-K matches and the overall mean.
          - Add small bonuses for leadership/academic role indicators.

        Args:
            f: Feature dict (expects 'aggregate_text').

        Returns:
            float: AI-signal score bounded to [0, 100].
        """
        self._ensure_model()

        text = f.get("aggregate_text") or ""
        if not text.strip():
            return 0.0

        # Encode resume and archetype descriptions (normalized embeddings).
        resume = self._model.encode([text], normalize_embeddings=True)
        names = list(self.archetypes.keys())
        descs = [self.archetypes[k] for k in names]
        arch = self._model.encode(descs, normalize_embeddings=True)

        # Cosine similarities → [0, 100] scale.
        sims = (resume @ arch.T).flatten().astype(np.float64)
        sims = np.clip((sims + 1.0) / 2.0, 0.0, 1.0) * 100.0

        # Weighted aggregation of top-K and overall mean.
        topk = min(4, sims.size)
        ai = 0.7 * float(np.mean(np.sort(sims)[-topk:])) + 0.3 * float(np.mean(sims))

        # Additional small role-based boosts.
        txt = text.lower()
        if any(k in txt for k in ("vice-president", "vice president", "president", "lecturer", "postdoc")):
            ai += 3.0
        if "intern" in txt or "research assistant" in txt:
            ai += 3.0

        return max(0.0, min(100.0, ai))

    def _explain(self, f: Dict[str, Any], comps: ComponentScores) -> Dict[str, Any]:
        txt = (f.get("aggregate_text") or "").lower()
        highlights = []
        if any(k in txt for k in ("intern", "lecturer", "postdoc", "research assistant")):
            highlights.append("Internship/lecturing/research signals present.")
        if any(k in txt for k in ("vice-president", "vice president", "leader", "led")):
            highlights.append("Leadership signals detected.")
        if any(k in txt for k in self.tool_keywords):
            highlights.append("Process/tooling keywords detected.")

        # Build strengths & weaknesses from rules
        notes = self._select_strengths_weaknesses(f, comps)

        # Top archetypes (unchanged)
        top_arch = []
        try:
            self._ensure_model()
            resume = self._model.encode([f.get("aggregate_text") or ""], normalize_embeddings=True)
            names = list(self.archetypes.keys())
            descs = [self.archetypes[k] for k in names]
            arch = self._model.encode(descs, normalize_embeddings=True)
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
            # Replaces the previous generic notes with strengths/weaknesses
            "notes": notes
        }


# module-level cache (thread-safe enough for typical read-mostly usage)
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



from typing import Optional, Tuple, Dict, Any
import json

def rate_dict(
    cv_data: Dict[str, Any],
) -> str:
    """
    Take a CV payload as a Python dict and return the rating result
    as a JSON string (same structure the CLI prints).

    Raises:
      TypeError if cv_data is not a dict.
    """
    if not isinstance(cv_data, dict):
        raise TypeError("cv_data must be a dict")

    result = get_shared_rater().rate(cv_data)
    return json.dumps(result, ensure_ascii=False)
