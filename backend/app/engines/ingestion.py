import io
import csv
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Tuple
import pypdf

from app.models.schemas import (
    GraphNode,
    GraphEdge,
    EntityType,
    RelationType,
    EvidenceReference,
    IngestResponse,
)
from app.engines.entity_extractor import entity_extractor
from app.storage.audit_ledger import audit_ledger


class IngestionEngine:
    """
    Ingests and normalizes multi-source investigation files:
    1. CDRs (Call Detail Records) CSV
    2. Financial Transactions CSV
    3. Police FIRs & Interrogation Reports (PDF & Text)
    """

    @staticmethod
    def calculate_sha256(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    def process_cdr_csv(
        self,
        content: bytes,
        filename: str,
        officer_id: str
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        doc_sha256 = self.calculate_sha256(content)
        decoded = content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(decoded))

        nodes: Dict[str, GraphNode] = {}
        edges: Dict[str, GraphEdge] = {}
        row_count = 0

        # Register evidence upload into audit ledger
        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_CDR_DATA",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256}
        )

        for row in reader:
            row_count += 1
            caller = (row.get("caller_msisdn") or row.get("caller") or "").strip()
            receiver = (row.get("receiver_msisdn") or row.get("receiver") or "").strip()
            duration = int(row.get("duration_sec") or row.get("duration") or 0)
            timestamp = (row.get("timestamp") or row.get("datetime") or datetime.now(timezone.utc).isoformat()).strip()
            tower_id = (row.get("tower_id") or row.get("cell_id") or "TOWER-UNKNOWN").strip()
            imei = (row.get("imei") or "").strip()
            caller_name = (row.get("caller_name") or row.get("caller_suspect") or "").strip()
            receiver_name = (row.get("receiver_name") or row.get("receiver_suspect") or "").strip()
            caller_role = (row.get("caller_role") or "SUSPECT").strip()
            receiver_role = (row.get("receiver_role") or "SUSPECT").strip()
            target_facility = (row.get("target_facility") or row.get("location") or "").strip()
            notes = (row.get("notes") or row.get("intel_notes") or row.get("intercept_summary") or "").strip()

            if not caller or not receiver:
                continue

            # Clean phone numbers
            caller = caller[-10:]
            receiver = receiver[-10:]

            caller_id = f"PHONE_{caller}"
            receiver_id = f"PHONE_{receiver}"

            # Evidence reference with intelligence snippet
            if notes:
                snippet = f"Gov Intercept: {caller_name or caller} -> {receiver_name or receiver} ({duration}s). Notes: {notes} [Tower: {tower_id}]"
            else:
                snippet = f"Call from {caller} to {receiver} ({duration}s) on {timestamp} via {tower_id}"

            evidence = EvidenceReference(
                doc_id=filename,
                doc_sha256=doc_sha256,
                source_type="CDR",
                snippet=snippet,
                confidence=1.0
            )

            # Node: Caller Phone
            if caller_id not in nodes:
                nodes[caller_id] = GraphNode(
                    id=caller_id,
                    type=EntityType.PHONE,
                    label=caller,
                    properties={"msisdn": caller, "imei": imei, "last_tower": tower_id},
                    evidence_refs=[evidence]
                )

            # Node: Receiver Phone
            if receiver_id not in nodes:
                nodes[receiver_id] = GraphNode(
                    id=receiver_id,
                    type=EntityType.PHONE,
                    label=receiver,
                    properties={"msisdn": receiver},
                    evidence_refs=[evidence]
                )

            # Optional: Caller Person Node
            if caller_name:
                caller_person_id = f"PERSON_{caller_name.upper().replace(' ', '_')}"
                if caller_person_id not in nodes:
                    nodes[caller_person_id] = GraphNode(
                        id=caller_person_id,
                        type=EntityType.PERSON,
                        label=caller_name,
                        properties={"primary_name": caller_name, "role": caller_role, "suspect": True, "last_tower": tower_id},
                        risk_score=0.88,
                        evidence_refs=[evidence]
                    )
                operates_caller_id = f"OPERATES_{caller_person_id}_{caller_id}"
                if operates_caller_id not in edges:
                    edges[operates_caller_id] = GraphEdge(
                        id=operates_caller_id,
                        source=caller_person_id,
                        target=caller_id,
                        relation=RelationType.OPERATES,
                        properties={"device": "PRIMARY_HANDSET", "role": caller_role},
                        timestamp=timestamp,
                        evidence_refs=[evidence]
                    )

            # Optional: Receiver Person Node
            if receiver_name:
                receiver_person_id = f"PERSON_{receiver_name.upper().replace(' ', '_')}"
                if receiver_person_id not in nodes:
                    nodes[receiver_person_id] = GraphNode(
                        id=receiver_person_id,
                        type=EntityType.PERSON,
                        label=receiver_name,
                        properties={"primary_name": receiver_name, "role": receiver_role, "suspect": True, "last_tower": tower_id},
                        risk_score=0.88,
                        evidence_refs=[evidence]
                    )
                operates_receiver_id = f"OPERATES_{receiver_person_id}_{receiver_id}"
                if operates_receiver_id not in edges:
                    edges[operates_receiver_id] = GraphEdge(
                        id=operates_receiver_id,
                        source=receiver_person_id,
                        target=receiver_id,
                        relation=RelationType.OPERATES,
                        properties={"device": "PRIMARY_HANDSET", "role": receiver_role},
                        timestamp=timestamp,
                        evidence_refs=[evidence]
                    )

            # Optional: Target Facility / Location Node
            if target_facility:
                loc_id = f"LOC_{target_facility.upper().replace(' ', '_')}"
                if loc_id not in nodes:
                    nodes[loc_id] = GraphNode(
                        id=loc_id,
                        type=EntityType.LOCATION,
                        label=target_facility,
                        properties={"facility_name": target_facility, "surveillance_zone": True, "tower_id": tower_id},
                        risk_score=0.75,
                        evidence_refs=[evidence]
                    )
                subject_id = caller_person_id if caller_name else caller_id
                coloc_id = f"LOCATED_{subject_id}_{loc_id}_{row_count}"
                if coloc_id not in edges:
                    edges[coloc_id] = GraphEdge(
                        id=coloc_id,
                        source=subject_id,
                        target=loc_id,
                        relation=RelationType.CO_LOCATED_AT,
                        properties={"tower_id": tower_id},
                        timestamp=timestamp,
                        evidence_refs=[evidence]
                    )

            # Edge: CALLED
            edge_id = f"CALL_{caller}_{receiver}_{row_count}"
            edges[edge_id] = GraphEdge(
                id=edge_id,
                source=caller_id,
                target=receiver_id,
                relation=RelationType.CALLED,
                properties={
                    "duration_sec": duration,
                    "tower_id": tower_id,
                    "timestamp": timestamp,
                    "notes": notes
                },
                timestamp=timestamp,
                weight=max(1.0, duration / 60.0),
                evidence_refs=[evidence]
            )

        edge_list = list(edges.values())
        node_list = list(nodes.values())

        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=row_count,
            entities_extracted=len(node_list),
            relationships_created=len(edge_list),
            audit_block_hash=block.block_hash,
            message=f"Successfully processed CDR with {len(node_list)} phone nodes and {len(edge_list)} call edges."
        )

        return node_list, edge_list, response

    def process_bank_csv(
        self,
        content: bytes,
        filename: str,
        officer_id: str
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        doc_sha256 = self.calculate_sha256(content)
        decoded = content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(decoded))

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = {}
        row_count = 0

        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_BANK_TRANSACTIONS",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256}
        )

        for row in reader:
            row_count += 1
            sender = (row.get("sender_account") or row.get("sender") or "").strip()
            receiver = (row.get("receiver_account") or row.get("receiver") or "").strip()
            amount = float(row.get("amount_inr") or row.get("amount") or 0.0)
            timestamp = (row.get("timestamp") or row.get("datetime") or datetime.now(timezone.utc).isoformat()).strip()
            tx_id = (row.get("utr_number") or row.get("tx_id") or f"TXN_{row_count}").strip()
            channel = (row.get("channel") or "IMPS/UPI").strip()

            if not sender or not receiver:
                continue

            sender_id = f"ACC_{sender}"
            receiver_id = f"ACC_{receiver}"

            evidence = EvidenceReference(
                doc_id=filename,
                doc_sha256=doc_sha256,
                source_type="BANK",
                snippet=f"Transfer INR {amount:,.2f} from {sender} to {receiver} ({tx_id}) on {timestamp}",
                confidence=1.0
            )

            # Node: Sender Account
            if sender_id not in nodes:
                nodes[sender_id] = GraphNode(
                    id=sender_id,
                    type=EntityType.ACCOUNT,
                    label=f"A/C ...{sender[-4:] if len(sender)>=4 else sender}",
                    properties={"account_no": sender},
                    evidence_refs=[evidence]
                )

            # Node: Receiver Account
            if receiver_id not in nodes:
                nodes[receiver_id] = GraphNode(
                    id=receiver_id,
                    type=EntityType.ACCOUNT,
                    label=f"A/C ...{receiver[-4:] if len(receiver)>=4 else receiver}",
                    properties={"account_no": receiver},
                    evidence_refs=[evidence]
                )

            # Edge: TRANSFERRED_MONEY
            edge_id = f"TX_{tx_id}"
            edges[edge_id] = GraphEdge(
                id=edge_id,
                source=sender_id,
                target=receiver_id,
                relation=RelationType.TRANSFERRED_MONEY,
                properties={
                    "amount_inr": amount,
                    "channel": channel,
                    "tx_id": tx_id,
                    "timestamp": timestamp
                },
                timestamp=timestamp,
                weight=max(1.0, amount / 50000.0),
                evidence_refs=[evidence]
            )

        edge_list = list(edges.values())
        node_list = list(nodes.values())

        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=row_count,
            entities_extracted=len(node_list),
            relationships_created=len(edge_list),
            audit_block_hash=block.block_hash,
            message=f"Successfully processed financial log with {len(node_list)} account nodes and {len(edge_list)} transfers."
        )

        return node_list, edge_list, response

    def process_fir_document(
        self,
        content: bytes,
        filename: str,
        officer_id: str,
        is_pdf: bool = False
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        doc_sha256 = self.calculate_sha256(content)
        raw_text = ""

        if is_pdf:
            try:
                pdf_reader = pypdf.PdfReader(io.BytesIO(content))
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        raw_text += text + "\n"
            except Exception as e:
                raw_text = f"PDF Extract Error: {str(e)}"
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        # Register upload
        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_FIR_DOCUMENT",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256, "length": len(raw_text)}
        )

        # Extract entities using EntityExtractor
        extracted = entity_extractor.extract_from_text(
            text=raw_text,
            doc_id=filename,
            doc_sha256=doc_sha256,
            source_type="FIR"
        )

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []

        # Create Crime Incident Node
        incident_id = f"INCIDENT_{hashlib.sha256(filename.encode()).hexdigest()[:8]}"
        incident_evidence = EvidenceReference(
            doc_id=filename,
            doc_sha256=doc_sha256,
            source_type="FIR",
            snippet=raw_text[:200],
            confidence=1.0
        )
        nodes[incident_id] = GraphNode(
            id=incident_id,
            type=EntityType.CRIME_INCIDENT,
            label=f"FIR: {filename}",
            properties={"filename": filename},
            evidence_refs=[incident_evidence]
        )

        # Build nodes from extracted entities
        for i, item in enumerate(extracted):
            ent_type = item["type"]
            label = item["label"]
            node_id = f"{ent_type.value}_{label.replace(' ', '_').upper()}"

            if node_id not in nodes:
                nodes[node_id] = GraphNode(
                    id=node_id,
                    type=ent_type,
                    label=label,
                    properties=item.get("properties", {}),
                    evidence_refs=[item["evidence"]]
                )

            # Link Suspects to Crime Incident
            if ent_type == EntityType.PERSON:
                edge_id = f"ACCUSED_{node_id}_{incident_id}"
                edges.append(
                    GraphEdge(
                        id=edge_id,
                        source=node_id,
                        target=incident_id,
                        relation=RelationType.ACCUSED_IN,
                        properties={"role": "ACCUSED"},
                        evidence_refs=[item["evidence"]]
                    )
                )

        node_list = list(nodes.values())

        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=len(raw_text),
            entities_extracted=len(node_list),
            relationships_created=len(edges),
            audit_block_hash=block.block_hash,
            message=f"Successfully extracted {len(node_list)} entities from FIR document {filename}."
        )

        return node_list, edges, response

    def process_surveillance_report(
        self,
        content: bytes,
        filename: str,
        officer_id: str
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        """
        Parses field surveillance logs, physical tracking reports, and stakeout summaries.
        Extracts observed suspects, vehicle registration plates, safehouse sightings, and timestamps.
        """
        doc_sha256 = self.calculate_sha256(content)
        raw_text = content.decode("utf-8", errors="ignore")

        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_SURVEILLANCE_REPORT",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256}
        )

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        now_str = datetime.now(timezone.utc).isoformat()

        extracted = entity_extractor.extract_from_text(raw_text, filename, doc_sha256, source_type="SURVEILLANCE")

        # Create Surveillance Observation Hub
        surv_id = f"SURV_{abs(hash(filename)) % 100000}"
        evidence_surv = EvidenceReference(
            doc_id=filename,
            doc_sha256=doc_sha256,
            source_type="SURVEILLANCE",
            snippet=raw_text[:200],
            confidence=0.95
        )

        nodes[surv_id] = GraphNode(
            id=surv_id,
            type=EntityType.CRIME_INCIDENT,
            label=f"Physical Surveillance: {filename}",
            risk_score=0.70,
            properties={"document_type": "SURVEILLANCE_LOG", "observation_text": raw_text[:300]},
            evidence_refs=[evidence_surv]
        )

        person_ids = []
        vehicle_ids = []
        location_ids = []

        for item in extracted:
            ent_type = item["type"]
            label = item["label"]
            clean_id = f"{ent_type.value}_{label.replace(' ', '_').replace('+', '').upper()}"

            if clean_id not in nodes:
                nodes[clean_id] = GraphNode(
                    id=clean_id,
                    type=ent_type,
                    label=label,
                    risk_score=0.75,
                    properties=item.get("properties", {}),
                    evidence_refs=[item["evidence"]]
                )

            if ent_type == EntityType.PERSON:
                person_ids.append(clean_id)
                edges.append(GraphEdge(
                    id=f"SURV_OBS_{clean_id}_{surv_id}",
                    source=clean_id,
                    target=surv_id,
                    relation=RelationType.ACCUSED_IN,
                    timestamp=now_str,
                    properties={"observation": "Target spotted during physical surveillance"},
                    evidence_refs=[item["evidence"]]
                ))
            elif ent_type == EntityType.VEHICLE:
                vehicle_ids.append(clean_id)
            elif ent_type == EntityType.LOCATION:
                location_ids.append(clean_id)

        # Connect Person to Vehicle (OWNS_VEHICLE / SPOTTED_IN)
        for pid in person_ids:
            for vid in vehicle_ids:
                edges.append(GraphEdge(
                    id=f"SURV_VEH_{pid}_{vid}",
                    source=pid,
                    target=vid,
                    relation=RelationType.OWNS_VEHICLE,
                    timestamp=now_str,
                    properties={"evidence": "Spotted operating or boarding vehicle"},
                    evidence_refs=[evidence_surv]
                ))
            for lid in location_ids:
                edges.append(GraphEdge(
                    id=f"SURV_LOC_{pid}_{lid}",
                    source=pid,
                    target=lid,
                    relation=RelationType.CO_LOCATED_AT,
                    timestamp=now_str,
                    properties={"evidence": "Spotted entering safehouse or transit location"},
                    evidence_refs=[evidence_surv]
                ))

        node_list = list(nodes.values())
        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=len(raw_text),
            entities_extracted=len(node_list),
            relationships_created=len(edges),
            audit_block_hash=block.block_hash,
            message=f"Surveillance report '{filename}' processed: {len(node_list)} entities, {len(edges)} connections."
        )
        return node_list, edges, response

    def process_criminal_history(
        self,
        content: bytes,
        filename: str,
        officer_id: str
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        """
        Parses CCTNS / ICJS criminal history database dossiers, past convictions,
        and modus operandi records. Elevates baseline risk scores for repeat offenders.
        """
        doc_sha256 = self.calculate_sha256(content)
        raw_text = content.decode("utf-8", errors="ignore")

        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_CRIMINAL_HISTORY",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256}
        )

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        now_str = datetime.now(timezone.utc).isoformat()

        extracted = entity_extractor.extract_from_text(raw_text, filename, doc_sha256, source_type="CRIMINAL_HISTORY")

        evidence_hist = EvidenceReference(
            doc_id=filename,
            doc_sha256=doc_sha256,
            source_type="CRIMINAL_HISTORY",
            snippet=raw_text[:250],
            confidence=0.98
        )

        # Flag habitual offender baseline risk score (0.90+)
        for item in extracted:
            ent_type = item["type"]
            label = item["label"]
            clean_id = f"{ent_type.value}_{label.replace(' ', '_').replace('+', '').upper()}"

            is_repeat_offender = "convict" in raw_text.lower() or "habitual" in raw_text.lower() or "fir" in raw_text.lower()
            risk = 0.92 if (ent_type == EntityType.PERSON and is_repeat_offender) else 0.75

            if clean_id not in nodes:
                nodes[clean_id] = GraphNode(
                    id=clean_id,
                    type=ent_type,
                    label=label,
                    risk_score=risk,
                    properties={
                        **item.get("properties", {}),
                        "cctns_record": True,
                        "prior_convictions": True if is_repeat_offender else False
                    },
                    evidence_refs=[item["evidence"], evidence_hist]
                )

        node_list = list(nodes.values())
        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=len(raw_text),
            entities_extracted=len(node_list),
            relationships_created=len(edges),
            audit_block_hash=block.block_hash,
            message=f"CCTNS criminal history '{filename}' processed with tamper-evident audit seal."
        )
        return node_list, edges, response

    def process_intelligence_bulletin(
        self,
        content: bytes,
        filename: str,
        officer_id: str
    ) -> Tuple[List[GraphNode], List[GraphEdge], IngestResponse]:
        """
        Parses Multi-Agency Center (MAC) / Intelligence Agency secret bulletins.
        Identifies high-threat interstate syndicates, clandestine funding channels, and alert levels.
        """
        doc_sha256 = self.calculate_sha256(content)
        raw_text = content.decode("utf-8", errors="ignore")

        block = audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_INTEL_BULLETIN",
            target_id=filename,
            payload={"filename": filename, "sha256": doc_sha256}
        )

        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        now_str = datetime.now(timezone.utc).isoformat()

        extracted = entity_extractor.extract_from_text(raw_text, filename, doc_sha256, source_type="INTEL_REPORT")

        evidence_intel = EvidenceReference(
            doc_id=filename,
            doc_sha256=doc_sha256,
            source_type="INTEL_REPORT",
            snippet=raw_text[:250],
            confidence=0.99
        )

        intel_hub_id = f"INTEL_{abs(hash(filename)) % 100000}"
        nodes[intel_hub_id] = GraphNode(
            id=intel_hub_id,
            type=EntityType.ORGANIZATION,
            label=f"Intel Alert: {filename}",
            risk_score=0.95,
            properties={"bulletin_type": "MULTI_AGENCY_CENTER_MAC", "classification": "TOP_SECRET"},
            evidence_refs=[evidence_intel]
        )

        for item in extracted:
            ent_type = item["type"]
            label = item["label"]
            clean_id = f"{ent_type.value}_{label.replace(' ', '_').replace('+', '').upper()}"

            if clean_id not in nodes:
                nodes[clean_id] = GraphNode(
                    id=clean_id,
                    type=ent_type,
                    label=label,
                    risk_score=0.88,
                    properties=item.get("properties", {}),
                    evidence_refs=[item["evidence"], evidence_intel]
                )

            edges.append(GraphEdge(
                id=f"INTEL_LINK_{clean_id}_{intel_hub_id}",
                source=clean_id,
                target=intel_hub_id,
                relation=RelationType.ASSOCIATED_WITH,
                timestamp=now_str,
                properties={"intelligence_memo": "Red-flagged in agency intelligence dispatch"},
                evidence_refs=[evidence_intel]
            ))

        node_list = list(nodes.values())
        response = IngestResponse(
            success=True,
            filename=filename,
            file_sha256=doc_sha256,
            records_processed=len(raw_text),
            entities_extracted=len(node_list),
            relationships_created=len(edges),
            audit_block_hash=block.block_hash,
            message=f"Intelligence bulletin '{filename}' synthesized into Knowledge Graph."
        )
        return node_list, edges, response


ingestion_engine = IngestionEngine()
