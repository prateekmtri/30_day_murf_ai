import assemblyai as aai
from config import ASSEMBLYAI_API_KEY, logger

# Initialize AssemblyAI client
if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY

transcriber = aai.Transcriber(
    config=aai.TranscriptionConfig(speech_model=aai.SpeechModel.best)
)

async def transcribe_audio(audio_data: bytes) -> str:
    """
    Transcribes audio data using AssemblyAI.
    Raises ValueError if transcription fails.
    """
    if not ASSEMBLYAI_API_KEY:
        logger.error("AssemblyAI API key not found.")
        raise ValueError("AssemblyAI API key not configured.")

    try:
        logger.info("Starting transcription...")
        transcript = transcriber.transcribe(audio_data)

        if transcript.status == aai.TranscriptStatus.error:
            logger.error(f"Transcription failed: {transcript.error}")
            raise ValueError(f"Transcription failed: {transcript.error}")
        
        logger.info("Transcription successful.")
        return transcript.text or ""

    except Exception as e:
        logger.error(f"An exception occurred during transcription: {e}")
        raise ValueError(str(e))