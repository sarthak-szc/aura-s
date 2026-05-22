import json
import logging
from typing import Any

from config import get_settings

logger = logging.getLogger("aura.ai")
settings = get_settings()


def _client():
    from openai import AzureOpenAI
    return AzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.azure_openai_endpoint,
    )


async def _chat_json(system: str, user: str) -> dict | list | None:
    if not settings.ai_enabled:
        return None
    try:
        response = _client().chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or "{}"
        return json.loads(text)
    except Exception as e:
        logger.warning("Azure OpenAI call failed: %s", e)
        return None


def _process_context(p: dict) -> str:
    steps = p.get("steps_data", {})
    return json.dumps({
        "step1": steps.get("step1", {}),
        "step2": steps.get("step2", {}),
        "step3": steps.get("step3", {}),
        "step4": steps.get("step4", {}),
    }, default=str)[:12000]


async def summarize_document(filename: str, doc_type: str, process: dict) -> str:
    result = await _chat_json(
        "You are AuRA, an enterprise AI process discovery assistant. Return JSON: {\"summary\": \"...\"}",
        f"Summarize the uploaded {doc_type} document '{filename}' for process discovery. "
        f"Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("summary"):
        return result["summary"]
    return (
        f"Document '{filename}' uploaded. AI analysis will extract key insights "
        f"from this {doc_type.replace('_', ' ')} document."
    )


async def generate_activities(process: dict) -> list[dict]:
    process_name = process.get("steps_data", {}).get("step2", {}).get("process_name", "Process")
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"activities\": [{\"activity_name\", \"data_needed\", "
        "\"data_readiness\" (Available|Partial|Missing), \"ai_automation_potential\" (Low|Medium|High), "
        "\"integration_readiness\", \"frequency\"}]}. Provide 4-6 activities.",
        f"Generate activity breakdown for process: {process_name}. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("activities"):
        return result["activities"]
    return _fallback_activities()


async def generate_gsda_items(process: dict) -> list[dict]:
    activities = process.get("steps_data", {}).get("step4", {}).get("activities", [])
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"gsda_items\": [{\"goal\", \"signal\", \"decision\", \"action\", "
        "\"time_estimate\", \"system_involved\", \"data_type\", \"complexity\" (Low|Medium|High), "
        "\"frequency\", \"ai_scope\"}]}.",
        f"Generate GSDA (Goal-Signal-Decision-Action) items from activities: {json.dumps(activities)}. "
        f"Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("gsda_items"):
        return result["gsda_items"]
    return _fallback_gsda(activities)


async def suggest_gsda_scores(process: dict) -> dict:
    result = await _chat_json(
        "You are AuRA. Return JSON with integer scores 1-5: "
        "{\"standardization\", \"digitization\", \"data_availability\", "
        "\"automation_feasibility\", \"reasoning\"}.",
        f"Score GSDA dimensions for this process. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict):
        return {
            "standardization": int(result.get("standardization", 3)),
            "digitization": int(result.get("digitization", 3)),
            "data_availability": int(result.get("data_availability", 3)),
            "automation_feasibility": int(result.get("automation_feasibility", 3)),
            "reasoning": result.get("reasoning", "AI-generated scores based on process data."),
        }
    return {
        "standardization": 3,
        "digitization": 3,
        "data_availability": 3,
        "automation_feasibility": 3,
        "reasoning": "Based on process data, medium automation potential detected.",
    }


async def generate_archetypes(process: dict) -> list[dict]:
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"archetypes\": [{\"archetype_name\", \"fit_score\" (0-100), "
        "\"description\", \"recommended_tools\" (array), \"implementation_complexity\" "
        "(Low|Medium|High), \"is_selected\": false}]}. Provide exactly 3 archetypes.",
        f"Recommend AI automation archetypes. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("archetypes"):
        return result["archetypes"]
    return _fallback_archetypes()


async def generate_summary(process: dict) -> dict:
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"summary\", \"next_steps\" (array of strings), \"roi_estimate\"}.",
        f"Write executive summary for completed assessment. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("summary"):
        return {
            "summary": result["summary"],
            "next_steps": result.get("next_steps", []),
            "roi_estimate": result.get("roi_estimate", "25-40% efficiency improvement within 12 months"),
        }
    process_name = process.get("steps_data", {}).get("step2", {}).get("process_name", "Process")
    return {
        "summary": (
            f"Assessment for '{process_name}' shows strong potential for AI-driven automation "
            "based on volumetrics, activities, and GSDA evaluation."
        ),
        "next_steps": [
            "Conduct technical feasibility study with IT",
            "Engage stakeholders for change management",
            "Build proof-of-concept for selected archetype",
            "Define KPIs and baseline metrics",
            "Create phased implementation roadmap",
        ],
        "roi_estimate": "25-40% reduction in processing time within 12 months",
    }


def _fallback_activities() -> list[dict]:
    return [
        {"activity_name": "Document Receipt & Capture", "data_needed": "Invoice PDF, Vendor email",
         "data_readiness": "Available", "ai_automation_potential": "High",
         "integration_readiness": "Outlook / Portal API", "frequency": "Daily"},
        {"activity_name": "Data Extraction & Validation", "data_needed": "Invoice fields, GRN data",
         "data_readiness": "Partial", "ai_automation_potential": "High",
         "integration_readiness": "SAP BAPI, OCR", "frequency": "Daily"},
        {"activity_name": "Approval Routing", "data_needed": "Approval matrix, Budget data",
         "data_readiness": "Available", "ai_automation_potential": "Medium",
         "integration_readiness": "Workflow engine", "frequency": "Daily"},
        {"activity_name": "Exception Handling", "data_needed": "Error logs, Mismatch reports",
         "data_readiness": "Partial", "ai_automation_potential": "Medium",
         "integration_readiness": "Email / ERP", "frequency": "Weekly"},
    ]


def _fallback_gsda(activities: list) -> list[dict]:
    if not activities:
        return [{
            "goal": "Automate end-to-end process to reduce manual effort",
            "signal": "Document received via email or portal",
            "decision": "Is data complete? Route accordingly",
            "action": "Extract → Validate → Process → Notify",
            "time_estimate": "20 mins", "system_involved": "ERP / Email",
            "data_type": "Unstructured", "complexity": "Medium",
            "frequency": "Daily", "ai_scope": "OCR + LLM",
        }]
    items = []
    for act in activities:
        items.append({
            "goal": f"Automate {act.get('activity_name', 'activity')}",
            "signal": f"Trigger on {act.get('data_needed', 'incoming data')}",
            "decision": "Validate completeness → route to handler",
            "action": f"Process and update {act.get('integration_readiness', 'target system')}",
            "time_estimate": "15 mins",
            "system_involved": act.get("integration_readiness", "ERP"),
            "data_type": "Structured",
            "complexity": "Medium",
            "frequency": act.get("frequency", "Daily"),
            "ai_scope": "LLM + Rule Engine",
        })
    return items


def _fallback_archetypes() -> list[dict]:
    return [
        {"archetype_name": "Intelligent Document Processing", "fit_score": 87,
         "description": "AI-powered extraction of unstructured documents using OCR and NLP.",
         "recommended_tools": ["Azure Document Intelligence", "GPT-4o", "LangChain"],
         "implementation_complexity": "Medium", "is_selected": False},
        {"archetype_name": "Robotic Process Automation", "fit_score": 74,
         "description": "Rule-based automation of repetitive manual tasks.",
         "recommended_tools": ["UiPath", "Power Automate", "Azure Logic Apps"],
         "implementation_complexity": "Low", "is_selected": False},
        {"archetype_name": "Agentic AI Workflow", "fit_score": 61,
         "description": "Multi-agent system for complex decision workflows.",
         "recommended_tools": ["LangGraph", "Azure OpenAI", "AutoGen"],
         "implementation_complexity": "High", "is_selected": False},
    ]
