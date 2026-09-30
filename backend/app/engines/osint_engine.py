import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.schemas import EntityType, RelationType, GraphNode, GraphEdge, EvidenceReference
from app.storage.graph_engine import graph_engine


class OSINTEngine:
    """
    Social Media & Chat Intelligence Engine (Version 3.0):
    Parses unstructured chat exports (Telegram channels, WhatsApp groups, Signal messages)
    and social intelligence feeds:
    1. Extracts virtual identifiers: @handles, channel links, crypto wallets (BTC/USDT/ETH).
    2. Maps virtual handles to real-world suspect identities and phone numbers.
    3. Detects coded threat phraseology (consignment, payload, drop-off, burner, cleanup).
    4. Automatically integrates OSINT entities and relationships into the Knowledge Graph.
    """

    HANDLE_REGEX = re.compile(r"@[a-zA-Z0-9_]{3,32}")
    CRYPTO_BTC_REGEX = re.compile(r"\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b")
    CRYPTO_ETH_REGEX = re.compile(r"\b0x[a-fA-F0-9]{40}\b")
    CRYPTO_USDT_TRC_REGEX = re.compile(r"\bT[a-zA-HJ-NP-Z0-9]{24,34}\b")
    PHONE_REGEX = re.compile(r"\+?91[6-9]\d{9}")

    CODED_KEYWORDS = [
        "consignment", "package", "payload", "drop", "safehouse", "burner",
        "hawala", "strike", "explosive", "deogiri", "mgm", "detonator",
        "cleanup", "sim card", "fake passport", "hostage", "trafficking"
    ]

    def parse_chat_log(self, raw_text: str, platform: str = "Telegram", channel_name: str = "DarkOps_Channel") -> Dict[str, Any]:
        """
        Parses raw chat transcript text, extracting handles, crypto wallets,
        target locations, and intent signals.
        """
        lines = [line.strip() for line in raw_text.strip().split("\n") if line.strip()]
        extracted_handles = set()
        extracted_wallets = set()
        extracted_phones = set()
        detected_threat_lines = []
        messages_structured = []

        for line in lines:
            handles = self.HANDLE_REGEX.findall(line)
            phones = self.PHONE_REGEX.findall(line)
            btc = self.CRYPTO_BTC_REGEX.findall(line)
            eth = self.CRYPTO_ETH_REGEX.findall(line)
            usdt = self.CRYPTO_USDT_TRC_REGEX.findall(line)

            for h in handles:
                extracted_handles.add(h)
            for p in phones:
                extracted_phones.add(p)
            for w in btc + eth + usdt:
                extracted_wallets.add(w)

            lower_line = line.lower()
            matched_keywords = [kw for kw in self.CODED_KEYWORDS if kw in lower_line]

            is_threat = len(matched_keywords) > 0
            if is_threat:
                detected_threat_lines.append({
                    "raw_line": line,
                    "matched_keywords": matched_keywords,
                })

            messages_structured.append({
                "line": line,
                "handles": handles,
                "keywords": matched_keywords,
                "is_threat": is_threat,
            })

        return {
            "platform": platform,
            "channel_or_group": channel_name,
            "total_messages": len(lines),
            "threat_message_count": len(detected_threat_lines),
            "extracted_handles": sorted(list(extracted_handles)),
            "extracted_wallets": sorted(list(extracted_wallets)),
            "extracted_phones": sorted(list(extracted_phones)),
            "threat_signals": detected_threat_lines,
            "parsed_messages": messages_structured,
        }

    def ingest_osint_to_graph(self, osint_data: Dict[str, Any], link_to_suspect: Optional[str] = None) -> Dict[str, int]:
        """
        Synthesizes extracted OSINT entities (handles, crypto wallets, channels)
        directly into the active Knowledge Graph with semantic edges.
        """
        nodes_created = 0
        edges_created = 0
        now_str = datetime.utcnow().isoformat()

        doc_ref = EvidenceReference(
            doc_id=f"OSINT-{osint_data.get('platform', 'CHAT')}",
            doc_sha256="d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000",
            source_type="OSINT_CHAT",
            snippet=f"Extracted from {osint_data.get('channel_or_group', 'Channel')}",
            confidence=0.90
        )

        channel_id = f"CH-{abs(hash(osint_data['channel_or_group'])) % 100000}"
        if channel_id not in graph_engine.node_store:
            graph_engine.add_node(GraphNode(
                id=channel_id,
                label=osint_data["channel_or_group"],
                type=EntityType.PHONE,
                risk_score=0.75,
                properties={
                    "platform": osint_data["platform"],
                    "threat_messages": osint_data["threat_message_count"],
                    "osint_source": True,
                },
                evidence_refs=[doc_ref]
            ))
            nodes_created += 1

        for handle in osint_data.get("extracted_handles", []):
            handle_id = f"HDL-{handle.replace('@', '')}"
            if handle_id not in graph_engine.node_store:
                graph_engine.add_node(GraphNode(
                    id=handle_id,
                    label=handle,
                    type=EntityType.PERSON,
                    risk_score=0.80,
                    properties={
                        "handle": handle,
                        "source": osint_data["platform"],
                        "osint_alias": True,
                    },
                    evidence_refs=[doc_ref]
                ))
                nodes_created += 1

            edge_id = f"EDGE-{handle_id}-{channel_id}"
            if edge_id not in graph_engine.edge_store:
                graph_engine.add_edge(GraphEdge(
                    id=edge_id,
                    source=handle_id,
                    target=channel_id,
                    relation=RelationType.OPERATES,
                    weight=0.85,
                    timestamp=now_str,
                    properties={"channel": osint_data["channel_or_group"]},
                    evidence_refs=[doc_ref]
                ))
                edges_created += 1

            if link_to_suspect and link_to_suspect in graph_engine.node_store:
                alias_edge_id = f"EDGE-ALIAS-{link_to_suspect}-{handle_id}"
                if alias_edge_id not in graph_engine.edge_store:
                    graph_engine.add_edge(GraphEdge(
                        id=alias_edge_id,
                        source=link_to_suspect,
                        target=handle_id,
                        relation=RelationType.ASSOCIATED_WITH,
                        weight=0.95,
                        timestamp=now_str,
                        properties={"evidence": "OSINT Virtual Alias Linking"},
                        evidence_refs=[doc_ref]
                    ))
                    edges_created += 1

        for wallet in osint_data.get("extracted_wallets", []):
            wallet_id = f"WAL-{wallet[:10]}"
            if wallet_id not in graph_engine.node_store:
                graph_engine.add_node(GraphNode(
                    id=wallet_id,
                    label=f"Crypto:{wallet[:6]}...{wallet[-4:]}",
                    type=EntityType.ACCOUNT,
                    risk_score=0.85,
                    properties={
                        "wallet_address": wallet,
                        "network": "USDT-TRC20" if wallet.startswith("T") else ("BTC" if wallet.startswith("1") or wallet.startswith("bc1") else "ETH"),
                        "osint_extracted": True,
                    },
                    evidence_refs=[doc_ref]
                ))
                nodes_created += 1

            edge_id = f"EDGE-FUNDS-{channel_id}-{wallet_id}"
            if edge_id not in graph_engine.edge_store:
                graph_engine.add_edge(GraphEdge(
                    id=edge_id,
                    source=channel_id,
                    target=wallet_id,
                    relation=RelationType.TRANSFERRED_MONEY,
                    weight=0.90,
                    timestamp=now_str,
                    properties={"financial_channel": "Dark Web Escrow"},
                    evidence_refs=[doc_ref]
                ))
                edges_created += 1

        return {"nodes_created": nodes_created, "edges_created": edges_created}


osint_engine = OSINTEngine()
