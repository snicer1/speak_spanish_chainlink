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
    voice_id: str  # edge-tts voice name (default voice)
    voices: Dict[str, str]  # Available voices: {voice_id: display_label}
    tutor_name: str  # Name of the tutor in the language
    welcome_message: str  # Welcome message in the target language


# Supported target languages (languages the user wants to learn)
SUPPORTED_LANGUAGES: Dict[str, LanguageConfig] = {
    "spanish": LanguageConfig(
        name="Spanish",
        code="es",
        whisper_code="es",
        deepl_code="ES",
        voice_id="es-ES-ElviraNeural",  # edge-tts Spanish voice (default)
        voices={
            "es-ES-ElviraNeural": "Elvira (Spain, Female)",
            "es-ES-AlvaroNeural": "Alvaro (Spain, Male)",
            "es-ES-XimenaNeural": "Ximena (Spain, Female)",
            "es-MX-DaliaNeural": "Dalia (Mexico, Female)",
            "es-MX-JorgeNeural": "Jorge (Mexico, Male)"
        },
        tutor_name="Profesor",
        welcome_message="¡Hola! Soy tu tutor de español. Haz clic en el micrófono para hablar, o escribe tu mensaje. ¡Vamos a practicar!"
    ),
    "french": LanguageConfig(
        name="French",
        code="fr",
        whisper_code="fr",
        deepl_code="FR",
        voice_id="fr-FR-DeniseNeural",  # edge-tts French voice (default)
        voices={
            "fr-FR-DeniseNeural": "Denise (France, Female)",
            "fr-FR-HenriNeural": "Henri (France, Male)",
            "fr-FR-EloiseNeural": "Eloise (France, Female)",
            "fr-FR-RemyMultilingualNeural": "Remy (France, Male)",
            "fr-FR-VivienneMultilingualNeural": "Vivienne (France, Female)"
        },
        tutor_name="Professeur",
        welcome_message="Bonjour! Je suis votre tuteur de français. Cliquez sur le microphone pour parler, ou écrivez votre message. Pratiquons ensemble!"
    ),
    "german": LanguageConfig(
        name="German",
        code="de",
        whisper_code="de",
        deepl_code="DE",
        voice_id="de-DE-KatjaNeural",  # edge-tts German voice (default)
        voices={
            "de-DE-KatjaNeural": "Katja (Germany, Female)",
            "de-DE-ConradNeural": "Conrad (Germany, Male)",
            "de-DE-AmalaNeural": "Amala (Germany, Female)",
            "de-DE-KillianNeural": "Killian (Germany, Male)",
            "de-DE-FlorianMultilingualNeural": "Florian (Germany, Male)"
        },
        tutor_name="Lehrer",
        welcome_message="Hallo! Ich bin dein Deutschlehrer. Klicke auf das Mikrofon zum Sprechen oder schreibe deine Nachricht. Lass uns üben!"
    ),
    "italian": LanguageConfig(
        name="Italian",
        code="it",
        whisper_code="it",
        deepl_code="IT",
        voice_id="it-IT-ElsaNeural",  # edge-tts Italian voice (default)
        voices={
            "it-IT-ElsaNeural": "Elsa (Italy, Female)",
            "it-IT-DiegoNeural": "Diego (Italy, Male)",
            "it-IT-IsabellaNeural": "Isabella (Italy, Female)",
            "it-IT-GiuseppeMultilingualNeural": "Giuseppe (Italy, Male)"
        },
        tutor_name="Insegnante",
        welcome_message="Ciao! Sono il tuo insegnante di italiano. Clicca sul microfono per parlare, o scrivi il tuo messaggio. Pratichiamo!"
    ),
    "portuguese": LanguageConfig(
        name="Portuguese",
        code="pt",
        whisper_code="pt",
        deepl_code="PT-PT",
        voice_id="pt-PT-RaquelNeural",  # edge-tts Portuguese voice (default)
        voices={
            "pt-PT-RaquelNeural": "Raquel (Portugal, Female)",
            "pt-PT-DuarteNeural": "Duarte (Portugal, Male)",
            "pt-BR-FranciscaNeural": "Francisca (Brazil, Female)",
            "pt-BR-AntonioNeural": "Antonio (Brazil, Male)",
            "pt-BR-ThalitaMultilingualNeural": "Thalita (Brazil, Female)"
        },
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


def get_system_prompt(target_lang: str, mother_tongue: str, context: str = "") -> str:
    """
    Generate a dynamic system prompt based on target language and mother tongue.

    Args:
        target_lang: The language the user wants to learn (e.g., "spanish")
        mother_tongue: The user's native language (e.g., "english")
        context: Optional topic focus for the conversation (e.g., "phrasal verbs")

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

    prompt = f"""You are a patient and encouraging {target_lang_name} tutor.
Your student is learning {target_lang_name} and speaks slowly, so give them time and be supportive.
The student's native language is {mother_lang_name}.

Guidelines:
- Respond in {target_lang_name} at an appropriate level for the learner
- When the student makes a mistake:
  1. Gently correct the mistake in {target_lang_name}
  2. ALWAYS provide an explanation in {mother_lang_name} using this format:
     📝 **Explanation:** [Your explanation in {mother_lang_name}]
  3. This mother tongue explanation is MANDATORY for every correction
- If the student's response is correct, continue the conversation in {target_lang_name} only
- Encourage the student to keep practicing
- Use simple vocabulary and grammar initially
- Ask follow-up questions to keep the conversation going
- Be patient and supportive
- Adapt your responses to match the student's proficiency level"""

    # Add context section if provided
    if context and context.strip():
        prompt += f"""

FOCUS TOPIC: The student wants to learn about "{context.strip()}".
- Steer conversations towards this topic when natural
- Use vocabulary and examples related to this topic
- Create practice scenarios involving this topic
- If the student diverges, gently bring the conversation back to this focus"""

    return prompt
