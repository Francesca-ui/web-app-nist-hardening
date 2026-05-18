# Full-Stack Web Application Hardening (NIST 800-53 Balanced Architecture)

This repository contains a hardened full-stack web application architecture designed to comply with the **NIST 800-53 Moderate Baseline** security controls. The project focuses on "Security-by-Design," moving beyond simple perimeter defense to reinforce application runtime, identity management, and secrets segregation.

## 🛡️ Security Hardening Features

### 1. Identity & Access Management (IAM)
* Integrated **Keycloak (v26)** to centralize authentication and authorization.
* Configured robust **Content Security Policy (CSP)** headers directly inside the IAM layer to defend against XSS and clickjacking attacks.
* Implemented access control structures and secure token validation patterns.

### 2. Secrets Management & Isolation
* Deployed **HashiCorp Vault** to handle operational secrets dynamically, removing hardcoded credentials from the codebase.
* Enforced memory locking (`IPC_LOCK`) capability within the Vault container to prevent cryptographic material and sensitive tokens from being written to swap space on the host disk.

### 3. Container Runtime Hardening (Least Privilege)
* **Privilege Escalation Prevention:** Enforced `no-new-privileges:true` across all services (React frontend, Node API, databases, and reverse proxy) to stop attackers from exploiting SUID binaries inside containers.
* **Kernel Attack Surface Reduction:** Applied `cap_drop: [ALL]` to remove all default Linux kernel capabilities, explicitly restoring only the bare minimum required for databases to initialize (e.g., `CHOWN`, `SETUID`, `SETGID` for MongoDB and Postgres).
* **Resource Constraint Isolation:** Assigned strict CPU (max 0.50 per core) and RAM (max 512MB) resource limits to prevent localized exploits or buggy scripts from triggering host-wide Denial of Service (DoS).

### 4. Availability & Resiliency (SC-5 Control)
* Scaled the Node API backend utilizing Docker Compose deployment replicas with built-in load balancing simulation to mitigate potential resource-exhaustion or volumetric DoS attempts.
* Integrated **Apache** as a secure reverse proxy handles incoming TLS termination and properly segregates network traffic routing.

## 🛠️ Tech Stack
* **Frontend:** React
* **Backend:** Node.js (API Gateway)
* **Databases:** MongoDB (App data with TLS enforced) & PostgreSQL (Keycloak backend)
* **Security & Infra:** Keycloak, HashiCorp Vault, Apache Reverse Proxy, Docker Compose

## 🚀 Deployment
1. Clone the repository.
2. Copy `.env.example` into a new `.env` file and populate it with your secure credentials.
3. Run the secure environment:
   ```bash
   docker compose up --build
