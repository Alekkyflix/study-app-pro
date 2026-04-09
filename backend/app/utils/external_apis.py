"""External API integrations (Gemini, Whisper, etc.)"""

class GeminiAPI:
    """Google Gemini API wrapper"""
    
    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio using Gemini Native Audio API"""
        pass
    
    async def generate_text(self, prompt: str, model: str = "gemini-1.5-flash") -> str:
        """Generate text using Gemini"""
        pass
    
    async def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for semantic search"""
        pass

class WhisperAPI:
    """Local Whisper transcription wrapper"""
    
    async def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe using local Whisper model"""
        pass

gemini_api = GeminiAPI()
whisper_api = WhisperAPI()
