from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "26182" in data["problem_statement_id"]

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "HEALTHY"


def test_load_demo_and_query_endpoints():
    # 1. Trigger demo loading
    demo_res = client.post("/api/v1/graph/load-demo", data={"officer_id": "TEST_OFFICER"})
    assert demo_res.status_code == 200
    assert demo_res.json()["success"] is True

    # 2. Query graph data
    graph_res = client.get("/api/v1/graph/data")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert len(graph_data["nodes"]) >= 15
    assert len(graph_data["edges"]) >= 15

    # 3. Query analytics summary
    analytics_res = client.get("/api/v1/analytics/summary")
    assert analytics_res.status_code == 200
    summary = analytics_res.json()
    assert len(summary["masterminds"]) > 0
    assert len(summary["brokers"]) > 0
    assert len(summary["suspicious_motifs"]) > 0

    # 4. Generate BSA 2023 Section 63 certificate
    cert_res = client.get("/api/v1/audit/bsa-certificate")
    assert cert_res.status_code == 200
    cert = cert_res.json()
    assert cert["system_hash_chain_verified"] is True
    assert "Bharatiya Sakshya Adhiniyam, 2023" in cert["governing_act"]

    # 5. Check Identity Fusion candidates
    fusion_res = client.get("/api/v1/ingest/fusion/candidates")
    assert fusion_res.status_code == 200
    candidates = fusion_res.json()
    # Bikram and Vikram Malhotra should be flagged
    assert any("Malhotra" in c["candidate_a"]["label"] or "Malhotra" in c["candidate_b"]["label"] for c in candidates)


def test_audio_endpoints():
    res = client.get("/api/v1/audio/samples")
    assert res.status_code == 200
    samples = res.json()
    assert isinstance(samples, list)
    assert len(samples) > 0
    first_id = samples[0]["audio_id"]

    detail = client.get(f"/api/v1/audio/{first_id}")
    assert detail.status_code == 200
    assert detail.json()["audio_id"] == first_id


def test_spatial_and_gis_endpoints():
    coloc_res = client.post("/api/v1/spatial/colocation?time_window_minutes=20&max_distance_meters=500")
    assert coloc_res.status_code == 200
    data = coloc_res.json()
    assert data["status"] == "SUCCESS"
    assert "rendezvous_events" in data

    gis_res = client.get("/api/v1/spatial/gis-map")
    assert gis_res.status_code == 200
    gis_data = gis_res.json()
    assert "towers" in gis_data
    assert "trajectories" in gis_data


def test_prediction_and_copilot_endpoints():
    pred_res = client.post("/api/v1/prediction/predict-links?top_k=5")
    assert pred_res.status_code == 200
    assert "predictions" in pred_res.json()

    copilot_res = client.post("/api/v1/copilot/query", json={"query": "Who is the primary broker?"})
    assert copilot_res.status_code == 200
    c_data = copilot_res.json()
    assert "answer" in c_data
    assert len(c_data["answer"]) > 0


def test_analytics_hierarchy_and_compliance():
    hier_res = client.get("/api/v1/analytics/hierarchy")
    assert hier_res.status_code == 200
    assert "hierarchy" in hier_res.json()

    comp_res = client.get("/api/v1/analytics/compliance-matrix")
    assert comp_res.status_code == 200
    assert "criteria_evaluations" in comp_res.json()


def test_scale_and_crypto_endpoints():
    scale_res = client.get("/api/v1/interception/scale-metrics")
    assert scale_res.status_code == 200
    s_data = scale_res.json()
    assert s_data["criminal_watchlist_size"] >= 1_000_000

    warrants_res = client.get("/api/v1/interception/warrants")
    assert warrants_res.status_code == 200
    assert isinstance(warrants_res.json(), list)

    crypto_res = client.get("/api/v1/crypto/flows")
    assert crypto_res.status_code == 200
    assert len(crypto_res.json()) >= 1
