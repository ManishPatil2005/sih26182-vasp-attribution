import React, { useState, useEffect } from 'react';
import { X, Zap, RefreshCw, Eye } from 'lucide-react';
import { fetchLinkPredictions } from '../services/api';
import type { LinkPrediction } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onHighlightPair?: (sourceId: string, targetId: string) => void;
}

export const HiddenLinksModal: React.FC<Props> = ({ isOpen, onClose, onHighlightPair }) => {
  const [predictions, setPredictions] = useState<LinkPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const preds = await fetchLinkPredictions(10);
      setPredictions(preds);
    } catch (e) {
      console.error('Failed to load link predictions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPredictions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  AI Heuristic Link Prediction Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                  ADAMIC-ADAR & JACCARD TOPOLOGY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Discovers hidden associations between suspects avoiding direct phone calls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPredictions}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Predictions"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-purple-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono">Computing topological non-edge neighborhood intersections...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No hidden candidate non-edges detected in the active graph. Load a syndicate scenario to evaluate.
            </div>
          ) : (
            <div className="grid gap-3">
              {predictions.map((pred, idx) => {
                const probPercent = Math.round(pred.hidden_link_probability * 100);
                const isVeryHigh = pred.confidence_level === 'VERY HIGH';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/40 transition flex flex-col gap-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{pred.source_label}</span>
                        <span className="text-purple-400 font-bold">⇄</span>
                        <span className="font-semibold text-slate-100 text-sm">{pred.target_label}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            isVeryHigh
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {pred.confidence_level} CONFIDENCE
                        </span>

                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300">
                          <span>{probPercent}%</span>
                          <div className="w-16 h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                              style={{ width: `${probPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shared Intermediaries */}
                    <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Shared Conduits ({pred.common_neighbors_count}):
                      </span>
                      {pred.common_intermediates.map((inter, iIdx) => (
                        <span
                          key={iIdx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-purple-300 border border-purple-900/50"
                        >
                          {inter}
                        </span>
                      ))}
                    </div>

                    {/* Reasoning and Metrics */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                      <p className="flex-1 min-w-[280px] text-slate-300">{pred.reasoning}</p>

                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <span>Jaccard: <strong className="text-cyan-400">{pred.jaccard_score}</strong></span>
                        <span>Adamic-Adar: <strong className="text-purple-400">{pred.adamic_adar_score}</strong></span>

                        {onHighlightPair && (
                          <button
                            onClick={() => {
                              onHighlightPair(pred.source_id, pred.target_id);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 ml-2"
                          >
                            <Eye className="w-3.5 h-3.5" /> View on Canvas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Adamic-Adar weights penalize shared hubs to highlight covert intermediaries.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
