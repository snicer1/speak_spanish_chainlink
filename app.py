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
from chainlit.input_widget import Select
from pathlib import Path
from config import Config
from services import get_chat_completion, text_to_speech, speech_to_text
from languages import SUPPORTED_LANGUAGES, MOTHER_TONGUES, get_system_prompt


def get_language_settings():
    """Get current language settings from session or defaults."""
    target_language = cl.user_session.get("target_language", Config.DEFAULT_TARGET_LANGUAGE)
    mother_tongue = cl.user_session.get("mother_tongue", Config.DEFAULT_MOTHER_TONGUE)
    return target_language, mother_tongue


def get_current_language_config():
    """Get the current language configuration object."""
    target_language, _ = get_language_settings()
    return SUPPORTED_LANGUAGES.get(target_language, SUPPORTED_LANGUAGES["spanish"])


@cl.on_chat_start
async def on_chat_start():
    """Initialize the chat session."""
    # Set default language settings
    cl.user_session.set("target_language", Config.DEFAULT_TARGET_LANGUAGE)
    cl.user_session.set("mother_tongue", Config.DEFAULT_MOTHER_TONGUE)

    # Get language configuration
    lang_config = get_current_language_config()
    target_language, mother_tongue = get_language_settings()

    # Create ChatSettings with language selection dropdowns
    settings = await cl.ChatSettings(
        [
            Select(
                id="target_language",
                label="Target Language (Language to Learn)",
                values=list(SUPPORTED_LANGUAGES.keys()),
                initial_value=target_language,
            ),
            Select(
                id="mother_tongue",
                label="Mother Tongue (Your Native Language)",
                values=list(MOTHER_TONGUES.keys()),
                initial_value=mother_tongue,
            ),
        ]
    ).send()

    # Initialize message history with dynamic system prompt
    system_prompt = get_system_prompt(target_language, mother_tongue)
    cl.user_session.set("message_history", [
        {"role": "system", "content": system_prompt}
    ])

    # Send welcome message in the target language
    welcome_msg = f"{lang_config.welcome_message}\n\n💡 _Tip: Click the settings gear icon (⚙️) in the top right to change languages anytime!_"
    await cl.Message(
        content=welcome_msg,
        author=lang_config.tutor_name
    ).send()

    # Emit initial settings to frontend for translation feature
    mother_config = MOTHER_TONGUES[mother_tongue]
    await cl.Message(
        content="",
        metadata={
            "type": "settings_sync",
            "target_deepl_code": lang_config.deepl_code,
            "mother_deepl_code": mother_config["deepl_code"]
        }
    ).send()


@cl.on_settings_update
async def on_settings_update(settings):
    """Handle language settings updates."""
    new_target_language = settings.get("target_language")
    new_mother_tongue = settings.get("mother_tongue")

    # Validation: Reject if target_language == mother_tongue
    if new_target_language == new_mother_tongue:
        await cl.Message(
            content="❌ Error: Your target language cannot be the same as your mother tongue. Please select different languages.",
            author="System"
        ).send()
        return

    # Update session settings
    cl.user_session.set("target_language", new_target_language)
    cl.user_session.set("mother_tongue", new_mother_tongue)

    # Update system prompt in message history
    new_system_prompt = get_system_prompt(new_target_language, new_mother_tongue)
    message_history = cl.user_session.get("message_history", [])
    if message_history and message_history[0]["role"] == "system":
        message_history[0]["content"] = new_system_prompt
    else:
        message_history.insert(0, {"role": "system", "content": new_system_prompt})
    cl.user_session.set("message_history", message_history)

    # Get new language configuration
    new_lang_config = SUPPORTED_LANGUAGES[new_target_language]
    mother_config = MOTHER_TONGUES[new_mother_tongue]

    # Notify user of language change
    await cl.Message(
        content=f"✅ Language settings updated!\n\n**Target Language:** {new_lang_config.name}\n**Mother Tongue:** {mother_config['name']}\n\nLet's continue practicing in {new_lang_config.name}!",
        author=new_lang_config.tutor_name
    ).send()

    # Emit updated settings to frontend for translation feature
    await cl.Message(
        content="",
        metadata={
            "type": "settings_sync",
            "target_deepl_code": new_lang_config.deepl_code,
            "mother_deepl_code": mother_config["deepl_code"]
        }
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle incoming text messages."""
    # Get current language configuration
    lang_config = get_current_language_config()

    # Get message history
    message_history = cl.user_session.get("message_history")

    # Add user message to history
    message_history.append({"role": "user", "content": message.content})

    # Trim history if too long (keep system prompt + recent messages)
    if len(message_history) > Config.MAX_HISTORY_MESSAGES + 1:
        message_history = [message_history[0]] + message_history[-(Config.MAX_HISTORY_MESSAGES):]

    # Show progress indicator during processing
    async with cl.Step(name="Thinking") as step:
        # Get AI response
        response_text = await get_chat_completion(message_history)

        # Generate audio response with language-specific voice
        try:
            audio_data = await text_to_speech(response_text, voice_id=lang_config.voice_id)

            # Ensure public directory exists
            Path("public").mkdir(exist_ok=True)

            # Save audio to file
            audio_path = "public/output.mp3"
            with open(audio_path, "wb") as f:
                f.write(audio_data)

            # Create audio element with path
            audio_element = cl.Audio(
                name="response",
                path=audio_path,
                display="inline",
                auto_play=True
            )
        except Exception as e:
            print(f"Error generating audio: {e}")
            audio_element = None

    # Add assistant response to history
    message_history.append({"role": "assistant", "content": response_text})

    # Update session
    cl.user_session.set("message_history", message_history)

    # Send single message with text and audio
    elements = [audio_element] if audio_element else []
    await cl.Message(
        content=response_text,
        elements=elements,
        author=lang_config.tutor_name
    ).send()


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
    # Get current language configuration
    lang_config = get_current_language_config()

    # Get buffered audio data
    audio_buffer = cl.user_session.get("audio_buffer", [])

    if not audio_buffer:
        return

    # Clear buffer
    cl.user_session.set("audio_buffer", [])

    # Combine audio chunks
    audio_data = b"".join(audio_buffer)

    # Transcribe audio with language-specific recognition
    try:
        transcribed_text = await speech_to_text(audio_data, language=lang_config.whisper_code)

        # Send user's transcription as a user message
        await cl.Message(
            content=transcribed_text,
            author="user",
            type="user_message"
        ).send()

        # Get message history
        message_history = cl.user_session.get("message_history")

        # Add user message to history
        message_history.append({"role": "user", "content": transcribed_text})

        # Trim history if too long
        if len(message_history) > Config.MAX_HISTORY_MESSAGES + 1:
            message_history = [message_history[0]] + message_history[-(Config.MAX_HISTORY_MESSAGES):]

        # Show progress indicator during processing
        async with cl.Step(name="Thinking") as step:
            # Get AI response
            response_text = await get_chat_completion(message_history)

            # Generate audio response with language-specific voice
            try:
                audio_bytes = await text_to_speech(response_text, voice_id=lang_config.voice_id)

                # Ensure public directory exists
                Path("public").mkdir(exist_ok=True)

                # Save audio to file
                audio_path = "public/output.mp3"
                with open(audio_path, "wb") as f:
                    f.write(audio_bytes)

                # Create audio element with path
                audio_element = cl.Audio(
                    name="response",
                    path=audio_path,
                    display="inline",
                    auto_play=True
                )
            except Exception as e:
                print(f"Error generating audio: {e}")
                audio_element = None

        # Add assistant response to history
        message_history.append({"role": "assistant", "content": response_text})

        # Update session
        cl.user_session.set("message_history", message_history)

        # Send single message with text and audio
        elements = [audio_element] if audio_element else []
        await cl.Message(
            content=response_text,
            elements=elements,
            author=lang_config.tutor_name
        ).send()

    except Exception as e:
        print(f"Error processing audio: {e}")
        await cl.Message(
            content="Sorry, I couldn't process your audio. Please try again.",
            author=lang_config.tutor_name
        ).send()
