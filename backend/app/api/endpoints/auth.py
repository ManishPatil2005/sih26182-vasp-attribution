from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Request, Depends, status
from pydantic import BaseModel, Field
from app.engines.auth_engine import auth_engine, OfficerUser, AuthSession, AuthAuditLog

router = APIRouter()


class LoginRequest(BaseModel):
    badge_number: str = Field(..., description="Official Law Enforcement Badge ID (e.g. MHA-DIR-001)")
    password: str = Field(..., description="Officer secure password")
    mfa_code: Optional[str] = Field(None, description="6-digit RFC 6238 TOTP Authenticator code")


class MFAVerifyRequest(BaseModel):
    badge_number: str = Field(..., description="Official Law Enforcement Badge ID")
    password: str = Field(..., description="Officer password for dual-factor confirmation")
    mfa_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP Authenticator code")


class ProvisionOfficerRequest(BaseModel):
    badge_number: str = Field(..., description="New Badge ID (e.g. MH-INSP-204)")
    full_name: str = Field(..., description="Officer full legal name")
    rank: str = Field(..., description="Rank or designation")
    agency_code: str = Field(..., description="Agency code (e.g. MHA_APEX_COMMAND, NCRB_WOMEN_SAFETY)")
    clearance_level: str = Field(..., description="Security clearance level")
    role: str = Field(..., description="SUPER_ADMIN | AGENCY_SUPERVISOR | INVESTIGATING_OFFICER | ANALYST")
    initial_password: str = Field(..., min_length=8, description="Initial temporary password")


class ToggleStatusRequest(BaseModel):
    is_active: bool = Field(..., description="Active (True) or Suspended (False)")


def get_client_ip(request: Request) -> str:
    """Extracts client IP or forward header."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def get_current_officer(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency that validates Bearer JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = auth_engine.verify_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token invalid, expired, or officer clearance has been revoked.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return payload


def require_super_admin(officer: Dict[str, Any] = Depends(get_current_officer)) -> Dict[str, Any]:
    """Enforces Super Admin privilege under Section 69 IT Act."""
    if officer.get("role") != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Operation requires SUPER_ADMIN national clearance."
        )
    return officer


def require_supervisor_or_admin(officer: Dict[str, Any] = Depends(get_current_officer)) -> Dict[str, Any]:
    """Enforces Supervisory or Super Admin privilege."""
    if officer.get("role") not in ("SUPER_ADMIN", "AGENCY_SUPERVISOR"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires supervisory or administrative clearance."
        )
    return officer


@router.post("/login", summary="Officer Login (Credentials & 2FA)")
async def login(req: LoginRequest, request: Request):
    """
    Two-stage or unified authentication endpoint.
    - If mfa_code is omitted, validates credentials and returns MFA_REQUIRED challenge.
    - If mfa_code is provided, validates credentials + 2FA TOTP code and returns sovereign JWT.
    """
    ip_addr = get_client_ip(request)

    # If MFA code provided, attempt full authentication
    if req.mfa_code:
        ok, session, msg = auth_engine.verify_and_login(
            badge_number=req.badge_number,
            password=req.password,
            mfa_code=req.mfa_code,
            ip_address=ip_addr
        )
        if not ok or not session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

        return {
            "status": "AUTHENTICATED",
            "message": "Authentication successful. Sovereign session established.",
            "session": session.model_dump()
        }

    # Otherwise validate stage 1 (Badge & Password)
    ok, user, msg = auth_engine.authenticate_credentials(
        badge_number=req.badge_number,
        password=req.password,
        ip_address=ip_addr
    )
    if not ok or not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    return {
        "status": "MFA_REQUIRED",
        "message": "Credentials verified. Please enter 6-digit TOTP code from your official authenticator.",
        "badge_number": user.badge_number,
        "full_name": user.full_name,
        "rank": user.rank,
        "agency_code": user.agency_code,
        "clearance_level": user.clearance_level
    }


@router.post("/verify-mfa", summary="Complete Step-2 MFA Verification")
async def verify_mfa(req: MFAVerifyRequest, request: Request):
    """Verifies 6-digit TOTP Authenticator code and issues Sovereign JWT."""
    ip_addr = get_client_ip(request)
    ok, session, msg = auth_engine.verify_and_login(
        badge_number=req.badge_number,
        password=req.password,
        mfa_code=req.mfa_code,
        ip_address=ip_addr
    )
    if not ok or not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    return {
        "status": "AUTHENTICATED",
        "message": "2FA TOTP code verified. Access granted.",
        "session": session.model_dump()
    }


@router.get("/me", summary="Current Officer Session & Clearance")
async def get_current_session(officer: Dict[str, Any] = Depends(get_current_officer)):
    """Validates the active session and returns officer identity and clearance."""
    user = auth_engine.get_user_by_badge(officer.get("sub", ""))
    return {
        "authenticated": True,
        "badge_number": officer.get("sub"),
        "full_name": officer.get("name"),
        "rank": officer.get("rank"),
        "agency_code": officer.get("agency"),
        "clearance_level": officer.get("clearance"),
        "role": officer.get("role"),
        "expires_at": officer.get("exp"),
        "last_login_at": user.last_login_at if user else None,
        "is_active": user.is_active if user else False
    }


@router.post("/logout", summary="Terminate Sovereign Workstation Session")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    """Terminates session and revokes JWT Bearer token."""
    ip_addr = get_client_ip(request)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        auth_engine.logout(token, ip_addr)
    return {"status": "REVOKED", "message": "Officer session successfully terminated."}


@router.get("/demo-credentials", summary="Demo Personas & Live Synchronized TOTP")
async def get_demo_credentials():
    """
    Returns verified official credentials and live 6-digit TOTP codes
    for 1-click jury evaluation during hackathons and demonstrations.
    """
    return {
        "status": "READY",
        "notice": "Official MHA Evaluation Personas with live synchronized TOTP tokens.",
        "personas": auth_engine.get_demo_credentials_guide()
    }


# =========================================================================
# Admin Command & Control Endpoints
# =========================================================================

@router.get("/admin/users", summary="Admin: List All Registered Personnel")
async def admin_list_users(officer: Dict[str, Any] = Depends(require_supervisor_or_admin)):
    """Lists law enforcement personnel directory with clearance and 2FA status."""
    return {
        "requesting_officer": officer.get("sub"),
        "total_officers": len(auth_engine.users),
        "active_sessions": len(auth_engine.active_sessions),
        "personnel": auth_engine.list_all_officers()
    }


@router.post("/admin/users", summary="Admin: Provision New Officer Badge")
async def admin_provision_user(
    req: ProvisionOfficerRequest,
    request: Request,
    officer: Dict[str, Any] = Depends(require_super_admin)
):
    """Provisions a new law enforcement officer badge and generates initial TOTP seed."""
    ip_addr = get_client_ip(request)
    ok, new_user, msg = auth_engine.provision_user(
        badge_number=req.badge_number,
        full_name=req.full_name,
        rank=req.rank,
        agency_code=req.agency_code,
        clearance_level=req.clearance_level,
        role=req.role,
        initial_password=req.initial_password,
        admin_badge=officer.get("sub", "ADMIN"),
        ip_address=ip_addr
    )
    if not ok or not new_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {
        "status": "PROVISIONED",
        "message": msg,
        "badge_number": new_user.badge_number,
        "totp_secret": new_user.totp_secret,
        "initial_totp": auth_engine.generate_current_totp(new_user.totp_secret)
    }


@router.post("/admin/users/{badge_number}/status", summary="Admin: Kill-Switch / Suspend Officer")
async def admin_toggle_status(
    badge_number: str,
    req: ToggleStatusRequest,
    request: Request,
    officer: Dict[str, Any] = Depends(require_super_admin)
):
    """Instant kill-switch: suspends or restores officer credentials and revokes tokens."""
    ip_addr = get_client_ip(request)
    ok, msg = auth_engine.toggle_user_status(
        badge_number=badge_number,
        is_active=req.is_active,
        admin_badge=officer.get("sub", "ADMIN"),
        ip_address=ip_addr
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)

    return {"status": "UPDATED", "badge_number": badge_number, "is_active": req.is_active, "message": msg}


@router.get("/admin/audit-logs", summary="Admin: Real-time Access Audit Trail")
async def admin_get_audit_logs(officer: Dict[str, Any] = Depends(require_supervisor_or_admin)):
    """Fetches real-time security access logs notarized under Section 63 BSA 2023."""
    return {
        "status": "VERIFIED",
        "statute": "Section 63, Bharatiya Sakshya Adhiniyam, 2023",
        "total_events": len(auth_engine.security_audit_logs),
        "audit_logs": [entry.model_dump() for entry in auth_engine.security_audit_logs[:100]]
    }
