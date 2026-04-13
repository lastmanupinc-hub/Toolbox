# AGENTS.md — avery-pay-platform

## Project Context

This is a **fintech_platform** built with **Go**.
PAI'D is **two systems in one repo**:
1. PAID — payment orchestration, ledger, settlement, provider routing
2. Trust Fabric — repair-to-certify fintech marketplace

### Stack

- Go 1.22 · Svelte · PostgreSQL · Docker

### Architecture

- Dual-system monolith (PAID + Trust Fabric)
- Shared API backend and authentication layer
- 8 provider adapters (all dual-mode)
- WAL-mode SQLite for local state, PostgreSQL for production

### Key Directories

- go-backend/ — Go production server, all persistence, 601 source files
- frontend/ — Svelte merchant dashboard
- trust-fabric-frontend/ — Trust Fabric UI
- scripts/ — Build, deploy, migration scripts
- docs/ — Architecture decisions, API specs

### Routes (689 total)

| Method | Path                        | System       |
|--------|-----------------------------|--------------|
| POST   | /v1/payments                | PAID         |
| POST   | /v1/payouts                 | PAID         |
| POST   | /v1/kyc/check               | PAID         |
| POST   | /v1/providers/:name/connect | PAID         |
| POST   | /v1/webhooks/provider       | PAID         |
| GET    | /v1/admin/metrics           | PAID         |
| GET    | /healthz                    | shared       |
| POST   | /v1/trust/ingest            | Trust Fabric |
| POST   | /v1/trust/diagnose          | Trust Fabric |
| GET    | /v1/trust/certifications    | Trust Fabric |

### Conventions

- Go standard project layout
- Table-driven tests (`go test -v ./...`)
- 125 SQL migrations (sequential, never skip)
- Provider adapters implement dual-mode interface

### Test Coverage

| Component | Tests | Files |
|-----------|-------|-------|
| Go backend | 6,906 | 389 |
| Frontend | 345 | 35 |
| **Total** | **7,251** | **424** |
