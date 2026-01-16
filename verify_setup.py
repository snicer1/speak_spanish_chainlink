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
        print(f"  ✅ chainlit (version {chainlit.__version__})")

        # Check for Chainlit 2.x
        major_version = int(chainlit.__version__.split('.')[0])
        if major_version < 2:
            print(f"     ⚠️  Warning: Chainlit {chainlit.__version__} is older than 2.x")
            print(f"     This app requires Chainlit 2.x for audio features")
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
        print(f"  ✅ pydantic (version {pydantic.VERSION})")

        # Check for Pydantic 2.x
        major_version = int(pydantic.VERSION.split('.')[0])
        if major_version < 2:
            print(f"     ⚠️  Warning: Pydantic {pydantic.VERSION} is older than 2.x")
            print(f"     Chainlit 2.x works best with Pydantic 2.x")
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


def verify_chainlit_config():
    """Verify .chainlit/config.toml exists and has Chainlit 2.x audio settings."""
    print("\nChecking .chainlit/config.toml...")

    config_path = ".chainlit/config.toml"

    if not os.path.exists(config_path):
        print(f"  ❌ {config_path} does NOT exist")
        print(f"     This file is MANDATORY!")
        return False

    print(f"  ✅ {config_path} exists")

    # Read and check for Chainlit 2.x audio config
    try:
        with open(config_path, 'r') as f:
            config_content = f.read()

        # Check for Chainlit 2.x version marker
        if 'generated_by = "2.' in config_content:
            print(f"  ✅ Chainlit 2.x config detected")
        else:
            print(f"  ⚠️  Warning: Config may be from Chainlit 1.x")

        # Check for [features.audio] section
        if '[features.audio]' not in config_content:
            print(f"  ❌ {config_path} does NOT contain [features.audio] section")
            print(f"     Audio section is REQUIRED!")
            return False

        print(f"  ✅ Contains [features.audio] section")

        # Check if audio is enabled
        if 'enabled = true' in config_content:
            print(f"  ✅ Audio is enabled")
        else:
            print(f"  ⚠️  Warning: Audio may be disabled (check [features.audio] enabled setting)")

        return True
    except Exception as e:
        print(f"  ❌ Error reading config: {e}")
        return False


def main():
    """Run all verification checks."""
    print("=" * 60)
    print("ENVIRONMENT VERIFICATION (Chainlit 2.x)")
    print("=" * 60)

    # Show Python version
    import sys
    print(f"\nPython version: {sys.version.split()[0]}")
    print()

    imports_ok = verify_imports()
    env_ok = verify_environment()
    config_ok = verify_config()
    services_ok = verify_services()
    chainlit_config_ok = verify_chainlit_config()

    print("\n" + "=" * 60)

    if imports_ok and env_ok and config_ok and services_ok and chainlit_config_ok:
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
        print("  3. Ensure .chainlit/config.toml exists with proper audio settings")
        return 1


if __name__ == "__main__":
    sys.exit(main())
