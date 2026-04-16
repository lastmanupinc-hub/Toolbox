# AGENTS.md — axis-iliad

## Project Context

This is a **monorepo** built with **TypeScript**.
AI-native development operating system. Upload or point at any codebase — get 87 generated artifacts across 18 specialized programs: context maps, debug playbooks, governance files, design tokens, SEO analysis, brand systems, and more.

### Stack

- React ^19.1.0

### Architecture

- monorepo
- containerized

### Conventions

- TypeScript strict mode
- pnpm workspaces

### Key Directories

- packages/ (monorepo_packages)
- apps/ (monorepo_apps)
- payment-processing-output/ (project_directory)
- search/ (project_directory)
- algorithmic/ (project_directory)
- artifacts/ (project_directory)
- brand/ (project_directory)
- canvas/ (project_directory)

### Routes

- `GET /v1/health` → apps/api/src/admin.test.ts
- `POST /v1/accounts` → apps/api/src/admin.test.ts
- `POST /v1/snapshots` → apps/api/src/admin.test.ts
- `GET /v1/admin/stats` → apps/api/src/admin.test.ts
- `GET /v1/admin/accounts` → apps/api/src/admin.test.ts
- `GET /v1/admin/activity` → apps/api/src/admin.test.ts
- `POST /v1/snapshots` → apps/api/src/api-branches.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/api-branches.test.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/api-branches.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/api-branches.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/api-branches.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path` → apps/api/src/api-branches.test.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/api-branches.test.ts
- `GET /v1/health` → apps/api/src/api-branches.test.ts
- `GET /v1/db/stats` → apps/api/src/api-branches.test.ts
- `POST /v1/db/maintenance` → apps/api/src/api-branches.test.ts
- `POST /v1/search/index` → apps/api/src/api-branches.test.ts
- `POST /v1/search/query` → apps/api/src/api-branches.test.ts
- `GET /v1/search/:snapshot_id/stats` → apps/api/src/api-branches.test.ts
- `POST /v1/debug/analyze` → apps/api/src/api-branches.test.ts
- `GET /v1/docs` → apps/api/src/api-branches.test.ts
- `GET /v1/programs` → apps/api/src/api-branches.test.ts
- `POST /v1/account/seats` → apps/api/src/api-branches.test.ts
- `GET /v1/account/seats` → apps/api/src/api-branches.test.ts
- `POST /v1/account/seats/:seat_id/accept` → apps/api/src/api-branches.test.ts
- `POST /v1/account/seats/:seat_id/revoke` → apps/api/src/api-branches.test.ts
- `GET /v1/account/upgrade-prompt` → apps/api/src/api-branches.test.ts
- `POST /v1/account/upgrade-prompt/dismiss` → apps/api/src/api-branches.test.ts
- `GET /v1/account/funnel` → apps/api/src/api-branches.test.ts
- `GET /v1/health` → apps/api/src/api-layer5.test.ts
- `POST /v1/accounts` → apps/api/src/api-layer5.test.ts
- `POST /v1/account/webhooks` → apps/api/src/api-layer5.test.ts
- `GET /v1/account/webhooks` → apps/api/src/api-layer5.test.ts
- `DELETE /v1/account/webhooks/:webhook_id` → apps/api/src/api-layer5.test.ts
- `POST /v1/account/webhooks/:webhook_id/toggle` → apps/api/src/api-layer5.test.ts
- `GET /v1/account/webhooks/:webhook_id/deliveries` → apps/api/src/api-layer5.test.ts
- `POST /v1/search/query` → apps/api/src/api-layer5.test.ts
- `POST /v1/account/programs` → apps/api/src/api-layer5.test.ts
- `POST /v1/account/github-token` → apps/api/src/api-layer5.test.ts
- `POST /v1/account/seats` → apps/api/src/api-layer5.test.ts
- `GET /v1/admin/stats` → apps/api/src/api-layer5.test.ts
- `GET /v1/admin/accounts` → apps/api/src/api-layer5.test.ts
- `GET /v1/admin/activity` → apps/api/src/api-layer5.test.ts
- `GET /health` → apps/api/src/api.test.ts
- `POST /v1/snapshots` → apps/api/src/api.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/api.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/api.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/api.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path` → apps/api/src/api.test.ts
- `POST /v1/search/export` → apps/api/src/api.test.ts
- `POST /v1/skills/generate` → apps/api/src/api.test.ts
- `POST /v1/debug/analyze` → apps/api/src/api.test.ts
- `POST /v1/frontend/audit` → apps/api/src/api.test.ts
- `POST /v1/seo/analyze` → apps/api/src/api.test.ts
- `POST /v1/optimization/analyze` → apps/api/src/api.test.ts
- `POST /v1/theme/generate` → apps/api/src/api.test.ts
- `POST /v1/brand/generate` → apps/api/src/api.test.ts
- `POST /v1/superpowers/generate` → apps/api/src/api.test.ts
- `POST /v1/marketing/generate` → apps/api/src/api.test.ts
- `POST /v1/notebook/generate` → apps/api/src/api.test.ts
- `POST /v1/obsidian/analyze` → apps/api/src/api.test.ts
- `POST /v1/mcp/provision` → apps/api/src/api.test.ts
- `POST /v1/artifacts/generate` → apps/api/src/api.test.ts
- `POST /v1/remotion/generate` → apps/api/src/api.test.ts
- `POST /v1/canvas/generate` → apps/api/src/api.test.ts
- `POST /v1/algorithmic/generate` → apps/api/src/api.test.ts
- `POST /v1/github/analyze` → apps/api/src/api.test.ts
- `POST /v1/accounts` → apps/api/src/b-grade-upgrade.test.ts
- `POST /v1/account/tier` → apps/api/src/b-grade-upgrade.test.ts
- `POST /v1/account/github-token` → apps/api/src/b-grade-upgrade.test.ts
- `GET /v1/account/github-token` → apps/api/src/b-grade-upgrade.test.ts
- `DELETE /v1/account/github-token/:token_id` → apps/api/src/b-grade-upgrade.test.ts
- `GET /v1/billing/history` → apps/api/src/b-grade-upgrade.test.ts
- `GET /v1/billing/proration` → apps/api/src/b-grade-upgrade.test.ts
- `GET /v1/health` → apps/api/src/billing-flow.test.ts
- `POST /v1/snapshots` → apps/api/src/billing-flow.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/billing-flow.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/billing-flow.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/billing-flow.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path*` → apps/api/src/billing-flow.test.ts
- `POST /v1/search/export` → apps/api/src/billing-flow.test.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/billing-flow.test.ts
- `POST /v1/accounts` → apps/api/src/billing-flow.test.ts
- `GET /v1/account` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/keys` → apps/api/src/billing-flow.test.ts
- `GET /v1/account/keys` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/keys/:key_id/revoke` → apps/api/src/billing-flow.test.ts
- `GET /v1/account/usage` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/tier` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/programs` → apps/api/src/billing-flow.test.ts
- `GET /v1/account/credits` → apps/api/src/billing-flow.test.ts
- `GET /v1/plans` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/seats` → apps/api/src/billing-flow.test.ts
- `GET /v1/account/seats` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/seats/:seat_id/accept` → apps/api/src/billing-flow.test.ts
- `POST /v1/account/seats/:seat_id/revoke` → apps/api/src/billing-flow.test.ts
- `POST /v1/accounts` → apps/api/src/checkout-email.test.ts
- `POST /v1/account/seats` → apps/api/src/checkout-email.test.ts
- `GET /v1/account/seats` → apps/api/src/checkout-email.test.ts
- `GET /v1/plans` → apps/api/src/checkout-email.test.ts
- `POST /v1/webhooks/stripe` → apps/api/src/checkout-email.test.ts
- `POST /v1/checkout` → apps/api/src/checkout-email.test.ts
- `GET /v1/account/subscription` → apps/api/src/checkout-email.test.ts
- `POST /v1/account/subscription/cancel` → apps/api/src/checkout-email.test.ts
- `GET /v1/health` → apps/api/src/crash-resilience.test.ts
- `GET /v1/health` → apps/api/src/crash-resilience.test.ts
- `GET /v1/health` → apps/api/src/credits-api.test.ts
- `POST /v1/accounts` → apps/api/src/credits-api.test.ts
- `GET /v1/account` → apps/api/src/credits-api.test.ts
- `POST /v1/account/keys` → apps/api/src/credits-api.test.ts
- `POST /v1/account/tier` → apps/api/src/credits-api.test.ts
- `GET /v1/account/credits` → apps/api/src/credits-api.test.ts
- `POST /v1/account/credits` → apps/api/src/credits-api.test.ts
- `GET /v1/health` → apps/api/src/db-endpoints.test.ts
- `GET /v1/db/stats` → apps/api/src/db-endpoints.test.ts
- `POST /v1/db/maintenance` → apps/api/src/db-endpoints.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/deletion.test.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/deletion.test.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/deletion.test.ts
- `GET /v1/health` → apps/api/src/e2e-flows.test.ts
- `GET /v1/health/live` → apps/api/src/e2e-flows.test.ts
- `GET /v1/health/ready` → apps/api/src/e2e-flows.test.ts
- `GET /v1/metrics` → apps/api/src/e2e-flows.test.ts
- `GET /v1/db/stats` → apps/api/src/e2e-flows.test.ts
- `POST /v1/db/maintenance` → apps/api/src/e2e-flows.test.ts
- `POST /v1/snapshots` → apps/api/src/e2e-flows.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/e2e-flows.test.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/e2e-flows.test.ts
- `GET /v1/snapshots/:snapshot_id/versions` → apps/api/src/e2e-flows.test.ts
- `GET /v1/snapshots/:snapshot_id/versions/:version_number` → apps/api/src/e2e-flows.test.ts
- `GET /v1/snapshots/:snapshot_id/diff` → apps/api/src/e2e-flows.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/e2e-flows.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/e2e-flows.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path` → apps/api/src/e2e-flows.test.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/e2e-flows.test.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/e2e-flows.test.ts
- `POST /v1/search/export` → apps/api/src/e2e-flows.test.ts
- `POST /v1/accounts` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account` → apps/api/src/e2e-flows.test.ts
- `POST /v1/account/keys` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account/keys` → apps/api/src/e2e-flows.test.ts
- `POST /v1/account/keys/:key_id/revoke` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account/usage` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account/quota` → apps/api/src/e2e-flows.test.ts
- `GET /v1/admin/stats` → apps/api/src/e2e-flows.test.ts
- `GET /v1/admin/accounts` → apps/api/src/e2e-flows.test.ts
- `GET /v1/admin/activity` → apps/api/src/e2e-flows.test.ts
- `POST /v1/account/webhooks` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account/webhooks` → apps/api/src/e2e-flows.test.ts
- `DELETE /v1/account/webhooks/:webhook_id` → apps/api/src/e2e-flows.test.ts
- `POST /v1/account/webhooks/:webhook_id/toggle` → apps/api/src/e2e-flows.test.ts
- `GET /v1/account/webhooks/:webhook_id/deliveries` → apps/api/src/e2e-flows.test.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/export-edge-cases.test.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/export.test.ts
- `POST /v1/accounts` → apps/api/src/funnel-api.test.ts
- `GET /v1/account` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/keys` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/tier` → apps/api/src/funnel-api.test.ts
- `GET /v1/plans` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/seats` → apps/api/src/funnel-api.test.ts
- `GET /v1/account/seats` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/seats/:seat_id/accept` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/seats/:seat_id/revoke` → apps/api/src/funnel-api.test.ts
- `GET /v1/account/upgrade-prompt` → apps/api/src/funnel-api.test.ts
- `POST /v1/account/upgrade-prompt/dismiss` → apps/api/src/funnel-api.test.ts
- `GET /v1/account/funnel` → apps/api/src/funnel-api.test.ts
- `GET /v1/funnel/metrics` → apps/api/src/funnel-api.test.ts
- `POST /v1/snapshots` → apps/api/src/handler-edge-cases.test.ts
- `GET /health` → apps/api/src/handler-edge-cases.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/handler-edge-cases.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/handler-edge-cases.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path` → apps/api/src/handler-edge-cases.test.ts
- `POST /v1/debug/analyze` → apps/api/src/handler-edge-cases.test.ts
- `POST /v1/snapshots` → apps/api/src/handler-validation.test.ts
- `POST /v1/debug/analyze` → apps/api/src/handler-validation.test.ts
- `POST /v1/snapshots` → apps/api/src/handlers-deep.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/handlers-deep.test.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/handlers-deep.test.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/handlers-deep.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path` → apps/api/src/handlers-deep.test.ts
- `POST /v1/search/export` → apps/api/src/handlers-deep.test.ts
- `POST /v1/skills/generate` → apps/api/src/handlers-deep.test.ts
- `POST /v1/github/analyze` → apps/api/src/handlers-deep.test.ts
- `POST /v1/debug/analyze` → apps/api/src/handlers-deep.test.ts
- `GET /v1/health/live` → apps/api/src/latency-histogram.test.ts
- `GET /v1/metrics` → apps/api/src/latency-histogram.test.ts
- `GET /v1/health` → apps/api/src/logging.test.ts
- `POST /v1/snapshots` → apps/api/src/logging.test.ts
- `GET /v1/health` → apps/api/src/metrics.test.ts
- `GET /v1/health/live` → apps/api/src/metrics.test.ts
- `GET /v1/health/ready` → apps/api/src/metrics.test.ts
- `GET /v1/metrics` → apps/api/src/metrics.test.ts
- `GET /v1/health` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/snapshots` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/multi-tenancy.test.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/multi-tenancy.test.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/projects/:project_id/generated-files/:file_path*` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/search/index` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/search/query` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/search/:snapshot_id/stats` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/accounts` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/account` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/account/keys` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/account/keys` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/account/keys/:key_id/revoke` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/account/usage` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/account/tier` → apps/api/src/multi-tenancy.test.ts
- `POST /v1/account/programs` → apps/api/src/multi-tenancy.test.ts
- `GET /v1/auth/github` → apps/api/src/oauth.test.ts
- `GET /v1/auth/github/callback` → apps/api/src/oauth.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/health` → apps/api/src/production-startup.test.ts
- `GET /v1/programs` → apps/api/src/programs-billing.test.ts
- `POST /v1/accounts` → apps/api/src/programs-billing.test.ts
- `GET /v1/account` → apps/api/src/programs-billing.test.ts
- `POST /v1/account/keys` → apps/api/src/programs-billing.test.ts
- `GET /v1/account/usage` → apps/api/src/programs-billing.test.ts
- `POST /v1/account/tier` → apps/api/src/programs-billing.test.ts
- `POST /v1/account/programs` → apps/api/src/programs-billing.test.ts
- `GET /v1/health` → apps/api/src/quota.test.ts
- `POST /v1/accounts` → apps/api/src/quota.test.ts
- `GET /v1/account/quota` → apps/api/src/quota.test.ts
- `GET /v1/test/fast` → apps/api/src/request-limits.test.ts
- `GET /v1/test/slow` → apps/api/src/request-limits.test.ts
- `GET /slow` → apps/api/src/router-branches.test.ts
- `GET /throw-string` → apps/api/src/router-branches.test.ts
- `GET /throw-after-end` → apps/api/src/router-branches.test.ts
- `GET /null-error` → apps/api/src/router-branches.test.ts
- `GET /array-error` → apps/api/src/router-branches.test.ts
- `GET /ok` → apps/api/src/router-branches.test.ts
- `GET /manual-500` → apps/api/src/router-branches.test.ts
- `GET /manual-422` → apps/api/src/router-branches.test.ts
- `GET /health` → apps/api/src/router-branches.test.ts
- `GET /up` → apps/api/src/router-branches.test.ts
- `GET /echo` → apps/api/src/router.test.ts
- `POST /echo` → apps/api/src/router.test.ts
- `GET /items/:id` → apps/api/src/router.test.ts
- `GET /users/:userId/posts/:postId` → apps/api/src/router.test.ts
- `GET /files/:path*` → apps/api/src/router.test.ts
- `GET /throws` → apps/api/src/router.test.ts
- `POST /status/:code` → apps/api/src/router.test.ts
- `GET /error-shape` → apps/api/src/router.test.ts
- `GET /` → apps/api/src/router.test.ts
- `GET /v1/health` → apps/api/src/security.test.ts
- `POST /v1/snapshots` → apps/api/src/security.test.ts
- `GET /v1/health` → apps/api/src/server-lifecycle.test.ts
- `GET /v1/health` → apps/api/src/server-lifecycle.test.ts
- `GET /v1/health` → apps/api/src/server.ts
- `GET /v1/health/live` → apps/api/src/server.ts
- `GET /v1/health/ready` → apps/api/src/server.ts
- `GET /v1/metrics` → apps/api/src/server.ts
- `GET /v1/db/stats` → apps/api/src/server.ts
- `POST /v1/db/maintenance` → apps/api/src/server.ts
- `GET /v1/docs` → apps/api/src/server.ts
- `POST /v1/snapshots` → apps/api/src/server.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/server.ts
- `DELETE /v1/snapshots/:snapshot_id` → apps/api/src/server.ts
- `GET /v1/snapshots/:snapshot_id/versions` → apps/api/src/server.ts
- `GET /v1/snapshots/:snapshot_id/versions/:version_number` → apps/api/src/server.ts
- `GET /v1/snapshots/:snapshot_id/diff` → apps/api/src/server.ts
- `GET /v1/projects/:project_id/context` → apps/api/src/server.ts
- `GET /v1/projects/:project_id/generated-files` → apps/api/src/server.ts
- `GET /v1/projects/:project_id/generated-files/:file_path*` → apps/api/src/server.ts
- `DELETE /v1/projects/:project_id` → apps/api/src/server.ts
- `POST /v1/search/export` → apps/api/src/server.ts
- `POST /v1/skills/generate` → apps/api/src/server.ts
- `POST /v1/debug/analyze` → apps/api/src/server.ts
- `POST /v1/frontend/audit` → apps/api/src/server.ts
- `POST /v1/seo/analyze` → apps/api/src/server.ts
- `POST /v1/optimization/analyze` → apps/api/src/server.ts
- `POST /v1/theme/generate` → apps/api/src/server.ts
- `POST /v1/brand/generate` → apps/api/src/server.ts
- `POST /v1/superpowers/generate` → apps/api/src/server.ts
- `POST /v1/marketing/generate` → apps/api/src/server.ts
- `POST /v1/notebook/generate` → apps/api/src/server.ts
- `POST /v1/obsidian/analyze` → apps/api/src/server.ts
- `POST /v1/mcp/provision` → apps/api/src/server.ts
- `POST /v1/artifacts/generate` → apps/api/src/server.ts
- `POST /v1/remotion/generate` → apps/api/src/server.ts
- `POST /v1/canvas/generate` → apps/api/src/server.ts
- `POST /v1/algorithmic/generate` → apps/api/src/server.ts
- `POST /v1/github/analyze` → apps/api/src/server.ts
- `POST /v1/search/index` → apps/api/src/server.ts
- `POST /v1/search/query` → apps/api/src/server.ts
- `GET /v1/search/:snapshot_id/stats` → apps/api/src/server.ts
- `GET /v1/search/:snapshot_id/symbols` → apps/api/src/server.ts
- `GET /v1/projects/:project_id/export` → apps/api/src/server.ts
- `GET /v1/programs` → apps/api/src/server.ts
- `POST /v1/accounts` → apps/api/src/server.ts
- `GET /v1/account` → apps/api/src/server.ts
- `POST /v1/account/keys` → apps/api/src/server.ts
- `GET /v1/account/keys` → apps/api/src/server.ts
- `POST /v1/account/keys/:key_id/revoke` → apps/api/src/server.ts
- `GET /v1/account/usage` → apps/api/src/server.ts
- `GET /v1/account/quota` → apps/api/src/server.ts
- `POST /v1/account/tier` → apps/api/src/server.ts
- `POST /v1/account/programs` → apps/api/src/server.ts
- `POST /v1/account/github-token` → apps/api/src/server.ts
- `GET /v1/account/github-token` → apps/api/src/server.ts
- `DELETE /v1/account/github-token/:token_id` → apps/api/src/server.ts
- `GET /v1/billing/history` → apps/api/src/server.ts
- `GET /v1/billing/proration` → apps/api/src/server.ts
- `GET /v1/account/credits` → apps/api/src/server.ts
- `POST /v1/account/credits` → apps/api/src/server.ts
- `GET /v1/plans` → apps/api/src/server.ts
- `POST /v1/account/seats` → apps/api/src/server.ts
- `GET /v1/account/seats` → apps/api/src/server.ts
- `POST /v1/account/seats/:seat_id/accept` → apps/api/src/server.ts
- `POST /v1/account/seats/:seat_id/revoke` → apps/api/src/server.ts
- `GET /v1/account/upgrade-prompt` → apps/api/src/server.ts
- `POST /v1/account/upgrade-prompt/dismiss` → apps/api/src/server.ts
- `GET /v1/account/funnel` → apps/api/src/server.ts
- `GET /v1/funnel/metrics` → apps/api/src/server.ts
- `GET /v1/admin/stats` → apps/api/src/server.ts
- `GET /v1/admin/accounts` → apps/api/src/server.ts
- `GET /v1/admin/activity` → apps/api/src/server.ts
- `GET /v1/auth/github` → apps/api/src/server.ts
- `GET /v1/auth/github/callback` → apps/api/src/server.ts
- `POST /v1/account/webhooks` → apps/api/src/server.ts
- `GET /v1/account/webhooks` → apps/api/src/server.ts
- `DELETE /v1/account/webhooks/:webhook_id` → apps/api/src/server.ts
- `POST /v1/account/webhooks/:webhook_id/toggle` → apps/api/src/server.ts
- `GET /v1/account/webhooks/:webhook_id/deliveries` → apps/api/src/server.ts
- `POST /v1/webhooks/stripe` → apps/api/src/server.ts
- `POST /v1/checkout` → apps/api/src/server.ts
- `GET /v1/account/subscription` → apps/api/src/server.ts
- `POST /v1/account/subscription/cancel` → apps/api/src/server.ts
- `POST /v1/snapshots` → apps/api/src/snapshot-auth.test.ts
- `GET /v1/snapshots/:snapshot_id` → apps/api/src/snapshot-auth.test.ts
- `POST /v1/accounts` → apps/api/src/snapshot-auth.test.ts
- `POST /v1/account/tier` → apps/api/src/snapshot-auth.test.ts
- `POST /v1/accounts` → apps/api/src/stripe-branches.test.ts
- `POST /v1/webhooks/stripe` → apps/api/src/stripe-branches.test.ts
- `POST /v1/checkout` → apps/api/src/stripe-branches.test.ts
- `GET /v1/account/subscription` → apps/api/src/stripe-branches.test.ts
- `POST /v1/account/subscription/cancel` → apps/api/src/stripe-branches.test.ts
- `POST /v1/accounts` → apps/api/src/stripe.test.ts
- `POST /v1/webhooks/stripe` → apps/api/src/stripe.test.ts
- `GET /v1/account/subscription` → apps/api/src/stripe.test.ts
- `POST /v1/snapshots` → apps/api/src/validation.test.ts
- `POST /v1/search/export` → apps/api/src/validation.test.ts
- `POST /v1/skills/generate` → apps/api/src/validation.test.ts
- `POST /v1/debug/analyze` → apps/api/src/validation.test.ts
- `POST /v1/accounts` → apps/api/src/validation.test.ts
- `POST /v1/account/tier` → apps/api/src/validation.test.ts
- `POST /v1/account/programs` → apps/api/src/validation.test.ts
- `POST /v1/account/seats` → apps/api/src/validation.test.ts
- `GET /v1/health` → apps/api/src/versions.test.ts
- `GET /v1/snapshots/:snapshot_id/versions` → apps/api/src/versions.test.ts
- `GET /v1/snapshots/:snapshot_id/versions/:version_number` → apps/api/src/versions.test.ts
- `GET /v1/snapshots/:snapshot_id/diff` → apps/api/src/versions.test.ts
- `POST /v1/account/webhooks` → apps/api/src/webhook-branches.test.ts
- `GET /v1/account/webhooks` → apps/api/src/webhook-branches.test.ts
- `DELETE /v1/account/webhooks/:webhook_id` → apps/api/src/webhook-branches.test.ts
- `POST /v1/account/webhooks/:webhook_id/toggle` → apps/api/src/webhook-branches.test.ts
- `GET /v1/account/webhooks/:webhook_id/deliveries` → apps/api/src/webhook-branches.test.ts
- `GET /v1/health` → apps/api/src/webhooks.test.ts
- `POST /v1/accounts` → apps/api/src/webhooks.test.ts
- `POST /v1/account/webhooks` → apps/api/src/webhooks.test.ts
- `GET /v1/account/webhooks` → apps/api/src/webhooks.test.ts
- `DELETE /v1/account/webhooks/:webhook_id` → apps/api/src/webhooks.test.ts
- `POST /v1/account/webhooks/:webhook_id/toggle` → apps/api/src/webhooks.test.ts
- `GET /v1/account/webhooks/:webhook_id/deliveries` → apps/api/src/webhooks.test.ts
- `GET /health` → e2e_ui_audit.yaml
- `GET /v1/health` → e2e_ui_audit.yaml
- `GET /api/health` → packages/context-engine/src/engine-branches.test.ts
- `POST /api/users` → packages/context-engine/src/engine-branches.test.ts
- `GET /api/users` → packages/context-engine/src/engine-edge.test.ts
- `POST /api/users` → packages/context-engine/src/engine-edge.test.ts
- `DELETE /api/users/:id` → packages/context-engine/src/engine-edge.test.ts
- `GET /api/health` → packages/generator-core/src/generator-branches.test.ts
- `GET /api/users` → packages/generator-core/src/generator-branches.test.ts
- `POST /api/users` → packages/generator-core/src/generator-branches.test.ts
- `GET /` → packages/generator-core/src/generator-branches.test.ts
- `GET /health` → packages/generator-core/src/generator-sourcefile-branches.test.ts
- `GET /api/health` → packages/generator-core/src/generator-sourcefile-branches6.test.ts
- `GET /users/:id` → packages/repo-parser/src/perf.bench.ts
- `POST /users` → packages/repo-parser/src/perf.bench.ts

### Domain Models

| Model | Kind | Fields | Source |
|-------|------|--------|--------|
| `AuthContext` | interface | 3 | apps/api/src/billing.ts |
| `EnvSpec` | interface | 5 | apps/api/src/env.ts |
| `ValidationError` | interface | 2 | apps/api/src/env.ts |
| `ValidationResult` | interface | 3 | apps/api/src/env.ts |
| `ZipEntry` | interface | 4 | apps/api/src/export.ts |
| `HistogramEntry` | interface | 3 | apps/api/src/metrics.ts |
| `OpenApiSpec` | interface | 6 | apps/api/src/openapi.ts |
| `WindowEntry` | interface | 2 | apps/api/src/rate-limiter.ts |
| `AppHandle` | interface | 3 | apps/api/src/router.ts |
| `Route` | interface | 4 | apps/api/src/router.ts |
| `CliArgs` | interface | 5 | apps/cli/src/cli.ts |
| `AxisConfig` | interface | 2 | apps/cli/src/credential-store.ts |
| `RunResult` | interface | 4 | apps/cli/src/runner.ts |
| `ScanResult` | interface | 3 | apps/cli/src/scanner.ts |
| `WriteResult` | interface | 3 | apps/cli/src/writer.ts |
| `Account` | interface | 5 | apps/web/src/api.ts |
| `ApiKeyInfo` | interface | 5 | apps/web/src/api.ts |
| `ContextMap` | interface | 8 | apps/web/src/api.ts |
| `GeneratedFile` | interface | 5 | apps/web/src/api.ts |
| `GeneratedFilesResponse` | interface | 6 | apps/web/src/api.ts |
| *… 111 more* | | | |

When modifying domain models, update all downstream consumers (handlers, validators, tests).

## Agent Instructions

When working in this codebase:

- Use strict TypeScript. Avoid `any` types.
- Prefer functional components with hooks over class components.
- Run tests with vitest before committing.
- Use `pnpm` for dependency management. Do not mix package managers.

## Known Issues

- No CI/CD pipeline detected
- No lockfile found — dependency versions may be inconsistent

## Architecture Boundaries

Respect these layer separations:

- **presentation**: apps, frontend

## Key Entry Points

- **`apps/api/src/server.ts`**: `export const app = ...`
- **`apps/web/src/App.tsx`**: `export function App() { ... }`
- `apps/web/src/main.tsx`
- **`packages/context-engine/src/index.ts`**: `export type { ... }`, `export { ... }`
- **`packages/generator-core/src/index.ts`**: `export type { ... }`, `export { ... }`, `export { ... }`, `export { ... }`
- **`packages/repo-parser/src/index.ts`**: `export type { ... }`, `export { ... }`, `export { ... }`, `export { ... }`
- *... and 1 more*

## Configuration Files

### `apps/api/package.json`

```json
{
  "name": "@axis/api",
  "version": "0.5.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "node --test dist/**/*.test.js"
  },
  "dependencies": {
    "@axis/context-engine": "workspace:*",
    "@axis/generator-core": "workspace:*",
    "@axis/repo-parser": "workspace:*",
... (10 more lines)
```

### `apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}

```

### `apps/cli/package.json`

```json
{
  "name": "@axis/cli",
  "version": "0.5.0",
  "private": true,
  "type": "module",
  "bin": {
    "axis": "./bin/axis.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli.js"
  },
  "dependencies": {
    "@axis/snapshots": "workspace:*",
    "@axis/repo-parser": "workspace:*",
... (8 more lines)
```

---
*Generated by Axis Skills*
