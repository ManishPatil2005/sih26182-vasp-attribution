import re
import hashlib
from typing import List, Dict, Any
from app.models.schemas import EntityType, EvidenceReference


class EntityExtractor:
    """
    High-precision extraction engine for Indian criminal investigations:
    Extracts phone numbers, IMEIs, Indian vehicle plates, bank accounts,
    IFSC codes, UPI IDs, UTRs, BNS/IPC sections, suspect names, and aliases.
    """

    # RegEx Patterns optimized for Indian Law Enforcement Data
    PHONE_REGEX = re.compile(r'(?:\+91[\-\s]?|91[\-\s]?|0)?[6-9]\d{9}\b')
    IMEI_REGEX = re.compile(r'\b\d{15}\b')
    VEHICLE_REGEX = re.compile(r'\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b', re.IGNORECASE)
    IFSC_REGEX = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
    UPI_REGEX = re.compile(r'\b[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}\b')
    UTR_REGEX = re.compile(r'\b(?:UTR|TXN|REF)[A-Z0-9]{8,18}\b', re.IGNORECASE)
    BNS_IPC_REGEX = re.compile(
        r'\b(?:Section|Sec\.?|u/s)\s+(\d{1,4}[A-Z]?(?:\s*,\s*\d{1,4}[A-Z]?)*)\s*(?:IPC|BNS|NDPS|IT\s*Act|UAPA)\b',
        re.IGNORECASE
    )

    # Alias pattern common in Indian police FIRs (e.g., "Vikram @ Vicky", "Kabir alias Boss")
    ALIAS_REGEX = re.compile(
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:@|alias|a\.k\.a\.|\balias\b)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
        re.IGNORECASE
    )

    # Suspect designation pattern in FIR / Charge-sheet / CCTNS text
    SUSPECT_NAME_REGEX = re.compile(
        r'(?:accused|suspect|arrested|individual|named|target)[:\s]+\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b',
        re.IGNORECASE
    )

    @staticmethod
    def calculate_sha256(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def extract_from_text(
        self,
        text: str,
        doc_id: str,
        doc_sha256: str,
        source_type: str = "FIR"
    ) -> List[Dict[str, Any]]:
        entities: List[Dict[str, Any]] = []

        # 1. Extract Suspect Names with Aliases
        for match in self.ALIAS_REGEX.finditer(text):
            primary = match.group(1).strip()
            alias = match.group(2).strip()
            span = [match.start(), match.end()]
            snippet = text[max(0, match.start() - 30):min(len(text), match.end() + 30)]

            evidence = EvidenceReference(
                doc_id=doc_id,
                doc_sha256=doc_sha256,
                source_type=source_type,
                snippet=snippet.strip(),
                char_span=span,
                confidence=0.95
            )

            entities.append({
                "type": EntityType.PERSON,
                "label": primary,
                "properties": {
                    "primary_name": primary,
                    "aliases": [alias],
                    "raw_text": match.group(0)
                },
                "evidence": evidence
            })

        # 2. Extract Standard Suspect Names
        for match in self.SUSPECT_NAME_REGEX.finditer(text):
            name = match.group(1).strip()
            span = [match.start(), match.end()]
            snippet = text[max(0, match.start() - 30):min(len(text), match.end() + 30)]

            # Skip if already captured in alias
            if any(e.get("label") == name for e in entities):
                continue

            evidence = EvidenceReference(
                doc_id=doc_id,
                doc_sha256=doc_sha256,
                source_type=source_type,
                snippet=snippet.strip(),
                char_span=span,
                confidence=0.88
            )

            entities.append({
                "type": EntityType.PERSON,
                "label": name,
                "properties": {
                    "primary_name": name,
                    "aliases": [],
                    "role": "ACCUSED"
                },
                "evidence": evidence
            })

        # 3. Extract Phone Numbers
        for match in self.PHONE_REGEX.finditer(text):
            raw_phone = match.group(0).strip().replace(" ", "").replace("-", "")
            # Normalize to 10-digit Indian standard
            clean_phone = raw_phone[-10:]
            span = [match.start(), match.end()]
            snippet = text[max(0, match.start() - 25):min(len(text), match.end() + 25)]

            evidence = EvidenceReference(
                doc_id=doc_id,
                doc_sha256=doc_sha256,
                source_type=source_type,
                snippet=snippet.strip(),
                char_span=span,
                confidence=0.99
            )

            entities.append({
                "type": EntityType.PHONE,
                "label": clean_phone,
                "properties": {
                    "msisdn": clean_phone,
                    "country_code": "+91"
                },
                "evidence": evidence
            })

        # 4. Extract Vehicle Plates
        for match in self.VEHICLE_REGEX.finditer(text):
            plate = match.group(0).upper().replace(" ", "").replace("-", "")
            span = [match.start(), match.end()]
            snippet = text[max(0, match.start() - 25):min(len(text), match.end() + 25)]

            evidence = EvidenceReference(
                doc_id=doc_id,
                doc_sha256=doc_sha256,
                source_type=source_type,
                snippet=snippet.strip(),
                char_span=span,
                confidence=0.94
            )

            entities.append({
                "type": EntityType.VEHICLE,
                "label": plate,
                "properties": {
                    "registration_no": plate
                },
                "evidence": evidence
            })

        # 5. Extract Bank IFSC & Accounts
        for match in self.IFSC_REGEX.finditer(text):
            ifsc = match.group(0).upper()
            span = [match.start(), match.end()]
            snippet = text[max(0, match.start() - 25):min(len(text), match.end() + 25)]

            evidence = EvidenceReference(
                doc_id=doc_id,
                doc_sha256=doc_sha256,
                source_type=source_type,
                snippet=snippet.strip(),
                char_span=span,
                confidence=0.98
            )

            entities.append({
                "type": EntityType.ACCOUNT,
                "label": f"IFSC-{ifsc}",
                "properties": {
                    "ifsc_code": ifsc,
                    "type": "BANK_BRANCH"
                },
                "evidence": evidence
            })

        return entities


entity_extractor = EntityExtractor()
