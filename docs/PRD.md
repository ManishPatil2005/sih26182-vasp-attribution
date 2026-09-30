# Product Requirements Document (PRD)

## Product: CRIMEGRAPH AI
**Subtitle:** Connecting the Dots. Revealing Hidden Networks.  
**Problem Statement ID:** 26189  
**Organization:** Ministry of Home Affairs (MHA), Government of India  
**Department:** National Crime Records Bureau (NCRB), Women Safety Division  
**Category:** Software | **Theme:** Blockchain & Cybersecurity  

---

## 1. Executive Summary & Problem Context
Modern criminal enterprises—operating across narcotics syndicates, cyber-fraud operations, human trafficking, and organized extortion—no longer function via isolated actors. They operate as dynamic, decentralized networks leveraging:
- Intermediaries, money mules, and Hawala operators.
- Disposable SIM cards (burner phones) and IMEI-hopping techniques.
- Layered financial transactions across multiple banking and UPI entities.
- Distributed geographic rendezvous and crime scene locations.

### The Investigative Bottleneck
Law enforcement agencies (State Police Crime Branches, CBI, NIA, ED, Cybercrime units) collect vast amounts of multi-source data:
- **Unstructured:** FIRs, witness testimonies, interrogation transcripts, court records, intelligence memos.
- **Structured:** Call Detail Records (CDRs), Cell Tower Dumps, Bank Account transaction sheets, and Vahan vehicle registries.

Currently, Investigating Officers (IOs) manually sift through PDFs and Excel spreadsheets. This manual analysis creates:
1. **Critical Blind Spots:** Missing indirect relationships (e.g., Suspect A calls Suspect B, who transfers funds to Suspect C, who rents a hideout with Suspect D).
2. **Identity Fragmentation:** The same suspect appearing under multiple aliases or typos across different police stations (e.g., "Vikram @ Vicky", "Bikram Singh", "V. K. Singh").
3. **Severe Delays:** It can take weeks to reconstruct a 15-person syndicate hierarchy, during which key operators abscond or evidence is destroyed.
4. **Admissibility Vulnerabilities:** Evidence chains produced manually often struggle to meet strict court standards under Section 63 of the **Bharatiya Sakshya Adhiniyam (BSA), 2023** (governing admissibility of electronic records).

---

## 2. Target Users & Stakeholder Personas

| Persona | Role & Organization | Primary Jobs to be Done | Key Pain Points |
| :--- | :--- | :--- | :--- |
| **Investigating Officer (IO)** | Sub-Inspector / Inspector, Crime Branch / Special Cell | Ingest case files, extract suspects, find phone/account links, trace movements. | Overwhelmed by 500+ page CDRs and contradictory FIRs; tight remand deadlines. |
| **Superintendent of Police / Lead Analyst** | SP / DySP / Joint Director, HQ Intelligence | Review syndicate hierarchies, detect kingpins vs. low-level couriers, allocate raid resources. | Needs high-level visual graph, community breakdown, and risk scoring to approve operations. |
| **Cybercrime / Financial Analyst** | Sub-Inspector, Cyber Forensic Lab / ED | Trace money laundering loops, Hawala money flows, mule account clusters, burner phone chains. | Hard to map 10,000+ UPI/NEFT transactions to physical phone numbers and tower locations. |
| **Public Prosecutor / Legal Advisor** | State Prosecution Department | Present evidence in court; satisfy BSA 2023 Section 63 digital integrity standards. | Electronic evidence challenged in court over lack of verifiable chain-of-custody. |

---

## 3. Product Vision & Value Proposition
CRIMEGRAPH AI transforms fragmented, unstructured, and structured investigative data into an **evidence-grounded, dynamic Knowledge Graph** that automatically discovers hidden relationships, isolates influential masterminds, predicts missing connections, and maintains an unalterable cryptographic audit chain for legal proceedings.

---

## 4. Key Differentiators (The 4 Pillars)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CRIMEGRAPH AI CORE                                │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ 1. IDENTITY FUSION   │ 2. NETWORK TIME      │ 3. EVIDENCE-GROUNDED           │
│    ENGINE (Splink)   │    MACHINE           │    EXPLAINABILITY              │
│ Probabilistic record │ 4D interactive       │ Zero black-box links: every    │
│ linkage resolving    │ temporal scrubber to │ edge connects directly to raw  │
│ aliases & phonetics  │ replay syndicate     │ document span & confidence %   │
│ with human review.   │ evolution.           │                                │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ 4. TAMPER-EVIDENT AUDIT CHAIN (BSA 2023 Sec 63 Compliance)                   │
│ Cryptographic SHA-256 hash chaining verifying chain-of-custody for court.    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: Multi-Source Data Ingestion & Normalization
- **FIR & Report Ingestion:** Ingest PDF, scanned images, and TXT files. Support dual-language scripts (English and Hindi transliteration common in Indian FIRs).
- **Structured Data Connectors:** Ingest standardized CSV/Excel formats for:
  - CDR (Caller MSISDN, Receiver MSISDN, IMEI, IMSI, Call Duration, Cell Tower ID, Date-Time).
  - Cell Tower Dumps (Tower ID, Lat, Lng, Associated Azimuth).
  - Bank Transactions (Sender A/C, Receiver A/C, IFSC, Amount, UTR/Transaction Ref, Mode: NEFT/RTGS/UPI).
  - Vehicle Data (Vehicle Reg No, Owner Name, Engine/Chassis No).

### FR-2: AI Extraction & Named Entity Recognition (NER)
- Extract entities with confidence scores:
  - `PERSON` (Suspect, Victim, Witness, Associate)
  - `PHONE` (Mobile Numbers, IMEIs, IMSIs)
  - `ACCOUNT` (Bank Account Numbers, UPI IDs, Crypto Wallets)
  - `VEHICLE` (Registration Numbers, Model, Color)
  - `LOCATION` (Addresses, GPS coordinates, Police Station limits)
  - `ORGANIZATION` (Gangs, Front companies, Shell entities)
  - `EVENT` (Crime incidents, Meetings, Drop-offs)

### FR-3: Probabilistic Identity Fusion Engine
- Deduplicate and resolve identities using the Fellegi-Sunter model (via **Splink**):
  - Phonetic matching: Double Metaphone / Soundex for Indian names ("Vikram" vs "Bikram").
  - Multi-attribute linking: Same phone + shared co-suspect + matching address.
  - Three-tier triage:
    - **Score > 0.85:** Auto-merge candidate nodes with logged justification.
    - **Score 0.60 - 0.85:** Flagged in "Human-in-the-Loop" triage queue for IO confirmation.
    - **Score < 0.60:** Kept isolated.

### FR-4: Graph Analytics & Intelligence Algorithms
- **Centrality Metrics:**
  - *Degree Centrality:* High-activity operatives.
  - *PageRank:* Hidden masterminds receiving indirect influence.
  - *Betweenness Centrality:* Cut-points, cross-cell couriers, and Hawala brokers bridging disconnected gangs.
- **Community Detection:**
  - Louvain / Leiden modularity optimization to partition suspects into operational sub-cells.
- **Suspicious Motif Detection:**
  - Hawala money laundering loops ($A \rightarrow B \rightarrow C \rightarrow A$).
  - Smurfing / structuring (multiple deposits just below mandatory reporting thresholds).
  - Burner phone relays (rapid succession of single-use numbers linked to the same IMEI).

### FR-5: Legal Admissibility & Tamper-Evident Audit Chain
- Cryptographic SHA-256 ledger recording every:
  - Evidence upload (with source file SHA-256 hash).
  - Entity merge or manual modification.
  - User search, export, or query event.
- **BSA 2023 Section 63 Digital Evidence Certificate:** One-click generation of the legally compliant certificate with cryptographic checksums, timestamp, and IO digital sign-off.

### FR-6: Tactical Investigator Dashboard
- Graph canvas with pan, zoom, node clustering, physics layout, and search-by-entity.
- Time Machine slider (filter events by date/hour window).
- Side drawer displaying source evidence snippets and confidence breakdown.
- Export case report in PDF / JSON formats.

---

## 6. Non-Functional Requirements (NFRs)
- **Performance:** Ingestion and graph rendering of 10,000 nodes and 25,000 edges in $< 2.5$ seconds.
- **Availability & Air-Gapped Feasibility:** Designed to operate fully on-premise without external cloud dependencies (critical for police intranet / CCTNS secured environments).
- **Security:** Zero-Trust architecture, Role-Based Access Control (RBAC), TLS 1.3 in transit, AES-256 for evidence at rest.
- **Auditability:** Immutability of ledger logs; any tampering invalidates the hash chain immediately.

---

## 7. MVP Scope vs. Future Roadmap

### MVP (Hackathon Deliverable)
- [x] Ingestion pipeline for FIR PDFs, CDR CSVs, and Bank CSVs.
- [x] Entity extraction (regex + NLP/heuristics for Indian entities).
- [x] Splink-inspired probabilistic alias & identity fusion.
- [x] Interactive Cytoscape.js dark-mode intelligence dashboard.
- [x] NetworkX / Neo4j graph engine with PageRank, Betweenness, and Community Detection.
- [x] Network Time Machine (temporal scrubbing).
- [x] Tamper-evident SHA-256 audit ledger.
- [x] BSA 2023 Section 63 Certificate export.

### Out of Scope for MVP
- Live CCTNS statewide database wire-tap integration (restricted government APIs).
- Automated facial recognition from CCTV camera video streams.
- Multi-million node distributed cluster setup (Kafka + Neo4j Enterprise cluster).

---

## 8. Success Criteria & Evaluation Rubric Alignment

| Evaluation Criteria | Target Metric | How We Exceed |
| :--- | :--- | :--- |
| **Innovation & Relevance** | High evaluator impact | Directly solves MHA NCRB PS 26189 with 4 novel differentiators. |
| **Technical Competence** | Robust architecture | Hybrid Graph (NetworkX + Neo4j), Splink entity resolution, and SHA-256 audit chains. |
| **Feasibility & Usability** | Instant demo execution | Ready-to-demo synthetic syndicate scenario (*Operation Chakra-Net*) with live time machine. |
| **Legal Admissibility** | BSA 2023 Compliance | Auto-generates certified Section 63 electronic evidence reports. |
| **Security & DevSecOps** | Zero CVEs, automated CI | End-to-end SAST, Secret Scanning, containerization, and RBAC enforcement. |
