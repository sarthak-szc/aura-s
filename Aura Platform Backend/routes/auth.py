from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from datetime import datetime, timezone

from database import db
from config import get_settings
from core.security import hash_password, verify_password, create_access_token
from core.audit import log_audit
from core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])
settings = get_settings()


class LoginData(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def login(data: LoginData):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(403, "Account is deactivated")

    # Migrate legacy SHA256 → bcrypt on successful login
    if not user["password"].startswith("$2"):
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hash_password(data.password)}},
        )

    token = create_access_token(
        str(user["_id"]),
        {"email": user["email"], "role": user.get("role", "analyst")},
    )

    await log_audit("login", str(user["_id"]), user["email"])

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["full_name"],
            "role": user.get("role", "analyst"),
        },
    }


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["full_name"],
        "role": user.get("role", "analyst"),
    }


async def _setup_admin():
    if not settings.ADMIN_SETUP_ENABLED:
        raise HTTPException(403, "Admin setup is disabled")

    email = settings.DEFAULT_ADMIN_EMAIL.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        # Fix password, re-activate account, ensure admin role
        await db.users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "password": hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                    "is_active": True,
                    "role": "admin",
                }
            },
        )
        return {
            "message": "Admin password reset — use default password from .env",
            "email": email,
            "password": settings.DEFAULT_ADMIN_PASSWORD,
            "login_url": "http://localhost:3000/login",
        }

    await db.users.insert_one({
        "email": email,
        "password": hash_password(settings.DEFAULT_ADMIN_PASSWORD),
        "full_name": "Admin",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await log_audit("admin_setup", resource="users", details={"email": email})
    return {
        "message": "Admin created — login with email and password below",
        "email": email,
        "password": settings.DEFAULT_ADMIN_PASSWORD,
        "login_url": "http://localhost:3000/login",
    }


@router.get("/setup")
@router.post("/setup")
async def setup_admin():
    """GET = open in browser. POST = API call. Both create admin once."""
    return await _setup_admin()
