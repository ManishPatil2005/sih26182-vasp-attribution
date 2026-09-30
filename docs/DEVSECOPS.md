# DevSecOps & CI/CD Pipeline Specification: CRIMEGRAPH AI

**Standard:** Law Enforcement Secure Software Development Lifecycle (SSDLC)  
**Theme:** Blockchain & Cybersecurity | **PS ID:** 26189  

---

## 1. DevSecOps Architecture & Philosophy

In national security and police intelligence platforms, security cannot be an afterthought tested 5 minutes before release. CRIMEGRAPH AI integrates security controls at every phase of the engineering lifecycle ("Shift-Left Security"):

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  CODE   │ ───> │  BUILD  │ ───> │  TEST   │ ───> │ DEPLOY  │ ───> │ MONITOR │
└─────────┘      └─────────┘      └─────────┘      └─────────┘      └─────────┘
     │                │                │                │                │
Pre-Commit       SCA & Secrets     SAST & DAST      Hardened OCI     Hash Ledger
- Gitleaks       - pip-audit       - Bandit (Py)    - Non-root       - Tamper Audit
- Flake8 / ESLint - npm audit      - ESLint Sec     - Distroless     - SIEM Logs
- Black/Prettier - CycloneDX SBOM  - Pytest Sec     - Read-only FS   - File Integrity
```

---

## 2. DevSecOps Pipeline Gates & Tooling

### Gate 1: Developer Workstation & Pre-Commit
- **Secret Scanning:** `gitleaks protect --staged` runs prior to every git commit. Prevents hardcoded API tokens, private keys, or credentials from entering git history.
- **Code Formatting & Linting:** `black`, `isort`, `flake8` for Python; `prettier`, `eslint` for TypeScript.
- **Pre-commit configuration:** `.pre-commit-config.yaml` automates execution on every `git commit`.

### Gate 2: Static Application Security Testing (SAST)
- **Python Backend SAST:**
  - **Bandit:** Scans for AST-level vulnerabilities (SQL injections, shell executions, insecure deserialization, weak cryptographic hashes).
    ```bash
    bandit -r backend/app/ -ll -x tests/
    ```
  - **Mypy:** Enforces strict type compliance to prevent runtime type confusions:
    ```bash
    mypy backend/app/
    ```
- **Frontend SAST:**
  - **ESLint Security Plugin (`eslint-plugin-security`):** Detects insecure regular expressions, `eval()`, prototype pollution, and unsafe HTML injections (`dangerouslySetInnerHTML`).

### Gate 3: Software Composition Analysis (SCA) & SBOM
- **Python SCA:** `pip-audit` checks all dependencies in `requirements.txt` against the PyPI and OSV vulnerability databases:
  ```bash
  pip-audit -r backend/requirements.txt
  ```
- **Node.js SCA:** `npm audit --audit-level=high` blocks builds containing known High/Critical CVEs.
- **Software Bill of Materials (SBOM):** Generated using `cyclonedx-python` and `cyclonedx-npm` to produce machine-readable CycloneDX JSON artifacts for government procurement compliance.

### Gate 4: Container Security & Hardening
- **Base Images:** Minimal Debian-slim or Alpine base images.
- **Least Privilege:** Applications execute under an unprivileged user (`crimegraph:crimegraph`, UID 10001), never as `root`.
- **Filesystem Hardening:** Container root filesystem is mounted as read-only (`--read-only`), with designated temporary scratch space mounted on `/tmp` with `noexec`.
- **Vulnerability Scanning:** Container images are scanned via **Trivy**:
  ```bash
  trivy image --severity HIGH,CRITICAL crimegraph-backend:latest
  ```

### Gate 5: Dynamic API Security Testing (DAST)
- **OWASP ZAP Baseline Scan:** Automated scan against local staging server to check for:
  - Missing security headers (`X-Frame-Options: DENY`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`).
  - CORS misconfigurations (wildcard `*` headers rejected).
  - Information leakage in HTTP 500 error traces.

---

## 3. GitHub Actions CI/CD Workflow (`.github/workflows/devsecops.yml`)

The automated pipeline triggers on every push and pull request to `main`:

```yaml
name: CRIMEGRAPH AI DevSecOps Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  secret-scan:
    name: Secret Scanning (Gitleaks)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sast-backend:
    name: Python SAST & SCA
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install Dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install bandit flake8 mypy pip-audit pytest pytest-cov
      - name: Run Flake8 Linter
        run: flake8 app/ tests/
      - name: Run Bandit SAST
        run: bandit -r app/ -ll
      - name: Run pip-audit SCA
        run: pip-audit -r requirements.txt
      - name: Run Pytest Test Suite
        run: pytest -v --cov=app tests/

  sast-frontend:
    name: TypeScript SAST & Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint
      - name: Run TypeScript Check
        run: npm run typecheck
      - name: Run npm audit
        run: npm audit --audit-level=high

  container-security:
    name: Container Vulnerability Scan (Trivy)
    needs: [sast-backend, sast-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: docker build -t crimegraph-backend:ci ./backend
      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'crimegraph-backend:ci'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
```

---

## 4. Continuous Operational Auditing & Integrity Monitoring
- Every transaction logged into `data/audit_ledger.json` is hashed and signed.
- A background worker (`cron` / healthcheck) runs an hourly integrity verification.
- If any byte in `audit_ledger.json` is modified out-of-band:
  - System immediately triggers `CRITICAL_SECURITY_ALERT`.
  - Disables user session creation until countersigned by Evidence Custodian.
