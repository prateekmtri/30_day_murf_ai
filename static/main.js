// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {

    // ========== TTS Bot Section ==========
    const output = document.getElementById("output");
    if (output) { // Check to ensure elements exist before adding listeners
        const textInput = document.getElementById("textInput");
        const generateBtn = document.getElementById("generateBtn");
        const audioPlayer = document.getElementById("audioPlayer");

        const hours = new Date().getHours();
        let greeting = "";

        if (hours < 12) greeting = "Good Morning 🌅";
        else if (hours < 18) greeting = "Good Afternoon ☀️";
        else greeting = "Good Evening 🌙";

        let text = `${greeting}! Ready to convert text to speech 🚀`;
        let index = 0;

        function typeWriter() {
            if (index < text.length) {
                output.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        }

        output.textContent = "";
        typeWriter();

        async function generateTTS() {
            const inputText = textInput.value.trim();
            if (!inputText) {
                output.textContent = "Please enter some text first! 📝";
                output.className = "error";
                return;
            }
            generateBtn.disabled = true;
            generateBtn.textContent = "Generating...";
            output.textContent = "Converting text to speech... 🔄";
            output.className = "loading";
            audioPlayer.style.display = "none";
            try {
                const response = await fetch('/generate-tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: inputText })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data.audio_url) {
                    output.textContent = `✅ Speech generated successfully! Playing: "${inputText}"`;
                    output.className = "success";
                    audioPlayer.src = data.audio_url;
                    audioPlayer.style.display = "block";
                    const audioTest = new Audio(data.audio_url);
                    audioTest.onerror = () => {
                        output.textContent = `❌ Error: Audio file could not be loaded. URL: ${data.audio_url}`;
                        output.className = "error";
                    };
                    audioTest.oncanplay = async () => {
                        try {
                            await audioPlayer.play();
                        } catch (playError) {
                            console.error("Auto-play prevented by browser:", playError);
                            output.textContent += " (Click play button to hear the audio)";
                        }
                    };
                } else {
                    throw new Error("No audio URL received from server");
                }
            } catch (error) {
                console.error('Error generating TTS:', error);
                output.textContent = `❌ Error generating speech: ${error.message}`;
                output.className = "error";
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = "🎵 Generate Speech";
            }
        }
        textInput.addEventListener('keypress', function(event) { if (event.key === 'Enter') generateTTS(); });
        textInput.addEventListener('input', function() { output.className = ""; });
        generateBtn.addEventListener('click', generateTTS);
    }

    // ========== Echo Bot v1 Section ==========
    const startRecordingBtn = document.getElementById("startRecordingBtn");
    if (startRecordingBtn) {
        const stopRecordingBtn = document.getElementById("stopRecordingBtn");
        const echoAudio = document.getElementById("echoAudio");
        const uploadStatus = document.getElementById("uploadStatus");
        const transcription = document.getElementById("transcription");

        let mediaRecorder;
        let audioChunks = [];

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    echoAudio.src = audioUrl;
                    echoAudio.style.display = "block";
                    echoAudio.play();
                    uploadStatus.textContent = "Uploading audio for transcription... 🔄";
                    uploadStatus.className = "loading";
                    transcription.textContent = "Waiting for transcription...";
                    try {
                        const formData = new FormData();
                        formData.append("file", audioBlob, "recording.webm");
                        const response = await fetch('/transcribe/file', {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const data = await response.json();
                        if (data.transcript) {
                            transcription.textContent = `✅ Transcription: ${data.transcript}`;
                            transcription.className = "success";
                            uploadStatus.textContent = `✅ Audio processed successfully!`;
                            uploadStatus.className = "success";
                        } else {
                            throw new Error(data.message || "No transcription received");
                        }
                    } catch (error) {
                        console.error('Error transcribing audio:', error);
                        transcription.textContent = `❌ Error: ${error.message}`;
                        transcription.className = "error";
                        uploadStatus.textContent = `❌ Error processing audio: ${error.message}`;
                        uploadStatus.className = "error";
                    }
                    audioChunks = [];
                };
                startRecordingBtn.onclick = () => {
                    mediaRecorder.start();
                    startRecordingBtn.disabled = true;
                    stopRecordingBtn.disabled = false;
                    uploadStatus.textContent = "Recording... 🎙️";
                    uploadStatus.className = "";
                    transcription.textContent = "Transcription will appear here...";
                };
                stopRecordingBtn.onclick = () => {
                    mediaRecorder.stop();
                    startRecordingBtn.disabled = false;
                    stopRecordingBtn.disabled = true;
                    uploadStatus.textContent = "Processing recording... 🔄";
                    uploadStatus.className = "loading";
                };
            })
            .catch(err => {
                console.error("Microphone access denied:", err);
                uploadStatus.textContent = "❌ Microphone access denied. Please allow microphone access.";
                uploadStatus.className = "error";
                transcription.textContent = "Transcription unavailable due to microphone error.";
                transcription.className = "error";
            });
    }

    // ========== Echo Bot v2 Section ==========
    const startRecordingV2Btn = document.getElementById("startRecordingV2Btn");
    if (startRecordingV2Btn) {
        const stopRecordingV2Btn = document.getElementById("stopRecordingV2Btn");
        const echoV2Audio = document.getElementById("echoV2Audio");
        const echoV2Status = document.getElementById("echoV2Status");

        let mediaRecorderV2;
        let audioChunksV2 = [];

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorderV2 = new MediaRecorder(stream);
                mediaRecorderV2.ondataavailable = event => {
                    audioChunksV2.push(event.data);
                };
                mediaRecorderV2.onstop = async () => {
                    const audioBlob = new Blob(audioChunksV2, { type: "audio/webm" });
                    const formData = new FormData();
                    formData.append("file", audioBlob, "recording.webm");
                    echoV2Status.textContent = "Processing audio... 🔄";
                    echoV2Status.className = "loading";
                    echoV2Audio.style.display = "none";
                    try {
                        const response = await fetch('/tts/echo', {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
                        }
                        const data = await response.json();
                        if (data.audio_url) {
                            echoV2Audio.src = data.audio_url;
                            echoV2Audio.style.display = "block";
                            await echoV2Audio.play();
                            echoV2Status.textContent = `✅ Echo generated successfully!`;
                            echoV2Status.className = "success";
                        } else {
                            throw new Error("No audio URL received from server");
                        }
                    } catch (error) {
                        console.error('Error generating echo:', error);
                        echoV2Status.textContent = `❌ Error: ${error.message}`;
                        echoV2Status.className = "error";
                    }
                    audioChunksV2 = [];
                };
                startRecordingV2Btn.onclick = () => {
                    if (mediaRecorderV2.state === "recording") return;
                    mediaRecorderV2.start();
                    startRecordingV2Btn.disabled = true;
                    stopRecordingV2Btn.disabled = false;
                    echoV2Status.textContent = "Recording... 🎙️";
                    echoV2Status.className = "";
                };
                stopRecordingV2Btn.onclick = () => {
                    if (mediaRecorderV2.state !== "recording") return;
                    mediaRecorderV2.stop();
                    startRecordingV2Btn.disabled = false;
                    stopRecordingV2Btn.disabled = true;
                    echoV2Status.textContent = "Processing recording... 🔄";
                    echoV2Status.className = "loading";
                };
            })
            .catch(err => {
                console.error("Microphone access denied:", err);
                echoV2Status.textContent = "❌ Microphone access denied.";
                echoV2Status.className = "error";
            });
    }

    // ========== Full AI Voice Bot (Day 10 UPGRADED) Section ==========
    const startBtn = document.getElementById("startLLMRecordBtn");
    if (startBtn) {
        const stopBtn = document.getElementById("stopLLMRecordBtn");
        const audioPlayer = document.getElementById("llmBotAudio");
        const statusDisplay = document.getElementById("llmBotStatus");

        // === DAY 10 FEATURE START: Session ID Management ===
        function getSessionId() {
            let params = new URLSearchParams(window.location.search);
            let sessionId = params.get('session_id');
            if (!sessionId) {
                sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                window.history.replaceState({}, '', `?session_id=${sessionId}`);
            }
            return sessionId;
        }
        const sessionId = getSessionId();
        // === DAY 10 FEATURE END ===

        let llmMediaRecorder;
        let llmAudioChunks = [];
        let audioQueue = [];
        let currentAudioIndex = 0;

        const startRecording = () => {
            if (llmMediaRecorder && llmMediaRecorder.state === "inactive") {
                llmAudioChunks = [];
                llmMediaRecorder.start();
                startBtn.disabled = true;
                stopBtn.disabled = false;
                statusDisplay.textContent = "Listening... 👂";
                statusDisplay.className = "";
            }
        };

        const stopRecording = () => {
            if (llmMediaRecorder && llmMediaRecorder.state === "recording") {
                llmMediaRecorder.stop();
                startBtn.disabled = false;
                stopBtn.disabled = true;
                statusDisplay.textContent = "Processing your voice... 🔄";
                statusDisplay.className = "loading";
            }
        };
        
        // === DAY 10 FEATURE START: Auto-recording Logic ===
        function playNextInQueue() {
            if (currentAudioIndex < audioQueue.length) {
                audioPlayer.src = audioQueue[currentAudioIndex];
                audioPlayer.style.display = "block";
                audioPlayer.play();
                currentAudioIndex++;
            } else {
                // All audios have been played, start listening for the next turn
                statusDisplay.textContent = "Response finished. Ask another question!";
                statusDisplay.className = "success";
                startRecording(); // Automatically start recording again
            }
        }
        // === DAY 10 FEATURE END ===

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                llmMediaRecorder = new MediaRecorder(stream);

                llmMediaRecorder.ondataavailable = event => {
                    llmAudioChunks.push(event.data);
                };

                llmMediaRecorder.onstop = async () => {
                    if (llmAudioChunks.length === 0) {
                        statusDisplay.textContent = "No audio recorded. Please try again.";
                        startBtn.disabled = false;
                        return;
                    }
                    const audioBlob = new Blob(llmAudioChunks, { type: "audio/webm" });
                    const formData = new FormData();
                    formData.append("file", audioBlob, "recording.webm");

                    statusDisplay.textContent = "Got it! Thinking of a response... 🤔";
                    statusDisplay.className = "loading";
                    audioPlayer.style.display = "none";

                    try {
                        // === DAY 10 FEATURE: Call new conversational endpoint ===
                        const response = await fetch(`/agent/chat/${sessionId}`, {
                            method: 'POST',
                            body: formData,
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.detail || `Server error: ${response.status}`);
                        }

                        const data = await response.json();
                        
                        statusDisplay.textContent = `You: "${data.user_query}"`;
                        statusDisplay.className = "";

                        if (data.audio_urls && data.audio_urls.length > 0) {
                            audioQueue = data.audio_urls;
                            currentAudioIndex = 0;
                            playNextInQueue();
                        } else if (data.llm_response) {
                            // Handle cases where audio might not generate but we have a text response
                            statusDisplay.textContent = `Bot: ${data.llm_response}`;
                            setTimeout(startRecording, 1500); // Wait a bit then start recording
                        } else {
                            throw new Error("Received no audio response from the server.");
                        }
                    } catch (error) {
                        console.error('Error during LLM query:', error);
                        statusDisplay.textContent = `❌ An error occurred: ${error.message}`;
                        statusDisplay.className = "error";
                        startBtn.disabled = false; // Re-enable button on error
                    } finally {
                        llmAudioChunks = [];
                    }
                };
                startBtn.onclick = startRecording;
                stopBtn.onclick = stopRecording;
                audioPlayer.onended = playNextInQueue;

                startBtn.disabled = false;
                statusDisplay.textContent = "Ready! Click 'Ask Question' to start.";
            })
            .catch(err => {
                console.error("Microphone access denied for LLM Bot:", err);
                statusDisplay.textContent = "❌ Microphone access is required for this bot to work.";
                statusDisplay.className = "error";
                startBtn.disabled = true;
            });
    }

});