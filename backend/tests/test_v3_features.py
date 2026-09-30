import pytest
from datetime import datetime, timedelta
from app.models.schemas import GraphNode, GraphEdge, EntityType, RelationType
from app.storage.graph_engine import graph_engine
from app.engines.link_prediction import link_prediction_engine
from app.engines.colocation_engine import colocation_engine, haversine_distance_meters
from app.engines.osint_engine import osint_engine
from app.engines.copilot_engine import copilot_engine
from app.engines.ncrb_scenario import load_ncrb_operation_rakshak


def test_haversine_distance():
    # Distance between two nearby points in Chhatrapati Sambhajinagar (~1 km)
    dist = haversine_distance_meters(19.8732, 75.3245, 19.8821, 75.3168)
    assert dist > 500
    assert dist < 2000


def test_colocation_engine_detection():
    events = colocation_engine.analyze_colocations(time_window_minutes=15, max_distance_meters=400)
    assert isinstance(events, list)
    assert len(events) >= 1
    # Check that rendezvous with >= 2 suspects was found
    found_rendezvous = any(len(e["suspects_present"]) >= 2 for e in events)
    assert found_rendezvous is True


def test_gis_map_trajectories():
    map_data = colocation_engine.get_towers_and_trajectories()
    assert "towers" in map_data
    assert "trajectories" in map_data
    assert len(map_data["towers"]) >= 5
    assert len(map_data["trajectories"]) >= 3


def test_osint_chat_parsing():
    raw_chat = """
    @shadow_lead: Consignment dropped at CIDCO. Transfer payment to TRC20 wallet TXk9bV8mP2zQ7aL1wE5rY882p.
    @kabir_trans: Acknowledged. Vehicle MH-20-DE-1102 deployed to safehouse.
    @afnan_logistics: Use burner phone +919822033333 for payload verification.
    """
    res = osint_engine.parse_chat_log(raw_chat, platform="Telegram", channel_name="OpsChannel")
    assert "@shadow_lead" in res["extracted_handles"]
    assert "@kabir_trans" in res["extracted_handles"]
    assert any("TXk9b" in w for w in res["extracted_wallets"])
    assert "+919822033333" in res["extracted_phones"]
    assert res["threat_message_count"] >= 1


def test_ncrb_operation_rakshak_loading():
    res = load_ncrb_operation_rakshak()
    assert res["status"] == "SUCCESS"
    assert res["nodes_loaded"] >= 10
    assert res["edges_loaded"] >= 10
    assert "SUSP-V01" in graph_engine.node_store
    assert graph_engine.node_store["SUSP-V01"].risk_score >= 0.90


def test_link_prediction_on_rakshak():
    # Make sure Rakshak graph is loaded
    load_ncrb_operation_rakshak()
    predictions = link_prediction_engine.predict_hidden_links(top_k=5)
    assert isinstance(predictions, list)
    # Suspects who share intermediaries should produce prediction scores
    if predictions:
        p = predictions[0]
        assert "hidden_link_probability" in p
        assert p["hidden_link_probability"] > 0.3
        assert "common_intermediates" in p


def test_copilot_queries():
    load_ncrb_operation_rakshak()
    
    # Query 1: Mastermind
    ans_lead = copilot_engine.answer_query("Who is the mastermind?")
    assert "Tanya Verma" in ans_lead["answer"] or "Mastermind" in ans_lead["answer"]
    assert len(ans_lead["actionable_recommendation"]) > 0

    # Query 2: Money trail
    ans_money = copilot_engine.answer_query("Show me the money trail and hawala transfers")
    assert "Financial Audit" in ans_money["answer"] or "transfers" in ans_money["answer"].lower()

    # Query 3: Legal sections
    ans_law = copilot_engine.answer_query("What are the legal BNS sections?")
    assert "BNS Section 111" in ans_law["answer"]
    assert "BSA" in ans_law["answer"]


def test_surveillance_ingestion():
    from app.engines.ingestion import ingestion_engine
    surv_log = """
    PHYSICAL SURVEILLANCE REPORT - SPECIAL CELL
    Target: Kabir Mehta spotted driving White Scorpio MH-20-DE-1102.
    Location: Reached safehouse at CIDCO Sector 5.
    Accompanied by: Afnan Khan. Phone used: +919822055555.
    """
    nodes, edges, resp = ingestion_engine.process_surveillance_report(
        content=surv_log.encode(),
        filename="SURV_STAKEOUT_01.txt",
        officer_id="IO-782"
    )
    assert resp.success is True
    assert len(nodes) >= 2
    assert any(n.type == EntityType.VEHICLE for n in nodes)


def test_criminal_history_ingestion():
    from app.engines.ingestion import ingestion_engine
    cctns_dossier = """
    CCTNS ICJS CRIMINAL HISTORY RECORD
    Suspect: Tanya Verma, Alias: Shadow Lead
    Prior FIR Cases: FIR 142/2021 Pune Cyber Cell, FIR 88/2023 Aurangabad
    Conviction Status: Habitual Offender under Section 111 BNS
    """
    nodes, edges, resp = ingestion_engine.process_criminal_history(
        content=cctns_dossier.encode(),
        filename="CCTNS_DOSSIER_TANYA.txt",
        officer_id="IO-782"
    )
    assert resp.success is True
    assert any(n.risk_score >= 0.90 for n in nodes)


def test_intel_bulletin_ingestion():
    from app.engines.ingestion import ingestion_engine
    intel_memo = """
    MULTI-AGENCY CENTER (MAC) TOP SECRET INTELLIGENCE MEMO
    Subject: Interstate Logistics Cell Operative Afnan Khan
    Threat Level: RED. Operating encrypted Signal channels with phone +919822033333.
    """
    nodes, edges, resp = ingestion_engine.process_intelligence_bulletin(
        content=intel_memo.encode(),
        filename="MAC_INTEL_AFNAN.txt",
        officer_id="IO-782"
    )
    assert resp.success is True
    assert len(nodes) >= 2
    assert any("INTEL" in n.id for n in nodes)


def test_connection_pathfinder():
    load_ncrb_operation_rakshak()
    # Trace pathway from Tanya Verma (SUSP-V01) to Manish Patil (SUSP-V05)
    res = graph_engine.find_pathway("SUSP-V01", "SUSP-V05")
    assert res["connected"] is True
    assert res["path_length"] >= 2
    assert len(res["steps"]) >= 2
    assert "SUSP-V01" in res["node_sequence"]
    assert "SUSP-V05" in res["node_sequence"]


def test_syndicate_hierarchy():
    load_ncrb_operation_rakshak()
    res = graph_engine.get_syndicate_hierarchy()
    assert res["status"] == "SUCCESS"
    assert "hierarchy" in res
    assert len(res["hierarchy"]["tier_1_masterminds"]) >= 1
    assert "Tanya Verma" in res["hierarchy"]["tier_1_masterminds"][0]["label"]
