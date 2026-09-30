from app.storage.audit_ledger import TamperEvidentLedger


def test_audit_ledger_integrity_and_tamper_detection(tmp_path):
    test_ledger_path = str(tmp_path / "test_audit.json")
    ledger = TamperEvidentLedger(ledger_file=test_ledger_path)

    # Append 3 entries
    ledger.append_entry(officer_id="IO_01", action="ACTION_1", payload={"data": 1})
    ledger.append_entry(officer_id="IO_02", action="ACTION_2", payload={"data": 2})
    ledger.append_entry(officer_id="IO_03", action="ACTION_3", payload={"data": 3})

    # Verify chain is valid initially
    is_valid, msg, corrupt_idx = ledger.verify_integrity()
    assert is_valid is True
    assert corrupt_idx is None

    # Deliberately mutate Block 2 payload to simulate database tampering
    ledger.chain[2]["payload_hash"] = "tampered_hash_value_9999"

    # Verify chain detects tampering
    is_valid_after, msg_after, corrupt_idx_after = ledger.verify_integrity()
    assert is_valid_after is False
    assert corrupt_idx_after == 2


def test_bsa_2023_certificate_generation(tmp_path):
    test_ledger_path = str(tmp_path / "test_audit_cert.json")
    ledger = TamperEvidentLedger(ledger_file=test_ledger_path)
    ledger.append_entry(officer_id="IO_KUMAR", action="INGEST_EVIDENCE", payload={"file": "FIR.pdf"})

    cert = ledger.generate_bsa_certificate(
        officer_name="Inspector Kumar",
        station_code="PS-SPECIAL-CELL-01",
        ingested_files=[{"doc_id": "FIR.pdf", "sha256": "abc123", "type": "FIR"}]
    )

    assert cert.system_hash_chain_verified is True
    assert cert.governing_act == "Bharatiya Sakshya Adhiniyam, 2023 (Section 63)"
    assert "Section 63 of the Bharatiya Sakshya Adhiniyam, 2023" in cert.declaration
    assert cert.police_station_code == "PS-SPECIAL-CELL-01"
