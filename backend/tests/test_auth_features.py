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

