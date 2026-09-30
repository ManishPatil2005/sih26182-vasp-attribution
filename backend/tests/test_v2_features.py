import time
from app.engines.audio_engine import audio_engine
from app.engines.report_engine import report_engine
from app.core.security import generate_hmac_signature, verify_hmac_signature, sanitize_filename
from app.storage.graph_engine import graph_engine
from app.models.schemas import GraphNode, EntityType


def test_security_hmac_and_sanitization():
    # Test HMAC generation & verification
    payload = "CR-2024-AUR-SPECIAL-01:HASH1234:10:15"
    sig = generate_hmac_signature(payload)
    assert len(sig) == 64
    assert verify_hmac_signature(payload, sig) is True
    assert verify_hmac_signature(payload + "_tampered", sig) is False

    # Test filename sanitization
    sanitized = sanitize_filename("../../../etc/passwd")
    assert ".." not in sanitized
    assert "etc_passwd" in sanitized
    assert sanitize_filename("safe_call_record.wav") == "safe_call_record.wav"


def test_audio_engine_keyword_spotting_and_waveform():
    # Test sample recordings
    samples = audio_engine.get_all_records()
    assert len(samples) >= 3

    krish_sample = next((s for s in samples if "KRISH" in s["audio_id"]), None)
    assert krish_sample is not None
    assert "consignment" in krish_sample["flagged_keywords"]
    assert len(krish_sample["waveform"]) == 64
    assert krish_sample["speech_urgency"] in ["HIGH", "CRITICAL"]

    # Test new audio file processing
    dummy_wav = b"RIFF....WAVEfmt ....data...."
    record = audio_engine.process_audio_file(
        audio_bytes=dummy_wav,
        filename="intercept_deogiri_test.wav",
        caller="9822011122",
        receiver="9822033344",
        transcript_text="Urgent: Destroy SIM card immediately after delivery of contraband.",
        officer_id="TEST_IO"
    )

    assert record["audio_id"].startswith("AUDIO_")
    assert "destroy sim" in record["flagged_keywords"]
    assert "delivery" in record["flagged_keywords"]
    assert record["acoustic_risk_score"] >= 0.90
    assert record["speech_urgency"] == "CRITICAL"


def test_instant_report_engine_performance():
    # Ensure at least one person node in graph
    test_node = GraphNode(
        id="SUS_TEST_01",
        type=EntityType.PERSON,
        label="Test Suspect",
        properties={"role": "COURIER", "aliases": ["T-Boy"]},
        risk_score=0.82
    )
    graph_engine.add_node(test_node)

    start = time.perf_counter()
    dossier = report_engine.generate_dossier(case_id="TEST-CASE-882")
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Must generate in under 250 milliseconds
    assert elapsed_ms < 250
    assert "metadata" in dossier
    assert "executive_summary" in dossier
    assert "suspect_profiles" in dossier
    assert "bsa_section_63_certificate" in dossier
    assert dossier["bsa_section_63_certificate"]["chain_valid"] is True
    assert len(dossier["bsa_section_63_certificate"]["cryptographic_hmac_seal"]) == 64


def test_closeness_and_multi_factor_centrality():
    summary = graph_engine.calculate_analytics()
    assert hasattr(summary, "closeness_leaders")
    assert hasattr(summary, "multi_factor_threats")
    assert isinstance(summary.closeness_leaders, list)
    assert isinstance(summary.multi_factor_threats, list)
