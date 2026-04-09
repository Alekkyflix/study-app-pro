"""
Transcription endpoints
Handle audio transcription via Whisper or Gemini
"""
from fastapi import APIRouter

router = APIRouter()

@router.post("/lectures/{lecture_id}/transcribe")
async def transcribe_lecture(lecture_id: str, method: str = "auto"):
    """
    Transcribe lecture audio
    method: 'whisper' (local), 'gemini' (cloud), or 'auto' (choose best)
    """
    pass

@router.get("/lectures/{lecture_id}/transcript")
async def get_transcript(lecture_id: str):
    """Get transcript for a lecture"""
    pass

@router.put("/lectures/{lecture_id}/transcript")
async def update_transcript(lecture_id: str):
    """Update/edit transcript"""
    pass

@router.get("/lectures/{lecture_id}/transcription-status")
async def get_transcription_status(lecture_id: str):
    """Check transcription progress"""
    pass
