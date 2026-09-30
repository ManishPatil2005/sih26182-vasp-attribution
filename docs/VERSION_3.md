# CRIMEGRAPH AI Version 3.0 (Apex) Specification

**Problem Statement ID:** 26189 | **Title:** AI-Powered Criminal Network Analysis System  
**Organization:** Ministry of Home Affairs (MHA)  
**Department:** National Crime Records Bureau (NCRB), Women Safety Division  
**Category:** Software | **Theme:** Blockchain & Cybersecurity  
**Repository:** [https://github.com/ManishPatil2005/crimegraph-ai](https://github.com/ManishPatil2005/crimegraph-ai)

---

## 1. Executive Summary & Ministry Strategic Alignment

Version 1.0 established our multi-source ingestion, knowledge graph, and Section 63 BSA 2023 tamper-evident Merkle ledger.  
Version 2.0 delivered audio call recording intelligence, Real-Time Analytics (RTA) SSE streaming, and sub-second court dossier generation.

**Version 3.0 (Apex)** directly addresses the core mandate of the **NCRB Women Safety Division** and fills all remaining functional gaps identified in the Smart India Hackathon problem statement:

1. **NCRB Women Safety Syndicate Scenario (*Operation Rakshak*)**:
   - Models an inter-state human trafficking, cyber-stalking, and deepfake extortion cartel operating across Delhi, Aurangabad, Mumbai, and Kolkata.
   - Grounded in **Bharatiya Nyaya Sanhita (BNS) 2023** Sections:
     - Section 143 (Human Trafficking)
     - Section 78 (Stalking & Cyber-Harassment)
     - Section 111 (Organised Crime)
     - Section 70 (Aggravated Offenses against Women)
     - IT Act Section 67A (Transmission of Obscene/Sexually Explicit Content)

2. **AI Heuristic Link Prediction Engine (Hidden Association Discovery)**:
   - Criminal conspirators deliberately avoid direct telecommunication calls.
   - Our Link Prediction Engine computes:
     - **Adamic-Adar Index**: Heavily penalizes common neighbors that are chatterboxes, highlighting shared covert intermediaries.
     - **Jaccard Coefficient**: Measures neighbor overlap relative to total contacts.
     - **Resource Allocation Index**: Simulates resource transmission across bipartite communication paths.
   - Outputs a **Hidden Link Probability Score** ($0.0 - 1.0$) with common intermediary paths.

3. **Spatio-Temporal Co-Location Engine (Tower Dump Analysis)**:
   - Processes cellular tower dumps containing hundreds of IMEI/IMSI pings.
   - Identifies suspects co-present at the same cell tower within a $\le 15\text{ min}$ window during crime event windows, creating `CO_LOCATED_AT` edges.

4. **Social Media & Chat Intelligence (OSINT)**:
   - Ingests Telegram channel exports, WhatsApp forensics, and virtual handles (`@shadow_lead`, UPI IDs, burner crypto vouchers).

5. **Natural Language Investigator Copilot ("Chat with Knowledge Graph")**:
   - In-app conversational AI assistant answering plain English questions:
     - *"Who is the kingpin funding the transit safehouse?"*
     - *"Show all money transfers above 5 Lakhs involving Afnan"*
     - *"Find hidden links to Krish"*
     - *"Show Women Safety Division cases under BNS Section 143"*

6. **Interactive Geo-Spatial GIS Map View**:
   - Geographic visualization plotting mobile towers, safehouses, transit nodes, and crime scenes on an interactive vector map.

7. **Multi-Source Intelligence Ingestion Hub (All 7 Police Data Sources)**:
   - FIRs & Police Reports (PDF/TXT)
   - Call Detail Records (CDRs) (CSV)
   - Financial Transaction Records (Bank UTR CSV)
   - Field Surveillance Reports & Vehicle Stakeout Logs (TXT/CSV)
   - Social Media & OSINT Chat Transcripts (Telegram/WhatsApp TXT)
   - Criminal History Databases (CCTNS / ICJS dossiers)
   - Intelligence Agency Reports (Multi-Agency Center MAC Top-Secret Bulletins)

8. **Network Connection Pathfinder (Shortest Evidentiary Chain)**:
   - Traces multi-hop shortest paths between any two suspects with step-by-step evidence citations, relationship weights, and one-click canvas highlighting.

9. **Syndicate Command Hierarchy Matrix**:
   - 4-Tier organizational classification: Tier 1 (Masterminds/Kingpins), Tier 2 (Cross-Cell Brokers), Tier 3 (Logistics & Enforcers), Tier 4 (Front Organizations & Mules).

10. **Problem Statement 26189 100% Compliance Matrix**:
    - Dedicated audit dashboard in the UI mapping every single mandate from the Ministry of Home Affairs to its implemented feature and automated verification test.
