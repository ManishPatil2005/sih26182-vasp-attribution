# Security Architecture & Legal Compliance: CRIMEGRAPH AI

**Standard:** Zero-Trust Law Enforcement Cybersecurity & Bharatiya Sakshya Adhiniyam (BSA), 2023  
**Theme:** Blockchain & Cybersecurity | **PS ID:** 26189  

---

## 1. Threat Modeling (STRIDE Assessment)

| Threat Category | Potential Attack Vector | Applied Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Compromised officer credentials used to fabricate connections between innocent citizens and criminals. | Multi-Factor Authentication (MFA), Hardware token support, Session inactivity timeouts (15 mins). |
| **Tampering** | Rogue actor or insider alters call frequency or deletes a suspect node to derail a prosecution. | Append-Only Cryptographic SHA-256 Hash Chain. Any database tampering invalidates the hash chain immediately. |
| **Repudiation** | An officer denies accessing confidential wiretap transcripts or exporting suspect dossiers. | Digital signatures and immutable audit entries logging `officer_id`, timestamp, action, and target entity. |
| **Information Disclosure** | Leakage of witness identities, confidential informants, or wiretaps to unauthorized personnel. | Field-level PII data masking (Aadhaar, PAN, phone numbers) and Attribute-Based Access Control (ABAC). |
| **Denial of Service** | Uploading malformed 1GB ZIP bombs or recursive graph queries crashing the intelligence server. | Strict file size enforcement (max 50 MB), MIME type validation, asynchronous job queues, and query depth caps. |
| **Elevation of Privilege** | Investigating Officer (IO) attempting to modify custody chains or override SP-level approvals. | Strict Role-Based Access Control (RBAC) enforced server-side on every API route. |

---

## 2. Role-Based Access Control (RBAC) Matrix

| Permission / Action | Investigating Officer (IO) | Lead Analyst / SP | Evidence Custodian | Auditor / Court Reviewer |
| :--- | :---: | :---: | :---: | :---: |
| **Ingest Evidence (CDR/FIR/Bank)** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **View Knowledge Graph** | ✅ Assigned Cases | ✅ All Jurisdiction | ❌ No | ✅ Read-Only Stamped |
| **Execute Graph Analytics** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Approve Entity Merges (Splink)** | ❌ Triage Only | ✅ Full Authority | ❌ No | ❌ No |
| **Generate BSA Sec 63 Certificate** | ✅ Request | ✅ Countersign | ✅ Generate & Seal | ❌ No |
| **Verify Audit Ledger Integrity** | ✅ Read State | ✅ Read State | ✅ Full Verification | ✅ Full Verification |
| **Export Case Dossier** | ⚠️ Watermarked | ✅ Full Unmasked | ❌ No | ⚠️ Watermarked Read-Only |

---

## 3. Legal Admissibility: Section 63 BSA 2023 Compliance

Under Section 63 of the **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (which repealed Section 65B of the Indian Evidence Act, 1872), electronic records are admissible only when produced by an automated process with verifiable integrity.

### CRIMEGRAPH AI Legal Compliance Protocol:
1. **Source File Fingerprinting:**
   $$\text{Hash}_{\text{doc}} = \text{SHA256}(\text{Raw File Bytes})$$
   Recorded in the ledger before any NLP or parsing occurs.
2. **Deterministic Processing:**
   All regex and NLP extraction models run with fixed seeds and versioned pipelines.
3. **Chain of Custody Ledger:**
   Every graph operation is linked in an immutable Merkle hash chain:
   $$\text{Hash}_i = \text{SHA256}(\text{Payload}_i \mathbin{\Vert} \text{Hash}_{i-1} \mathbin{\Vert} \text{Timestamp} \mathbin{\Vert} \text{OfficerID})$$
4. **Certificate Generation:**
   The system generates an official **Section 63 Certificate** stating:
   - System specifications, OS version, and CRIMEGRAPH AI engine version.
   - Confirmation that the computer system operated properly during data processing.
   - Cryptographic hashes of all ingested files and produced sub-graphs.
   - Digital signature block for the Officer in charge.

---

## 4. Cryptographic Standards

- **Hash Function:** SHA-256 for all block linking and file checksums.
- **Data at Rest:** AES-256-GCM encryption for stored raw case PDFs and database volumes.
- **Data in Transit:** Enforced TLS 1.3 with strict cipher suites (`TLS_AES_256_GCM_SHA384`).
- **Token Authentication:** Cryptographically signed JSON Web Tokens (JWT) using HS256 / RS256 with 8-hour expiration.

---

## 5. PII Masking & Data Sanitization Guidelines

When displaying records to general analysts or producing external reports:
- **Phone Numbers:** Mask middle 4 digits (`9876XXXX10`).
- **Bank Account Numbers:** Display only last 4 digits (`XXXX-XXXX-9910`).
- **Aadhaar Numbers:** Mask first 8 digits (`XXXX-XXXX-1234`).
- **Addresses:** Truncate street-level details in public dashboard overviews; show district and state only.
