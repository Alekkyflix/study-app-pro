"""
Main FastAPI application entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import lectures, chat
from app.database.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print(f"⚠ Startup warning: {str(e)}")
    yield

app = FastAPI(
    title="Study Pro Unified API",
    description="AI-powered study platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# Build allowed origins from env — no wildcard in production
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
_allowed_origins = list({_frontend_url, "http://localhost:5173", "http://localhost:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lectures.router)
app.include_router(chat.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {
        "message": "Study Pro Unified API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)