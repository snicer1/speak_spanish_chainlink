"""
Business logic and OpenAI API wrappers.
Pure logic with no UI code - all Chainlit decorators are in app.py.
"""

import wave
from io import BytesIO
from openai import AsyncOpenAI
from elevenlabs.client import ElevenLabs
from config import Config
import deepl
from typing import Optional


# Initialize OpenAI client
client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)

# Initialize ElevenLabs client
elevenlabs_client = ElevenLabs(api_key=Config.ELEVENLABS_API_KEY)

# Initialize DeepL translator (will be None if API key not set)
deepl_translator = None
if Config.DEEPL_API_KEY:
    deepl_translator = deepl.Translator(Config.DEEPL_API_KEY)


async def get_chat_completion(messages: list) -> str:
    """
    Get a chat completion from OpenAI.

    Args:
        messages: List of message dictionaries with 'role' and 'content'

    Returns:
        The assistant's response text
    """
    response = await client.chat.completions.create(
        model=Config.CHAT_MODEL,
        messages=messages
    )
    return response.choices[0].message.content


async def text_to_speech(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert text to speech using ElevenLabs.

    Args:
        text: The text to convert to speech
        voice_id: Optional ElevenLabs voice ID (defaults to Config.ELEVENLABS_VOICE_ID)

    Returns:
        Audio data as bytes (MP3 format)
    """
    # Use provided voice_id or fall back to default
    selected_voice_id = voice_id or Config.ELEVENLABS_VOICE_ID

    # ElevenLabs SDK 2.x uses text_to_speech.convert()
    # Returns an iterator of audio chunks
    audio_generator = elevenlabs_client.text_to_speech.convert(
        text=text,
        voice_id=selected_voice_id,
        model_id=Config.ELEVENLABS_MODEL,
        output_format="mp3_44100_128"
    )

    # Collect all audio chunks
    audio_bytes = b"".join(audio_generator)
    return audio_bytes


def pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    """
    Convert raw PCM audio data to WAV format.

    Args:
        pcm_data: Raw PCM audio bytes (16-bit signed integers)
        sample_rate: Sample rate in Hz (default: 24000 for Chainlit 2.x)
        channels: Number of audio channels (default: 1 for mono)
        sample_width: Bytes per sample (default: 2 for 16-bit)

    Returns:
        WAV formatted audio data as bytes
    """
    wav_buffer = BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)

    wav_buffer.seek(0)
    return wav_buffer.read()


async def speech_to_text(pcm_data: bytes, language: str = "es") -> str:
    """
    Convert speech to text using OpenAI Whisper.

    Chainlit 2.x sends raw PCM audio data (16-bit, 24000 Hz, mono).
    We need to convert it to WAV format before sending to OpenAI.

    Args:
        pcm_data: Raw PCM audio data from Chainlit InputAudioChunk
        language: Language code for Whisper (default: "es" for Spanish)

    Returns:
        Transcribed text
    """
    # Convert raw PCM to WAV format
    wav_data = pcm_to_wav(pcm_data, sample_rate=24000, channels=1, sample_width=2)

    # Create a file-like object from WAV bytes
    audio_file = BytesIO(wav_data)
    audio_file.name = "audio.wav"

    response = await client.audio.transcriptions.create(
        model=Config.STT_MODEL,
        file=audio_file,
        language=language
    )
    return response.text


async def get_translation(text: str, target_lang: str = "ES") -> str:
    """
    Get translation with database caching.

    Flow:
    1. Check database cache for existing translation
    2. If not found, call DeepL API
    3. Save result to database
    4. Return translation

    Args:
        text: The text to translate
        target_lang: Target language code (e.g., 'ES' for Spanish, 'EN' for English)

    Returns:
        The translated text

    Raises:
        ValueError: If DeepL API key is not configured
        RuntimeError: If database is not connected
    """
    # Import db here to avoid circular imports
    from database import db

    if not db:
        raise RuntimeError("Database not connected. Initialize database in main.py")

    if not deepl_translator:
        raise ValueError("DeepL API key not configured. Set DEEPL_API_KEY in environment.")

    # Normalize language code (DeepL uses uppercase)
    target_lang = target_lang.upper()

    # Check cache first
    cached_translation = await db.get_cached_translation(text, target_lang)
    if cached_translation:
        print(f"Cache hit for: {text[:50]}...")
        return cached_translation

    # Cache miss - call DeepL API
    print(f"Cache miss - calling DeepL API for: {text[:50]}...")
    result = deepl_translator.translate_text(text, target_lang=target_lang)
    translation = result.text

    # Save to cache
    await db.save_translation(text, target_lang, translation)

    return translation
