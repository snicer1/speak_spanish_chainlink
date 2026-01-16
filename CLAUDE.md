# Project Guidelines & Architecture

## Tech Stack
- **Framework:** Chainlit (Python)
- **LLM:** OpenAI (gpt-4o)
- **TTS (Text-to-Speech):** ElevenLabs (Critical Requirement)
- **STT (Speech-to-Text):** OpenAI Whisper
- **Configuration:** python-dotenv + config class

## Architecture Rules (Strict Enforcement)
1. **Clean Code Structure:**
   - `app.py`: UI & Event handling (Chainlit decorators).
   - `services.py`: Pure logic & API calls (OpenAI & ElevenLabs wrappers).
   - `config.py`: All adjustable parameters (voice ID, speed, prompts).
   - `.env`: API Keys only.

2. **No Custom JS Hacks:** - DELETE `public/script.js` if exists. 
   - Do NOT use custom JavaScript for audio control. Use native Chainlit features only.

3. **Audio Behavior ("Push-to-Talk"):**
   - The user speaks slowly. The bot MUST NOT submit automatically on silence.
   - **Configuration:** You must generate a `.chainlit/config.toml` file with:
     - `min_decibels = -100` (Hack to prevent auto-stop).
     - `silence_timeout = 500000` (User must manually click stop).
   - **Code:** Use `@cl.on_audio_end`. Do NOT use `@cl.on_audio_chunk`.

4. **ElevenLabs Integration:**
   - Use `elevenlabs` official library.
   - Stream audio bytes directly to Chainlit output.
   - Ensure `ELEVENLABS_API_KEY` is loaded from env.

5. **Testing Protocol (ANTI-HALLUCINATION):**
   - Before finishing any task, you MUST run `python verify_setup.py`.
   - Create `verify_setup.py` to check:
     - Imports of `openai`, `chainlit`, `elevenlabs`.
     - Existence of `.chainlit/config.toml`.
     - Presence of API Keys in environment.
   - Do NOT assume code works. Verify it.

## User Persona (The Student)
- Language: **Spanish** (Español) only.
- Role: Patient Spanish teacher.
- The user thinks slowly. Do not interrupt them.