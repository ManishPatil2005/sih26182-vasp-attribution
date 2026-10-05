import time
import hashlib
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    GraphNode,
    GraphEdge,
    EntityType,
    RelationType,
    EvidenceReference,
    CryptoHop,
    CryptoPeelingFlow,
    CryptoOffRamp
)
from app.storage.graph_engine import GraphEngine
from app.storage.audit_ledger import audit_ledger


class CryptoForensicsEngine:
    """
    Web3 & Darknet Crypto-Hawala Forensics Engine:
    Tracks on-chain peeling chains, mixer hops (Tornado/ChipMixer),
    and crypto-to-fiat P2P cashout off-ramps linking darknet wallets to Indian bank mule accounts.
    Complies with Theme: Blockchain & Cybersecurity.
    """

    def __init__(self):
        self.flows: List[CryptoPeelingFlow] = []
        self.off_ramps: List[CryptoOffRamp] = []
        self._initialize_sovereign_crypto_datasets()

    def _initialize_sovereign_crypto_datasets(self) -> None:
        """Seeds known benchmark darknet escrow flows and fiat off-ramps for SIH26182 multi-hop tracing validation."""
        # 1. Flow 1: Benchmark Cyber Extortion & Ransom Peeling Chain (USDT TRC-20)
        rakshak_hops = [
            CryptoHop(
                tx_hash="0x3f9a72b0c11488deca91823901429810ef89a112001928340192834019283401",
                from_address="TXYZ98aDarknetVictimEscrow01",
                to_address="TX991AfnanBrokerColdWallet01",
                amount=75000.0,
                token="USDT-TRC20",
                timestamp="2026-09-20T10:15:00Z",
                hop_index=1,
                is_off_ramp=False
            ),
            CryptoHop(
                tx_hash="0x88ab102948192834019284918239014812093840192834019283490182390123",
                from_address="TX991AfnanBrokerColdWallet01",
                to_address="TX552PeelingIntermediaryMixer",
                amount=74850.0,
                token="USDT-TRC20",
                timestamp="2026-09-20T12:30:00Z",
                hop_index=2,
                is_off_ramp=False
            ),
            CryptoHop(
                tx_hash="0xbc91029481928340192849182390148120938401928340192834901823904455",
                from_address="TX552PeelingIntermediaryMixer",
                to_address="0xBinanceP2P_Merchant_Desk_IND",
                amount=25000.0,
                token="USDT-TRC20",
                timestamp="2026-09-21T14:45:00Z",
                hop_index=3,
                is_off_ramp=True,
                off_ramp_entity="Binance P2P Merchant -> HDFC_MULE_VIKRAM"
            ),
            CryptoHop(
                tx_hash="0xcc91029481928340192849182390148120938401928340192834901823906677",
                from_address="TX552PeelingIntermediaryMixer",
                to_address="0xWazirX_OTC_Desk_Kolkata",
                amount=30000.0,
                token="USDT-TRC20",
                timestamp="2026-09-21T16:20:00Z",
                hop_index=4,
                is_off_ramp=True,
                off_ramp_entity="WazirX OTC Desk -> SBI_MULE_MEERA"
            )
        ]

        flow1 = CryptoPeelingFlow(
            flow_id="FLOW-RAKSHAK-USDT-001",
            origin_wallet="TXYZ98aDarknetVictimEscrow01",
            syndicate_owner="Afnan & Vikram (Operation Rakshak)",
            total_laundered_usd=75000.0,
            chain="TRON (TRC-20 USDT)",
            hops=rakshak_hops,
            tainted_score=0.96,
            destination_mule_account="ACC_HDFC_991823 (Vikram Rathore)"
        )

        # 2. Flow 2: Benchmark Hawala Bitcoin Tumbler (BTC)
        chakra_hops = [
            CryptoHop(
                tx_hash="7f9a88bcde102948192834019283401928340192834019283401928340192834",
                from_address="bc1qDubaiHawalaDispatch001",
                to_address="bc1qKabirSheikhTumblerPool",
                amount=2.45,
                token="BTC",
                timestamp="2026-09-18T09:00:00Z",
                hop_index=1,
                is_off_ramp=False
            ),
            CryptoHop(
                tx_hash="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
                from_address="bc1qKabirSheikhTumblerPool",
                to_address="bc1qCoinDCX_P2P_MumbaiCashout",
                amount=1.20,
                token="BTC",
                timestamp="2026-09-19T11:15:00Z",
                hop_index=2,
                is_off_ramp=True,
                off_ramp_entity="CoinDCX P2P Desk -> ICICI_MULE_CHANDNI"
            )
        ]

        flow2 = CryptoPeelingFlow(
            flow_id="FLOW-CHAKRA-BTC-002",
            origin_wallet="bc1qDubaiHawalaDispatch001",
            syndicate_owner="Farooq Mansoor & Kabir Sheikh",
            total_laundered_usd=162000.0,
            chain="BITCOIN (BTC)",
            hops=chakra_hops,
            tainted_score=0.92,
            destination_mule_account="ACC_ICICI_882910 (Chandni Chowk Line)"
        )

        self.flows = [flow1, flow2]

        # 3. Off-Ramp Registries linking Crypto to Indian Fiat Bank Accounts
        self.off_ramps = [
            CryptoOffRamp(
                off_ramp_id="OFFRAMP-BN-001",
                exchange_name="Binance P2P Escrow",
                wallet_address="0xBinanceP2P_Merchant_Desk_IND",
                bank_account_number="ACC_HDFC_991823",
                account_holder="Vikram Rathore / Front: Shanti Enterprises",
                total_fiat_inr=2075000.0,
                kyc_pan="ABCDE1234F",
                evidence_block_hash="3f9a72b0c11488deca91823901429810ef89a112001928340192834019283401"
            ),
            CryptoOffRamp(
                off_ramp_id="OFFRAMP-WZ-002",
                exchange_name="WazirX OTC Settlement",
                wallet_address="0xWazirX_OTC_Desk_Kolkata",
                bank_account_number="ACC_SBI_334455",
                account_holder="Meera Sen / Front: Delta Placement Solutions",
                total_fiat_inr=2490000.0,
                kyc_pan="FGHIJ5678K",
                evidence_block_hash="88ab102948192834019284918239014812093840192834019283490182390123"
            ),
            CryptoOffRamp(
                off_ramp_id="OFFRAMP-CD-003",
                exchange_name="CoinDCX Instant P2P",
                wallet_address="bc1qCoinDCX_P2P_MumbaiCashout",
                bank_account_number="ACC_ICICI_882910",
                account_holder="Kabir Sheikh (Chandni Chowk Hawala Branch)",
                total_fiat_inr=7850000.0,
                kyc_pan="LMNOP9012Q",
                evidence_block_hash="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
            )
        ]

    def link_crypto_to_knowledge_graph(self, graph_engine: GraphEngine, officer_id: str = "OFFICER_CYBER_INTEL") -> Dict[str, Any]:
        """
        Dynamically projects crypto wallet nodes and transaction flow edges
        into the active Knowledge Graph, bridging Web3 addresses directly to Indian Bank Mule Accounts.
        """
        nodes_added = 0
        edges_added = 0

        # Ingest Wallets as Nodes
        for flow in self.flows:
            for hop in flow.hops:
                from_id = f"WALLET_{hop.from_address[:12]}"
                to_id = f"WALLET_{hop.to_address[:12]}"

                if from_id not in graph_engine.node_store:
                    graph_engine.add_node(GraphNode(
                        id=from_id,
                        type=EntityType.CRYPTO_WALLET,
                        label=f"{hop.token} Wallet ({hop.from_address[:8]}...)",
                        risk_score=flow.tainted_score,
                        properties={
                            "full_address": hop.from_address,
                            "token": hop.token,
                            "chain": flow.chain,
                            "syndicate": flow.syndicate_owner
                        }
                    ))
                    nodes_added += 1

                if to_id not in graph_engine.node_store:
                    graph_engine.add_node(GraphNode(
                        id=to_id,
                        type=EntityType.CRYPTO_WALLET,
                        label=f"{hop.token} Wallet ({hop.to_address[:8]}...)",
                        risk_score=flow.tainted_score,
                        properties={
                            "full_address": hop.to_address,
                            "token": hop.token,
                            "chain": flow.chain,
                            "is_off_ramp": hop.is_off_ramp,
                            "off_ramp_entity": hop.off_ramp_entity
                        }
                    ))
                    nodes_added += 1

                # Add Crypto Transfer Edge
                edge_id = f"CRYPTO_TX_{hop.tx_hash[:16]}"
                if edge_id not in graph_engine.edge_store:
                    graph_engine.add_edge(GraphEdge(
                        id=edge_id,
                        source=from_id,
                        target=to_id,
                        relation=RelationType.TRANSFERRED_CRYPTO,
                        properties={
                            "tx_hash": hop.tx_hash,
                            "amount": hop.amount,
                            "token": hop.token,
                            "timestamp": hop.timestamp,
                            "hop_index": hop.hop_index
                        },
                        timestamp=hop.timestamp,
                        weight=2.0,
                        evidence_refs=[
                            EvidenceReference(
                                doc_id=hop.tx_hash,
                                doc_sha256=hop.tx_hash,
                                source_type="BLOCKCHAIN_LEDGER",
                                snippet=f"On-chain transfer {hop.amount} {hop.token} from {hop.from_address} to {hop.to_address}"
                            )
                        ]
                    ))
                    edges_added += 1

        # Ingest Fiat Off-Ramp Bridges to Bank Accounts
        for off in self.off_ramps:
            wallet_id = f"WALLET_{off.wallet_address[:12]}"
            # Link to bank account node if it exists, or create bank account node
            bank_id = off.bank_account_number
            if bank_id not in graph_engine.node_store:
                graph_engine.add_node(GraphNode(
                    id=bank_id,
                    type=EntityType.ACCOUNT,
                    label=f"Mule Bank Acc: {off.bank_account_number}",
                    risk_score=0.92,
                    properties={
                        "account_holder": off.account_holder,
                        "pan": off.kyc_pan,
                        "bank_name": off.exchange_name
                    }
                ))
                nodes_added += 1

            bridge_edge_id = f"OFFRAMP_BRIDGE_{wallet_id}_{bank_id}"
            if bridge_edge_id not in graph_engine.edge_store:
                graph_engine.add_edge(GraphEdge(
                    id=bridge_edge_id,
                    source=wallet_id,
                    target=bank_id,
                    relation=RelationType.EXCHANGED_FIAT,
                    properties={
                        "exchange": off.exchange_name,
                        "fiat_inr": off.total_fiat_inr,
                        "kyc_pan": off.kyc_pan,
                        "off_ramp_id": off.off_ramp_id
                    },
                    weight=2.5,
                    evidence_refs=[
                        EvidenceReference(
                            doc_id=off.off_ramp_id,
                            doc_sha256=off.evidence_block_hash,
                            source_type="FIU_IND_SUSPICIOUS_TRANSACTION",
                            snippet=f"P2P Off-Ramp Settlement: ₹{off.total_fiat_inr:,.2f} INR credited from {off.exchange_name} to {off.bank_account_number}"
                        )
                    ]
                ))
                edges_added += 1

        # Commit to BSA 2023 audit ledger
        audit_ledger.append_entry(
            officer_id=officer_id,
            action="LINK_WEB3_CRYPTO_FORENSICS",
            target_id="GRAPH_ROOT",
            payload={
                "nodes_added": nodes_added,
                "edges_added": edges_added,
                "flows_mapped": len(self.flows),
                "off_ramps_mapped": len(self.off_ramps)
            }
        )

        return {
            "success": True,
            "nodes_added": nodes_added,
            "edges_added": edges_added,
            "flows_count": len(self.flows),
            "off_ramps_count": len(self.off_ramps)
        }


# Global singleton instance
crypto_engine = CryptoForensicsEngine()
