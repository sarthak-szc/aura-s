from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from core.audit import log_audit
from core.deps import get_current_user
from database import db
from models.schemas import ClientCreate, ClientUpdate

router = APIRouter(prefix="/api/v1/clients", tags=["Clients"])


def fix_id(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def list_clients(user: dict = Depends(get_current_user)):
    clients = await db.clients.find({"status": {"$ne": "deleted"}}).to_list(100)
    for c in clients:
        fix_id(c)
        c["assessment_count"] = await db.processes.count_documents({"client_id": str(c["_id"])})
    return {"clients": clients, "total": len(clients)}


@router.get("/{client_id}")
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"_id": ObjectId(client_id)})
    if not client:
        raise HTTPException(404, "Client not found")
    fix_id(client)
    processes = await db.processes.find({"client_id": client_id}).to_list(50)
    for p in processes:
        fix_id(p)
    return {"client": client, "processes": processes}


@router.post("")
async def create_client(data: ClientCreate, user: dict = Depends(get_current_user)):
    existing = await db.clients.find_one({
        "name": data.name,
        "status": {"$ne": "deleted"},
    })
    if existing:
        raise HTTPException(400, "Client with this name already exists")

    doc = data.dict()
    doc["status"] = "active"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc["assessment_count"] = 0

    result = await db.clients.insert_one(doc)
    cid = str(result.inserted_id)
    await log_audit("client_created", user["id"], user["email"], f"client/{cid}")
    return {"client_id": cid, "message": "Client created successfully"}


@router.post("/{client_id}/update")
async def update_client(
    client_id: str, data: ClientUpdate, user: dict = Depends(get_current_user)
):
    existing = await db.clients.find_one({"_id": ObjectId(client_id)})
    if not existing:
        raise HTTPException(404, "Client not found")

    update = {k: v for k, v in data.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")

    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.clients.update_one({"_id": ObjectId(client_id)}, {"$set": update})
    await log_audit("client_updated", user["id"], user["email"], f"client/{client_id}")
    return {"message": "Client updated successfully", "client_id": client_id}


@router.post("/{client_id}/delete")
async def delete_client(client_id: str, user: dict = Depends(get_current_user)):
    existing = await db.clients.find_one({"_id": ObjectId(client_id)})
    if not existing:
        raise HTTPException(404, "Client not found")

    await db.clients.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": {
            "status": "deleted",
            "deleted_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    await log_audit("client_deleted", user["id"], user["email"], f"client/{client_id}")
    return {"message": "Client deleted successfully", "client_id": client_id}
