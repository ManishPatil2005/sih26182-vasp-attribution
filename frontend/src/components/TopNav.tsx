import React from 'react';
import { 
  Shield, 
  FileCheck, 
  Play, 
  RotateCcw, 
  Lock, 
  Radio, 
  FileSpreadsheet,
  MapPin,
  Bot,
  Zap,
  Network,
  Route,
  Crown,
  FolderDown,
  ShieldCheck,
  Coins,
  Crosshair,
  LogOut,
  Sliders,
  UserCheck
} from 'lucide-react';
import type { OfficerSession } from '../types/auth';

interface TopNavProps {
  onLoadDemo: () => void;
  onLoadFun: () => void;
  onLoadRakshak: () => void;
  onOpenBSA: () => void;
  onOpenAudit: () => void;
  onOpenDossier: () => void;
  onOpenHiddenLinks: () => void;
  onOpenPathfinder: () => void;
  onOpenHierarchy: () => void;
  onOpenIngestHub: () => void;
  onOpenCompliance: () => void;
  onOpenInterception: () => void;
  onOpenCrypto: () => void;
  onOpenDisruption: () => void;
  onOpenVASPAttribution?: () => void;
  agencyClearance: string;
  onChangeAgencyClearance: (agency: string) => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  activeTab: 'graph' | 'gis';
  onChangeTab: (tab: 'graph' | 'gis') => void;
  onClear: () => void;
  isVerified: boolean;
  totalBlocks: number;
  loading: boolean;
  currentSession?: OfficerSession | null;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  onLockWorkstation?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onLoadDemo,
  onLoadFun,
  onLoadRakshak,
  onOpenBSA,
  onOpenAudit,
  onOpenDossier,
  onOpenHiddenLinks,
  onOpenPathfinder,
  onOpenHierarchy,
  onOpenIngestHub,
  onOpenCompliance,
  onOpenInterception,
  onOpenCrypto,
  onOpenDisruption,
  onOpenVASPAttribution,
  agencyClearance,
  onChangeAgencyClearance,
  onToggleCopilot,
  isCopilotOpen,
  activeTab,
  onChangeTab,
  onClear,
  isVerified,
  totalBlocks,
  loading,
  currentSession,
  onOpenAdmin,
  onLogout,
  onLockWorkstation
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & MHA Tag */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white tracking-wider text-sm">SAHYOG-VASP AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-mono font-bold">
              SIH26182
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            MHA I4C Gateway &bull; VASP Attribution &amp; Sec 94 BNSS
          </p>
        </div>
      </div>

      {/* View Switcher Tabs: Knowledge Graph vs GIS Map */}
      <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
        <button
          onClick={() => onChangeTab('graph')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Knowledge Graph</span>
        </button>

        <button
          onClick={() => onChangeTab('gis')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
            activeTab === 'gis'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>GIS Tower Proximity</span>
        </button>
      </div>

        {/* Center Operational Badge & Hash Chain */}
      <div className="hidden xl:flex items-center space-x-2">
        {/* Security Clearance Switcher */}
        <select
          value={agencyClearance}
          onChange={(e) => onChangeAgencyClearance(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-cyan-300 text-[11px] font-mono rounded px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
          title="Switch Multi-Agency Security Clearance"
        >
          <option value="MHA_APEX_COMMAND">MHA Apex Command (Top Secret)</option>
          <option value="NCRB_WOMEN_SAFETY">NCRB Women Safety Unit</option>
          <option value="NIA_TERROR_FINANCE">NIA Financial Intel Cell</option>
          <option value="STATE_POLICE_IO">State Police IO (Redacted)</option>
        </select>

        {/* National Interception & 1M Scale Gateway */}
        <button
          onClick={onOpenInterception}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/50 text-xs hover:bg-cyan-900/60 text-cyan-300 font-medium transition cursor-pointer shadow-sm shadow-cyan-950"
          title="Open Higher Authority Lawful Interception Gateway (10 Lakh Criminal Watchlist & 2B Population Capacity)"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Authority Gateway (1M Scale)</span>
        </button>

        {/* MHA Problem Statement 26189 Matrix */}
        <button
          onClick={onOpenCompliance}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs hover:bg-emerald-900/40 text-emerald-300 font-medium transition cursor-pointer"
          title="View 100% MHA Problem Statement 26189 Compliance Matrix"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MHA PS-26189</span>
        </button>

        {/* BSA 2023 Sec 63 Chain Status */}
        <button
          onClick={onOpenAudit}
          className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs hover:bg-slate-800 transition cursor-pointer"
          title="Click to view full cryptographic hash chain"
        >
          <Lock className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-slate-300 font-medium font-mono text-[11px]">
            {totalBlocks} Blocks Verified
          </span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Flagship SIH26182 VASP Attribution Engine */}
        {onOpenVASPAttribution && (
          <button
            onClick={onOpenVASPAttribution}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition cursor-pointer border border-cyan-400/40"
            title="Automated Attribution of Unknown Crypto Wallets to Nearest VASPs (SIH26182)"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-cyan-200" />
            <span>VASP Attribution</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-cyan-200 font-mono uppercase font-black">
              SIH26182
            </span>
          </button>
        )}

        {/* Web3 Crypto-Hawala Forensics */}
        <button
          onClick={onOpenCrypto}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 text-xs transition cursor-pointer"
          title="Web3 & Darknet Crypto-Hawala Forensics (Peeling Chains & Mixers)"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Crypto-Hawala</span>
        </button>

        {/* Target Neutralization & Disruption Planner */}
        <button
          onClick={onOpenDisruption}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs transition cursor-pointer"
          title="Target Neutralization & Syndicate Disruption Planner (SDI)"
        >
          <Crosshair className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Disruption</span>
        </button>
        {/* Operation Rakshak (NCRB Women Safety Priority) */}
        <button
          onClick={onLoadRakshak}
          disabled={loading}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium text-xs shadow-md shadow-rose-950 transition cursor-pointer disabled:opacity-50"
          title="Load NCRB Women Safety Priority Syndicate: Operation Rakshak"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{loading ? 'Loading...' : 'Op Rakshak'}</span>
        </button>

        {/* Load Operation Chakra-Net */}
        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
          title="Load Operation Chakra-Net dataset"
        >
          <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
          <span>Chakra-Net</span>
        </button>

        {/* Load Intercept fun.csv */}
        <button
          onClick={onLoadFun}
          disabled={loading}
          className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
          title="Load intercepted surveillance data: Krish, Manish & Afnan (fun.csv)"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>fun.csv</span>
        </button>

        {/* Multi-Source Data Hub (7 Police Data Sources) */}
        <button
          onClick={onOpenIngestHub}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-200 text-xs transition cursor-pointer"
          title="Open Multi-Source Intelligence Ingestion Hub (7 Sources)"
        >
          <FolderDown className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Data Hub</span>
        </button>

        {/* Network Connection Pathfinder */}
        <button
          onClick={onOpenPathfinder}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs transition cursor-pointer"
          title="Network Connection Pathfinder (Shortest Multi-Hop Path)"
        >
          <Route className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Pathfinder</span>
        </button>

        {/* Syndicate Hierarchy Tree */}
        <button
          onClick={onOpenHierarchy}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs transition cursor-pointer"
          title="Syndicate Command Hierarchy Matrix"
        >
          <Crown className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Hierarchy</span>
        </button>

        {/* AI Link Prediction */}
        <button
          onClick={onOpenHiddenLinks}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs transition cursor-pointer"
          title="AI Heuristic Link Prediction (Adamic-Adar / Jaccard)"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Hidden Links</span>
        </button>

        {/* Instant Forensic Dossier */}
        <button
          onClick={onOpenDossier}
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 text-xs transition cursor-pointer"
          title="Generate instant Section 63 BSA 2023 forensic dossier"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
          <span>Dossier</span>
        </button>

        {/* BSA Certificate */}
        <button
          onClick={onOpenBSA}
          className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer"
          title="Court-Admissible BSA 2023 Certificate"
        >
          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>BSA</span>
        </button>

        {/* Investigator Copilot AI Toggle */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
            isCopilotOpen
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400'
              : 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
          }`}
          title="Toggle Natural Language Investigator Copilot"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Copilot</span>
        </button>

        {/* Clear Knowledge Graph */}
        <button
          onClick={onClear}
          className="p-1.5 rounded bg-slate-800/80 hover:bg-red-950/60 hover:text-red-400 text-slate-400 border border-slate-700 transition cursor-pointer"
          title="Clear Knowledge Graph"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Authenticated Officer Session & Admin Console */}
        {currentSession && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {/* Officer Badge Pill */}
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-950 border border-cyan-500/40 text-xs">
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
                <UserCheck className="w-3 h-3" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[11px] font-bold text-white truncate max-w-[120px]">{currentSession.full_name}</div>
                <div className="text-[9px] font-mono text-cyan-400">{currentSession.badge_number}</div>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono hidden md:inline">
                {currentSession.clearance_level.replace(/_/g, ' ').slice(0, 10)}
              </span>
            </div>

            {/* Admin Console Trigger */}
            {(currentSession.role === 'SUPER_ADMIN' || currentSession.role === 'AGENCY_SUPERVISOR') && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center space-x-1 px-2 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs transition cursor-pointer"
                title="National Security Administration Console & Kill-Switch"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Admin</span>
              </button>
            )}

            {/* Manual Workstation Lock Button */}
            {onLockWorkstation && (
              <button
                onClick={onLockWorkstation}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-amber-950/80 hover:text-amber-300 text-slate-400 border border-slate-700 hover:border-amber-600 transition cursor-pointer"
                title="Lock Terminal Immediately (Zero-Trust Inactivity Protocol)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700 hover:border-rose-600 transition cursor-pointer"
                title="Secure Sovereign Logout & Re-lock Workstation"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
