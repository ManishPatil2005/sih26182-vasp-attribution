import React, { useState } from 'react';
import { 
  FolderDown, 
  X, 
  Upload, 
  FileText, 
  PhoneCall, 
  CreditCard, 
  Binoculars, 
  FileBadge, 
  AlertOctagon, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { uploadMultiSourceFile } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: () => void;
}

type SourceType = 'cdr' | 'bank' | 'fir' | 'surveillance' | 'criminal-history' | 'intelligence';

const SOURCES: Array<{ id: SourceType; title: string; icon: React.ReactNode; ext: string; sampleText: string; sampleFilename: string }> = [
  {
    id: 'fir',
    title: '1. Police FIR / Chargesheet',
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    ext: '.txt, .pdf',
    sampleFilename: 'FIR_2024_AUR_CYBER_882.txt',
    sampleText: `FIRST INFORMATION REPORT (FIR) - CRIME BRANCH
Police Station: Cyber Crime Cell, Chhatrapati Sambhajinagar
Case No: FIR-882/2024 u/s 143, 78, 111 Bharatiya Nyaya Sanhita (BNS) 2023.
Accused named: Tanya Verma alias @shadow_lead, Kabir Mehta, and Afnan Khan.
Details: Accused operated fake overseas placement agency 'Apex Talent Consultants', recruiting young women under pretext of hospitality jobs, subsequently trafficking victims to safehouses in CIDCO Sector 5.`
  },
  {
    id: 'cdr',
    title: '2. Call Detail Records (CDRs)',
    icon: <PhoneCall className="w-4 h-4 text-emerald-400" />,
    ext: '.csv',
    sampleFilename: 'CDR_TOWER_CSN_SERIES_4.csv',
    sampleText: `caller_msisdn,receiver_msisdn,duration_sec,timestamp,tower_id,imei
+919822011111,+919822022222,480,2026-09-21T14:15:00Z,TWR-CSN-01,864920184029182
+919822022222,+919822033333,310,2026-09-21T18:30:00Z,TWR-CSN-05,864920184029183
+919822044444,+919822055555,450,2026-09-21T21:05:00Z,TWR-CSN-03,864920184029184`
  },
  {
    id: 'bank',
    title: '3. Financial Transactions',
    icon: <CreditCard className="w-4 h-4 text-amber-400" />,
    ext: '.csv',
    sampleFilename: 'BANK_UTR_HAWALA_SERIES_7.csv',
    sampleText: `source_account,destination_account,amount,timestamp,utr_number,channel
ACC-ICICI-MULE,ACC-USDT-ESCROW,850000.0,2026-09-21T16:00:00Z,UTRH7728192039,NEFT_P2P
ACC-ICICI-MULE,ACC-MULE-POOJA,150000.0,2026-09-21T16:30:00Z,UTRH7728192040,IMPS_LAYER
ACC-MULE-AMIT,ACC-ICICI-MULE,45000.0,2026-09-21T17:00:00Z,UTRH7728192041,UPI_SMURF`
  },
  {
    id: 'surveillance',
    title: '4. Surveillance Reports',
    icon: <Binoculars className="w-4 h-4 text-purple-400" />,
    ext: '.txt',
    sampleFilename: 'SURVEILLANCE_LOG_STAKEOUT_CIDCO.txt',
    sampleText: `PHYSICAL STAKEOUT & FIELD SURVEILLANCE REPORT
Operative ID: Special Team Inspector R. K. Sharma
Target Observed: Kabir Mehta driving White Mahindra Scorpio MH-20-DE-1102.
Location: Reached safehouse at CIDCO Sector 5 (Flat 304, Green View Apartments).
Accompanied by: Afnan Khan. Unloaded 2 heavy travel consignments. Target phone active: +919822055555.`
  },
  {
    id: 'criminal-history',
    title: '5. CCTNS Criminal History',
    icon: <FileBadge className="w-4 h-4 text-rose-400" />,
    ext: '.txt',
    sampleFilename: 'CCTNS_DOSSIER_9912_HABITUAL.txt',
    sampleText: `CRIME AND CRIMINAL TRACKING NETWORK & SYSTEMS (CCTNS) DOSSIER
Dossier ID: CCTNS-MH-2024-9912
Suspect: Tanya Verma alias Shadow Lead.
Prior FIR Cases: FIR 142/2021 Pune Cyber Cell, FIR 88/2023 Aurangabad Crime Branch.
Offenses: Habitual Offender under Section 111 Bharatiya Nyaya Sanhita (Organized Crime syndicate leadership). Bail revoked.`
  },
  {
    id: 'intelligence',
    title: '6. Intelligence Agency Bulletins (MAC)',
    icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
    ext: '.txt',
    sampleFilename: 'MAC_SECRET_INTEL_BULLETIN_2026_09.txt',
    sampleText: `MULTI-AGENCY CENTER (MAC) TOP SECRET INTELLIGENCE BULLETIN
Classification: STRICTLY CONFIDENTIAL // LAW ENFORCEMENT ONLY
Alert Subject: Interstate Human Trafficking & Digital Extortion Nexus.
Key Operative: Afnan Khan operating burner phone network +919822033333.
Conduit: Clandestine financial settlements channeled via Tether USDT TRC-20 wallet TXk9bV8mP2zQ7aL1wE5rY882pQ5a9Z1m7N.`
  }
];

export const MultiSourceIngestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onIngestSuccess
}) => {
  const [activeTab, setActiveTab] = useState<SourceType>('fir');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSource = SOURCES.find(s => s.id === activeTab)!;

  const handleUploadFile = async (file: File) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await uploadMultiSourceFile(activeTab, file);
      setSuccessMsg(res.message || `Successfully ingested ${file.name}`);
      onIngestSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to ingest file');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    const blob = new Blob([currentSource.sampleText], { type: 'text/plain' });
    const file = new File([blob], currentSource.sampleFilename, { type: 'text/plain' });
    await handleUploadFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  Multi-Source Intelligence Ingestion Hub
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded">
                  7 POLICE DATA SOURCES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Addresses Ministry mandate: FIRs, CDRs, Bank, Surveillance, OSINT, CCTNS & Intel Bulletins
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

        {/* Source Navigation Tabs */}
        <div className="flex overflow-x-auto p-2 bg-slate-950/60 border-b border-slate-800 gap-1.5 no-scrollbar">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveTab(s.id);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === s.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s.icon}
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 bg-slate-950/40 text-center transition flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-slate-800 text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Upload {currentSource.title} File
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supported formats: {currentSource.ext} (Auto-hashes with SHA-256 for Section 63 BSA 2023)
              </p>
            </div>

            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-md shadow-blue-950">
              <span>Choose Local File</span>
              <input
                type="file"
                className="hidden"
                accept={currentSource.ext}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                }}
              />
            </label>
          </div>

          {/* Pre-loaded Sample Section */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                Benchmark Sample Preview: {currentSource.sampleFilename}
              </span>
              <button
                onClick={handleLoadSample}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition cursor-pointer shadow"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderDown className="w-3.5 h-3.5" />}
                <span>Load Sample Into Graph</span>
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 leading-relaxed">
              {currentSource.sampleText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
