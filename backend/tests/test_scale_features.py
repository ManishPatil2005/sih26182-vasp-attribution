import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.engines.scale_engine import (
    BloomFilter,
    scale_engine,
    StreamCallEvent,
    LawfulWarrant
)
from app.storage.graph_engine import graph_engine


@pytest.fixture
def client():
    return TestClient(app)


def test_bloom_filter_accuracy_and_size():
    """Validates Bloom filter accuracy, double hashing, and memory efficiency."""
    bf = BloomFilter(expected_elements=10000, false_positive_rate=0.001)
    
    test_numbers = [f"+9198110{i:05d}" for i in range(100)]
    for num in test_numbers:
        bf.add(num)

    # Verify all inserted elements are found (0% false negatives)
    for num in test_numbers:
        assert bf.contains(num) is True

    # Verify random uninserted elements are generally negative
    false_positives = 0
    test_negatives = [f"+9170999{i:05d}" for i in range(1000)]
    for neg in test_negatives:
        if bf.contains(neg):
            false_positives += 1

    # False positive rate must be well under 1%
    fp_rate = false_positives / len(test_negatives)
    assert fp_rate < 0.01


def test_10_lakh_criminal_watchlist_lookup():
    """Validates sub-microsecond matching across 10 Lakh (1M) criminal records."""
    # 1. Known priority target
    is_suspect, meta = scale_engine.is_in_10_lakh_watchlist("+919811029481")
    assert is_suspect is True
    assert meta is not None
    assert "Afnan" in meta["name"]
    assert meta["warrant_id"] == "MHA/SEC69/2026/0091"

    # 2. Synthetic CCTNS 10 Lakh population range member
    cctns_target = "+919800045231"
    is_cctns, cctns_meta = scale_engine.is_in_10_lakh_watchlist(cctns_target)
    assert is_cctns is True
    assert cctns_meta is not None
    assert "CCTNS Bad Character" in cctns_meta["name"]

    # 3. Ordinary civilian subscriber (Must be discarded / negative)
    civilian_num = "+917500112233"
    is_civ, civ_meta = scale_engine.is_in_10_lakh_watchlist(civilian_num)
    assert is_civ is False
    assert civ_meta is None


def test_lawful_warrant_authorization():
    """Validates statutory warrant issuance under Sec 69 IT Act / Sec 91 BNSS."""
    warrant = scale_engine.authorize_warrant(
        issuing_authority="Union Home Secretary, MHA",
        agency="CBI Special Crime Branch",
        target_identifier="+919899123456",
        target_name="Tariq Butt (Mule Syndicate)",
        case_reference="RC-09/2026/CBI/SCB",
        lawful_justification="Authorized interception on cross-border mule syndicate recruitment.",
        officer_id="IO_SP_CBI_007",
        validity_days=60
    )

    assert warrant.warrant_id.startswith("MHA/SEC69/2026/")
    assert warrant.status == "ACTIVE"
    assert warrant.tamper_block_hash is not None
    assert warrant.warrant_id in scale_engine.warrants

    # Identifier must now be in watchlist
    is_suspect, meta = scale_engine.is_in_10_lakh_watchlist("+919899123456")
    assert is_suspect is True
    assert meta["name"] == "Tariq Butt (Mule Syndicate)"


def test_telecom_stream_event_evaluation_and_graph_binding():
    """Validates privacy-preserving filtering and suspect hit graph binding."""
    # Civilian call: caller and receiver are civilians
    civ_event = StreamCallEvent(
        call_id="CALL-CIV-001",
        caller="+917400112233",
        receiver="+917500445566",
        timestamp="2026-09-23T12:00:00Z",
        cell_tower_id="TOWER-CIV-99",
        telecom_circle="DL-Delhi",
        duration_sec=35
    )
    hit_civ = scale_engine.process_telecom_stream_event(civ_event, graph_engine=graph_engine)
    assert hit_civ is None  # Dropped at wire speed!

    # Suspect call: Afnan calls Vikram
    suspect_event = StreamCallEvent(
        call_id="CALL-SUSPECT-001",
        caller="+919811029481",
        receiver="+919820011223",
        timestamp="2026-09-23T12:05:00Z",
        cell_tower_id="TOWER-DL-PAHARGANJ-01",
        telecom_circle="DL-Delhi",
        duration_sec=120
    )
    hit_suspect = scale_engine.process_telecom_stream_event(suspect_event, graph_engine=graph_engine, auto_bind_graph=True)
    assert hit_suspect is not None
    assert "Afnan" in hit_suspect.caller_name
    assert "Vikram" in hit_suspect.receiver_name
    assert hit_suspect.warrant_id is not None

    # Verify graph edge was created
    caller_node = f"PHONE_{hit_suspect.caller_phone.replace('+', '').replace(' ', '')}"
    receiver_node = f"PHONE_{hit_suspect.receiver_phone.replace('+', '').replace(' ', '')}"
    assert caller_node in graph_engine.node_store
    assert receiver_node in graph_engine.node_store


def test_api_scale_metrics(client):
    """Tests GET /api/v1/interception/scale-metrics endpoint."""
    response = client.get("/api/v1/interception/scale-metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_population_monitored"] == 2_000_000_000
    assert data["criminal_watchlist_size"] == 1_000_000
    assert data["ram_footprint_mb"] == 38.4
    assert data["unfiltered_ram_estimate_tb"] == 128.0
    assert data["memory_savings_percent"] > 99.0
    assert "DPDP Act" in data["statutory_compliance"]


def test_api_warrants_listing_and_creation(client):
    """Tests warrant listing and creation endpoints."""
    # List warrants
    resp_list = client.get("/api/v1/interception/warrants")
    assert resp_list.status_code == 200
    warrants = resp_list.json()
    assert len(warrants) >= 3

    # Issue new warrant
    payload = {
        "issuing_authority": "Principal Secretary (Home), Govt of NCT of Delhi",
        "agency": "Delhi Police Special Cell",
        "target_identifier": "+919811998877",
        "target_name": "Deepak alias Boxer",
        "case_reference": "FIR-102/2026 Special Cell",
        "lawful_justification": "Surveillance on illegal arms procurement syndicate.",
        "officer_id": "ACP_DELHI_SPL_01",
        "validity_days": 90
    }
    resp_create = client.post("/api/v1/interception/authorize-warrant", json=payload)
    assert resp_create.status_code == 200
    created = resp_create.json()
    assert created["warrant_id"].startswith("MHA/SEC69/2026/")
    assert created["target_name"] == "Deepak alias Boxer"
    assert created["tamper_block_hash"] is not None


def test_api_simulate_burst(client):
    """Tests POST /api/v1/interception/simulate-burst endpoint."""
    resp = client.post("/api/v1/interception/simulate-burst", json={"batch_size": 2000, "auto_bind_graph": True})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["batch_size"] == 2000
    assert "throughput_eps" in data["results"]
    assert data["results"]["throughput_eps"] > 0
    assert data["results"]["suspect_hits_found"] > 0
    assert len(data["recent_hits_sample"]) > 0


def test_api_active_hits(client):
    """Tests GET /api/v1/interception/active-hits endpoint."""
    resp = client.get("/api/v1/interception/active-hits?limit=10")
    assert resp.status_code == 200
    hits = resp.json()
    assert isinstance(hits, list)
