"""
Business logic and OpenAI API wrappers.
Pure logic with no UI code - all Chainlit decorators are in app.py.
"""

import wave
from io import BytesIO
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


async def speech_to_text(pcm_data: bytes) -> str:
    """
    Convert speech to text using OpenAI Whisper.
    Forces Spanish language detection.

    Chainlit 2.x sends raw PCM audio data (16-bit, 24000 Hz, mono).
    We need to convert it to WAV format before sending to OpenAI.

    Args:
        pcm_data: Raw PCM audio data from Chainlit InputAudioChunk

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
        language="es"  # Force Spanish language detection
    )
    return response.text
