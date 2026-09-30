import math
import networkx as nx
from typing import List, Dict, Any, Tuple
from app.storage.graph_engine import graph_engine
from app.models.schemas import EntityType


class LinkPredictionEngine:
    """
    AI Heuristic Link Prediction Engine (Version 3.0):
    Discovers covert and hidden relationships between suspects who deliberately
    avoid direct phone communication by analyzing structural network topologies:
    1. Adamic-Adar Index (penalizes high-degree common intermediaries)
    2. Jaccard Coefficient (shared neighborhood overlap ratio)
    3. Resource Allocation Index
    """

    def predict_hidden_links(self, top_k: int = 10) -> List[Dict[str, Any]]:
        G = graph_engine.graph.to_undirected()
        nodes = graph_engine.node_store

        if len(G.nodes) < 3:
            return []

        # Focus on Person-to-Person non-adjacent candidate pairs
        person_nodes = [
            n_id for n_id, node in nodes.items()
            if node.type == EntityType.PERSON
        ]

        candidate_pairs = []
        for i in range(len(person_nodes)):
            for j in range(i + 1, len(person_nodes)):
                u, v = person_nodes[i], person_nodes[j]
                if not G.has_edge(u, v):
                    candidate_pairs.append((u, v))

        # If few person pairs, also include phone-to-person candidate pairs
        if len(candidate_pairs) < 3:
            all_non_edges = list(nx.non_edges(G))
            candidate_pairs = all_non_edges[:30]

        predictions = []

        for u, v in candidate_pairs:
            u_neighbors = set(G.neighbors(u)) if u in G else set()
            v_neighbors = set(G.neighbors(v)) if v in G else set()
            common = list(u_neighbors.intersection(v_neighbors))

            if not common:
                continue

            # 1. Jaccard Coefficient: |N(u) ∩ N(v)| / |N(u) ∪ N(v)|
            union_len = len(u_neighbors.union(v_neighbors))
            jaccard = len(common) / union_len if union_len > 0 else 0.0

            # 2. Adamic-Adar: sum(1 / log(deg(w))) for w in common
            adamic_adar = 0.0
            for w in common:
                deg = G.degree(w)
                if deg > 1:
                    adamic_adar += 1.0 / math.log(deg)

            # 3. Resource Allocation: sum(1 / deg(w)) for w in common
            resource_alloc = 0.0
            for w in common:
                deg = G.degree(w)
                if deg > 0:
                    resource_alloc += 1.0 / deg

            # Composite Hidden Association Probability (0.0 to 1.0)
            prob_score = min(0.98, max(0.40, (0.45 * jaccard + 0.35 * min(1.0, adamic_adar / 2.0) + 0.20 * min(1.0, resource_alloc))))

            common_labels = [nodes[w].label if w in nodes else w for w in common]
            u_node = nodes.get(u)
            v_node = nodes.get(v)

            predictions.append({
                "source_id": u,
                "source_label": u_node.label if u_node else u,
                "target_id": v,
                "target_label": v_node.label if v_node else v,
                "hidden_link_probability": round(prob_score, 3),
                "confidence_level": "VERY HIGH" if prob_score >= 0.80 else ("HIGH" if prob_score >= 0.60 else "MEDIUM"),
                "common_intermediates": common_labels,
                "common_neighbors_count": len(common),
                "jaccard_score": round(jaccard, 3),
                "adamic_adar_score": round(adamic_adar, 3),
                "reasoning": (
                    f"Suspects have zero direct calls but share {len(common)} covert conduits "
                    f"({', '.join(common_labels[:3])}), indicating intentional communication decoupling."
                )
            })

        predictions.sort(key=lambda x: x["hidden_link_probability"], reverse=True)
        return predictions[:top_k]


link_prediction_engine = LinkPredictionEngine()
