"""
BAM! Anti-Procrastination Platform — Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# SQLite path — uses forward slashes which work on BOTH Windows and Linux
# Result on Linux:   sqlite:////home/z/my-project/mini-services/bam-api/data/bam.db
# Result on Windows: sqlite:///C:/Users/.../bam-api/data/bam.db
DB_FILE_PATH = (DATA_DIR / "bam.db").as_posix()
DEFAULT_DATABASE_URL = f"sqlite:///{DB_FILE_PATH}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        env_prefix="BAM_",  # All env vars must start with BAM_ to avoid colliding with Next.js .env
        extra="ignore",
    )

    # Server
    APP_NAME: str = "BAM! API"
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Security
    SECRET_KEY: str = "bam-comic-secret-key-change-in-production-2026-very-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # Database — uses default computed above; can be overridden via env var
    DATABASE_URL: str = DEFAULT_DATABASE_URL

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    AI_SERVICE_URL: str = "http://localhost:3000/api/ai"


settings = Settings()
