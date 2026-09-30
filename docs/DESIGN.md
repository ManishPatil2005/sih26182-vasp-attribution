# Design System: CRIMEGRAPH AI

**System Aesthetic:** Dark Tactical Intelligence & Forensic Workstation  
**Inspiration:** Palantir Gotham, Analyst's Notebook, Bloomberg Terminal, Dark Glassmorphism  
**Target Environment:** 24/7 Police Control Rooms, Cyber Forensic Labs, Dimly-lit Intelligence War Rooms  

---

## 1. Visual Philosophy & Principles

1. **High Information Density with Zero Clutter:** Analysts must see network hubs, financial flows, and suspicious links without distracting decorative flair.
2. **Deterministic Color Coding for Threat Tiers:** Colors strictly represent operational meaning (e.g., Red = Mastermind/High Risk, Amber = Broker/Unverified, Cyan = Asset/Device, Emerald = Verified Legitimate).
3. **Evidence-First Feedback:** Every node click immediately anchors to a tangible evidence drawer showing why the link exists.
4. **Subdued Dark Palette:** Reduces ocular fatigue during multi-hour investigations while maintaining high contrast for vital warnings.

---

## 2. Color Palette & Design Tokens

### Core Neutral Palette
- **Canvas / Background:** `#0B0F19` (OLED Deep Midnight Black)
- **Panel Surface (Layer 1):** `#111827` (Rich Obsidian Slate)
- **Card Surface (Layer 2):** `#1E293B` (Elevated Tactical Slate)
- **Borders & Dividers:** `#334155` (Subtle Gunmetal)
- **Primary Text:** `#F8FAFC` (Pure Titanium White)
- **Secondary / Muted Text:** `#94A3B8` (Slate Silver)
- **Accent Highlight:** `#38BDF8` (Tactical Neon Cyan)

### Entity & Threat Classification Tokens
```css
/* Threat & Centrality Levels */
--color-mastermind:  #EF4444; /* High Risk / PageRank Leader (Crimson) */
--color-broker:      #F59E0B; /* High Betweenness / Hawala Broker (Amber) */
--color-operative:   #8B5CF6; /* High Degree / Field Operative (Electric Violet) */
--color-peripheral:  #64748B; /* Peripheral / Low Confidence (Muted Slate) */

/* Entity Node Taxonomy */
--node-person:       #38BDF8; /* Suspect / Contact (Cyan Circle) */
--node-phone:        #10B981; /* Phone / SIM / Burner (Emerald Diamond) */
--node-account:      #F59E0B; /* Bank Account / Mule A/C (Amber Square) */
--node-vehicle:      #EC4899; /* Vehicle / Transport (Rose Hexagon) */
--node-location:     #06B6D4; /* Cell Tower / Crime Scene (Teal Star) */
--node-crime:        #DC2626; /* FIR / Incident Node (Red Octagon) */

/* Relationship Edges */
--edge-call:         #10B981; /* CDR Call Link (Solid Emerald) */
--edge-financial:    #F59E0B; /* Money Transfer (Dashed Amber Arrow) */
--edge-association:  #94A3B8; /* Gang Association (Dotted Slate) */
--edge-colocation:   #06B6D4; /* Co-located Cell Tower (Cyan Glow) */
```

---

## 3. Typography Hierarchy

| Style | Font Family | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | Inter, -apple-system | 24px (1.5rem) | 700 Bold | Dashboard Section Headers, Mastermind Alerts |
| **H2 Section** | Inter, -apple-system | 18px (1.125rem) | 600 Semi-Bold | Panel Headers, Analysis Summaries |
| **H3 Subsection**| Inter, -apple-system | 14px (0.875rem) | 600 Semi-Bold | Node Titles, Evidence Modal Headlines |
| **Body Regular** | Inter, -apple-system | 13px (0.8125rem)| 400 Regular | Descriptions, Case Notes, Interrogation text |
| **Mono / Code** | JetBrains Mono, monospace | 12px (0.75rem) | 500 Medium | Hash Checksums, Phone Nos, IMEIs, UTRs, IP Addresses |

---

## 4. Cytoscape.js Visual Grammar & Node Styling

### Node Geometry & Styling Rules:
1. **Node Size:** Proportional to Degree Centrality / Influence:
   - Base size: `32px`
   - Mastermind size: `56px` with subtle neon outer glow (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.4)`).
2. **Node Badges:** Top-right mini-badge indicating verified status or risk score (e.g., `92%`).
3. **Selected Node State:** Animated pulsing border in `#38BDF8` (Cyan).
4. **Dimming Inactive Elements:** When a suspect node is clicked, all nodes $> 2$ hops away drop to `opacity: 0.15` to highlight immediate sub-clusters.

### Edge Visual Rules:
- **`CALLED`:** Thickness proportional to call frequency (1px to 6px).
- **`TRANSFERRED_MONEY`:** Directed arrow with animated dash flow indicating financial direction.
- **`ASSOCIATED_WITH`:** Double-dash gray line with confidence label (e.g. `95% conf`).

---

## 5. Core Layout & Workstation Modules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [TOP BAR] CRIMEGRAPH AI | Case: OP-CHAKRA-088 | Status: CONFIDENTIAL | IO: 782 │
├───────────────┬─────────────────────────────────────────────────┬───────────────┤
│ [LEFT PANEL]  │ [MAIN VIEWPORT: CYTOSCAPE CANVAS]               │ [RIGHT PANEL] │
│ Ingestion &   │                                                 │ Evidence &    │
│ Entity Filter │ • Interactive Node-Link Knowledge Graph         │ Provenance    │
│ • Upload FIR  │ • Physics Layout Controls (CoSE, Force, Circle) │ Drawer        │
│ • Upload CDR  │ • Search Suspect / Phone / Account              │ • Doc Snippet │
│ • Upload Bank │ • Multi-select & Expand 1-Hop Neighbors         │ • Hash Verify │
│ • Confidence  ├─────────────────────────────────────────────────┤ • BSA Cert    │
│   Threshold   │ [BOTTOM PANEL: NETWORK TIME MACHINE]            │   Export      │
│   Slider      │ [|<] [Play] [>|]  ----●==============●--------  │ • Risk Scores │
│               │ 01 Jan 2024                    31 Dec 2024      │               │
└───────────────┴─────────────────────────────────────────────────┴───────────────┘
```

---

## 6. UI Component States

### 1. Ingestion Loading State
- Pulsing tactical radar sweep or progress bar showing:
  - Step 1: Document SHA-256 Checksum generation `[DONE]`.
  - Step 2: PyMuPDF / OCR text extraction `[PROCESSING...]`.
  - Step 3: NLP NER Entity tagging `[QUEUED]`.
  - Step 4: Splink identity resolution `[QUEUED]`.

### 2. Empty States
- Informative tactical placeholder: *"No active case loaded. Upload an FIR PDF, CDR CSV, or Bank Statement to initialize the intelligence graph."*

### 3. Human-in-the-Loop Triage Banner
- When Splink encounters an ambiguous match (60%-85% confidence):
  - Split comparison card showing Candidate A ("Vikram Singh") vs Candidate B ("Vicky Malhotra").
  - Highlights matching attributes (e.g., Shared Phone + Alternate Alias).
  - Clear actions: `[Confirm & Merge]` | `[Keep Separate]`.
