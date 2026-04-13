# 1. PAI'D = dual fintech platform. PAID (payment orchestration) + Trust Fabric (repo repair marketplace).
# 2. Go 1.22 backend, Svelte frontend, PostgreSQL, Docker. 3,314 files, 7,251 tests.
# 3. 689 HTTP routes, 8 provider adapters (all dual-mode), 125 SQL migrations.
# 4. Build: `go build ./...`. Test: `go test -v ./...`. Frontend: `cd frontend && npm run dev`.
# 5. Provider adapters in go-backend/providers/. Each implements PaymentProvider + PayoutProvider interfaces.
# 6. Trust Fabric packages in go-backend/trustfabric/. 63 packages for ingest, diagnose, repair, certify.
# 7. Ledger is append-only. Never mutate entries. Reconciliation runs hourly via cron.
# 8. All migrations sequential (001–125). Never skip. Run `migrate up` before testing.
# 9. CANONICAL_COUNTS.yaml is source of truth for all metrics. If any doc disagrees, that doc is stale.
# 10. HEAD: commit 04edb4d. 434 total commits. All numbers verified.
