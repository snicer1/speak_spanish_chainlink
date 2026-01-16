/**
 * Custom recording button for Spanish learning Chainlit app
 * Replaces spacebar with a visible recording button
 */

(function() {
    'use strict';

    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordButton = null;

    console.log('Spanish learning app - custom recording button loaded');

    function createRecordingButton() {
        // Create the recording button
        recordButton = document.createElement('button');
        recordButton.id = 'custom-record-button';
        recordButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span>Start Recording</span>
        `;
        recordButton.onclick = toggleRecording;

        // Style the button
        const style = document.createElement('style');
        style.textContent = `
            #custom-record-button {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 12px;
                padding: 16px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                transition: all 0.3s ease;
            }

            #custom-record-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }

            #custom-record-button.recording {
                background: #ef4444;
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            #custom-record-button svg {
                width: 24px;
                height: 24px;
            }

            /* Recording indicator */
            body.recording::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
                animation: recording-slide 2s linear infinite;
                z-index: 9999;
            }

            @keyframes recording-slide {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);

        // Add to page
        document.body.appendChild(recordButton);
        console.log('Recording button created and added to page');
    }

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }

    async function startRecording() {
        try {
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    console.log('Audio chunk received:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, processing audio...');
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log('Audio blob created:', audioBlob.size, 'bytes');

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Send audio to backend
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;

            // Update button UI
            recordButton.classList.add('recording');
            recordButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                <span>Stop Recording</span>
            `;
            document.body.classList.add('recording');

            console.log('Recording started successfully');
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            console.log('Stopping recording...');
            mediaRecorder.stop();
            isRecording = false;

            // Update button UI
            recordButton.classList.remove('recording');
            recordButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span>Start Recording</span>
            `;
            document.body.classList.remove('recording');
        }
    }

    async function sendAudioToBackend(audioBlob) {
        try {
            console.log('Sending audio to backend...');

            // Show processing message
            const processingMsg = document.createElement('div');
            processingMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; z-index: 9999;';
            processingMsg.textContent = 'Processing audio...';
            document.body.appendChild(processingMsg);

            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1];

                // Send via Chainlit's websocket
                if (window.chainlitSocket) {
                    console.log('Sending via Chainlit socket...');
                    window.chainlitSocket.emit('audio_chunk', {
                        data: base64Audio,
                        mimeType: 'audio/webm'
                    });

                    setTimeout(() => {
                        window.chainlitSocket.emit('audio_end');
                        console.log('Audio sent successfully');
                        document.body.removeChild(processingMsg);
                    }, 100);
                } else {
                    console.error('Chainlit socket not available');
                    processingMsg.textContent = 'Error: Connection not available';
                    processingMsg.style.background = '#ef4444';
                    setTimeout(() => document.body.removeChild(processingMsg), 3000);
                }
            };
        } catch (error) {
            console.error('Error sending audio:', error);
            alert('Error sending audio to server');
        }
    }

    // Initialize when DOM is ready
    function init() {
        if (document.body) {
            createRecordingButton();
        } else {
            setTimeout(init, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
