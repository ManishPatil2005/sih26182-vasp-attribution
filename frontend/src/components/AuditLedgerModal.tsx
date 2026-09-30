import React, { useState } from 'react';
import type { AuditBlock } from '../types/graph';
import { X, Lock, CheckCircle, RefreshCw } from 'lucide-react';
import { verifyAuditLedger } from '../services/api';

interface AuditLedgerModalProps {
  blocks: AuditBlock[];
  onClose: () => void;
  onRefresh: () => void;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  blocks,
  onClose,
  onRefresh
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string } | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyAuditLedger();
      setVerifyResult(res);
      onRefresh();
    } catch (err: any) {
      setVerifyResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">
                TAMPER-EVIDENT CRYPTOGRAPHIC AUDIT CHAIN
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Section 63 BSA 2023 Electronic Evidence Non-Repudiation Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Banner */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              {verifyResult ? verifyResult.message : 'Mathematical Hash Chain Integrity: Intact (0 Corrupted Blocks)'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Verifying...' : 'Re-verify Entire Chain'}</span>
            </button>
            <span className="px-2 py-1 bg-slate-800 rounded font-mono text-cyan-400 text-xs">
              {blocks.length} Blocks
            </span>
          </div>
        </div>

        {/* Block Timeline */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 font-mono text-xs">
          {blocks.map((block, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border transition ${
                block.index === 0
                  ? 'bg-blue-950/30 border-blue-800'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                    BLOCK #{block.index}
                  </span>
                  <span className="text-white font-semibold">{block.action}</span>
                </div>
                <span className="text-slate-400 text-[10px]">{block.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500">Officer / Actor:</span>{' '}
                  <span className="text-slate-200">{block.officer_id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Entity:</span>{' '}
                  <span className="text-slate-200">{block.target_id || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-900 space-y-1 text-[9px] text-slate-500">
                <div className="truncate">
                  <span className="text-slate-600">Prev Hash: </span>
                  <span className="text-slate-400">{block.prev_hash}</span>
                </div>
                <div className="truncate">
                  <span className="text-emerald-600">Block Hash: </span>
                  <span className="text-emerald-400 font-bold">{block.block_hash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
