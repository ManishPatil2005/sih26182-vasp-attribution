import React from 'react';
import { 
  Lock, 
  Zap, 
  RotateCcw, 
  LogOut, 
  Building2, 
  FileText, 
  FolderGit2,
  KeyRound
} from 'lucide-react';
import type { OfficerSession } from '../types/auth';

interface TopNavProps {
  onOpenVASPAttribution: () => void;
  onOpenVASPRegistry: () => void;
  onOpenSahyogCases: () => void;
  onOpenFreezeNotices: () => void;
  onOpenAudit: () => void;
  onOpenBSA: () => void;
  onRefreshGraph: () => void;
  isVerified: boolean;
  totalBlocks: number;
  loading: boolean;
  currentSession?: OfficerSession | null;
  onLogout?: () => void;
  onLockWorkstation?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenVASPAttribution,
  onOpenVASPRegistry,
  onOpenSahyogCases,
  onOpenFreezeNotices,
  onOpenAudit,
  onOpenBSA,
  onRefreshGraph,
  isVerified,
  totalBlocks,
  loading,
  currentSession,
  onLogout,
  onLockWorkstation
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & MHA SIH26182 Tag */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white tracking-wider text-sm">SAHYOG-VASP AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono font-black tracking-widest">
              SIH26182
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold">
              MHA / I4C
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Automated Crypto Wallet Attribution to VASPs &amp; Sec 94 BNSS Freezing Notices
          </p>
        </div>
      </div>

      {/* Multi-Chain Intelligence Ticker */}
      <div className="hidden xl:flex items-center space-x-2 bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-lg text-xs font-mono">
        <div className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400 text-[11px]">TRON TRC-20:</span>
          <span className="text-emerald-400 font-bold text-[11px]">14ms</span>
        </div>
        <div className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-slate-400 text-[11px]">ETH ERC-20:</span>
          <span className="text-cyan-300 font-bold text-[11px]">18ms</span>
        </div>
        <div className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-slate-400 text-[11px]">BTC UTXO:</span>
          <span className="text-amber-300 font-bold text-[11px]">22ms</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">FIU-IND GATEWAY:</span>
          <span className="text-indigo-400 font-bold text-[11px]">ACTIVE</span>
        </div>
      </div>

      {/* Flagship SIH26182 Action Controls */}
      <div className="flex items-center space-x-2">
        {/* Trace Wallet Button */}
        <button
          onClick={onOpenVASPAttribution}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition cursor-pointer border border-cyan-400/40"
          title="Automated Attribution of Unknown Wallets to Nearest VASPs"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-cyan-200" />
          <span>Trace VASP</span>
        </button>

        {/* 1930 SAHYOG Cases */}
        <button
          onClick={onOpenSahyogCases}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs transition cursor-pointer"
          title="MHA 1930 Cybercrime Portal Ingested Cases"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">1930 Cases</span>
        </button>

        {/* FIU-IND Compliant VASP Registry */}
        <button
          onClick={onOpenVASPRegistry}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-200 text-xs transition cursor-pointer"
          title="FIU-IND Compliant Exchange Directory (Binance, CoinDCX, WazirX, KuCoin)"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">VASP Registry</span>
        </button>

        {/* Sec 94 BNSS Freezing Notices Ledger */}
        <button
          onClick={onOpenFreezeNotices}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs transition cursor-pointer"
          title="Statutory Asset Freezing Notices Dispatched under Section 94 BNSS 2023"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Sec 94 BNSS</span>
        </button>

        {/* Refresh Graph */}
        <button
          onClick={onRefreshGraph}
          disabled={loading}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          title="Reload On-Chain Forensic Graph"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Section 63 BSA Tamper-Proof Audit Chain */}
        <button
          onClick={onOpenAudit}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs hover:bg-slate-800 transition cursor-pointer"
          title="Section 63 BSA 2023 Cryptographic Merkle Hash Chain"
        >
          <Lock className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {totalBlocks} Blocks
          </span>
        </button>

        {/* Section 63 BSA Certificate */}
        <button
          onClick={onOpenBSA}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs hover:bg-slate-800 transition cursor-pointer"
          title="Section 63 BSA 2023 Tamper-Evident Court Evidence Certificate"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden 2xl:inline text-slate-300 text-[11px]">BSA Cert</span>
        </button>

        {/* Officer Profile & Sign out */}
        {currentSession && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-200 block truncate max-w-[120px]">
                {currentSession.full_name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block">
                {currentSession.badge_number}
              </span>
            </div>
            {onLockWorkstation && (
              <button
                onClick={onLockWorkstation}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition cursor-pointer"
                title="Lock Terminal"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Secure Sign Out"
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
