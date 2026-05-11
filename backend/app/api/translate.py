from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import os
import logging
from app.security import get_user_id

router = APIRouter(prefix="/api/translate", tags=["translate"])
logger = logging.getLogger(__name__)

class TranslateRequest(BaseModel):
    texts: List[str]
    target_language: str

@router.post("", response_model=Dict[str, str])
async def translate_texts(req: TranslateRequest, user_id: str = Depends(get_user_id)):
    if not req.texts:
        return {}
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback if no API key
        return {text: f"[{req.target_language}] {text}" for text in req.texts}
        
    try:
        import google.generativeai as genai
        import json
        genai.configure(api_key=api_key)
        
        # Use a cheaper/faster model for quick UI translations
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
Translate the following UI text strings into {req.target_language}.
Return a strictly valid JSON object where keys are the original English strings and values are the translations.
Do not include any markdown formatting, only the JSON.

Original strings:
{json.dumps(req.texts)}
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Strip markdown if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        translations = json.loads(text.strip())
        return translations
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        # Return originals on failure so UI doesn't break
        return {text: text for text in req.texts}
