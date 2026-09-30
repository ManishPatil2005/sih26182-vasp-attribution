import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Fingerprint, 
  Clock, 
  ShieldAlert,
  Sparkles,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Smartphone,
  X
} from 'lucide-react';
import { loginOfficer, verifyMfa, fetchDemoCredentials } from '../services/authApi';
import type { OfficerSession, DemoPersona } from '../types/auth';

interface AuthGateProps {
  onAuthenticated: (session: OfficerSession) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserMeta, setMfaUserMeta] = useState<{
    badge_number?: string;
    full_name?: string;
    rank?: string;
    agency_code?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoPersonas, setDemoPersonas] = useState<DemoPersona[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Fetch demo credentials for 1-click evaluation
  const loadDemos = async () => {
    try {
      const personas = await fetchDemoCredentials();
      setDemoPersonas(personas);
    } catch (err) {
      console.error('Failed to load demo credentials', err);
    }
  };

  // Sync TOTP 30-second epoch countdown & refresh demo codes
  useEffect(() => {
    loadDemos();
    const updateTimer = () => {
      const epochSec = Math.floor(Date.now() / 1000);
      const remaining = 30 - (epochSec % 30);
      setSecondsRemaining(remaining);
      if (remaining === 30) {
        loadDemos();
      }
    };
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle stage 1 or direct login
  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeNumber.trim() || !password.trim()) {
      setError('Officer Badge ID and Password are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await loginOfficer(badgeNumber, password);
      if (res.status === 'MFA_REQUIRED') {
        setMfaRequired(true);
        setMfaUserMeta({
          badge_number: res.badge_number,
          full_name: res.full_name,
          rank: res.rank,
          agency_code: res.agency_code
        });
        const matched = demoPersonas.find(p => p.badge_number === (res.badge_number || badgeNumber).trim().toUpperCase());
        if (matched?.current_totp) {
          setMfaCode(matched.current_totp);
        }
      } else if (res.status === 'AUTHENTICATED' && res.session) {
        onAuthenticated(res.session);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle stage 2 MFA verification
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit TOTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifyMfa(badgeNumber, password, mfaCode);
      if (res.session) {
        onAuthenticated(res.session);
      }
    } catch (err: any) {
      setError(err.message || '2FA TOTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-Fill Demo Persona
  const handleQuickFill = async (persona: DemoPersona) => {
    setBadgeNumber(persona.badge_number);
    setPassword(persona.password);
    setMfaCode(persona.current_totp);
    setError(null);

    if (!persona.is_active) {
      setError(`Notice: ${persona.full_name} is marked SUSPENDED. Attempting login will demonstrate zero-trust blocking.`);
      return;
    }

    // Auto-advance to stage 1 + stage 2 verification for seamless evaluation
    setLoading(true);
    try {
      const res = await loginOfficer(persona.badge_number, persona.password, persona.current_totp);
      if (res.session) {
        onAuthenticated(res.session);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-y-auto">
      {/* Top Sovereignty Banner */}
      <div className="w-full bg-slate-900/90 border-b border-cyan-900/50 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            MINISTRY OF HOME AFFAIRS (MHA) • INDIAN CYBER CRIME COORDINATION CENTRE (I4C) • SIH26182 COMPLIANT
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-cyan-400/80">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>ZERO-TRUST IDENTITY GATEWAY v4.0 • SAHYOG-VASP AI</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 my-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-950/40 backdrop-blur-xl p-8 relative overflow-hidden">
          {/* Subtle Security Holographic Glow Accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950 mb-3">
              <Shield className="w-9 h-9" />
            </div>
            <h1 className="text-xl font-bold tracking-wide text-white">SAHYOG-VASP AI</h1>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">Automated Blockchain VASP Attribution Portal</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Restricted workstation for authorized I4C, FIU-IND, and State Cyber Crime investigating officers.
            </p>
          </div>

          {/* Security Alert / Error Notice */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-start space-x-2.5 text-xs text-rose-200 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Stage 1: Credentials Form */}
          {!mfaRequired ? (
            <form onSubmit={handlePrimarySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Officer Badge ID / Credentials
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="e.g. I4C-DIR-001 or I4C-CRYPTO-782"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick tip box */}
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                💡 <strong>1-Click Quick Login:</strong> Click any of the 4 official officer cards at the bottom of the screen to auto-fill credentials and live 2FA code instantly!
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-cyan-950 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to 2FA Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Stage 2: 6-Digit TOTP Authenticator Form */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs">
                <div className="text-cyan-300 font-bold">{mfaUserMeta.full_name}</div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {mfaUserMeta.rank} • {mfaUserMeta.badge_number}
                </div>
              </div>

              {/* Active Officer Persona Live Token Display */}
              {(() => {
                const targetBadge = (mfaUserMeta.badge_number || badgeNumber).trim().toUpperCase();
                const matched = demoPersonas.find(p => p.badge_number === targetBadge);
                if (!matched) return null;
                return (
                  <div className="p-3 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/40">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-300 font-mono font-bold">YOUR LIVE 2FA TOKEN:</div>
                        <div className="text-xl font-mono font-black text-emerald-400 tracking-[0.25em]">
                          {matched.current_totp}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition cursor-pointer flex items-center space-x-1 border border-slate-700 hover:border-cyan-500/50"
                        title="Scan with Google Authenticator on your phone"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Mobile QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfaCode(matched.current_totp)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition cursor-pointer shadow flex items-center space-x-1"
                      >
                        <span>Auto-Fill Code</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
                    6-Digit Authenticator Code (TOTP)
                  </label>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-amber-400">
                    <Clock className="w-3 h-3" />
                    <span>{secondsRemaining}s</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-cyan-500/50 rounded-lg text-center tracking-[0.4em] text-lg font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    autoFocus
                    required
                  />
                </div>

                {/* Visual TOTP Countdown Bar */}
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  ℹ️ <strong>Where is this code?</strong> This system uses a <strong>Time-Based Authenticator Token (RFC 6238)</strong> (like Google Authenticator) — no SMS is sent. Your live token is shown in green above!
                </p>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaCode(''); }}
                  className="w-1/3 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-2/3 py-2 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify & Enter System</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Notice Warning */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start space-x-2 text-[10px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
            <p>
              Under Section 94 BNSS 2023, Section 69 IT Act, and Section 63 BSA 2023, unauthorized login attempts are recorded with remote IP and notarized to the national audit chain.
            </p>
          </div>
        </div>
      </div>

      {/* Quick-Fill Demonstration Bar for Evaluators & Judges */}
      <div className="w-full bg-slate-900 border-t border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                Evaluation Personas (1-Click Quick Verification)
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                Live RFC 6238 TOTP Synced ({secondsRemaining}s)
              </span>
            </div>
            <button
              onClick={loadDemos}
              className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              title="Refresh TOTP Tokens"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Tokens</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {demoPersonas.map((persona) => {
              const isRogue = !persona.is_active;
              return (
                <button
                  key={persona.badge_number}
                  onClick={() => handleQuickFill(persona)}
                  className={`text-left p-2.5 rounded-xl border transition cursor-pointer relative overflow-hidden group ${
                    isRogue
                      ? 'bg-rose-950/20 border-rose-900/60 hover:bg-rose-950/40 hover:border-rose-500/50'
                      : persona.role === 'SUPER_ADMIN'
                      ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/40 hover:border-amber-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-300">
                      {persona.badge_number}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isRogue 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : persona.role === 'SUPER_ADMIN'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {persona.role === 'SUPER_ADMIN' ? 'APEX ADMIN' : isRogue ? 'SUSPENDED' : 'OFFICER'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{persona.full_name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{persona.description}</div>
                  
                  {/* Live TOTP Code Pill */}
                  <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                    <span className="text-[9px] text-slate-400 font-mono">TOTP:</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60">
                      {persona.current_totp}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Authenticator QR Code Setup Modal */}
      {showQrModal && (() => {
        const targetBadge = (mfaUserMeta.badge_number || badgeNumber).trim().toUpperCase();
        const matched = demoPersonas.find(p => p.badge_number === targetBadge) || demoPersonas[0];
        if (!matched) return null;
        const otpauthUri = `otpauth://totp/SAHYOG-VASP-AI:${matched.badge_number}?secret=${matched.totp_secret}&issuer=I4C-MHA`;
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Google Authenticator Sync</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan with Google Authenticator or Microsoft Authenticator app on your smartphone.
              </p>

              {/* QR Code Matrix */}
              <div className="my-4 bg-white p-3 rounded-xl inline-block shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpauthUri)}`}
                  alt="2FA QR Code"
                  className="w-40 h-40"
                />
              </div>

              {/* Base32 Key */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left">
                <div className="text-[10px] text-slate-400 font-mono">OFFICER BASE32 SECRET:</div>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                    {matched.totp_secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(matched.totp_secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="mt-4 w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium rounded-lg transition cursor-pointer"
              >
                Close & Enter 6-Digit Code
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
