"""
VASP Attribution API Endpoints (SIH26182)
Automated Attribution of Unknown Cryptocurrency Wallets to Nearest Virtual Asset Service Providers (VASPs)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.engines.vasp_attribution_engine import vasp_engine
from app.models.schemas import BlockchainNetwork, VASPAttributionResult, VASPProfile

router = APIRouter()


class WalletAttributionRequest(BaseModel):
    wallet_address: str = Field(..., description="Target suspect wallet address")
    network: Optional[BlockchainNetwork] = Field(default=BlockchainNetwork.TRON, description="Blockchain network")
    officer_id: Optional[str] = Field(default="INSP_I4C_OFFICER", description="Investigating officer badge/ID")


@router.post("/attribute", response_model=VASPAttributionResult)
async def attribute_wallet(payload: WalletAttributionRequest):
    """
    Automated Attribution of Unknown Cryptocurrency Wallets to Nearest VASPs
    through multi-hop blockchain intelligence tracing, deposit sweep identification,
    and confidence scoring under SIH26182.
    """
    if not payload.wallet_address or not payload.wallet_address.strip():
        raise HTTPException(status_code=400, detail="Wallet address cannot be empty")

    result = vasp_engine.attribute_wallet(
        wallet_address=payload.wallet_address.strip(),
        network=payload.network or BlockchainNetwork.TRON,
        officer_id=payload.officer_id or "INSP_I4C_OFFICER"
    )
    return result


@router.get("/clusters", response_model=List[VASPProfile])
async def get_vasp_clusters():
    """
    Returns Master Registry of known Virtual Asset Service Providers (VASPs),
    including FIU-IND compliance registration numbers, nodal officer contacts,
    known cluster address counts, and supported blockchain networks.
    """
    return list(vasp_engine.vasp_registry.values())


@router.get("/clusters/{vasp_id}", response_model=VASPProfile)
async def get_vasp_by_id(vasp_id: str):
    """
    Returns VASP profile by identifier (e.g. VASP-BINANCE, VASP-WAZIRX, VASP-COINDCX).
    """
    vasp = vasp_engine.vasp_registry.get(vasp_id.upper())
    if not vasp:
        raise HTTPException(status_code=404, detail=f"VASP '{vasp_id}' not found in registry")
    return vasp


@router.get("/supported-chains")
async def get_supported_chains():
    """
    Returns status and benchmark latency of multi-chain blockchain intelligence parsers
    (Tron TRC-20, Ethereum ERC-20, Bitcoin UTXO, BNB Chain, Solana, Polygon).
    """
    return vasp_engine.get_supported_chains_summary()
