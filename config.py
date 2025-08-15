import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- API Keys ---
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Logging Configuration ---
# Configure logging to show timestamp, log level, and message
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create a logger instance that you can import in other files
logger = logging.getLogger(__name__)

# --- Function to check for missing API keys ---
def check_api_keys():
    """Checks if all required API keys are present and logs a warning if not."""
    if not MURF_API_KEY:
        logger.warning("MURF_API_KEY is not set in the environment.")
    if not ASSEMBLYAI_API_KEY:
        logger.warning("ASSEMBLYAI_API_KEY is not set in the environment.")
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set in the environment.")
    if not all([MURF_API_KEY, ASSEMBLYAI_API_KEY, GEMINI_API_KEY]):
        logger.error("One or more critical API keys are missing. The application may not function correctly.")
        return False
    return True