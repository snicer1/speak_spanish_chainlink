"""
Business logic and OpenAI API wrappers.
Pure logic with no UI code - all Chainlit decorators are in app.py.
"""

from openai import AsyncOpenAI
from elevenlabs.client import ElevenLabs
from config import Config


# Initialize OpenAI client
client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)

# Initialize ElevenLabs client
elevenlabs_client = ElevenLabs(api_key=Config.ELEVENLABS_API_KEY)


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


async def text_to_speech(text: str) -> bytes:
    """
    Convert text to speech using ElevenLabs.

    Args:
        text: The text to convert to speech

    Returns:
        Audio data as bytes (MP3 format)
    """
    # ElevenLabs generate returns an iterator of audio chunks
    # We need to collect all chunks into bytes
    audio_generator = elevenlabs_client.generate(
        text=text,
        voice=Config.ELEVENLABS_VOICE_ID,
        model=Config.ELEVENLABS_MODEL
    )

    # Collect all audio chunks
    audio_bytes = b"".join(audio_generator)
    return audio_bytes


async def speech_to_text(audio_data: bytes) -> str:
    """
    Convert speech to text using OpenAI Whisper.
    Forces Spanish language detection.

    Args:
        audio_data: Audio data as bytes

    Returns:
        Transcribed text
    """
    # Create a file-like object from bytes
    from io import BytesIO
    audio_file = BytesIO(audio_data)
    audio_file.name = "audio.wav"

    response = await client.audio.transcriptions.create(
        model=Config.STT_MODEL,
        file=audio_file,
        language="es"  # Force Spanish language detection
    )
    return response.text
