# FastAPI Migration Guide

## Overview

This application has been successfully refactored to run on a FastAPI backend with MongoDB caching and DeepL translation integration. The existing Chainlit UI functionality remains intact, while new REST API endpoints provide additional capabilities.

## Architecture Changes

### New Components

1. **FastAPI Backend (`main.py`)**
   - RESTful API server
   - Lifecycle management for database connections
   - Health check endpoints
   - Translation API endpoint

2. **Database Layer (`database.py`)**
   - Abstract adapter pattern for database operations
   - MongoDB implementation (`MongoAdapter`)
   - Easy to extend for other databases (e.g., DynamoDB)
   - Translation caching to reduce API costs

3. **Enhanced Services (`services.py`)**
   - New `get_translation()` function
   - DeepL API integration
   - Cache-first translation strategy

### Modified Components

1. **Configuration (`config.py`)**
   - Added `DEEPL_API_KEY`
   - Added `MONGODB_URL`
   - Added `DB_TYPE` (default: "mongodb")

2. **Environment Variables (`.env.example`)**
   - `DEEPL_API_KEY`: Your DeepL API key
   - `MONGODB_URL`: MongoDB connection string (default: `mongodb://localhost:27017`)
   - `DB_TYPE`: Database type (default: "mongodb")

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

New dependencies added:
- `fastapi>=0.115.0` - Web framework
- `uvicorn[standard]>=0.32.0` - ASGI server
- `motor>=3.6.0` - Async MongoDB driver
- `deepl>=1.19.0` - DeepL translation API

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DEEPL_API_KEY=your_deepl_api_key_here
MONGODB_URL=mongodb://localhost:27017
DB_TYPE=mongodb
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGODB_URL` in `.env`

### 4. Run the Application

**Option 1: FastAPI Server Only**
```bash
uvicorn main:app --reload
```

Access the API at: `http://localhost:8000`

**Option 2: Chainlit App Only (Original Behavior)**
```bash
chainlit run app.py
```

Access the UI at: `http://localhost:8000`

**Option 3: Both Services (Recommended for Development)**

Terminal 1 - FastAPI:
```bash
uvicorn main:app --reload --port 8000
```

Terminal 2 - Chainlit:
```bash
chainlit run app.py --port 8001
```

- FastAPI API: `http://localhost:8000`
- Chainlit UI: `http://localhost:8001`

## API Endpoints

### Health Check
```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "deepl_configured": true
}
```

### Translate Text
```bash
GET /api/translate?text=Hello&target_lang=ES
```

Parameters:
- `text` (required): Text to translate
- `target_lang` (optional): Target language code (default: "ES")

Response:
```json
{
  "original": "Hello",
  "translation": "Hola",
  "target_lang": "ES",
  "cached": true
}
```

### Examples

```bash
# Translate to Spanish
curl "http://localhost:8000/api/translate?text=Hello%20World&target_lang=ES"

# Translate to English
curl "http://localhost:8000/api/translate?text=Hola%20Mundo&target_lang=EN"
```

## Testing

Run the migration verification tests:

```bash
python test_migration.py
```

This will test:
- ✓ Database adapter pattern
- ✓ Translation caching logic
- ✓ FastAPI endpoints
- ✓ Mock DeepL API integration

Expected output:
```
============================================================
MIGRATION VERIFICATION TEST SUITE
============================================================

=== Testing Database Adapter ===
✓ Database adapter tests passed

=== Testing Translation Service ===
✓ Translation service tests passed

=== Testing FastAPI Endpoint ===
✓ FastAPI endpoint tests passed

============================================================
TEST SUMMARY
============================================================
Database Adapter........................ ✓ PASSED
Translation Service..................... ✓ PASSED
FastAPI Endpoint........................ ✓ PASSED
============================================================

🎉 ALL TESTS PASSED! Migration is successful.
```

## Database Schema

### Collections

**translations**
```javascript
{
  "_id": ObjectId("..."),
  "text": "Hello",
  "target_lang": "ES",
  "translation": "Hola",
  "created_at": ISODate("2025-01-19T..."),
  "last_accessed": ISODate("2025-01-19T...")
}
```

Indexes:
- Compound unique index on `(text, target_lang)` for fast lookups

## Cache Strategy

1. **Check Cache**: Query MongoDB for existing translation
2. **Cache Hit**: Return cached translation (update `last_accessed`)
3. **Cache Miss**: Call DeepL API
4. **Save**: Store translation in MongoDB
5. **Return**: Return translation to user

Benefits:
- Reduces DeepL API costs
- Faster response times for repeated translations
- Analytics via `created_at` and `last_accessed` timestamps

## Adapter Pattern Benefits

The database layer uses an abstract adapter pattern:

```python
class DatabaseAdapter(ABC):
    @abstractmethod
    async def connect(self): ...
    @abstractmethod
    async def disconnect(self): ...
    @abstractmethod
    async def get_cached_translation(self, text, target_lang): ...
    @abstractmethod
    async def save_translation(self, text, target_lang, translation): ...
```

**Current Implementation:**
- `MongoAdapter` - MongoDB using Motor (async)

**Future Extensions:**
- `DynamoDBAdapter` - AWS DynamoDB
- `RedisAdapter` - Redis cache
- `PostgreSQLAdapter` - PostgreSQL with JSONB

Simply implement the interface and update the factory in `database.py`.

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# View connection status
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017').server_info())"
```

### DeepL API Issues

```bash
# Test DeepL API key
python -c "import deepl; translator = deepl.Translator('YOUR_KEY'); print(translator.get_usage())"
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Production Deployment

### Recommended Setup

1. **Database**: MongoDB Atlas or AWS DocumentDB
2. **API Server**: Deploy FastAPI with Gunicorn + Uvicorn workers
3. **Chainlit**: Deploy separately or mount to FastAPI
4. **Reverse Proxy**: Nginx or Caddy
5. **Monitoring**: DataDog, New Relic, or similar

### Environment Variables for Production

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DEEPL_API_KEY=your_production_key
OPENAI_API_KEY=your_production_key
ELEVENLABS_API_KEY=your_production_key
```

## Next Steps

1. **Monitoring**: Add logging and metrics
2. **Rate Limiting**: Implement API rate limits
3. **Authentication**: Add user authentication
4. **Caching**: Consider Redis for hot data
5. **Analytics**: Track translation usage patterns

## Support

For issues or questions:
- Check test output: `python test_migration.py`
- Review logs: FastAPI logs will show database connection status
- Verify environment variables are set correctly
