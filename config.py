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
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
    DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

    # Database Configuration
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DB_TYPE = os.getenv("DB_TYPE", "mongodb")

    # Model Settings
    CHAT_MODEL = "gpt-4o-mini"
    STT_MODEL = "whisper-1"

    # ElevenLabs Voice Settings
    ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice (default)
    ELEVENLABS_MODEL = "eleven_multilingual_v2"  # Supports Spanish

    # Audio Settings
    USE_VAD = False  # CRITICAL: NO Voice Activity Detection - user speaks slowly

    # Language Settings
    DEFAULT_TARGET_LANGUAGE = "spanish"  # Default language to learn
    DEFAULT_MOTHER_TONGUE = "english"    # Default native language

    # Session Settings
    MAX_HISTORY_MESSAGES = 20  # Maximum number of messages to keep in history
