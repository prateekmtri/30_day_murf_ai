from pydantic import BaseModel
from typing import List, Optional

class TextInput(BaseModel):
    text: str

class TTSResponse(BaseModel):
    audio_url: str
    message: str

class TranscriptionResponse(BaseModel):
    transcript: str
    message: str

class EchoResponse(BaseModel):
    audio_url: str
    message: str

class LLMQueryResponse(BaseModel):
    audio_urls: List[str]
    user_query: str
    llm_response: str
    message: str

class AgentChatResponse(BaseModel):
    audio_urls: List[str]
    user_query: Optional[str]
    llm_response: str
    message: str