export type EntityType = 
  | 'PERSON'
  | 'PHONE'
  | 'ACCOUNT'
  | 'VEHICLE'
  | 'LOCATION'
  | 'CRIME_INCIDENT'
  | 'ORGANIZATION'
  | 'CRYPTO_WALLET';

export type RelationType = 
  | 'CALLED'
  | 'TRANSFERRED_MONEY'
  | 'ASSOCIATED_WITH'
  | 'CO_LOCATED_AT'
  | 'OPERATES'
  | 'ACCUSED_IN'
  | 'OWNS_VEHICLE'
  | 'TRANSFERRED_CRYPTO';

export interface EvidenceReference {
  doc_id: string;
  doc_sha256: string;
  source_type: string;
  snippet?: string;
  char_span?: number[];
  confidence: number;
}

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  properties: Record<string, any>;
  risk_score: number;
  centrality?: {
    degree?: number;
    pagerank?: number;
    betweenness?: number;
  };
  community_id?: number;
  evidence_refs: EvidenceReference[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  properties: Record<string, any>;
  timestamp?: string;
  weight: number;
  evidence_refs: EvidenceReference[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: Record<string, any>;
}

export interface MastermindRank {
  node_id: string;
  label: string;
  type: string;
  pagerank_score: number;
  risk_score: number;
}

export interface BrokerRank {
  node_id: string;
  label: string;
  type: string;
  betweenness_score: number;
}

export interface SuspiciousMotif {
  motif_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nodes: string[];
  description: string;
}

export interface AnalyticsSummary {
  total_nodes: number;
  total_edges: number;
  masterminds: MastermindRank[];
  brokers: BrokerRank[];
  communities: Record<string, string[]>;
  suspicious_motifs: SuspiciousMotif[];
}

export interface SplinkCandidate {
  candidate_a: GraphNode;
  candidate_b: GraphNode;
  similarity_score: number;
  matching_attributes: string[];
  suggested_action: 'AUTO_MERGE' | 'HUMAN_REVIEW' | 'ISOLATE';
}

export interface BSACertificate {
  certificate_id: string;
  issue_date: string;
  governing_act: string;
  police_station_code: string;
  officer_in_charge: string;
  system_hash_chain_verified: boolean;
  total_evidence_blocks: number;
  latest_block_hash: string;
  ingested_artifacts: Array<{ doc_id: string; sha256: string; type: string }>;
  declaration: string;
}

export interface AuditBlock {
  index: number;
  timestamp: string;
  officer_id: string;
  action: string;
  target_id?: string;
  payload_hash: string;
  prev_hash: string;
  block_hash: string;
}

export interface AudioIntercept {
  audio_id: string;
  caller: string;
  receiver: string;
  timestamp: string;
  duration_sec: number;
  tower_id: string;
  dialogue: Array<{ speaker: string; time: string; text: string }>;
  flagged_keywords: string[];
  acoustic_risk_score: number;
  speech_urgency: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  waveform: number[];
  doc_sha256: string;
}

export interface LiveStreamEvent {
  type: string;
  event_id?: string;
  timestamp: string;
  caller?: string;
  receiver?: string;
  tower_id?: string;
  duration_sec?: number;
  risk_level?: string;
  notes?: string;
  edge_id?: string;
  channel?: string;
}

export interface IntelligenceDossier {
  metadata: {
    dossier_id: string;
    case_id: string;
    governing_law: string;
    classification: string;
    issuing_authority: string;
    station_code: string;
    investigating_officer: string;
    generation_timestamp: string;
    computation_time_ms: number;
  };
  executive_summary: {
    total_entities_analyzed: number;
    total_relationships_mapped: number;
    total_suspects_identified: number;
    total_calls_intercepted: number;
    total_financial_transactions: number;
    tamper_evident_integrity: string;
    primary_mastermind: string;
    primary_cross_gang_broker: string;
  };
  suspect_profiles: Array<{
    id: string;
    name: string;
    role: string;
    risk_score: number;
    aliases: string[];
    phones: string[];
    location: string;
  }>;
  intercepted_telecom_logs: Array<{
    edge_id: string;
    caller: string;
    receiver: string;
    duration_sec: number;
    tower_id: string;
    timestamp: string;
    notes: string;
  }>;
  financial_flows: Array<{
    from_account: string;
    to_account: string;
    amount_inr: number;
    channel: string;
    tx_id: string;
  }>;
  bsa_section_63_certificate: {
    chain_valid: boolean;
    audit_blocks_count: number;
    merkle_root_block_hash: string;
    cryptographic_hmac_seal: string;
    statutory_declaration: string;
  };
}

export interface LinkPrediction {
  source_id: string;
  source_label: string;
  target_id: string;
  target_label: string;
  hidden_link_probability: number;
  confidence_level: 'VERY HIGH' | 'HIGH' | 'MEDIUM';
  common_intermediates: string[];
  common_neighbors_count: number;
  jaccard_score: number;
  adamic_adar_score: number;
  reasoning: string;
}

export interface ColocationEvent {
  event_id: string;
  tower_id: string;
  tower_name: string;
  latitude: number;
  longitude: number;
  first_ping: string;
  last_ping: string;
  temporal_window_minutes: number;
  duration_observed_minutes: number;
  suspect_count: number;
  suspects_present: string[];
  phones_involved: string[];
  suspicion_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  evidence_summary: string;
}

export interface GisTower {
  tower_id: string;
  tower_name: string;
  lat: number;
  lon: number;
  total_pings: number;
  suspects_observed: string[];
  is_rendezvous_hotspot: boolean;
}

export interface GisTrajectory {
  suspect_name: string;
  pings_count: number;
  path: Array<{
    tower_id: string;
    tower_name: string;
    lat: number;
    lon: number;
    timestamp: string;
    phone: string;
  }>;
}

export interface GisMapData {
  status: string;
  towers: GisTower[];
  trajectories: GisTrajectory[];
  colocations: ColocationEvent[];
}

export interface CopilotResponse {
  status: string;
  query: string;
  answer: string;
  actionable_recommendation: string;
  highlighted_node_ids: string[];
  highlighted_edge_ids: string[];
}

export interface PathwayStep {
  step_number: number;
  from_node: string;
  from_label: string;
  relation: string;
  to_node: string;
  to_label: string;
  evidence_type: string;
  weight: number;
}

export interface PathfinderResponse {
  source_id: string;
  target_id: string;
  connected: boolean;
  path_length: number;
  node_sequence: string[];
  steps: PathwayStep[];
  tactical_summary: string;
}

export interface SyndicateRoleItem {
  node_id: string;
  label: string;
  role_category: string;
  threat_level: string;
  risk_score: number;
  influence_summary: string;
}

export interface SyndicateHierarchy {
  status: string;
  total_entities_classified: number;
  hierarchy: {
    tier_1_masterminds: SyndicateRoleItem[];
    tier_2_brokers: SyndicateRoleItem[];
    tier_3_specialists: SyndicateRoleItem[];
    tier_4_fronts_and_mules: SyndicateRoleItem[];
  };
}

export interface ComplianceMatrixCriterion {
  criterion_id: string;
  title: string;
  mandate: string;
  status: string;
  features_implemented: string[];
}

export interface ComplianceMatrix {
  problem_statement_id: string;
  title: string;
  ministry: string;
  department: string;
  theme: string;
  overall_compliance_score: string;
  criteria_evaluations: ComplianceMatrixCriterion[];
}

export interface LawfulWarrant {
  warrant_id: string;
  governing_act: string;
  issuing_authority: string;
  agency: string;
  target_identifier: string;
  target_name: string;
  case_reference: string;
  status: string;
  authorized_at: string;
  expires_at: string;
  lawful_justification: string;
  tamper_block_hash?: string;
}

export interface InterceptHit {
  hit_id: string;
  timestamp: string;
  caller_phone: string;
  caller_name: string;
  receiver_phone: string;
  receiver_name: string;
  matched_target: string;
  target_role: string;
  cell_tower_id: string;
  location_name: string;
  duration_sec: number;
  warrant_id?: string;
  intercept_agency: string;
  telecom_circle: string;
  audit_hash: string;
}

export interface ScaleMetrics {
  total_population_monitored: number;
  criminal_watchlist_size: number;
  active_warrants_count: number;
  stream_pings_processed: number;
  civilian_pings_pruned: number;
  suspect_hits_detected: number;
  current_throughput_eps: number;
  average_latency_ms: number;
  ram_footprint_mb: number;
  unfiltered_ram_estimate_tb: number;
  memory_savings_percent: number;
  privacy_filter_ratio_percent: number;
  statutory_compliance: string;
  engine_status: string;
}

export interface StreamBurstResult {
  success: boolean;
  batch_size: number;
  results: {
    batch_size: number;
    elapsed_seconds: number;
    throughput_eps: number;
    average_latency_ms: number;
    suspect_hits_found: number;
    civilian_calls_pruned: number;
  };
  recent_hits_sample: InterceptHit[];
  scale_metrics: ScaleMetrics;
}

export interface AuthorizeWarrantPayload {
  issuing_authority: string;
  agency: string;
  target_identifier: string;
  target_name: string;
  case_reference: string;
  lawful_justification: string;
  officer_id?: string;
  validity_days?: number;
}

export interface CryptoHop {
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  timestamp: string;
  hop_index: number;
  is_off_ramp: boolean;
  off_ramp_entity?: string;
}

export interface CryptoPeelingFlow {
  flow_id: string;
  origin_wallet: string;
  syndicate_owner: string;
  total_laundered_usd: number;
  chain: string;
  hops: CryptoHop[];
  tainted_score: number;
  destination_mule_account?: string;
}

export interface CryptoOffRamp {
  off_ramp_id: string;
  exchange_name: string;
  wallet_address: string;
  bank_account_number: string;
  account_holder: string;
  total_fiat_inr: number;
  kyc_pan: string;
  evidence_block_hash: string;
}

export interface DisruptionImpact {
  targeted_nodes: string[];
  targeted_labels: string[];
  initial_components: number;
  remaining_components: number;
  initial_giant_component_size: number;
  remaining_giant_component_size: number;
  syndicate_disruption_index: number;
  communication_edges_severed: number;
  hawala_capacity_paralyzed_pct: number;
  tactical_verdict: string;
}

export interface DisruptionRecommendation {
  rank: number;
  target_nodes: string[];
  target_names: string[];
  predicted_disruption_index: number;
  justification: string;
  cut_vertex: boolean;
}

export interface AgencyProfile {
  agency_code: string;
  agency_name: string;
  clearance_level: string;
  description: string;
  can_issue_warrants: boolean;
  can_view_undercover_assets: boolean;
  can_export_court_evidence: boolean;
}

// SIH26182 VASP Attribution & MHA Sahyog Portal Types
export type BlockchainNetwork = 'TRON' | 'ETHEREUM' | 'BITCOIN' | 'BNB_CHAIN' | 'SOLANA' | 'POLYGON';

export interface VASPProfile {
  vasp_id: string;
  name: string;
  category: string;
  jurisdiction: string;
  compliance_email: string;
  sahyog_registered_id: string;
  nodal_officer: string;
  known_cluster_addresses_count: number;
  supported_chains: string[];
  risk_rating: string;
}

export interface TransactionPathStep {
  hop_number: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  timestamp: string;
  step_type: string;
  entity_label: string;
}

export interface VASPAttributionResult {
  attribution_id: string;
  query_wallet: string;
  blockchain: string;
  attribution_status: string;
  nearest_vasp: VASPProfile;
  hop_distance: number;
  attribution_confidence_percent: number;
  deposit_address: string;
  deposit_tx_hash: string;
  attributed_amount_crypto: number;
  token_symbol: string;
  attributed_amount_usd: number;
  estimated_amount_inr: number;
  laundering_typology: string;
  path_steps: TransactionPathStep[];
  freeze_action_recommended: boolean;
  sahyog_notice_draft: {
    notice_statute?: string;
    target_vasp?: string;
    target_nodal_officer?: string;
    compliance_email?: string;
    sahyog_portal_reg_id?: string;
    demanded_actions?: string[];
  };
  merkle_evidence_hash: string;
}

export interface SahyogCase {
  case_id: string;
  fir_number: string;
  police_station: string;
  investigating_officer: string;
  victim_name: string;
  crime_category: string;
  victim_loss_inr: number;
  suspect_wallets: string[];
  assigned_agency: string;
  status: string;
  created_at: string;
  attributions: VASPAttributionResult[];
}

export interface SahyogFreezeRequisition {
  requisition_id: string;
  case_id: string;
  statute: string;
  target_vasp_name: string;
  target_vasp_compliance: string;
  suspect_wallet: string;
  vasp_deposit_address: string;
  transaction_hashes: string[];
  amount_to_freeze_crypto: string;
  amount_to_freeze_inr: number;
  issuing_officer: string;
  designation: string;
  agency: string;
  merkle_audit_proof: string;
  timestamp: string;
  notice_text: string;
  status: string;
}

export interface SahyogKPIMetrics {
  total_cases_analyzed: number;
  wallets_attributed_to_vasp: number;
  overall_attribution_accuracy_pct: number;
  average_attribution_speed_sec: number;
  traditional_manual_turnaround_days: number;
  turnaround_reduction_pct: number;
  total_crypto_assets_frozen_inr: number;
  top_attributed_vasps: Array<{ name: string; share_pct: number }>;
  statutory_compliance: string;
}
