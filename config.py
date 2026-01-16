"""
Configuration module for Spanish learning Chainlit app.
All adjustable parameters are defined here (code-first configuration).
Secrets (API keys) are loaded from .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Static configuration class for all app settings."""

    # API Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # Model Settings
    CHAT_MODEL = "gpt-4o-mini"
    TTS_MODEL = "tts-1"
    STT_MODEL = "whisper-1"

    # Voice Settings
    TTS_VOICE = "alloy"  # Options: alloy, echo, fable, onyx, nova, shimmer
    TTS_SPEED = 1.0  # Range: 0.25 to 4.0

    # Audio Settings
    USE_VAD = False  # CRITICAL: NO Voice Activity Detection - user speaks slowly

    # System Prompt
    SYSTEM_PROMPT = """You are a patient and encouraging Spanish tutor.
Your student is learning Spanish and speaks slowly, so give them time and be supportive.

Guidelines:
- Respond in Spanish at an appropriate level for the learner
- Correct mistakes gently and explain why
- Encourage the student to keep practicing
- Use simple vocabulary and grammar initially
- Ask follow-up questions to keep the conversation going
- Be patient and supportive"""

    # Session Settings
    MAX_HISTORY_MESSAGES = 20  # Maximum number of messages to keep in history
