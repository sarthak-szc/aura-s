# AuRA — Deploy (GitHub → live link)

Repo: https://github.com/sarthak-szc/aura-s

## Step 1 — Backend (Render) ~10 min

1. Open: **https://render.com/deploy?repo=https://github.com/sarthak-szc/aura-s**
2. Sign in with GitHub → **Apply**
3. **Environment** — paste from your local `Aura Platform Backend/.env`:
   - `MONGO_URL`
   - `AZURE_STORAGE_CONNECTION_STRING`
   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_ENDPOINT`
   - (JWT auto-generated)
4. **Create Web Service** → wait deploy
5. Copy API URL: `https://aura-api-xxxx.onrender.com`
6. Browser once: `https://aura-api-xxxx.onrender.com/api/auth/setup`

## Step 2 — Frontend (Vercel) ~5 min

1. Open: **https://vercel.com/new/clone?repository-url=https://github.com/sarthak-szc/aura-s**
2. **Root Directory:** `Aura Platform Frontend`
3. **Environment variable:**
   ```
   NEXT_PUBLIC_API_URL = https://aura-api-xxxx.onrender.com
   ```
4. **Deploy** → copy: `https://xxxx.vercel.app`

## Step 3 — CORS (Render)

Render → aura-api → Environment → add/update:
```
CORS_ORIGINS=https://xxxx.vercel.app,http://localhost:3000
```
Save → Manual Deploy.

## Manager link

```
https://xxxx.vercel.app/login
admin@aura.com / Admin@123
```
