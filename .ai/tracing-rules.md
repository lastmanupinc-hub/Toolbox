# AXIS Toolbox — Tracing Rules

## Trace Paths

### Trace 1: Full Snapshot Pipeline
```
POST /v1/snapshots (apps/api/src/handlers.ts)
  → validateSnapshotInput() (apps/api/src/validation.ts)
  → createSnapshot() (packages/snapshots/src/store.ts)
    → INSERT INTO snapshots (SQLite)
  → ingestFiles() (packages/snapshots/src/ingest.ts)
    → extractArchive() or fetchGitHub()
  → parseRepo() (packages/repo-parser/src/parser.ts)
    → detectLanguages() (packages/repo-parser/src/language-detector.ts)
    → detectFrameworks() (packages/repo-parser/src/framework-detector.ts)
    → resolveImports() (packages/repo-parser/src/import-resolver.ts)
  → buildContextMap() (packages/context-engine/src/context-map.ts)
  → buildRepoProfile() (packages/context-engine/src/repo-profile.ts)
  → updateSnapshotStatus("ready") (packages/snapshots/src/store.ts)
```

### Trace 2: Generator Execution
```
POST /v1/{program}/generate (apps/api/src/handlers.ts)
  → getSnapshot(snapshotId) (packages/snapshots/src/store.ts)
  → loadContextMap() (packages/context-engine/src/context-map.ts)
  → loadRepoProfile() (packages/context-engine/src/repo-profile.ts)
  → runGenerators(program) (packages/generator-core/src/engine.ts)
    → for each generator in program.generators:
      → generator.generate(context) (packages/generator-core/src/generators/{program}/*.ts)
      → renderTemplate(template, data) (packages/generator-core/src/template.ts)
    → validateDeterminism(outputs) (packages/generator-core/src/determinism.ts)
  → storeGeneratedFiles() (packages/snapshots/src/store.ts)
  → return generatedFiles[]
```

### Trace 3: API Authentication & Authorization
```
ANY /v1/* (apps/api/src/middleware.ts)
  → extractApiKey(headers["x-api-key"])
  → validateApiKey() (packages/snapshots/src/store.ts)
    → SELECT FROM api_keys WHERE key = ? AND revoked = false
  → checkRateLimit(accountId) (apps/api/src/rate-limiter.ts)
    → free: 60/min, pro: 120/min
  → checkTierAccess(accountId, program) (apps/api/src/authorization.ts)
    → free programs: search, skills, debug (always allowed)
    → pro programs: check account.entitled_programs
  → checkQuota(accountId, program) (apps/api/src/authorization.ts)
    → GET usage vs quota for meter
  → proceed to handler
```

### Trace 4: Web SPA User Journey
```
apps/web/src/App.tsx (entry)
  → Router: / → Dashboard
  → Dashboard tabs:
    → Upload tab → UploadForm.tsx
      → handleUpload() → POST /v1/snapshots (apps/api)
      → onProgress() → ProgressIndicator.tsx
    → Analytics tab → AnalyticsView.tsx
      → GET /v1/account/usage
    → Files tab → FilesView.tsx
      → GET /v1/projects/:id/generated-files
      → FileViewer.tsx (syntax highlighting)
    → Settings tab → SettingsView.tsx
      → API keys: GET/POST /v1/account/keys
      → GitHub token: POST /v1/account/github-token
  → CommandPalette (Ctrl+K) → CommandPalette.tsx
  → ToastNotifications → Toast.tsx
```

### Trace 5: CLI Pipeline
```
$ axis analyze <directory>
  → apps/cli/src/index.ts
  → parseArgs() → validate directory exists
  → scanDirectory() → collect files
  → POST to local or remote /v1/snapshots
    (or) direct in-process:
  → parseRepo(files) (packages/repo-parser)
  → buildContextMap() (packages/context-engine)
  → runAllGenerators() (packages/generator-core)
  → writeOutputFiles(.ai-output/) → local filesystem
  → printSummary() → CLI output

$ axis github <url>
  → apps/cli/src/index.ts
  → parseArgs() → validate GitHub URL
  → fetchRepo(url, token?) → download archive
  → (same pipeline as above from parseRepo)
```

### Trace 6: Database Maintenance
```
POST /v1/db/maintenance (apps/api/src/handlers.ts)
  → authenticateAdmin() (apps/api/src/middleware.ts)
  → runMaintenance() (packages/snapshots/src/store.ts)
    → PRAGMA integrity_check
    → PRAGMA wal_checkpoint(TRUNCATE)
    → VACUUM
    → ANALYZE
  → return { integrity: "ok", wal_frames: 0, vacuum: "complete" }

GET /v1/health/ready (apps/api/src/handlers.ts)
  → checkDatabaseConnection() (packages/snapshots/src/store.ts)
    → SELECT 1 FROM snapshots LIMIT 1
  → checkDiskSpace() → stat /data volume
  → return { status: "ready", db: "ok", disk_pct: N }
```

---

## Incident Template

### Severity Definitions

| Level | Code | Criteria | Response Time |
|-------|------|----------|---------------|
| P0 | CRITICAL | Data corruption, security breach, total outage | Immediate |
| P1 | HIGH | Core pipeline broken, all generators failing, API down | < 1 hour |
| P2 | MEDIUM | Single program broken, partial failure, degraded performance | < 4 hours |
| P3 | LOW | Cosmetic, docs, minor UX issue, single edge case | Next session |

### Incident Categories

| Code | Category | Scope |
|------|----------|-------|
| PIPE | Pipeline | Snapshot ingestion, parsing, context building |
| GEN | Generator | Template engine, output generation, determinism |
| API | API Server | Endpoint handlers, routing, middleware, auth |
| DB | Database | SQLite, WAL, schema, integrity |
| WEB | Web Frontend | React SPA, dashboard, file viewer |
| GOV | Governance | YAML files, session policy, memory hygiene |
| DEP | Deployment | Render, Cloudflare, GitHub Actions, Docker |
| BILL | Billing | Metering, quotas, tiers, entitlements |

### Incident Report Template

```yaml
incident:
  id: "INC-YYYY-MM-DD-NNN"
  severity: P0|P1|P2|P3
  category: PIPE|GEN|API|DB|WEB|GOV|DEP|BILL
  title: ""
  reporter: ""
  detected_at: ""
  resolved_at: ""

symptoms:
  user_impact: ""
  error_message: ""
  affected_endpoints: []
  affected_programs: []

root_cause:
  component: ""
  file: ""
  function: ""
  description: ""

resolution:
  action: ""
  commit: ""
  test_added: true|false
  determinism_verified: true|false

prevention:
  what_was_missing: ""
  rule_added: ""
  test_coverage_change: ""
```
