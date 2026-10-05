# Security Architecture & Legal Compliance: SAHYOG-VASP AI

**Standard:** Zero-Trust Law Enforcement Cybersecurity, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, & Bharatiya Sakshya Adhiniyam (BSA), 2023  
**Theme:** Blockchain & Cybersecurity | **Problem Statement:** SIH26182  
**Organization:** Ministry of Home Affairs (MHA) / Indian Cyber Crime Coordination Centre (I4C)  

---

## 1. Threat Modeling (STRIDE Assessment)

| Threat Category | Potential Attack Vector | Applied Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Compromised credentials used to fabricate attribution connections between unhosted wallets and innocent entities. | Multi-Factor Authentication (MFA), RFC 6238 TOTP tokens, PBKDF2-HMAC-SHA256 password hashing (100k rounds), Inactivity locks (15 mins). |
| **Tampering** | Rogue actor or insider alters wallet hop distances, peeling ratios, or deposit address hashes to derail freezing actions. | Append-Only Cryptographic SHA-256 Merkle Ledger. Any tampering invalidates the evidence root immediately. |
| **Repudiation** | An officer or nodal liaison denies issuing or receiving a Section 94 BNSS statutory freezing requisition. | Immutable audit entries logging `officer_id`, timestamp, IP address, action, and target VASP requisition ID. |
| **Information Disclosure** | Leakage of undercover addresses, confidential informants, or VASP customer PAN/Aadhaar records. | Agency-based role compartmentalization, PII data masking (PAN, phone numbers, bank accounts), and ABAC filters. |
| **Denial of Service** | Flooding backend with recursive multi-hop graph queries or malformed blockchain payloads. | Bounded graph search (max 3 hops), query timeouts (2.0s), rate-limited gateways, and 10-Lakh Bloom filter lookups in <1.2ms. |
| **Elevation of Privilege** | Guest demo evaluator or field IO attempting to provision credentials or modify VASP registries. | Server-side role authorization guards enforcing 403 Forbidden on all administrative and user management routes. |

---

## 2. Authentication Architecture: Demo vs. Production

To balance safe public evaluation during the Smart India Hackathon with enterprise law-enforcement security, the platform strictly separates **Demo Authentication** from **Production Authentication**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SAHYOG-VASP AI DUAL-MODE AUTHENTICATION                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
        ┌───────────────────────────┐                     ┌───────────────────────────┐
        │      DEMO SANDBOX MODE    │                     │   OFFICIAL PRODUCTION     │
        │ • 1-Click "Enter Demo"    │                     │ • Badge ID + Password     │
        │ • Zero Password/OTP Prompt│                     │ • RFC 6238 TOTP 2FA (App) │
        │ • Role: DEMO_INVESTIGATOR │                     │ • Role: IO / SUPER_ADMIN  │
        │ • 30-Min Short-Lived JWT  │                     │ • 8-Hour Sovereign JWT    │
        │ • Synthetic/Public Intel  │                     │ • Real LEA Case Action    │
        │ • Admin Routes Blocked    │                     │ • Full Audit Notarization │
        └───────────────────────────┘                     └───────────────────────────┘
```

> [!WARNING]
> **Safety Notice:** The 1-click Demo Authentication mechanism is provided **strictly for public competition evaluation, academic demonstrations, and sandbox testing**. It is **NOT** suitable for production deployment in actual law enforcement operations. Production environments mandate hardware security keys (FIDO2 / WebAuthn), Government Single Sign-On (Jan Parichay / Parichay SSO), and mutual TLS (mTLS) client certificates.

### Permissions Matrix: DEMO_INVESTIGATOR vs. Production Roles

| Capability / Endpoint Category | DEMO_INVESTIGATOR | INVESTIGATING_OFFICER | AGENCY_SUPERVISOR | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard & Metric Overview** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted |
| **Multi-Chain Wallet Analysis** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted |
| **Nearest VASP Attribution** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted |
| **Cytoscape Graph Visualization** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted |
| **Section 94 BNSS Freezing Notice** | ✅ Simulated | ✅ Production Issue | ✅ Production Issue | ✅ Production Issue |
| **Section 63 BSA Court Certificate** | ✅ Generated | ✅ Generated | ✅ Countersigned | ✅ Sealed |
| **Simulated SAHYOG Routing** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted |
| **User Directory (`/admin/users`)** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ✅ Granted | ✅ Granted |
| **Provision Personnel / Keys** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ✅ Granted |
| **Officer Killswitch / Suspend** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ✅ Granted |
| **Admin Audit Trail Access** | ❌ **DENIED (403)** | ❌ **DENIED (403)** | ✅ Granted | ✅ Granted |
| **Token Session Expiration** | **30 Minutes** | **8 Hours** | **8 Hours** | **4 Hours** |

---

## 3. Statutory Compliance: Section 94 BNSS & Section 63 BSA 2023

### Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023:
- Replaced Section 91 of the Code of Criminal Procedure (CrPC).
- Empowers Investigating Officers to issue summons/notices to centralized crypto exchanges (VASPs) to produce document/asset evidence or freeze illicit wallets within a statutory **120-minute** operational deadline.
- Freezing requisitions generated by SAHYOG-VASP AI embed the specific exchange Nodal Officer email, statutory registration ID (FIU-IND), and direct deposit ingress tx hash.

### Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023:
- Replaced Section 65B of the Indian Evidence Act, 1872.
- Admissibility of electronic records requires cryptographic proof that data processing occurred deterministically without tampering:
  $$\text{Evidence Root} = \text{SHA256}(\text{Hop}_1 \mathbin{\Vert} \text{Hop}_2 \mathbin{\Vert} \text{VASP\_Deposit} \mathbin{\Vert} \text{Timestamp})$$
- Generates an official printable Certificate containing operating environment metadata, SHA-256 Merkle root, Officer badge ID, and QR verification payload.

---

## 4. Cryptographic Standards & Secret Management

- **Zero Hardcoded Secrets:** No passwords, private keys, or API tokens are stored in the frontend or public git repository.
- **Password Storage:** NIST SP 800-132 PBKDF2-HMAC-SHA256 with 100,000 iterations and cryptographically random 16-byte salt per user.
- **Two-Factor Authentication:** RFC 6238 Time-Based One-Time Password (TOTP) with HMAC-SHA1 and 30-second epoch intervals.
- **Session Tokens:** HS256 cryptographically signed JSON Web Tokens (JWT) verified against server-side secret key and revocation registry.
- **Data at Rest:** All sensitive case files and ledger state serialized with SHA-256 block checksums.
- **Data in Transit:** TLS 1.3 encryption with strict HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
