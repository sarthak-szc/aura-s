"""One-off: reactivate admin@aura.com in MongoDB."""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


async def main():
    email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@aura.com").lower()
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("MONGO_DB", "aura_db")]
    r = await db.users.update_one(
        {"email": email},
        {"$set": {"is_active": True, "role": "admin"}},
    )
    u = await db.users.find_one({"email": email}, {"email": 1, "is_active": 1, "role": 1})
    print("modified:", r.modified_count)
    print("user:", u)


if __name__ == "__main__":
    asyncio.run(main())
