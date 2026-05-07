"""
Transcription service — Groq Whisper API (fast) or local faster-whisper (accurate).
- fast/balanced: uses Groq if GROQ_API_KEY is set, otherwise falls back to local
- accurate: always uses local faster-whisper (no size/rate limits)
"""
import os
import logging

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

_instance = None


class TranscriptionService:
    def __init__(self, model_size: str = "base", force_local: bool = False):
        self.model_size = model_size
        self.use_groq = bool(GROQ_API_KEY) and not force_local

    def transcribe(self, audio_file_path: str, language: str = "en") -> dict:
        if self.use_groq:
            return self._transcribe_groq(audio_file_path)
        return self._transcribe_local(audio_file_path, language)

    def _transcribe_groq(self, audio_file_path: str) -> dict:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            with open(audio_file_path, "rb") as f:
                result = client.audio.transcriptions.create(
                    file=(os.path.basename(audio_file_path), f),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json",
                )
            return {
                "success": True,
                "text": result.text,
                "duration": getattr(result, "duration", 0),
                "language": getattr(result, "language", "en"),
            }
        except Exception as e:
            logger.error("Groq transcription failed, falling back to local: %s", e)
            # Auto-fallback to local on Groq failure (rate limit, size limit, etc.)
            return self._transcribe_local(audio_file_path)

    def _transcribe_local(self, audio_file_path: str, language: str = "en") -> dict:
        try:
            from faster_whisper import WhisperModel
            model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            segments, info = model.transcribe(
                audio_file_path,
                language=language,
                beam_size=5,
            )
            full_text = " ".join([s.text for s in segments])
            return {
                "success": True,
                "text": full_text,
                "duration": info.duration,
                "language": info.language,
            }
        except ImportError:
            return {
                "success": True,
                "text": "[Mock] Install faster-whisper or set GROQ_API_KEY for real transcription.",
                "duration": 0,
                "language": language,
            }
        except Exception as e:
            logger.error("Local transcription failed: %s", e)
            return {"success": False, "error": str(e), "text": None}


def get_transcription_service() -> TranscriptionService:
    global _instance
    if _instance is None:
        _instance = TranscriptionService()
    return _instance