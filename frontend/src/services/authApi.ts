import { API_BASE } from './api';
import type { 
  LoginResponse, 
  OfficerSession, 
  DemoPersona, 
  AdminOfficer, 
  SecurityAuditLog 
} from '../types/auth';

export async function loginOfficer(
  badge_number: string, 
  password: string, 
  mfa_code?: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ badge_number, password, mfa_code })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
  }
  return data;
}

export async function verifyMfa(
  badge_number: string, 
  password: string, 
  mfa_code: string
): Promise<{ status: string; message: string; session: OfficerSession }> {
  const res = await fetch(`${API_BASE}/auth/verify-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ badge_number, password, mfa_code })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Invalid or expired 6-digit TOTP code.');
  }
  return data;
}

export async function fetchCurrentSession(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Session expired or invalidated.');
  }
  return res.json();
}

export async function logoutOfficer(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function fetchDemoCredentials(): Promise<DemoPersona[]> {
  const res = await fetch(`${API_BASE}/auth/demo-credentials`);
  if (!res.ok) throw new Error('Failed to load demo credentials');
  const data = await res.json();
  return data.personas || [];
}

export async function fetchAdminOfficers(token: string): Promise<{
  total_officers: number;
  active_sessions: number;
  personnel: AdminOfficer[];
}> {
  const res = await fetch(`${API_BASE}/auth/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch personnel directory');
  }
  return res.json();
}

export async function toggleOfficerStatus(
  token: string, 
  badge_number: string, 
  is_active: boolean
): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/admin/users/${badge_number}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ is_active })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update officer status');
  }
  return res.json();
}

export async function provisionOfficer(
  token: string,
  payload: {
    badge_number: string;
    full_name: string;
    rank: string;
    agency_code: string;
    clearance_level: string;
    role: string;
    initial_password: string;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to provision new officer');
  }
  return res.json();
}

export async function fetchAdminAuditLogs(token: string): Promise<{
  status: string;
  statute: string;
  total_events: number;
  audit_logs: SecurityAuditLog[];
}> {
  const res = await fetch(`${API_BASE}/auth/admin/audit-logs`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch security audit logs');
  }
  return res.json();
}
