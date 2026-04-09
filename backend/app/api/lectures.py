"""
Lectures API routes - Create, read, update, delete lectures with transcription and summarization
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
import os
import shutil
from datetime import datetime

from app.database.db import SessionLocal
from app.models.lecture import Lecture
from app.services.transcription_service import get_transcription_service
from app.services.summarization_service import get_summarization_service
from app.services.rag_service import get_rag_service

router = APIRouter(prefix="/api", tags=["lectures"])

# Pydantic models
class LectureCreate(BaseModel):
    title: str
    description: Optional[str] = None


class LectureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    transcript: Optional[str] = None


# Directory for storing audio files
UPLOAD_DIR = "/tmp/study_pro_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/lectures", response_model=dict)
async def create_lecture(title: str = Form(...), description: str = Form(None)):
    """Create a new lecture entry"""
    try:
        db = SessionLocal()
        lecture = Lecture(
            title=title,
            description=description,
            created_at=datetime.now(),
        )
        db.add(lecture)
        db.commit()
        db.refresh(lecture)
        db.close()

        return {
            "success": True,
            "lecture_id": lecture.id,
            "title": lecture.title,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/lectures", response_model=dict)
async def list_lectures():
    """Get all lectures"""
    try:
        db = SessionLocal()
        lectures = db.query(Lecture).all()
        db.close()

        return {
            "success": True,
            "lectures": [
                {
                    "id": l.id,
                    "title": l.title,
                    "description": l.description,
                    "duration": l.duration,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                }
                for l in lectures
            ],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/lectures/{lecture_id}", response_model=dict)
async def get_lecture(lecture_id: int):
    """Get lecture details"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        db.close()

        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")

        return {
            "success": True,
            "lecture": {
                "id": lecture.id,
                "title": lecture.title,
                "description": lecture.description,
                "transcript": lecture.transcript,
                "summary": lecture.summary,
                "duration": lecture.duration,
                "created_at": lecture.created_at.isoformat() if lecture.created_at else None,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/lectures/{lecture_id}/upload-audio", response_model=dict)
async def upload_audio(lecture_id: int, file: UploadFile = File(...)):
    """Upload audio file for a lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        db.close()

        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")

        # Save audio file
        file_path = os.path.join(UPLOAD_DIR, f"lecture_{lecture_id}.wav")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "message": "Audio uploaded successfully",
            "lecture_id": lecture_id,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/lectures/{lecture_id}/transcribe", response_model=dict)
async def transcribe_lecture(lecture_id: int):
    """Transcribe lecture audio"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        # Get audio file
        file_path = os.path.join(UPLOAD_DIR, f"lecture_{lecture_id}.wav")
        if not os.path.exists(file_path):
            db.close()
            raise HTTPException(status_code=400, detail="Audio file not found")

        # Transcribe
        transcription_service = get_transcription_service()
        result = transcription_service.transcribe(file_path)

        if result["success"]:
            lecture.transcript = result["text"]
            lecture.duration = int(result.get("duration", 0))
            db.commit()
            db.refresh(lecture)

        db.close()

        return {
            "success": result["success"],
            "transcript": result.get("text"),
            "duration": result.get("duration"),
            "language": result.get("language"),
            "error": result.get("error"),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/lectures/{lecture_id}/summarize", response_model=dict)
async def summarize_lecture(lecture_id: int, summary_type: str = "executive"):
    """Generate summary for lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        if not lecture.transcript:
            db.close()
            raise HTTPException(status_code=400, detail="No transcript available")

        # Summarize
        summarization_service = get_summarization_service()
        result = summarization_service.summarize(lecture.transcript, summary_type)

        if result["success"]:
            lecture.summary = result["summary"]
            db.commit()
            db.refresh(lecture)

        db.close()

        return {
            "success": result["success"],
            "summary": result.get("summary"),
            "summary_type": summary_type,
            "error": result.get("error"),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.put("/lectures/{lecture_id}", response_model=dict)
async def update_lecture(lecture_id: int, lecture_update: LectureUpdate):
    """Update lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        if lecture_update.title:
            lecture.title = lecture_update.title
        if lecture_update.description:
            lecture.description = lecture_update.description
        if lecture_update.transcript:
            lecture.transcript = lecture_update.transcript

        db.commit()
        db.refresh(lecture)
        db.close()

        return {"success": True, "lecture_id": lecture.id}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.delete("/lectures/{lecture_id}", response_model=dict)
async def delete_lecture(lecture_id: int):
    """Delete lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        # Delete audio file
        file_path = os.path.join(UPLOAD_DIR, f"lecture_{lecture_id}.wav")
        if os.path.exists(file_path):
            os.remove(file_path)

        db.delete(lecture)
        db.commit()
        db.close()

        return {"success": True, "message": "Lecture deleted"}
    except Exception as e:
        return {"success": False, "error": str(e)}
