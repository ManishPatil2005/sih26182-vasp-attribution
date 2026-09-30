import React, { useState, useEffect } from 'react';
import { Crown, Network, Shield, Building, X, RefreshCw, Eye, ArrowDown } from 'lucide-react';
import { fetchSyndicateHierarchy } from '../services/api';
import type { SyndicateHierarchy, SyndicateRoleItem } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export const SyndicateHierarchyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectNode
}) => {
  const [hierarchy, setHierarchy] = useState<SyndicateHierarchy | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchSyndicateHierarchy();
      setHierarchy(res);
    } catch (e) {
      console.error('Failed to load hierarchy:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderTierCard = (
    title: string,
    icon: React.ReactNode,
    items: SyndicateRoleItem[],
    bgGradient: string,
    borderColor: string,
    badgeColor: string
  ) => (
    <div className={`p-4 rounded-2xl bg-slate-950/60 border ${borderColor} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${bgGradient} text-white`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">{title}</h3>
            <span className="text-[10px] text-slate-400 font-mono">{items.length} Entities Classified</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.node_id}
            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between text-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-100">{item.label}</span>
                <span className={`px-2 py-0.2 text-[9px] font-mono font-bold rounded ${badgeColor}`}>
                  {item.threat_level}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{item.influence_summary}</p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Risk: <strong className="text-slate-200">{(item.risk_score * 100).toFixed(0)}%</strong></span>
              {onSelectNode && (
                <button
                  onClick={() => {
                    onSelectNode(item.node_id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  <Eye className="w-3 h-3" /> Focus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/20 text-white">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  Syndicate Command Hierarchy Matrix
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                  PAGERANK & ROLE PROFILING
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organized crime structure: Leaders, Intermediaries, Field Enforcers & Fronts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Hierarchy"
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
            <div className="flex flex-col items-center justify-center py-16 text-rose-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono">Computing multi-factor centrality tiers and command chains...</p>
            </div>
          ) : hierarchy ? (
            <div className="space-y-4">
              {/* Tier 1 */}
              {renderTierCard(
                'Tier 1: Supreme Command & Syndicate Masterminds',
                <Crown className="w-4 h-4" />,
                hierarchy.hierarchy.tier_1_masterminds,
                'bg-gradient-to-r from-red-600 to-rose-700',
                'border-rose-500/40',
                'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              )}

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              {/* Tier 2 */}
              {renderTierCard(
                'Tier 2: Cross-Cell Intermediaries & Strategic Brokers',
                <Network className="w-4 h-4" />,
                hierarchy.hierarchy.tier_2_brokers,
                'bg-gradient-to-r from-purple-600 to-indigo-700',
                'border-purple-500/40',
                'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              )}

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              {/* Tier 3 */}
              {renderTierCard(
                'Tier 3: Specialized Operatives (Logistics, SIMs & Enforcers)',
                <Shield className="w-4 h-4" />,
                hierarchy.hierarchy.tier_3_specialists,
                'bg-gradient-to-r from-amber-600 to-yellow-700',
                'border-amber-500/40',
                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              )}

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              {/* Tier 4 */}
              {renderTierCard(
                'Tier 4: Shell Fronts, Mule Accounts & Conduits',
                <Building className="w-4 h-4" />,
                hierarchy.hierarchy.tier_4_fronts_and_mules,
                'bg-gradient-to-r from-cyan-600 to-blue-700',
                'border-cyan-500/40',
                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No hierarchy data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
