from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from core.audit import log_audit
from core.deps import require_admin
from core.security import hash_password
from database import db

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


def fix_id(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/users")
async def list_users(admin: dict = Depends(require_admin)):
    users = await db.users.find().to_list(100)
    for u in users:
        fix_id(u)
        u.pop("password", None)
    return {"users": users, "total": len(users)}


@router.post("/users")
async def create_user(data: dict, admin: dict = Depends(require_admin)):
    if not data.get("email"):
        raise HTTPException(400, "Email is required")
    if not data.get("full_name"):
        raise HTTPException(400, "Name is required")
    if not data.get("password"):
        raise HTTPException(400, "Password is required")

    email = data["email"].lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "User with this email already exists")

    doc = {
        "email": email,
        "full_name": data["full_name"],
        "password": hash_password(data["password"]),
        "role": data.get("role", "analyst"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    await log_audit("user_created", admin["id"], admin["email"], f"user/{uid}", {"role": doc["role"]})
    return {"message": "User created", "user_id": uid}


@router.post("/users/{user_id}/toggle")
async def toggle_user(user_id: str, data: dict, admin: dict = Depends(require_admin)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": data.get("is_active", True)}},
    )
    await log_audit("user_toggled", admin["id"], admin["email"], f"user/{user_id}", data)
    return {"message": "User updated"}


@router.get("/audit-logs")
async def audit_logs(admin: dict = Depends(require_admin)):
    logs = await db.audit_logs.find().sort("timestamp", -1).to_list(100)
    for log in logs:
        fix_id(log)
    return {"logs": logs, "total": len(logs)}
