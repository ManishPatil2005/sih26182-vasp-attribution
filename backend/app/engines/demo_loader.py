from app.models.schemas import (
    GraphNode,
    GraphEdge,
    EntityType,
    RelationType,
    EvidenceReference,
)
from app.storage.graph_engine import graph_engine
from app.storage.audit_ledger import audit_ledger


def load_operation_chakra_net(officer_id: str = "Inspector R. K. Sharma (IO-782)") -> int:
    """
    Loads synthetic 'Operation Chakra-Net' multi-source syndicate scenario.
    Provides immediate rich graph data with Masterminds, Hawala loops,
    Mule accounts, Burner phones, and candidate aliases for Splink.
    """
    graph_engine.clear()

    doc_fir = "FIR-2024-882-DELHI-CYBER.pdf"
    sha_fir = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
    doc_cdr = "CDR_DUMP_TOWER_284.csv"
    sha_cdr = "b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1"
    doc_bank = "FINANCIAL_LEDGER_UTR_SERIES_4.csv"
    sha_bank = "c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef2"

    # Register in audit ledger
    audit_ledger.append_entry(
        officer_id=officer_id,
        action="LOAD_DEMO_SCENARIO",
        target_id="OPERATION_CHAKRA_NET",
        payload={"scenario": "Operation Chakra-Net", "sources": [doc_fir, doc_cdr, doc_bank]}
    )

    # 1. Suspect Nodes
    suspects = [
        ("SUS_KABIR", "Kabir Mehta", ["The Architect", "KM"], "KINGPIN", 0.95),
        ("SUS_VIKRAM", "Vikram Malhotra", ["Vicky", "Malhotra"], "REGIONAL_HANDLER", 0.85),
        ("SUS_BIKRAM", "Bikram Malhotra", ["V. Malhotra"], "REGIONAL_HANDLER_ALIAS", 0.80),
        ("SUS_IMRAN", "Imran Qureshi", ["Hajji", "IQ"], "HAWALA_BROKER", 0.88),
        ("SUS_RAJESH", "Rajesh Sharma", ["Munna Extortion"], "FIELD_ENFORCER", 0.75),
        ("SUS_DEEPAK", "Deepak Verma", ["Jamtara Cell Lead"], "CYBER_CALL_CENTER", 0.70),
        ("SUS_SUNIL", "Sunil Yadav", ["SIM Supplier"], "LOGISTICS", 0.65),
        ("MULE_AMITABH", "Amitabh Roy", ["Mule-1"], "MULE_ACCOUNT_HOLDER", 0.55),
        ("MULE_POOJA", "Pooja Hegde", ["Mule-2"], "MULE_ACCOUNT_HOLDER", 0.50),
        ("MULE_KARAN", "Karan Joshi", ["Mule-3"], "MULE_ACCOUNT_HOLDER", 0.52),
        ("COVERT_INFORMANT_07", "Covert Informant Delta", ["Asset-07"], "UNDERCOVER_INFORMANT", 0.15),
    ]

    for sid, label, aliases, role, risk in suspects:
        ref = EvidenceReference(
            doc_id=doc_fir,
            doc_sha256=sha_fir,
            source_type="FIR",
            snippet=f"Accused {label} identified operating syndicate wing as {role}.",
            confidence=0.95
        )
        is_undercover = (role == "UNDERCOVER_INFORMANT")
        graph_engine.add_node(
            GraphNode(
                id=sid,
                type=EntityType.PERSON,
                label=label,
                properties={
                    "aliases": aliases, 
                    "role": role, 
                    "risk_level": "CRITICAL" if risk > 0.8 else "LOW" if is_undercover else "HIGH",
                    "is_undercover_asset": is_undercover
                },
                risk_score=risk,
                evidence_refs=[ref]
            )
        )

    # 2. Phone Nodes
    phones = [
        ("PHONE_9811001122", "9811001122", "Kabir Mehta (VoIP/Satellite)"),
        ("PHONE_9811002233", "9811002233", "Vikram Malhotra"),
        ("PHONE_9811003344", "9811003344", "Imran Qureshi (Hawala)"),
        ("PHONE_9811004455", "9811004455", "Deepak Verma (Jamtara)"),
        ("PHONE_9811005566", "9811005566", "Sunil Yadav (Burner Master)"),
        ("PHONE_9811006677", "9811006677", "Rajesh Sharma"),
    ]

    for pid, msisdn, desc in phones:
        ref = EvidenceReference(
            doc_id=doc_cdr,
            doc_sha256=sha_cdr,
            source_type="CDR",
            snippet=f"Active MSISDN {msisdn} registered in Tower 284 cluster.",
            confidence=1.0
        )
        graph_engine.add_node(
            GraphNode(
                id=pid,
                type=EntityType.PHONE,
                label=msisdn,
                properties={"msisdn": msisdn, "description": desc},
                evidence_refs=[ref]
            )
        )

    # 3. Bank Account Nodes
    accounts = [
        ("ACC_9910112233", "A/C ...2233", "Amitabh Roy Mule", False),
        ("ACC_9910223344", "A/C ...3344", "Pooja Hegde Mule", False),
        ("ACC_9910334455", "A/C ...4455", "Karan Joshi Mule", False),
        ("ACC_9910445566", "A/C ...5566", "Al-Fajr General Trading Dubai", True),
    ]

    for aid, label, desc, is_intl in accounts:
        ref = EvidenceReference(
            doc_id=doc_bank,
            doc_sha256=sha_bank,
            source_type="BANK",
            snippet=f"Bank Account {label} flagged under KYC scrutiny: {desc}.",
            confidence=1.0
        )
        graph_engine.add_node(
            GraphNode(
                id=aid,
                type=EntityType.ACCOUNT,
                label=label,
                properties={"description": desc, "international": is_intl},
                evidence_refs=[ref]
            )
        )

    # 4. Vehicle & Crime Incident Nodes
    ref_fir = EvidenceReference(doc_id=doc_fir, doc_sha256=sha_fir, source_type="FIR", snippet="FIR registration", confidence=1.0)
    graph_engine.add_node(
        GraphNode(
            id="VEH_DL01AB9988",
            type=EntityType.VEHICLE,
            label="DL 01 AB 9988",
            properties={"make": "Toyota Fortuner", "color": "Black"},
            evidence_refs=[ref_fir]
        )
    )
    graph_engine.add_node(
        GraphNode(
            id="CRIME_FIR_882",
            type=EntityType.CRIME_INCIDENT,
            label="FIR No. 882/2024",
            properties={"sections": "BNS 111 (Organised Crime), BNS 318 (Cheating), IT Act 66D"},
            evidence_refs=[ref_fir]
        )
    )

    # 5. Connect Phones & Accounts to Suspects
    edges_to_add = [
        ("SUS_KABIR", "PHONE_9811001122", RelationType.OPERATES, "2024-01-10T10:00:00Z", 2.0),
        ("SUS_VIKRAM", "PHONE_9811002233", RelationType.OPERATES, "2024-01-11T11:00:00Z", 2.0),
        ("SUS_IMRAN", "PHONE_9811003344", RelationType.OPERATES, "2024-01-12T12:00:00Z", 2.0),
        ("SUS_DEEPAK", "PHONE_9811004455", RelationType.OPERATES, "2024-01-15T14:00:00Z", 2.0),
        ("SUS_SUNIL", "PHONE_9811005566", RelationType.OPERATES, "2024-01-16T15:00:00Z", 2.0),
        ("SUS_RAJESH", "PHONE_9811006677", RelationType.OPERATES, "2024-01-18T16:00:00Z", 2.0),
        ("SUS_VIKRAM", "VEH_DL01AB9988", RelationType.OWNS_VEHICLE, "2024-01-20T10:00:00Z", 1.5),

        # Link to Crime FIR
        ("SUS_KABIR", "CRIME_FIR_882", RelationType.ACCUSED_IN, "2024-02-01T09:00:00Z", 3.0),
        ("SUS_VIKRAM", "CRIME_FIR_882", RelationType.ACCUSED_IN, "2024-02-01T09:00:00Z", 3.0),
        ("SUS_IMRAN", "CRIME_FIR_882", RelationType.ACCUSED_IN, "2024-02-01T09:00:00Z", 3.0),

        # Call Relations (CDR)
        ("PHONE_9811001122", "PHONE_9811002233", RelationType.CALLED, "2024-02-10T14:20:00Z", 8.0),  # Kabir -> Vikram
        ("PHONE_9811001122", "PHONE_9811003344", RelationType.CALLED, "2024-02-12T15:45:00Z", 7.0),  # Kabir -> Imran
        ("PHONE_9811002233", "PHONE_9811006677", RelationType.CALLED, "2024-02-15T18:10:00Z", 6.0),  # Vikram -> Rajesh
        ("PHONE_9811002233", "PHONE_9811004455", RelationType.CALLED, "2024-02-18T19:30:00Z", 5.0),  # Vikram -> Deepak
        ("PHONE_9811005566", "PHONE_9811004455", RelationType.CALLED, "2024-02-20T21:00:00Z", 4.0),  # Sunil -> Deepak

        # Imran the Broker connecting Kabir/Vikram cell with Overseas & Mule cell
        ("PHONE_9811003344", "PHONE_9811002233", RelationType.CALLED, "2024-03-01T12:00:00Z", 5.0),

        # Mule Account Operations
        ("MULE_AMITABH", "ACC_9910112233", RelationType.OPERATES, "2024-03-05T10:00:00Z", 1.0),
        ("MULE_POOJA", "ACC_9910223344", RelationType.OPERATES, "2024-03-05T10:00:00Z", 1.0),
        ("MULE_KARAN", "ACC_9910334455", RelationType.OPERATES, "2024-03-05T10:00:00Z", 1.0),

        # Hawala Circular Money Transfers ($5L -> $4.8L -> $4.7L -> $5L loop!)
        ("ACC_9910112233", "ACC_9910223344", RelationType.TRANSFERRED_MONEY, "2024-03-10T11:15:00Z", 5.0),
        ("ACC_9910223344", "ACC_9910334455", RelationType.TRANSFERRED_MONEY, "2024-03-11T14:30:00Z", 4.8),
        ("ACC_9910334455", "ACC_9910112233", RelationType.TRANSFERRED_MONEY, "2024-03-12T16:45:00Z", 4.7),

        # Dispersal from Broker to Overseas A/C
        ("ACC_9910334455", "ACC_9910445566", RelationType.TRANSFERRED_MONEY, "2024-03-15T18:00:00Z", 12.0),
    ]

    for idx, (src, tgt, rel, ts, wt) in enumerate(edges_to_add):
        edge_id = f"EDGE_CHAKRA_{idx}"
        ref = EvidenceReference(
            doc_id=doc_fir if "SUS" in src else (doc_bank if "ACC" in src else doc_cdr),
            doc_sha256=sha_fir if "SUS" in src else (sha_bank if "ACC" in src else sha_cdr),
            source_type="INVESTIGATION",
            snippet=f"Confirmed link {rel.value} between {src} and {tgt} on {ts}",
            confidence=0.95
        )
        graph_engine.add_edge(
            GraphEdge(
                id=edge_id,
                source=src,
                target=tgt,
                relation=rel,
                timestamp=ts,
                weight=wt,
                properties={"evidence_doc": ref.doc_id},
                evidence_refs=[ref]
            )
        )

    # Pre-calculate graph analytics
    graph_engine.calculate_analytics()
    return len(graph_engine.node_store)
