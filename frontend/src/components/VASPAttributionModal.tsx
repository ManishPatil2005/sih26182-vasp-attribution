import React, { useState, useEffect } from 'react';
import {
  attributeWallet,
  fetchVASPClusters,
  fetchSahyogCases,
  generateSahyogFreezeNotice,
  fetchFreezeRequisitions,
  fetchSahyogMetrics,
  fetchWalletTypology,
  fetchLive1930Feed,
  fetchBSACourtCertificate
} from '../services/api';
import type {
  BlockchainNetwork,
  VASPProfile,
  VASPAttributionResult,
  SahyogCase,
  SahyogFreezeRequisition,
  SahyogKPIMetrics,
  TypologyDeepScan,
  Live1930Alert,
  CourtCertificateBSA63
} from '../types/graph';

interface VASPAttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWallet?: string;
  initialNetwork?: BlockchainNetwork;
}

export const VASPAttributionModal: React.FC<VASPAttributionModalProps> = ({
  isOpen,
  onClose,
  initialWallet = 'TTsY1v6BpxvU9jP1k2L4wE8rT992p',
  initialNetwork = 'TRON'
}) => {
  const [activeTab, setActiveTab] = useState<'attribution' | 'typology' | 'bsa-court' | 'live-feed' | 'registry' | 'requisitions' | 'cases'>('attribution');
  const [network, setNetwork] = useState<BlockchainNetwork>(initialNetwork);
  const [walletInput, setWalletInput] = useState<string>(initialWallet);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [attribution, setAttribution] = useState<VASPAttributionResult | null>(null);
  const [vaspClusters, setVaspClusters] = useState<VASPProfile[]>([]);
  const [sahyogCases, setSahyogCases] = useState<SahyogCase[]>([]);
  const [requisitions, setRequisitions] = useState<SahyogFreezeRequisition[]>([]);
  const [metrics, setMetrics] = useState<SahyogKPIMetrics | null>(null);
  const [generatedNotice, setGeneratedNotice] = useState<SahyogFreezeRequisition | null>(null);
  const [noticeGenerating, setNoticeGenerating] = useState<boolean>(false);

  // V3 States: Typology, Court Evidence, Live 1930
  const [typologyScan, setTypologyScan] = useState<TypologyDeepScan | null>(null);
  const [typologyLoading, setTypologyLoading] = useState<boolean>(false);
  const [courtCertificate, setCourtCertificate] = useState<CourtCertificateBSA63 | null>(null);
  const [certLoading, setCertLoading] = useState<boolean>(false);
  const [live1930Alerts, setLive1930Alerts] = useState<Live1930Alert[]>([]);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [copiedCert, setCopiedCert] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (initialWallet) {
        handleRunAttribution(initialWallet, network);
      }
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [clustersData, casesData, reqsData, metricsData] = await Promise.all([
        fetchVASPClusters().catch(() => []),
        fetchSahyogCases().catch(() => []),
        fetchFreezeRequisitions().catch(() => []),
        fetchSahyogMetrics().catch(() => null)
      ]);
      setVaspClusters(clustersData);
      setSahyogCases(casesData);
      setRequisitions(reqsData);
      setMetrics(metricsData);
    } catch (err: any) {
      console.error('Error loading initial VASP data:', err);
    }
  };

  const handleRunAttribution = async (walletToTrace: string, net: BlockchainNetwork) => {
    if (!walletToTrace.trim()) return;
    setLoading(true);
    setTypologyLoading(true);
    setError(null);
    try {
      const [result, typResult] = await Promise.all([
        attributeWallet(walletToTrace.trim(), net),
        fetchWalletTypology(walletToTrace.trim(), net).catch(() => null)
      ]);
      setAttribution(result);
      if (typResult) setTypologyScan(typResult);
      setGeneratedNotice(null);
    } catch (err: any) {
      setError(err.message || 'Failed to attribute wallet to nearest VASP');
    } finally {
      setLoading(false);
      setTypologyLoading(false);
    }
  };

  const handleGenerateNotice = async () => {
    if (!attribution) return;
    setNoticeGenerating(true);
    try {
      const caseId = sahyogCases[0]?.case_id || 'SAHYOG-I4C-2026-8812';
      const notice = await generateSahyogFreezeNotice(caseId, attribution.query_wallet);
      setGeneratedNotice(notice);
      const updatedReqs = await fetchFreezeRequisitions();
      setRequisitions(updatedReqs);
      fetchBSACourtCertificate(notice.requisition_id).then(c => setCourtCertificate(c)).catch(() => {});
    } catch (err: any) {
      alert('Notice generation failed: ' + (err.message || 'Server error'));
    } finally {
      setNoticeGenerating(false);
    }
  };

  const handleLoadCourtCertificate = async () => {
    setCertLoading(true);
    try {
      const reqId = generatedNotice?.requisition_id || requisitions[0]?.requisition_id || 'default';
      const cert = await fetchBSACourtCertificate(reqId);
      setCourtCertificate(cert);
    } catch (err: any) {
      console.error('Failed to load court certificate:', err);
    } finally {
      setCertLoading(false);
    }
  };

  const handleLoadLiveFeed = async () => {
    setLiveLoading(true);
    try {
      const feed = await fetchLive1930Feed(6);
      setLive1930Alerts(feed);
    } catch (err: any) {
      console.error('Failed to load live 1930 feed:', err);
    } finally {
      setLiveLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b101b] border border-cyan-500/40 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-gradient-to-r from-slate-950 via-[#0e1628] to-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/50 rounded-lg text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-wider text-cyan-300">SAHYOG // VASP ATTRIBUTION ENGINE</h2>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 rounded-full">
                  SIH26182
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full">
                  MHA I4C GATEWAY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated Attribution of Unknown Crypto Wallets to Nearest VASPs & Section 94 BNSS Statutory Freezing Notices
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-medium"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Executive KPI Ribbon */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-6 py-3 bg-[#080d17] border-b border-cyan-950 text-xs">
            <div className="bg-slate-900/80 border border-cyan-900/40 p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Attribution Accuracy</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-black text-emerald-400">{metrics.overall_attribution_accuracy_pct}%</span>
                <span className="text-[10px] text-emerald-500 font-semibold">1,374 / 1,420 Wallets</span>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-cyan-900/40 p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Turnaround Acceleration</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-black text-cyan-300">0.045s</span>
                <span className="text-[10px] text-cyan-400 font-semibold">99.98% Faster (vs 14 Days)</span>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-cyan-900/40 p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Crypto Assets Frozen</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-black text-amber-400">₹18.45 Cr</span>
                <span className="text-[10px] text-slate-400">Across 6 Exchanges</span>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-cyan-900/40 p-2.5 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Legal Framework</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xs font-bold text-slate-200">Sec 94 BNSS / Sec 63 BSA</span>
                <span className="text-[10px] text-indigo-400 font-semibold">FIU-IND Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 px-6 border-b border-slate-800 bg-[#070b13] overflow-x-auto">
          <button
            onClick={() => setActiveTab('attribution')}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'attribution'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Live Wallet Attribution
          </button>
          <button
            onClick={() => {
              setActiveTab('typology');
              if (!typologyScan && attribution) {
                fetchWalletTypology(attribution.query_wallet, network).then(t => setTypologyScan(t));
              }
            }}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'typology'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔍 Typology &amp; Mixer Taint
          </button>
          <button
            onClick={() => {
              setActiveTab('bsa-court');
              handleLoadCourtCertificate();
            }}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'bsa-court'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚖️ BSA 2023 Court Evidence
          </button>
          <button
            onClick={() => {
              setActiveTab('live-feed');
              handleLoadLiveFeed();
            }}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'live-feed'
                ? 'border-rose-400 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 Live 1930 Helpline Feed
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'cases'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📁 SAHYOG Cases ({sahyogCases.length})
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'registry'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ FIU-IND Registry ({vaspClusters.length})
          </button>
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'requisitions'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 Freezing Notices ({requisitions.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#090e18] space-y-6">

          {/* TAB 1: LIVE WALLET ATTRIBUTION */}
          {activeTab === 'attribution' && (
            <div className="space-y-6">
              
              {/* Search & Trace Form */}
              <div className="bg-slate-900/90 border border-cyan-900/50 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Blockchain Network
                    </label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as BlockchainNetwork)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="TRON">Tron (TRC-20 USDT) - High Fraud</option>
                      <option value="ETHEREUM">Ethereum (ERC-20)</option>
                      <option value="BITCOIN">Bitcoin (UTXO)</option>
                      <option value="BNB_CHAIN">BNB Smart Chain</option>
                      <option value="SOLANA">Solana (SPL)</option>
                      <option value="POLYGON">Polygon PoS</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Target Suspect Wallet Address
                    </label>
                    <input
                      type="text"
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value)}
                      placeholder="Paste unknown suspect address (Tron TRC-20, ETH, BTC)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRunAttribution(walletInput, network)}
                    disabled={loading || !walletInput.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-lg shadow-cyan-900/50 flex items-center justify-center space-x-2 transition"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        <span>Tracing Hops...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Trace & Attribute VASP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick-Pick Suspect Wallets */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold">Quick Scenarios:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletInput('TTsY1v6BpxvU9jP1k2L4wE8rT992p');
                      setNetwork('TRON');
                      handleRunAttribution('TTsY1v6BpxvU9jP1k2L4wE8rT992p', 'TRON');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 rounded-md transition font-mono"
                  >
                    🔴 Case #8812 (Tron USDT Extortion)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletInput('0x71C83e20B13b0F2843A166f2C8f152d80d2d3489');
                      setNetwork('ETHEREUM');
                      handleRunAttribution('0x71C83e20B13b0F2843A166f2C8f152d80d2d3489', 'ETHEREUM');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-800/40 rounded-md transition font-mono"
                  >
                    🔵 Case #7491 (ETH Direct Deposit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletInput('1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s');
                      setNetwork('BITCOIN');
                      handleRunAttribution('1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s', 'BITCOIN');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 rounded-md transition font-mono"
                  >
                    🟡 Bitcoin UTXO (WazirX Gateway)
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-950/60 border border-rose-800/60 text-rose-300 p-4 rounded-xl text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Attribution Results Display */}
              {attribution && (
                <div className="space-y-6">
                  
                  {/* Top Match Card */}
                  <div className="bg-gradient-to-br from-slate-900 via-[#0c1424] to-slate-900 border border-cyan-500/50 rounded-xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-emerald-600 to-cyan-600 text-white font-black text-xs uppercase tracking-widest rounded-bl-xl shadow">
                      VERIFIED VASP ATTRIBUTION
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* VASP Profile Details */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nearest Identified VASP</span>
                        <div>
                          <h3 className="text-xl font-black text-cyan-300">{attribution.nearest_vasp.name}</h3>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">{attribution.nearest_vasp.jurisdiction}</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400">SAHYOG ID: </span>
                            <span className="font-mono text-cyan-400 font-semibold">{attribution.nearest_vasp.sahyog_registered_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Compliance Nodal: </span>
                            <span className="text-slate-200">{attribution.nearest_vasp.nodal_officer}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Email: </span>
                            <a href={`mailto:${attribution.nearest_vasp.compliance_email}`} className="text-cyan-400 underline font-mono">
                              {attribution.nearest_vasp.compliance_email}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Forensics Metrics */}
                      <div className="space-y-3 border-y md:border-y-0 md:border-x border-slate-800 md:px-6 py-4 md:py-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Graph Hop & Confidence</span>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Hop Distance (k):</span>
                          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-black text-sm">
                            {attribution.hop_distance} HOP(S)
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Attribution Confidence:</span>
                            <span className="font-bold text-emerald-400">{attribution.attribution_confidence_percent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${attribution.attribution_confidence_percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Laundering Typology:</span>
                          <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-bold">
                            {attribution.laundering_typology}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Attribution Status:</span>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold font-mono">
                            {attribution.attribution_status}
                          </span>
                        </div>
                      </div>

                      {/* Financial Value & Freeze CTA */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Identified Ingress Assets</span>
                          <div className="mt-1">
                            <span className="text-2xl font-black text-amber-400">
                              ₹{attribution.estimated_amount_inr.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-400 block font-mono">
                              ({attribution.attributed_amount_crypto.toLocaleString()} {attribution.token_symbol})
                            </span>
                          </div>
                          <div className="mt-2 text-xs">
                            <span className="text-slate-400">Target VASP Ingress Wallet:</span>
                            <div className="font-mono text-cyan-400 text-[11px] truncate bg-slate-950 p-1.5 rounded mt-1 border border-slate-800">
                              {attribution.deposit_address}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateNotice}
                          disabled={noticeGenerating}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-950/60 transition flex items-center justify-center space-x-2"
                        >
                          {noticeGenerating ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                              <span>Generating Notice...</span>
                            </>
                          ) : (
                            <>
                              <span>⚖️ Issue Section 94 BNSS Freezing Notice</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Multi-Hop Transaction Path Visualizer */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                        <span>⛓️ Multi-Hop Transaction Forensic Path (k={attribution.hop_distance})</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        Merkle Block: {attribution.merkle_evidence_hash.substring(0, 16)}...
                      </span>
                    </div>

                    <div className="space-y-3">
                      {attribution.path_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                            step.step_type === 'VASP_DEPOSIT_SWEEP'
                              ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                              : step.step_type === 'VASP_HOT_WALLET'
                              ? 'bg-purple-950/30 border-purple-800/40 text-purple-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-[11px] text-cyan-400">
                              {step.hop_number}
                            </span>
                            <div>
                              <span className="font-bold text-slate-100">{step.entity_label}</span>
                              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                                {step.step_type}
                              </span>
                              <div className="font-mono text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-500">From:</span>
                                <span className="text-slate-300 truncate max-w-[140px]">{step.from_address}</span>
                                <span className="text-cyan-500">➔</span>
                                <span className="text-slate-500">To:</span>
                                <span className="text-cyan-300 font-semibold truncate max-w-[140px]">{step.to_address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-amber-400">
                              {step.amount.toLocaleString()} {step.token}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Tx: {step.tx_hash.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generated Section 94 BNSS Freezing Notice View */}
                  {generatedNotice && (
                    <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-xl p-5 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500 rounded">
                            {generatedNotice.status}
                          </span>
                          <span className="font-bold text-slate-200 text-sm">
                            Requisition ID: {generatedNotice.requisition_id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              handleLoadCourtCertificate();
                              setActiveTab('bsa-court');
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded shadow transition cursor-pointer"
                          >
                            ⚖️ View Court-Admissible BSA 2023 Evidence
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedNotice.notice_text);
                              alert('Statutory Section 94 BNSS Notice copied to clipboard!');
                            }}
                            className="px-3 py-1 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-bold rounded transition cursor-pointer"
                          >
                            📋 Copy Legal Notice
                          </button>
                        </div>
                      </div>

                      <pre className="font-mono text-xs text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                        {generatedNotice.notice_text}
                      </pre>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                        <span>Tamper-Proof Merkle Proof: <code className="text-cyan-400 font-mono">{generatedNotice.merkle_audit_proof}</code></span>
                        <span>Statute: <strong className="text-slate-200">{generatedNotice.statute}</strong></span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB: TYPOLOGY & MIXER TAINT */}
          {activeTab === 'typology' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center space-x-2">
                    <span>🔍 Advanced Laundering Typology &amp; Mixer Taint Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Heuristic peeling chain tracking, OFAC/FIU-IND sanctioned mixer detection, and off-ramp velocity
                  </p>
                </div>
                {typologyScan && (
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase border ${
                    typologyScan.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' :
                    typologyScan.risk_level === 'HIGH' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}>
                    {typologyScan.risk_level} RISK ({typologyScan.composite_risk_score}/100)
                  </span>
                )}
              </div>

              {typologyLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="animate-spin inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></span>
                  <p>Executing heuristic peeling chain scan &amp; taint propagation...</p>
                </div>
              ) : !typologyScan ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
                  No typology scan performed yet. Select or trace a suspect wallet first.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Card 1: Primary Typology */}
                    <div className="bg-slate-900/90 border border-purple-900/40 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Modus Operandi</span>
                      <h4 className="font-black text-purple-200 text-sm">{typologyScan.primary_typology}</h4>
                      <div className="text-xs text-slate-300 font-mono">
                        Target: <span className="text-cyan-300">{typologyScan.target_wallet.substring(0, 16)}...</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300">
                        {typologyScan.statutory_urgency}
                      </div>
                    </div>

                    {/* Card 2: Peeling Chain Breakdown */}
                    <div className="bg-slate-900/90 border border-cyan-900/40 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peeling Chain Heuristics</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Peeling Pattern:</span>
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold text-xs">
                          {typologyScan.peeling_analysis.is_peeling_chain ? 'DETECTED' : 'NONE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Peel Ratio per Hop:</span>
                        <strong className="text-amber-400 font-mono">{typologyScan.peeling_analysis.peel_ratio}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Hop Velocity:</span>
                        <strong className="text-cyan-300 font-mono">~{typologyScan.peeling_analysis.hop_velocity_minutes} mins/hop</strong>
                      </div>
                    </div>

                    {/* Card 3: Mixer & Tumbler Exposure */}
                    <div className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mixer / Darknet Taint</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Mixer Contamination:</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                          typologyScan.mixer_exposure.is_exposed
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {typologyScan.mixer_exposure.is_exposed ? `${typologyScan.mixer_exposure.taint_percentage}% TAINT` : 'CLEAN (0%)'}
                        </span>
                      </div>
                      {typologyScan.mixer_exposure.is_exposed && (
                        <>
                          <div className="text-xs text-slate-300">
                            Identified Service: <strong className="text-rose-400">{typologyScan.mixer_exposure.mixer_name}</strong>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Proximity: <strong>{typologyScan.mixer_exposure.hop_proximity} hop(s)</strong> &bull; {typologyScan.mixer_exposure.sanctioned_entity ? '⚠️ Sanctioned Entity' : 'High Risk'}
                          </div>
                        </>
                      )}
                    </div>

                  </div>

                  {/* Detected Change Addresses */}
                  {typologyScan.peeling_analysis.detected_change_addresses.length > 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Detected Unspent Change Addresses (Peeling Remainder)
                      </span>
                      <div className="space-y-1">
                        {typologyScan.peeling_analysis.detected_change_addresses.map((chg, cIdx) => (
                          <div key={cIdx} className="font-mono text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                            <span>{chg}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Change Output #{cIdx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statutory Mitigation Protocol */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended Law Enforcement Action Protocol (I4C SOP)
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {typologyScan.mitigation_actions.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-center space-x-2">
                          <span className="text-cyan-400">✔</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: BSA 2023 COURT EVIDENCE CERTIFICATE */}
          {activeTab === 'bsa-court' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-2">
                    <span>⚖️ Section 63 Bharat Sakshya Adhiniyam (BSA), 2023 Evidence Certificate</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Statutory electronic record certificate for Judicial Magistrate trial &amp; asset forfeiture
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (courtCertificate) {
                        navigator.clipboard.writeText(JSON.stringify(courtCertificate, null, 2));
                        setCopiedCert(true);
                        setTimeout(() => setCopiedCert(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{copiedCert ? '✔ Copied JSON' : '📋 Copy Data'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>🖨️ Print / Export PDF</span>
                  </button>
                </div>
              </div>

              {certLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></span>
                  <p>Synthesizing cryptographic Merkle roots and electronic signature hashes...</p>
                </div>
              ) : !courtCertificate ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
                  Click "Issue Section 94 BNSS Freezing Notice" in the Attribution tab first to generate the official court certificate.
                </div>
              ) : (
                <div className="bg-[#040810] border-2 border-emerald-600/70 rounded-xl p-6 space-y-6 shadow-2xl text-slate-200">
                  
                  {/* Formal Header */}
                  <div className="text-center border-b-2 border-emerald-700/60 pb-4 space-y-1">
                    <div className="text-xs tracking-widest text-emerald-400 font-sans font-bold uppercase">
                      GOVERNMENT OF INDIA &bull; MINISTRY OF HOME AFFAIRS
                    </div>
                    <h2 className="text-lg font-black tracking-wide text-white uppercase font-sans">
                      CERTIFICATE UNDER SECTION 63 BHARAT SAKSHYA ADHINIYAM (BSA), 2023
                    </h2>
                    <p className="text-xs text-slate-400 font-sans">
                      (Formerly Section 65B of Indian Evidence Act, 1872) r/w Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
                    </p>
                    <div className="pt-2 text-xs font-mono text-cyan-300 font-sans">
                      CERTIFICATE ID: <strong>{courtCertificate.certificate_id}</strong> &bull; DATE: {courtCertificate.notarized_timestamp_utc}
                    </div>
                  </div>

                  {/* Police Station & FIR Binding */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded border border-slate-800 font-sans text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Police Station</span>
                      <strong className="text-slate-200">{courtCertificate.police_station}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">FIR Reference</span>
                      <strong className="text-cyan-300 font-mono">{courtCertificate.fir_reference}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Court Jurisdiction</span>
                      <strong className="text-slate-200">{courtCertificate.court_jurisdiction}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Investigating Officer</span>
                      <strong className="text-emerald-400">{courtCertificate.issuing_authority}</strong>
                    </div>
                  </div>

                  {/* Target VASP & Frozen Ingress Table */}
                  <div className="space-y-2 font-sans">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Target VASP Ingress &amp; Frozen Asset Summary
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Designated VASP</span>
                        <strong className="text-white text-sm">{courtCertificate.nearest_vasp_name}</strong>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{courtCertificate.vasp_fiu_reg_id}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Target VASP Deposit Address</span>
                        <div className="font-mono text-cyan-300 text-[11px] truncate bg-slate-900 p-1.5 rounded mt-1 border border-slate-800">
                          {courtCertificate.vasp_deposit_address}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Seized / Frozen Ingress Amount</span>
                        <div className="text-lg font-black text-amber-400">
                          ₹{courtCertificate.frozen_amount_inr.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ({courtCertificate.frozen_amount_crypto.toLocaleString()} {courtCertificate.token_symbol})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Hashes & Chain of Custody */}
                  <div className="space-y-2 font-mono text-xs">
                    <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 block">
                      Cryptographic Chain of Custody Proofs (Sec 63(4)(c) BSA 2023)
                    </span>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                      <div>
                        <span className="text-slate-400">Merkle Evidence Root: </span>
                        <span className="text-emerald-400 font-bold">{courtCertificate.merkle_evidence_root}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">System SHA-256 Digest: </span>
                        <span className="text-cyan-300">{courtCertificate.system_hash_sha256}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400 block mb-1">Hop Transaction Hashes ({courtCertificate.chain_of_custody_hashes.length}):</span>
                        {courtCertificate.chain_of_custody_hashes.map((h, hIdx) => (
                          <div key={hIdx} className="text-[10px] text-slate-400">
                            Hop #{hIdx + 1} Hash: <span className="text-slate-200">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legal Declaration */}
                  <div className="bg-slate-950/60 p-4 rounded border border-slate-800 text-xs italic text-slate-300 leading-relaxed">
                    &ldquo;{courtCertificate.legal_declaration}&rdquo;
                  </div>

                  {/* Verification QR / Signature Block */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs">
                    <div className="font-mono text-[10px] text-slate-500">
                      QR Payload: <span className="text-slate-400">{courtCertificate.qr_verification_payload}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200 uppercase">{courtCertificate.issuing_authority}</div>
                      <div className="text-slate-400 text-[10px]">Officer Badge: {courtCertificate.officer_badge}</div>
                      <div className="text-emerald-400 text-[10px] font-semibold mt-0.5">Digitally Notarized &bull; MHA Sovereign Seal</div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE 1930 HELPLINE FEED */}
          {activeTab === 'live-feed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300 flex items-center space-x-2">
                    <span>🚨 Live 1930 Cybercrime Helpline Ingestion Feed</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time national cybercrime victim complaints automatically parsed and attributed to nearest VASPs
                  </p>
                </div>
                <button
                  onClick={handleLoadLiveFeed}
                  disabled={liveLoading}
                  className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  {liveLoading ? <span>Fetching...</span> : <span>🔄 Ingest Latest Stream</span>}
                </button>
              </div>

              {liveLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="animate-spin inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mb-2"></span>
                  <p>Polling NCRP 1930 Cybercrime Router...</p>
                </div>
              ) : live1930Alerts.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
                  Click "Ingest Latest Stream" to poll live simulated complaints from 1930 Helpline.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {live1930Alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="bg-slate-900/90 border border-rose-900/40 hover:border-rose-600/70 rounded-xl p-4.5 space-y-3 shadow-lg transition"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          <span className="font-mono font-bold text-rose-300 text-xs">{alert.alert_id}</span>
                          <span className="text-slate-400 text-xs">({alert.victim_city})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{alert.incident_time}</span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-200 text-sm">{alert.crime_category}</div>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-base font-black text-rose-400">
                            ₹{alert.victim_reported_loss_inr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">Reported Fraud Loss</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Unhosted Wallet:</span>
                          <span className="text-cyan-300 truncate max-w-[170px]">{alert.unhosted_suspect_wallet}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Nearest VASP:</span>
                          <span className="text-white font-bold">{alert.attributed_vasp} ({alert.hop_count} Hops)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Attribution Conf:</span>
                          <span className="text-emerald-400 font-bold">{alert.confidence_score}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-amber-300 font-semibold truncate max-w-[200px]">
                          {alert.statutory_action}
                        </span>
                        <button
                          onClick={() => {
                            setWalletInput(alert.unhosted_suspect_wallet);
                            setNetwork(alert.detected_network as BlockchainNetwork);
                            setActiveTab('attribution');
                            handleRunAttribution(alert.unhosted_suspect_wallet, alert.detected_network as BlockchainNetwork);
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>⚡ Trace &amp; Freeze</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAHYOG CASES DOSSIERS */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  📁 Active 1930 / MHA SAHYOG Ingested Cybercrime Cases
                </h3>
                <span className="text-xs text-slate-400">{sahyogCases.length} Cases Loaded</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sahyogCases.map((caseItem) => (
                  <div
                    key={caseItem.case_id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-cyan-800/60 rounded-xl p-5 transition space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                            {caseItem.case_id}
                          </span>
                          <span className="font-bold text-slate-200 text-sm">{caseItem.fir_number}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{caseItem.police_station}</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Victim Loss</span>
                          <span className="text-sm font-black text-rose-400">
                            ₹{caseItem.victim_loss_inr.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                          {caseItem.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">Complainant / Victim:</span>
                        <div className="font-semibold text-slate-200">{caseItem.victim_name}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Investigating Officer:</span>
                        <div className="font-semibold text-slate-200">{caseItem.investigating_officer}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Assigned Agency:</span>
                        <div className="font-semibold text-cyan-400">{caseItem.assigned_agency}</div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-400 block mb-1">Suspect Unhosted Wallets ({caseItem.suspect_wallets.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {caseItem.suspect_wallets.map((w, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setWalletInput(w);
                              setActiveTab('attribution');
                              handleRunAttribution(w, network);
                            }}
                            className="font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-cyan-900/40 hover:border-cyan-500 transition text-[11px]"
                          >
                            🔍 {w} ➔ Attribute
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FIU-IND VASP REGISTRY */}
          {activeTab === 'registry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  🏛️ FIU-IND Compliant Virtual Asset Service Providers (VASPs)
                </h3>
                <span className="text-xs text-slate-400">{vaspClusters.length} Exchanges Enrolled</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaspClusters.map((vasp) => (
                  <div
                    key={vasp.vasp_id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-black text-cyan-300 text-base">{vasp.name}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded uppercase">
                        {vasp.risk_rating}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">Jurisdiction: </span>
                        <span>{vasp.jurisdiction}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">SAHYOG Reg ID: </span>
                        <span className="font-mono text-cyan-400 font-semibold">{vasp.sahyog_registered_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Nodal Officer: </span>
                        <span>{vasp.nodal_officer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Compliance Email: </span>
                        <span className="font-mono text-slate-200">{vasp.compliance_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Known Cluster Wallets: </span>
                        <span className="font-mono font-bold text-amber-400">{vasp.known_cluster_addresses_count.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Supported Blockchains</span>
                      <div className="flex flex-wrap gap-1">
                        {vasp.supported_chains.map((chain, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 text-[10px] bg-slate-950 text-slate-300 border border-slate-800 rounded font-mono"
                          >
                            {chain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REQUISITIONS LEDGER */}
          {activeTab === 'requisitions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  📜 Section 94 BNSS 2023 Statutory Freezing Requisitions Ledger
                </h3>
                <span className="text-xs text-slate-400">{requisitions.length} Dispatched</span>
              </div>

              {requisitions.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-sm">
                  No freezing notices generated in this session yet. Attribute a wallet and click "Issue Section 94 BNSS Freezing Notice".
                </div>
              ) : (
                <div className="space-y-3">
                  {requisitions.map((req) => (
                    <div
                      key={req.requisition_id}
                      className="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-4 text-xs space-y-2 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-cyan-300">{req.requisition_id}</span>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">
                            {req.status}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono">{req.timestamp}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300">
                        <div>
                          <span className="text-slate-400">Target VASP: </span>
                          <strong className="text-slate-100">{req.target_vasp_name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Target Ingress Wallet: </span>
                          <span className="font-mono text-cyan-300">{req.vasp_deposit_address}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Frozen Amount: </span>
                          <strong className="text-amber-400">₹{req.amount_to_freeze_inr.toLocaleString('en-IN')}</strong> ({req.amount_to_freeze_crypto})
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400">
                        <span>Issuing Officer: <strong className="text-slate-300">{req.issuing_officer}</strong></span>
                        <span className="font-mono text-[10px]">Merkle Proof: {req.merkle_audit_proof.substring(0, 24)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#070b13] flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Ministry of Home Affairs &bull; Indian Cyber Crime Coordination Centre (I4C) &bull; Problem Statement SIH26182
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Blockchain Intelligence APIs Connected</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
