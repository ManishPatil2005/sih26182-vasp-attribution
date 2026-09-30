import React, { useState } from 'react';
import type { 
  AnalyticsSummary, 
  SplinkCandidate 
} from '../types/graph';
import { 
  Crown, 
  Network, 
  AlertOctagon, 
  GitMerge, 
  Upload, 
  Check, 
  FileUp
} from 'lucide-react';

interface AnalyticsPanelProps {
  analytics: AnalyticsSummary | null;
  candidates: SplinkCandidate[];
  onSelectNode: (nodeId: string) => void;
  onMerge: (canonicalId: string, duplicateId: string) => void;
  onUpload: (type: 'cdr' | 'bank' | 'fir', file: File) => Promise<void>;
  loading?: boolean;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  candidates,
  onSelectNode,
  onMerge,
  onUpload
}) => {
  const [activeTab, setActiveTab] = useState<'intel' | 'fusion' | 'ingest'>('intel');
  const [uploadType, setUploadType] = useState<'cdr' | 'bank' | 'fir'>('cdr');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      await onUpload(uploadType, selectedFile);
      setUploadMsg(`Successfully ingested ${selectedFile.name}`);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadMsg(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('intel')}
          className={`flex-1 py-3 text-center font-medium transition cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === 'intel'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>AI Intel</span>
        </button>

        <button
          onClick={() => setActiveTab('fusion')}
          className={`flex-1 py-3 text-center font-medium transition cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === 'fusion'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Fusion ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ingest')}
          className={`flex-1 py-3 text-center font-medium transition cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === 'ingest'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Ingest</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* INTEL TAB */}
        {activeTab === 'intel' && (
          <div className="space-y-4">
            {/* Suspicious Motifs (Hawala Loops) */}
            {analytics?.suspicious_motifs && analytics.suspicious_motifs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-red-400">
                  <AlertOctagon className="w-4 h-4" />
                  <span>SUSPICIOUS PATTERNS DETECTED</span>
                </div>
                {analytics.suspicious_motifs.map((motif, idx) => (
                  <div key={idx} className="bg-red-950/40 border border-red-800/80 rounded p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-red-300">{motif.motif_type}</span>
                      <span className="px-1.5 py-0.2 bg-red-900/80 text-[10px] text-red-200 rounded">
                        {motif.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{motif.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Masterminds Leaderboard (PageRank) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-white">
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  <span>MASTERMINDS (PageRank)</span>
                </div>
                <span className="text-[10px] text-slate-400">Influence</span>
              </div>

              <div className="space-y-1.5">
                {analytics?.masterminds && analytics.masterminds.length > 0 ? (
                  analytics.masterminds.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectNode(m.node_id)}
                      className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-between text-xs cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-4 text-center font-mono text-[10px] text-slate-500">{idx + 1}</span>
                        <div>
                          <span className="font-semibold text-white block">{m.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{m.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-cyan-400">
                          {(m.pagerank_score * 100).toFixed(1)}%
                        </span>
                        <span className="block text-[9px] text-red-400 font-semibold">
                          Risk: {Math.round(m.risk_score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No masterminds calculated yet.</p>
                )}
              </div>
            </div>

            {/* Cross-Cell Brokers Leaderboard (Betweenness) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-white">
                  <Network className="w-3.5 h-3.5 text-amber-400" />
                  <span>BRIDGING BROKERS (Betweenness)</span>
                </div>
                <span className="text-[10px] text-slate-400">Brokerage</span>
              </div>

              <div className="space-y-1.5">
                {analytics?.brokers && analytics.brokers.length > 0 ? (
                  analytics.brokers.map((b, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectNode(b.node_id)}
                      className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-between text-xs cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-4 text-center font-mono text-[10px] text-slate-500">{idx + 1}</span>
                        <div>
                          <span className="font-semibold text-white block">{b.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{b.type}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        {(b.betweenness_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No brokers calculated yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FUSION TAB (Splink Probabilistic Deduplication) */}
        {activeTab === 'fusion' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs text-purple-400 font-semibold">
              <GitMerge className="w-4 h-4" />
              <span>SPLINK IDENTITY RESOLUTION QUEUE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Probabilistic linkage flagged potential alias duplicates. Review matches and confirm merge into a unified entity.
            </p>

            {candidates.length > 0 ? (
              candidates.map((cand, idx) => (
                <div key={idx} className="bg-slate-950 border border-purple-900/50 rounded p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-300">
                      Match: {(cand.similarity_score * 100).toFixed(0)}%
                    </span>
                    <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[10px]">
                      {cand.suggested_action}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2 rounded space-y-1 text-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entity A:</span>
                      <span className="font-semibold text-white">{cand.candidate_a.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entity B:</span>
                      <span className="font-semibold text-white">{cand.candidate_b.label}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    {cand.matching_attributes.map((attr, aIdx) => (
                      <div key={aIdx} className="flex items-center space-x-1 text-purple-300">
                        <Check className="w-3 h-3 text-purple-400" />
                        <span>{attr}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onMerge(cand.candidate_a.id, cand.candidate_b.id)}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Confirm & Merge Nodes</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-950/50 rounded border border-slate-800 text-center text-xs text-slate-500">
                No unresolved alias conflicts. All suspect identities unified.
              </div>
            )}
          </div>
        )}

        {/* INGEST TAB */}
        {activeTab === 'ingest' && (
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <FileUp className="w-4 h-4" />
              <span>MULTI-SOURCE EVIDENCE INGESTION</span>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Select Evidence Stream:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-800 rounded text-xs">
                <button
                  type="button"
                  onClick={() => setUploadType('cdr')}
                  className={`py-1 rounded cursor-pointer ${
                    uploadType === 'cdr' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CDR CSV
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('bank')}
                  className={`py-1 rounded cursor-pointer ${
                    uploadType === 'bank' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bank CSV
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('fir')}
                  className={`py-1 rounded cursor-pointer ${
                    uploadType === 'fir' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FIR PDF/TXT
                </button>
              </div>
            </div>

            {/* File Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Upload File:</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer bg-slate-950 border border-slate-800 rounded p-1"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Parsing & Hashing...' : 'Ingest & Extract Entities'}</span>
            </button>

            {uploadMsg && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
                {uploadMsg}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
