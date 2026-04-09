"""
Summarization service - Generate study summaries using Gemini API
"""
import os
import json
import google.generativeai as genai
from typing import Optional


class SummarizationService:
    def __init__(self):
        """Initialize Gemini API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-pro")

    def summarize(
        self,
        text: str,
        summary_type: str = "executive",
    ) -> dict:
        """
        Generate a summary of lecture transcript
        
        Args:
            text: Full transcript text
            summary_type: 'executive', 'detailed', 'questions', or 'glossary'
            
        Returns:
            dict with summary and metadata
        """
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
