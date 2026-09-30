import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.storage.graph_engine import graph_engine
from app.storage.audit_ledger import audit_ledger
from app.core.config import settings
from app.core.security import generate_hmac_signature


class ReportEngine:
    """
    Sub-Second Forensic Intelligence Dossier Generator (Version 2.0):
    Compiles complete case intelligence, suspect profiles, Hawala matrices,
    audio transcripts, and Section 63 BSA 2023 certificates in < 50ms.
    """

    def generate_dossier(
        self,
        case_id: str = "CR-2024-AUR-SPECIAL-01",
        officer_name: str = settings.DEFAULT_IO_NAME,
        station_code: str = settings.OFFICER_STATION_CODE
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()
        now_str = datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M:%S UTC")

        # 1. Fetch graph analytics
        analytics = graph_engine.calculate_analytics()
        nodes = list(graph_engine.node_store.values())
        edges = list(graph_engine.edge_store.values())

        # 2. Extract Suspect Profiles
        suspects = []
        for n in nodes:
            if n.type.value == "PERSON":
                # Find connected phones
                connected_phones = []
                for e in edges:
                    if e.source == n.id and e.relation.value == "OPERATES":
                        phone_node = graph_engine.node_store.get(e.target)
                        if phone_node:
                            connected_phones.append(phone_node.label)

                suspects.append({
                    "id": n.id,
                    "name": n.label,
                    "role": n.properties.get("role", "ACCUSED / OPERATIVE"),
                    "risk_score": n.risk_score,
                    "aliases": n.properties.get("aliases", []),
                    "phones": connected_phones or ["No primary handset bound"],
                    "location": n.properties.get("location", "Sector Landmark Monitored")
                })

        # Sort suspects by risk score descending
        suspects.sort(key=lambda x: x["risk_score"], reverse=True)

        # 3. Extract High-Risk Intercepts & Transcripts
        intercepted_calls = []
        for e in edges:
            if e.relation.value == "CALLED":
                source_label = graph_engine.node_store.get(e.source, None)
                target_label = graph_engine.node_store.get(e.target, None)
                intercepted_calls.append({
                    "edge_id": e.id,
                    "caller": source_label.label if source_label else e.source,
                    "receiver": target_label.label if target_label else e.target,
                    "duration_sec": e.properties.get("duration_sec", 0),
                    "tower_id": e.properties.get("tower_id", "TOWER-UNKNOWN"),
                    "timestamp": e.timestamp or e.properties.get("timestamp", "N/A"),
                    "notes": e.properties.get("notes", "Technical surveillance call recorded")
                })

        # 4. Extract Financial Transfers
        financial_transfers = []
        for e in edges:
            if e.relation.value == "TRANSFERRED_MONEY":
                source_label = graph_engine.node_store.get(e.source, None)
                target_label = graph_engine.node_store.get(e.target, None)
                financial_transfers.append({
                    "from_account": source_label.label if source_label else e.source,
                    "to_account": target_label.label if target_label else e.target,
                    "amount_inr": e.properties.get("amount_inr", 0.0),
                    "channel": e.properties.get("channel", "IMPS/UPI"),
                    "tx_id": e.properties.get("tx_id", "TXN-AUTO")
                })

        # 5. Cryptographic Chain & HMAC Signature
        is_valid, msg, _ = audit_ledger.verify_integrity()
        latest_block = audit_ledger.chain[-1] if audit_ledger.chain else None
        if latest_block:
            latest_hash = latest_block["block_hash"] if isinstance(latest_block, dict) else latest_block.block_hash
        else:
            latest_hash = "GENESIS_HASH"
        hmac_seal = generate_hmac_signature(f"{case_id}:{latest_hash}:{len(nodes)}:{len(edges)}")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "metadata": {
                "dossier_id": f"DOSSIER-{case_id}-{int(time.time())}",
                "case_id": case_id,
                "governing_law": "Bharatiya Sakshya Adhiniyam, 2023 (Section 63)",
                "classification": "CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE",
                "issuing_authority": "Ministry of Home Affairs - NCRB Cyber Intelligence Unit",
                "station_code": station_code,
                "investigating_officer": officer_name,
                "generation_timestamp": now_str,
                "computation_time_ms": elapsed_ms
            },
            "executive_summary": {
                "total_entities_analyzed": len(nodes),
                "total_relationships_mapped": len(edges),
                "total_suspects_identified": len(suspects),
                "total_calls_intercepted": len(intercepted_calls),
                "total_financial_transactions": len(financial_transfers),
                "tamper_evident_integrity": "MATHEMATICALLY VERIFIED" if is_valid else "CORRUPTED",
                "primary_mastermind": analytics.masterminds[0]["label"] if analytics.masterminds else "Under Analysis",
                "primary_cross_gang_broker": analytics.brokers[0]["label"] if analytics.brokers else "Under Analysis"
            },
            "suspect_profiles": suspects,
            "intercepted_telecom_logs": intercepted_calls,
            "financial_flows": financial_transfers,
            "centrality_matrix": {
                "masterminds": analytics.masterminds,
                "brokers": analytics.brokers,
                "circular_hawala_loops": analytics.suspicious_motifs
            },
            "bsa_section_63_certificate": {
                "chain_valid": is_valid,
                "audit_blocks_count": len(audit_ledger.chain),
                "merkle_root_block_hash": latest_hash,
                "cryptographic_hmac_seal": hmac_seal,
                "statutory_declaration": (
                    "I hereby certify that the electronic records contained in this intelligence dossier "
                    "were produced by computer systems operating properly under my lawful control, "
                    "meeting all legal admissibility criteria under Section 63 of Bharatiya Sakshya Adhiniyam, 2023."
                )
            }
        }


report_engine = ReportEngine()
