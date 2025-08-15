# ==============================================================================
# main.py - Aapke AI Voice Agent ka Main Backend File
# ==============================================================================
# Yeh file aapke application ka main entry point hai. 
# Ismein saare API endpoints (routes) define kiye gaye hain. 
# Frontend (JavaScript) se aane wali saari requests yahi handle hoti hain.
# ==============================================================================

from fastapi import FastAPI, Request, HTTPException, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, List

# Humne jo alag-alag files banayi thi, unko yahan import kar rahe hain
import config
import schemas
from services import stt_service, tts_service, llm_service

# FastAPI app ko shuru karna
config.check_api_keys()
logger = config.logger
app = FastAPI(title="AI Voice Agent")

# Session history ko store karne ke liye ek khali dictionary
# Key: session_id, Value: Messages ki list
chat_histories: Dict[str, List[Dict]] = {}

# Static files (jaise main.js) ko serve karne ke liye setup
app.mount("/static", StaticFiles(directory="static"), name="static")
# HTML templates (jaise index.html) ko serve karne ke liye setup
templates = Jinja2Templates(directory="templates")


# ==============================================================================
# SECTION 1: CORE AND CONVERSATIONAL BOT ENDPOINTS
# ==============================================================================

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """
    - KISSE JUDA HAI: Yeh kisi specific bot se nahi, balki poori website se juda hai.
    - KYA KAAM KARTA HAI: Jab aap browser mein apni website (e.g., http://127.0.0.1:8000) kholte hain, 
      to yeh function aapki `index.html` file ko render karke browser ko bhejta hai,
      jisse aapko webpage dikhta hai.
    """
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/agent/chat/{session_id}", response_model=schemas.AgentChatResponse)
async def agent_chat(session_id: str, file: UploadFile = File(...)):
    """
    - KISSE JUDA HAI: Yeh aapke `index.html` ke "🤖 Full AI Voice Bot" wale section se joda hua hai.
    - KYA KAAM KARTA HAI: Yeh aapka main conversational agent hai. Iska kaam hai:
        1. Frontend se record ki hui aawaz (audio file) lena.
        2. Uss aawaz ko `stt_service` se text mein badalna.
        3. Session ID ke basis par purani baatcheet ko yaad rakhna.
        4. Naye text aur purani history ko `llm_service` (Gemini) ko bhejkar ek naya jawab paana.
        5. LLM se mile jawab ko `tts_service` se aawaz mein badalna.
        6. Nayi aawaz ka URL frontend ko wapas bhejna taaki user sun sake.
    """
    try:
        # Step 1: Aawaz ko text mein badalna
        audio_data = await file.read()
        user_query = await stt_service.transcribe_audio(audio_data)

        if not user_query:
            logger.warning("Transcription khaali aayi. Ek default jawab bhej rahe hain.")
            canned_response = "Mujhe aapki aawaz saaf sunai nahi di. Kya aap dobara bol sakte hain?"
            audio_urls = tts_service.generate_speech(canned_response)
            return schemas.AgentChatResponse(audio_urls=audio_urls, user_query="", llm_response=canned_response, message="Sahi audio nahi mila.")

        # Step 2: Baatcheet ki history manage karna
        history = chat_histories.get(session_id, [])
        history.append({"role": "user", "parts": [user_query]})

        # Step 3: LLM se naya jawab lena
        llm_text = llm_service.get_gemini_response(history)
        history.append({"role": "model", "parts": [llm_text]})
        chat_histories[session_id] = history  # History update karna

        # Step 4: Jawab ko aawaz mein badalna
        audio_urls = tts_service.generate_speech(llm_text)

        # Step 5: Frontend ko poora response bhejna
        return schemas.AgentChatResponse(
            audio_urls=audio_urls,
            user_query=user_query,
            llm_response=llm_text,
            message="Conversational response generated successfully"
        )

    except Exception as e:
        logger.error(f"Agent chat pipeline mein error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error.")


# ==============================================================================
# SECTION 2: OLDER, SIMPLER BOT ENDPOINTS
# ==============================================================================

@app.post("/generate-tts", response_model=schemas.TTSResponse)
async def generate_tts_endpoint(text_input: schemas.TextInput):
    """
    - KISSE JUDA HAI: Yeh aapke `index.html` ke "Text-to-Speech" wale section se juda hai, jahan text input box hai.
    - KYA KAAM KARTA HAI: Yeh frontend ke input box se likha hua text leta hai aur
      `tts_service` ka istemal karke usse aawaz mein badalta hai.
      Phir uss aawaz ka URL frontend ko bhejta hai.
    """
    try:
        logger.info(f"TTS ke liye text mila: '{text_input.text}'")
        audio_urls = tts_service.generate_speech(text_input.text)
        if not audio_urls:
            raise HTTPException(status_code=500, detail="TTS generation fail hua.")
        
        return schemas.TTSResponse(audio_url=audio_urls[0], message="TTS generated successfully")
    except Exception as e:
        logger.error(f"TTS endpoint mein error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="TTS generation mein error.")


@app.post("/transcribe/file", response_model=schemas.TranscriptionResponse)
async def transcribe_file_endpoint(file: UploadFile = File(...)):
    """
    - KISSE JUDA HAI: Yeh aapke `index.html` ke "🗣️ Echo Bot v1" wale section se juda hai.
    - KYA KAAM KARTA HAI: Yeh frontend se record ki hui aawaz (audio file) leta hai,
      `stt_service` ka istemal karke usse text mein badalta hai (transcribe karta hai),
      aur uss text ko frontend ko wapas bhejta hai taaki user dekh sake.
    """
    try:
        logger.info("Transcription ke liye file mili.")
        audio_data = await file.read()
        transcript_text = await stt_service.transcribe_audio(audio_data)
        
        return schemas.TranscriptionResponse(transcript=transcript_text, message="Transcription generated successfully")
    except Exception as e:
        logger.error(f"Transcription endpoint mein error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Transcription mein error.")


@app.post("/tts/echo", response_model=schemas.EchoResponse)
async def tts_echo_endpoint(file: UploadFile = File(...)):
    """
    - KISSE JUDA HAI: Yeh aapke `index.html` ke "🗣️ Echo Bot v2" wale section se juda hai.
    - KYA KAAM KARTA HAI: Yeh do kaam ek saath karta hai:
        1. Frontend se aayi aawaz ko pehle text mein badalta hai (`stt_service`).
        2. Phir uss text ko dobara aawaz mein badal kar (`tts_service`) frontend ko bhejta hai.
      Isliye iska naam 'Echo' hai.
    """
    try:
        logger.info("TTS echo ke liye file mili.")
        # Step 1: Transcribe
        audio_data = await file.read()
        transcribed_text = await stt_service.transcribe_audio(audio_data)
        
        if not transcribed_text:
            raise HTTPException(status_code=400, detail="Aawaz samajh nahi aayi, isliye echo nahi kar sakte.")

        # Step 2: Generate speech from transcribed text
        audio_urls = tts_service.generate_speech(transcribed_text)
        if not audio_urls:
            raise HTTPException(status_code=500, detail="Echo generation fail hua.")

        return schemas.EchoResponse(audio_url=audio_urls[0], message="Echo generated successfully")
    except Exception as e:
        logger.error(f"TTS echo endpoint mein error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Echo generation mein error.")