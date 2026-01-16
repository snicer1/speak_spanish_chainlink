"""
Chainlit UI and event handling for Spanish learning app.
All UI decorators and event handlers are here.
Business logic is in services.py.
"""

# Fix engineio packet limit for audio streaming
# Must be set BEFORE importing chainlit
from engineio.payload import Payload
Payload.max_decode_packets = 500

import chainlit as cl
from config import Config
from services import get_chat_completion, text_to_speech, speech_to_text


@cl.on_chat_start
async def on_chat_start():
    """Initialize the chat session."""
    # Initialize message history with system prompt
    cl.user_session.set("message_history", [
        {"role": "system", "content": Config.SYSTEM_PROMPT}
    ])

    # Send welcome message
    await cl.Message(
        content="¡Hola! I'm your Spanish tutor. Click the microphone button to speak, or type your message. Let's practice!"
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle incoming text messages."""
    # Get message history
    message_history = cl.user_session.get("message_history")

    # Add user message to history
    message_history.append({"role": "user", "content": message.content})

    # Trim history if too long (keep system prompt + recent messages)
    if len(message_history) > Config.MAX_HISTORY_MESSAGES + 1:
        message_history = [message_history[0]] + message_history[-(Config.MAX_HISTORY_MESSAGES):]

    # Get AI response
    response_text = await get_chat_completion(message_history)

    # Add assistant response to history
    message_history.append({"role": "assistant", "content": response_text})

    # Update session
    cl.user_session.set("message_history", message_history)

    # Send text response
    await cl.Message(content=response_text).send()

    # Generate and send audio response
    try:
        audio_data = await text_to_speech(response_text)
        audio_element = cl.Audio(
            content=audio_data,
            mime="audio/mpeg",
            name="response.mp3"
        )
        await cl.Message(
            content="",
            elements=[audio_element]
        ).send()
    except Exception as e:
        print(f"Error generating audio: {e}")


@cl.on_audio_start
async def on_audio_start():
    """Initialize audio session - required for Chainlit 2.x."""
    # Return True to enable audio connection
    return True


@cl.on_audio_chunk
async def on_audio_chunk(chunk: cl.InputAudioChunk):
    """Handle incoming audio chunks during recording."""
    # Get or initialize audio buffer
    audio_buffer = cl.user_session.get("audio_buffer", [])
    # Append the raw audio data from the chunk
    audio_buffer.append(chunk.data)
    cl.user_session.set("audio_buffer", audio_buffer)


@cl.on_audio_end
async def on_audio_end():
    """Process completed audio recording."""
    # Get buffered audio data
    audio_buffer = cl.user_session.get("audio_buffer", [])

    if not audio_buffer:
        return

    # Clear buffer
    cl.user_session.set("audio_buffer", [])

    # Combine audio chunks
    audio_data = b"".join(audio_buffer)

    # Transcribe audio
    try:
        transcribed_text = await speech_to_text(audio_data)

        # Get message history
        message_history = cl.user_session.get("message_history")

        # Add user message to history
        message_history.append({"role": "user", "content": transcribed_text})

        # Trim history if too long
        if len(message_history) > Config.MAX_HISTORY_MESSAGES + 1:
            message_history = [message_history[0]] + message_history[-(Config.MAX_HISTORY_MESSAGES):]

        # Get AI response
        response_text = await get_chat_completion(message_history)

        # Add assistant response to history
        message_history.append({"role": "assistant", "content": response_text})

        # Update session
        cl.user_session.set("message_history", message_history)

        # Send transcription
        msg = cl.Message(content=f"You said: {transcribed_text}")
        await msg.send()

        # Send text response
        msg = cl.Message(content=response_text)
        await msg.send()

        # Generate and send audio response
        try:
            audio_data = await text_to_speech(response_text)
            audio_element = cl.Audio(
                content=audio_data,
                mime="audio/mpeg",
                name="response.mp3"
            )
            msg = cl.Message(content="", elements=[audio_element])
            await msg.send()
        except Exception as e:
            print(f"Error generating audio: {e}")

    except Exception as e:
        print(f"Error processing audio: {e}")
        msg = cl.Message(content="Sorry, I couldn't process your audio. Please try again.")
        await msg.send()
