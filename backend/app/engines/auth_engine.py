import time
import hmac
import hashlib
import struct
import base64
import json
import secrets
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime, timezone
from app.core.config import settings
from app.storage.audit_ledger import audit_ledger


class OfficerUser(BaseModel):
    user_id: str
    badge_number: str
    full_name: str
    rank: str
    agency_code: str
    clearance_level: str
    role: str  # SUPER_ADMIN | AGENCY_SUPERVISOR | INVESTIGATING_OFFICER | ANALYST
    is_active: bool = True
    is_mfa_enabled: bool = True
    totp_secret: str
    salt: str
    password_hash: str
    last_login_at: Optional[str] = None
    last_login_ip: Optional[str] = None
    failed_attempts: int = 0
    locked_until: Optional[float] = None


class AuthSession(BaseModel):
    session_id: str
    badge_number: str
    full_name: str
    rank: str
    agency_code: str
    clearance_level: str
    role: str
    token: str
    expires_at: float
    created_at: str


class AuthAuditLog(BaseModel):
    id: str
    timestamp: str
    event_type: str
    badge_number: str
    ip_address: str
    status: str  # SUCCESS | FAILED | BLOCKED
    details: str
    sha256_hash: str


class AuthEngine:
    """
    Sovereign Law Enforcement Zero-Trust Authentication Engine.
    Implements:
    - NIST PBKDF2-HMAC-SHA256 salted password hashing
    - RFC 6238 TOTP 6-digit Time-Based One-Time Password verification
    - Sovereign HS256 JWT generation and tamper-evident signature validation
    - Brute-force rate limiting and badge lockout protection
    - Multi-agency compartmentalization & Section 63 BSA 2023 tamper audit integration
    """

    PBKDF2_ITERATIONS = 100_000
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION_SECONDS = 900  # 15 minutes
    TOKEN_VALIDITY_SECONDS = 28800  # 8 hours for production officers
    DEMO_TOKEN_VALIDITY_SECONDS = 1800  # 30 minutes short-lived session for public demo evaluation

    def __init__(self):
        self.users: Dict[str, OfficerUser] = {}
        self.active_sessions: Dict[str, AuthSession] = {}
        self.revoked_tokens: set = set()
        self.security_audit_logs: List[AuthAuditLog] = []
        self._seed_default_officers()

    def _hash_password(self, password: str, salt: str) -> str:
        """Derives a NIST PBKDF2-HMAC-SHA256 password hash."""
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            self.PBKDF2_ITERATIONS
        )
        return derived.hex()

    def _generate_salt(self) -> str:
        return secrets.token_hex(16)

    def _generate_totp_secret(self) -> str:
        """Generates standard Base32 encoded 160-bit TOTP secret."""
        random_bytes = secrets.token_bytes(20)
        return base64.b32encode(random_bytes).decode("utf-8").replace("=", "")

    def generate_current_totp(self, totp_secret: str, interval: int = 30, digits: int = 6) -> str:
        """
        Calculates RFC 6238 TOTP code for the current 30-second epoch.
        Used for evaluation quick-fills and server-side verification.
        """
        # Pad secret to base32 boundary if needed
        padding = (8 - len(totp_secret) % 8) % 8
        secret_padded = totp_secret + ("=" * padding)
        key = base64.b32decode(secret_padded, casefold=True)

        counter = int(time.time() // interval)
        msg = struct.pack(">Q", counter)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        offset = digest[-1] & 0x0F
        code = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** digits)
        return str(code).zfill(digits)

    def verify_totp(self, totp_secret: str, code: str, interval: int = 30, window: int = 1) -> bool:
        """
        Verifies RFC 6238 TOTP code with clock-drift window (+/- 1 interval = 30s tolerance).
        """
        if not code or len(code) != 6 or not code.isdigit():
            return False

        padding = (8 - len(totp_secret) % 8) % 8
        secret_padded = totp_secret + ("=" * padding)
        try:
            key = base64.b32decode(secret_padded, casefold=True)
        except Exception:
            return False

        current_counter = int(time.time() // interval)
        for offset_val in range(-window, window + 1):
            counter = current_counter + offset_val
            msg = struct.pack(">Q", counter)
            digest = hmac.new(key, msg, hashlib.sha1).digest()
            offset = digest[-1] & 0x0F
            expected_code = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** 6)
            if str(expected_code).zfill(6) == code.strip():
                return True
        return False

    def create_jwt_token(self, user: OfficerUser) -> str:
        """
        Generates a Sovereign JWT (HS256) signed with settings.SECRET_KEY.
        Payload includes officer badge, agency, role, and clearance.
        """
        now = time.time()
        exp = now + self.TOKEN_VALIDITY_SECONDS
        
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": user.badge_number,
            "uid": user.user_id,
            "name": user.full_name,
            "rank": user.rank,
            "agency": user.agency_code,
            "clearance": user.clearance_level,
            "role": user.role,
            "iat": int(now),
            "exp": int(exp),
            "iss": "SAHYOG-VASP-SOVEREIGN-AUTH",
            "jti": secrets.token_hex(12)
        }

        encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        message = f"{encoded_header}.{encoded_payload}".encode()
        
        signature = hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).digest()
        encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
        
        return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validates Sovereign JWT signature, expiration, and revocation status.
        """
        if not token or token in self.revoked_tokens:
            return None

        parts = token.split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_sig = parts
        message = f"{encoded_header}.{encoded_payload}".encode()
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).digest()
        
        # Add padding back to base64url string
        pad_len = (4 - len(encoded_sig) % 4) % 4
        try:
            provided_sig = base64.urlsafe_b64decode(encoded_sig + ("=" * pad_len))
        except Exception:
            return None

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        pad_payload = (4 - len(encoded_payload) % 4) % 4
        try:
            payload = json.loads(base64.urlsafe_b64decode(encoded_payload + ("=" * pad_payload)).decode())
        except Exception:
            return None

        if payload.get("exp", 0) < time.time():
            return None

        # Check if user is still active in registry
        badge = payload.get("sub")
        user = self.get_user_by_badge(badge)
        if not user or not user.is_active:
            return None

        return payload

    def _seed_default_officers(self):
        """Pre-provisions official law enforcement officers and test personas for SIH26182."""
        seed_data = [
            {
                "user_id": "usr-i4c-001",
                "badge_number": "I4C-DIR-001",
                "full_name": "Dr. Sarim Moin",
                "rank": "Apex National Cybercrime Director (I4C)",
                "agency_code": "MHA_APEX_COMMAND",
                "clearance_level": "TOP_SECRET_APEX",
                "role": "SUPER_ADMIN",
                "password": "ApexSecure2025!",
                "totp_secret": "JBSWY3DPEHPK3PXP",  # Standard test base32 seed
                "is_active": True
            },
            {
                "user_id": "usr-i4c-782",
                "badge_number": "I4C-CRYPTO-782",
                "full_name": "Insp. V. S. Chauhan",
                "rank": "Lead Blockchain Forensics & VASP Attribution IO",
                "agency_code": "I4C_BLOCKCHAIN_OPS",
                "clearance_level": "RESTRICTED_I4C_CRYPTO_OPS",
                "role": "INVESTIGATING_OFFICER",
                "password": "I4cCryptoInvestigator#1",
                "totp_secret": "KRSXG5CTMVRXEZLU",
                "is_active": True
            },
            {
                "user_id": "usr-fiu-441",
                "badge_number": "FIU-IND-441",
                "full_name": "ADG Alok Verma",
                "rank": "Director (VDA Compliance & Anti-Money Laundering)",
                "agency_code": "FIU_IND_COMPLIANCE",
                "clearance_level": "CONFIDENTIAL_FINANCIAL_INTEL",
                "role": "AGENCY_SUPERVISOR",
                "password": "FiuIndVdaNotice$99",
                "totp_secret": "MZXW633PN5XW6MZX",
                "is_active": True
            },
            {
                "user_id": "usr-state-109",
                "badge_number": "MH-CYBER-109",
                "full_name": "SI Manish Patil",
                "rank": "Sub-Inspector (1930 Cyber Fraud Taskforce)",
                "agency_code": "STATE_POLICE_IO",
                "clearance_level": "OPERATIONAL_FIELD_CLEARANCE",
                "role": "INVESTIGATING_OFFICER",
                "password": "StatePoliceIO*24",
                "totp_secret": "NBSWY3DPEHPK3PXR",
                "is_active": True
            },
            {
                "user_id": "usr-suspended-007",
                "badge_number": "SUSPENDED-IO-007",
                "full_name": "Former IO Vikram Rao",
                "rank": "Ex-Inspector (Suspended / De-authorized)",
                "agency_code": "STATE_POLICE_IO",
                "clearance_level": "OPERATIONAL_FIELD_CLEARANCE",
                "role": "INVESTIGATING_OFFICER",
                "password": "HackedPassword123!",
                "totp_secret": "OBSWY3DPEHPK3PXS",
                "is_active": False  # Suspended to demonstrate zero-trust defense
            },
            {
                "user_id": "usr-demo-investigator",
                "badge_number": "DEMO-INVESTIGATOR",
                "full_name": "Demo Forensic Investigator",
                "rank": "Guest Evaluator (SIH Sandbox)",
                "agency_code": "SIH_DEMO_SANDBOX",
                "clearance_level": "RESTRICTED_DEMO_SANDBOX",
                "role": "DEMO_INVESTIGATOR",
                "password": secrets.token_hex(32),
                "totp_secret": "JBSWY3DPEHPK3PXP",
                "is_active": True
            },
            # Backward-compatibility legacy aliases for test suites
            {
                "user_id": "usr-legacy-mha-001",
                "badge_number": "MHA-DIR-001",
                "full_name": "Dr. Sarim Moin",
                "rank": "Apex National Cybercrime Director (I4C)",
                "agency_code": "MHA_APEX_COMMAND",
                "clearance_level": "TOP_SECRET_APEX",
                "role": "SUPER_ADMIN",
                "password": "ApexSecure2025!",
                "totp_secret": "JBSWY3DPEHPK3PXP",
                "is_active": True
            },
            {
                "user_id": "usr-legacy-ncrb-782",
                "badge_number": "NCRB-WS-782",
                "full_name": "Insp. V. S. Chauhan",
                "rank": "Lead Blockchain Forensics & VASP Attribution IO",
                "agency_code": "I4C_BLOCKCHAIN_OPS",
                "clearance_level": "RESTRICTED_I4C_CRYPTO_OPS",
                "role": "INVESTIGATING_OFFICER",
                "password": "NcrbInvestigator#1",
                "totp_secret": "KRSXG5CTMVRXEZLU",
                "is_active": True
            },
            {
                "user_id": "usr-legacy-nia-044",
                "badge_number": "NIA-TF-044",
                "full_name": "ADG Alok Verma",
                "rank": "Director (VDA Compliance & AML)",
                "agency_code": "FIU_IND_COMPLIANCE",
                "clearance_level": "CONFIDENTIAL_FINANCIAL_INTEL",
                "role": "AGENCY_SUPERVISOR",
                "password": "NiaTerrorFin$99",
                "totp_secret": "MZXW633PN5XW6MZX",
                "is_active": True
            },
            {
                "user_id": "usr-legacy-rogue-007",
                "badge_number": "ROGUE-IO-007",
                "full_name": "Former IO Vikram Rao",
                "rank": "Ex-Inspector (Suspended)",
                "agency_code": "STATE_POLICE_IO",
                "clearance_level": "OPERATIONAL_FIELD_CLEARANCE",
                "role": "INVESTIGATING_OFFICER",
                "password": "HackedPassword123!",
                "totp_secret": "OBSWY3DPEHPK3PXS",
                "is_active": False
            }
        ]

        for item in seed_data:
            salt = self._generate_salt()
            pwd_hash = self._hash_password(item["password"], salt)
            user = OfficerUser(
                user_id=item["user_id"],
                badge_number=item["badge_number"],
                full_name=item["full_name"],
                rank=item["rank"],
                agency_code=item["agency_code"],
                clearance_level=item["clearance_level"],
                role=item["role"],
                is_active=item["is_active"],
                is_mfa_enabled=True,
                totp_secret=item["totp_secret"],
                salt=salt,
                password_hash=pwd_hash
            )
            self.users[user.badge_number] = user

    def get_user_by_badge(self, badge_number: str) -> Optional[OfficerUser]:
        badge = badge_number.strip().upper()
        if badge in self.users:
            return self.users[badge]
        alias_map = {
            "MHA-DIR-001": "I4C-DIR-001",
            "NCRB-WS-782": "I4C-CRYPTO-782",
            "NIA-TF-044": "FIU-IND-441",
            "ROGUE-IO-007": "SUSPENDED-IO-007"
        }
        target = alias_map.get(badge)
        return self.users.get(target) if target else None

    def record_audit(self, event_type: str, badge_number: str, ip_address: str, status: str, details: str):
        """Records security audit entry and notarizes into Section 63 BSA Merkle ledger."""
        ts = datetime.now(timezone.utc).isoformat()
        raw = f"{ts}:{event_type}:{badge_number}:{ip_address}:{status}:{details}"
        sha_hash = hashlib.sha256(raw.encode()).hexdigest()

        entry = AuthAuditLog(
            id=f"audit-{secrets.token_hex(6)}",
            timestamp=ts,
            event_type=event_type,
            badge_number=badge_number,
            ip_address=ip_address,
            status=status,
            details=details,
            sha256_hash=sha_hash
        )
        self.security_audit_logs.insert(0, entry)
        if len(self.security_audit_logs) > 500:
            self.security_audit_logs.pop()

        # Notarize to Section 63 BSA 2023 tamper-evident Merkle ledger
        try:
            audit_ledger.append_audit_block(
                action=f"SECURITY_AUTH_{event_type}",
                user_id=badge_number,
                node_id="SECURITY_GATEWAY",
                reason=f"Status: {status} | IP: {ip_address} | {details}"
            )
        except Exception:
            pass

    def authenticate_credentials(self, badge_number: str, password: str, ip_address: str) -> Tuple[bool, Optional[OfficerUser], str]:
        """
        Step 1: Authenticates badge and password with lockout enforcement.
        Returns: (success: bool, user: Optional[OfficerUser], message: str)
        """
        badge = badge_number.strip().upper()
        user = self.get_user_by_badge(badge)

        if not user:
            self.record_audit("LOGIN_UNKNOWN_BADGE", badge, ip_address, "FAILED", "Attempted login with non-existent badge ID")
            return False, None, "Invalid officer credentials or unverified badge ID."

        now = time.time()
        # Check lockout
        if user.locked_until and user.locked_until > now:
            remaining = int(user.locked_until - now)
            self.record_audit("LOGIN_LOCKED_ACCOUNT", badge, ip_address, "BLOCKED", f"Account locked for {remaining} more seconds")
            return False, None, f"Account locked due to excessive failed attempts. Try again in {remaining} seconds."

        if not user.is_active:
            self.record_audit("LOGIN_SUSPENDED_ACCOUNT", badge, ip_address, "BLOCKED", "Suspended personnel attempted system ingress")
            return False, None, "Officer clearance is SUSPENDED / REVOKED. Access strictly denied under Official Secrets Act."

        # Verify password hash
        test_hash = self._hash_password(password, user.salt)
        if not hmac.compare_digest(test_hash, user.password_hash):
            user.failed_attempts += 1
            if user.failed_attempts >= self.MAX_FAILED_ATTEMPTS:
                user.locked_until = now + self.LOCKOUT_DURATION_SECONDS
                self.record_audit("ACCOUNT_LOCKED", badge, ip_address, "BLOCKED", f"Threshold reached ({user.failed_attempts} fails). Locked for 15 minutes.")
                return False, None, f"Maximum failed attempts reached. Badge locked for 15 minutes."
            self.record_audit("LOGIN_BAD_PASSWORD", badge, ip_address, "FAILED", f"Bad password. Attempt {user.failed_attempts}/{self.MAX_FAILED_ATTEMPTS}")
            return False, None, f"Invalid password. Attempt {user.failed_attempts} of {self.MAX_FAILED_ATTEMPTS} before lockout."

        # Password succeeded - reset failed attempts
        user.failed_attempts = 0
        user.locked_until = None
        return True, user, "Credentials verified. MFA challenge required."

    def verify_and_login(self, badge_number: str, password: str, mfa_code: str, ip_address: str) -> Tuple[bool, Optional[AuthSession], str]:
        """
        Complete 2FA Authentication: Validates credentials + 6-digit TOTP code.
        """
        ok, user, msg = self.authenticate_credentials(badge_number, password, ip_address)
        if not ok or not user:
            return False, None, msg

        if user.is_mfa_enabled:
            if not self.verify_totp(user.totp_secret, mfa_code):
                self.record_audit("MFA_REJECTED", user.badge_number, ip_address, "FAILED", "Invalid or expired 6-digit TOTP token")
                return False, None, "Invalid or expired 6-digit 2FA Authenticator code."

        # Issue Sovereign JWT and register session
        token = self.create_jwt_token(user)
        now_ts = datetime.now(timezone.utc).isoformat()
        session_id = f"sess-{secrets.token_hex(8)}"
        
        session = AuthSession(
            session_id=session_id,
            badge_number=user.badge_number,
            full_name=user.full_name,
            rank=user.rank,
            agency_code=user.agency_code,
            clearance_level=user.clearance_level,
            role=user.role,
            token=token,
            expires_at=time.time() + self.TOKEN_VALIDITY_SECONDS,
            created_at=now_ts
        )

        user.last_login_at = now_ts
        user.last_login_ip = ip_address
        self.active_sessions[token] = session
        
        self.record_audit("LOGIN_SUCCESS", user.badge_number, ip_address, "SUCCESS", f"2FA Verified. Sovereign JWT issued for agency: {user.agency_code}")
        return True, session, "Authentication successful."

    def create_demo_session(self, ip_address: str = "127.0.0.1") -> AuthSession:
        """
        Creates a restricted, short-lived demo investigator session for public SIH competition
        and evaluation without requiring passwords or 2FA friction.
        """
        now = time.time()
        exp = now + self.DEMO_TOKEN_VALIDITY_SECONDS
        
        demo_user = self.get_user_by_badge("DEMO-INVESTIGATOR")
        if not demo_user:
            demo_user = OfficerUser(
                user_id="usr-demo-investigator",
                badge_number="DEMO-INVESTIGATOR",
                full_name="Demo Forensic Investigator",
                rank="Guest Evaluator (SIH Sandbox)",
                agency_code="SIH_DEMO_SANDBOX",
                clearance_level="RESTRICTED_DEMO_SANDBOX",
                role="DEMO_INVESTIGATOR",
                is_active=True,
                is_mfa_enabled=False,
                totp_secret="",
                salt="",
                password_hash=""
            )
            self.users[demo_user.badge_number] = demo_user

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": demo_user.badge_number,
            "uid": demo_user.user_id,
            "name": demo_user.full_name,
            "rank": demo_user.rank,
            "agency": demo_user.agency_code,
            "clearance": demo_user.clearance_level,
            "role": "DEMO_INVESTIGATOR",
            "is_demo": True,
            "scope": [
                "dashboard:read",
                "wallet:analyze",
                "trace:read",
                "vasp:attribute",
                "graph:read",
                "report:generate",
                "sahyog:simulate"
            ],
            "iat": int(now),
            "exp": int(exp),
            "iss": "SAHYOG-VASP-DEMO-AUTH",
            "jti": secrets.token_hex(12)
        }

        encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        message = f"{encoded_header}.{encoded_payload}".encode()
        
        signature = hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).digest()
        encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
        token = f"{encoded_header}.{encoded_payload}.{encoded_sig}"

        now_ts = datetime.now(timezone.utc).isoformat()
        session_id = f"demo-sess-{secrets.token_hex(8)}"
        
        session = AuthSession(
            session_id=session_id,
            badge_number=demo_user.badge_number,
            full_name=demo_user.full_name,
            rank=demo_user.rank,
            agency_code=demo_user.agency_code,
            clearance_level=demo_user.clearance_level,
            role="DEMO_INVESTIGATOR",
            token=token,
            expires_at=exp,
            created_at=now_ts
        )

        demo_user.last_login_at = now_ts
        demo_user.last_login_ip = ip_address
        self.active_sessions[token] = session
        
        self.record_audit(
            "LOGIN_DEMO_INVESTIGATOR",
            demo_user.badge_number,
            ip_address,
            "SUCCESS",
            "Public demonstration session established with restricted DEMO_INVESTIGATOR scope."
        )
        return session

    def logout(self, token: str, ip_address: str = "127.0.0.1") -> bool:
        """Revokes an active session."""
        if token in self.active_sessions:
            sess = self.active_sessions.pop(token)
            self.revoked_tokens.add(token)
            self.record_audit("LOGOUT", sess.badge_number, ip_address, "SUCCESS", "Officer terminated active workstation session")
            return True
        return False

    def toggle_user_status(self, badge_number: str, is_active: bool, admin_badge: str, ip_address: str) -> Tuple[bool, str]:
        """Admin kill-switch: suspends or restores officer credentials."""
        user = self.get_user_by_badge(badge_number)
        if not user:
            return False, "Target officer not found."

        user.is_active = is_active
        if not is_active:
            # Invalidate all active sessions for this badge
            to_remove = [tok for tok, sess in self.active_sessions.items() if sess.badge_number == user.badge_number]
            for tok in to_remove:
                self.active_sessions.pop(tok, None)
                self.revoked_tokens.add(tok)
            self.record_audit("ADMIN_SUSPEND_USER", badge_number, ip_address, "BLOCKED", f"Suspended by Administrator: {admin_badge}")
        else:
            user.failed_attempts = 0
            user.locked_until = None
            self.record_audit("ADMIN_RESTORE_USER", badge_number, ip_address, "SUCCESS", f"Restored by Administrator: {admin_badge}")

        return True, f"Officer status updated to {'ACTIVE' if is_active else 'SUSPENDED'}."

    def provision_user(
        self,
        badge_number: str,
        full_name: str,
        rank: str,
        agency_code: str,
        clearance_level: str,
        role: str,
        initial_password: str,
        admin_badge: str,
        ip_address: str
    ) -> Tuple[bool, Optional[OfficerUser], str]:
        """Admin tool to register and provision a new law enforcement officer badge."""
        badge = badge_number.strip().upper()
        if badge in self.users:
            return False, None, f"Badge {badge} already exists in national directory."

        salt = self._generate_salt()
        pwd_hash = self._hash_password(initial_password, salt)
        totp_sec = self._generate_totp_secret()

        new_user = OfficerUser(
            user_id=f"usr-{secrets.token_hex(4)}",
            badge_number=badge,
            full_name=full_name,
            rank=rank,
            agency_code=agency_code,
            clearance_level=clearance_level,
            role=role,
            is_active=True,
            is_mfa_enabled=True,
            totp_secret=totp_sec,
            salt=salt,
            password_hash=pwd_hash
        )
        self.users[badge] = new_user
        self.record_audit("ADMIN_PROVISION_OFFICER", badge, ip_address, "SUCCESS", f"New personnel provisioned by: {admin_badge}")
        return True, new_user, "Officer successfully provisioned with active MFA secret."

    def list_all_officers(self) -> List[Dict[str, Any]]:
        """Returns non-sensitive officer personnel directory for admin dashboard."""
        results = []
        for user in self.users.values():
            results.append({
                "user_id": user.user_id,
                "badge_number": user.badge_number,
                "full_name": user.full_name,
                "rank": user.rank,
                "agency_code": user.agency_code,
                "clearance_level": user.clearance_level,
                "role": user.role,
                "is_active": user.is_active,
                "is_mfa_enabled": user.is_mfa_enabled,
                "last_login_at": user.last_login_at,
                "last_login_ip": user.last_login_ip,
                "failed_attempts": user.failed_attempts,
                "is_locked": bool(user.locked_until and user.locked_until > time.time())
            })
        return results

    def get_demo_credentials_guide(self) -> List[Dict[str, Any]]:
        """
        Returns official demo credentials and live synchronized TOTP codes
        to enable 1-click evaluation by competition judges.
        """
        profiles = [
            ("I4C-DIR-001", "ApexSecure2025!", "I4C Apex National Director (Super Admin)"),
            ("I4C-CRYPTO-782", "I4cCryptoInvestigator#1", "I4C Blockchain Forensics & VASP Attribution IO"),
            ("FIU-IND-441", "FiuIndVdaNotice$99", "FIU-IND VDA Compliance Liaison Director"),
            ("MH-CYBER-109", "StatePoliceIO*24", "State Cyber Crime (1930 Fraud Taskforce)"),
            ("SUSPENDED-IO-007", "HackedPassword123!", "Suspended IO (Zero-Trust Test Persona)")
        ]

        guide = []
        for badge, pwd, desc in profiles:
            user = self.get_user_by_badge(badge)
            if user:
                current_totp = self.generate_current_totp(user.totp_secret)
                guide.append({
                    "badge_number": badge,
                    "password": pwd,
                    "full_name": user.full_name,
                    "role": user.role,
                    "agency_code": user.agency_code,
                    "clearance_level": user.clearance_level,
                    "is_active": user.is_active,
                    "description": desc,
                    "current_totp": current_totp,
                    "totp_secret": user.totp_secret
                })
        return guide


# Global singleton instance
auth_engine = AuthEngine()
