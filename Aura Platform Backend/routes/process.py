from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from core.audit import log_audit
from core.deps import get_current_user
from database import db
from models.schemas import Step1Data, Step2Data, Step3Data, Step4Data
from services import ai_service
from services.blob_service import upload_bytes

router = APIRouter(prefix="/api/v1/process", tags=["Process"])


def fix_id(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


async def _get_process(process_id: str) -> dict:
    p = await db.processes.find_one({"_id": ObjectId(process_id)})
    if not p:
        raise HTTPException(404, "Process not found")
    return p


@router.post("/customer-info")
async def customer_info(data: Step1Data, user: dict = Depends(get_current_user)):
    doc = {
        "client_id": data.client_id,
        "assessment_date": data.assessment_date,
        "currency": data.currency,
        "current_step": 1,
        "status": "in_progress",
        "steps_data": {"step1": data.dict()},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
    }
    result = await db.processes.insert_one(doc)
    pid = str(result.inserted_id)
    await log_audit("process_created", user["id"], user["email"], f"process/{pid}")
    return {"process_id": pid, "status": "in_progress"}


@router.post("/{process_id}/process-entry")
async def process_entry(
    process_id: str, data: Step2Data, user: dict = Depends(get_current_user)
):
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step2": data.dict(),
            "current_step": 2,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Process entry saved", "process_id": process_id}


@router.post("/{process_id}/process-details")
async def process_details(
    process_id: str, data: Step3Data, user: dict = Depends(get_current_user)
):
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step3": data.dict(),
            "current_step": 3,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Process details saved", "process_id": process_id}


@router.post("/{process_id}/activity-breakdown")
async def activity_breakdown(
    process_id: str, data: Step4Data, user: dict = Depends(get_current_user)
):
    if not data.activities:
        raise HTTPException(400, "At least one activity is required")

    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step4.activities": [a.dict() for a in data.activities],
            "steps_data.step4.status": "done",
            "current_step": 4,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Activity breakdown saved", "process_id": process_id}


@router.get("")
async def list_processes(
    client_id: str | None = None,
    status: str | None = None,
    user: dict = Depends(get_current_user),
):
    query: dict = {}
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status

    processes = await db.processes.find(query).sort("updated_at", -1).to_list(100)
    for p in processes:
        fix_id(p)
    return {"processes": processes, "total": len(processes)}


@router.get("/reports")
async def list_reports(user: dict = Depends(get_current_user)):
    processes = await db.processes.find({"status": "completed"}).sort("completed_at", -1).to_list(100)
    reports = []
    for p in processes:
        fix_id(p)
        step2 = p.get("steps_data", {}).get("step2", {})
        reports.append({
            "process_id": p["_id"],
            "client_id": p.get("client_id"),
            "process_name": step2.get("process_name", "—"),
            "assessment_date": p.get("steps_data", {}).get("step1", {}).get("assessment_date"),
            "completed_at": p.get("completed_at"),
            "currency": p.get("currency", "INR"),
        })
    return {"reports": reports, "total": len(reports)}


@router.get("/{process_id}")
async def get_process(process_id: str, user: dict = Depends(get_current_user)):
    return fix_id(await _get_process(process_id))


@router.post("/{process_id}/upload-context-file")
async def upload_context_file(
    process_id: str,
    file: UploadFile = File(...),
    doc_type: str = "process_flow",
    user: dict = Depends(get_current_user),
):
    contents = await file.read()
    file_url = await upload_bytes(process_id, file.filename or "file", contents, doc_type)
    p = await _get_process(process_id)
    summary = await ai_service.summarize_document(file.filename or "file", doc_type, p)

    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            f"steps_data.step2.files.{doc_type}": {
                "file_url": file_url,
                "file_name": file.filename,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
            },
            f"steps_data.step2.{doc_type}_summary": summary,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"file_url": file_url, "summary": summary}


@router.post("/{process_id}/activity-breakdown/generate")
async def generate_activities(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    activities = await ai_service.generate_activities(p)
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step4.activities": activities,
            "steps_data.step4.status": "done",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"activities": activities, "process_id": process_id}


@router.post("/{process_id}/gsda-evaluation/generate")
async def generate_gsda(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    gsda_items = await ai_service.generate_gsda_items(p)
    scores = await ai_service.suggest_gsda_scores(p)
    return {"gsda_items": gsda_items, "scores": scores, "process_id": process_id}


@router.post("/{process_id}/gsda-suggestion")
async def gsda_suggestion(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    return await ai_service.suggest_gsda_scores(p)


@router.post("/{process_id}/gsda-evaluation")
async def save_gsda(process_id: str, data: dict, user: dict = Depends(get_current_user)):
    gsda_items = data.get("gsda_items", [])
    scores = data.get("scores") or {}
    if not scores and gsda_items:
        scores = await ai_service.suggest_gsda_scores(
            await _get_process(process_id)
        )

    step5 = {
        "gsda_items": gsda_items,
        "standardization": scores.get("standardization", 3),
        "digitization": scores.get("digitization", 3),
        "data_availability": scores.get("data_availability", 3),
        "automation_feasibility": scores.get("automation_feasibility", 3),
        "reasoning": scores.get("reasoning", ""),
    }

    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step5": step5,
            "current_step": 5,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "GSDA saved", "process_id": process_id}


@router.post("/{process_id}/archetype-generation")
async def archetype_generation(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    archetypes = await ai_service.generate_archetypes(p)
    return {"archetypes": archetypes, "process_id": process_id}


@router.post("/{process_id}/archetype-selection")
async def archetype_selection(
    process_id: str, data: dict, user: dict = Depends(get_current_user)
):
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step6": data,
            "current_step": 6,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Archetype selection saved", "process_id": process_id}


@router.post("/{process_id}/generate-summary")
async def generate_summary(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    summary = await ai_service.generate_summary(p)
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step7": summary,
            "current_step": 7,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return summary


@router.post("/{process_id}/complete")
async def complete_process(process_id: str, user: dict = Depends(get_current_user)):
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    await log_audit("process_completed", user["id"], user["email"], f"process/{process_id}")
    return {"message": "Process completed", "process_id": process_id}
