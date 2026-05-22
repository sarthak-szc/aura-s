import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routes.auth import router as auth_router
from routes.clients import router as clients_router
from routes.process import router as process_router
from routes.upload import router as upload_router
from routes.report import router as report_router
from routes.admin import router as admin_router

settings = get_settings()
logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.MONGO_URL:
        logging.error("MONGO_URL missing — set .env before starting")
    if settings.ai_enabled:
        logging.info("Azure OpenAI: enabled")
    else:
        logging.info("Azure OpenAI: disabled (using fallback responses)")
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(process_router)
app.include_router(upload_router)
app.include_router(report_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "AuRA API running",
        "env": settings.ENV,
        "ai_enabled": settings.ai_enabled,
    }


@app.get("/health")
def health():
    return {"status": "ok", "ai_enabled": settings.ai_enabled}
