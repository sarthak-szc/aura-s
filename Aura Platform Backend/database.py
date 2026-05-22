from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings

settings = get_settings()

if not settings.MONGO_URL:
    raise RuntimeError("MONGO_URL is not set. Copy .env.example to .env and configure MongoDB.")

client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.MONGO_DB]
