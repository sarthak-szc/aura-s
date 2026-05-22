# AuRA Platform Backend

## Setup (use `aura-s` venv)

```powershell
cd "Aura Planning Project"
.\aura-s\Scripts\Activate.ps1
pip install -r "Aura Platform Backend\requirements.txt"
```

Copy `.env.example` → `.env` and fill values (MongoDB, Azure Blob, JWT secret).

First run — create admin:

```http
POST http://localhost:8000/api/auth/setup
```

## Run

```powershell
cd "Aura Platform Backend"
..\aura-s\Scripts\uvicorn.exe main:app --reload --port 8000
```

## Azure OpenAI (optional)

When you have keys, add to `.env`:

```
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

Without keys, AI endpoints return smart fallbacks.

## Auth

- Login: `POST /api/auth/login` → JWT Bearer token
- All `/api/v1/*` routes require `Authorization: Bearer <token>`
- Admin routes require `role: admin`
