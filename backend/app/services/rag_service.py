"""
RAG (Retrieval Augmented Generation) service - Handle embeddings and Q&A
"""
import os
from typing import List

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


class RAGService:
    def __init__(self):
        """Initialize RAG with embedding model"""
        if not HAS_GENAI:
            self.initialized = False
            return
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            self.initialized = False
            return
        try:
            genai.configure(api_key=api_key)
            self.initialized = True
        except Exception as e:
            print(f"⚠️  RAG initialization failed: {e}")
            self.initialized = False

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Gemini"""
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def split_into_chunks(self, text: str, chunk_size: int = 500) -> List[str]:
        """Split text into chunks for embedding"""
        words = text.split()
        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)
            if len(current_chunk) >= chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def answer_question(
        self, question: str, context_text: str, chat_history: List[dict] = None
    ) -> dict:
        """
        Answer a question based on lecture context
        
        Args:
            question: User question
            context_text: Full lecture transcript or summary
            chat_history: Previous messages for context
            
        Returns:
            dict with answer and metadata
        """
        try:
            from app.prompts import STUDY_PRO_SYSTEM_MESSAGE
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=STUDY_PRO_SYSTEM_MESSAGE
            )

            # Build context message
            system_message = f"""You are a helpful study assistant. Answer questions based on the following lecture material.
Be accurate and cite specific parts of the lecture when relevant.

LECTURE MATERIAL:
{context_text[:100_000]}

Based on this material, provide a clear and educational answer."""

            # Add chat history if available
            messages = []
            if chat_history:
                for msg in chat_history[-5:]:  # Last 5 messages for context
                    messages.append({"role": msg["role"], "parts": [msg["text"]]})

            # Add current question
            messages.append({"role": "user", "parts": [question]})

            response = model.generate_content(messages)

            return {
                "success": True,
                "answer": response.text,
                "question": question,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "answer": None,
            }

    def extract_key_concepts(self, text: str, num_concepts: int = 10) -> dict:
        """Extract key concepts from lecture text"""
        try:
            from app.prompts import STUDY_PRO_SYSTEM_MESSAGE
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=STUDY_PRO_SYSTEM_MESSAGE
            )

            prompt = f"""Extract the {num_concepts} most important concepts, ideas, or topics from this lecture transcript.
For each concept, provide:
1. Name
2. Brief explanation (1-2 sentences)
3. Importance (1-10 scale)

Format as JSON array.

Transcript:
{text}"""

            response = model.generate_content(prompt)
            # Parse response as JSON
            import json

            try:
                concepts = json.loads(response.text)
            except:
                concepts = [{"name": "Concept", "description": response.text}]

            return {
                "success": True,
                "concepts": concepts,
                "count": len(concepts),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "concepts": [],
            }


# Global RAG service instance
rag_service = None


def get_rag_service():
    """Get or create RAG service"""
    global rag_service
    if rag_service is None:
        rag_service = RAGService()
    return rag_service