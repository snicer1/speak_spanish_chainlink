"""
Quick test to verify the app configuration loads correctly
"""

import sys

def test_config():
    """Test that config loads without errors"""
    try:
        from config import Config
        print("✓ Config loaded successfully")
        print(f"  - Model: {Config.CHAT_MODEL}")
        print(f"  - Voice: {Config.TTS_VOICE}")
        print(f"  - VAD: {Config.USE_VAD}")
        return True
    except Exception as e:
        print(f"✗ Config failed: {e}")
        return False

def test_services():
    """Test that services import without errors"""
    try:
        from services import client
        print("✓ Services loaded successfully")
        print(f"  - OpenAI client initialized")
        return True
    except Exception as e:
        print(f"✗ Services failed: {e}")
        return False

def test_app():
    """Test that app loads without errors"""
    try:
        import app
        print("✓ App loaded successfully")
        return True
    except Exception as e:
        print(f"✗ App failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Spanish Learning App Configuration\n")

    results = [
        test_config(),
        test_services(),
        test_app()
    ]

    if all(results):
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print("\n✗ Some tests failed")
        sys.exit(1)
