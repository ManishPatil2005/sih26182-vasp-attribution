from datetime import datetime
from app.models.schemas import GraphNode, GraphEdge, EntityType, RelationType, EvidenceReference
from app.storage.graph_engine import graph_engine


def load_ncrb_operation_rakshak() -> dict:
    """
    Loads 'Operation Rakshak' (Version 3.0 Apex):
    NCRB Women Safety Priority Syndicate dataset addressing Problem Statement 26189.
    Synthesizes an organized human trafficking, cyber-grooming, and digital extortion
    racket operating across Maharashtra corridors under Bharatiya Nyaya Sanhita (BNS) 2023.
    Incorporates all 7 law enforcement data sources and all 7 entity types.
    """
    graph_engine.clear()

    # 7 MULTI-SOURCE EVIDENCE REFERENCES
    ref_fir = EvidenceReference(
        doc_id="FIR-2024-AUR-WOMEN-SAFETY-882.pdf",
        doc_sha256="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        source_type="FIR",
        snippet="FIR under BNS 143/78/111: Victim lured via fake overseas modeling placement agency",
        confidence=0.99
    )
    ref_cdr = EvidenceReference(
        doc_id="CDR_TOWER_DUMP_CSN_SERIES_4.csv",
        doc_sha256="b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1",
        source_type="CDR",
        snippet="Synchronized call and tower pings between +919822011111 and +919822022222",
        confidence=0.95
    )
    ref_bank = EvidenceReference(
        doc_id="BANK_UTR_HAWALA_SERIES_7.csv",
        doc_sha256="c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef2",
        source_type="BANK",
        snippet="Rapid velocity P2P layering: ₹8,50,000 transferred to Tether USDT crypto escrow",
        confidence=0.97
    )
    ref_surv = EvidenceReference(
        doc_id="SURVEILLANCE_LOG_STAKEOUT_CIDCO.txt",
        doc_sha256="d4e5f6a1b2c37890123456789abcdef0123456789abcdef0123456789abcdef3",
        source_type="SURVEILLANCE",
        snippet="Physical stakeout spotted White Scorpio MH-20-DE-1102 dropping package at CIDCO Safehouse",
        confidence=0.96
    )
    ref_osint = EvidenceReference(
        doc_id="OSINT_TELEGRAM_APEXELITE_VIP.txt",
        doc_sha256="e5f6a1b2c3d47890123456789abcdef0123456789abcdef0123456789abcdef4",
        source_type="OSINT_CHAT",
        snippet="Telegram channel @shadow_lead auctioning forged identity documents and overseas travel visas",
        confidence=0.92
    )
    ref_cctns = EvidenceReference(
        doc_id="CCTNS_CRIMINAL_HISTORY_DOSSIER_9912.txt",
        doc_sha256="f6a1b2c3d4e57890123456789abcdef0123456789abcdef0123456789abcdef5",
        source_type="CRIMINAL_HISTORY",
        snippet="CCTNS record: Habitual organized offender with 3 prior FIRs in Pune and Aurangabad",
        confidence=0.99
    )
    ref_intel = EvidenceReference(
        doc_id="MAC_SECRET_INTEL_BULLETIN_2026_09.txt",
        doc_sha256="a9b8c7d6e5f43210123456789abcdef0123456789abcdef0123456789abcdef6",
        source_type="INTEL_REPORT",
        snippet="Multi-Agency Center (MAC) alert: Interstate arms and trafficking conduit operating via Waluj MIDC",
        confidence=0.98
    )

    # 1. PERSON ENTITIES
    nodes = [
        GraphNode(
            id="SUSP-V01",
            label="Tanya Verma (@shadow_lead)",
            type=EntityType.PERSON,
            risk_score=0.96,
            properties={
                "role": "Syndicate Mastermind / Cyber Grooming Handler",
                "bns_sections": "BNS 111 (Organized Crime), BNS 143 (Trafficking), BNS 78 (Cyber-stalking)",
                "alias": "@shadow_lead",
                "phone": "+919822044444",
                "status": "Red Notice / Wanted",
                "threat_score": 96.0,
            },
            evidence_refs=[ref_fir, ref_osint]
        ),
        GraphNode(
            id="SUSP-V02",
            label="Kabir Mehta (@kabir_trans)",
            type=EntityType.PERSON,
            risk_score=0.89,
            properties={
                "role": "Enforcer & Cross-District Transit Operative",
                "bns_sections": "BNS 143 (Trafficking), BNS 70 (Extortion)",
                "vehicle": "MH-20-DE-1102 (White Scorpio)",
                "phone": "+919822055555",
                "threat_score": 89.0,
            },
            evidence_refs=[ref_surv, ref_cctns]
        ),
        GraphNode(
            id="SUSP-V03",
            label="Afnan Khan (Logistics & SIM Broker)",
            type=EntityType.PERSON,
            risk_score=0.86,
            properties={
                "role": "Mule Accounts, Burner SIMs & False KYC Documentation",
                "bns_sections": "BNS 336 (Forgery), BNS 111 (Organized Crime)",
                "phone": "+919822033333",
                "threat_score": 86.0,
            },
            evidence_refs=[ref_intel, ref_bank]
        ),
        GraphNode(
            id="SUSP-V04",
            label="Krish Sharma (Recon & Surveillance)",
            type=EntityType.PERSON,
            risk_score=0.79,
            properties={
                "role": "Physical Target Surveillance & Drone Spotting",
                "phone": "+919822011111",
                "notes": "Spotted at Deogiri College reconnaissance perimeter",
                "threat_score": 79.0,
            },
            evidence_refs=[ref_cdr, ref_surv]
        ),
        GraphNode(
            id="SUSP-V05",
            label="Manish Patil (Communications & Storage)",
            type=EntityType.PERSON,
            risk_score=0.82,
            properties={
                "role": "Safehouse Custodian & Encrypted Router Node",
                "phone": "+919822022222",
                "notes": "Liaison with MGM Sports Complex transit cache",
                "threat_score": 82.0,
            },
            evidence_refs=[ref_cdr, ref_intel]
        ),

        # 2. VEHICLE ENTITY
        GraphNode(
            id="VEH-SCORPIO-1102",
            label="Scorpio: MH-20-DE-1102",
            type=EntityType.VEHICLE,
            risk_score=0.84,
            properties={
                "registration_number": "MH-20-DE-1102",
                "make_model": "Mahindra Scorpio Classic (White)",
                "registered_owner": "Kabir Mehta (Forged RC)",
                "chassis_last4": "8812"
            },
            evidence_refs=[ref_surv]
        ),

        # 3. LOCATION ENTITIES
        GraphNode(
            id="LOC-CIDCO-SH",
            label="CIDCO Safehouse Sector 5",
            type=EntityType.LOCATION,
            risk_score=0.89,
            properties={
                "address": "Flat 304, Green View Apartments, CIDCO, Chhatrapati Sambhajinagar",
                "type": "Clandestine Confinement Safehouse",
                "tower_ref": "TWR-CSN-03",
                "threat_score": 89.0,
            },
            evidence_refs=[ref_surv, ref_cdr]
        ),
        GraphNode(
            id="LOC-DEOGIRI-JNC",
            label="Deogiri College Perimeter Zone",
            type=EntityType.LOCATION,
            risk_score=0.76,
            properties={
                "address": "Station Road, Near Deogiri Campus, Chhatrapati Sambhajinagar",
                "type": "High-Density Student Recon Area",
                "tower_ref": "TWR-CSN-02",
                "threat_score": 76.0,
            },
            evidence_refs=[ref_cdr]
        ),
        GraphNode(
            id="LOC-MGM-HUB",
            label="MGM Sports Complex Gateway",
            type=EntityType.LOCATION,
            risk_score=0.73,
            properties={
                "address": "N-6 CIDCO / Airport Road, Chhatrapati Sambhajinagar",
                "type": "Public Drop Point & Escort Transit Hub",
                "tower_ref": "TWR-CSN-04",
                "threat_score": 73.0,
            },
            evidence_refs=[ref_cdr]
        ),

        # 4. ORGANIZATION / FRONT BUSINESS
        GraphNode(
            id="ORG-APEX-HR",
            label="Apex Talent Consultants (Front)",
            type=EntityType.ORGANIZATION,
            risk_score=0.93,
            properties={
                "registration": "MH-CSN-ROC-2024-88912",
                "role": "Fake overseas hospitality and modeling placement front",
                "bns_sections": "BNS 143 (Deceptive Recruitment Trafficking)",
                "threat_score": 93.0,
            },
            evidence_refs=[ref_fir, ref_osint]
        ),

        # 5. FINANCIAL / CRYPTO ACCOUNTS
        GraphNode(
            id="ACC-ICICI-MULE",
            label="ICICI Mule A/C: 4099-2819-3312",
            type=EntityType.ACCOUNT,
            risk_score=0.83,
            properties={
                "holder_alias": "Ramesh K. (Identity Themed)",
                "bank": "ICICI Bank Kranti Chowk Branch",
                "fiu_flag": "Suspicious Rapid Velocity Layering",
                "threat_score": 83.0,
            },
            evidence_refs=[ref_bank]
        ),
        GraphNode(
            id="ACC-USDT-ESCROW",
            label="Tether USDT: TXk9b...882p",
            type=EntityType.ACCOUNT,
            risk_score=0.96,
            properties={
                "wallet": "TXk9bV8mP2zQ7aL1wE5rY882pQ5a9Z1m7N",
                "network": "Tron TRC-20",
                "role": "Dark Web Ransom & Trafficking Escrow Settlement",
                "threat_score": 96.0,
            },
            evidence_refs=[ref_bank, ref_osint]
        ),

        # 6. PHONE / VIRTUAL COMMUNICATIONS
        GraphNode(
            id="COM-TG-RAKSHAK",
            label="Telegram Channel: 'ApexElite_VIP'",
            type=EntityType.PHONE,
            risk_score=0.91,
            properties={
                "platform": "Telegram Private Invite-Only",
                "creator": "@shadow_lead",
                "content_analysis": "Coded trafficking auctions and cyber-extortion payment proofs",
                "threat_score": 91.0,
            },
            evidence_refs=[ref_osint]
        ),

        # 7. CRIME INCIDENT / CCTNS RECORD
        GraphNode(
            id="CRIME-INCIDENT-AUR",
            label="Case: FIR-882/2024 (Anti-Trafficking)",
            type=EntityType.CRIME_INCIDENT,
            risk_score=0.95,
            properties={
                "incident_type": "Organized Human Trafficking & Digital Extortion",
                "statutory_act": "Bharatiya Nyaya Sanhita, 2023 (Sec 143, 78, 111)",
                "police_station": "Women Safety Cyber Cell, Chhatrapati Sambhajinagar"
            },
            evidence_refs=[ref_fir, ref_cctns]
        )
    ]

    for n in nodes:
        graph_engine.add_node(n)

    # RELATIONSHIPS (Covering all RelationTypes)
    now_str = datetime.utcnow().isoformat()
    edges = [
        # Accused in Crime Incident
        GraphEdge(
            id="EDG-R00",
            source="SUSP-V01",
            target="CRIME-INCIDENT-AUR",
            relation=RelationType.ACCUSED_IN,
            weight=1.0,
            timestamp=now_str,
            properties={"charge": "Mastermind & Principal Accused under BNS 111/143"},
            evidence_refs=[ref_fir]
        ),
        # Tanya controls Apex Front & Telegram Channel
        GraphEdge(
            id="EDG-R01",
            source="SUSP-V01",
            target="ORG-APEX-HR",
            relation=RelationType.ASSOCIATED_WITH,
            weight=0.98,
            timestamp=now_str,
            properties={"role": "Beneficial Owner & Director"},
            evidence_refs=[ref_fir]
        ),
        GraphEdge(
            id="EDG-R02",
            source="SUSP-V01",
            target="COM-TG-RAKSHAK",
            relation=RelationType.OPERATES,
            weight=0.95,
            timestamp=now_str,
            properties={"channel_admin": True},
            evidence_refs=[ref_osint]
        ),
        # Tanya instructs Kabir (Enforcer)
        GraphEdge(
            id="EDG-R03",
            source="SUSP-V01",
            target="SUSP-V02",
            relation=RelationType.CALLED,
            weight=0.88,
            timestamp=now_str,
            properties={"call_duration_seconds": 450, "frequency": 18},
            evidence_refs=[ref_cdr]
        ),
        # Kabir operates Scorpio vehicle & safehouse
        GraphEdge(
            id="EDG-R04A",
            source="SUSP-V02",
            target="VEH-SCORPIO-1102",
            relation=RelationType.OWNS_VEHICLE,
            weight=0.94,
            timestamp=now_str,
            properties={"evidence": "Spotted driving vehicle during surveillance"},
            evidence_refs=[ref_surv]
        ),
        GraphEdge(
            id="EDG-R04B",
            source="SUSP-V02",
            target="LOC-CIDCO-SH",
            relation=RelationType.CO_LOCATED_AT,
            weight=0.92,
            timestamp=now_str,
            properties={"evidence": "Cellular Tower TWR-CSN-03 Pings & Vehicle sightings"},
            evidence_refs=[ref_surv, ref_cdr]
        ),
        # Afnan Khan provides SIMs and Mule Accounts
        GraphEdge(
            id="EDG-R05",
            source="SUSP-V03",
            target="ACC-ICICI-MULE",
            relation=RelationType.TRANSFERRED_MONEY,
            weight=0.89,
            timestamp=now_str,
            properties={"role": "Account Provisioner & OTP Forwarder", "amount": 250000.0},
            evidence_refs=[ref_bank]
        ),
        GraphEdge(
            id="EDG-R06",
            source="SUSP-V03",
            target="SUSP-V01",
            relation=RelationType.ASSOCIATED_WITH,
            weight=0.85,
            timestamp=now_str,
            properties={"evidence": "Frequent Signal encrypted pings & burner distribution"},
            evidence_refs=[ref_intel]
        ),
        # Financial flows: ICICI Mule to USDT Escrow
        GraphEdge(
            id="EDG-R07",
            source="ACC-ICICI-MULE",
            target="ACC-USDT-ESCROW",
            relation=RelationType.TRANSFERRED_MONEY,
            weight=0.94,
            timestamp=now_str,
            properties={"amount": 850000.0, "currency": "INR to USDT P2P Transfer"},
            evidence_refs=[ref_bank]
        ),
        # Krish recon Deogiri & MGM
        GraphEdge(
            id="EDG-R08",
            source="SUSP-V04",
            target="LOC-DEOGIRI-JNC",
            relation=RelationType.CO_LOCATED_AT,
            weight=0.87,
            timestamp=now_str,
            properties={"evidence": "Tower TWR-CSN-02 recurring nocturnal pings"},
            evidence_refs=[ref_cdr]
        ),
        GraphEdge(
            id="EDG-R09",
            source="SUSP-V04",
            target="SUSP-V05",
            relation=RelationType.CALLED,
            weight=0.79,
            timestamp=now_str,
            properties={"call_count": 8, "notes": "Coordination on logistics cache"},
            evidence_refs=[ref_cdr]
        ),
        # Manish stores cache near MGM
        GraphEdge(
            id="EDG-R10",
            source="SUSP-V05",
            target="LOC-MGM-HUB",
            relation=RelationType.CO_LOCATED_AT,
            weight=0.81,
            timestamp=now_str,
            properties={"evidence": "Tower TWR-CSN-04 proximity pings"},
            evidence_refs=[ref_cdr]
        ),
        # Afnan supplies Manish at Waluj MIDC
        GraphEdge(
            id="EDG-R11",
            source="SUSP-V03",
            target="SUSP-V05",
            relation=RelationType.ASSOCIATED_WITH,
            weight=0.91,
            timestamp=now_str,
            properties={"evidence": "Physical handover co-location at Waluj MIDC"},
            evidence_refs=[ref_intel, ref_surv]
        ),
    ]

    for e in edges:
        graph_engine.add_edge(e)

    return {
        "status": "SUCCESS",
        "scenario": "Operation Rakshak - NCRB Women Safety Priority Syndicate",
        "nodes_loaded": len(nodes),
        "edges_loaded": len(edges),
        "target_mastermind": "Tanya Verma (@shadow_lead)",
        "syndicate_focus": "Organized Human Trafficking & Cyber Extortion Nexus (BNS 143/78/111)",
        "sources_represented": [
            "Police FIR Document",
            "Call Detail Records (CDRs)",
            "Financial Bank UTR Ledger",
            "Physical Stakeout Surveillance Log",
            "Telegram OSINT Channel Export",
            "CCTNS Criminal History Record",
            "Multi-Agency Center (MAC) Intel Bulletin"
        ]
    }
