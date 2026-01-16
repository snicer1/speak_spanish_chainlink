# Project Guidelines & Architecture

## Tech Stack
- **Framework:** Chainlit (Python)
- **AI Provider:** OpenAI (Async API)
- **Configuration:** python-dotenv + config class
- **Frontend Customization:** Custom JavaScript in `public/`

## Architecture Rules (Strict Enforcement)
1. **Code-First Configuration:**
   - Never hardcode settings inside logic files.
   - Use `config.py` for all adjustable parameters (voice, speed, system prompts).
   - Use `.env` for secrets (API Keys).

2. **Clean Code Structure:**
   - `app.py`: UI & Event handling (Chainlit decorators).
   - `services.py`: Pure logic & API calls (OpenAI wrappers).
   - `config.py`: Static configuration class.
   - `public/`: Static assets (JS/CSS).

3. **Audio Behavior (CRITICAL):**
   - **NO VAD (Voice Activity Detection):** The user speaks slowly. Never use silence detection to auto-stop recording.
   - **Interaction Mode:** Push-to-Talk or Toggle via Spacebar.
   - **Feedback:** No system sounds ("dings") on record toggle.

4. **Testing & Running:**
   - Run command: `chainlit run app.py -w`

## User Persona (The Student)
- The user is learning Spanish.
- They speak slowly and need time to think.
- The user prefers "Spacebar" to control the microphone (Custom JS required).