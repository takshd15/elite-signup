# _ **XP and Challenges Service**_

## Auth & Security

- **Auth**: `Authorization: Bearer <JWT>` issued by the **Java** service.  
  Python uses a verify-only JWT service to decode & validate (`sub` = user id).
- **Optional gate**: middleware may enforce that the user’s **latest verification code** is *used, unexpired (≤ 15min), and from same IP*. If not satisfied, protected routes return **403**.
- **Privacy**: verification never stores artifacts (no text, link content, or images). We store only:
  - `submission_sha256` (hash of proof),
  - `verifier` / `verifier_version`,
  - `proof_signature` (HMAC attestation),
  - status and timestamps.

---

# CV Rater (FastAPI · Heuristic, Heroku-friendly)

A tiny web service that parses resumes (PDF/DOCX via **pyresparser**) and returns a **0–100** score with component breakdown and short explanations.  
Designed to run on **Heroku 512 MB** dynos without large ML dependencies (no Torch/Transformers).

- Parsing: `pyresparser` (spaCy 2 + NLTK under the hood)  
- Scoring: **heuristic rules** + large, editable **lexicon files** in `data/`  
- API: **FastAPI** (`v1/parser/health`, `v1/parser/resume/score`)  
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
GET /v1/parser/health
```
Returns availability of NLTK resources + spaCy model.

### Score a resume
```
POST /v1/parser/resume/score
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
  - `GET v1/parser/health` shows exactly what’s missing.

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

# Challenges Service (EliteScore)

The **Challenges** module powers daily/monthly challenge assignment, verification, replacement, and XP awards. It’s designed for **privacy-preserving verification** (no proof storage), simple pack generation, and a clean student-oriented workflow.

> Base path used below: **`/v1/challenges`** (if you mount the router with `prefix="/v1/challenges"`).  
> If you mount differently, adjust the examples accordingly.

---

## Table of contents

- [Auth & Security](#auth--security)
- [Concepts](#concepts)
- [Data Model (overview)](#data-model-overview)
- [Pack Generation Rules](#pack-generation-rules)
- [Verification Types](#verification-types)
- [Endpoints](#endpoints)
  - [GET `/get_daily`](#get-get_daily)
  - [GET `/get_monthly`](#get-get_monthly)
  - [POST `/verify/text/{uc_id}`](#post-verifytextuc_id)
  - [POST `/verify/link/{uc_id}`](#post-verifylinkuc_id)
  - [POST `/verify/photo/{uc_id}`](#post-verifyphotouc_id)
  - [POST `/replace/{uc_id}`](#post-replaceuc_id)
  - [POST `/refresh/daily`](#post-refreshdaily)
  - [POST `/refresh/monthly`](#post-refreshmonthly)
- [Responses & Error Codes](#responses--error-codes)
- [Environment Variables](#environment-variables)
- [Notes & Best Practices](#notes--best-practices)

---

## Concepts

- **Challenge**: a task a user can complete. Has `cadence` (**daily** or **monthly**), `difficulty` (easy/medium/hard), XP, and tags/goals/activities.
- **UserChallenge (UC)**: the *assignment* of a Challenge to a specific user for a specific period (day or month).
- **Pack**: a **DailyPack** (for a date) or **MonthlyPack** (for a month) that groups a user’s assigned `UserChallenge`s.

---

## Data Model (overview)

> (SQLAlchemy 2.x models; trimmed for docs.)

- **Challenge**: `id`, `title`, `description`, `goals[]`, `activities[]`, `tags[]`, `cadence`, `difficulty`, `est_minutes`, `base_xp`, `active`.
- **UserChallenge**: `id`, `user_id`, `challenge_id`, `period_start`, `period_end`, `status`, `progress_pct`, `personalized_xp`, `due_at`, `verified_at`, `submission_sha256`, `verifier`, `proof_signature`.
- **DailyPack / DailyPackItem**: one per user per day; items link to `UserChallenge`s.
- **MonthlyPack / MonthlyPackItem**: one per user per month; items link to `UserChallenge`s.
- **XpLedger**: XP journal (`delta`, `reason`, `ref_uc_id`, `created_at`).

---

## Pack Generation Rules

- The **first** call to `GET /get_daily` or `GET /get_monthly` for a period **creates** the pack if missing.
- Packs are **topped up** to the configured size (no removal). Existing items remain (even if `in_progress`, `failed`, or `skipped`).
- Selection excludes:
  - any challenge the user has **ever verified**,
  - any challenge **already in the current pack**.
- Selection is random for beta (`ORDER BY random()`).
- **Replace** swaps a single unverified UC for a new one of the **same cadence**, also excluding verified/history/current-pack.

---

## Verification Types

- **Text** (`text-log`): user submits a written reflection/journal/checklist (minimum length check). We hash the text.
- **Link** (`link-check`): user submits a URL. We HEAD/GET for 2xx/3xx and hash the URL string (not page content).
- **Photo** (`photo-proof`): user uploads an image/screenshot. We hash the bytes; optional EXIF timestamp read.

On success, the UC is marked `verified`, XP is added to `XpLedger`, and an attestation signature is stored.

---

## Endpoints

### GET `/get_daily`

Return (and if needed create/top-up) **today’s** daily pack for the caller.

**Headers**

Authorization: Bearer <JWT>


**Response** `200 OK` — `UCOut[]`
```json
[
  {
    "uc_id": 123,
    "challenge_id": 45,
    "title": "20-minute focused study",
    "description": "…",
    "goals": ["Academics"],
    "activities": ["Deep Work"],
    "tags": ["focus","pomodoro"],
    "cadence": "daily",
    "difficulty": "easy",
    "est_minutes": 20,
    "base_xp": 50,
    "status": "assigned",
    "progress_pct": 0,
    "due_at": "2025-08-24T23:59:59Z"
  }
]
```

### GET `/get_monthly`

Return (and if needed create/top-up) the current month’s pack.

**Headers**

Authorization: **Bearer <JWT>**


**Response** `200 OK` — `UCOut[]` (same shape as daily)

### POST `/verify/text/{uc_id}`

Verify a UC by text (journal/reflection).

**Headers**

Authorization: **Bearer** <JWT>
Content-Type: application/json


**Body**

```{ "text": "Three takeaways from today's practice: … (>= 50 chars)" }```


**Responses**

```200 OK → { "uc_id": 123, "verified": true }

400 Bad Request → too short, etc.

404 Not Found → UC doesn’t belong to caller.
```

### POST ```/verify/link/{uc_id}```


### Verify a UC by URL (deployment, repo, slides, cert verification page, sheet, etc).

**Headers**

Authorization: **Bearer** <JWT>

Content-Type: application/json


**Body**

```{ "url": "https://example.com/my-demo" }```


**Responses**

```200 OK → { "uc_id": 123, "verified": true }

400 Bad Request → URL not reachable (non 2xx/3xx).

404 Not Found → UC doesn’t belong to caller.
```

### POST ```/verify/photo/{uc_id}```

Verify a UC by photo/screenshot.

**Headers**

Authorization: **Bearer** <JWT>

Content-Type: multipart/form-data


**Form fields**

```file → image file bytes (JPG/PNG/etc.)```

**Responses**

```200 OK → { "uc_id": 123, "verified": true }

400 Bad Request → empty file.

404 Not Found → UC doesn’t belong to caller.
```

### POST ```/replace/{uc_id}```

**Replace an unverified UC with a new random one of the same cadence.**

Marks the old UC as skipped.
Picks a new candidate (never verified by this user, not already in pack), creates a new UC for the same period, and keeps the same pack position.

**Headers**

Authorization: **Bearer** <JWT>


**Response**
``` 200 OK — UCOut for the new assignment.
Errors

400 if the old UC is already verified.

404 if the UC doesn’t belong to the caller.

409 if no replacement candidates are available.
```

### POST ```/refresh/daily```

Top-up today’s daily pack to the configured size.
(Does not clear existing items.)

**Headers**

Authorization: **Bearer** <JWT>


**Response**

```{ "ok": true, "pack_id": 77, "count": 5 }```

### POST ```/refresh/monthly```

Top-up this month’s monthly pack to the configured size.
(Does not clear existing items.)

**Headers**

Authorization: **Bearer** <JWT>


**Response**

```{ "ok": true, "pack_id": 88, "count": 6 }```

**Responses & Error Codes**

```200 — Success (payload varies).

400 — Bad request (e.g., too short text / unreachable link / empty file / replace verified).

401 — Missing/invalid JWT.

403 — Latest verification code requirement not met (if middleware is enabled).

404 — UC not found for the caller.

409 — No replacement candidates available.
```

All error responses include a small JSON object with error or detail.

### Environment Variables

```DAILY_PACK_SIZE — default 5.

MONTHLY_PACK_SIZE — default 6.

JWT_SIGNING_KEY_BASE64 — must match Java’s Base64 secret.

DB vars (see db.py):

DATABASE_URL or (DB_URL, DB_USER, DB_PASS).
```

(Windows) If you use psycopg3 without binary wheels, ensure libpq.dll is on PATH, or install psycopg[binary] or switch to psycopg2.

### Notes & Best Practices

**Idempotent verify:** re-verifying an already verified UC is a no-op (no duplicate XP).

**No proof retention:** only SHA-256 digests + metadata are stored. Clients can delete artifacts after success.

**Packs vs. refresh:** get_* will create/top-up if needed; refresh/* explicitly top-ups. Neither removes items. For a hard rebuild, add a ?rebuild=true flag and clear items first.

**Performance:** ORDER BY random() is fine for beta; consider weighted sampling or precomputed pools for large datasets.

**Verification sub-types:** you can extend link-check into kaggle-link, figma-link, cert-verify-link, etc., with specific validators.

Curl examples
# Get daily pack
curl -H "Authorization: Bearer <JWT>" \
  https://api.example.com/v1/challenges/get_daily

# Verify by text
curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"text":"Today I completed … (>= 50 chars)"}' \
  https://api.example.com/v1/challenges/verify/text/123

# Verify by link
curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"url":"https://myapp.example.com/health"}' \
  https://api.example.com/v1/challenges/verify/link/123

# Verify by photo
curl -X POST -H "Authorization: Bearer <JWT>" -F "file=@/path/to/proof.jpg" \
  https://api.example.com/v1/challenges/verify/photo/123

# Replace a challenge
curl -X POST -H "Authorization: Bearer <JWT>" \
  https://api.example.com/v1/challenges/replace/123

# Refresh monthly pack
curl -X POST -H "Authorization: Bearer <JWT>" \
  https://api.example.com/v1/challenges/refresh/monthly

