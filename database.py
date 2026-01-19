"""
Database layer with adapter pattern for translation caching.
Allows easy swapping between MongoDB and other databases (e.g., DynamoDB).
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime


class DatabaseAdapter(ABC):
    """Abstract base class for database adapters."""

    @abstractmethod
    async def connect(self) -> None:
        """Connect to the database."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from the database."""
        pass

    @abstractmethod
    async def get_cached_translation(self, text: str, target_lang: str) -> Optional[str]:
        """
        Retrieve a cached translation from the database.

        Args:
            text: The original text
            target_lang: The target language code (e.g., 'es', 'en')

        Returns:
            The cached translation or None if not found
        """
        pass

    @abstractmethod
    async def save_translation(self, text: str, target_lang: str, translation: str) -> None:
        """
        Save a translation to the database cache.

        Args:
            text: The original text
            target_lang: The target language code (e.g., 'es', 'en')
            translation: The translated text
        """
        pass


class MongoAdapter(DatabaseAdapter):
    """MongoDB implementation of the DatabaseAdapter."""

    def __init__(self, connection_url: str, database_name: str = "spanish_learning"):
        """
        Initialize the MongoDB adapter.

        Args:
            connection_url: MongoDB connection URL
            database_name: Name of the database to use
        """
        self.connection_url = connection_url
        self.database_name = database_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.translations_collection = None

    async def connect(self) -> None:
        """Connect to MongoDB and initialize collections."""
        self.client = AsyncIOMotorClient(self.connection_url)
        self.db = self.client[self.database_name]
        self.translations_collection = self.db["translations"]

        # Create index for faster lookups
        await self.translations_collection.create_index([
            ("text", 1),
            ("target_lang", 1)
        ], unique=True)

        print(f"Connected to MongoDB: {self.database_name}")

    async def disconnect(self) -> None:
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

    async def get_cached_translation(self, text: str, target_lang: str) -> Optional[str]:
        """
        Retrieve a cached translation from MongoDB.

        Args:
            text: The original text
            target_lang: The target language code

        Returns:
            The cached translation or None if not found
        """
        if self.translations_collection is None:
            raise RuntimeError("Database not connected. Call connect() first.")

        result = await self.translations_collection.find_one({
            "text": text,
            "target_lang": target_lang
        })

        if result:
            # Update access timestamp for analytics
            await self.translations_collection.update_one(
                {"_id": result["_id"]},
                {"$set": {"last_accessed": datetime.utcnow()}}
            )
            return result["translation"]

        return None

    async def save_translation(self, text: str, target_lang: str, translation: str) -> None:
        """
        Save a translation to MongoDB cache.

        Args:
            text: The original text
            target_lang: The target language code
            translation: The translated text
        """
        if self.translations_collection is None:
            raise RuntimeError("Database not connected. Call connect() first.")

        document = {
            "text": text,
            "target_lang": target_lang,
            "translation": translation,
            "created_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow()
        }

        # Use update_one with upsert to handle duplicates gracefully
        await self.translations_collection.update_one(
            {"text": text, "target_lang": target_lang},
            {"$set": document},
            upsert=True
        )


# Factory function to create the appropriate adapter based on environment
def create_database_adapter() -> DatabaseAdapter:
    """
    Factory function to create the appropriate database adapter.

    Returns:
        An instance of DatabaseAdapter (currently MongoAdapter)

    Raises:
        ValueError: If required environment variables are not set
    """
    db_type = os.getenv("DB_TYPE", "mongodb").lower()

    if db_type == "mongodb":
        mongodb_url = os.getenv("MONGODB_URL")
        if not mongodb_url:
            raise ValueError("MONGODB_URL environment variable is required when DB_TYPE is 'mongodb'")
        return MongoAdapter(mongodb_url)
    # Future support for other databases
    # elif db_type == "dynamodb":
    #     return DynamoDBAdapter()
    else:
        raise ValueError(f"Unsupported database type: {db_type}")


# Global database instance (initialized in main.py)
db: Optional[DatabaseAdapter] = None
