"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Lecture schemas
class LectureCreate(BaseModel):
    title: str
    discipline: str
    description: Optional[str] = None

class LectureUpdate(BaseModel):
    title: Optional[str] = None
    discipline: Optional[str] = None
    description: Optional[str] = None

class LectureResponse(BaseModel):
    id: str
    title: str
    discipline: str
    duration: int
    transcript: Optional[str] = None
    summary: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

# Transcription schemas
class TranscriptionRequest(BaseModel):
    method: str = "auto"  # 'auto', 'whisper', or 'gemini'

class TranscriptionResponse(BaseModel):
    lecture_id: str
    transcript: str
    method: str
    duration: int
    accuracy_score: Optional[float] = None

# Summary schemas
class SummaryResponse(BaseModel):
    brief: str
    structured_notes: str
    exam_questions: dict
    glossary: dict
    action_items: list

# Chat schemas
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    citations: Optional[List[dict]] = None

class ChatRequest(BaseModel):
    query: str
    lecture_id: str

class ChatResponse(BaseModel):
    response: str
    citations: List[dict]
    confidence: float

# Document schemas
class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    pages: int
    extracted_text: str
    uploaded_at: datetime

# Report schemas
class ReportRequest(BaseModel):
    lecture_ids: List[str]
    report_type: str  # 'transcript', 'study_guide', 'exam_prep', 'compilation'
    format: str = "pdf"

class ReportResponse(BaseModel):
    id: str
    report_type: str
    status: str
    url: Optional[str] = None
    created_at: datetime

# Analytics schemas
class AnalyticsResponse(BaseModel):
    lecture_id: str
    completion_rate: float
    retention_score: float
    exam_readiness: float
    study_time: int
    questions_answered: int
