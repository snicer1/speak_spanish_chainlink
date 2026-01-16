# Project Guidelines & Architecture

## Tech Stack
- **Framework:** Chainlit (Python)
- **TTS:** ElevenLabs (Critical)
- **STT:** OpenAI Whisper
- **Config:** `.chainlit/config.toml` (REQUIRED for audio behavior)

## Critical Rules (Strict Enforcement)

1. **Audio Behavior ("Push-to-Talk"):**
   - The user speaks slowly. The bot MUST NOT submit automatically on silence.
   - **MANDATORY FILE:** You must create `.chainlit/config.toml`.
   - **MANDATORY SETTINGS in TOML:**
     ```toml
     [features.audio]
     min_decibels = -100     # Force mic to stay open
     silence_timeout = 500000 # Wait 500,000ms (8 minutes) for silence
     chunk_duration = 3000
     ```
   - **Code:** Use `@cl.on_audio_end`. Do NOT use `@cl.on_audio_chunk`.

2. **No Custom JS Hacks:** - DELETE `public/script.js` if it exists. Rely purely on the TOML config above.

3. **Verification Protocol:**
   - Update `verify_setup.py` to explicitly check if `.chainlit/config.toml` exists AND contains `silence_timeout`.
   - If the file is missing, the script must fail.

4. **User Experience:**
   - User clicks Mic -> Starts recording.
   - User clicks Stop Square -> Stops and sends.
   - No auto-sending.