import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "AuRA API"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    MONGO_URL: str = os.getenv("MONGO_URL", "")
    MONGO_DB: str = os.getenv("MONGO_DB", "aura_db")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_BLOB_CONTAINER: str = os.getenv("AZURE_BLOB_CONTAINER", "aura-uploads")

    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")

    ADMIN_SETUP_ENABLED: bool = os.getenv("ADMIN_SETUP_ENABLED", "true").lower() == "true"
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@aura.com")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@123")

    @property
    def azure_openai_endpoint(self) -> str:
        """Normalize endpoint — base URL only, no /openai/v1 or stray quotes."""
        ep = (self.AZURE_OPENAI_ENDPOINT or "").strip()
        ep = ep.replace("%22", "").replace('"', "")
        for suffix in ("/openai/v1", "/openai"):
            if ep.lower().endswith(suffix):
                ep = ep[: -len(suffix)]
        return ep.rstrip("/")

    @property
    def ai_enabled(self) -> bool:
        return bool(self.AZURE_OPENAI_API_KEY and self.azure_openai_endpoint)


@lru_cache
def get_settings() -> Settings:
    return Settings()
