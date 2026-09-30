"""
Unit & Integration Tests for SIH26182 VASP Attribution & MHA Sahyog Integration
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import BlockchainNetwork, LaunderingTypology
from app.engines.vasp_attribution_engine import vasp_engine

client = TestClient(app)


def test_vasp_registry():
    """Verify Master VASP registry contains compliant exchanges with FIU-IND IDs."""
    clusters_res = client.get("/api/v1/vasp/clusters")
    assert clusters_res.status_code == 200
    vasps = clusters_res.json()
    assert len(vasps) >= 6

    vasp_names = [v["name"] for v in vasps]
    assert any("Binance" in name for name in vasp_names)
    assert any("WazirX" in name for name in vasp_names)
    assert any("CoinDCX" in name for name in vasp_names)

    # Verify single lookup
    single_res = client.get("/api/v1/vasp/clusters/VASP-BINANCE")
    assert single_res.status_code == 200
    binance = single_res.json()
    assert binance["sahyog_registered_id"] == "SAHYOG-VASP-IND-001"
    assert "case-assistance@binance.com" in binance["compliance_email"]


def test_attribute_tron_wallet():
    """Verify Tron TRC-20 multi-hop attribution to nearest VASP deposit address."""
    wallet = "TTsY1v6BpxvU9jP1k2L4wE8rT992p"
    res = client.post("/api/v1/vasp/attribute", json={
        "wallet_address": wallet,
        "network": "TRON",
        "officer_id": "INSP_I4C_DELHI"
    })
    assert res.status_code == 200
    data = res.json()

    assert data["query_wallet"] == wallet
    assert data["blockchain"] == "TRON"
    assert data["nearest_vasp"]["name"] == "Binance Exchange & P2P"
    assert data["hop_distance"] == 2
    assert data["attribution_confidence_percent"] >= 95.0
    assert data["token_symbol"] == "USDT-TRC20"
    assert len(data["path_steps"]) == 3
    assert data["path_steps"][1]["step_type"] == "VASP_DEPOSIT_SWEEP"
    assert data["merkle_evidence_hash"] is not None
    assert data["freeze_action_recommended"] is True


def test_attribute_ethereum_wallet():
    """Verify Ethereum ERC-20 direct deposit attribution to CoinDCX."""
    wallet = "0x71C83e20B13b0F2843A166f2C8f152d80d2d3489"
    res = client.post("/api/v1/vasp/attribute", json={
        "wallet_address": wallet,
        "network": "ETHEREUM",
        "officer_id": "INSP_I4C_PUNE"
    })
    assert res.status_code == 200
    data = res.json()

    assert data["query_wallet"] == wallet
    assert data["blockchain"] == "ETHEREUM"
    assert "CoinDCX" in data["nearest_vasp"]["name"]
    assert data["hop_distance"] == 1
    assert data["attribution_confidence_percent"] >= 98.0
    assert data["deposit_address"].startswith("0x")


def test_attribute_bitcoin_wallet():
    """Verify Bitcoin UTXO attribution to WazirX."""
    wallet = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
    res = client.post("/api/v1/vasp/attribute", json={
        "wallet_address": wallet,
        "network": "BITCOIN",
        "officer_id": "INSP_I4C_MUMBAI"
    })
    assert res.status_code == 200
    data = res.json()

    assert data["blockchain"] == "BITCOIN"
    assert "WazirX" in data["nearest_vasp"]["name"]
    assert data["token_symbol"] == "BTC"


def test_generate_sahyog_freeze_requisition():
    """Verify statutory Section 94 BNSS asset freezing notice generation."""
    case_id = "SAHYOG-I4C-2026-8812"
    wallet = "TTsY1v6BpxvU9jP1k2L4wE8rT992p"

    res = client.post("/api/v1/sahyog/generate-freeze-notice", json={
        "case_id": case_id,
        "wallet_address": wallet,
        "officer_id": "INSP_R_K_SHARMA_I4C"
    })
    assert res.status_code == 200
    data = res.json()

    assert data["case_id"] == case_id
    assert "Binance" in data["target_vasp_name"]
    assert "Section 94 BNSS" in data["notice_text"]
    assert "Section 63 BSA" in data["notice_text"]
    assert data["merkle_audit_proof"] is not None
    assert data["status"] == "DISPATCHED_TO_SAHYOG_PORTAL"


def test_sahyog_case_creation_and_listing():
    """Verify case ingestion and automated suspect wallet attribution."""
    cases_res = client.get("/api/v1/sahyog/cases")
    assert cases_res.status_code == 200
    initial_cases = cases_res.json()
    assert len(initial_cases) >= 2

    # Ingest new case
    new_case_payload = {
        "fir_number": "FIR No. 412/2026 Cyber Crime PS Hyderabad",
        "police_station": "Cyber Crime Police Station, Cyberabad",
        "investigating_officer": "Inspector K. S. Reddy (Badge: TS-CYBER-301)",
        "victim_name": "Naveen Chander",
        "crime_category": "DIGITAL_ARREST",
        "victim_loss_inr": 6500000.0,
        "suspect_wallets": ["TTsY1v6BpxvU9jP1k2L4wE8rT992p"],
        "assigned_agency": "Telangana State Cyber Security Bureau (TGCSB)",
        "network": "TRON"
    }
    create_res = client.post("/api/v1/sahyog/cases", json=new_case_payload)
    assert create_res.status_code == 200
    created_case = create_res.json()
    assert created_case["victim_name"] == "Naveen Chander"
    assert created_case["status"] == "ATTRIBUTED"
    assert len(created_case["attributions"]) >= 1


def test_supported_chains_and_metrics_endpoints():
    """Verify supported chain benchmark status and executive KPI metrics."""
    chains_res = client.get("/api/v1/vasp/supported-chains")
    assert chains_res.status_code == 200
    chains = chains_res.json()
    assert len(chains) == 6
    chain_names = [c["network"] for c in chains]
    assert "TRON" in chain_names
    assert "ETHEREUM" in chain_names
    assert "BITCOIN" in chain_names

    metrics_res = client.get("/api/v1/sahyog/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["overall_attribution_accuracy_pct"] >= 95.0
    assert metrics["turnaround_reduction_pct"] > 99.0
    assert metrics["total_crypto_assets_frozen_inr"] > 10000000.0


def test_crypto_graph_endpoint():
    """Verify dedicated multi-chain crypto graph returns suspect, mule, and VASP nodes."""
    res = client.get("/api/v1/vasp/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 8
    assert len(data["edges"]) >= 6

    node_types = [n["type"] for n in data["nodes"]]
    assert "CRYPTO_WALLET" in node_types
    assert "VASP_EXCHANGE" in node_types
    assert "MULE_WALLET" in node_types
