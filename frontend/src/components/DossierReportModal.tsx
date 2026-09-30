import React from 'react';
import { Shield, Printer, X, CheckCircle, FileText, Lock, Award } from 'lucide-react';
import type { IntelligenceDossier } from '../types/graph';

interface DossierReportModalProps {
  dossier: IntelligenceDossier | null;
  onClose: () => void;
}

export const DossierReportModal: React.FC<DossierReportModalProps> = ({
  dossier,
  onClose
}) => {
  if (!dossier) return null;

  const { metadata, executive_summary, suspect_profiles, intercepted_telecom_logs, bsa_section_63_certificate } = dossier;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wider text-white">FORENSIC INTELLIGENCE DOSSIER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-300 font-mono">
                  CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {metadata.issuing_authority} | Case: <span className="font-mono text-cyan-300">{metadata.case_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded">
              <span className="text-[10px] text-slate-500 block">TOTAL ENTITIES</span>
              <span className="text-lg font-bold text-white">{executive_summary.total_entities_analyzed}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded">
              <span className="text-[10px] text-slate-500 block">MAPPED RELATIONS</span>
              <span className="text-lg font-bold text-white">{executive_summary.total_relationships_mapped}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded">
              <span className="text-[10px] text-slate-500 block">TOP MASTERMIND</span>
              <span className="text-sm font-bold text-cyan-400 truncate block">{executive_summary.primary_mastermind}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded">
              <span className="text-[10px] text-slate-500 block">CROSS-GANG BROKER</span>
              <span className="text-sm font-bold text-amber-400 truncate block">{executive_summary.primary_cross_gang_broker}</span>
            </div>
          </div>

          {/* Section 1: Suspect Profiles */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-cyan-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>1. Suspect & Operative Intelligence Matrix</span>
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    <th className="p-2.5">Suspect Name</th>
                    <th className="p-2.5">Syndicate Role</th>
                    <th className="p-2.5">Threat Index</th>
                    <th className="p-2.5">Active Handset(s)</th>
                    <th className="p-2.5">Sector / Target Facility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {suspect_profiles.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-semibold text-white">{s.name}</td>
                      <td className="p-2.5 text-slate-300">{s.role}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          s.risk_score >= 0.8 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {s.risk_score}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-cyan-300">{s.phones.join(', ')}</td>
                      <td className="p-2.5 text-slate-400">{s.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Telecom Surveillance Intercepts */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-cyan-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>2. Intercepted Telecom Detail Records & Transcripts</span>
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded max-h-60">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-mono text-[11px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Caller</th>
                    <th className="p-2.5">Receiver</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Tower</th>
                    <th className="p-2.5">Surveillance Intel Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {intercepted_telecom_logs.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono text-slate-400">{c.timestamp.substring(0, 19)}</td>
                      <td className="p-2.5 font-medium text-white">{c.caller}</td>
                      <td className="p-2.5 font-medium text-white">{c.receiver}</td>
                      <td className="p-2.5 font-mono text-slate-400">{c.duration_sec}s</td>
                      <td className="p-2.5 font-mono text-slate-400">{c.tower_id}</td>
                      <td className="p-2.5 text-slate-300">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Statutory Section 63 BSA 2023 Certificate Box */}
          <div className="bg-emerald-950/30 border border-emerald-600/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA) Certificate of Authenticity</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {bsa_section_63_certificate.statutory_declaration}
            </p>

            <div className="bg-slate-950/80 p-3 rounded border border-emerald-900/60 font-mono text-[10px] space-y-1.5">
              <div>
                <span className="text-slate-500">BLOCKCHAIN MERKLE ROOT HASH: </span>
                <span className="text-emerald-400 break-all">{bsa_section_63_certificate.merkle_root_block_hash}</span>
              </div>
              <div>
                <span className="text-slate-500">CRYPTOGRAPHIC HMAC-SHA256 SIGNATURE SEAL: </span>
                <span className="text-cyan-400 break-all">{bsa_section_63_certificate.cryptographic_hmac_seal}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-emerald-900/40">
              <span><b>Investigating Officer:</b> {metadata.investigating_officer}</span>
              <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Forensic Hash Chain Verified</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
