# Project Memory: CRIMEGRAPH AI

This document tracks the live operational state, milestones, and active focus of the project.

---

## 1. Project Status Overview
- **Active Phase:** Phase 8: Version 3.0 Apex (AI Link Prediction, Spatio-Temporal GIS Telemetry, OSINT & Investigator Copilot)
- **Current Milestone:** Version 3.0 Apex fully implemented, tested, verified, and running.
- **Health:** Optimal / Operational (All 23/23 tests passing)
- **Git Branch:** `main`

---

## 2. Completed Milestones
- [x] Initialized Git repository and created root `.gitignore` & `.env.example`.
- [x] Authored complete 10-document engineering blueprint (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `DECISIONS.md`, `MEMORY.md`, `TEST_PLAN.md`, `SECURITY.md`, `DEVSECOPS.md`).
- [x] Implemented Python FastAPI backend with Pydantic v2 schemas and DevSecOps controls.
- [x] Built `IngestionEngine` supporting CDR CSVs, Bank Transaction CSVs, and Police FIR PDFs/TXTs.
- [x] Implemented `EntityExtractor` tailored for Indian phone numbers, vehicle registration plates, IFSCs, UTRs, and BNS/IPC sections.
- [x] Implemented `IdentityFusionEngine` powered by Fellegi-Sunter / Splink methodology with Indian Soundex phonetic encoding and Tri-State resolution.
- [x] Implemented `GraphEngine` with NetworkX in-memory core, PageRank, Betweenness Centrality, Louvain Community Detection, and Hawala circular loop detection ($A \rightarrow B \rightarrow C \rightarrow A$).
- [x] Built `TamperEvidentLedger` featuring append-only SHA-256 hash chains and **Section 63 Bharatiya Sakshya Adhiniyam (BSA) 2023** certificate generator.
- [x] Implemented React + TypeScript + Vite + Tailwind CSS frontend with Cytoscape.js dark tactical intelligence workstation.
- [x] Implemented **Network Time Machine** temporal replay slider.
- [x] Implemented **Evidence Grounding Drawer** with document offset verification.
- [x] Implemented **BSA 2023 Section 63 Court Certificate Modal** and **Audit Ledger Merkle Chain Viewer**.
- [x] Created synthetic gold-standard benchmark dataset (*Operation Chakra-Net*).
- [x] Added synthetic intercepted surveillance dataset `fun.csv` (Krish, Manish, and Afnan across Deogiri & MGM sectors).
- [x] Implemented **Version 2.0 (Forensic Intelligence & Real-Time Stream)**:
  - Acoustic Audio Intercept Engine with normalized waveform generation and keyword spotting.
  - Sub-second Forensic Intelligence Dossier generator with printable Section 63 BSA 2023 court report.
  - Server-Sent Events (SSE) live telecommunication intercept stream with real-time graph mutation.
  - Cryptographic HMAC-SHA256 signature seals and zero-trust security hardening.
- [x] Implemented **Version 3.0 Apex (NCRB Women Safety & AI Predictive Platform)**:
  - **NCRB Women Safety Priority Syndicate (*Operation Rakshak*)**: Human trafficking, cyber grooming, extortion nexus under BNS 2023 (Sec 143, 78, 111, 70).
  - **AI Heuristic Link Prediction Engine**: Adamic-Adar Index, Jaccard Coefficient, and Resource Allocation uncovering covert relationships between suspects who deliberately avoid direct calls.
  - **Spatio-Temporal Co-Location Engine**: Tower dump proximity analysis detecting physical meetings within $\le 15$ min windows independent of phone calls.
  - **Social Media & Chat Intelligence (OSINT)**: Telegram/WhatsApp parser extracting virtual handles (`@shadow_lead`), crypto wallets (BTC/ETH/USDT-TRC20), and coded threat phraseology.
  - **Natural Language Investigator Copilot**: Multi-turn "Chat with Knowledge Graph" with automated graph traversals, citations, and BNS 2023 legal guidance.
  - **Interactive Geo-Spatial GIS Map View**: Vector map with cellular tower nodes, pulsing rendezvous hotspots, and color-coded suspect transit trajectories.
- [x] Validated with automated test suite: **23/23 tests passing**.
- [x] Automated SAST audit: **Bandit 0 High/Medium issues across 3,448 lines of code**.
- [x] Verified frontend build: **TypeScript + Vite built in 471ms with 0 errors**.
- [x] Documented all operational decisions (ADR-001 through ADR-016) in `docs/DECISIONS.md` and created `docs/VERSION_3.md`.


---

## 3. How to Run the System

### Backend (Terminal 1)
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
*API Swagger Documentation: `http://localhost:8000/docs`*

### Frontend (Terminal 2)
```bash
cd frontend
npm.cmd run dev
```
*Tactical Workstation: `http://localhost:5173`*

### Or One-Command Docker Deployment
```bash
docker-compose up --build
```
