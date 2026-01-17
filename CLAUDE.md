# Project Guidelines & Architecture

## Tech Stack
- **Framework:** Chainlit 2.9.5 (Python 3.13)
- **TTS:** ElevenLabs (Critical)
- **STT:** OpenAI Whisper
- **Config:** `.chainlit/config.toml` (REQUIRED for audio behavior)

## Critical Rules (Strict Enforcement)

1. **Audio Behavior ("Push-to-Talk"):**
   - The user speaks slowly. The bot MUST NOT submit automatically on silence.
   - **MANDATORY FILE:** `.chainlit/config.toml` must exist.
   - **CHAINLIT 2.x LIMITATION:** The config parameters `min_decibels`, `silence_timeout`, and `chunk_duration` were REMOVED in Chainlit 2.0. Only `enabled` and `sample_rate` are supported.
   - **REQUIRED SETTINGS in TOML:**
     ```toml
     [features.audio]
     enabled = true
     sample_rate = 24000
     min_decibels = -100     # NOT SUPPORTED in 2.x (documented only)
     silence_timeout = 500000 # NOT SUPPORTED in 2.x (documented only)
     chunk_duration = 3000    # NOT SUPPORTED in 2.x (documented only)
     ```
   - **Code Requirements:**
     - MUST implement `@cl.on_audio_start` (returns True to enable audio)
     - MUST implement `@cl.on_audio_chunk` to buffer audio data
     - MUST implement `@cl.on_audio_end` to process buffered audio
   - **EngineIO Fix:** Must set `Payload.max_decode_packets = 500` before importing Chainlit to handle audio streaming

2. **Custom JavaScript (REQUIRED WORKAROUND):**
   - Since Chainlit 2.x removed audio config parameters, we MUST use custom JavaScript
   - **File:** `public/audio-control.js` implements push-to-talk behavior
   - **Config:** Set `custom_js = "/public/audio-control.js"` in config.toml
   - This overrides the default auto-stop behavior

3. **Verification Protocol:**
   - `verify_setup.py` checks if `.chainlit/config.toml` exists
   - Verifies Chainlit 2.x version (2.9.5+)
   - Verifies Pydantic 2.x version (2.12.5+)
   - Verifies Python 3.13 (Python 3.14+ has asyncio incompatibilities)

4. **User Experience:**
   - User clicks Mic -> Starts recording
   - User clicks Stop Square -> Stops and sends
   - No auto-sending on silence (enforced via custom JS)

## Development Agents
- **Audio Expert:** Handles `public/audio-control.js` and strict "Push-to-Talk" rules.
- **Tutor Architect:** Manages `services.py` and `config.py` for LLM personality and voice synthesis.
- **Guardian:** Runs `verify_setup.py` and checks dependencies.

## MCP Tools & External Knowledge
- **Context 7:** ALWAYS use this to fetch docs for `chainlit` (v2.x changes rapidly) and `elevenlabs`.
  - *Rule:* Before writing Chainlit audio code, query Context 7 for "latest chainlit audio handling 2.x".
- **Playwright:** Used by QA Agent to verify frontend behavior, specifically the custom `audio-control.js`.

## Agent Roles (Sub-agents)

### 🕵️ QA Engineer (Frontend Tester)
- **Trigger:** Invoked when changes are made to `public/audio-control.js`, `app.py` (UI section), or `.chainlit/config.toml`.
- **Tools:** Playwright (MCP).
- **Mandatory Test Scenario (The "Push-to-Talk" Check):**
  1. Open the app in a browser (headless or headed).
  2. Wait for `audio-control.js` console logs ("Script loaded").
  3. Verify the microphone button exists.
  4. **Critical:** Simulate "Hold Click" on Mic -> Verify recording starts.
  5. **Critical:** Simulate "Release Click" -> Verify recording stops and sends.
  6. Ensure no auto-sending happens on silence before release.

### 🏗️ Audio Expert (Frontend Audio)
- **Focus:** `public/audio-control.js` logic and EngineIO settings.
- **Rule:** Must coordinate with QA Engineer to verify fixes.

### 🎓 Tutor Logic (Backend)
- **Focus:** `services.py`, `config.py` (Prompts).