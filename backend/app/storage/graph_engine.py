import networkx as nx
from typing import List, Dict, Any, Optional, Tuple

from app.models.schemas import (
    GraphNode,
    GraphEdge,
    EntityType,
    AnalyticsSummary,
)
from app.storage.audit_ledger import audit_ledger


class GraphEngine:
    """
    Hybrid Graph Engine for Criminal Network Intelligence:
    Uses NetworkX in-memory core for sub-second analytical execution,
    supporting PageRank, Betweenness, Louvain communities, and Hawala cycle detection.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self.node_store: Dict[str, GraphNode] = {}
        self.edge_store: Dict[str, GraphEdge] = {}

    def clear(self):
        self.graph.clear()
        self.node_store.clear()
        self.edge_store.clear()

    def add_node(self, node: GraphNode) -> None:
        self.node_store[node.id] = node
        self.graph.add_node(
            node.id,
            type=node.type.value,
            label=node.label,
            risk_score=node.risk_score,
            properties=node.properties
        )

    def add_edge(self, edge: GraphEdge) -> None:
        self.edge_store[edge.id] = edge
        self.graph.add_edge(
            edge.source,
            edge.target,
            id=edge.id,
            relation=edge.relation.value,
            weight=edge.weight,
            timestamp=edge.timestamp,
            properties=edge.properties
        )

    def merge_nodes(self, canonical_id: str, duplicate_id: str, officer_id: str) -> bool:
        """
        Merges duplicate_id into canonical_id:
        Re-wires all edges, merges aliases, updates audit ledger.
        """
        if canonical_id not in self.node_store or duplicate_id not in self.node_store:
            return False

        canonical = self.node_store[canonical_id]
        duplicate = self.node_store[duplicate_id]

        # Merge aliases
        aliases = set(canonical.properties.get("aliases", []))
        aliases.add(duplicate.label)
        aliases.update(duplicate.properties.get("aliases", []))
        canonical.properties["aliases"] = list(aliases)

        # Merge evidence refs
        canonical.evidence_refs.extend(duplicate.evidence_refs)

        # Rewire in-edges
        in_edges = list(self.graph.in_edges(duplicate_id, data=True))
        for u, v, data in in_edges:
            self.graph.add_edge(u, canonical_id, **data)

        # Rewire out-edges
        out_edges = list(self.graph.out_edges(duplicate_id, data=True))
        for u, v, data in out_edges:
            self.graph.add_edge(canonical_id, v, **data)

        # Remove duplicate from graph and store
        self.graph.remove_node(duplicate_id)
        del self.node_store[duplicate_id]

        # Log merge action to audit ledger
        audit_ledger.append_entry(
            officer_id=officer_id,
            action="MERGE_ENTITIES",
            target_id=canonical_id,
            payload={"canonical": canonical_id, "merged_duplicate": duplicate_id}
        )

        return True

    def calculate_analytics(self) -> AnalyticsSummary:
        """
        Executes PageRank, Betweenness Centrality, Degree Centrality,
        and Louvain-style Community Detection on the network.
        """
        if len(self.graph.nodes) == 0:
            return AnalyticsSummary(
                total_nodes=0,
                total_edges=0,
                masterminds=[],
                brokers=[],
                communities={},
                suspicious_motifs=[]
            )

        # 1. Degree Centrality
        degree_dict = nx.degree_centrality(self.graph)

        # 2. PageRank (Syndicate Masterminds - based on overall network influence)
        try:
            undirected = self.graph.to_undirected()
            pagerank_dict = nx.pagerank(undirected, weight="weight")
        except Exception:
            pagerank_dict = {n: 1.0 / len(self.graph.nodes) for n in self.graph.nodes}

        # 3. Betweenness Centrality (Cross-gang Brokers & Couriers)
        try:
            betweenness_dict = nx.betweenness_centrality(self.graph, weight="weight")
        except Exception:
            betweenness_dict = {n: 0.0 for n in self.graph.nodes}

        # 4. Closeness Centrality (Speed of information propagation across cells)
        try:
            closeness_dict = nx.closeness_centrality(undirected)
        except Exception:
            closeness_dict = {n: 0.0 for n in self.graph.nodes}

        # Update node metadata
        for node_id in self.graph.nodes:
            if node_id in self.node_store:
                self.node_store[node_id].centrality = {
                    "degree": round(degree_dict.get(node_id, 0.0), 4),
                    "pagerank": round(pagerank_dict.get(node_id, 0.0), 4),
                    "betweenness": round(betweenness_dict.get(node_id, 0.0), 4),
                    "closeness": round(closeness_dict.get(node_id, 0.0), 4),
                }
                # Composite Multi-Factor Risk: 35% PageRank + 30% Betweenness + 20% Degree + 15% Closeness
                composite_risk = (
                    0.35 * pagerank_dict.get(node_id, 0.0) * len(self.graph.nodes) * 0.25 +
                    0.30 * betweenness_dict.get(node_id, 0.0) * 2.0 +
                    0.20 * degree_dict.get(node_id, 0.0) +
                    0.15 * closeness_dict.get(node_id, 0.0)
                )
                self.node_store[node_id].risk_score = min(1.0, round(composite_risk, 2))

        # 5. Community Detection (Sub-gang segregation)
        communities: Dict[int, List[str]] = {}
        try:
            comm_sets = nx.community.greedy_modularity_communities(undirected)
            for idx, comm in enumerate(comm_sets):
                comm_list = list(comm)
                communities[idx] = comm_list
                for n_id in comm_list:
                    if n_id in self.node_store:
                        self.node_store[n_id].community_id = idx
        except Exception:
            communities = {0: list(self.graph.nodes)}

        # Rank Masterminds (specifically PERSON entities)
        person_pagerank = [
            (n_id, score) for n_id, score in pagerank_dict.items()
            if n_id in self.node_store and self.node_store[n_id].type == EntityType.PERSON
        ]
        sorted_pagerank = sorted(person_pagerank, key=lambda x: x[1], reverse=True)
        sorted_betweenness = sorted(betweenness_dict.items(), key=lambda x: x[1], reverse=True)
        sorted_closeness = sorted(closeness_dict.items(), key=lambda x: x[1], reverse=True)

        masterminds = [
            {
                "node_id": n_id,
                "label": self.node_store[n_id].label if n_id in self.node_store else n_id,
                "type": self.node_store[n_id].type.value if n_id in self.node_store else "UNKNOWN",
                "pagerank_score": round(score, 4),
                "risk_score": self.node_store[n_id].risk_score if n_id in self.node_store else 0.0
            }
            for n_id, score in sorted_pagerank[:5]
        ]

        brokers = [
            {
                "node_id": n_id,
                "label": self.node_store[n_id].label if n_id in self.node_store else n_id,
                "type": self.node_store[n_id].type.value if n_id in self.node_store else "UNKNOWN",
                "betweenness_score": round(score, 4)
            }
            for n_id, score in sorted_betweenness[:5] if score > 0.0
        ]

        closeness_leaders = [
            {
                "node_id": n_id,
                "label": self.node_store[n_id].label if n_id in self.node_store else n_id,
                "type": self.node_store[n_id].type.value if n_id in self.node_store else "UNKNOWN",
                "closeness_score": round(score, 4)
            }
            for n_id, score in sorted_closeness[:5] if score > 0.0
        ]

        # Multi-Factor Threats
        person_threats = [
            {
                "node_id": n.id,
                "label": n.label,
                "role": n.properties.get("role", "ACCUSED"),
                "risk_score": n.risk_score,
                "centrality": n.centrality
            }
            for n in self.node_store.values() if n.type == EntityType.PERSON
        ]
        multi_factor_threats = sorted(person_threats, key=lambda x: x["risk_score"], reverse=True)[:5]

        # 6. Suspicious Motifs (Hawala loops, Smurfing, Burners)
        motifs = self.detect_motifs()

        return AnalyticsSummary(
            total_nodes=len(self.graph.nodes),
            total_edges=len(self.graph.edges),
            masterminds=masterminds,
            brokers=brokers,
            closeness_leaders=closeness_leaders,
            multi_factor_threats=multi_factor_threats,
            communities=communities,
            suspicious_motifs=motifs
        )

    def detect_motifs(self) -> List[Dict[str, Any]]:
        """
        Detects specific criminal topologies:
        1. Circular Hawala Fund Flow: A -> B -> C -> A
        2. Smurfing / High Fan-Out Dispersal: Rapid layering across mule accounts
        3. Nocturnal Pre-Incident Reconnaissance at critical locations
        4. Covert Communication Decoupling
        """
        motifs = []

        # 1. Circular Hawala loops
        try:
            cycles = list(nx.simple_cycles(self.graph))
            for cycle in cycles:
                if 3 <= len(cycle) <= 5:
                    cycle_labels = [self.node_store[n].label if n in self.node_store else n for n in cycle]
                    cycle_path = " -> ".join(cycle_labels)
                    motifs.append({
                        "motif_type": "CIRCULAR_HAWALA_LOOP",
                        "severity": "CRITICAL",
                        "nodes": cycle,
                        "description": (
                            f"Detected circular fund/communication routing between {len(cycle)} entities: "
                            f"{cycle_path} -> {cycle_labels[0]}"
                        )
                    })
        except Exception:
            pass

        # 2. Smurfing / Fan-out dispersal
        for node_id in self.graph.nodes:
            out_degree = self.graph.out_degree(node_id)
            if out_degree >= 4:
                node = self.node_store.get(node_id)
                label = node.label if node else node_id
                node_type = node.type.value if node else "UNKNOWN"
                motifs.append({
                    "motif_type": "SMURFING_OR_FAN_OUT_DISPERSAL",
                    "severity": "HIGH",
                    "nodes": [node_id],
                    "description": (
                        f"Entity '{label}' ({node_type}) radiates {out_degree} outbound transactions/pings "
                        "(indicative of financial smurfing structuring or central dispatching)."
                    )
                })

        # 3. Pre-Incident Reconnaissance at Educational / Critical Infrastructure
        recon_nodes = [
            n for n in self.node_store.values()
            if n.type == EntityType.LOCATION and ("college" in n.label.lower() or "mgm" in n.label.lower() or "safehouse" in n.label.lower())
        ]
        for loc in recon_nodes:
            in_edges = [e for e in self.edge_store.values() if e.target == loc.id or e.source == loc.id]
            if len(in_edges) >= 2:
                suspect_names = []
                for e in in_edges:
                    peer_id = e.source if e.target == loc.id else e.target
                    peer = self.node_store.get(peer_id)
                    if peer and peer.type == EntityType.PERSON:
                        suspect_names.append(peer.label)
                if suspect_names:
                    motifs.append({
                        "motif_type": "PRE_INCIDENT_RECONNAISSANCE",
                        "severity": "CRITICAL",
                        "nodes": [loc.id],
                        "description": (
                            f"High-frequency physical/tower recon converged at '{loc.label}' by suspects: "
                            f"{', '.join(set(suspect_names))}."
                        )
                    })

        return motifs

    def find_pathway(self, source_id: str, target_id: str) -> Dict[str, Any]:
        """
        Network Connection Pathfinder:
        Finds the shortest evidentiary path and intermediate conduits connecting any two targets.
        """
        undirected = self.graph.to_undirected()
        if source_id not in undirected or target_id not in undirected:
            return {
                "source_id": source_id,
                "target_id": target_id,
                "connected": False,
                "path_length": 0,
                "node_sequence": [],
                "steps": [],
                "tactical_summary": "One or both entities not found in active Knowledge Graph."
            }

        try:
            path = nx.shortest_path(undirected, source=source_id, target=target_id)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return {
                "source_id": source_id,
                "target_id": target_id,
                "connected": False,
                "path_length": 0,
                "node_sequence": [],
                "steps": [],
                "tactical_summary": "No direct or indirect evidentiary path found between targets."
            }

        steps = []
        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            u_node = self.node_store.get(u)
            v_node = self.node_store.get(v)
            edge_match = next(
                (e for e in self.edge_store.values() if (e.source == u and e.target == v) or (e.source == v and e.target == u)),
                None
            )
            rel = edge_match.relation.value if edge_match else "CONNECTED_TO"
            weight = edge_match.weight if edge_match else 1.0
            ev_type = edge_match.evidence_refs[0].source_type if (edge_match and edge_match.evidence_refs) else "GRAPH_INFERENCE"

            steps.append({
                "step_number": i + 1,
                "from_node": u,
                "from_label": u_node.label if u_node else u,
                "relation": rel,
                "to_node": v,
                "to_label": v_node.label if v_node else v,
                "evidence_type": ev_type,
                "weight": round(weight, 2)
            })

        hops = len(path) - 1
        src_label = self.node_store[source_id].label if source_id in self.node_store else source_id
        tgt_label = self.node_store[target_id].label if target_id in self.node_store else target_id
        intermediate_labels = [self.node_store[n].label if n in self.node_store else n for n in path[1:-1]]
        inter_summary = f" via {', '.join(intermediate_labels)}" if intermediate_labels else " directly"

        return {
            "source_id": source_id,
            "target_id": target_id,
            "connected": True,
            "path_length": hops,
            "node_sequence": path,
            "steps": steps,
            "tactical_summary": f"Target '{src_label}' connects to '{tgt_label}' in {hops} hop(s){inter_summary}."
        }

    def get_syndicate_hierarchy(self) -> Dict[str, Any]:
        """
        Classifies active syndicate entities into operational hierarchy tiers.
        """
        tiers = {
            "tier_1_masterminds": [],
            "tier_2_brokers": [],
            "tier_3_specialists": [],
            "tier_4_fronts_and_mules": [],
        }

        for node in self.node_store.values():
            if node.type == EntityType.PERSON:
                role_desc = str(node.properties.get("role", "")).lower()
                if node.risk_score >= 0.90 or "mastermind" in role_desc or "kingpin" in role_desc:
                    tiers["tier_1_masterminds"].append({
                        "node_id": node.id,
                        "label": node.label,
                        "role_category": "KINGPIN / MASTERMIND",
                        "threat_level": "CRITICAL",
                        "risk_score": node.risk_score,
                        "influence_summary": "Directs overall syndicate operations and financial escrows."
                    })
                elif (node.centrality.get("betweenness", 0.0) >= 0.15 or "broker" in role_desc):
                    tiers["tier_2_brokers"].append({
                        "node_id": node.id,
                        "label": node.label,
                        "role_category": "CROSS-CELL BROKER",
                        "threat_level": "HIGH",
                        "risk_score": node.risk_score,
                        "influence_summary": "Bridges communication and logistics between decoupled cells."
                    })
                elif ("supplier" in role_desc or "logistics" in role_desc or "sim" in role_desc):
                    tiers["tier_3_specialists"].append({
                        "node_id": node.id,
                        "label": node.label,
                        "role_category": "LOGISTICS & SIM SUPPLIER",
                        "threat_level": "HIGH",
                        "risk_score": node.risk_score,
                        "influence_summary": "Procures false KYC credentials, burner SIMs, and hardware."
                    })
                elif ("enforcer" in role_desc or "transit" in role_desc or "surveillance" in role_desc or "recon" in role_desc):
                    tiers["tier_3_specialists"].append({
                        "node_id": node.id,
                        "label": node.label,
                        "role_category": "FIELD ENFORCER & RECON",
                        "threat_level": "MEDIUM",
                        "risk_score": node.risk_score,
                        "influence_summary": "Executes physical surveillance, safehouse transit, and intimidation."
                    })
                else:
                    tiers["tier_4_fronts_and_mules"].append({
                        "node_id": node.id,
                        "label": node.label,
                        "role_category": "ASSOCIATE / MULE",
                        "threat_level": "LOW",
                        "risk_score": node.risk_score,
                        "influence_summary": "Peripheral account holder or contact."
                    })
            elif node.type in [EntityType.ACCOUNT, EntityType.ORGANIZATION]:
                tiers["tier_4_fronts_and_mules"].append({
                    "node_id": node.id,
                    "label": node.label,
                    "role_category": "SHELL FRONT / MULE CHANNEL",
                    "threat_level": "HIGH" if node.risk_score >= 0.80 else "MEDIUM",
                    "risk_score": node.risk_score,
                    "influence_summary": "Illicit financial layering and corporate concealment vehicle."
                })

        return {
            "status": "SUCCESS",
            "total_entities_classified": sum(len(v) for v in tiers.values()),
            "hierarchy": tiers
        }

    def query_temporal_subgraph(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """
        Network Time Machine:
        Returns graph slice active between start_date and end_date.
        """
        if not start_date and not end_date:
            return list(self.node_store.values()), list(self.edge_store.values())

        active_edges: List[GraphEdge] = []
        active_node_ids = set()

        for edge in self.edge_store.values():
            if not edge.timestamp:
                active_edges.append(edge)
                active_node_ids.add(edge.source)
                active_node_ids.add(edge.target)
                continue

            ts = edge.timestamp[:10]  # YYYY-MM-DD
            if start_date and ts < start_date:
                continue
            if end_date and ts > end_date:
                continue

            active_edges.append(edge)
            active_node_ids.add(edge.source)
            active_node_ids.add(edge.target)

        active_nodes = [self.node_store[nid] for nid in active_node_ids if nid in self.node_store]
        return active_nodes, active_edges


graph_engine = GraphEngine()
