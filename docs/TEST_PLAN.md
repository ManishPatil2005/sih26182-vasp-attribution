# Test Plan & Quality Assurance: CRIMEGRAPH AI

This document establishes the testing strategy, test suites, acceptance benchmarks, and automated test cases for CRIMEGRAPH AI.

---

## 1. Testing Strategy Overview

```
                      ▲
                     / \
                    /   \     E2E / Scenario Tests
                   / E2E \    (Operation Chakra-Net Benchmark)
                  /───────\
                 /         \   Integration Tests
                /Integration\  (Upload -> NER -> Graph -> Audit)
               /─────────────\
              /               \ Unit Tests
             /    Unit Tests   \(Parsers, Splink, Centrality, Hash Chain)
            /───────────────────\
```

---

## 2. Test Suites & Objectives

### 2.1 Unit Tests (`backend/tests/`)
1. **`test_ingestion.py`:**
   - Ingest CDR CSV with 50 rows; verify valid phone numbers are parsed and durations converted to seconds.
   - Ingest Bank CSV; verify UTR formatting and amount currency parsing.
   - Ingest FIR text snippet; verify entity extraction for Indian names, phone patterns, and BNS sections.
2. **`test_identity_fusion.py`:**
   - Test Soundex and Jaro-Winkler phonetic matching on Hindi/Indian name pairs:
     - ("Vikram Malhotra", "Vicky Malhotra") -> Expect similarity $> 0.80$.
     - ("Suresh Kumar", "Ramesh Kumar") -> Expect similarity $< 0.50$.
   - Test Tri-State classification (Auto-Merge vs Triage vs Isolate).
3. **`test_graph_analytics.py`:**
   - Graph with known star topology: Verify central node has highest Degree Centrality.
   - Graph with bridge node connecting two cliques: Verify bridge node has highest Betweenness Centrality.
   - Graph with circular flow ($A \rightarrow B \rightarrow C \rightarrow A$): Verify Hawala cycle detection detects cycle with length 3.
4. **`test_audit_chain.py`:**
   - Add 5 entries to `TamperEvidentLedger`; verify `verify_chain()` returns `True`.
   - Artificially mutate payload in Block #2; verify `verify_chain()` returns `False` and flags Block #2 as tampered.
   - Generate BSA 2023 Section 63 certificate; assert presence of SHA-256 checksums and officer declarations.

### 2.2 Integration Tests
- **Flow 1: End-to-End Ingestion to Graph:**
  `Upload raw CDR -> Parser -> Entity Extractor -> Graph Insert -> Verify nodes (PhoneNumber) and edges (CALLED) exist`.
- **Flow 2: Temporal Filtering:**
  `Query graph with time window [2024-01-01, 2024-03-01] -> Verify edges outside date range are excluded`.
- **Flow 3: Evidence Grounding Retrieval:**
  `Select edge (CALLED) -> Fetch evidence snippet -> Assert matching doc_id and character offset`.

### 2.3 Ground-Truth Syndicate Scenario Benchmark (*Operation Chakra-Net*)
The system is evaluated against a synthetic gold-standard criminal syndicate scenario:
- **Ground Truth Entities:** 14 Suspects, 8 Phone Numbers, 6 Mule Bank Accounts, 3 Crime Incidents.
- **Key Test Assertions:**
  1. Suspect **"Kabir Mehta @ The Architect"** must be detected as the top **PageRank** influencer ($Rank = 1$).
  2. Suspect **"Imran Qureshi"** (cross-cell courier) must have the highest **Betweenness Centrality** ($Rank = 1$).
  3. Mule accounts `A/C-9910` and `A/C-9911` must be detected in a **Smurfing / Structuring alert**.
  4. Phone numbers `9876543210` and `9876543211` used with IMEI `3528...` must trigger a **Burner Phone Relay alert**.

---

## 3. Automated Test Execution Commands

```bash
# Run complete test suite with coverage
cd backend
pytest -v --cov=app --cov-report=term-missing tests/

# Run specific test suites
pytest -v tests/test_ingestion.py
pytest -v tests/test_graph.py
pytest -v tests/test_analytics.py
pytest -v tests/test_audit.py

# Lint & Type Check
flake8 app/
mypy app/
bandit -r app/ -ll
```

---

## 4. Performance & Scalability Benchmarks

| Metric | Target SLA | Verification Method |
| :--- | :--- | :--- |
| **Ingestion Throughput** | $> 1,000$ CDR records / sec | Automated synthetic load test |
| **Graph Query Latency** | $< 250$ ms for 2-hop neighborhood | In-memory NetworkX benchmark |
| **Centrality Calculation** | $< 1.5$ s for 5,000 nodes | Execution timer in test suite |
| **Audit Verification** | $< 500$ ms for 10,000 block ledger | Vectorized SHA-256 verification |
| **UI Graph Render** | 60 FPS pan/zoom for 1,000 elements | Chrome DevTools Performance Profiler |
