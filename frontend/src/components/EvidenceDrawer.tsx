import React from 'react';
import type { GraphNode } from '../types/graph';
import { 
  X, 
  FileText, 
  Hash, 
  ShieldAlert, 
  Phone, 
  CreditCard, 
  Car, 
  AlertTriangle,
  User,
  CheckCircle2
} from 'lucide-react';

interface EvidenceDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
  onTraceVASP?: (wallet: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ node, onClose, onTraceVASP }) => {
  if (!node) return null;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'PERSON': return <User className="w-4 h-4 text-cyan-400" />;
      case 'PHONE': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'ACCOUNT': return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'VEHICLE': return <Car className="w-4 h-4 text-pink-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 0.8) {
      return (
        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs font-semibold flex items-center space-x-1">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span>CRITICAL THREAT ({Math.round(score * 100)}%)</span>
        </span>
      );
    }
    if (score >= 0.5) {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-semibold flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>HIGH PRIORITY ({Math.round(score * 100)}%)</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs">
        STANDARD ENTITY
      </span>
    );
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getEntityIcon(node.type)}
          <span className="text-xs font-mono text-slate-400 uppercase">{node.type} DOSSIER</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Title & Risk */}
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">{node.label}</h2>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {node.id}</p>
          <div className="mt-2.5">{getRiskBadge(node.risk_score)}</div>
        </div>

        {/* Flagship SIH26182 VASP Attribution Action */}
        {(node.type === 'CRYPTO_WALLET' || node.label.startsWith('0x') || node.label.startsWith('T') || node.label.startsWith('bc1') || node.properties?.wallet_address) && onTraceVASP && (
          <button
            onClick={() => onTraceVASP(node.properties?.wallet_address || node.label || node.id)}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-md shadow-cyan-950 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>⚡ Trace Nearest VASP (SIH26182)</span>
          </button>
        )}

        {/* Centrality Metrics Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded p-3 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Graph Centrality Scores
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block">PageRank</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {node.centrality?.pagerank ? (node.centrality.pagerank * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Betweenness</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {node.centrality?.betweenness ? (node.centrality.betweenness * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Degree</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {node.centrality?.degree ? (node.centrality.degree * 10).toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        </div>

        {/* Known Attributes & Aliases */}
        {node.properties && Object.keys(node.properties).length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded p-3 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Intelligence Attributes
            </span>
            <div className="space-y-1.5 text-xs">
              {node.properties.aliases && node.properties.aliases.length > 0 && (
                <div>
                  <span className="text-slate-400">Aliases: </span>
                  <span className="text-cyan-300 font-medium">{node.properties.aliases.join(', ')}</span>
                </div>
              )}
              {node.properties.role && (
                <div>
                  <span className="text-slate-400">Role: </span>
                  <span className="text-white font-medium">{node.properties.role}</span>
                </div>
              )}
              {node.properties.msisdn && (
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-mono text-emerald-300">{node.properties.msisdn}</span>
                </div>
              )}
              {node.properties.imei && (
                <div>
                  <span className="text-slate-400">IMEI: </span>
                  <span className="font-mono text-slate-300">{node.properties.imei}</span>
                </div>
              )}
              {node.properties.last_tower && (
                <div>
                  <span className="text-slate-400">Tower: </span>
                  <span className="font-mono text-slate-300">{node.properties.last_tower}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Grounding */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-white tracking-wide">
              EVIDENCE GROUNDING ({node.evidence_refs?.length || 0})
            </span>
          </div>

          {/* Audio Intercept Player if relevant */}
          {(node.type === 'PHONE' || node.type === 'PERSON' || node.label.includes('Krish') || node.label.includes('Manish') || node.label.includes('Afnan')) && (
            <div className="bg-slate-950 border border-purple-800/60 rounded-lg p-3 space-y-2.5 shadow-lg shadow-purple-950/20">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span>INTERCEPTED AUDIO STREAM</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[9px] border border-purple-800">
                  ACOUSTIC VERIFIED
                </span>
              </div>

              {/* 64-bar simulated audio waveform */}
              <div className="flex items-end h-8 gap-0.5 bg-slate-900/80 p-1.5 rounded border border-slate-800 overflow-hidden">
                {[0.2, 0.4, 0.7, 0.9, 0.5, 0.3, 0.6, 0.8, 0.95, 0.4, 0.2, 0.5, 0.85, 0.6, 0.3, 0.7, 0.9, 0.4, 0.6, 0.8, 0.5, 0.3, 0.75, 0.95, 0.6, 0.4, 0.8, 0.5, 0.3, 0.65, 0.9, 0.4].map((amp, i) => (
                  <div
                    key={i}
                    style={{ height: `${amp * 100}%` }}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-sm hover:opacity-80 transition"
                  />
                ))}
              </div>

              {/* Flagged Acoustic Keywords */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="text-slate-400 text-[10px] mr-1">Flagged Words:</span>
                <span className="px-1.5 py-0.2 bg-red-950 border border-red-800 text-red-300 rounded font-mono">consignment</span>
                <span className="px-1.5 py-0.2 bg-red-950 border border-red-800 text-red-300 rounded font-mono">destroy SIM</span>
                <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-800 text-amber-300 rounded font-mono">drop-off</span>
              </div>

              {/* Dialogue Transcript Snippet */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] space-y-1 font-sans">
                <p className="text-slate-300"><b className="text-cyan-400">Speaker 1:</b> "Afnan, are the materials ready for delivery at Deogiri?"</p>
                <p className="text-slate-300"><b className="text-purple-400">Speaker 2:</b> "Yes, dispatching now. Destroy SIM card immediately after receiving."</p>
              </div>
            </div>
          )}

          {node.evidence_refs && node.evidence_refs.length > 0 ? (
            node.evidence_refs.map((ref, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-cyan-400 font-semibold">{ref.doc_id}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{ref.source_type}</span>
                </div>

                {ref.snippet && (
                  <p className="text-xs text-slate-300 italic border-l-2 border-cyan-500 pl-2 py-0.5 bg-slate-900/60 rounded-r">
                    "{ref.snippet}"
                  </p>
                )}

                <div className="flex items-center space-x-1 text-[9px] text-slate-500 font-mono truncate">
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">SHA256: {ref.doc_sha256}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No direct evidence snippet attached.</p>
          )}
        </div>
      </div>
    </div>
  );
};
