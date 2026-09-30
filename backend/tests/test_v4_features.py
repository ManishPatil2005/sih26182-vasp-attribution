import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.engines.crypto_engine import crypto_engine
from app.engines.disruption_engine import disruption_planner
from app.engines.agency_rbac import agency_rbac
from app.engines.ncrb_scenario import load_ncrb_operation_rakshak
from app.storage.graph_engine import graph_engine
from app.models.schemas import EntityType, GraphNode, GraphData


@pytest.fixture
def client():
    return TestClient(app)


def test_crypto_forensics_peeling_chains_and_linking():
    """Validates Web3 crypto peeling chain detection and knowledge graph injection."""
    load_ncrb_operation_rakshak()
    assert len(crypto_engine.flows) >= 2
    assert len(crypto_engine.off_ramps) >= 3

    # Link crypto to active graph
    res = crypto_engine.link_crypto_to_knowledge_graph(graph_engine=graph_engine, officer_id="TEST_IO")
    assert res["success"] is True
    assert res["nodes_added"] > 0
    assert res["edges_added"] > 0

    # Verify wallet nodes exist in graph
    wallet_nodes = [n for n in graph_engine.node_store.values() if n.type == EntityType.CRYPTO_WALLET]
    assert len(wallet_nodes) >= 4


def test_crypto_off_ramp_linking_to_mule_bank():
    """Validates bridging of crypto wallets to Indian bank mule accounts."""
    off_ramps = crypto_engine.off_ramps
    binance_off = next((o for o in off_ramps if "Binance" in o.exchange_name), None)
    assert binance_off is not None
    assert binance_off.bank_account_number == "ACC_HDFC_991823"
    assert "Vikram" in binance_off.account_holder
    assert binance_off.total_fiat_inr > 1_000_000


def test_syndicate_disruption_simulation():
    """Validates Syndicate Disruption Index (SDI) and graph percolation calculations."""
    load_ncrb_operation_rakshak()
    
    # Simulate arresting Afnan Khan (The Broker, SUSP-V03)
    impact = disruption_planner.simulate_interdiction(["SUSP-V03"], graph_engine=graph_engine)
    assert impact.syndicate_disruption_index > 0
    assert impact.communication_edges_severed > 0
    assert "SUSP-V03" in impact.targeted_nodes[0]
    assert len(impact.tactical_verdict) > 10

    # Simulate joint arrest of Afnan (SUSP-V03) and Tanya (SUSP-V01)
    joint_impact = disruption_planner.simulate_interdiction(["SUSP-V03", "SUSP-V01"], graph_engine=graph_engine)
    assert joint_impact.syndicate_disruption_index >= impact.syndicate_disruption_index
    assert joint_impact.communication_edges_severed >= impact.communication_edges_severed


def test_optimal_arrest_recommendations():
    """Validates recommendation ranking for maximal syndicate collapse."""
    load_ncrb_operation_rakshak()
    recs = disruption_planner.get_optimal_disruption_recommendations(graph_engine=graph_engine, top_k=3)
    assert len(recs) > 0
    assert recs[0].rank == 1
    assert recs[0].predicted_disruption_index > 0
    assert len(recs[0].target_names) > 0


def test_agency_rbac_and_undercover_redaction():
    """Validates need-to-know compartmentalization and undercover asset redaction."""
    profiles = agency_rbac.get_agency_profiles()
    assert len(profiles) >= 4

    # Create dummy graph with undercover asset
    dummy_data = GraphData(
        nodes=[
            GraphNode(
                id="PERSON_CIVILIAN",
                type=EntityType.PERSON,
                label="Public Suspect",
                risk_score=0.8
            ),
            GraphNode(
                id="PERSON_COVERT_01",
                type=EntityType.PERSON,
                label="Raw Undercover Informant 09",
                risk_score=0.1,
                properties={"is_undercover_asset": True}
            )
        ],
        edges=[]
    )

    # 1. Apex clearance: Sees unredacted
    apex_view = agency_rbac.sanitize_graph_for_agency(dummy_data, "MHA_APEX_COMMAND")
    assert apex_view.nodes[1].label == "Raw Undercover Informant 09"

    # 2. Field IO clearance: Must be redacted under Section 63 BSA 2023
    field_view = agency_rbac.sanitize_graph_for_agency(dummy_data, "STATE_POLICE_IO")
    assert field_view.nodes[1].label == "[REDACTED_COVERT_ASSET_DELTA]"
    assert field_view.nodes[1].properties["redacted"] is True


def test_api_crypto_endpoints(client):
    """Tests GET /api/v1/crypto/flows, off-ramps, and link-graph."""
    resp_flows = client.get("/api/v1/crypto/flows")
    assert resp_flows.status_code == 200
    assert len(resp_flows.json()) >= 2

    resp_off = client.get("/api/v1/crypto/off-ramps")
    assert resp_off.status_code == 200
    assert len(resp_off.json()) >= 3

    resp_link = client.post("/api/v1/crypto/link-graph")
    assert resp_link.status_code == 200
    assert resp_link.json()["success"] is True


def test_api_disruption_endpoints(client):
    """Tests POST /api/v1/disruption/simulate and optimal-targets."""
    resp_sim = client.post("/api/v1/disruption/simulate", json={"target_node_ids": ["PERSON_AFNAN"]})
    assert resp_sim.status_code == 200
    data = resp_sim.json()
    assert "syndicate_disruption_index" in data
    assert "tactical_verdict" in data

    resp_opt = client.get("/api/v1/disruption/optimal-targets?top_k=3")
    assert resp_opt.status_code == 200
    assert len(resp_opt.json()) > 0

    resp_agencies = client.get("/api/v1/disruption/agencies")
    assert resp_agencies.status_code == 200
    assert len(resp_agencies.json()) >= 4
