import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Flame 
} from 'lucide-react';
import { simulateDisruption, fetchOptimalDisruptionRecommendations } from '../services/api';
import type { GraphNode, DisruptionImpact, DisruptionRecommendation } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nodes: GraphNode[];
}

export const DisruptionPlannerModal: React.FC<Props> = ({ isOpen, onClose, nodes }) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [impact, setImpact] = useState<DisruptionImpact | null>(null);
  const [recommendations, setRecommendations] = useState<DisruptionRecommendation[]>([]);

  // Filter only Person / Suspect nodes
  const suspectNodes = nodes.filter(n => n.type === 'PERSON');

  const handleSimulate = async (targets: string[]) => {
    if (targets.length === 0) return;
    try {
      const res = await simulateDisruption(targets);
      setImpact(res);
    } catch (err) {
      console.error('Failed to simulate disruption:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOptimalDisruptionRecommendations(3)
        .then(recs => {
          setRecommendations(recs);
          // Default select top recommendation if available
          if (recs.length > 0 && recs[0].target_nodes.length > 0) {
            setSelectedNodeIds(recs[0].target_nodes);
            handleSimulate(recs[0].target_nodes);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const toggleNodeSelection = (nodeId: string) => {
    let updated: string[];
    if (selectedNodeIds.includes(nodeId)) {
      updated = selectedNodeIds.filter(id => id !== nodeId);
    } else {
      updated = [...selectedNodeIds, nodeId];
    }
    setSelectedNodeIds(updated);
    if (updated.length > 0) {
      handleSimulate(updated);
    } else {
      setImpact(null);
    }
  };

  const applyRecommendation = (rec: DisruptionRecommendation) => {
    setSelectedNodeIds(rec.target_nodes);
    handleSimulate(rec.target_nodes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-rose-950/60 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-600 to-red-700 rounded-xl shadow-lg shadow-rose-500/20 text-white">
              <Crosshair className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                  Target Neutralization & Syndicate Disruption Planner
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                  GRAPH RESILIENCE ANALYTICS
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                  CUT-VERTEX DETECTION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate targeted suspect interdictions, evaluate network percolation, and identify optimal joint arrest strikes.
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Top Optimal Strike Recommendations */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              Mathematically Recommended Joint Strike Vectors (Top SDI)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.map((rec) => {
                const isSelected = rec.target_nodes.every(id => selectedNodeIds.includes(id)) && rec.target_nodes.length === selectedNodeIds.length;
                return (
                  <div 
                    key={rec.rank}
                    onClick={() => applyRecommendation(rec)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-rose-400 text-[11px]">
                          STRIKE VECTOR #{rec.rank}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono font-bold text-[10px]">
                          {rec.predicted_disruption_index}% SDI
                        </span>
                      </div>

                      <div className="font-bold text-slate-200 text-xs mb-1">
                        {rec.target_names.join(' + ')}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-3">
                        {rec.justification}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      {rec.cut_vertex && (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Cut-Vertex
                        </span>
                      )}
                      <span className="text-rose-400 font-semibold ml-auto">
                        {isSelected ? '✓ Active Strike' : 'Click to Simulate'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Simulation Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left: Suspect Selection Pool */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col">
              <div className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Select Suspects to Interdict ({selectedNodeIds.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Check to Neutralize</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Toggle individuals to simulate their arrest and evaluate remaining network cohesion.
              </p>

              <div className="flex-1 overflow-y-auto space-y-1.5 max-h-72 pr-1">
                {suspectNodes.map((s) => {
                  const isChecked = selectedNodeIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleNodeSelection(s.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-rose-950/30 border-rose-500/50 text-slate-100'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="font-medium text-[11px]">{s.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{s.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Disruption Impact Evaluation */}
            <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              {impact ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-rose-400" />
                        <h3 className="text-sm font-bold text-slate-100">
                          Simulated Interdiction Impact
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Syndicate Disruption Index</span>
                        <div className="text-2xl font-bold font-mono text-rose-400">
                          {impact.syndicate_disruption_index}%
                        </div>
                      </div>
                    </div>

                    {/* SDI Visual Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                      <div 
                        className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${impact.syndicate_disruption_index}%` }}
                      />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Links Severed</div>
                        <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                          {impact.communication_edges_severed}
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Network Fracture</div>
                        <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                          {impact.initial_components} → {impact.remaining_components}
                        </div>
                        <div className="text-[9px] text-slate-500">Components</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Giant Core Size</div>
                        <div className="text-base font-bold font-mono text-purple-300 mt-0.5">
                          {impact.initial_giant_component_size} → {impact.remaining_giant_component_size}
                        </div>
                        <div className="text-[9px] text-slate-500">Nodes Left</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Hawala Paralyzed</div>
                        <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                          {impact.hawala_capacity_paralyzed_pct}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tactical Assessment Verdict */}
                  <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 text-xs">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Tactical Strike Assessment:
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {impact.tactical_verdict}
                    </p>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Targeted Entities: <strong className="text-slate-200">{impact.targeted_labels.join(', ')}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                  <Crosshair className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Select one or more suspects on the left or click a strike vector above to simulate arrest impact.</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <span>Syndicate Percolation & Cut-Vertex Engine Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close Planner
          </button>
        </div>

      </div>
    </div>
  );
};
