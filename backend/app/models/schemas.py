from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class EntityType(str, Enum):
    PERSON = "PERSON"
    PHONE = "PHONE"
    ACCOUNT = "ACCOUNT"
    VEHICLE = "VEHICLE"
    LOCATION = "LOCATION"
    CRIME_INCIDENT = "CRIME_INCIDENT"
    ORGANIZATION = "ORGANIZATION"
    CRYPTO_WALLET = "CRYPTO_WALLET"


class RelationType(str, Enum):
    CALLED = "CALLED"
    TRANSFERRED_MONEY = "TRANSFERRED_MONEY"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    CO_LOCATED_AT = "CO_LOCATED_AT"
    OPERATES = "OPERATES"
    ACCUSED_IN = "ACCUSED_IN"
    OWNS_VEHICLE = "OWNS_VEHICLE"
    TRANSFERRED_CRYPTO = "TRANSFERRED_CRYPTO"
    EXCHANGED_FIAT = "EXCHANGED_FIAT"


class EvidenceReference(BaseModel):
    doc_id: str
    doc_sha256: str
    source_type: str = "FIR"  # FIR, CDR, BANK, SURVEILLANCE
    snippet: Optional[str] = None
    char_span: Optional[List[int]] = None
    confidence: float = 1.0


class GraphNode(BaseModel):
    id: str
    type: EntityType
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    centrality: Dict[str, float] = Field(default_factory=dict)
    community_id: Optional[int] = None
    evidence_refs: List[EvidenceReference] = Field(default_factory=list)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: RelationType
    properties: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None
    weight: float = 1.0
    evidence_refs: List[EvidenceReference] = Field(default_factory=list)


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestResponse(BaseModel):
    success: bool
    filename: str
    file_sha256: str
    records_processed: int
    entities_extracted: int
    relationships_created: int
    audit_block_hash: str
    message: str


class SplinkMergeCandidate(BaseModel):
    candidate_a: GraphNode
    candidate_b: GraphNode
    similarity_score: float
    matching_attributes: List[str]
    suggested_action: str  # AUTO_MERGE, HUMAN_REVIEW, ISOLATE


class AuditBlock(BaseModel):
    index: int
    timestamp: str
    officer_id: str
    action: str
    target_id: Optional[str] = None
    payload_hash: str
    prev_hash: str
    block_hash: str


class BSACertificate(BaseModel):
    certificate_id: str
    issue_date: str
    governing_act: str = "Bharatiya Sakshya Adhiniyam, 2023 (Section 63)"
    police_station_code: str
    officer_in_charge: str
    system_hash_chain_verified: bool
    total_evidence_blocks: int
    latest_block_hash: str
    ingested_artifacts: List[Dict[str, str]]
    declaration: str
    hmac_seal: Optional[str] = None


class AnalyticsSummary(BaseModel):
    total_nodes: int
    total_edges: int
    masterminds: List[Dict[str, Any]]
    brokers: List[Dict[str, Any]]
    closeness_leaders: List[Dict[str, Any]] = Field(default_factory=list)
    multi_factor_threats: List[Dict[str, Any]] = Field(default_factory=list)
    communities: Dict[int, List[str]]
    suspicious_motifs: List[Dict[str, Any]]


class PathwayStep(BaseModel):
    step_number: int
    from_node: str
    from_label: str
    relation: str
    to_node: str
    to_label: str
    evidence_type: str
    weight: float


class PathfinderResponse(BaseModel):
    source_id: str
    target_id: str
    connected: bool
    path_length: int
    node_sequence: List[str]
    steps: List[PathwayStep]
    tactical_summary: str


class SyndicateRole(BaseModel):
    node_id: str
    label: str
    role_category: str  # KINGPIN, BROKER, LOGISTICS, ENFORCER, MULE, FRONT
    threat_level: str
    risk_score: float
    influence_summary: str
    subordinates_or_associates: List[str] = Field(default_factory=list)


class CryptoHop(BaseModel):
    tx_hash: str
    from_address: str
    to_address: str
    amount: float
    token: str  # BTC, ETH, USDT-TRC20
    timestamp: str
    hop_index: int
    is_off_ramp: bool = False
    off_ramp_entity: Optional[str] = None


class CryptoPeelingFlow(BaseModel):
    flow_id: str
    origin_wallet: str
    syndicate_owner: str
    total_laundered_usd: float
    chain: str  # BTC, ETH, TRON
    hops: List[CryptoHop]
    tainted_score: float
    destination_mule_account: Optional[str] = None


class CryptoOffRamp(BaseModel):
    off_ramp_id: str
    exchange_name: str  # Binance P2P, WazirX, CoinDCX
    wallet_address: str
    bank_account_number: str
    account_holder: str
    total_fiat_inr: float
    kyc_pan: str
    evidence_block_hash: str


class DisruptionImpact(BaseModel):
    targeted_nodes: List[str]
    targeted_labels: List[str]
    initial_components: int
    remaining_components: int
    initial_giant_component_size: int
    remaining_giant_component_size: int
    syndicate_disruption_index: float  # 0.0 to 100.0%
    communication_edges_severed: int
    hawala_capacity_paralyzed_pct: float
    tactical_verdict: str


class DisruptionRecommendation(BaseModel):
    rank: int
    target_nodes: List[str]
    target_names: List[str]
    predicted_disruption_index: float
    justification: str
    cut_vertex: bool = False


# =========================================================================
# SIH26182: VASP Attribution & SAHYOG Ecosystem Schemas
# =========================================================================

class BlockchainNetwork(str, Enum):
    BITCOIN = "BITCOIN"
    ETHEREUM = "ETHEREUM"
    TRON = "TRON"
    BNB_CHAIN = "BNB_CHAIN"
    SOLANA = "SOLANA"
    POLYGON = "POLYGON"


class VASPCategory(str, Enum):
    CENTRALIZED_EXCHANGE = "CENTRALIZED_EXCHANGE"
    CUSTODIAL_WALLET = "CUSTODIAL_WALLET"
    P2P_DESK = "P2P_DESK"
    DEFI_BRIDGE = "DEFI_BRIDGE"
    MIXER_TUMBLER = "MIXER_TUMBLER"


class LaunderingTypology(str, Enum):
    DIRECT_DEPOSIT = "DIRECT_DEPOSIT"
    PEELING_CHAIN = "PEELING_CHAIN"
    STRUCTURING_SMURFING = "STRUCTURING_SMURFING"
    MIXER_HOP = "MIXER_HOP"
    CROSS_CHAIN_BRIDGE = "CROSS_CHAIN_BRIDGE"


class VASPProfile(BaseModel):
    vasp_id: str
    name: str
    category: VASPCategory
    jurisdiction: str
    compliance_email: str
    sahyog_registered_id: str
    nodal_officer: str
    known_cluster_addresses_count: int
    supported_chains: List[BlockchainNetwork]
    risk_rating: str = "COMPLIANT_VASP"


class TransactionPathStep(BaseModel):
    hop_number: int
    tx_hash: str
    from_address: str
    to_address: str
    amount: float
    token: str
    timestamp: str
    step_type: str  # INITIAL_SUSPECT, INTERMEDIATE_MULE, MIXER_HOP, DEFI_BRIDGE, VASP_DEPOSIT_SWEEP, VASP_HOT_WALLET
    entity_label: Optional[str] = None


class VASPAttributionResult(BaseModel):
    attribution_id: str
    query_wallet: str
    blockchain: BlockchainNetwork
    attribution_status: str  # ATTRIBUTED_DIRECT, ATTRIBUTED_MULTI_HOP, MIXER_DECOUPLED, PENDING_SWEEP
    nearest_vasp: VASPProfile
    hop_distance: int
    attribution_confidence_percent: float
    deposit_address: str
    deposit_tx_hash: str
    attributed_amount_crypto: float
    token_symbol: str
    attributed_amount_usd: float
    estimated_amount_inr: float
    laundering_typology: LaunderingTypology
    path_steps: List[TransactionPathStep]
    freeze_action_recommended: bool = True
    sahyog_notice_draft: Dict[str, Any] = Field(default_factory=dict)
    merkle_evidence_hash: str


class SahyogCase(BaseModel):
    case_id: str
    fir_number: str
    police_station: str
    investigating_officer: str
    victim_name: str
    crime_category: str  # INVESTMENT_SCAM, SEXTORTION, RANSOMWARE, PHISHING, TASK_FRAUD
    victim_loss_inr: float
    suspect_wallets: List[str]
    assigned_agency: str
    status: str  # UNDER_ANALYSIS, ATTRIBUTED, FREEZE_NOTICE_ISSUED, ASSETS_FROZEN
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    attributions: List[VASPAttributionResult] = Field(default_factory=list)


class SahyogFreezeRequisition(BaseModel):
    requisition_id: str
    case_id: str
    statute: str = "Section 94, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 91 CrPC & PMLA 2002"
    target_vasp_name: str
    target_vasp_compliance: str
    suspect_wallet: str
    vasp_deposit_address: str
    transaction_hashes: List[str]
    amount_to_freeze_crypto: str
    amount_to_freeze_inr: float
    issuing_officer: str
    designation: str
    agency: str
    merkle_audit_proof: str
    timestamp: str
    notice_text: str
    status: str = "DISPATCHED_TO_SAHYOG_PORTAL"
