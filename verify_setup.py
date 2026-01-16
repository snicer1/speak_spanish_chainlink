"""
Verification script to check if the environment is properly set up.
This script checks imports and environment variables before running the app.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_imports():
    """Verify all required imports are available."""
    print("Checking imports...")

    try:
        import chainlit
        print("  ✅ chainlit")
    except ImportError as e:
        print(f"  ❌ chainlit: {e}")
        return False

    try:
        import openai
        print("  ✅ openai")
    except ImportError as e:
        print(f"  ❌ openai: {e}")
        return False

    try:
        import elevenlabs
        print("  ✅ elevenlabs")
    except ImportError as e:
        print(f"  ❌ elevenlabs: {e}")
        return False

    try:
        from dotenv import load_dotenv
        print("  ✅ python-dotenv")
    except ImportError as e:
        print(f"  ❌ python-dotenv: {e}")
        return False

    try:
        import pydantic
        print("  ✅ pydantic")
    except ImportError as e:
        print(f"  ❌ pydantic: {e}")
        return False

    return True


def verify_environment():
    """Verify required environment variables are set."""
    print("\nChecking environment variables...")

    openai_key = os.getenv("OPENAI_API_KEY")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")

    all_present = True

    if openai_key:
        print(f"  ✅ OPENAI_API_KEY is set")
    else:
        print(f"  ❌ OPENAI_API_KEY is not set")
        all_present = False

    if elevenlabs_key:
        print(f"  ✅ ELEVENLABS_API_KEY is set")
    else:
        print(f"  ❌ ELEVENLABS_API_KEY is not set")
        all_present = False

    return all_present


def verify_config():
    """Verify config.py loads correctly."""
    print("\nChecking config.py...")

    try:
        from config import Config
        print("  ✅ Config class loads successfully")
        print(f"  ✅ Chat Model: {Config.CHAT_MODEL}")
        print(f"  ✅ STT Model: {Config.STT_MODEL}")
        print(f"  ✅ ElevenLabs Voice: {Config.ELEVENLABS_VOICE_ID}")
        print(f"  ✅ ElevenLabs Model: {Config.ELEVENLABS_MODEL}")
        return True
    except Exception as e:
        print(f"  ❌ Config error: {e}")
        return False


def verify_services():
    """Verify services.py loads correctly."""
    print("\nChecking services.py...")

    try:
        from services import get_chat_completion, text_to_speech, speech_to_text
        print("  ✅ All service functions imported successfully")
        return True
    except Exception as e:
        print(f"  ❌ Services error: {e}")
        return False


def main():
    """Run all verification checks."""
    print("=" * 60)
    print("ENVIRONMENT VERIFICATION")
    print("=" * 60)

    imports_ok = verify_imports()
    env_ok = verify_environment()
    config_ok = verify_config()
    services_ok = verify_services()

    print("\n" + "=" * 60)

    if imports_ok and env_ok and config_ok and services_ok:
        print("✅ Environment OK")
        print("=" * 60)
        print("\nYou can now run: chainlit run app.py -w")
        return 0
    else:
        print("❌ Missing Config")
        print("=" * 60)
        print("\nPlease fix the issues above before running the app.")
        print("Make sure to:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Copy .env.example to .env and add your API keys")
        return 1


if __name__ == "__main__":
    sys.exit(main())
