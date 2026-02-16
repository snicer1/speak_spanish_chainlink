# How to Run the Spanish Learning App

This guide explains how to set up and run both the backend API and frontend Chainlit application.

---

## Prerequisites

- **Python 3.13** (required - Python 3.14+ has asyncio incompatibilities)
- **MongoDB** (required for translation caching)
- **API Keys** (OpenAI, ElevenLabs, DeepL)

---

## Initial Setup (First Time Only)

### 1. Create Virtual Environment

```bash
python3.13 -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# OpenAI API Key (required for chat and speech-to-text)
OPENAI_API_KEY=sk-...

# ElevenLabs API Key (required for text-to-speech)
ELEVENLABS_API_KEY=...

# DeepL API Key (required for translation caching)
DEEPL_API_KEY=...

# MongoDB Connection URL (required for translation caching)
MONGODB_URL=mongodb://localhost:27017

# Database Type (default: mongodb)
DB_TYPE=mongodb
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Or run manually:
mongod --dbpath /path/to/your/db
```

### 5. Verify Setup

Run the verification script to check if everything is configured correctly:

```bash
python verify_setup.py
```

---

## Running the Application

You have two options: run the **frontend only** or run **both backend API and frontend**.

### Option 1: Frontend Only (Chainlit UI)

This is the simplest way to run the app for development:

```bash
# Activate virtual environment first
source venv/bin/activate

# Run Chainlit
chainlit run app.py
```

The app will be available at: **http://localhost:8000**

---

### Option 2: Backend API + Frontend (FastAPI + Chainlit)

This runs the full stack with REST API endpoints and the Chainlit UI mounted together:

```bash
# Activate virtual environment first
source venv/bin/activate

# Run FastAPI with Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The app will be available at:
- **Chainlit UI:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Health Check:** http://localhost:8000/api/health
- **Translation Endpoint:** http://localhost:8000/api/translate?text=hello&target_lang=es

---

## Quick Start (Day-to-Day)

After initial setup, you just need to:

```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2a. Run frontend only (Chainlit)
chainlit run app.py

# OR

# 2b. Run full stack (API + Chainlit)
uvicorn main:app --reload
```

---

## Project Structure

```
.
├── app.py                  # Chainlit UI and event handlers
├── main.py                 # FastAPI application (mounts Chainlit)
├── services.py             # Business logic (OpenAI, ElevenLabs, DeepL)
├── config.py               # Configuration and prompts
├── database.py             # MongoDB adapter for translation caching
├── languages.py            # Language configurations
├── verify_setup.py         # Setup verification script
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (create from .env.example)
├── .chainlit/
│   └── config.toml         # Chainlit configuration (audio settings)
└── public/
    └── audio-control.js    # Custom push-to-talk JavaScript
```

---

## Features & Usage

### Push-to-Talk Audio

- Click the **Microphone button** to start recording
- Click the **Stop Square button** to stop and send
- No auto-sending on silence (enforced via custom JavaScript)

### Language Selection

- Use the settings panel (gear icon) to change:
  - **Target Language** (language you want to learn)
  - **Mother Tongue** (your native language for explanations)

### Translation Caching

- All translations are cached in MongoDB via DeepL API
- This reduces API costs and improves response times

---

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:

```bash
# Use a different port
chainlit run app.py --port 8001
# or
uvicorn main:app --port 8001
```

### MongoDB Connection Error

Make sure MongoDB is running:

```bash
# Check if MongoDB is running
mongosh  # Should connect without errors

# Or check the service status
brew services list | grep mongodb  # macOS
systemctl status mongod            # Linux
```

### Missing API Keys

Verify your `.env` file has all required keys:

```bash
cat .env
```

Run the verification script:

```bash
python verify_setup.py
```

### Audio Not Working

1. Check that `.chainlit/config.toml` exists
2. Verify `public/audio-control.js` exists
3. Check browser console for JavaScript errors
4. Try a different browser (Chrome/Firefox recommended)

---

## Development Commands

```bash
# Run tests
python -m pytest

# Check Python version
python --version  # Should be 3.13.x

# List installed packages
pip list

# Update dependencies
pip install --upgrade -r requirements.txt
```

---

## Notes

- **Python 3.13 is required** - Do not use Python 3.14+ (asyncio incompatibilities)
- **Chainlit 2.x** has different audio handling than 1.x (see MIGRATION_GUIDE.md)
- **Push-to-talk is enforced** via custom JavaScript (public/audio-control.js)
- **MongoDB is required** for translation caching (can be local or remote)

---

## Additional Documentation

- **CLAUDE.md** - Project guidelines and architecture
- **TESTING.md** - Testing procedures and QA workflows
- **MIGRATION_GUIDE.md** - Migration notes from Chainlit 1.x to 2.x
- **API Docs** - http://localhost:8000/docs (when running FastAPI)
