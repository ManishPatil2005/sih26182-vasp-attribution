from fastapi import APIRouter
from app.api.endpoints import (
    ingest, 
    graph, 
    analytics, 
    audit, 
    audio, 
    stream, 
    report, 
    prediction, 
    spatial, 
    copilot, 
    interception,
    crypto,
    disruption,
    auth,
    vasp,
    sahyog
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Sovereign Authentication & 2FA Gate"])

# SIH26182 Priority Flagship Routers
api_router.include_router(vasp.router, prefix="/vasp", tags=["SIH26182 - VASP Attribution Engine"])
api_router.include_router(sahyog.router, prefix="/sahyog", tags=["SIH26182 - MHA Sahyog Freezing Requisition"])

api_router.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion & Identity Fusion"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph Engine"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["AI Graph Analytics & Motifs"])
api_router.include_router(audit.router, prefix="/audit", tags=["Legal Audit & BSA 2023 Sec 63"])
api_router.include_router(audio.router, prefix="/audio", tags=["Audio Intercepts & Acoustic Speech Intelligence"])
api_router.include_router(stream.router, prefix="/stream", tags=["Real-Time Analytics (RTA) & Live Intercept Stream"])
api_router.include_router(report.router, prefix="/report", tags=["Forensic Dossiers & Court Reports"])
api_router.include_router(prediction.router, prefix="/prediction", tags=["AI Link Prediction"])
api_router.include_router(spatial.router, prefix="/spatial", tags=["Spatio-Temporal Co-Location & GIS"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["Investigator Copilot AI"])
api_router.include_router(interception.router, prefix="/interception", tags=["National Scale & Lawful Interception Gateway"])
api_router.include_router(crypto.router, prefix="/crypto", tags=["Web3 & Darknet Crypto-Hawala Forensics"])
api_router.include_router(disruption.router, prefix="/disruption", tags=["Target Neutralization & Syndicate Disruption Planner"])

