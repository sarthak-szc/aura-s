# AuRA — AI Discovery Platform

SenzCraft process assessment platform (7-step wizard).

## Structure

| Folder | Description |
|--------|-------------|
| `Aura Platform Backend` | FastAPI + MongoDB + Azure OpenAI |
| `Aura Platform Frontend` | Next.js 16 + React 19 |
| `aura-s` | Local Python venv (not in git) |

## Setup

```powershell
# 1. Venv
python -m venv aura-s
aura-s\Scripts\activate
pip install -r "Aura Platform Backend\requirements.txt"

# 2. Backend .env
copy "Aura Platform Backend\.env.example" "Aura Platform Backend\.env"
# Edit MONGO_URL, Azure keys, JWT_SECRET

# 3. Run
run-backend.bat
run-frontend.bat
```

Login: `http://localhost:3000/login`  
Setup once: `http://localhost:8000/api/auth/setup`  
Default: `admin@aura.com` / see `.env`

## Docs

See `docs/AURA/` for sprint plan and project status.
