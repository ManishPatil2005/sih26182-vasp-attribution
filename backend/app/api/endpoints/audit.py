from typing import List, Optional
from fastapi import APIRouter, Query
from app.models.schemas import AuditBlock, BSACertificate
from app.storage.audit_ledger import audit_ledger
from app.storage.graph_engine import graph_engine
from app.core.config import settings

router = APIRouter()


@router.get("/ledger", response_model=List[AuditBlock])
async def get_audit_ledger():
    """
    Returns full append-only SHA-256 cryptographic audit chain.
    """
    return audit_ledger.get_all_blocks()


@router.get("/verify")
async def verify_ledger_integrity():
    """
    Validates complete mathematical integrity of the hash chain
    from Genesis to current block.
    """
    is_valid, message, corrupt_index = audit_ledger.verify_integrity()
    return {
        "verified": is_valid,
        "message": message,
        "total_blocks": len(audit_ledger.chain),
        "corrupted_block_index": corrupt_index
    }


@router.get("/bsa-certificate", response_model=BSACertificate)
async def generate_bsa_certificate(
    officer_name: Optional[str] = Query(settings.DEFAULT_IO_NAME),
    station_code: Optional[str] = Query(settings.OFFICER_STATION_CODE)
):
    """
    Generates official Electronic Evidence Certificate under
    Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA).
    """
    # Gather all evidence artifacts from the graph
    artifacts = []
    seen = set()
    for node in graph_engine.node_store.values():
        for ref in node.evidence_refs:
            if ref.doc_id not in seen:
                seen.add(ref.doc_id)
                artifacts.append({
                    "doc_id": ref.doc_id,
                    "sha256": ref.doc_sha256,
                    "type": ref.source_type
                })

    return audit_ledger.generate_bsa_certificate(
        officer_name=officer_name,
        station_code=station_code,
        ingested_files=artifacts
    )
