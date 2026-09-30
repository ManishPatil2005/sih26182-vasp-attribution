import re
from typing import List, Tuple
from app.models.schemas import GraphNode, EntityType, SplinkMergeCandidate


class IndianSoundex:
    """
    Phonetic encoder adapted for common Indian name transliterations:
    Handles B/V interchanges (e.g. Vikram / Bikram), W/V, SH/S, PH/F.
    """
    TRANSFERS = [
        (re.compile(r'PH', re.IGNORECASE), 'F'),
        (re.compile(r'SH', re.IGNORECASE), 'S'),
        (re.compile(r'EE', re.IGNORECASE), 'I'),
        (re.compile(r'OO', re.IGNORECASE), 'U'),
        (re.compile(r'BH', re.IGNORECASE), 'B'),
        (re.compile(r'DH', re.IGNORECASE), 'D'),
        (re.compile(r'TH', re.IGNORECASE), 'T'),
        (re.compile(r'KH', re.IGNORECASE), 'K'),
        (re.compile(r'GH', re.IGNORECASE), 'G'),
        (re.compile(r'^[WV]', re.IGNORECASE), 'V'),
        (re.compile(r'^B', re.IGNORECASE), 'V'),  # Common North/East India phonetic variance
    ]

    @classmethod
    def encode(cls, name: str) -> str:
        if not name:
            return ""
        name = name.strip().upper()
        for pattern, replacement in cls.TRANSFERS:
            name = pattern.sub(replacement, name)

        # Standard Soundex encoding for remainder
        first = name[0]
        mapping = {
            'B': '1', 'F': '1', 'P': '1', 'V': '1',
            'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
            'D': '3', 'T': '3',
            'L': '4',
            'M': '5', 'N': '5',
            'R': '6'
        }
        encoded = [first]
        prev_code = mapping.get(first, '0')

        for char in name[1:]:
            code = mapping.get(char, '0')
            if code != '0' and code != prev_code:
                encoded.append(code)
            prev_code = code

        result = "".join(encoded).replace('0', '')
        return (result + "0000")[:4]


class IdentityFusionEngine:
    """
    Probabilistic Record Linkage Engine (inspired by Splink & Fellegi-Sunter methodology).
    Resolves fragmented identities, nicknames, and phonetic variants across police records.
    """

    def __init__(self, auto_merge_thresh: float = 0.80, review_thresh: float = 0.50):
        self.auto_merge_threshold = auto_merge_thresh
        self.review_threshold = review_thresh

    @staticmethod
    def jaro_winkler_similarity(s1: str, s2: str) -> float:
        """Calculates Jaro-Winkler string distance between two strings."""
        s1 = s1.lower().strip()
        s2 = s2.lower().strip()

        if s1 == s2:
            return 1.0
        if not s1 or not s2:
            return 0.0

        len1, len2 = len(s1), len(s2)
        match_distance = max(len1, len2) // 2 - 1

        s1_matches = [False] * len1
        s2_matches = [False] * len2
        matches = 0

        for i in range(len1):
            start = max(0, i - match_distance)
            end = min(i + match_distance + 1, len2)
            for j in range(start, end):
                if not s2_matches[j] and s1[i] == s2[j]:
                    s1_matches[i] = True
                    s2_matches[j] = True
                    matches += 1
                    break

        if matches == 0:
            return 0.0

        # Transpositions
        k = 0
        transpositions = 0
        for i in range(len1):
            if s1_matches[i]:
                while not s2_matches[k]:
                    k += 1
                if s1[i] != s2[k]:
                    transpositions += 1
                k += 1

        t = transpositions / 2.0
        jaro = (matches / len1 + matches / len2 + (matches - t) / matches) / 3.0

        # Winkler prefix bonus (up to 4 chars)
        prefix = 0
        for i in range(min(4, min(len1, len2))):
            if s1[i] == s2[i]:
                prefix += 1
            else:
                break

        return jaro + prefix * 0.1 * (1.0 - jaro)

    def evaluate_pair(self, node_a: GraphNode, node_b: GraphNode) -> Tuple[float, List[str], str]:
        """
        Calculates multi-attribute match score between two entities.
        Returns: (probability, matching_attributes, suggested_action)
        """
        if node_a.type != node_b.type:
            return 0.0, [], "ISOLATE"

        score = 0.0
        matches: List[str] = []

        # 1. Exact attribute matches
        phone_a = node_a.properties.get("phone") or (node_a.label if node_a.type == EntityType.PHONE else None)
        phone_b = node_b.properties.get("phone") or (node_b.label if node_b.type == EntityType.PHONE else None)
        if phone_a and phone_b and phone_a == phone_b:
            score += 0.50
            matches.append("Shared Phone Number")

        acc_a = node_a.properties.get("account_no")
        acc_b = node_b.properties.get("account_no")
        if acc_a and acc_b and acc_a == acc_b:
            score += 0.55
            matches.append("Shared Bank Account")

        # 2. Name & Alias similarity
        name_a = node_a.label
        name_b = node_b.label
        jw_name = self.jaro_winkler_similarity(name_a, name_b)

        if jw_name > 0.80:
            score += 0.40 * jw_name
            matches.append(f"Name Match ({int(jw_name * 100)}% JW)")

        # 3. Phonetic matching
        soundex_a = IndianSoundex.encode(name_a)
        soundex_b = IndianSoundex.encode(name_b)
        if soundex_a and soundex_b and soundex_a == soundex_b:
            score += 0.30
            matches.append(f"Phonetic Soundex Concordance ({soundex_a})")

        # 4. Check explicit aliases list
        aliases_a = node_a.properties.get("aliases", [])
        aliases_b = node_b.properties.get("aliases", [])
        alias_hit = False

        for a in [name_a] + aliases_a:
            for b in [name_b] + aliases_b:
                is_sub = a.lower() in b.lower() or b.lower() in a.lower()
                if a and b and (a.lower() == b.lower() or is_sub) and len(a) > 2 and len(b) > 2:
                    alias_hit = True
                    break

        if alias_hit:
            score += 0.35
            matches.append("Cross-Referenced Alias Match")

        # Cap score at 0.99
        final_score = min(0.99, score)

        if final_score >= self.auto_merge_threshold:
            action = "AUTO_MERGE"
        elif final_score >= self.review_threshold:
            action = "HUMAN_REVIEW"
        else:
            action = "ISOLATE"

        return final_score, matches, action

    def find_all_candidates(self, nodes: List[GraphNode]) -> List[SplinkMergeCandidate]:
        candidates: List[SplinkMergeCandidate] = []
        n = len(nodes)
        for i in range(n):
            for j in range(i + 1, n):
                score, matches, action = self.evaluate_pair(nodes[i], nodes[j])
                if action in ("AUTO_MERGE", "HUMAN_REVIEW"):
                    candidates.append(
                        SplinkMergeCandidate(
                            candidate_a=nodes[i],
                            candidate_b=nodes[j],
                            similarity_score=round(score, 3),
                            matching_attributes=matches,
                            suggested_action=action
                        )
                    )
        return candidates


identity_fusion = IdentityFusionEngine()
