import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Shield, 
  UserCheck, 
  UserX, 
  Plus, 
  RefreshCw, 
  AlertOctagon, 
  Key, 
  CheckCircle
} from 'lucide-react';
import { 
  fetchAdminOfficers, 
  toggleOfficerStatus, 
  provisionOfficer, 
  fetchAdminAuditLogs 
} from '../services/authApi';
import type { AdminOfficer, SecurityAuditLog, OfficerSession } from '../types/auth';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: OfficerSession;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentSession
}) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'audit' | 'provision'>('personnel');
  const [officers, setOfficers] = useState<AdminOfficer[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Officer Form State
  const [newBadge, setNewBadge] = useState('');
  const [newName, setNewName] = useState('');
  const [newRank, setNewRank] = useState('Sub-Inspector');
  const [newAgency, setNewAgency] = useState('NCRB_WOMEN_SAFETY');
  const [newClearance, setNewClearance] = useState('RESTRICTED_NCRB_OPS');
  const [newRole, setNewRole] = useState('INVESTIGATING_OFFICER');
  const [newPassword, setNewPassword] = useState('');

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const [officersData, auditData] = await Promise.all([
        fetchAdminOfficers(currentSession.token),
        fetchAdminAuditLogs(currentSession.token)
      ]);
      setOfficers(officersData.personnel || []);
      setAuditLogs(auditData.audit_logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, currentSession.token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (badge_number: string, currentStatus: boolean) => {
    setActionLoading(badge_number);
    setError(null);
    setSuccessMsg(null);
    try {
      await toggleOfficerStatus(currentSession.token, badge_number, !currentStatus);
      setSuccessMsg(`Badge ${badge_number} status updated to ${!currentStatus ? 'ACTIVE' : 'SUSPENDED'}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProvisionOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadge || !newName || !newPassword) {
      setError('Badge ID, Full Name, and Password are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await provisionOfficer(currentSession.token, {
        badge_number: newBadge,
        full_name: newName,
        rank: newRank,
        agency_code: newAgency,
        clearance_level: newClearance,
        role: newRole,
        initial_password: newPassword
      });

      setSuccessMsg(`Officer ${res.badge_number} successfully provisioned with active MFA secret!`);
      setNewBadge('');
      setNewName('');
      setNewPassword('');
      setActiveTab('personnel');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to provision officer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  National Security Administration Console
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  MHA APEX COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zero-Trust Personnel Registry, Emergency Kill-Switch & Section 63 BSA 2023 Access Chain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Security Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400 font-mono text-[10px]">REGISTERED OFFICERS</div>
            <div className="text-lg font-bold text-white mt-0.5">{officers.length} Badges</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400 font-mono text-[10px]">2FA ENFORCEMENT</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">100% TOTP RFC-6238</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400 font-mono text-[10px]">AUTHENTICATION CHAIN</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">Sec 63 BSA 2023</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400 font-mono text-[10px]">SESSION CALLER</div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-1 truncate">
              {currentSession.badge_number} ({currentSession.role})
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('personnel')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer ${
                activeTab === 'personnel'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Personnel Directory & Kill-Switch
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Security Access Ledger ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('provision')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer ${
                activeTab === 'provision'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              + Provision New Officer
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab 1: Personnel Directory */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'personnel' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                      <th className="py-2.5 px-3">BADGE / OFFICER</th>
                      <th className="py-2.5 px-3">AGENCY & RANK</th>
                      <th className="py-2.5 px-3">CLEARANCE</th>
                      <th className="py-2.5 px-3">2FA STATUS</th>
                      <th className="py-2.5 px-3">LAST LOGIN / IP</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {officers.map((officer) => {
                      const isCurrentUser = officer.badge_number === currentSession.badge_number;
                      return (
                        <tr key={officer.badge_number} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-cyan-300">
                              {officer.badge_number}
                            </div>
                            <div className="text-white font-medium">{officer.full_name}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-300">{officer.rank}</div>
                            <div className="text-[10px] font-mono text-slate-400">{officer.agency_code}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-amber-300">
                            {officer.clearance_level}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] border border-emerald-900 font-mono">
                              <Key className="w-2.5 h-2.5" />
                              <span>TOTP ACTIVE</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                            <div>{officer.last_login_at ? new Date(officer.last_login_at).toLocaleTimeString() : 'Never'}</div>
                            <div>{officer.last_login_ip || '—'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                officer.is_active
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                              }`}
                            >
                              {officer.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isCurrentUser ? (
                              <span className="text-[10px] text-slate-500 font-mono">(Your Session)</span>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(officer.badge_number, officer.is_active)}
                                disabled={actionLoading === officer.badge_number}
                                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center space-x-1 ml-auto ${
                                  officer.is_active
                                    ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 text-rose-200'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200'
                                }`}
                              >
                                {officer.is_active ? (
                                  <>
                                    <UserX className="w-3 h-3" />
                                    <span>Suspend Kill-Switch</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3" />
                                    <span>Restore Clearance</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Security Access Ledger */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between font-mono">
                <span>CHAIN STATUTE: Section 63 Bharatiya Sakshya Adhiniyam, 2023</span>
                <span>CRYPTOGRAPHIC VERIFICATION: SHA-256 NOTARIZED</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                      <th className="py-2.5 px-3">TIMESTAMP</th>
                      <th className="py-2.5 px-3">EVENT TYPE</th>
                      <th className="py-2.5 px-3">BADGE / IP</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3">DETAILS</th>
                      <th className="py-2.5 px-3">SHA-256 PROOF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition">
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] font-bold text-cyan-300">
                          {log.event_type}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-300">
                          <div>{log.badge_number}</div>
                          <div className="text-slate-500">{log.ip_address}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : log.status === 'BLOCKED'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 text-xs max-w-xs truncate">
                          {log.details}
                        </td>
                        <td className="py-2 px-3 font-mono text-[9px] text-slate-500 truncate max-w-[120px]" title={log.sha256_hash}>
                          {log.sha256_hash.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Provision Officer */}
          {activeTab === 'provision' && (
            <div className="max-w-xl mx-auto py-2">
              <form onSubmit={handleProvisionOfficer} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Badge ID *
                    </label>
                    <input
                      type="text"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      placeholder="e.g. MH-INSP-204"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Insp. Amit Deshmukh"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Rank / Designation
                    </label>
                    <input
                      type="text"
                      value={newRank}
                      onChange={(e) => setNewRank(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Agency Code
                    </label>
                    <select
                      value={newAgency}
                      onChange={(e) => setNewAgency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-300 font-mono"
                    >
                      <option value="MHA_APEX_COMMAND">MHA Apex Command</option>
                      <option value="NCRB_WOMEN_SAFETY">NCRB Women Safety Unit</option>
                      <option value="NIA_TERROR_FINANCE">NIA Financial Intel Cell</option>
                      <option value="STATE_POLICE_IO">State Police IO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Clearance Level
                    </label>
                    <select
                      value={newClearance}
                      onChange={(e) => setNewClearance(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-300 font-mono"
                    >
                      <option value="TOP_SECRET_APEX">TOP_SECRET_APEX</option>
                      <option value="RESTRICTED_NCRB_OPS">RESTRICTED_NCRB_OPS</option>
                      <option value="CONFIDENTIAL_FINANCIAL_INTEL">CONFIDENTIAL_FINANCIAL_INTEL</option>
                      <option value="OPERATIONAL_FIELD_CLEARANCE">OPERATIONAL_FIELD_CLEARANCE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    >
                      <option value="INVESTIGATING_OFFICER">INVESTIGATING_OFFICER</option>
                      <option value="AGENCY_SUPERVISOR">AGENCY_SUPERVISOR</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Temporary Initial Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    A unique 160-bit RFC 6238 TOTP seed will be generated automatically upon provisioning.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-cyan-950 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Provision Badge & Issue 2FA Key</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
