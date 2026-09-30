export interface OfficerSession {
  session_id: string;
  badge_number: string;
  full_name: string;
  rank: string;
  agency_code: string;
  clearance_level: string;
  role: 'SUPER_ADMIN' | 'AGENCY_SUPERVISOR' | 'INVESTIGATING_OFFICER' | 'ANALYST';
  token: string;
  expires_at: number;
  created_at: string;
}

export interface DemoPersona {
  badge_number: string;
  password: string;
  full_name: string;
  role: string;
  agency_code: string;
  clearance_level: string;
  is_active: boolean;
  description: string;
  current_totp: string;
  totp_secret: string;
}

export interface AdminOfficer {
  user_id: string;
  badge_number: string;
  full_name: string;
  rank: string;
  agency_code: string;
  clearance_level: string;
  role: string;
  is_active: boolean;
  is_mfa_enabled: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  failed_attempts: number;
  is_locked: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event_type: string;
  badge_number: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  details: string;
  sha256_hash: string;
}

export interface LoginResponse {
  status: 'AUTHENTICATED' | 'MFA_REQUIRED';
  message: string;
  session?: OfficerSession;
  badge_number?: string;
  full_name?: string;
  rank?: string;
  agency_code?: string;
  clearance_level?: string;
}
