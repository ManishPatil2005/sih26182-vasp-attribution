from app.engines.identity_fusion import identity_fusion, IndianSoundex
from app.models.schemas import GraphNode, EntityType


def test_indian_soundex_phonetic_invariance():
    # B/V sound variance common in Indian records
    code1 = IndianSoundex.encode("Vikram")
    code2 = IndianSoundex.encode("Bikram")
    assert code1 == code2, f"Soundex should match Vikram and Bikram, got {code1} and {code2}"


def test_splink_identity_fusion_candidate_evaluation():
    node_a = GraphNode(
        id="SUS_1",
        type=EntityType.PERSON,
        label="Vikram Malhotra",
        properties={"phone": "9811002233", "aliases": ["Vicky"]}
    )

    node_b = GraphNode(
        id="SUS_2",
        type=EntityType.PERSON,
        label="Bikram Malhotra",
        properties={"phone": "9811002233", "aliases": []}
    )

    score, matches, action = identity_fusion.evaluate_pair(node_a, node_b)

    assert score >= 0.85, f"Expected auto-merge candidate, got {score}"
    assert action == "AUTO_MERGE"
    assert "Shared Phone Number" in matches
