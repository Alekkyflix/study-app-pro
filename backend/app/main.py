"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import lectures, chat
from app.database.db import init_db

# Initialize database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - try to initialize but don't fail if unavailable
    try:
        init_db()
    except Exception as e:
        print(f"⚠ Startup warning: {str(e)}")
    yield
    # Shutdown (cleanup if needed)

app = FastAPI(
    title="Study Pro Unified API",
    description="AI-powered study platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (routers already have /api prefix defined)
app.include_router(lectures.router)
app.include_router(chat.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Study Pro Unified API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
