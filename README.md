# 🎙️ AI Voice Agent Suite: A Deep Dive Documentation

Welcome to the complete technical documentation for the AI Voice Agent Suite. This document provides an in-depth look into the project's architecture, features, technology stack, and the intricate workings of both the frontend and backend. It is designed for developers, contributors, and anyone curious about how a modern conversational AI is built from the ground up.

![AI Voice Agent UI](https://i.postimg.cc/5yZX9f7X/Screenshot-2025-08-14-190445.png)
*Note: Please replace the link above with a link to your own screenshot of the project.*

---

## 📜 Table of Contents

1.  [**Project Vision & Core Concept**](#-project-vision--core-concept)
2.  [**Features in Detail**](#-features-in-detail)
    -   [The Full Conversational AI Agent](#-the-full-conversational-ai-agent)
    -   [The Text-to-Speech (TTS) Bot](#-the-text-to-speech-tts-bot)
    -   [The Echo Bot v1 (Transcription)](#-the-echo-bot-v1-transcription)
    -   [The Echo Bot v2 (AI Voice Echo)](#-the-echo-bot-v2-ai-voice-echo)
3.  [**Architectural Deep Dive**](#-architectural-deep-dive)
    -   [High-Level System Design](#high-level-system-design)
    -   [The Frontend Story: The User's Browser](#the-frontend-story-the-users-browser)
    -   [The Backend Story: The FastAPI Server](#the-backend-story-the-fastapi-server)
4.  [**Technology Stack Explained**](#-technology-stack-explained)
    -   [Why FastAPI?](#why-fastapi)
    -   [Why AssemblyAI, Gemini, and Murf AI?](#why-assemblyai-gemini-and-murf-ai)
5.  [**Complete Setup & Installation Guide**](#-complete-setup--installation-guide)
6.  [**API Endpoint Reference**](#-api-endpoint-reference)
7.  [**Future Roadmap**](#-future-roadmap)
8.  [**Author & Acknowledgments**](#-author--acknowledgments)

---

## 🎯 Project Vision & Core Concept

The vision behind the AI Voice Agent Suite is to create a seamless, voice-first interface for interacting with powerful artificial intelligence. In a world dominated by text and touch, this project explores the natural and intuitive medium of human speech. It's not just a single tool, but a collection of four distinct "bots" that demonstrate the key components of a voice AI pipeline: listening (STT), thinking (LLM), and speaking (TTS).

The project is built with a **modular and scalable architecture**, proving that complex AI applications can be developed with clean, maintainable, and easy-to-understand code.

---

## ✨ Features in Detail

Each bot in this suite serves a specific purpose and demonstrates a unique part of the voice AI workflow.

### 🤖 The Full Conversational AI Agent

This is the flagship feature of the project. It's a stateful, context-aware AI assistant.

-   **User Story:** "As a user, I want to have a continuous conversation with an AI by speaking into my microphone. I expect the AI to remember what I said earlier in the conversation and provide relevant answers in a human-like voice."
-   **Functionality:**
    -   **Session Management:** A unique `session_id` is generated for each user session, allowing the backend to store and retrieve conversation history.
    -   **Contextual Memory:** The backend maintains a list of user prompts and model responses for each session. This entire history is sent to the LLM with every new query.
    -   **End-to-End Pipeline:** It integrates all three core AI services: AssemblyAI (STT) -> Google Gemini (LLM) -> Murf AI (TTS).

### ✍️ The Text-to-Speech (TTS) Bot

This is the simplest bot, designed to showcase the text-to-speech functionality in isolation.

-   **User Story:** "As a user, I want to type any text into an input box and hear it spoken aloud in a clear, high-quality voice."
-   **Functionality:**
    -   Takes text input from an HTML form.
    -   Sends the text to the backend `/generate-tts` endpoint.
    -   The backend uses the Murf AI service to convert the text to an audio file.
    -   The audio URL is returned to the frontend and played automatically.

### 🗣️ The Echo Bot v1 (Transcription)

This bot focuses solely on the Speech-to-Text component.

-   **User Story:** "As a user, I want to record my voice and see an accurate text transcription of what I said."
-   **Functionality:**
    -   Records audio from the user's microphone.
    -   Sends the audio file to the backend `/transcribe/file` endpoint.
    -   The backend uses the AssemblyAI service to transcribe the audio.
    -   The resulting text is sent back to the frontend and displayed on the screen.

### 🔊 The Echo Bot v2 (AI Voice Echo)

This bot demonstrates a direct STT -> TTS pipeline, without the LLM "thinking" step.

-   **User Story:** "As a user, I want to record my voice and hear my own words spoken back to me, but in a different, professional AI voice."
-   **Functionality:**
    -   Records user audio.
    -   Sends it to the `/tts/echo` endpoint.
    -   The backend first transcribes the audio to text (using AssemblyAI).
    -   It then immediately sends that same text to the TTS service (Murf AI) to generate a new audio file.
    -   The new audio URL is returned and played on the frontend.

---

## 🏗️ Architectural Deep Dive

This is where we explore how the project truly works, from the code running in your browser to the logic executing on the server.

### High-Level System Design

The entire application operates on a classic client-server model. The "Client" is the user's web browser, and the "Server" is our FastAPI application.

```
+--------------------------------+      HTTP Requests      +-------------------------------------+
|      CLIENT (Web Browser)      | <--------------------> |        SERVER (FastAPI on Uvicorn)    |
|                                |      (Audio, Text)      |                                     |
|  [ HTML | CSS | JavaScript ]    |                         |  [ main.py | services | schemas ]    |
|                                |      JSON Response      |                                     |
|  - Renders UI                  | <--------------------> |  - Receives Requests                |
|  - Captures Mic Audio          |      (Audio URL, Text)  |  - Calls External AI APIs           |
|  - Plays Response Audio        |                         |  - Manages Conversation History     |
+--------------------------------+                         +-------------------------------------+
                                                                    |          |          |
                                                                    |          |          |
                                                          +-----------+----------+-----------+
                                                          | AssemblyAI | Gemini | Murf AI   |
                                                          |   (STT)    | (LLM)  |  (TTS)    |
                                                          +------------+--------+-----------+
```

### The Frontend Story: The User's Browser

The entire frontend experience is powered by three files: `index.html`, some CSS for styling, and `main.js`. The magic happens in `main.js`.

**1. `index.html` - The Skeleton**
This file defines the structure of the webpage. It creates the containers, buttons, status displays, and audio players for all four bots. Each important element has a unique `id` (e.g., `startLLMRecordBtn`, `llmBotStatus`) so that our JavaScript can find and manipulate it.

**2. `main.js` - The Brains of the Frontend**
This file is responsible for all user interactions. Let's break down its key responsibilities:

-   **Initialization (`DOMContentLoaded`):** The script waits for the entire HTML page to load before it tries to find elements or attach event listeners. This prevents "element not found" errors.

-   **State Management:** The script manages the UI state by changing the text and CSS classes of status elements (e.g., `llmBotStatus`). This gives the user clear feedback on what's happening:
    -   `"Ready! Click 'Ask Question' to start."` (Initial state)
    -   `"Listening... 👂"` (Recording in progress)
    -   `"Processing your voice... 🔄"` (Audio sent, waiting for backend)
    -   `"Got it! Thinking of a response... 🤔"` (Backend is processing)
    -   `"❌ An error occurred..."` (Error state)

-   **Microphone Access (`MediaRecorder` API):** This is a core browser API.
    -   When the page loads, the script requests permission to use the microphone using `navigator.mediaDevices.getUserMedia({ audio: true })`.
    -   If permission is granted, it creates a `MediaRecorder` instance.
    -   When the user starts recording, `mediaRecorder.start()` is called. The audio is captured in small "chunks".
    -   `mediaRecorder.ondataavailable` is an event that fires whenever a new chunk of audio is ready. We collect these chunks in an array (`audioChunks`).
    -   When the user stops recording, `mediaRecorder.stop()` is called. The `onstop` event fires, where we combine all the collected chunks into a single `Blob` (a file-like object). This `Blob` is what we send to the backend.

-   **Communicating with the Backend (`fetch` API):**
    -   The `fetch` API is used to send the audio `Blob` to our FastAPI server.
    -   We use `FormData` to package the `Blob` as if it were an HTML file upload. This is the standard way to send files over HTTP.
    -   `method: 'POST'` is used because we are sending data to the server to create a new resource (a response).
    -   The script waits for the server's response (`await response.json()`).
    -   It then processes the JSON response, which contains the `audio_urls` and `llm_response` text.

-   **Playing Audio:** The script handles playing the response audio. For the main bot, it creates a queue of audio URLs and plays them one after another using the `onended` event of the HTML `<audio>` element. After the last audio file finishes, it automatically starts listening again for a seamless conversational flow.

### The Backend Story: The FastAPI Server

The backend is where the heavy lifting and AI integration happens. Its modular structure makes it robust and easy to maintain.

**1. `main.py` - The API Router & Conductor**
This file is the heart of the server.
-   **FastAPI Instance:** `app = FastAPI()` creates the main application object.
-   **Routing:** It uses decorators (`@app.post(...)`) to define the API endpoints. Each decorator tells FastAPI: "When you receive a POST request at this URL, execute the following function."
-   **Request Handling:** The endpoint functions (e.g., `agent_chat`) define how to handle incoming requests. They receive data from the frontend, like the `session_id` and the uploaded audio `file`.
-   **Orchestration:** This file doesn't contain the actual AI logic. Instead, it acts as a conductor, calling the appropriate functions from the `services` modules in the correct order. For example, in `agent_chat`, it calls `stt_service`, then `llm_service`, then `tts_service`.
-   **Error Handling:** It uses `try...except` blocks to catch errors that might occur in the services (e.g., an API key is invalid) and returns a proper HTTP error response to the frontend.

**2. The `services` Layer - The AI Specialists**
This directory abstracts all interactions with external AI APIs. This is a crucial design pattern. If we ever want to switch from AssemblyAI to another STT provider, we only need to change the code in `stt_service.py`; the rest of our application remains untouched.
-   **`stt_service.py`:** Contains the `transcribe_audio` function. It takes raw audio data, initializes the AssemblyAI client, and returns the transcribed text.
-   **`llm_service.py`:** Contains the `get_gemini_response` function. It takes the conversation history, initializes the Google Gemini client, and returns the AI's text response.
-   **`tts_service.py`:** Contains the `generate_speech` function. It takes text, initializes the Murf AI client, and returns a list of audio URLs. It also cleverly uses the `utils.py` function to split long text into smaller chunks that the Murf API can handle.

**3. `schemas.py` - The Data Blueprint**
This file uses **Pydantic** to define the expected structure of our API's inputs and outputs.
-   **Why is this important?** It provides automatic data validation. For example, our `TTSResponse` schema says that the response *must* contain an `audio_url` which is a string. If our code accidentally tries to return a response without it, FastAPI will raise an error immediately. This catches bugs early and makes the API extremely reliable.
-   It also automatically generates OpenAPI documentation for our API.

**4. `config.py` - The Central Control Panel**
-   **`python-dotenv`:** This library loads the secret API keys from the `.env` file into the environment.
-   **Centralized Keys:** All other files import the API keys from this single file. This is much better than scattering `os.getenv(...)` calls throughout the project.
-   **Logging Setup:** It configures the application's logger, so all log messages have a consistent format with timestamps.

---

## 🔬 Technology Stack Explained

### Why FastAPI?

-   **Performance:** FastAPI is one of the fastest Python web frameworks available, built on top of Starlette and Pydantic. For a real-time voice agent, low latency is critical.
-   **Ease of Use:** The syntax is simple, modern, and intuitive, using Python type hints to its advantage.
-   **Automatic Docs:** It automatically generates interactive API documentation (Swagger UI), which is incredibly helpful for development and testing.
-   **Data Validation:** Pydantic integration provides robust, out-of-the-box data validation, reducing bugs and improving security.

### Why AssemblyAI, Gemini, and Murf AI?

-   **AssemblyAI (STT):** Chosen for its high accuracy in transcription, support for various audio formats, and simple API. Accurate transcription is the foundation of the entire agent; if the agent can't hear correctly, it can't think or respond correctly.
-   **Google Gemini 1.5 Flash (LLM):** The "Flash" model is optimized for speed and efficiency, making it perfect for conversational applications where quick responses are essential. It has a large context window and strong reasoning capabilities.
-   **Murf AI (TTS):** Selected for its incredibly realistic and natural-sounding AI voices. A robotic voice can ruin the user experience. Murf provides a wide range of high-quality voices that make the agent feel more human and engaging.

---

## 🚀 Complete Setup & Installation Guide

Follow these instructions meticulously to get the project running on your local machine.

### 1. Prerequisites
-   **Python 3.9+:** Ensure you have a modern version of Python installed.
-   **Git:** For cloning the repository.
-   **API Keys:** You will need to sign up for free-tier accounts on [AssemblyAI](https://www.assemblyai.com/), [Google AI Studio (for Gemini)](https://aistudio.google.com/), and [Murf AI](https://murf.ai/).

### 2. Clone the Repository
Open your terminal or command prompt and run:
```sh
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
```

### 3. Create and Activate a Virtual Environment
This is a critical step to keep your project's dependencies isolated.
```sh
# For Windows
python -m venv venv
.\venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
```
You should see `(venv)` at the beginning of your terminal prompt.

### 4. Install Dependencies
All required Python packages are listed in `requirements.txt`.
```sh
pip install -r requirements.txt
```

### 5. Configure Environment Variables
Create a file named `.env` in the root directory. This file will hold your secret API keys.
```env
ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"
MURF_API_KEY="your_murf_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"
```
**IMPORTANT:** Create a `.gitignore` file and add `.env` and `venv/` to it to prevent committing secrets and the virtual environment folder to Git.

### 6. Run the Application
Start the Uvicorn server from the root directory:
```sh
uvicorn main:app --reload
```
The server will start, and you'll see output indicating it's running on `http://127.0.0.1:8000`.

### 7. Use the Agent
Open your web browser, navigate to **http://127.0.0.1:8000**, grant microphone permissions when prompted, and start your conversation!

---

## 📋 API Endpoint Reference

| Method | Endpoint                    | Description & Functionality                               |
|--------|-----------------------------|-----------------------------------------------------------|
| `GET`  | `/`                         | Serves the main `index.html` user interface.              |
| `POST` | `/agent/chat/{session_id}`  | **Full Agent:** Takes audio, returns AI voice response.   |
| `POST` | `/generate-tts`             | **TTS Bot:** Takes JSON with text, returns audio URL.     |
| `POST` | `/transcribe/file`          | **Echo Bot v1:** Takes audio, returns transcribed text.   |
| `POST` | `/tts/echo`                 | **Echo Bot v2:** Takes audio, returns AI-spoken echo.     |

---

## 🌟 Future Roadmap

This project has a solid foundation, but there's always room for improvement:

-   [ ] **WebSocket Integration:** Transition from HTTP polling to WebSockets for true real-time, bi-directional communication, reducing latency significantly.
-   [ ] **Voice Activity Detection (VAD):** Implement VAD on the frontend so the user doesn't have to click "stop". The recording would stop automatically when they finish speaking.
-   [ ] **Cloud Deployment:** Deploy the application to a cloud service like Render, Vercel, or AWS so it's publicly accessible.
-   [ ] **Custom Wake Word:** Implement a "wake word" (e.g., "Hey Gemini") to activate the agent without clicking any buttons.
-   [ ] **Database Integration:** Store conversation histories in a database (like PostgreSQL or MongoDB) instead of in-memory for long-term persistence.

---

## 👤 Author & Acknowledgments

-   **[Yahan Apna Naam Likhein]**
-   **LinkedIn:** [Aapke LinkedIn Profile Ka Link]
-   **GitHub:** [Aapke GitHub Profile Ka Link]

This project was built as part of the **#30DaysOfAIVoiceAgents** challenge. A big thank you to the organizers and the community for their support and inspiration.
