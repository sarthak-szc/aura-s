# AuRA — Run guide (3 folders)

| Folder | Purpose |
|--------|---------|
| `aura-s` | Python 3.13 virtual environment |
| `Aura Platform Backend` | FastAPI API |
| `Aura Platform Frontend` | Next.js UI |

## 1. Backend

```powershell
.\aura-s\Scripts\Activate.ps1
pip install -r "Aura Platform Backend\requirements.txt"
# Edit Aura Platform Backend\.env
cd "Aura Platform Backend"
uvicorn main:app --reload --port 8000
```

First time: `POST http://localhost:8000/api/auth/setup`  
Login: `admin@aura.com` / password from `.env`

## 2. Frontend

```powershell
cd "Aura Platform Frontend"
# copy .env.local.example → .env.local
npm run dev
```

Open http://localhost:3000

## 3. Azure OpenAI (when key available)

Add to `Aura Platform Backend\.env`:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`

Restart backend — `/health` shows `"ai_enabled": true`.

## Reference docs

Place in `docs/AURA/`:

- `AI_Procurement_Implementation_Plan.pdf`
- `Murli_AURA_Assessment_Detailed_Documentation_V1.2.docx`
