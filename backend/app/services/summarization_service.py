"""
Summarization service - Generate study summaries using Gemini API
"""
import os
import json
from typing import Optional

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


class SummarizationService:
    def __init__(self):
        """Initialize Gemini API"""
        if not HAS_GENAI:
            self.model = None
            return
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            self.model = None
            return
        try:
            genai.configure(api_key=api_key)
            from app.prompts import STUDY_PRO_SYSTEM_MESSAGE
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=STUDY_PRO_SYSTEM_MESSAGE
            )
        except Exception as e:
            print(f"⚠️  Failed to initialize Gemini: {e}")
            self.model = None

    def summarize(
        self,
        text: str,
        summary_type: str = "executive",
        language: str = "english",
    ) -> dict:
        """
        Generate a summary of lecture transcript
        
        Args:
            text: Full transcript text
            summary_type: 'executive', 'detailed', 'questions', or 'glossary'
            language: Target language for the summary
            
        Returns:
            dict with summary and metadata
        """
        if self.model is None:
            return {
                "success": True,
                "summary": f"[Mock Summary] This is a simulated {summary_type} summary. Install google-generativeai for real summarization."
            }
        
        try:
            prompts = {
                "executive": """Provide a concise 3-5 sentence executive summary of this lecture transcript. 
Focus on the main takeaways and key concepts.\n\nTranscript:\n{text}""",
                "detailed": """Create a detailed structured summary with the following sections:
1. Main Topic
2. Key Concepts (bullet points)
3. Important Examples
4. Learning Objectives
5. Key Takeaways\n\nTranscript:\n{text}""",
                "questions": """Based on this lecture transcript, generate 5-10 practice exam questions that test understanding of the material. 
Provide questions with multiple choice options and correct answers.\n\nTranscript:\n{text}""",
                "glossary": """Extract and define 10-15 key terms and concepts from this lecture transcript.
Format as a glossary with term and definition.\n\nTranscript:\n{text}""",
            }

            prompt = prompts.get(summary_type, prompts["executive"]).format(text=text)
            
            if language and language.lower() != "english":
                prompt += f"\n\nCRITICAL INSTRUCTION: Your output MUST be entirely in {language.capitalize()}."

            response = self.model.generate_content(prompt)

            return {
                "success": True,
                "summary": response.text,
                "summary_type": summary_type,
                "tokens_used": len(text.split()),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "summary": None,
            }

    def multi_summarize(self, text: str) -> dict:
        """Generate all summary types at once"""
        summaries = {}
        for summary_type in ["executive", "detailed", "questions", "glossary"]:
            result = self.summarize(text, summary_type)
            if result["success"]:
                summaries[summary_type] = result["summary"]

        return {
            "success": all(r["success"] for r in summaries.values()),
            "summaries": summaries,
        }


# Global summarization service instance
summarization_service = None


def get_summarization_service():
    """Get or create summarization service"""
    global summarization_service
    if summarization_service is None:
        summarization_service = SummarizationService()
    return summarization_service
