"""
Language configuration module for multi-language support.
Defines supported languages, voice IDs, and dynamic system prompts.
"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class LanguageConfig:
    """Configuration for a supported language."""
    name: str
    code: str  # ISO 639-1 code
    whisper_code: str  # Whisper API language code
    deepl_code: str  # DeepL API language code
    voice_id: str  # ElevenLabs voice ID
    tutor_name: str  # Name of the tutor in the language
    welcome_message: str  # Welcome message in the target language


# Supported target languages (languages the user wants to learn)
SUPPORTED_LANGUAGES: Dict[str, LanguageConfig] = {
    "spanish": LanguageConfig(
        name="Spanish",
        code="es",
        whisper_code="es",
        deepl_code="ES",
        voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
        tutor_name="Profesor",
        welcome_message="¡Hola! Soy tu tutor de español. Haz clic en el micrófono para hablar, o escribe tu mensaje. ¡Vamos a practicar!"
    ),
    "french": LanguageConfig(
        name="French",
        code="fr",
        whisper_code="fr",
        deepl_code="FR",
        voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella voice
        tutor_name="Professeur",
        welcome_message="Bonjour! Je suis votre tuteur de français. Cliquez sur le microphone pour parler, ou écrivez votre message. Pratiquons ensemble!"
    ),
    "german": LanguageConfig(
        name="German",
        code="de",
        whisper_code="de",
        deepl_code="DE",
        voice_id="pNInz6obpgDQGcFmaJgB",  # Adam voice
        tutor_name="Lehrer",
        welcome_message="Hallo! Ich bin dein Deutschlehrer. Klicke auf das Mikrofon zum Sprechen oder schreibe deine Nachricht. Lass uns üben!"
    ),
    "italian": LanguageConfig(
        name="Italian",
        code="it",
        whisper_code="it",
        deepl_code="IT",
        voice_id="yoZ06aMxZJJ28mfd3POQ",  # Sam voice
        tutor_name="Insegnante",
        welcome_message="Ciao! Sono il tuo insegnante di italiano. Clicca sul microfono per parlare, o scrivi il tuo messaggio. Pratichiamo!"
    ),
    "portuguese": LanguageConfig(
        name="Portuguese",
        code="pt",
        whisper_code="pt",
        deepl_code="PT-PT",
        voice_id="jsCqWAovK2LkecY7zXl4",  # Fin voice
        tutor_name="Professor",
        welcome_message="Olá! Sou o seu professor de português. Clique no microfone para falar, ou escreva a sua mensagem. Vamos praticar!"
    )
}


# Mother tongue languages (the user's native language for explanations)
MOTHER_TONGUES: Dict[str, Dict[str, str]] = {
    "english": {
        "name": "English",
        "code": "en",
        "deepl_code": "EN-US"
    },
    "spanish": {
        "name": "Spanish",
        "code": "es",
        "deepl_code": "ES"
    },
    "french": {
        "name": "French",
        "code": "fr",
        "deepl_code": "FR"
    },
    "german": {
        "name": "German",
        "code": "de",
        "deepl_code": "DE"
    },
    "polish": {
        "name": "Polish",
        "code": "pl",
        "deepl_code": "PL"
    }
}


def get_system_prompt(target_lang: str, mother_tongue: str) -> str:
    """
    Generate a dynamic system prompt based on target language and mother tongue.

    Args:
        target_lang: The language the user wants to learn (e.g., "spanish")
        mother_tongue: The user's native language (e.g., "english")

    Returns:
        A customized system prompt for the language tutor
    """
    target_config = SUPPORTED_LANGUAGES.get(target_lang)
    mother_config = MOTHER_TONGUES.get(mother_tongue)

    if not target_config or not mother_config:
        # Fallback to Spanish/English if invalid configuration
        target_config = SUPPORTED_LANGUAGES["spanish"]
        mother_config = MOTHER_TONGUES["english"]

    target_lang_name = target_config.name
    mother_lang_name = mother_config["name"]

    return f"""You are a patient and encouraging {target_lang_name} tutor.
Your student is learning {target_lang_name} and speaks slowly, so give them time and be supportive.
The student's native language is {mother_lang_name}.

Guidelines:
- Respond in {target_lang_name} at an appropriate level for the learner
- Correct mistakes gently and explain why (you can use {mother_lang_name} for complex explanations if needed)
- Encourage the student to keep practicing
- Use simple vocabulary and grammar initially
- Ask follow-up questions to keep the conversation going
- Be patient and supportive
- Adapt your responses to match the student's proficiency level"""
