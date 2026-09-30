# Development Rules & AI Coding Guidelines: CRIMEGRAPH AI

These rules govern all engineering, vibe coding, and AI assistant actions within this repository. Adherence is strictly enforced to prevent hallucinations, regressions, and security compromises.

---

## 1. Core Engineering Principles

1. **Law Enforcement & Evidentiary Rigor:**
   - Every piece of data in the Knowledge Graph **MUST** be linked to a source evidence reference (document ID, page, offset, or transaction record).
   - Ingestion pipelines must never silently drop malformed CDR rows or bank records; anomalies must be logged with warning tags.
   - The cryptographic SHA-256 audit ledger is **append-only**. Never implement update or delete operations on the ledger.

2. **Zero-Regression Vertical Slices:**
   - Develop features as complete vertical flows:
     `Data Parser -> Entity Model -> Graph Sync -> API Endpoint -> React Component -> Automated Test`.
   - Never build a backend endpoint without defining its TypeScript interface and frontend consumer.

3. **Type Safety & Data Contracts:**
   - **Backend:** 100% Pydantic v2 schemas for all requests, responses, and internal graph transfers. Use explicit type hints everywhere (`typing.Optional`, `typing.List`, `typing.Dict`).
   - **Frontend:** Strict TypeScript (`strict: true`). No `any` types allowed without written justification in code comments.

---

## 2. Security & Compliance Rules (DevSecOps)

1. **Zero Hardcoded Credentials:**
   - Never commit API keys, private keys, database passwords, or JWT secrets.
   - All credentials must be read from environment variables via `backend/app/core/config.py`.
   - Run `gitleaks` pre-commit hooks to verify repository cleanliness.

2. **Data Masking & PII Protection:**
   - Aadhaars, PAN cards, and bank account numbers displayed on the UI must default to masked view (e.g., `XXXX-XXXX-9021`) unless an authorized IO explicitly toggles unmasking.
   - Raw uploaded case files must be stored in secure isolated directories (`data/raw/uploads/`) with restricted OS permissions.

3. **Input Validation:**
   - Validate all file uploads for MIME type, file extension, and maximum payload size ($< 50 \text{ MB}$).
   - Sanitize all text fields before regex/NLP processing to mitigate injection vectors.

---

## 3. Architecture & Code Organization Rules

1. **Decoupled Graph Abstraction:**
   - The analytics layer must interact with an abstract `GraphEngineInterface`.
   - Never couple FastAPI route handlers directly to raw Cypher strings or NetworkX primitives; route all calls through `GraphService`.
   - The system must seamlessly support running purely in **in-memory NetworkX mode** when Neo4j is not available (ensuring instant, zero-friction demonstration during SIH judging rounds).

2. **UI & Frontend Separation:**
   - Reusable UI elements belong in `src/components/`.
   - Feature-specific workflows (e.g., Ingestion, Time Machine, Evidence Drawer) belong in `src/features/`.
   - All API network calls must be centralized in `src/services/api.ts` with error boundaries and typed responses.

---

## 4. Git & Commit Workflow

1. **Conventional Commits:**
   - Format: `<type>(<scope>): <short description>`
   - Examples:
     - `feat(ingest): add PyMuPDF parser with Indian phone regex`
     - `fix(splink): adjust Soundex phonetic threshold for Hindi names`
     - `sec(audit): enforce SHA-256 Merkle chain verification`
     - `test(centrality): add unit tests for PageRank mastermind detector`

2. **Small, Atomic Changes:**
   - Commit after completing each individual task in `docs/TASKS.md`.
   - Never mix refactoring with new feature implementation.
