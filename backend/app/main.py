from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.storage.audit_ledger import audit_ledger
from app.core.security import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Production Lifespan: Verifies Section 63 BSA 2023 tamper-evident audit ledger
    on server boot and ensures cryptographic readiness.
    """
    is_valid, msg, _ = audit_ledger.verify_integrity()
    print(f"[SECURITY] Tamper-Evident Ledger initialized: {msg} (Blocks: {len(audit_ledger.chain)})")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Automated Attribution of Unknown Cryptocurrency Wallets to Nearest VASPs "
        "and Criminal Network Analysis for Ministry of Home Affairs (I4C / MIC) under SIH26182. "
        "Transforms unhosted suspect crypto flows into actionable Section 94 BNSS statutory freezing "
        "notices with Merkle-audited forensic proofs."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# High-Performance Compression for large Graph and Telemetry payloads
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|(.*\.vercel\.app)|(.*\.onrender\.com))(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Zero-Trust Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["System"])
async def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "organization": "Ministry of Home Affairs / I4C / MIC",
        "problem_statement_id": settings.PROBLEM_STATEMENT_ID,
        "problem_title": settings.PROBLEM_TITLE,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "legal_compliance": "Bharatiya Nagarik Suraksha Sanhita, 2023 (Section 94) & BSA 2023 (Section 63)"
    }


@app.get("/health", tags=["System"])
async def health_check():
    is_valid, msg, _ = audit_ledger.verify_integrity()
    return {
        "status": "HEALTHY",
        "audit_ledger_verified": is_valid,
        "total_audit_blocks": len(audit_ledger.chain)
    }
