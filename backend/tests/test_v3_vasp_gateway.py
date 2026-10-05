"""
Tests for SIH26182 V3 Advanced Blockchain Intelligence Gateway,
Laundering Typology Heuristics, BSA 2023 Sec 63 Court Certificates,
and Real-Time 1930 Cyber Helpline Feed.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.engines.blockchain_intel_gateway import blockchain_gateway, BlockchainNetwork
from app.engines.sahyog_stream_engine import sahyog_stream_engine
from app.engines.bsa_evidence_engine import bsa_engine

client = TestClient(app)


def test_blockchain_gateway_detection():
    assert blockchain_gateway.detect_network_from_address("TTsY1v6BpxvU9jP1k2L4wE8rT992p") == BlockchainNetwork.TRON
    assert blockchain_gateway.detect_network_from_address("0x71C83e20B13b0F2843A166f2C8f152d80d2d3489") == BlockchainNetwork.ETHEREUM
    assert blockchain_gateway.detect_network_from_address("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq") == BlockchainNetwork.BITCOIN
    assert blockchain_gateway.detect_network_from_address("Sol982x1PqMz981La92048102948190284719284710") == BlockchainNetwork.SOLANA


def test_typology_deep_scan():
    wallet = "TTsY1v6BpxvU9jP1k2L4wE8rT992p"
    res = client.get(f"/api/v1/vasp/typology/{wallet}?network=TRON")
    assert res.status_code == 200
    data = res.json()
    assert data["target_wallet"] == wallet
    assert data["network"] == "TRON"
    assert "composite_risk_score" in data
    assert "peeling_analysis" in data
    assert "mixer_exposure" in data
    assert len(data["mitigation_actions"]) >= 2
    assert "statutory_urgency" in data and len(data["statutory_urgency"]) > 0


def test_mixer_taint_detection():
    tornado_wallet = "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b"
    scan = blockchain_gateway.analyze_typology_and_taint(tornado_wallet, BlockchainNetwork.ETHEREUM)
    assert scan.mixer_exposure.is_exposed is True
    assert scan.mixer_exposure.sanctioned_entity is True
    assert "Tornado Cash" in scan.mixer_exposure.mixer_name
    assert scan.mixer_exposure.taint_percentage >= 90.0


def test_live_1930_feed_endpoint():
    res = client.get("/api/v1/vasp/live-1930-feed?count=4")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 4
    for alert in data:
        assert "1930-ALERT-" in alert["alert_id"]
        assert alert["victim_reported_loss_inr"] > 0
        assert alert["confidence_score"] >= 80.0
        assert alert["attributed_vasp"] != ""


def test_gateway_status_endpoint():
    res = client.get("/api/v1/vasp/gateway-status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert "TRONSCAN_API" in data["providers"]
    assert "ETHERSCAN_API" in data["providers"]
    assert data["engine_version"] == "v3.0.0-sih26182-enterprise"


def test_bsa_certificate_endpoint():
    # First generate requisition
    wallet = "TTsY1v6BpxvU9jP1k2L4wE8rT992p"
    gen_res = client.post("/api/v1/sahyog/generate-freeze-notice", json={
        "case_id": "SAHYOG-I4C-2026-8812",
        "wallet_address": wallet,
        "officer_id": "INSP_I4C_DELHI"
    })
    assert gen_res.status_code == 200
    req_data = gen_res.json()
    req_id = req_data["requisition_id"]

    # Now fetch BSA Section 63 certificate
    cert_res = client.get(f"/api/v1/sahyog/requisitions/{req_id}/bsa-certificate")
    assert cert_res.status_code == 200
    cert = cert_res.json()
    assert "Section 63 Bharat Sakshya Adhiniyam" in cert["statutory_act"]
    assert cert["target_unhosted_wallet"] == wallet
    assert cert["merkle_evidence_root"] != ""
    assert len(cert["chain_of_custody_hashes"]) >= 2
    assert "qr_verification_payload" in cert


def test_printable_notice_endpoint():
    res = client.get("/api/v1/sahyog/requisitions/default/printable")
    assert res.status_code == 200
    data = res.json()
    assert "raw_notice_text" in data
    assert "SECTION 94 BNSS" in data["raw_notice_text"].upper()
    assert data["statutory_deadline_hours"] == 2


def test_live_query_and_provenance_tracking():
    # Test Bitcoin query and provenance
    btc_wallet = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
    success, intel, prov = blockchain_gateway.query_live_blockchain_intel(btc_wallet, BlockchainNetwork.BITCOIN)
    assert prov in ("LIVE_BLOCKCHAIN_API", "DETERMINISTIC_HEURISTIC")

    # Deep scan endpoint check for provenance metadata
    res = client.get(f"/api/v1/vasp/typology/{btc_wallet}?network=BITCOIN")
    assert res.status_code == 200
    data = res.json()
    assert "data_provenance" in data
    assert data["live_query_attempted"] is True
    assert data["data_provenance"] in ("LIVE_BLOCKCHAIN_API", "DETERMINISTIC_HEURISTIC")

