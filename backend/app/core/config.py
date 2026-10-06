import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "SAHYOG-VASP AI (SIH26182)"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    PROBLEM_STATEMENT_ID: str = "SIH26182"
    PROBLEM_TITLE: str = "Automated Attribution of Unknown Cryptocurrency Wallets to Nearest Virtual Asset Service Providers (VASPs) through Blockchain Intelligence APIs"
    LEGAL_JURISDICTION: str = "MHA / I4C / Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023"

    # Host & Port
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
        "https://sih26182-vasp-attribution.vercel.app",
        "https://sih26182-vasp-attribution.onrender.com",
    ]

    # Security & Cryptography
    SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-bsa2023"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    AUDIT_LOG_SALT: str = "crimegraph-bsa-2023-salt"

    # Graph Engine Mode: "inmemory" or "hybrid"
    GRAPH_ENGINE: str = "hybrid"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # Storage Paths
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    AUDIT_LEDGER_PATH: str = os.path.join(DATA_DIR, "audit_ledger.json")
    UPLOADS_DIR: str = os.path.join(DATA_DIR, "raw", "uploads")

    # Legal & Officer
    OFFICER_STATION_CODE: str = "MHA-I4C-HQ-01"
    DEFAULT_IO_NAME: str = "Insp. V. S. Chauhan (I4C-CRYPTO-782)"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.DATA_DIR, "raw"), exist_ok=True)
os.makedirs(os.path.join(settings.DATA_DIR, "processed"), exist_ok=True)
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
