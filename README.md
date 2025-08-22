# CV Rater (FastAPI · Heuristic, Heroku-friendly)

A tiny web service that parses resumes (PDF/DOCX via **pyresparser**) and returns a **0–100** score with component breakdown and short explanations.  
Designed to run on **Heroku 512 MB** dynos without large ML dependencies (no Torch/Transformers).

- Parsing: `pyresparser` (spaCy 2 + NLTK under the hood)  
- Scoring: **heuristic rules** + large, editable **lexicon files** in `data/`  
- API: **FastAPI** (`/health`, `/api/resume/score`)  
- Zero heavyweight downloads at runtime (uses **nltk.txt** + prebuilt spaCy wheel)

---

## Quickstart (Local)

```bash
# Python 3.9.x (required because spaCy 2.x)
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

# (Optional) local NLTK cache
python - <<'PY'
import nltk, os
os.environ["NLTK_DATA"] = os.path.abspath("nltk_data")
for p in ["punkt","punkt_tab","stopwords","wordnet","omw-1.4","averaged_perceptron_tagger","averaged_perceptron_tagger_eng","maxent_ne_chunker","words"]:
    nltk.download(p, download_dir=os.environ["NLTK_DATA"])
PY

# Run
uvicorn app:app --reload --port 9000
```

Open: http://127.0.0.1:9000/health

---

## Quickstart (Heroku)

1) **Use `.python-version`** (Heroku recommends this; don’t use `runtime.txt`):
```
3.9
```

2) **Ensure `nltk.txt`** exists (at repo root) with:
```
punkt
punkt_tab
stopwords
wordnet
omw-1.4
averaged_perceptron_tagger
averaged_perceptron_tagger_eng
maxent_ne_chunker
words
```

3) **Procfile** (already present):
```
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

4) **Config vars** (Heroku Dashboard → Settings → Config Vars)

You usually don’t need any, but these are supported:

- `NLTK_DATA` (optional)  
  Heroku’s buildpack puts NLTK under `/app/.heroku/python/nltk_data`.  
  If you set it, use that exact value.

- `SPACY_MODEL` (optional) – default `en_core_web_sm`  
  The wheel is installed from `requirements.txt`, no runtime download.

- `AUTO_DOWNLOAD_NLTK, AUTO_DOWNLOAD_SPACY` (optional) – default `false`  
  On Heroku keep them **false**; we rely on `nltk.txt` + pinned spaCy.

5) Deploy via GitHub integration or `git push heroku main`.

---

## Endpoints

### Health
```
GET /health
```
Returns availability of NLTK resources + spaCy model.

### Score a resume
```
POST /api/resume/score
Content-Type: multipart/form-data
Form field: file=@<resume.pdf|docx>
```

**Example:**
```bash
curl -s -X POST "http://127.0.0.1:9000/api/resume/score" \
  -F "file=@/path/to/resume.pdf"
```

**Response (example):**
```json
{
  "overall_score": 78.6,
  "components": {
    "education": 72.5,
    "experience": 81.2,
    "skills": 74.0,
    "ai_signal": 79.3
  },
  "weights": {
    "education": 0.25,
    "experience": 0.35,
    "skills": 0.20,
    "ai_signal": 0.20
  },
  "explanation": {
    "highlights": [...],
    "top_archetype_matches": [
      {"name":"Data Analyst","match_pct":84.1},
      {"name":"Mechanical Engineer","match_pct":79.8},
      {"name":"Research Scientist","match_pct":76.3}
    ],
    "component_details": {...},
    "notes": {
      "strengths": ["...", "...", "..."],
      "weaknesses": ["...", "...", "..."]
    }
  }
}
```

---

## How scoring works (heuristics)

All logic lives in **`cv_rater.py`** and uses only lightweight deps.

- **Education (0–100)**  
  Degree level detection (PhD/MSc/BSc/HS), **STEM keywords** bonus, presence of university text, `.edu` email, honors, GPA signals, accreditations.

- **Experience (0–100)**  
  Heuristic extraction of **year ranges** (e.g., “2018–2022”) and bullet density → months → years.  
  Bonuses for leadership/teaching/research roles, and for **tooling keywords** seen in experience text.

- **Skills (0–100)**  
  Breadth (unique skills count, diminishing returns), coverage across **skill buckets**, and “depth” triggers (strong signals: e.g., Python, SolidWorks, Modeling, etc.). The list is **editable** in `data/`.

- **AI Signal (0–100, heuristic)**  
  No embeddings. Matches resume text to **archetype descriptions** in `data/archetypes.txt` using token/phrase overlap and weighting, then aggregates top-K matches.

- **Explain**  
  The service returns a concise natural-language explanation with highlights, component detail, and **3× strengths / 3× weaknesses** chosen by ordered rules.

You can tune everything by editing the text files under `data/`.

---

## Project layout

```
.
├─ app.py                 # FastAPI app (Heroku-friendly)
├─ cv_rater.py            # Heuristic scoring engine (+ explain)
├─ data/
│  ├─ skills.txt
│  ├─ tooling_keywords.txt
│  ├─ stem_terms.txt
│  ├─ archetypes.txt
│  ├─ industries.txt              # (optional) if you added it
│  ├─ certifications.txt          # (optional)
│  ├─ leadership_terms.txt        # (optional)
│  ├─ soft_skills.txt             # (optional)
│  ├─ degree_aliases.txt          # (optional)
│  ├─ honors_keywords.txt         # (optional)
│  ├─ gpa_keywords.txt            # (optional)
│  ├─ universities_sample.txt     # (optional)
│  └─ ... (any other lexicons you created)
├─ nltk.txt               # Heroku buildpack preloads these corpora
├─ requirements.txt       # Lightweight; no torch/transformers
├─ Procfile               # web process (uvicorn)
├─ .python-version        # "3.9"
└─ README.md
```

> **Note:** If you committed a local `nltk_data/` folder, that also works locally. On Heroku, prefer `nltk.txt` so corpora are cached into the slug during build.

---

## Configuration

- **Weights**  
  In `cv_rater.py` constructor you can adjust:
  ```python
  weights=(0.25, 0.35, 0.20, 0.20)  # (education, experience, skills, ai_signal)
  ```

- **Skill buckets / strong signals**  
  Also in `cv_rater.py` → `_score_skills`, customize categories to your domains.

- **Archetypes**  
  Edit `data/archetypes.txt`:
  ```
  Data Analyst: An analytical role focused on SQL, Python, visualization and statistics for BI/insights...
  Mechanical Engineer: Hands-on design and manufacturing with CAD, FEA, materials, tolerances...
  ...
  ```

---

## Troubleshooting

- **H81 “Blank app”**  
  Usually means no web dyno serving HTTP. Ensure:
  - `Procfile` exists with `web:` entry  
  - You deployed the right branch  
  - `uvicorn app:app` matches your filename/module

- **NLTK “wordnet missing” at runtime**  
  - Keep `nltk.txt` in repo root (Heroku will bake corpora into the slug).  
  - Do **not** set `NLTK_DATA` to a path that doesn’t exist. If you set it on Heroku, use `/app/.heroku/python/nltk_data`.  
  - `GET /health` shows exactly what’s missing.

- **Python version conflicts**  
  spaCy 2.x requires ≤ Python 3.9. Use `.python-version` with `3.9`.

- **Slug too big / huge downloads**  
  Avoid Torch/Transformers/SentenceTransformers; they pull CUDA wheels or large models. This project intentionally excludes them.

---

## Security & PII

Resumes may contain PII. By default this service does not store uploads; files are processed then removed. If you persist anything, ensure you meet your compliance/SOC/GPDR obligations.

---

## License

This project uses open-source libraries. Check each dependency’s license before commercial use.

---

## Credits

- Parsing: [pyresparser] (spaCy 2 + NLTK)  
- Web: FastAPI + Uvicorn  
- Heuristics & lexicons: this repo’s `data/` files (editable)

---

### Benchmarks & tuning

The heuristics are intentionally transparent. If you want different behavior per job family, add richer lexicons (skills, tools, certifications) and extend `archetypes.txt`. The `explain` section helps you debug which rules triggered and why.

Happy shipping!
