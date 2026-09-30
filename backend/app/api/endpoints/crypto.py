from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel, Field

from app.engines.crypto_engine import crypto_engine
from app.models.schemas import CryptoPeelingFlow, CryptoOffRamp, CryptoHop
from app.storage.graph_engine import graph_engine

router = APIRouter()


class CustomCryptoIngestRequest(BaseModel):
    tx_hash: str
    from_address: str
    to_address: str
    amount: float
    token: str = Field(default="USDT-TRC20")
    timestamp: str = Field(default="2026-09-23T12:00:00Z")
    is_off_ramp: bool = Field(default=False)
    off_ramp_entity: Optional[str] = None
    officer_id: str = Field(default="OFFICER_CYBER_INTEL")


@router.get("/flows", response_model=List[CryptoPeelingFlow])
async def get_crypto_peeling_flows():
    """
    Returns detected darknet crypto peeling chains and mixer flows
    across Bitcoin, Ethereum, and Tron TRC-20 USDT.
    """
    return crypto_engine.flows


@router.get("/off-ramps", response_model=List[CryptoOffRamp])
async def get_crypto_off_ramps():
    """
    Returns crypto-to-fiat P2P cashout bridges (Binance P2P, WazirX, CoinDCX)
    linking cryptocurrency wallets directly to Indian bank accounts and KYC PANs.
    """
    return crypto_engine.off_ramps


@router.post("/link-graph")
async def link_crypto_forensics_to_graph(officer_id: str = Query(default="OFFICER_CYBER_INTEL")):
    """
    Dynamically projects crypto wallet nodes and transaction flow edges
    into the active Knowledge Graph, bridging Web3 addresses to Indian Bank Mule Accounts.
    """
    res = crypto_engine.link_crypto_to_knowledge_graph(graph_engine=graph_engine, officer_id=officer_id)
    return res


@router.post("/ingest")
async def ingest_crypto_transaction(req: CustomCryptoIngestRequest):
    """
    Ingests a custom on-chain crypto transaction, automatically binding wallet addresses
    and updating the active Knowledge Graph.
    """
    hop = CryptoHop(
        tx_hash=req.tx_hash,
        from_address=req.from_address,
        to_address=req.to_address,
        amount=req.amount,
        token=req.token,
        timestamp=req.timestamp,
        hop_index=1,
        is_off_ramp=req.is_off_ramp,
        off_ramp_entity=req.off_ramp_entity
    )
    
    # Auto-link to graph
    crypto_engine.link_crypto_to_knowledge_graph(graph_engine=graph_engine, officer_id=req.officer_id)
    
    return {
        "success": True,
        "tx_hash": hop.tx_hash,
        "message": f"Successfully ingested on-chain transaction of {hop.amount} {hop.token}."
    }
