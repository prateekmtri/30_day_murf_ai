import google.generativeai as genai
from config import GEMINI_API_KEY, logger
from typing import List, Dict

# Initialize Gemini client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_gemini_response(history: List[Dict[str, any]], model_name: str = 'gemini-1.5-flash') -> str:
    """
    Gets a contextual response from Gemini based on conversation history.
    Raises ValueError if the LLM call fails.
    """
    if not GEMINI_API_KEY:
        logger.error("Gemini API key not found.")
        raise ValueError("Gemini API key not configured.")
    
    try:
        logger.info("Generating response from Gemini...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(history)
        
        logger.info("Successfully received response from Gemini.")
        return response.text

    except Exception as e:
        logger.error(f"An exception occurred while communicating with Gemini: {e}")
        raise ValueError(str(e))