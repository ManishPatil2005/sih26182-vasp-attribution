from app.engines.demo_loader import load_operation_chakra_net
from app.storage.graph_engine import graph_engine


def test_operation_chakra_net_analytics():
    # Load synthetic dataset
    node_count = load_operation_chakra_net()
    assert node_count >= 15

    # Run analytics
    summary = graph_engine.calculate_analytics()

    assert summary.total_nodes >= 15
    assert summary.total_edges >= 15
    assert len(summary.masterminds) > 0
    assert len(summary.brokers) > 0

    # Top masterminds should contain Kabir Mehta and Vikram Malhotra
    mastermind_labels = [m["label"] for m in summary.masterminds]
    assert any("Kabir" in label for label in mastermind_labels)
    assert any("Vikram" in label for label in mastermind_labels)

    # Brokers should identify high-betweenness bridging devices and accounts
    broker_labels = [b["label"] for b in summary.brokers]
    assert len(broker_labels) > 0
    assert any("9811002233" in label or "A/C" in label for label in broker_labels)

    # Hawala circular loop must be detected
    hawala_motifs = [m for m in summary.suspicious_motifs if m["motif_type"] == "CIRCULAR_HAWALA_LOOP"]
    assert len(hawala_motifs) >= 1
    assert "A/C" in hawala_motifs[0]["description"]


def test_network_time_machine_filtering():
    load_operation_chakra_net()

    # Query only January 2024
    nodes_jan, edges_jan = graph_engine.query_temporal_subgraph(
        start_date="2024-01-01",
        end_date="2024-01-31"
    )

    # In Jan 2024 only setup edges occurred, financial transfers were in March 2024
    assert len(edges_jan) > 0
    transfer_edges = [e for e in edges_jan if e.relation.value == "TRANSFERRED_MONEY"]
    assert len(transfer_edges) == 0  # Money transfers didn't start until March
