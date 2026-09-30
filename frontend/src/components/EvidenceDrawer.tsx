import React from 'react';
import type { GraphNode } from '../types/graph';
import { 
  X, 
  Building2, 
  Coins, 
  Scale, 
  Lock, 
  UserCheck, 
  Share2 
} from 'lucide-react';

interface EvidenceDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
  onGenerateNotice: (wallet: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ 
  node, 
  onClose,
  onGenerateNotice
}) => {
  if (!node) return null;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'CRYPTO_WALLET': return <Coins className="w-4 h-4 text-rose-400" />;
      case 'VASP_EXCHANGE': return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'MULE_WALLET': return <Share2 className="w-4 h-4 text-amber-400" />;
      case 'KYC_HOLDER': return <UserCheck className="w-4 h-4 text-emerald-400" />;
      default: return <Coins className="w-4 h-4 text-cyan-400" />;
    }
  };

  const isSuspectOrVasp = 
    node.type === 'CRYPTO_WALLET' || 
    node.type === 'VASP_EXCHANGE' || 
    node.type === 'MULE_WALLET';

  return (
    <div className="w-88 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 overflow-y-auto select-none shadow-2xl">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#080d17] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getEntityIcon(node.type)}
          <span className="text-xs font-mono text-cyan-400 uppercase font-black">
            {node.type.replace('_', ' ')} DOSSIER
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        
        {/* Node Title & Identifier */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Identifier
          </span>
          <h2 className="text-sm font-black text-white font-mono break-all">{node.id}</h2>
          <p className="text-[11px] text-cyan-300 font-semibold">{node.label}</p>
        </div>

        {/* Flagship Section 94 BNSS Freezing Action Button */}
        {isSuspectOrVasp && (
          <button
            onClick={() => onGenerateNotice(node.id)}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-950/60 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Issue Sec 94 BNSS Freezing Notice</span>
          </button>
        )}

        {/* Intelligence Properties */}
        {node.properties && Object.keys(node.properties).length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Blockchain Intelligence Details
            </span>

            <div className="space-y-1.5 text-xs text-slate-300">
              {node.properties.network && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Network:</span>
                  <span className="font-mono text-cyan-400 font-bold">{node.properties.network}</span>
                </div>
              )}
              {node.properties.token && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Token:</span>
                  <span className="font-mono text-amber-300">{node.properties.token}</span>
                </div>
              )}
              {node.properties.balance && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Balance:</span>
                  <span className="font-mono text-emerald-400 font-bold">{node.properties.balance}</span>
                </div>
              )}
              {node.properties.vasp_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Exchange:</span>
                  <span className="font-bold text-white">{node.properties.vasp_name}</span>
                </div>
              )}
              {node.properties.sahyog_reg_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400">SAHYOG Reg:</span>
                  <span className="font-mono text-cyan-300">{node.properties.sahyog_reg_id}</span>
                </div>
              )}
              {node.properties.nodal_officer && (
                <div>
                  <span className="text-slate-400 block">Nodal Contact:</span>
                  <span className="text-slate-200">{node.properties.nodal_officer}</span>
                </div>
              )}
              {node.properties.compliance_email && (
                <div>
                  <span className="text-slate-400 block">Compliance Email:</span>
                  <a href={`mailto:${node.properties.compliance_email}`} className="text-cyan-400 underline font-mono">
                    {node.properties.compliance_email}
                  </a>
                </div>
              )}
              {node.properties.case_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400">MHA Case Ref:</span>
                  <span className="font-mono text-purple-300">{node.properties.case_id}</span>
                </div>
              )}
              {node.properties.crime && (
                <div>
                  <span className="text-slate-400 block">Reported Offence:</span>
                  <span className="text-rose-300 font-semibold">{node.properties.crime}</span>
                </div>
              )}
              {node.properties.full_name && (
                <div>
                  <span className="text-slate-400">P2P Account Holder:</span>
                  <div className="text-slate-100 font-bold">{node.properties.full_name}</div>
                </div>
              )}
              {node.properties.kyc_pan && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified PAN:</span>
                  <span className="font-mono text-amber-300">{node.properties.kyc_pan}</span>
                </div>
              )}
              {node.properties.linked_bank && (
                <div>
                  <span className="text-slate-400">Linked Bank A/C:</span>
                  <div className="font-mono text-cyan-300">{node.properties.linked_bank}</div>
                </div>
              )}
              {node.properties.upi_handle && (
                <div>
                  <span className="text-slate-400">UPI ID:</span>
                  <div className="font-mono text-emerald-300">{node.properties.upi_handle}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Centrality & Flow Importance */}
        {node.centrality && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Forensic Flow Centrality
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block">PageRank</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {((node.centrality.pagerank || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Betweenness</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {((node.centrality.betweenness || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Degree</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {((node.centrality.degree || 0) * 10).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Legal Evidence Note */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-[11px] text-emerald-300 space-y-1">
          <div className="flex items-center space-x-1 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Court Admissibility</span>
          </div>
          <p className="text-[10px] text-emerald-400/90 leading-relaxed">
            Forensic transaction traces and deposit sweeps are cryptographically sealed under Section 63 BSA 2023 for PMLA &amp; BNS court proceedings.
          </p>
        </div>

      </div>
    </div>
  );
};
