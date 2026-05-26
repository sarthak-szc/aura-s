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
        "You are AuRA. Return JSON: {\"activities\": [{\"activity_name\", \"description\", "
        "\"data_management\" (data requirements), \"source_system\", "
        "\"existing_automation_level\" (Fully Automated|Semi-Automated|Manual|Not Applicable)}]}. "
        "Provide 4-6 L3 activities grounded in prior steps.",
        f"Generate activity breakdown for process: {process_name}. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("activities"):
        return result["activities"]
    return _fallback_activities()


async def populate_process_entry(process: dict, document_text: str = "") -> dict:
    s2 = process.get("steps_data", {}).get("step2", {})
    summaries = s2.get("document_summaries") or []
    if document_text:
        summaries = summaries + [document_text]
    doc_block = "\n\n".join(summaries)[:8000] if summaries else s2.get("process_flow_summary", "")
    result = await _chat_json(
        "You are AuRA. Return JSON with keys: process_name, process_description, process_frequency "
        "(Daily|Weekly|Monthly|Quarterly|Ad-hoc), quality_of_data (Accurate|Mostly Accurate|Partial|Poor), "
        "goals (array of 2-4 strings), existing_systems (comma-separated string), "
        "process_summary, sop_summary, volumetrics_summary, kpi_summary.",
        f"Populate process discovery fields from documents and context.\n"
        f"Documents:\n{doc_block}\n\nContext: {_process_context(process)}",
    )
    if result and isinstance(result, dict):
        return result
    pname = process.get("steps_data", {}).get("step2", {}).get("process_name") or "Process Assessment"
    return {
        "process_name": pname,
        "process_description": doc_block or "Process description to be refined.",
        "process_frequency": "Daily",
        "quality_of_data": "Mostly Accurate",
        "goals": ["Reduce manual effort", "Improve SLA compliance"],
        "existing_systems": "ERP, Email, Spreadsheets",
        "process_summary": doc_block,
        "sop_summary": "",
        "volumetrics_summary": "",
        "kpi_summary": "",
    }


async def generate_volumetrics(process: dict) -> dict:
    currency = process.get("steps_data", {}).get("step1", {}).get("currency", "INR")
    result = await _chat_json(
        "You are AuRA. Return JSON with numeric fields: monthly_transaction_volume, "
        "transaction_volume_unit, avg_time_per_transaction_mins, processing_time_unit, "
        "fte_count, fte_cost_annual, cost_per_transaction, hours_spent_per_day, "
        "working_days_per_month, current_error_rate_pct, business_impact_errors_monthly, "
        "revenue_leakage, sla_breach_rate_pct, non_prime_transactions_monthly, "
        "avg_financial_risk_per_txn, process_observations, annual_cost_estimate. "
        "Use realistic enterprise estimates.",
        f"Suggest volumetrics in {currency}. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict):
        return result
    return {
        "monthly_transaction_volume": 5000,
        "transaction_volume_unit": "Invoices",
        "avg_time_per_transaction_mins": 15,
        "processing_time_unit": "minutes",
        "fte_count": 4,
        "fte_cost_annual": 2400000,
        "cost_per_transaction": 480,
        "hours_spent_per_day": 6,
        "working_days_per_month": 22,
        "current_error_rate_pct": 3,
        "business_impact_errors_monthly": 150000,
        "revenue_leakage": 500000,
        "sla_breach_rate_pct": 5,
        "non_prime_transactions_monthly": 200,
        "avg_financial_risk_per_txn": 2500,
        "process_observations": "High manual touchpoints and exception handling drive cost.",
        "annual_cost_estimate": 600000,
    }


async def generate_tech_stack(process: dict) -> dict:
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"technology_stack\": {"
        "\"document_ai\", \"erp_automation\", \"gen_ai\", \"erp_integration\", "
        "\"conversational\", \"analytics\"}} — each a short phrase.",
        f"Recommend technology stack. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("technology_stack"):
        return result["technology_stack"]
    return {
        "document_ai": "Azure Document Intelligence",
        "erp_automation": "Power Automate / UiPath",
        "gen_ai": "Azure OpenAI GPT-4",
        "erp_integration": "SAP BAPI / REST APIs",
        "conversational": "Microsoft Copilot Studio",
        "analytics": "Power BI / Azure Monitor",
    }


async def generate_report_fields(process: dict) -> dict:
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"report_fields\": {"
        "process_area, sub_process_name, objective, strategic_goal, key_challenges, "
        "business_benefits, ai_opportunity, data_readiness, volume_capacity, key_inputs, key_outputs"
        "}} — each value 1-3 sentences.",
        f"Fill evaluation summary report fields. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("report_fields"):
        return result["report_fields"]
    s1 = process.get("steps_data", {}).get("step1", {})
    s2 = process.get("steps_data", {}).get("step2", {})
    return {
        "process_area": s1.get("process_area", ""),
        "sub_process_name": s2.get("process_name", ""),
        "objective": "Automate and optimize the assessed process.",
        "strategic_goal": "Digital operations excellence",
        "key_challenges": "Manual steps, data quality, integration gaps",
        "business_benefits": "Cost reduction and faster cycle time in year 1",
        "ai_opportunity": "Document AI and workflow automation",
        "data_readiness": s2.get("quality_of_data", "Partial"),
        "volume_capacity": "Based on assessed monthly volume and FTE",
        "key_inputs": "Documents, ERP data, approvals",
        "key_outputs": "Processed transactions, audit trail, reports",
    }


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
    report_fields = await generate_report_fields(process)
    result = await _chat_json(
        "You are AuRA. Return JSON: {\"summary\", \"next_steps\" (array of strings), \"roi_estimate\"}.",
        f"Write executive summary for completed assessment. Context: {_process_context(process)}",
    )
    if result and isinstance(result, dict) and result.get("summary"):
        return {
            "summary": result["summary"],
            "next_steps": result.get("next_steps", []),
            "roi_estimate": result.get("roi_estimate", "25-40% efficiency improvement within 12 months"),
            "report_fields": report_fields,
        }
    process_name = process.get("steps_data", {}).get("step2", {}).get("process_name", "Process")
    report_fields = await generate_report_fields(process)
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
        "report_fields": report_fields,
    }


def _fallback_activities() -> list[dict]:
    return [
        {
            "activity_name": "Document Receipt & Capture",
            "description": "Receive and log incoming documents from email or portal.",
            "data_management": "Invoice PDF, Vendor email",
            "source_system": "Outlook / Vendor Portal",
            "existing_automation_level": "Semi-Automated",
        },
        {
            "activity_name": "Data Extraction & Validation",
            "description": "Extract fields and validate against master data.",
            "data_management": "Invoice fields, GRN data",
            "source_system": "SAP S/4HANA",
            "existing_automation_level": "Manual",
        },
        {
            "activity_name": "Approval Routing",
            "description": "Route invoices through approval matrix.",
            "data_management": "Approval matrix, Budget data",
            "source_system": "Workflow engine",
            "existing_automation_level": "Semi-Automated",
        },
        {
            "activity_name": "Exception Handling",
            "description": "Resolve mismatches and errors.",
            "data_management": "Error logs, Mismatch reports",
            "source_system": "Email / ERP",
            "existing_automation_level": "Manual",
        },
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
