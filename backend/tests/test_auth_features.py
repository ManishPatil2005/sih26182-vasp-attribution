import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.engines.auth_engine import auth_engine

client = TestClient(app)


def test_pbkdf2_password_hashing():
    """Verify PBKDF2-HMAC-SHA256 password hashing with unique salt."""
    salt1 = auth_engine._generate_salt()
    salt2 = auth_engine._generate_salt()
    assert salt1 != salt2

    pwd = "TestSecretPassword123!"
    hash1 = auth_engine._hash_password(pwd, salt1)
    hash2 = auth_engine._hash_password(pwd, salt2)
    # Different salts must produce different hashes
    assert hash1 != hash2
    # Same salt must produce identical hash
    assert hash1 == auth_engine._hash_password(pwd, salt1)


def test_totp_generation_and_verification():
    """Verify RFC 6238 TOTP 6-digit algorithm."""
    secret = auth_engine._generate_totp_secret()
    assert len(secret) >= 16

    code = auth_engine.generate_current_totp(secret)
    assert len(code) == 6
    assert code.isdigit()

    # Valid code verifies successfully
    assert auth_engine.verify_totp(secret, code) is True

    # Bad code fails
    assert auth_engine.verify_totp(secret, "000000" if code != "000000" else "999999") is False

    # Invalid length or non-digits fail
    assert auth_engine.verify_totp(secret, "123") is False
    assert auth_engine.verify_totp(secret, "abcdef") is False


def test_login_stage_1_mfa_challenge():
    """Test stage-1 credential verification returning MFA_REQUIRED."""
    resp = client.post("/api/v1/auth/login", json={
        "badge_number": "MHA-DIR-001",
        "password": "ApexSecure2025!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "MFA_REQUIRED"
    assert data["badge_number"] == "MHA-DIR-001"
    assert data["agency_code"] == "MHA_APEX_COMMAND"


def test_login_invalid_password_and_lockout():
    """Test bad credentials rejection and brute-force lockout."""
    # Try invalid password for NCRB IO
    for attempt in range(1, 5):
        resp = client.post("/api/v1/auth/login", json={
            "badge_number": "NCRB-WS-782",
            "password": f"WrongPassword_{attempt}"
        })
        assert resp.status_code == 401
        assert "Invalid password" in resp.json()["detail"]

    # 5th attempt triggers lockout
    resp5 = client.post("/api/v1/auth/login", json={
        "badge_number": "NCRB-WS-782",
        "password": "WrongPassword_5"
    })
    assert resp5.status_code == 401
    assert "locked" in resp5.json()["detail"].lower()

    # Reset lockout for clean subsequent tests
    user = auth_engine.get_user_by_badge("NCRB-WS-782")
    user.failed_attempts = 0
    user.locked_until = None


def test_suspended_rogue_officer_blocked():
    """Test that suspended personnel cannot log in (zero-trust defense)."""
    resp = client.post("/api/v1/auth/login", json={
        "badge_number": "ROGUE-IO-007",
        "password": "HackedPassword123!"
    })
    assert resp.status_code == 401
    assert "SUSPENDED" in resp.json()["detail"]


def test_full_login_with_mfa():
    """Test complete login flow using valid 2FA TOTP code."""
    user = auth_engine.get_user_by_badge("MHA-DIR-001")
    current_code = auth_engine.generate_current_totp(user.totp_secret)

    resp = client.post("/api/v1/auth/login", json={
        "badge_number": "MHA-DIR-001",
        "password": "ApexSecure2025!",
        "mfa_code": current_code
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "AUTHENTICATED"
    session = data["session"]
    assert session["badge_number"] == "MHA-DIR-001"
    assert session["role"] == "SUPER_ADMIN"
    assert session["clearance_level"] == "TOP_SECRET_APEX"
    assert "token" in session
    token = session["token"]

    # Test /me endpoint using token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["authenticated"] is True
    assert me_data["badge_number"] == "MHA-DIR-001"


def test_demo_credentials_endpoint():
    """Verify the /demo-credentials endpoint returns live synchronized TOTP tokens."""
    resp = client.get("/api/v1/auth/demo-credentials")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "READY"
    personas = data["personas"]
    assert len(personas) >= 4
    for p in personas:
        assert "badge_number" in p
        assert "current_totp" in p
        assert len(p["current_totp"]) == 6


def test_admin_user_management_and_killswitch():
    """Test Super Admin user listing and emergency suspension kill-switch."""
    # Login as Super Admin
    user = auth_engine.get_user_by_badge("MHA-DIR-001")
    code = auth_engine.generate_current_totp(user.totp_secret)
    login_resp = client.post("/api/v1/auth/login", json={
        "badge_number": "MHA-DIR-001",
        "password": "ApexSecure2025!",
        "mfa_code": code
    })
    token = login_resp.json()["session"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List all personnel
    list_resp = client.get("/api/v1/auth/admin/users", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total_officers"] >= 4

    # Provision a new test officer
    prov_resp = client.post("/api/v1/auth/admin/users", headers=headers, json={
        "badge_number": "TEST-IO-999",
        "full_name": "Test Officer Kumar",
        "rank": "Special Sub-Inspector",
        "agency_code": "NCRB_WOMEN_SAFETY",
        "clearance_level": "RESTRICTED_NCRB_OPS",
        "role": "INVESTIGATING_OFFICER",
        "initial_password": "NewSecretPassword2025#"
    })
    assert prov_resp.status_code == 200
    assert prov_resp.json()["status"] == "PROVISIONED"

    # Suspend the newly created officer
    suspend_resp = client.post(
        "/api/v1/auth/admin/users/TEST-IO-999/status",
        headers=headers,
        json={"is_active": False}
    )
    assert suspend_resp.status_code == 200
    assert suspend_resp.json()["is_active"] is False

    # Verify suspended officer cannot log in
    test_user = auth_engine.get_user_by_badge("TEST-IO-999")
    tcode = auth_engine.generate_current_totp(test_user.totp_secret)
    bad_login = client.post("/api/v1/auth/login", json={
        "badge_number": "TEST-IO-999",
        "password": "NewSecretPassword2025#",
        "mfa_code": tcode
    })
    assert bad_login.status_code == 401
    assert "SUSPENDED" in bad_login.json()["detail"]


def test_admin_audit_logs_endpoint():
    """Verify security audit trail retrieval."""
    user = auth_engine.get_user_by_badge("MHA-DIR-001")
    code = auth_engine.generate_current_totp(user.totp_secret)
    login_resp = client.post("/api/v1/auth/login", json={
        "badge_number": "MHA-DIR-001",
        "password": "ApexSecure2025!",
        "mfa_code": code
    })
    token = login_resp.json()["session"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    audit_resp = client.get("/api/v1/auth/admin/audit-logs", headers=headers)
    assert audit_resp.status_code == 200
    data = audit_resp.json()
    assert data["status"] == "VERIFIED"
    assert "Section 63" in data["statute"]
    assert len(data["audit_logs"]) > 0


def test_agency_rbac_graph_sanitization():
    """Verify that State Police IO gets redacted covert assets while Apex sees all."""
    # First load Chakra-Net which has undercover informant COVERT_INFORMANT_07
    client.post("/api/v1/graph/load-demo")

    # Query with State Police IO clearance
    resp_field = client.get("/api/v1/graph/data?agency_code=STATE_POLICE_IO")
    assert resp_field.status_code == 200
    data_field = resp_field.json()
    labels = [n["label"] for n in data_field["nodes"]]
    # Should contain redacted label
    assert any("[REDACTED_COVERT_ASSET_DELTA]" in lbl for lbl in labels)

    # Query with MHA Apex Command clearance
    resp_apex = client.get("/api/v1/graph/data?agency_code=MHA_APEX_COMMAND")
    assert resp_apex.status_code == 200
    data_apex = resp_apex.json()
    labels_apex = [n["label"] for n in data_apex["nodes"]]
    assert not any("[REDACTED_COVERT_ASSET_DELTA]" in lbl for lbl in labels_apex)


def test_authenticated_action_audit_attribution():
    """Verify that actions performed with a JWT Bearer token are attributed to the officer's badge."""
    user = auth_engine.get_user_by_badge("NCRB-WS-782")
    code = auth_engine.generate_current_totp(user.totp_secret)
    login_resp = client.post("/api/v1/auth/login", json={
        "badge_number": "NCRB-WS-782",
        "password": "NcrbInvestigator#1",
        "mfa_code": code
    })
    token = login_resp.json()["session"]["token"]

    load_resp = client.post(
        "/api/v1/graph/load-demo",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert load_resp.status_code == 200

    # Verify audit ledger last block contains NCRB-WS-782
    from app.storage.audit_ledger import audit_ledger
    last_block = audit_ledger.chain[-1]
    assert "NCRB-WS-782" in last_block["officer_id"]


def test_sih26182_i4c_fiu_personas_login():
    """Verify SIH26182 I4C and FIU-IND official personas login flow."""
    # Test I4C Crypto Investigator login with TOTP
    user_i4c = auth_engine.get_user_by_badge("I4C-CRYPTO-782")
    assert user_i4c is not None
    assert "VASP Attribution" in user_i4c.rank
    assert user_i4c.agency_code == "I4C_BLOCKCHAIN_OPS"
    code = auth_engine.generate_current_totp(user_i4c.totp_secret)

    resp = client.post("/api/v1/auth/login", json={
        "badge_number": "I4C-CRYPTO-782",
        "password": "I4cCryptoInvestigator#1",
        "mfa_code": code
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "AUTHENTICATED"
    assert data["session"]["badge_number"] == "I4C-CRYPTO-782"
    assert data["session"]["agency_code"] == "I4C_BLOCKCHAIN_OPS"

    # Test Suspended IO zero-trust rejection
    bad_resp = client.post("/api/v1/auth/login", json={
        "badge_number": "SUSPENDED-IO-007",
        "password": "HackedPassword123!"
    })
    assert bad_resp.status_code == 401
    assert "SUSPENDED" in bad_resp.json()["detail"]


def test_one_click_demo_login():
    """Verify frictionless one-click demo login creates a short-lived DEMO_INVESTIGATOR session."""
    resp = client.post("/api/v1/auth/demo-login")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "AUTHENTICATED"
    assert "Demo investigator session established" in data["message"]
    
    session = data["session"]
    assert session["badge_number"] == "DEMO-INVESTIGATOR"
    assert session["role"] == "DEMO_INVESTIGATOR"
    assert session["agency_code"] == "SIH_DEMO_SANDBOX"
    # Ensure short-lived session (<= 1800s / 30 mins from now)
    import time
    assert 0 < (session["expires_at"] - time.time()) <= 1805


def test_demo_investigator_permissions_and_admin_denial():
    """Verify DEMO_INVESTIGATOR has access to core VASP attribution but is denied admin routes."""
    # Obtain demo session token
    demo_resp = client.post("/api/v1/auth/demo-login")
    token = demo_resp.json()["session"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. ALLOWED: Current session identity (/me)
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "DEMO_INVESTIGATOR"

    # 2. ALLOWED: Core VASP Attribution endpoints
    vasp_resp = client.post(
        "/api/v1/vasp/attribute",
        json={"wallet_address": "TTsY1v6BpxvU9jP1k2L4wE8rT992p", "network": "TRON"},
        headers=headers
    )
    assert vasp_resp.status_code == 200
    assert vasp_resp.json()["nearest_vasp"]["name"] == "Binance Exchange & P2P"

    # 3. ALLOWED: Subgraph & Graph Visualization endpoints
    graph_resp = client.get("/api/v1/vasp/graph", headers=headers)
    assert graph_resp.status_code == 200
    assert len(graph_resp.json()["nodes"]) > 0

    # 4. ALLOWED: Typology Deep Scan & Mixer Taint
    typo_resp = client.get("/api/v1/vasp/typology/TTsY1v6BpxvU9jP1k2L4wE8rT992p?network=TRON", headers=headers)
    assert typo_resp.status_code == 200

    # 5. DENIED (403 Forbidden): Admin User Management
    admin_users_resp = client.get("/api/v1/auth/admin/users", headers=headers)
    assert admin_users_resp.status_code == 403
    assert "Access denied" in admin_users_resp.json()["detail"]

    # 6. DENIED (403 Forbidden): Admin Audit Logs
    admin_audit_resp = client.get("/api/v1/auth/admin/audit-logs", headers=headers)
    assert admin_audit_resp.status_code == 403
    assert "Access denied" in admin_audit_resp.json()["detail"]

    # 7. DENIED (403 Forbidden): User Status Killswitch
    toggle_resp = client.post("/api/v1/auth/admin/users/I4C-CRYPTO-782/status", json={"is_active": False}, headers=headers)
    assert toggle_resp.status_code == 403


def test_demo_session_logout_and_revocation():
    """Verify logging out revokes the demo session token."""
    demo_resp = client.post("/api/v1/auth/demo-login")
    token = demo_resp.json()["session"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify active
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200

    # Terminate session
    logout_resp = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["status"] == "REVOKED"

    # Subsequent access with revoked token is denied (401)
    subsequent_resp = client.get("/api/v1/auth/me", headers=headers)
    assert subsequent_resp.status_code == 401


def test_tampered_and_unauthorized_token_access():
    """Verify modified, unauthorized, and malformed tokens fail zero-trust checks."""
    # 1. No token
    assert client.get("/api/v1/auth/me").status_code == 401

    # 2. Malformed token
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer malformed.jwt.token"}).status_code == 401

    # 3. Tampered payload
    demo_resp = client.post("/api/v1/auth/demo-login")
    valid_token = demo_resp.json()["session"]["token"]
    parts = valid_token.split(".")
    # Tamper payload
    tampered_token = f"{parts[0]}.eyJzdWIiOiAiSEFDS0VEIn0.{parts[2]}"
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"}).status_code == 401



