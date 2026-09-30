from app.engines.ingestion import ingestion_engine
from app.engines.entity_extractor import entity_extractor
from app.models.schemas import EntityType


def test_entity_extractor_phone_and_plate():
    sample_text = """
    On 15-08-2024, accused Vikram @ Vicky was spotted driving vehicle DL 01 AB 1234
    and contacting associate at mobile +91 9876543210. Case registered u/s 318 BNS.
    """
    entities = entity_extractor.extract_from_text(
        text=sample_text,
        doc_id="TEST_FIR_01.txt",
        doc_sha256="test-sha-1234"
    )

    types = [e["type"] for e in entities]
    assert EntityType.PERSON in types
    assert EntityType.PHONE in types
    assert EntityType.VEHICLE in types

    phone_nodes = [e for e in entities if e["type"] == EntityType.PHONE]
    assert phone_nodes[0]["label"] == "9876543210"

    plate_nodes = [e for e in entities if e["type"] == EntityType.VEHICLE]
    assert plate_nodes[0]["label"] == "DL01AB1234"


def test_cdr_csv_ingestion():
    cdr_csv_content = b"""caller_msisdn,receiver_msisdn,duration_sec,timestamp,tower_id,imei
9811001122,9811002233,180,2024-01-10T10:00:00Z,TOWER_401,352819001234567
9811002233,9811003344,90,2024-01-10T11:00:00Z,TOWER_402,352819007654321
"""
    nodes, edges, response = ingestion_engine.process_cdr_csv(
        content=cdr_csv_content,
        filename="test_cdr.csv",
        officer_id="TEST_IO"
    )

    assert response.success is True
    assert len(nodes) == 3
    assert len(edges) == 2
    assert response.records_processed == 2


def test_bank_csv_ingestion():
    bank_csv_content = b"""sender_account,receiver_account,amount_inr,timestamp,utr_number,channel
9910112233,9910223344,500000,2024-02-01T12:00:00Z,UTR9021001,RTGS
9910223344,9910334455,480000,2024-02-02T14:30:00Z,UTR9021002,IMPS
"""
    nodes, edges, response = ingestion_engine.process_bank_csv(
        content=bank_csv_content,
        filename="test_bank.csv",
        officer_id="TEST_IO"
    )

    assert response.success is True
    assert len(nodes) == 3
    assert len(edges) == 2
    assert response.records_processed == 2


def test_fun_csv_ingestion():
    from pathlib import Path
    candidates = [
        Path("data/raw/fun.csv"),
        Path("../data/raw/fun.csv"),
        Path("fun.csv"),
        Path("../fun.csv"),
        Path(__file__).resolve().parents[2] / "data" / "raw" / "fun.csv",
        Path(__file__).resolve().parents[2] / "fun.csv",
    ]
    fun_path = next((p for p in candidates if p.exists()), None)
    assert fun_path is not None and fun_path.exists(), "fun.csv must exist in candidates"

    content = fun_path.read_bytes()
    nodes, edges, response = ingestion_engine.process_cdr_csv(
        content=content,
        filename="fun.csv",
        officer_id="IO_INTERCEPT_SPECIAL_UNIT"
    )

    assert response.success is True
    assert response.records_processed == 6

    # Verify Suspect Persons extracted
    person_labels = [n.label for n in nodes if n.type == EntityType.PERSON]
    assert "Krish" in person_labels
    assert "Manish" in person_labels
    assert "Afnan" in person_labels

    # Verify Locations extracted
    location_labels = [n.label for n in nodes if n.type == EntityType.LOCATION]
    assert "Deogiri College" in location_labels
    assert "MGM Institute" in location_labels

    # Verify Phones extracted
    phone_labels = [n.label for n in nodes if n.type == EntityType.PHONE]
    assert "9822011122" in phone_labels
    assert "9822022233" in phone_labels
    assert "9822033344" in phone_labels

    # Verify relationships
    relations = [e.relation.value for e in edges]
    assert "CALLED" in relations
    assert "OPERATES" in relations
    assert "CO_LOCATED_AT" in relations

