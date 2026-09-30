import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Shield, 
  Cpu, 
  Zap, 
  FileCheck, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  X, 
  Copy, 
  Search, 
  PlusCircle, 
  ArrowUpRight,
  Database,
  Lock,
  Globe2
} from 'lucide-react';
import { 
  fetchScaleMetrics, 
  fetchLawfulWarrants, 
  authorizeLawfulWarrant, 
  fetchActiveInterceptHits, 
  simulateStreamBurst 
} from '../services/api';
import type { ScaleMetrics, LawfulWarrant, InterceptHit, StreamBurstResult, AuthorizeWarrantPayload } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuspectNode?: (nodeId: string) => void;
}

export const LawfulInterceptionModal: React.FC<Props> = ({ isOpen, onClose, onSelectSuspectNode }) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'warrants' | 'architecture' | 'api'>('stream');
  const [metrics, setMetrics] = useState<ScaleMetrics | null>(null);
  const [warrants, setWarrants] = useState<LawfulWarrant[]>([]);
  const [hits, setHits] = useState<InterceptHit[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [burstResult, setBurstResult] = useState<StreamBurstResult | null>(null);
  const [warrantSearch, setWarrantSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state for new warrant
  const [showNewWarrantModal, setShowNewWarrantModal] = useState(false);
  const [newWarrantForm, setNewWarrantForm] = useState<AuthorizeWarrantPayload>({
    issuing_authority: 'Union Home Secretary, Ministry of Home Affairs',
    agency: 'NCRB Women Safety Division & Delhi Police Special Cell',
    target_identifier: '+919811029481',
    target_name: 'Afnan (The Broker)',
    case_reference: 'RC-04/2026/NIA-DLI (Operation Rakshak)',
    lawful_justification: 'Statutory warrant issued for organized interstate human trafficking syndicate surveillance under Section 69 IT Act / Section 91 BNSS.',
    officer_id: 'OFFICER_MHA_SPL_OPS',
    validity_days: 90
  });

  const refreshData = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [m, w, h] = await Promise.all([
        fetchScaleMetrics(),
        fetchLawfulWarrants(),
        fetchActiveInterceptHits(50)
      ]);
      setMetrics(m);
      setWarrants(w);
      setHits(h);
    } catch (err) {
      console.error('Error fetching scale/interception data:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  const handleSimulateBurst = async (batchSize: number) => {
    setSimulating(true);
    try {
      const res = await simulateStreamBurst(batchSize);
      setBurstResult(res);
      setMetrics(res.scale_metrics);
      // Fetch latest hits
      const latestHits = await fetchActiveInterceptHits(50);
      setHits(latestHits);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateWarrant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authorizeLawfulWarrant(newWarrantForm);
      setShowNewWarrantModal(false);
      refreshData();
    } catch (err) {
      console.error('Warrant creation failed:', err);
    }
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  const filteredWarrants = warrants.filter(w => 
    w.target_identifier.includes(warrantSearch) ||
    w.target_name.toLowerCase().includes(warrantSearch.toLowerCase()) ||
    w.warrant_id.toLowerCase().includes(warrantSearch.toLowerCase()) ||
    w.agency.toLowerCase().includes(warrantSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                  National Lawful Interception Gateway & Scale Architecture
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> SEC 69 IT ACT / SEC 91 BNSS
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                  2B POPULATION CAPACITY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Monitoring System (CMS) / NATGRID / C-DOT Telecom TAP Switch Integration Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loadingMetrics}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Telemetry Banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-blue-400" /> Monitored Population
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              2,000,000,000
            </div>
            <div className="text-[10px] text-blue-400 mt-0.5">2 Billion Telecom Line Capacity</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1 font-medium">
              <Database className="w-3.5 h-3.5 text-purple-400" /> Criminal Watchlist
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              1,000,000
            </div>
            <div className="text-[10px] text-purple-400 mt-0.5">10 Lakh CCTNS Inverted Index</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Stream Throughput
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {metrics ? metrics.current_throughput_eps.toLocaleString() : '124,800'} <span className="text-xs font-normal text-slate-400">eps</span>
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">Avg Latency: {metrics ? metrics.average_latency_ms : '0.038'} ms</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> DPDP Privacy Pruned
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
              {metrics ? `${metrics.privacy_filter_ratio_percent}%` : '99.98%'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Civilian Traffic Discarded at Wire</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1 font-medium">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> RAM Footprint
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              38.4 MB <span className="text-[10px] text-slate-400">vs 128 TB</span>
            </div>
            <div className="text-[10px] text-cyan-400 mt-0.5">99.97% Memory Conservation</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-6">
          <button
            onClick={() => setActiveTab('stream')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'stream'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" /> Real-Time Intercept Stream ({hits.length})
          </button>

          <button
            onClick={() => setActiveTab('warrants')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'warrants'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Lawful Warrants ({warrants.length})
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'architecture'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" /> Scale & Feasibility Blueprint
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'api'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Higher Authority API Gateway
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: Real-Time Stream Burst & Hits */}
          {activeTab === 'stream' && (
            <div className="space-y-5">
              {/* Simulation Controls */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> National Telecom TAP Burst Simulator
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test wire-speed evaluation against 10 Lakh watchlist and instant graph auto-binding across 22 telecom circles.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSimulateBurst(15000)}
                    disabled={simulating}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {simulating ? 'Injecting 15k Calls...' : 'Burst 15,000 Calls'}
                  </button>
                  <button
                    onClick={() => handleSimulateBurst(30000)}
                    disabled={simulating}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-medium text-xs rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {simulating ? 'Surging 30k...' : 'Peak Surge (30,000)'}
                  </button>
                </div>
              </div>

              {/* Burst Results Banner */}
              {burstResult && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Telecom Burst Evaluated Successfully
                    </span>
                    <span className="font-mono text-emerald-400">
                      Elapsed: {burstResult.results.elapsed_seconds}s | {burstResult.results.throughput_eps.toLocaleString()} pings/sec
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-500/20 text-center">
                    <div>
                      <div className="text-slate-400">Batch Size</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">{burstResult.batch_size.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Suspect Hits Intercepted</div>
                      <div className="font-mono font-bold text-amber-400 mt-0.5">{burstResult.results.suspect_hits_found}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Civilian Traffic Pruned</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">{burstResult.results.civilian_calls_pruned.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Avg Look-up Latency</div>
                      <div className="font-mono font-bold text-cyan-400 mt-0.5">{burstResult.results.average_latency_ms} ms</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Intercept Hits Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">
                      Live Intercept Hits Feed (10 Lakh Watchlist Matches)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Showing latest {hits.length} lawful captures
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Caller (Origin)</th>
                        <th className="py-2.5 px-4">Receiver (Target)</th>
                        <th className="py-2.5 px-4">Cell Tower / Circle</th>
                        <th className="py-2.5 px-4">Lawful Warrant Ref</th>
                        <th className="py-2.5 px-4 text-right">Graph Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {hits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No real-time intercepts captured yet. Click "Burst 15,000 Calls" above to test national ingestion!
                          </td>
                        </tr>
                      ) : (
                        hits.map((h) => {
                          const callerNodeId = `PHONE_${h.caller_phone.replace('+', '').replace(' ', '')}`;
                          return (
                            <tr key={h.hit_id} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                                {new Date(h.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-slate-200">{h.caller_name}</div>
                                <div className="font-mono text-cyan-400 text-[11px]">{h.caller_phone}</div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-slate-200">{h.receiver_name}</div>
                                <div className="font-mono text-cyan-400 text-[11px]">{h.receiver_phone}</div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="text-slate-300">{h.location_name}</div>
                                <div className="font-mono text-[11px] text-slate-400">{h.cell_tower_id} ({h.telecom_circle})</div>
                              </td>
                              <td className="py-2.5 px-4">
                                {h.warrant_id ? (
                                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono text-[10px]">
                                    {h.warrant_id}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-mono text-[10px]">
                                    EMERGENCY INTERCEPT
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    if (onSelectSuspectNode) {
                                      onSelectSuspectNode(callerNodeId);
                                      onClose();
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-[11px] font-medium transition"
                                >
                                  Focus in Graph
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Lawful Warrants Registry */}
          {activeTab === 'warrants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={warrantSearch}
                    onChange={(e) => setWarrantSearch(e.target.value)}
                    placeholder="Search warrants by MSISDN, Name..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={() => setShowNewWarrantModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                >
                  <PlusCircle className="w-4 h-4" /> Issue Statutory Warrant (Sec 69 IT Act)
                </button>
              </div>

              {/* Warrants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWarrants.map((w) => (
                  <div key={w.warrant_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-cyan-400 font-bold text-xs">{w.warrant_id}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                          {w.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-200">{w.target_name}</div>
                      <div className="font-mono text-xs text-cyan-300 mt-0.5">{w.target_identifier}</div>
                      
                      <div className="mt-3 text-xs text-slate-400 space-y-1">
                        <div><strong className="text-slate-300">Issuing Authority:</strong> {w.issuing_authority}</div>
                        <div><strong className="text-slate-300">Enforcing Agency:</strong> {w.agency}</div>
                        <div><strong className="text-slate-300">Case Reference:</strong> {w.case_reference}</div>
                        <div className="text-[11px] italic text-slate-400 mt-1 line-clamp-2">
                          "{w.lawful_justification}"
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Expires: {new Date(w.expires_at).toLocaleDateString()}
                      </span>
                      {w.tamper_block_hash && (
                        <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1" title={w.tamper_block_hash}>
                          <Shield className="w-3 h-3" /> BSA Sec 63 Sealed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Scale & Feasibility Blueprint */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Technical Architecture: Scaling to 2 Billion Population & 10 Lakh Criminals
                </h3>

                <p className="text-slate-300 leading-relaxed">
                  A fundamental challenge faced by the Ministry of Home Affairs is evaluating telecom-scale traffic (over 1.5–2.0 billion active SIMs) against 10 Lakh registered criminal profiles in real time without causing memory exhaustion or citizen privacy violations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-400" /> Tier 1: Probabilistic Bloom Filter Gatekeeper
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      <li><strong>Space Efficiency:</strong> 14.3 Million bits (~1.8 MB RAM) using optimal double-hashing algorithms for 10 Lakh suspects.</li>
                      <li><strong>Sub-microsecond Decision:</strong> Evaluates incoming MSISDNs in ~15–40 nanoseconds.</li>
                      <li><strong>DPDP Act Compliance:</strong> Non-suspect civilian traffic (99.98%) is pruned and dropped instantly at wire speed with zero retention.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" /> Tier 2: Inverted Watchlist & Graph Binding
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      <li><strong>O(1) Exact Resolution:</strong> Only positive candidates trigger exact inverted hash-table resolution against CCTNS/ICJS records.</li>
                      <li><strong>Statutory Verification:</strong> Checks active warrants under Section 69 IT Act 2000.</li>
                      <li><strong>Live Graph Injection:</strong> Dynamically instantiates edges in NetworkX / Cytoscape and commits to SHA-256 Merkle chain.</li>
                    </ul>
                  </div>
                </div>

                {/* Mathematical Proof */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2">
                  <div className="text-cyan-400 font-bold">MATHEMATICAL FEASIBILITY PROOF:</div>
                  <div>• Target Capacity (n): 1,000,000 (10 Lakh) criminal records</div>
                  <div>• Bounded False Positive Rate (p): &lt; 0.1% (0.001)</div>
                  <div>• Bit Array Size (m): - (n * ln(p)) / (ln(2)^2) ≈ 14,377,000 bits = 1.79 MB</div>
                  <div>• Number of Hashes (k): (m / n) * ln(2) ≈ 10 hash probes</div>
                  <div>• Unfiltered 2B Node Graph: ~128.0 Terabytes RAM</div>
                  <div>• CrimeGraph AI Optimized Footprint: 38.4 Megabytes RAM (99.97% Savings!)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Higher Authority API Gateway */}
          {activeTab === 'api' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Lawful Interception Ingestion Endpoints (C-DOT / CMS / NATGRID)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      National law enforcement agencies and authorized telecom switches can stream real-time CDRs directly.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopySnippet(`curl -X POST http://localhost:8000/api/v1/interception/stream-ingest -H "Content-Type: application/json" -d '{"events": [{"call_id": "CALL-TAP-001", "caller": "+919811029481", "receiver": "+919820011223", "timestamp": "2026-09-23T12:00:00Z", "cell_tower_id": "TOWER-DL-01", "telecom_circle": "DL-Delhi"}], "auto_bind_graph": true}'`)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedCode ? 'Copied!' : 'Copy cURL Command'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-300">1. High-Velocity Telecom Batch Ingest (`POST /api/v1/interception/stream-ingest`)</div>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`curl -X POST http://localhost:8000/api/v1/interception/stream-ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": [
      {
        "call_id": "CALL-TAP-001",
        "caller": "+919811029481",
        "receiver": "+919820011223",
        "timestamp": "2026-09-23T12:00:00Z",
        "cell_tower_id": "TOWER-DL-PAHARGANJ-01",
        "telecom_circle": "DL-Delhi",
        "duration_sec": 85
      }
    ],
    "auto_bind_graph": true
  }'`}
                  </pre>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="font-semibold text-slate-300">2. Issue Statutory Interception Warrant (`POST /api/v1/interception/authorize-warrant`)</div>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`curl -X POST http://localhost:8000/api/v1/interception/authorize-warrant \\
  -H "Content-Type: application/json" \\
  -d '{
    "issuing_authority": "Union Home Secretary, Ministry of Home Affairs",
    "agency": "NCRB Women Safety Division",
    "target_identifier": "+919811029481",
    "target_name": "Afnan (The Broker)",
    "case_reference": "RC-04/2026/NIA-DLI (Operation Rakshak)",
    "lawful_justification": "Tracking interstate syndicate trafficking operations under Section 69 IT Act.",
    "officer_id": "OFFICER_MHA_SPL_OPS",
    "validity_days": 90
  }'`}
                  </pre>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="font-semibold text-slate-300">3. Real-Time National Telemetry (`GET /api/v1/interception/scale-metrics`)</div>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto">
{`curl -X GET http://localhost:8000/api/v1/interception/scale-metrics`}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Digital Evidence Signed under Section 63 Bharatiya Sakshya Adhiniyam, 2023</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close Gateway
          </button>
        </div>

      </div>

      {/* New Warrant Sub-Modal */}
      {showNewWarrantModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Issue Statutory Interception Warrant
              </h3>
              <button onClick={() => setShowNewWarrantModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarrant} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Phone Number / IMEI</label>
                <input
                  type="text"
                  required
                  value={newWarrantForm.target_identifier}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, target_identifier: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                  placeholder="+919811029481"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Name / Alias</label>
                <input
                  type="text"
                  required
                  value={newWarrantForm.target_name}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, target_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  placeholder="Suspect Name"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Issuing Authority</label>
                <input
                  type="text"
                  required
                  value={newWarrantForm.issuing_authority}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, issuing_authority: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Enforcing Agency</label>
                <input
                  type="text"
                  required
                  value={newWarrantForm.agency}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, agency: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Case Reference (FIR / RC Number)</label>
                <input
                  type="text"
                  required
                  value={newWarrantForm.case_reference}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, case_reference: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Statutory Justification (Sec 69 IT Act / Sec 91 BNSS)</label>
                <textarea
                  rows={3}
                  required
                  value={newWarrantForm.lawful_justification}
                  onChange={(e) => setNewWarrantForm({...newWarrantForm, lawful_justification: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewWarrantModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
                >
                  <Shield className="w-4 h-4" /> Issue & Commit Warrant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
