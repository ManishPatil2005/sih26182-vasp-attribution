# Task Breakdown & Execution Roadmap: CRIMEGRAPH AI

All tasks follow the strict vibe coding lifecycle:
`UNDERSTAND -> PLAN -> IMPLEMENT -> TEST -> REVIEW -> COMMIT -> UPDATE DOCS`

---

## Phase 0: Setup & DevSecOps Baseline
- [x] **TASK-001**: Initialize Git repository and standard root directories.
- [x] **TASK-002**: Create `.gitignore` and `.env.example` configurations.
- [x] **TASK-003**: Create foundational documentation (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`).
- [x] **TASK-004**: Create remaining architecture documentation (`DECISIONS.md`, `MEMORY.md`, `TEST_PLAN.md`, `SECURITY.md`, `DEVSECOPS.md`).
- [x] **TASK-005**: Setup `.cursor/rules/` and GitHub Actions DevSecOps workflow (`.github/workflows/devsecops.yml`).

---

## Phase 1: Backend Architecture & Ingestion Engine
- [x] **TASK-006**: Initialize FastAPI backend structure (`backend/app/main.py`, `core/config.py`, `models/schemas.py`).
- [x] **TASK-007**: Implement `IngestionEngine` supporting CDR CSVs, Bank Transaction CSVs, and FIR Text/PDFs.
- [x] **TASK-008**: Implement Indian entity extraction pipeline (Regex + Heuristics for Phones, IMEIs, UTRs, Indian names, BNS/IPC sections).
- [x] **TASK-009**: Implement evidence provenance tagger (character spans, document SHA-256 calculation).
- [x] **TASK-010**: Create unit tests for Ingestion and Entity Extraction in `backend/tests/test_ingestion.py`.

---

## Phase 2: Splink Identity Fusion & Knowledge Graph
- [x] **TASK-011**: Build `IdentityFusionEngine` using probabilistic matching (Soundex, Jaro-Winkler, multi-attribute linkage).
- [x] **TASK-012**: Implement Tri-State resolution logic (Auto-Merge $\ge 0.80$, Human Triage $0.50-0.80$, Isolate $< 0.50$).
- [x] **TASK-013**: Implement `GraphEngine` with NetworkX in-memory core and Neo4j bidirectional sync adapter.
- [x] **TASK-014**: Define standard graph entities (`Suspect`, `Phone`, `Account`, `Location`, `CrimeIncident`) and edge handlers (`CALLED`, `TRANSFERRED`, `ASSOCIATED_WITH`).
- [x] **TASK-015**: Unit tests for Identity Fusion and Graph insertion in `backend/tests/test_identity_fusion.py`.

---

## Phase 3: AI Graph Analytics, Centrality & Motifs
- [x] **TASK-016**: Implement Centrality algorithms:
  - Degree Centrality (Operative activity)
  - PageRank Centrality (Hidden mastermind detection)
  - Betweenness Centrality (Hawala broker & courier identification)
- [x] **TASK-017**: Implement Community Detection (Louvain modularity algorithm to isolate syndicate sub-cells).
- [x] **TASK-018**: Implement Suspicious Motif Detectors:
  - Circular Hawala Money Flow Detector ($A \rightarrow B \rightarrow C \rightarrow A$)
  - Mule Account Smurfing Detector
  - Burner Phone Chain Detector
- [x] **TASK-019**: Implement Network Time Machine query engine ($\mathcal{G}(t_{start}, t_{end})$ time-slice filtering).
- [x] **TASK-020**: Unit & scenario tests for graph analytics in `backend/tests/test_graph_analytics.py`.

---

## Phase 4: Cryptographic Audit Chain & BSA 2023 Compliance
- [x] **TASK-021**: Implement `TamperEvidentLedger` using SHA-256 hash chaining (Genesis block, prev_hash linking, payload hashing).
- [x] **TASK-022**: Implement ledger verification engine to detect any retroactive data tampering.
- [x] **TASK-023**: Build Section 63 Bharatiya Sakshya Adhiniyam (BSA) 2023 Digital Certificate Generator endpoint.
- [x] **TASK-024**: Implement Zero-Trust Role-Based Access Control (RBAC) middleware for IO, Lead SP, and Auditor.
- [x] **TASK-025**: Unit tests for ledger integrity and certificate generation in `backend/tests/test_audit_chain.py`.

---

## Phase 5: Tactical Intelligence Dashboard (Frontend)
- [x] **TASK-026**: Initialize React + TypeScript + Vite + Tailwind CSS frontend in `frontend/`.
- [x] **TASK-027**: Build `GraphCanvas` component powered by Cytoscape.js with custom dark intelligence styling.
- [x] **TASK-028**: Build `NetworkTimeMachine` dual-slider temporal scrubber component.
- [x] **TASK-029**: Build `EvidenceDrawer` component displaying source document quotes, confidence scores, and hash tokens.
- [x] **TASK-030**: Build `AnalyticsPanel` showing Masterminds, Hawala Brokers, and Mule Account alerts.

---

## Phase 6: Synthetic Syndicate Dataset & Pitch Demo Polish
- [x] **TASK-031**: Generate realistic Indian crime syndicate dataset (*Operation Chakra-Net*: Cyber Fraud & Narcotics ring across Delhi, Jamtara, Mumbai, Dubai).
- [x] **TASK-032**: Integrate full-stack demo with one-click "Load Operation Chakra-Net" scenario.
- [x] **TASK-033**: Create production Dockerfile and `docker-compose.yml` for unified one-command deployment.
- [x] **TASK-034**: Write comprehensive SIH Pitch Script & Evaluator Demonstration Guide in `README.md`.
- [x] **TASK-035**: Final end-to-end verification, SAST audit (Bandit 0 issues, Flake8 0 errors, Pytest 11/11 passing), and build benchmark.
