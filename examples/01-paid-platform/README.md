# PAI'D — Payments Intelligence + Trust Fabric Marketplace

**Stack:** Go + Svelte + PostgreSQL + Docker
**Files:** 3,314 | **Tests:** 7,251 | **Routes:** 689

PAI'D is two systems in one repo:

1. **PAID** — end-to-end payment processing: buyer → PAID → seller with orchestration, ledger, reconciliation, provider routing, settlement, and merchant/operator dashboards.
2. **Trust Fabric** — repair-to-certify fintech marketplace. Ingests broken repos, diagnoses forensically, generates repair plans, retests, and certifies.

## Before AXIS

Zero AI context files. 3,314 files across two interleaved systems with no documentation for AI agents. Agents couldn't distinguish PAID routes from Trust Fabric routes.

## After AXIS

75 structured artifacts generated. All 689 routes mapped, 8 provider adapters documented, dual-system architecture explained, debug playbook covers provider failures and ledger reconciliation.
