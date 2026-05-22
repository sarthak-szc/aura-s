from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List

# ── Contact Person ────────────────────────────────────────────────────────────
class ContactPerson(BaseModel):
    name: str
    email: EmailStr
    phone: str
    designation: Optional[str] = ""

    @validator('name')
    def name_valid(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Contact name must be at least 2 characters')
        return v

    @validator('phone')
    def phone_valid(cls, v):
        digits = ''.join(filter(str.isdigit, v))
        if len(digits) < 10:
            raise ValueError('Phone must be at least 10 digits')
        return v

# ── Client Schemas ────────────────────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str
    industry: Optional[str] = ""
    address: Optional[str] = ""
    contact_person: ContactPerson
    currency: Optional[str] = "INR"

    @validator('name')
    def name_valid(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Company name must be at least 2 characters')
        return v

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[ContactPerson] = None
    currency: Optional[str] = None

# ── Process Step 1 — Customer Info ────────────────────────────────────────────
class Step1Data(BaseModel):
    client_id: str
    assessment_date: str
    currency: Optional[str] = "INR"

    @validator('client_id')
    def client_id_valid(cls, v):
        if not v or len(v) < 5:
            raise ValueError('Valid client ID is required')
        return v

    @validator('assessment_date')
    def date_valid(cls, v):
        if not v:
            raise ValueError('Assessment date is required')
        return v

# ── Process Step 2 — Process Entry ───────────────────────────────────────────
class Step2Data(BaseModel):
    process_name: str
    process_description: Optional[str] = ""
    goals: Optional[List[str]] = []
    existing_systems: Optional[str] = ""
    maturity_level: Optional[str] = ""
    process_summary: Optional[str] = ""
    sop_summary: Optional[str] = ""
    volumetrics_summary: Optional[str] = ""
    kpi_summary: Optional[str] = ""

    @validator('process_name')
    def process_name_valid(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Process name must be at least 3 characters')
        return v

# ── Process Step 3 — Process Volumetrics ─────────────────────────────────────
class Step3Data(BaseModel):
    key_challenges: Optional[List[str]] = []
    key_improvement_areas: Optional[str] = ""
    monthly_transaction_volume: Optional[int] = 0
    fte_count: Optional[int] = 0
    avg_time_per_transaction_mins: Optional[float] = 0
    avg_revenue_per_transaction: Optional[float] = 0
    revenue_leakage: Optional[float] = 0
    delay_impact_on_revenue_pct: Optional[float] = 0
    risk_prone_transactions_count: Optional[int] = 0
    avg_financial_risk_per_txn: Optional[float] = 0
    sla_breach_rate_pct: Optional[float] = 0
    success_metrics: Optional[List[dict]] = []
    annual_cost_estimate: Optional[float] = 0

# ── Process Step 4 — Activity Breakdown ──────────────────────────────────────
class Activity(BaseModel):
    activity_name: str
    data_needed: Optional[str] = ""
    data_readiness: Optional[str] = "Available"
    ai_automation_potential: Optional[str] = "Medium"
    integration_readiness: Optional[str] = ""
    frequency: Optional[str] = "Daily"

    @validator('activity_name')
    def activity_name_valid(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Activity name must be at least 2 characters')
        return v

    @validator('data_readiness')
    def data_readiness_valid(cls, v):
        allowed = ['Available', 'Partial', 'Missing']
        if v not in allowed:
            raise ValueError(f'Must be one of: {allowed}')
        return v

    @validator('ai_automation_potential')
    def automation_valid(cls, v):
        allowed = ['Low', 'Medium', 'High']
        if v not in allowed:
            raise ValueError(f'Must be one of: {allowed}')
        return v

class Step4Data(BaseModel):
    activities: List[Activity]

    @validator('activities')
    def activities_valid(cls, v):
        if len(v) < 1:
            raise ValueError('At least one activity is required')
        return v