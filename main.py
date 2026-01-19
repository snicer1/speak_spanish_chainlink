"""
FastAPI application entry point with MongoDB caching and DeepL integration.
Mounts the Chainlit app at the root path and provides REST API endpoints.
"""

import logging
import traceback
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import chainlit as cl
from config import Config
from database import create_database_adapter
import database
from services import get_translation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown events.
    Handles database connection lifecycle.
    """
    # Startup: Connect to database
    try:
        logger.info("Starting application...")
        logger.info(f"MongoDB URL: {Config.MONGODB_URL}")
        logger.info(f"DeepL API Key configured: {bool(Config.DEEPL_API_KEY)}")

        database.db = create_database_adapter()
        await database.db.connect()
        logger.info("✓ Application startup complete - database connected")
    except Exception as e:
        logger.error(f"✗ Error connecting to database: {e}")
        logger.error(traceback.format_exc())
        raise

    yield

    # Shutdown: Disconnect from database
    try:
        if database.db:
            await database.db.disconnect()
        logger.info("✓ Application shutdown complete - database disconnected")
    except Exception as e:
        logger.error(f"✗ Error disconnecting from database: {e}")


# Initialize FastAPI with lifespan context manager
app = FastAPI(
    title="Spanish Learning API",
    description="FastAPI backend with Chainlit UI, MongoDB caching, and DeepL translation",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Root endpoint - provides API information."""
    return {
        "message": "Spanish Learning API",
        "endpoints": {
            "/api/translate": "GET - Translate text using DeepL with MongoDB caching",
            "/api/health": "GET - Health check endpoint",
            "/chainlit": "Chainlit UI (mounted at root in production)"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    db_status = "connected" if database.db else "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "deepl_configured": bool(Config.DEEPL_API_KEY)
    }


@app.get("/api/translate")
async def translate_endpoint(
    text: str = Query(..., description="Text to translate"),
    target_lang: str = Query("ES", description="Target language code (e.g., ES, EN)")
):
    """
    Translate text using DeepL with MongoDB caching.

    Args:
        text: The text to translate
        target_lang: Target language code (default: ES for Spanish)

    Returns:
        JSON response with original text and translation

    Raises:
        HTTPException: If translation fails
    """
    try:
        logger.info(f"Translation request: text='{text}', target_lang='{target_lang}'")
        translation = await get_translation(text, target_lang)
        logger.info(f"Translation successful: '{translation}'")
        return JSONResponse(content={
            "original": text,
            "translation": translation,
            "target_lang": target_lang,
            "cached": True  # This would need logic to track if it was cached
        })
    except ValueError as e:
        logger.error(f"ValueError in translation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"RuntimeError in translation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in translation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


# Mount Chainlit app at the root path
# Note: In production, you might want to mount it at a specific path like /chat
# For development, we'll keep it separate and run Chainlit standalone
# To mount Chainlit, use: chainlit.mount(app, target="app.py", path="/")

# For now, we'll run them separately:
# - FastAPI: uvicorn main:app --reload
# - Chainlit: chainlit run app.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
