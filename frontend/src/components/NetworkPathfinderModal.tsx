import React, { useState } from 'react';
import { Route, X, ArrowRight, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { fetchPathway } from '../services/api';
import type { GraphNode, PathfinderResponse } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nodes: GraphNode[];
  onHighlightPath?: (nodeIds: string[]) => void;
}

export const NetworkPathfinderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nodes,
  onHighlightPath
}) => {
  const personNodes = nodes.filter(n => n.type === 'PERSON');
  const [sourceId, setSourceId] = useState<string>(personNodes[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(personNodes[personNodes.length - 1]?.id || '');
  const [pathway, setPathway] = useState<PathfinderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrace = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPathway(sourceId, targetId);
      setPathway(res);
      if (res.connected && onHighlightPath) {
        onHighlightPath(res.node_sequence);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to trace pathway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  Network Connection Pathfinder
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
                  EVIDENTIARY SHORTEST CHAIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Traces multi-hop intermediate conduits between any two suspects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Source Target:</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {personNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.id})
                </option>
              ))}
            </select>
          </div>

          <div className="text-cyan-400 font-bold self-end pb-2">⇄</div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Destination Target:</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {personNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTrace}
            disabled={loading || !sourceId || !targetId || sourceId === targetId}
            className="self-end px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition shadow-md shadow-cyan-950 flex items-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Trace Pathway</span>
          </button>
        </div>

        {/* Pathway Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {pathway ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                    {pathway.connected ? `Chain Identified: ${pathway.path_length} Hop(s)` : 'No Connection'}
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">{pathway.tactical_summary}</p>
                </div>
                {pathway.connected && onHighlightPath && (
                  <button
                    onClick={() => {
                      onHighlightPath(pathway.node_sequence);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View on Canvas
                  </button>
                )}
              </div>

              {pathway.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono uppercase text-slate-400">Step-by-Step Evidence Linkage:</h4>
                  {pathway.steps.map((step) => (
                    <div
                      key={step.step_number}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-900/60 border border-cyan-500/40 text-[10px] font-mono flex items-center justify-center text-cyan-300">
                          {step.step_number}
                        </span>
                        <span className="font-semibold text-slate-100">{step.from_label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="px-2 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-cyan-300 border border-slate-700">
                          {step.relation}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-semibold text-slate-100">{step.to_label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-900/40 border border-purple-700/50 text-[10px] font-mono text-purple-300">
                          {step.evidence_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select two target individuals and click <strong>Trace Pathway</strong> to calculate the shortest multi-hop connection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
