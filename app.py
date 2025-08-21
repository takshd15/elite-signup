import os
import tempfile
from typing import Dict, List

# Load .env (works locally and on Heroku if committed)
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

load_dotenv(find_dotenv(), override=False)

# 3rd-party
import nltk
from nltk.data import find
from spacy.util import get_package_path
from pyresparser import ResumeParser
from cv_rater import rate_dict

# ---------- Config ----------
NLTK_DATA_DIR = os.getenv("NLTK_DATA", os.path.join(os.getcwd(), "nltk_data"))
os.environ["NLTK_DATA"] = NLTK_DATA_DIR  # ensure nltk sees it

NLTK_RESOURCES: Dict[str, str] = {
    "punkt": "tokenizers/punkt",
    "stopwords": "corpora/stopwords",
    "wordnet": "corpora/wordnet",
    "averaged_perceptron_tagger": "taggers/averaged_perceptron_tagger",
    "maxent_ne_chunker": "chunkers/maxent_ne_chunker",
    "words": "corpora/words",
}
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")

# searches for all nltk needed packages and returns boolean
def nltk_status(resources: Dict[str, str]) -> Dict[str, Dict[str, str]]:
    status = {}
    for name, path in resources.items():
        try:
            find(path)
            status[name] = {"available": True, "path": path}
        except LookupError as e:
            status[name] = {"available": False, "error": str(e)}
    return status

# searches for the missing resources and tries to download them
def ensure_nltk(resources: Dict[str, str], auto_download: bool = False) -> List[str]:
    missing = []
    for name, path in resources.items():
        try:
            find(path)
        except LookupError:
            missing.append(name)
    if auto_download and missing:
        os.makedirs(NLTK_DATA_DIR, exist_ok=True)
        for name in list(missing):
            try:
                nltk.download(name, download_dir=NLTK_DATA_DIR, quiet=True)
                find(resources[name])  # verify
                missing.remove(name)
            except Exception:
                pass
    return missing

# searches for the spacy language model and return boolean
def spacy_status(model_name: str) -> Dict[str, str]:
    try:
        get_package_path(model_name)
        return {"available": True, "model": model_name}
    except Exception as e:
        return {"available": False, "model": model_name, "error": str(e)}

# searches for the missing resources and tries to download them
def ensure_spacy(model_name: str, auto_download: bool = False) -> bool:
    ok = spacy_status(model_name)["available"]
    if ok:
        return True
    if auto_download:
        try:
            import spacy.cli
            spacy.cli.download(model_name)
            return spacy_status(model_name)["available"]
        except Exception:
            return False
    return False

app = FastAPI(title="Local Resume Parser (pyresparser)")

@app.on_event("startup")
def _startup():
    auto_nltk = os.getenv("AUTO_DOWNLOAD_NLTK", "false").lower() in {"1","true","yes"}
    auto_spacy = os.getenv("AUTO_DOWNLOAD_SPACY", "false").lower() in {"1","true","yes"}

    missing_nltk = ensure_nltk(NLTK_RESOURCES, auto_download=auto_nltk)
    if missing_nltk:
        print(f"[startup] Missing NLTK resources: {missing_nltk}")
    else:
        print("[startup] NLTK resources available")

    sp_ok = ensure_spacy(SPACY_MODEL, auto_download=auto_spacy)
    print(f"[startup] spaCy model '{SPACY_MODEL}' available: {sp_ok}")

# returns the existence of all the needed external models
@app.get("/health")
def health():
    nstatus = nltk_status(NLTK_RESOURCES)
    missing = [k for k, v in nstatus.items() if not v["available"]]
    sstatus = spacy_status(SPACY_MODEL)
    ok = (len(missing) == 0) and sstatus["available"]
    payload = {
        "status": "ok" if ok else "degraded",
        "nltk_data_dir": NLTK_DATA_DIR,
        "nltk": nstatus,
        "spacy": sstatus,
        "missing": {"nltk": missing, "spacy_model_missing": not sstatus["available"]},
    }
    return JSONResponse(status_code=200 if ok else 503, content=payload)

# transforms the pdf to json and then rates it
@app.post("/api/resume/score")
async def parse_resume(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
    path = None
    # turns the pdf into  temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            path = tmp.name

        #     the actual json parsing
        data = ResumeParser(path).get_extracted_data() or {}
        output = rate_dict(data)
        return JSONResponse(content=output, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse error: {e}")
    finally:
        if path:
            try: os.remove(path)
            except Exception: pass

# curl -s -X POST http://127.0.0.1:9000/api/resume/score -F "file=@C:\Users\Emilia\PycharmProjects\PythonProject\MITCAPD-PostDocII.pdf"
