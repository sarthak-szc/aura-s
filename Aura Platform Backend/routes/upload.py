from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from bson import ObjectId
from datetime import datetime, timezone

from database import db
from core.deps import get_current_user
from core.audit import log_audit
from services.blob_service import upload_bytes

router = APIRouter(prefix="/api/v1/process", tags=["Upload"])

ALLOWED_TYPES = {
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}
MAX_SIZE = 10 * 1024 * 1024


@router.post("/{process_id}/activity-breakdown/upload")
async def upload_activity_file(
    process_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only PDF, CSV, Excel files allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "File size must be less than 10MB")

    file_url = await upload_bytes(
        process_id, file.filename or "file", contents, "activity-breakdown"
    )

    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step4.file_url": file_url,
            "steps_data.step4.file_name": file.filename,
            "steps_data.step4.uploaded_at": datetime.now(timezone.utc).isoformat(),
            "steps_data.step4.status": "processing",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    await log_audit("file_upload", user["id"], user["email"], f"process/{process_id}")

    return {
        "message": "File uploaded successfully",
        "file_url": file_url,
        "file_name": file.filename,
        "status": "processing",
    }


@router.get("/{process_id}/activity-breakdown/status")
async def upload_status(process_id: str, user: dict = Depends(get_current_user)):
    p = await db.processes.find_one({"_id": ObjectId(process_id)})
    if not p:
        raise HTTPException(404, "Process not found")

    step4 = p.get("steps_data", {}).get("step4", {})
    return {
        "status": step4.get("status", "idle"),
        "activities": step4.get("activities", []),
        "file_name": step4.get("file_name", ""),
    }
