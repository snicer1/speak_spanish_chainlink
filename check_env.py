"""
Quick environment check script to verify all required services are configured.
Run this before starting the FastAPI server.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()


def check_env():
    """Check if all required environment variables and services are configured."""
    print("=" * 60)
    print("ENVIRONMENT CHECK")
    print("=" * 60)

    all_good = True

    # Check environment variables
    print("\n1. Environment Variables:")
    required_vars = {
        "OPENAI_API_KEY": "OpenAI API (for chat and speech-to-text)",
        "DEEPL_API_KEY": "DeepL API (for translation)",
        "MONGODB_URL": "MongoDB connection URL"
    }

    print("  ℹ️  edge-tts is free - no API key required")

    for var, description in required_vars.items():
        value = os.getenv(var)
        if value and value != f"your_{var.lower()}_here":
            print(f"  ✓ {var}: Configured")
        else:
            print(f"  ✗ {var}: NOT CONFIGURED - {description}")
            all_good = False

    # Check MongoDB connection
    print("\n2. MongoDB Connection:")
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    print(f"  URL: {mongodb_url}")

    try:
        from pymongo import MongoClient
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=3000)
        # Trigger connection
        client.server_info()
        print(f"  ✓ MongoDB is accessible")
        client.close()
    except Exception as e:
        print(f"  ✗ MongoDB connection failed: {e}")
        print(f"     Make sure MongoDB is running:")
        print(f"     - Local: brew services start mongodb-community")
        print(f"     - Atlas: Check your connection string")
        all_good = False

    # Check DeepL API
    print("\n3. DeepL API:")
    deepl_key = os.getenv("DEEPL_API_KEY")
    if deepl_key and deepl_key != "your_deepl_api_key_here":
        try:
            import deepl
            translator = deepl.Translator(deepl_key)
            usage = translator.get_usage()
            print(f"  ✓ DeepL API key is valid")
            if usage.character.limit:
                print(f"     Usage: {usage.character.count:,} / {usage.character.limit:,} characters")
            else:
                print(f"     Usage: {usage.character.count:,} characters (unlimited plan)")
        except Exception as e:
            print(f"  ✗ DeepL API check failed: {e}")
            all_good = False
    else:
        print(f"  ✗ DeepL API key not configured")
        all_good = False

    # Summary
    print("\n" + "=" * 60)
    if all_good:
        print("✓ ALL CHECKS PASSED - Ready to start FastAPI server")
        print("\nStart the server with:")
        print("  uvicorn main:app --reload")
    else:
        print("✗ SOME CHECKS FAILED - Please fix the issues above")
        print("\nTips:")
        print("  1. Copy .env.example to .env: cp .env.example .env")
        print("  2. Add your API keys to .env")
        print("  3. Start MongoDB: brew services start mongodb-community")
    print("=" * 60)

    return all_good


if __name__ == "__main__":
    success = check_env()
    sys.exit(0 if success else 1)
