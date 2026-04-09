"""
Transcription service - Convert audio to text using Whisper
"""
import os
from faster_whisper import WhisperModel


class TranscriptionService:
    def __init__(self, model_size: str = "base"):
        """Initialize Whisper model"""
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")

    def transcribe(self, audio_file_path: str, language: str = "en") -> dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: Path to audio file
            language: Language code (e.g., 'en', 'es', 'fr')
            
        Returns:
            dict with transcription text and metadata
        """
        try:
            segments, info = self.model.transcribe(
                audio_file_path,
                language=language,
                beam_size=5,
            )

            # Combine all segments into full text
            full_text = " ".join([segment.text for segment in segments])
            
            # Get segment details
            segment_list = [
                {
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text,
                    "confidence": segment.confidence,
                }
                for segment in segments
            ]

            return {
                "success": True,
                "text": full_text,
                "segments": segment_list,
                "language": info.language,
                "duration": info.duration,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": None,
            }


# Global transcription service instance
transcription_service = None


def get_transcription_service():
    """Get or create transcription service"""
    global transcription_service
    if transcription_service is None:
        transcription_service = TranscriptionService()
    return transcription_service
