import os

from fastapi import FastAPI

from routers.parser import ensure_spacy, ensure_nltk, NLTK_RESOURCES, SPACY_MODEL
from routers import parser, challenges, tasks
from security import auth_middleware

app = FastAPI(title="Challenge Verification API", version="0.1.0")


@app.on_event("startup")
def _startup():
    """
    Startup event handler: verifies NLTK and spaCy resources.
    """
    auto_nltk = os.getenv("AUTO_DOWNLOAD_NLTK", "false").lower() in {"1", "true", "yes"}
    auto_spacy = os.getenv("AUTO_DOWNLOAD_SPACY", "false").lower() in {"1", "true", "yes"}

    missing_nltk = ensure_nltk(NLTK_RESOURCES, auto_download=auto_nltk)
    if missing_nltk:
        print(f"[startup] Missing NLTK resources: {missing_nltk}")
    else:
        print("[startup] NLTK resources available")

    sp_ok = ensure_spacy(SPACY_MODEL, auto_download=auto_spacy)
    print(f"[startup] spaCy model '{SPACY_MODEL}' available: {sp_ok}")

def create_app() -> FastAPI:

    #Include middleware
    app.add_middleware(auth_middleware.AuthCORSFilterMiddleware)

    # Include routers
    app.include_router(parser.router, prefix="/v1/parser", tags=["parser"])
    app.include_router(challenges.router, prefix="/v1/challenges", tags=["challenges"])
    app.include_router(tasks.router, prefix="/v1/tasks", tags=["tasks"])
    app.include_router(xp.router, prefix="/v1/xp", tags=["xp"])

    return app

app = create_app()
