# CRIMEGRAPH AI Version 4.0 (Sovereign Edition) Specification

**Problem Statement ID:** 26189 | **Title:** AI-Powered Criminal Network Analysis System  
**Organization:** Ministry of Home Affairs (MHA)  
**Department:** National Crime Records Bureau (NCRB), Women Safety Division  
**Category:** Software | **Theme:** Blockchain & Cybersecurity  
**Repository:** [https://github.com/ManishPatil2005/crimegraph-ai](https://github.com/ManishPatil2005/crimegraph-ai)

---

## 1. Executive Summary & Sovereign Edition Mandate

Building upon the foundations of Version 1.0 (Core Graph & BSA 2023 Ledger), Version 2.0 (Audio diaritization, SSE streaming & Dossier engine), and Version 3.0 (National Scale 2B monitoring, 10 Lakh watchlist, Link prediction & GIS map), **Version 4.0 (Sovereign Edition)** delivers game-changing operational capabilities for national security leadership and intelligence taskforces:

1. **Web3 & Darknet Crypto-Hawala Forensics (`crypto_engine.py`)**:
   - Ingests and tracks on-chain cryptocurrency transactions across Bitcoin (`bc1...`), Ethereum (`0x...`), and Tron TRC-20 USDT (`TX...`).
   - Identifies **Peeling Chains**, **Darknet Mixing / Tumbler hops** (Tornado Cash, ChipMixer patterns), and **Crypto-to-Fiat P2P On/Off-Ramp Bridges** linking anonymous wallets directly to Indian bank mule accounts (e.g. Binance P2P, WazirX, CoinDCX).
   - Injects `CRYPTO_WALLET` nodes and `TRANSFERRED_CRYPTO` / `EXCHANGED_FIAT` edges directly into the Knowledge Graph, committing on-chain TX hashes to the Section 63 BSA 2023 audit ledger.

2. **Target Neutralization & Syndicate Disruption Planner (`disruption_engine.py`)**:
   - Algorithmic graph resilience analysis calculating the **Syndicate Disruption Index (SDI)** ($0\% - 100\%$).
   - Detects **Articulation Points (Cut Vertices)**: Single points of failure whose removal instantly fractures the syndicate into isolated, non-functional cells.
   - Computes **Optimal Joint Strike Set (Top-$k$ Interdictions)**: Recommends the exact minimal set of simultaneous arrests (e.g., "Arresting `SUSP-V03` (Afnan) and `SUSP-V01` (Tanya) simultaneously severs 18 direct channels and achieves $84.2\%$ syndicate paralysis").

3. **Multi-Agency Federated Collaboration & Need-to-Know Compartmentalization (`agency_rbac.py`)**:
   - Role-Based Access Control (RBAC) with 4 security clearance profiles:
     - `MHA_APEX_COMMAND`: Full unrestricted national overview and warrant authority.
     - `NCRB_WOMEN_SAFETY`: Anti-human trafficking and cyber safety division lead view.
     - `NIA_TERROR_FINANCE`: Special terror financing, hawala, and crypto intelligence.
     - `STATE_POLICE_IO`: Operational field officer clearance where sensitive undercover intelligence assets are automatically redacted as `[REDACTED_COVERT_ASSET_DELTA]` under the Official Secrets Act & Section 63 BSA 2023.

---

## 2. API Endpoints Reference

### Web3 & Crypto Forensics:
- `GET /api/v1/crypto/flows`: Returns detected crypto peeling flows and mixer trajectories.
- `GET /api/v1/crypto/off-ramps`: Returns P2P exchange cashout bridges to Indian bank accounts with KYC PANs.
- `POST /api/v1/crypto/link-graph`: Dynamically projects crypto wallets and transactions into Cytoscape.
- `POST /api/v1/crypto/ingest`: Ingests custom on-chain transaction data.

### Disruption & Strike Planner:
- `POST /api/v1/disruption/simulate`: Simulates target removals and calculates SDI, severed edges, and giant component collapse.
- `GET /api/v1/disruption/optimal-targets`: Returns ranked mathematically optimal simultaneous strike recommendations.
- `GET /api/v1/disruption/articulation-points`: Lists single points of failure (cut vertices).
- `GET /api/v1/disruption/agencies`: Returns available multi-agency clearance profiles.

---

## 3. Verification & Benchmark Summary

- **Automated Tests:** 43/43 tests passing in `backend/tests/` (including 7 specialized V4 tests in `test_v4_features.py`).
- **DevSecOps SAST Audit:** Bandit: 0 High, 0 Medium security vulnerabilities across 5,532 lines of code.
- **Frontend Build:** Built with Vite and TypeScript in `408ms with 0 errors`.
