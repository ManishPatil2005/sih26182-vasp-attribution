import type { 
  GraphData, 
  AnalyticsSummary, 
  SplinkCandidate, 
  BSACertificate, 
  AuditBlock,
  AudioIntercept,
  IntelligenceDossier,
  LiveStreamEvent,
  BlockchainNetwork
} from '../types/graph';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export function getActiveSession(): any {
  try {
    const raw = localStorage.getItem('sahyog_vasp_session') || localStorage.getItem('crimegraph_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const session = getActiveSession();
  const headers: Record<string, string> = { ...extraHeaders };
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
    headers['X-Officer-Badge'] = session.badge_number;
    headers['X-Agency-Clearance'] = session.agency_code;
  }
  return headers;
}

export function getActiveOfficerId(): string {
  const session = getActiveSession();
  return session ? `${session.full_name} (${session.badge_number})` : 'Insp. V. S. Chauhan (I4C-CRYPTO-782)';
}

export async function fetchGraphData(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/vasp/graph`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    // fallback if server still routing
    const fallback = await fetch(`${API_BASE}/graph/data`, { headers: getAuthHeaders() });
    if (!fallback.ok) throw new Error('Failed to fetch graph data');
    return fallback.json();
  }
  return res.json();
}

export async function fetchCryptoGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/vasp/graph`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch VASP crypto graph');
  return res.json();
}

export async function fetchWalletSubgraph(wallet: string, network?: BlockchainNetwork): Promise<GraphData> {
  const params = network ? `?network=${network}` : '';
  const res = await fetch(`${API_BASE}/vasp/graph/wallet/${encodeURIComponent(wallet)}${params}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch subgraph for wallet ${wallet}`);
  return res.json();
}

export async function fetchTemporalGraph(start?: string, end?: string, agencyCode?: string): Promise<GraphData> {
  const session = getActiveSession();
  const agency = agencyCode || session?.agency_code;
  const params = new URLSearchParams();
  if (start) params.append('start_date', start);
  if (end) params.append('end_date', end);
  if (agency) params.append('agency_code', agency);
  const res = await fetch(`${API_BASE}/graph/temporal?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch temporal slice');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to compute analytics');
  return res.json();
}

export async function loadDemoScenario(): Promise<{ success: boolean; nodes_loaded: number; message: string }> {
  const res = await fetch(`${API_BASE}/graph/load-demo`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ officer_id: getActiveOfficerId() })
  });
  if (!res.ok) throw new Error('Failed to load demo scenario');
  return res.json();
}

export async function loadFunScenario(): Promise<{ success: boolean; nodes_loaded: number; edges_loaded: number; message: string }> {
  const res = await fetch(`${API_BASE}/graph/load-fun`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ officer_id: getActiveOfficerId() })
  });
  if (!res.ok) throw new Error('Failed to load fun.csv dataset');
  return res.json();
}

export async function clearGraph(): Promise<void> {
  const res = await fetch(`${API_BASE}/graph/clear`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ officer_id: getActiveOfficerId() })
  });
  if (!res.ok) throw new Error('Failed to clear graph');
}

export async function fetchFusionCandidates(): Promise<SplinkCandidate[]> {
  const res = await fetch(`${API_BASE}/ingest/fusion/candidates`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch fusion candidates');
  return res.json();
}

export async function executeMerge(canonicalId: string, duplicateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/ingest/fusion/merge`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({
      canonical_id: canonicalId,
      duplicate_id: duplicateId,
      officer_id: getActiveOfficerId()
    })
  });
  if (!res.ok) throw new Error('Failed to merge entities');
}

export async function fetchAuditLedger(): Promise<AuditBlock[]> {
  const res = await fetch(`${API_BASE}/audit/ledger`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch audit ledger');
  return res.json();
}

export async function verifyAuditLedger(): Promise<{ verified: boolean; message: string; total_blocks: number }> {
  const res = await fetch(`${API_BASE}/audit/verify`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to verify audit ledger');
  return res.json();
}

export async function fetchBSACertificate(): Promise<BSACertificate> {
  const res = await fetch(`${API_BASE}/audit/bsa-certificate`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to generate BSA certificate');
  return res.json();
}

export async function uploadEvidenceFile(
  type: 'cdr' | 'bank' | 'fir',
  file: File
): Promise<{ success: boolean; records_processed: number; entities_extracted: number; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('officer_id', getActiveOfficerId());

  const res = await fetch(`${API_BASE}/ingest/${type}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload error' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchAudioSamples(): Promise<AudioIntercept[]> {
  const res = await fetch(`${API_BASE}/audio/samples`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch audio samples');
  return res.json();
}

export async function fetchDossierReport(caseId: string = 'CR-2024-AUR-SPECIAL-01'): Promise<IntelligenceDossier> {
  const res = await fetch(`${API_BASE}/report/dossier?case_id=${encodeURIComponent(caseId)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to generate intelligence dossier');
  return res.json();
}

export async function triggerSimulatedIntercept(): Promise<{ success: boolean; event: LiveStreamEvent; message: string }> {
  const res = await fetch(`${API_BASE}/stream/simulate-event`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ officer_id: getActiveOfficerId() })
  });
  if (!res.ok) throw new Error('Failed to trigger simulated intercept');
  return res.json();
}

export async function loadOperationRakshak(): Promise<{ success: boolean; scenario: string; nodes_loaded: number; edges_loaded: number; message?: string }> {
  const res = await fetch(`${API_BASE}/graph/load-rakshak`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ officer_id: getActiveOfficerId() })
  });
  if (!res.ok) throw new Error('Failed to load Operation Rakshak scenario');
  return res.json();
}

export async function fetchLinkPredictions(topK: number = 10): Promise<import('../types/graph').LinkPrediction[]> {
  const res = await fetch(`${API_BASE}/prediction/predict-links?top_k=${topK}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to compute link predictions');
  const data = await res.json();
  return data.predictions || [];
}

export async function fetchColocations(timeWindowMinutes: number = 15, maxDistanceMeters: number = 300): Promise<import('../types/graph').ColocationEvent[]> {
  const res = await fetch(`${API_BASE}/spatial/colocation?time_window_minutes=${timeWindowMinutes}&max_distance_meters=${maxDistanceMeters}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to analyze spatial colocations');
  const data = await res.json();
  return data.rendezvous_events || [];
}

export async function fetchGisMapData(): Promise<import('../types/graph').GisMapData> {
  const res = await fetch(`${API_BASE}/spatial/gis-map`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch GIS map data');
  return res.json();
}

export async function queryInvestigatorCopilot(query: string): Promise<import('../types/graph').CopilotResponse> {
  const res = await fetch(`${API_BASE}/copilot/query`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to query investigator copilot');
  return res.json();
}

export async function fetchPathway(sourceId: string, targetId: string): Promise<import('../types/graph').PathfinderResponse> {
  const res = await fetch(`${API_BASE}/analytics/pathway?source_id=${encodeURIComponent(sourceId)}&target_id=${encodeURIComponent(targetId)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to find connection pathway');
  return res.json();
}

export async function fetchSyndicateHierarchy(): Promise<import('../types/graph').SyndicateHierarchy> {
  const res = await fetch(`${API_BASE}/analytics/hierarchy`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch syndicate hierarchy');
  return res.json();
}

export async function fetchComplianceMatrix(): Promise<import('../types/graph').ComplianceMatrix> {
  const res = await fetch(`${API_BASE}/analytics/compliance-matrix`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch compliance matrix');
  return res.json();
}

export async function uploadMultiSourceFile(
  sourceType: 'cdr' | 'bank' | 'fir' | 'surveillance' | 'criminal-history' | 'intelligence',
  file: File
): Promise<{ success: boolean; records_processed: number; entities_extracted: number; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('officer_id', getActiveOfficerId());

  const res = await fetch(`${API_BASE}/ingest/${sourceType}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload error' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchScaleMetrics(): Promise<import('../types/graph').ScaleMetrics> {
  const res = await fetch(`${API_BASE}/interception/scale-metrics`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch national scale metrics');
  return res.json();
}

export async function fetchLawfulWarrants(status?: string): Promise<import('../types/graph').LawfulWarrant[]> {
  const url = status 
    ? `${API_BASE}/interception/warrants?status=${encodeURIComponent(status)}`
    : `${API_BASE}/interception/warrants`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch lawful warrants');
  return res.json();
}

export async function authorizeLawfulWarrant(
  payload: import('../types/graph').AuthorizeWarrantPayload
): Promise<import('../types/graph').LawfulWarrant> {
  const res = await fetch(`${API_BASE}/interception/authorize-warrant`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to authorize lawful warrant');
  return res.json();
}

export async function fetchActiveInterceptHits(limit: number = 50): Promise<import('../types/graph').InterceptHit[]> {
  const res = await fetch(`${API_BASE}/interception/active-hits?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch active intercept hits');
  return res.json();
}

export async function simulateStreamBurst(batchSize: number = 15000): Promise<import('../types/graph').StreamBurstResult> {
  const res = await fetch(`${API_BASE}/interception/simulate-burst`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ batch_size: batchSize, auto_bind_graph: true })
  });
  if (!res.ok) throw new Error('Failed to simulate stream burst');
  return res.json();
}

export async function fetchCryptoFlows(): Promise<import('../types/graph').CryptoPeelingFlow[]> {
  const res = await fetch(`${API_BASE}/crypto/flows`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch crypto flows');
  return res.json();
}

export async function fetchCryptoOffRamps(): Promise<import('../types/graph').CryptoOffRamp[]> {
  const res = await fetch(`${API_BASE}/crypto/off-ramps`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch crypto off-ramps');
  return res.json();
}

export async function linkCryptoToGraph(): Promise<{ success: boolean; nodes_added: number; edges_added: number }> {
  const res = await fetch(`${API_BASE}/crypto/link-graph`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to link crypto to graph');
  return res.json();
}

export async function simulateDisruption(targetNodeIds: string[]): Promise<import('../types/graph').DisruptionImpact> {
  const res = await fetch(`${API_BASE}/disruption/simulate`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ target_node_ids: targetNodeIds })
  });
  if (!res.ok) throw new Error('Failed to simulate syndicate disruption');
  return res.json();
}

export async function fetchOptimalDisruptionRecommendations(topK: number = 3): Promise<import('../types/graph').DisruptionRecommendation[]> {
  const res = await fetch(`${API_BASE}/disruption/optimal-targets?top_k=${topK}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch disruption recommendations');
  return res.json();
}

export async function fetchAgencyProfiles(): Promise<import('../types/graph').AgencyProfile[]> {
  const res = await fetch(`${API_BASE}/disruption/agencies`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch agency profiles');
  return res.json();
}

// ==========================================
// SIH26182 VASP Attribution & MHA SAHYOG APIs
// ==========================================

export async function attributeWallet(
  walletAddress: string,
  network: import('../types/graph').BlockchainNetwork = 'TRON',
  officerId?: string
): Promise<import('../types/graph').VASPAttributionResult> {
  const res = await fetch(`${API_BASE}/vasp/attribute`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      wallet_address: walletAddress,
      network: network,
      officer_id: officerId || getActiveOfficerId()
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Attribution failed' }));
    throw new Error(err.detail || 'Failed to attribute wallet');
  }
  return res.json();
}

export async function fetchVASPClusters(): Promise<import('../types/graph').VASPProfile[]> {
  const res = await fetch(`${API_BASE}/vasp/clusters`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch VASP clusters');
  return res.json();
}

export async function fetchSupportedChains(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/vasp/supported-chains`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch supported chains');
  return res.json();
}

export async function fetchSahyogCases(): Promise<import('../types/graph').SahyogCase[]> {
  const res = await fetch(`${API_BASE}/sahyog/cases`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch Sahyog cases');
  return res.json();
}

export async function createSahyogCase(payload: {
  fir_number: string;
  police_station: string;
  investigating_officer: string;
  victim_name: string;
  crime_category: string;
  victim_loss_inr: number;
  suspect_wallets: string[];
  assigned_agency?: string;
  network?: import('../types/graph').BlockchainNetwork;
}): Promise<import('../types/graph').SahyogCase> {
  const res = await fetch(`${API_BASE}/sahyog/cases`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create Sahyog case');
  return res.json();
}

export async function generateSahyogFreezeNotice(
  caseId: string,
  walletAddress: string,
  officerId?: string
): Promise<import('../types/graph').SahyogFreezeRequisition> {
  const res = await fetch(`${API_BASE}/sahyog/generate-freeze-notice`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      case_id: caseId,
      wallet_address: walletAddress,
      officer_id: officerId || getActiveOfficerId()
    })
  });
  if (!res.ok) throw new Error('Failed to generate Section 94 BNSS freeze notice');
  return res.json();
}

export async function fetchFreezeRequisitions(): Promise<import('../types/graph').SahyogFreezeRequisition[]> {
  const res = await fetch(`${API_BASE}/sahyog/requisitions`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch freeze requisitions');
  return res.json();
}

export async function fetchSahyogMetrics(): Promise<import('../types/graph').SahyogKPIMetrics> {
  const res = await fetch(`${API_BASE}/sahyog/metrics`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch Sahyog metrics');
  return res.json();
}
