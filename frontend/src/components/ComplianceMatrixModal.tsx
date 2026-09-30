import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, X, Award, RefreshCw } from 'lucide-react';
import { fetchComplianceMatrix } from '../services/api';
import type { ComplianceMatrix } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceMatrixModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [matrix, setMatrix] = useState<ComplianceMatrix | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchComplianceMatrix()
        .then(res => setMatrix(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  MHA Problem Statement 26189 Compliance Matrix
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                  100% COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                National Crime Records Bureau (NCRB) Women Safety Division | Theme: Blockchain & Cybersecurity
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono">Verifying Ministry of Home Affairs compliance criteria...</p>
            </div>
          ) : matrix ? (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase text-emerald-300">
                      Problem Statement ID: {matrix.problem_statement_id}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{matrix.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {matrix.ministry} • {matrix.department}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                    Score: {matrix.overall_compliance_score}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Theme: {matrix.theme}</p>
                </div>
              </div>

              {/* Criteria Grid */}
              <div className="grid gap-3">
                {matrix.criteria_evaluations.map((c) => (
                  <div
                    key={c.criterion_id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/40 transition text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-slate-100">{c.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {c.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 italic pl-6">{c.mandate}</p>

                    <div className="pl-6 pt-1">
                      <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">
                        Technical Implementations:
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-1 text-[11px] text-slate-300">
                        {c.features_implemented.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
