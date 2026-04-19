"""
Main FastAPI application entry point
"""
import logging
import logging.config
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import lectures, chat
from app.database.db import init_db

# ---------------------------------------------------------------------------
# Structured logging — configure once at startup
# ---------------------------------------------------------------------------
logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
            }
        },
        "root": {"level": "INFO", "handlers": ["console"]},
    }
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter — keyed per remote IP
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        logger.info("Database initialised successfully")
    except Exception as e:
        logger.warning("Startup DB warning: %s", e)
    yield


# ---------------------------------------------------------------------------
# Detect environment
# ---------------------------------------------------------------------------
_IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"

# ---------------------------------------------------------------------------
# FastAPI app — disable interactive docs in production
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Study Pro Unified API",
    description="AI-powered study platform backend",
    version="1.0.0",
    lifespan=lifespan,
    # Disable Swagger UI and ReDoc in production to avoid leaking API schema
    docs_url=None if _IS_PRODUCTION else "/docs",
    redoc_url=None if _IS_PRODUCTION else "/redoc",
    openapi_url=None if _IS_PRODUCTION else "/openapi.json",
)

# Attach rate limiter state and its exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS — explicit origins, methods, and headers (no wildcards on methods/headers)
# ---------------------------------------------------------------------------
_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = list(
    filter(
        None,
        {
            _frontend_url,
            "https://study-app-pro.vercel.app",  # production Vercel
            "http://localhost:5173",              # local Vite dev
            "http://localhost:3000",              # local alternative
        },
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    # Explicit list instead of ["*"] — only the methods the API actually uses
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    # Only the headers consumers actually send
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(lectures.router)
app.include_router(chat.router)


# ---------------------------------------------------------------------------
# Health & root
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    response: dict = {
        "message": "Study Pro Unified API",
        "version": "1.0.0",
    }
    # Only advertise docs URL when they are actually enabled
    if not _IS_PRODUCTION:
        response["docs"] = "/docs"
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)