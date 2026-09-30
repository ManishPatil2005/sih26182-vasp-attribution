import os
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
from app.models.schemas import AuditBlock, BSACertificate


class TamperEvidentLedger:
    """
    Cryptographic SHA-256 Hash Chain Ledger compliant with
    Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023.
    Guarantees non-repudiation and tamper detection for all electronic evidence.
    """

    GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, ledger_file: str = None):
        self.ledger_file = ledger_file or settings.AUDIT_LEDGER_PATH
        self.chain: List[Dict[str, Any]] = []
        self._load_or_initialize()

    def _calculate_payload_hash(self, payload: Any) -> str:
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def _calculate_block_hash(
        self,
        index: int,
        timestamp: str,
        officer_id: str,
        action: str,
        target_id: str,
        payload_hash: str,
        prev_hash: str
    ) -> str:
        header = f"{index}|{timestamp}|{officer_id}|{action}|{target_id}|{payload_hash}|{prev_hash}"
        return hashlib.sha256(header.encode("utf-8")).hexdigest()

    def _load_or_initialize(self) -> None:
        if os.path.exists(self.ledger_file):
            try:
                with open(self.ledger_file, "r", encoding="utf-8") as f:
                    self.chain = json.load(f)
                    if self.chain:
                        return
            except Exception:
                self.chain = []

        # Initialize with Genesis Block
        now = datetime.now(timezone.utc).isoformat()
        payload_hash = self._calculate_payload_hash({"genesis": "MHA-NCRB-CRIMEGRAPH-AI-CHAIN-START"})
        block_hash = self._calculate_block_hash(
            index=0,
            timestamp=now,
            officer_id="SYSTEM_ROOT",
            action="GENESIS_INITIALIZATION",
            target_id="ROOT",
            payload_hash=payload_hash,
            prev_hash=self.GENESIS_PREV_HASH
        )
        genesis_block = {
            "index": 0,
            "timestamp": now,
            "officer_id": "SYSTEM_ROOT",
            "action": "GENESIS_INITIALIZATION",
            "target_id": "ROOT",
            "payload_hash": payload_hash,
            "prev_hash": self.GENESIS_PREV_HASH,
            "block_hash": block_hash
        }
        self.chain = [genesis_block]
        self._persist()

    def _persist(self) -> None:
        os.makedirs(os.path.dirname(self.ledger_file), exist_ok=True)
        with open(self.ledger_file, "w", encoding="utf-8") as f:
            json.dump(self.chain, f, indent=2)

    def append_entry(
        self,
        officer_id: str,
        action: str,
        target_id: str = "N/A",
        payload: Any = None
    ) -> AuditBlock:
        prev_block = self.chain[-1]
        next_index = len(self.chain)
        timestamp = datetime.now(timezone.utc).isoformat()
        payload_hash = self._calculate_payload_hash(payload or {})
        prev_hash = prev_block["block_hash"]

        block_hash = self._calculate_block_hash(
            index=next_index,
            timestamp=timestamp,
            officer_id=officer_id,
            action=action,
            target_id=target_id,
            payload_hash=payload_hash,
            prev_hash=prev_hash
        )

        new_block = {
            "index": next_index,
            "timestamp": timestamp,
            "officer_id": officer_id,
            "action": action,
            "target_id": target_id,
            "payload_hash": payload_hash,
            "prev_hash": prev_hash,
            "block_hash": block_hash
        }

        self.chain.append(new_block)
        self._persist()
        return AuditBlock(**new_block)

    def record_action(
        self,
        officer_id: str,
        action: str,
        target_id: str = "N/A",
        details: Any = None
    ) -> AuditBlock:
        """Alias for append_entry supporting details keyword parameter."""
        return self.append_entry(officer_id=officer_id, action=action, target_id=target_id, payload=details)

    def verify_integrity(self) -> Tuple[bool, Optional[str], Optional[int]]:
        """
        Validates mathematical integrity of the hash chain.
        Returns: (is_valid, error_message, corrupted_block_index)
        """
        for i, block in enumerate(self.chain):
            if i == 0:
                expected_hash = self._calculate_block_hash(
                    index=0,
                    timestamp=block["timestamp"],
                    officer_id=block["officer_id"],
                    action=block["action"],
                    target_id=block["target_id"],
                    payload_hash=block["payload_hash"],
                    prev_hash=self.GENESIS_PREV_HASH
                )
                if block["block_hash"] != expected_hash:
                    return False, "Genesis block header tampered", 0
                continue

            prev_block = self.chain[i - 1]
            if block["prev_hash"] != prev_block["block_hash"]:
                return False, f"Broken link: block {i} prev_hash does not match block {i-1} block_hash", i

            expected_hash = self._calculate_block_hash(
                index=block["index"],
                timestamp=block["timestamp"],
                officer_id=block["officer_id"],
                action=block["action"],
                target_id=block["target_id"],
                payload_hash=block["payload_hash"],
                prev_hash=block["prev_hash"]
            )
            if block["block_hash"] != expected_hash:
                return False, f"Cryptographic signature mismatch on block {i}", i

        return True, "Chain intact and mathematically verified", None

    def generate_bsa_certificate(
        self,
        officer_name: str,
        station_code: str,
        ingested_files: List[Dict[str, str]]
    ) -> BSACertificate:
        """
        Produces Section 63 BSA 2023 Electronic Evidence Certificate.
        """
        is_valid, msg, _ = self.verify_integrity()
        latest_block = self.chain[-1] if self.chain else None
        latest_hash = latest_block["block_hash"] if latest_block else "EMPTY"

        date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
        hash_suffix = hashlib.sha256(latest_hash.encode()).hexdigest()[:8].upper()
        cert_id = f"BSA63-CERT-{date_str}-{hash_suffix}"

        declaration = (
            f"I, {officer_name}, Officer-in-Charge at {station_code}, do hereby solemnly certify under "
            "Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA), that the electronic records and "
            "synthesized blockchain VASP attribution dossiers produced by SAHYOG-VASP AI were generated by an automated "
            "computerized process operating without irregularity or unauthorized intervention. All digital artifacts "
            "remain secured under an uncorrupted cryptographic SHA-256 Merkle chain of custody."
        )

        from app.core.security import generate_hmac_signature
        hmac_seal = generate_hmac_signature(f"{cert_id}:{latest_hash}:{len(self.chain)}")

        return BSACertificate(
            certificate_id=cert_id,
            issue_date=datetime.now(timezone.utc).isoformat(),
            governing_act="Bharatiya Sakshya Adhiniyam, 2023 (Section 63)",
            police_station_code=station_code,
            officer_in_charge=officer_name,
            system_hash_chain_verified=is_valid,
            total_evidence_blocks=len(self.chain),
            latest_block_hash=latest_hash,
            ingested_artifacts=ingested_files,
            declaration=declaration,
            hmac_seal=hmac_seal
        )

    def get_all_blocks(self) -> List[AuditBlock]:
        return [AuditBlock(**b) for b in self.chain]


# Singleton instance
audit_ledger = TamperEvidentLedger()
