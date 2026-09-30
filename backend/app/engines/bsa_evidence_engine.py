"""
Bharat Sakshya Adhiniyam (BSA) 2023 Section 63 Digital Evidence Certificate Engine (SIH26182 V3)
Generates court-admissible electronic evidence certificates and Section 94 BNSS 2023
statutory asset freezing requisition dossiers for Indian Law Enforcement Agencies (LEAs).
"""

import hashlib
import time
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from app.models.schemas import VASPAttributionResult, SahyogFreezeRequisition


class CourtCertificateBSA63(BaseModel):
    certificate_id: str
    statutory_act: str = "Section 63 Bharat Sakshya Adhiniyam (BSA), 2023 (formerly Section 65B Indian Evidence Act)"
    enforcement_directive: str = "Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 69 IT Act"
    issuing_authority: str
    officer_badge: str
    court_jurisdiction: str
    fir_reference: str
    police_station: str
    target_unhosted_wallet: str
    blockchain_network: str
    nearest_vasp_name: str
    vasp_fiu_reg_id: str
    vasp_deposit_address: str
    frozen_amount_inr: float
    frozen_amount_crypto: float
    token_symbol: str = "USDT"
    merkle_evidence_root: str
    chain_of_custody_hashes: List[str]
    system_hash_sha256: str
    notarized_timestamp_utc: str
    legal_declaration: str
    qr_verification_payload: str


class BSAEvidenceEngine:
    """
    Engine to produce legally binding Section 63 BSA 2023 electronic evidence
    certificates for criminal trial proceedings and high court bail oppositions.
    """

    def generate_court_certificate(
        self,
        requisition: SahyogFreezeRequisition,
        attribution: VASPAttributionResult,
        fir_number: str = "FIR-109/2026/CYBER",
        police_station: str = "Special Cyber Cell, New Delhi",
        court_jurisdiction: str = "Court of Chief Judicial Magistrate / Sessions Court"
    ) -> CourtCertificateBSA63:
        """
        Synthesizes an immutable Section 63 BSA 2023 Certificate.
        """
        cert_id = f"BSA63-CERT-{requisition.requisition_id.replace('REQ-BNSS94-', '')}"

        # Build list of forensic chain of custody hashes
        chain_hashes = []
        for step in attribution.path_steps:
            raw_step = f"{step.hop_number}:{step.tx_hash}:{step.from_address}:{step.to_address}:{step.amount}"
            step_hash = hashlib.sha256(raw_step.encode()).hexdigest()
            chain_hashes.append(step_hash)

        # Compute tamper-proof system hash
        payload_to_hash = (
            f"{cert_id}:{fir_number}:{attribution.query_wallet}:"
            f"{attribution.deposit_address}:{attribution.estimated_amount_inr}:"
            f"{attribution.merkle_evidence_hash}"
        )
        system_hash = hashlib.sha256(payload_to_hash.encode()).hexdigest()

        declaration = (
            "I hereby certify and declare pursuant to Section 63(4) of the Bharat Sakshya Adhiniyam, 2023 "
            "that the cryptocurrency forensic transaction trail and automated VASP attribution detailed herein "
            "was generated in the ordinary course of official duty by the sovereign National Cybercrime Gateway. "
            "The computer systems, node crawlers, and cryptographic hash chains were operating without any malfunction "
            "or unauthorized interception. The cryptographic Merkle root hash notarizes the authentic state of the "
            "blockchain ledger and target VASP deposit ingress at the stated timestamp."
        )

        qr_payload = (
            f"GOVT_OF_INDIA_MHA|BSA63|{cert_id}|FIR:{fir_number}|"
            f"VASP:{attribution.nearest_vasp.name}|DEPOSIT:{attribution.deposit_address}|"
            f"HASH:{system_hash[:16]}"
        )

        return CourtCertificateBSA63(
            certificate_id=cert_id,
            statutory_act="Section 63 Bharat Sakshya Adhiniyam (BSA), 2023 (formerly Section 65B Indian Evidence Act)",
            enforcement_directive="Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 69 IT Act",
            issuing_authority=requisition.issuing_officer,
            officer_badge=requisition.issuing_officer.split("(")[-1].replace(")", "") if "(" in requisition.issuing_officer else "MHA-CYBER-IO",
            court_jurisdiction=court_jurisdiction,
            fir_reference=fir_number,
            police_station=police_station,
            target_unhosted_wallet=attribution.query_wallet,
            blockchain_network=attribution.blockchain.value if hasattr(attribution.blockchain, 'value') else str(attribution.blockchain),
            nearest_vasp_name=attribution.nearest_vasp.name,
            vasp_fiu_reg_id=attribution.nearest_vasp.sahyog_registered_id,
            vasp_deposit_address=attribution.deposit_address,
            frozen_amount_inr=attribution.estimated_amount_inr,
            frozen_amount_crypto=attribution.attributed_amount_crypto,
            token_symbol=attribution.token_symbol,
            merkle_evidence_root=attribution.merkle_evidence_hash,
            chain_of_custody_hashes=chain_hashes,
            system_hash_sha256=system_hash,
            notarized_timestamp_utc=requisition.timestamp,
            legal_declaration=declaration,
            qr_verification_payload=qr_payload
        )


bsa_engine = BSAEvidenceEngine()
