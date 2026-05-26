import hashlib
import json
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


def _steps_hash(process: dict, *step_keys: str) -> str:
    sd = process.get("steps_data", {}) or {}
    payload = {k: sd.get(k, {}) for k in step_keys}
    raw = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _text_preview(filename: str, contents: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith((".txt", ".csv", ".json", ".md", ".xml", ".html")):
        try:
            return contents.decode("utf-8", errors="ignore")[:15000]
        except Exception:
            pass
    return f"[File uploaded: {filename}, {len(contents)} bytes]"


def _step1_payload(data: Step1Data) -> dict:
    return data.dict()


@router.post("/customer-info")
async def customer_info(data: Step1Data, user: dict = Depends(get_current_user)):
    payload = _step1_payload(data)
    doc = {
        "client_id": data.client_id,
        "assessment_date": data.assessment_date,
        "currency": data.currency,
        "current_step": 1,
        "status": "in_progress",
        "steps_data": {"step1": payload},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
    }
    result = await db.processes.insert_one(doc)
    pid = str(result.inserted_id)
    await db.processes.update_one(
        {"_id": result.inserted_id},
        {"$set": {"current_step": 2, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await log_audit("process_created", user["id"], user["email"], f"process/{pid}")
    return {
        "process_id": pid,
        "status": "in_progress",
        "message": "Customer details saved",
        "current_step": 2,
    }


@router.post("/{process_id}/customer-info")
async def update_customer_info(
    process_id: str, data: Step1Data, user: dict = Depends(get_current_user)
):
    await _get_process(process_id)
    payload = _step1_payload(data)
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "client_id": data.client_id,
            "assessment_date": data.assessment_date,
            "currency": data.currency,
            "steps_data.step1": payload,
            "current_step": 2,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    await log_audit("step1_saved", user["id"], user["email"], f"process/{process_id}")
    return {"process_id": process_id, "message": "Customer details saved", "current_step": 2}


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
    fname = file.filename or "file"
    file_url = await upload_bytes(process_id, fname, contents, doc_type)
    p = await _get_process(process_id)
    preview = _text_preview(fname, contents)
    summary = await ai_service.summarize_document(fname, doc_type, p)
    combined = f"{summary}\n\n{preview}"[:12000]

    s2 = p.get("steps_data", {}).get("step2", {}) or {}
    summaries = list(s2.get("document_summaries") or [])
    summaries.append(combined)
    uploaded_files = list(s2.get("uploaded_files") or [])
    uploaded_files.append({
        "file_name": fname,
        "file_url": file_url,
        "doc_type": doc_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            f"steps_data.step2.files.{doc_type}": {
                "file_url": file_url,
                "file_name": fname,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
            },
            f"steps_data.step2.{doc_type}_summary": summary,
            "steps_data.step2.document_summaries": summaries,
            "steps_data.step2.uploaded_files": uploaded_files,
            "steps_data.step2.has_uploads": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"file_url": file_url, "summary": summary, "has_uploads": True}


@router.post("/{process_id}/process-entry/generate")
async def generate_process_entry(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    s2 = p.get("steps_data", {}).get("step2", {}) or {}
    doc_text = "\n\n".join(s2.get("document_summaries") or [])
    populated = await ai_service.populate_process_entry(p, doc_text)
    step2 = {**s2, **populated, "ai_generated": True}
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step2": step2,
            "current_step": 2,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    await log_audit("step2_ai_generated", user["id"], user["email"], f"process/{process_id}")
    return {"step2": step2, "process_id": process_id}


@router.post("/{process_id}/process-details/generate")
async def generate_process_details(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    vol = await ai_service.generate_volumetrics(p)
    ctx_hash = _steps_hash(p, "step1", "step2")
    vol["_source_hash"] = ctx_hash
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step3": vol,
            "steps_data._meta.step3_hash": ctx_hash,
            "current_step": 3,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"step3": vol, "process_id": process_id, "source_hash": ctx_hash}


@router.post("/{process_id}/technology-stack/generate")
async def generate_technology_stack(process_id: str, user: dict = Depends(get_current_user)):
    p = await _get_process(process_id)
    tech = await ai_service.generate_tech_stack(p)
    s6 = p.get("steps_data", {}).get("step6", {}) or {}
    s6["technology_stack"] = tech
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step6.technology_stack": tech,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"technology_stack": tech, "step6": s6}


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
        "ai_opportunity": data.get("ai_opportunity", ""),
        "automation_pct": data.get("automation_pct", ""),
        "can_automate": data.get("can_automate", ""),
        "automation_horizon": data.get("automation_horizon", ""),
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
    payload = dict(data or {})
    advance = bool(payload.pop("advance", False))
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step6": payload,
            "current_step": 7 if advance else 6,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Archetype selection saved", "process_id": process_id}


@router.post("/{process_id}/generate-summary")
async def generate_summary(
    process_id: str, data: dict = None, user: dict = Depends(get_current_user)
):
    p = await _get_process(process_id)
    summary = await ai_service.generate_summary(p)
    existing7 = p.get("steps_data", {}).get("step7", {}) or {}
    step7_payload = {**existing7, **summary}
    if data and data.get("report_fields"):
        step7_payload["report_fields"] = data["report_fields"]
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step7": step7_payload,
            "current_step": 7,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return step7_payload


@router.post("/{process_id}/evaluation-summary")
async def save_evaluation_summary(
    process_id: str, data: dict, user: dict = Depends(get_current_user)
):
    p = await _get_process(process_id)
    existing7 = p.get("steps_data", {}).get("step7", {}) or {}
    merged = {**existing7, **(data or {})}
    if data.get("report_fields"):
        merged["report_fields"] = data["report_fields"]
    await db.processes.update_one(
        {"_id": ObjectId(process_id)},
        {"$set": {
            "steps_data.step7": merged,
            "current_step": 7,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Evaluation summary saved", "process_id": process_id}


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
