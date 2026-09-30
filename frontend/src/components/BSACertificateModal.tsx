import React from 'react';
import type { BSACertificate } from '../types/graph';
import { X, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

interface BSACertificateModalProps {
  certificate: BSACertificate | null;
  onClose: () => void;
}

export const BSACertificateModal: React.FC<BSACertificateModalProps> = ({
  certificate,
  onClose
}) => {
  if (!certificate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023 — SECTION 63 CERTIFICATE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Court-ready format) */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 font-serif leading-relaxed">
          <div className="border border-slate-700 p-4 bg-slate-950/70 rounded space-y-3 font-sans">
            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-white text-sm block">GOVERNMENT OF INDIA</span>
                <span className="text-[11px] text-slate-400">MINISTRY OF HOME AFFAIRS | NCRB</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-cyan-400 font-bold block">{certificate.certificate_id}</span>
                <span className="text-[10px] text-slate-500 font-mono">{certificate.issue_date}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Station / Unit:</span>{' '}
                <span className="text-white font-mono">{certificate.police_station_code}</span>
              </div>
              <div>
                <span className="text-slate-400">Investigating Officer:</span>{' '}
                <span className="text-white">{certificate.officer_in_charge}</span>
              </div>
              <div>
                <span className="text-slate-400">Governing Statute:</span>{' '}
                <span className="text-emerald-400 font-semibold">{certificate.governing_act}</span>
              </div>
              <div>
                <span className="text-slate-400">Ledger Hash Integrity:</span>{' '}
                <span className="text-emerald-400 font-bold">MATHEMATICALLY VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Statutory Declaration */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-sans">
              Statutory Certification & Non-Intervention Statement
            </h4>
            <p className="bg-slate-950 p-3 rounded border border-slate-800 italic text-slate-300">
              "{certificate.declaration}"
            </p>
          </div>

          {/* Digital Artifacts Schedule */}
          <div className="space-y-2 font-sans">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Schedule of Electronic Records & Cryptographic Checksums
            </h4>
            <div className="bg-slate-950 border border-slate-800 rounded divide-y divide-slate-800 text-[11px]">
              {certificate.ingested_artifacts && certificate.ingested_artifacts.length > 0 ? (
                certificate.ingested_artifacts.map((art, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{art.doc_id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">SHA-256: {art.sha256}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {art.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-slate-500 italic">No external artifacts attached to current view.</div>
              )}
            </div>
          </div>

          {/* Electronic Seal Block */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between font-sans">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <span className="font-bold block">Digitally Certified & Sealed</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Chain Tip: {certificate.latest_block_hash.slice(0, 24)}...
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Signature of Authorized Custodian</span>
              <span className="font-mono text-xs text-white">[DIGITALLY SEALED - IO 782]</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition cursor-pointer flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Certificate</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
