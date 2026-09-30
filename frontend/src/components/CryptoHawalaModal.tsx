import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  ShieldCheck, 
  X, 
  Network, 
  Building, 
  Hash
} from 'lucide-react';
import { fetchCryptoFlows, fetchCryptoOffRamps, linkCryptoToGraph } from '../services/api';
import type { CryptoPeelingFlow, CryptoOffRamp } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
  onGraphUpdated?: () => void;
}

export const CryptoHawalaModal: React.FC<Props> = ({ isOpen, onClose, onSelectNode, onGraphUpdated }) => {
  const [flows, setFlows] = useState<CryptoPeelingFlow[]>([]);
  const [offRamps, setOffRamps] = useState<CryptoOffRamp[]>([]);
  const [activeTab, setActiveTab] = useState<'flows' | 'offramps' | 'fiu'>('flows');
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchCryptoFlows(), fetchCryptoOffRamps()])
        .then(([f, o]) => {
          setFlows(f);
          setOffRamps(o);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleLinkGraph = async () => {
    setLinking(true);
    try {
      await linkCryptoToGraph();
      setLinkSuccess(true);
      if (onGraphUpdated) onGraphUpdated();
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to link crypto to graph:', err);
    } finally {
      setLinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-950/60 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950">
              <Coins className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                  Web3 & Darknet Crypto-Hawala Forensics
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                  THEME: BLOCKCHAIN & CYBERSECURITY
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                  PMLA 2002 / BNS SEC 111
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                On-Chain Peeling Chains, Darknet Mixing Tumblers & P2P Fiat Cashout Bridges to Indian Bank Accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLinkGraph}
              disabled={linking}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Network className="w-3.5 h-3.5" />
              {linking ? 'Injecting Nodes...' : linkSuccess ? 'Injected!' : 'Project into Graph'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-6">
          <button
            onClick={() => setActiveTab('flows')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'flows'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" /> Peeling Chains & Mixers ({flows.length})
          </button>

          <button
            onClick={() => setActiveTab('offramps')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'offramps'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" /> P2P Fiat Off-Ramp Bridges ({offRamps.length})
          </button>

          <button
            onClick={() => setActiveTab('fiu')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'fiu'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> FIU-IND & Section 63 BSA Integrity
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: Flows & Peeling Chains */}
          {activeTab === 'flows' && (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div key={flow.flow_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold text-xs">{flow.flow_id}</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                          {flow.chain}
                        </span>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[10px] font-bold">
                          {Math.round(flow.tainted_score * 100)}% TAINTED
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{flow.syndicate_owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">Total Laundered</div>
                      <div className="text-base font-bold font-mono text-amber-300">${flow.total_laundered_usd.toLocaleString()} USD</div>
                    </div>
                  </div>

                  {/* Peeling Hops Breadcrumb Sequence */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2">
                    <div className="text-slate-400 font-semibold text-[11px] mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-400" />
                      On-Chain Hop Trajectory (Peeling Sequence)
                    </div>
                    <div className="space-y-2">
                      {flow.hops.map((hop) => (
                        <div key={hop.tx_hash} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold text-[10px]">
                              {hop.hop_index}
                            </span>
                            <div className="font-mono text-slate-300">
                              <span className="text-cyan-400">{hop.from_address.slice(0, 10)}...</span>
                              <span className="mx-1 text-slate-500">→</span>
                              <span className="text-emerald-400">{hop.to_address.slice(0, 10)}...</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="font-mono font-bold text-amber-300">
                              {hop.amount} {hop.token}
                            </div>
                            {hop.is_off_ramp ? (
                              <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold text-[10px]">
                                {hop.off_ramp_entity}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                                Transit Hop
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {flow.destination_mule_account && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 bg-amber-950/20 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                      <span>Destination Indian Bank Account: <strong className="text-slate-200">{flow.destination_mule_account}</strong></span>
                      <button
                        onClick={() => {
                          if (onSelectNode) {
                            onSelectNode(flow.destination_mule_account!);
                            onClose();
                          }
                        }}
                        className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Locate Mule Account in Graph
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: P2P Fiat Off-Ramps */}
          {activeTab === 'offramps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offRamps.map((off) => (
                <div key={off.off_ramp_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-amber-400 font-bold text-xs">{off.off_ramp_id}</span>
                      <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold text-[10px]">
                        {off.exchange_name}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-200">{off.account_holder}</div>
                    <div className="font-mono text-cyan-400 text-xs mt-0.5">{off.bank_account_number}</div>

                    <div className="mt-3 space-y-1 text-slate-400 text-[11px]">
                      <div><strong className="text-slate-300">KYC PAN:</strong> <span className="font-mono text-slate-200">{off.kyc_pan}</span></div>
                      <div><strong className="text-slate-300">Crypto Wallet:</strong> <span className="font-mono text-amber-300">{off.wallet_address}</span></div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-2">
                        ₹{off.total_fiat_inr.toLocaleString()} INR Cashed Out
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-slate-500">
                      Hash: {off.evidence_block_hash.slice(0, 16)}...
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectNode) {
                          onSelectNode(off.bank_account_number);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded transition"
                    >
                      Focus in Graph
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FIU-IND & Legal Proof */}
          {activeTab === 'fiu' && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 text-xs space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Financial Intelligence Unit (FIU-IND) & Section 63 BSA 2023 Admissibility
              </h3>

              <p className="text-slate-300 leading-relaxed">
                Cryptocurrency transfers in organized cyber-blackmail and human trafficking syndicates frequently pass through P2P exchange desks (Binance P2P, WazirX, CoinDCX) to conceal the nexus between foreign darknet buyers and Indian field handlers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200">Statutory Framework</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    <li><strong>Prevention of Money Laundering Act (PMLA), 2002:</strong> Section 3 (Offence of money-laundering) & Section 5 (Attachment of tainted crypto assets).</li>
                    <li><strong>Bharatiya Nyaya Sanhita (BNS), 2023:</strong> Section 111 (Organized Crime syndicate funding).</li>
                    <li><strong>Information Technology Act, 2000:</strong> Section 66D & 67A (Cheating by impersonation & digital extortion).</li>
                  </ul>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200">Tamper-Proof Audit Chain</h4>
                  <p className="text-slate-300 text-[11px]">
                    Every on-chain transaction hash and P2P off-ramp KYC record is cryptographically committed to the system's SHA-256 Merkle chain with HMAC-SHA256 digital seals, fulfilling all evidentiary requirements of Section 63 BSA 2023.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Web3 Forensics Active • Bitcoin / Tron TRC-20 / Ethereum ERC-20 Integrated</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
