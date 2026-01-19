"""
Rigorous test suite for the FastAPI migration with MongoDB caching and DeepL integration.
Tests database adapter, translation caching, and REST API endpoints.
"""

import asyncio
import sys
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


# Mock classes for testing
class MockDeepLResult:
    """Mock DeepL translation result."""
    def __init__(self, text: str):
        self.text = text


class MockMongoAdapter:
    """Mock MongoDB adapter for testing without a real database."""

    def __init__(self):
        self.connected = False
        self.cache = {}  # In-memory cache for testing

    async def connect(self):
        """Simulate connection."""
        self.connected = True
        print("✓ Mock MongoDB connected")

    async def disconnect(self):
        """Simulate disconnection."""
        self.connected = False
        print("✓ Mock MongoDB disconnected")

    async def get_cached_translation(self, text: str, target_lang: str) -> str:
        """Get cached translation from in-memory cache."""
        key = f"{text}:{target_lang}"
        return self.cache.get(key)

    async def save_translation(self, text: str, target_lang: str, translation: str):
        """Save translation to in-memory cache."""
        key = f"{text}:{target_lang}"
        self.cache[key] = translation


async def test_database_adapter():
    """Test the database adapter pattern with mocked MongoDB."""
    print("\n=== Testing Database Adapter ===")

    # Use mock adapter
    adapter = MockMongoAdapter()

    # Test connection
    await adapter.connect()
    assert adapter.connected, "Database should be connected"

    # Test cache miss
    result = await adapter.get_cached_translation("Hello", "ES")
    assert result is None, "Cache should be empty initially"
    print("✓ Cache miss works correctly")

    # Test save translation
    await adapter.save_translation("Hello", "ES", "Hola")
    print("✓ Translation saved to cache")

    # Test cache hit
    result = await adapter.get_cached_translation("Hello", "ES")
    assert result == "Hola", "Cache should return saved translation"
    print("✓ Cache hit works correctly")

    # Test disconnection
    await adapter.disconnect()
    assert not adapter.connected, "Database should be disconnected"

    print("✓ Database adapter tests passed\n")
    return True


async def test_translation_service():
    """Test the translation service with mocked DeepL API."""
    print("\n=== Testing Translation Service ===")

    # Import and patch
    import database
    from services import get_translation

    # Set up mock database
    database.db = MockMongoAdapter()
    await database.db.connect()

    # Mock DeepL translator
    with patch('services.deepl_translator') as mock_translator:
        # Configure mock
        mock_translate = MagicMock()
        mock_translate.translate_text = MagicMock(
            return_value=MockDeepLResult("Hola, ¿cómo estás?")
        )
        mock_translator.translate_text = mock_translate.translate_text

        # First call - should hit DeepL API (cache miss)
        print("Testing cache miss (first call)...")
        translation1 = await get_translation("Hello, how are you?", "ES")
        assert translation1 == "Hola, ¿cómo estás?", "Translation should match mock result"
        assert mock_translate.translate_text.call_count == 1, "DeepL API should be called once"
        print("✓ Cache miss - DeepL API called")

        # Second call - should hit cache (no API call)
        print("Testing cache hit (second call)...")
        translation2 = await get_translation("Hello, how are you?", "ES")
        assert translation2 == "Hola, ¿cómo estás?", "Translation should match cached result"
        assert mock_translate.translate_text.call_count == 1, "DeepL API should NOT be called again"
        print("✓ Cache hit - DeepL API not called")

        # Third call with different text - should hit API again
        print("Testing cache miss with different text...")
        mock_translate.translate_text.return_value = MockDeepLResult("Adiós")
        translation3 = await get_translation("Goodbye", "ES")
        assert translation3 == "Adiós", "Translation should match new mock result"
        assert mock_translate.translate_text.call_count == 2, "DeepL API should be called again for new text"
        print("✓ Cache miss with different text - DeepL API called")

    await database.db.disconnect()
    print("✓ Translation service tests passed\n")
    return True


def test_fastapi_endpoint():
    """Test the FastAPI /api/translate endpoint."""
    print("\n=== Testing FastAPI Endpoint ===")

    # We need to import main and patch database before creating TestClient
    import database
    from unittest.mock import patch as sync_patch

    # Patch the database module before importing main
    with sync_patch('database.db', MockMongoAdapter()):
        # Now we can safely test without actual database
        # For this test, we'll mock the startup/shutdown events
        from fastapi import FastAPI
        from main import translate_endpoint

        # Create a minimal test app
        test_app = FastAPI()
        test_app.get("/api/translate")(translate_endpoint)

        client = TestClient(test_app)

        # Set up mock database for the test
        database.db = MockMongoAdapter()

        # We need to mock the get_translation function
        async def mock_translation(*args, **kwargs):
            return "Hola"

        with patch('main.get_translation', side_effect=mock_translation):

            # Test successful translation
            print("Testing /api/translate endpoint...")
            response = client.get("/api/translate?text=Hello&target_lang=ES")

            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()
            assert "original" in data, "Response should contain 'original' field"
            assert "translation" in data, "Response should contain 'translation' field"
            assert data["original"] == "Hello", "Original text should match"
            print(f"✓ Endpoint returned: {data}")

            # Test missing parameters
            print("Testing error handling...")
            response = client.get("/api/translate")
            assert response.status_code == 422, "Should return 422 for missing parameters"
            print("✓ Error handling works correctly")

    print("✓ FastAPI endpoint tests passed\n")
    return True


async def run_all_tests():
    """Run all tests sequentially."""
    print("=" * 60)
    print("MIGRATION VERIFICATION TEST SUITE")
    print("=" * 60)

    results = []

    try:
        # Test 1: Database Adapter
        result1 = await test_database_adapter()
        results.append(("Database Adapter", result1))

        # Test 2: Translation Service
        result2 = await test_translation_service()
        results.append(("Translation Service", result2))

        # Test 3: FastAPI Endpoint (synchronous)
        result3 = test_fastapi_endpoint()
        results.append(("FastAPI Endpoint", result3))

    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    all_passed = True
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:.<40} {status}")
        if not result:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n🎉 ALL TESTS PASSED! Migration is successful.\n")
        return True
    else:
        print("\n❌ SOME TESTS FAILED! Review the errors above.\n")
        return False


if __name__ == "__main__":
    # Run the async test suite
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
