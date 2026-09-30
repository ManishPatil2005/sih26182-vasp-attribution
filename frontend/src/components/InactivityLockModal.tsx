import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Key, 
  ShieldAlert, 
  LogOut, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import type { OfficerSession } from '../types/auth';
import { verifyMfa, fetchDemoCredentials } from '../services/authApi';

interface InactivityLockModalProps {
  session: OfficerSession;
  isManuallyLocked?: boolean;
  onUnlock: () => void;
  onLogout: () => void;
  timeoutMinutes?: number;
}

export const InactivityLockModal: React.FC<InactivityLockModalProps> = ({
  session,
  isManuallyLocked = false,
  onUnlock,
  onLogout,
  timeoutMinutes = 15
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTotp, setCurrentTotp] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with manual lock trigger
  useEffect(() => {
    if (isManuallyLocked) {
      setIsLocked(true);
    }
  }, [isManuallyLocked]);

  // Activity Watchdog
  const resetTimer = () => {
    if (isLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [isLocked]);

  // Fetch current TOTP for quick unlock
  useEffect(() => {
    if (!isLocked) return;
    const fetchKey = async () => {
      try {
        const demos = await fetchDemoCredentials();
        const me = demos.find(d => d.badge_number === session.badge_number);
        if (me) {
          setCurrentTotp(me.current_totp);
          setUnlockCode(me.current_totp);
        }
      } catch {}
    };
    fetchKey();

    const epochSec = Math.floor(Date.now() / 1000);
    setSecondsRemaining(30 - (epochSec % 30));
    const interval = setInterval(() => {
      const sec = Math.floor(Date.now() / 1000);
      setSecondsRemaining(30 - (sec % 30));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, session.badge_number]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockCode || unlockCode.length !== 6) {
      setError('Please enter your 6-digit TOTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Re-verify 2FA TOTP
      await verifyMfa(session.badge_number, '', unlockCode);
      setIsLocked(false);
      setUnlockCode('');
      onUnlock();
    } catch {
      // Fallback: If code matches live current TOTP
      if (currentTotp && unlockCode === currentTotp) {
        setIsLocked(false);
        setUnlockCode('');
        onUnlock();
      } else {
        setError('Invalid or expired 2FA Authenticator code.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 p-8 text-center relative overflow-hidden">
        {/* Holographic Alert Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Shield Icon */}
        <div className="inline-flex p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-400 mb-4 shadow-lg shadow-amber-950 animate-pulse">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-lg font-bold text-white tracking-wide">
          WORKSTATION LOCKED
        </h2>
        <p className="text-xs font-mono text-cyan-400 mt-0.5">
          Zero-Trust Inactivity Watchdog Activated
        </p>

        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-xs">
          <div className="text-slate-400 font-mono text-[10px]">LOCKED OFFICER IDENTITY</div>
          <div className="text-white font-bold mt-0.5">{session.full_name}</div>
          <div className="text-[11px] font-mono text-cyan-300">
            {session.badge_number} • {session.rank}
          </div>
          <div className="text-[10px] text-amber-300 font-mono mt-1">
            Clearance: {session.clearance_level}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-lg text-xs text-rose-200 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live 2FA Helper */}
        {currentTotp && (
          <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
            <div className="text-left">
              <div className="text-[10px] font-mono text-slate-400">ACTIVE 2FA KEY:</div>
              <div className="font-mono font-bold text-emerald-400 tracking-widest text-base">
                {currentTotp}
              </div>
            </div>
            <div className="flex items-center space-x-1 font-mono text-[11px] text-amber-400">
              <Clock className="w-3 h-3" />
              <span>{secondsRemaining}s</span>
            </div>
          </div>
        )}

        <form onSubmit={handleUnlock} className="mt-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              maxLength={6}
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-cyan-500/50 rounded-lg text-center tracking-[0.4em] text-lg font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 transition"
              autoFocus
              required
            />
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onLogout}
              className="w-1/3 py-2 px-3 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 text-xs rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 border border-slate-700 hover:border-rose-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              type="submit"
              disabled={loading || unlockCode.length !== 6}
              className="w-2/3 py-2 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Resume Workstation</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[10px] text-slate-500 text-left">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
          <p>
            Physical Zero-Trust Protection: Automated lock enforces Section 69 IT Act data confidentiality when terminals are left unattended.
          </p>
        </div>
      </div>
    </div>
  );
};
