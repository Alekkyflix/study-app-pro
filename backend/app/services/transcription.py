"""
Audio transcription service
Handles both Whisper (local) and Gemini (cloud) transcription
"""
from typing import Literal

class TranscriptionService:
    """Orchestrates audio transcription"""
    
    async def transcribe_with_whisper(self, audio_path: str) -> str:
        """Transcribe using local Whisper model"""
        pass
    
    async def transcribe_with_gemini(self, audio_blob: bytes) -> str:
        """Transcribe using Gemini native audio API"""
        pass
    
    async def auto_transcribe(self, audio_path: str, method: Literal["auto", "whisper", "gemini"] = "auto") -> str:
        """
        Intelligently choose transcription method
        - auto: Try fast local first, fallback to cloud if needed
        """
        pass

transcription_service = TranscriptionService()
