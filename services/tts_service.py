from murf import Murf
from config import MURF_API_KEY, logger
from utils import split_text
from typing import List

def generate_speech(text: str, voice_id: str = "en-US-natalie") -> List[str]:
    """
    Generates audio from text using Murf AI.
    Handles splitting text into chunks.
    Raises ValueError if TTS generation fails.
    """
    if not MURF_API_KEY:
        logger.error("Murf API key not found.")
        raise ValueError("Murf API key not configured.")

    try:
        logger.info("Splitting text for TTS generation...")
        text_chunks = split_text(text)
        logger.info(f"Generating audio for {len(text_chunks)} chunk(s).")

        client_murf = Murf(api_key=MURF_API_KEY)
        audio_urls = []

        for chunk in text_chunks:
            response = client_murf.text_to_speech.generate(
                text=chunk,
                voice_id=voice_id
            )
            audio_urls.append(response.audio_file)
        
        logger.info("TTS audio generated successfully.")
        return audio_urls

    except Exception as e:
        logger.error(f"An exception occurred during TTS generation: {e}")
        raise ValueError(str(e))