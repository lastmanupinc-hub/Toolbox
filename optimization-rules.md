# AXIS Toolbox — Optimization Rules

## Context Budget

### Token Allocation Model

The AXIS Toolbox codebase has the following context profile when loaded into an AI coding assistant:

| Component | Estimated Tokens | Priority | Load Strategy |
|-----------|-----------------|----------|---------------|
| AGENTS.md | ~2,500 | P0 — Always | Auto-loaded by agent |
| CLAUDE.md | ~500 | P0 — Always | Auto-loaded by agent |
| .cursorrules | ~400 | P0 — Always | Auto-loaded by editor |
| continuation.yaml | ~8,000 | P1 — Session start | Read on first turn |
| axis_all_tools.yaml | ~5,000 | P1 — Session start | Read on first turn |
| begin.yaml | ~2,000 | P1 — Session start | Read on first turn |
| packages/generator-core | ~15,000 | P2 — On demand | Read when editing generators |
| apps/api/handlers.ts | ~8,000 | P2 — On demand | Read when editing API |
| packages/repo-parser | ~6,000 | P2 — On demand | Read when editing detection |
| packages/context-engine | ~5,000 | P2 — On demand | Read when editing analysis |
| packages/snapshots/store.ts | ~3,000 | P2 — On demand | Read when editing DB |
| apps/web/src/ | ~8,000 | P3 — Rarely needed | Read when editing frontend |
| Test files (101) | ~25,000 | P3 — Rarely needed | Read specific test file |
| All YAML governance (12) | ~25,000 | P3 — Reference | Load individual file as needed |

**Total Codebase**: ~115,000 tokens (estimated)
**Effective Working Context**: ~20,000 tokens (P0 + P1 loaded, P2 on demand)

### Optimization Strategy

1. **P0 files are free** — AGENTS.md, CLAUDE.md, .cursorrules are loaded automatically. Keep them concise and accurate.
2. **P1 files load once per session** — continuation.yaml and axis_all_tools.yaml establish session truth. Read once, reference from memory.
3. **P2 files load on demand** — Only read the package you're actively editing. Never read all packages simultaneously.
4. **P3 files are emergency reads** — Test files and frontend code load only when directly editing or debugging.

### Anti-Patterns

| Anti-Pattern | Token Cost | Alternative |
|-------------|-----------|-------------|
| Reading all 12 YAML files at session start | ~25,000 | Read begin.yaml + continuation.yaml only. Reference others by name. |
| Loading all test files to "understand coverage" | ~25,000 | Run `vitest --reporter=verbose` and read the output (~500 tokens) |
| Reading apps/web/* for API changes | ~8,000 | Web app is isolated. API changes don't require frontend reads. |
| Re-reading files already loaded in context | Variable | Track which files are in context. Never re-read. |
| Searching for code patterns with broad grep | ~5,000 | Use semantic search with precise queries |

---

## Cost Model

### Per-Session Token Budget

| Activity | Tokens In | Tokens Out | Estimated Cost (Claude) |
|----------|----------|------------|------------------------|
| Session start (P0 + P1 load) | ~18,000 | ~500 | ~$0.07 |
| Single generator edit | ~5,000 | ~2,000 | ~$0.05 |
| New endpoint (handler + test) | ~10,000 | ~4,000 | ~$0.10 |
| New program module (full vertical) | ~25,000 | ~15,000 | ~$0.30 |
| Snapshot compilation | ~50,000 | ~10,000 | ~$0.40 |
| Full session (typical) | ~80,000 | ~30,000 | ~$0.75 |

### Token Efficiency Ratios

| Metric | Target | Current Estimate |
|--------|--------|-----------------|
| Value tokens / Total tokens | > 60% | ~65% |
| Wasted re-reads / Total reads | < 10% | ~12% |
| Successful edits / Total edits | > 90% | ~88% |
| Tests passing after edit / Edits | > 85% | ~90% |

---

## Caching Strategy

### Session-Level Cache

These facts should be established once and never re-verified mid-session:

```
CACHE_ONCE:
  - Project: axis-toolbox v0.4.0
  - Runtime: Node.js >=20, TypeScript 5.7 strict, pnpm
  - Test framework: Vitest 4.1
  - Database: SQLite WAL via better-sqlite3
  - HTTP: Custom zero-dep router on port 4000
  - Frontend: React 19 + Vite 6 on port 5173
  - Programs: 17 total, 80 generators
  - Governance: 12 YAML files
  - CI: GitHub Actions, Node 20/22 matrix
  - Deploy: Render (API) + Cloudflare Pages (Web)
```

### Invalidation Triggers

| Event | Invalidate |
|-------|-----------|
| `pnpm install` | Package versions, dependency tree |
| New file in generator-core/ | Generator count, program spec |
| Edit to axis_all_tools.yaml | Program definitions, output contracts |
| Edit to continuation.yaml | Session state, execution queue |
| `git pull` / branch switch | Everything — full re-scan required |
| Schema change in snapshots/ | Database structure, migration state |

---

## Build & Test Performance

### Expected Timings

| Command | Expected Duration | Token Cost to Run |
|---------|------------------|------------------|
| `pnpm build` | ~15s | 0 (terminal) |
| `pnpm test` | ~8s (2,910 tests) | 0 (terminal) |
| `pnpm test -- --reporter=verbose` | ~10s | ~2,000 (output) |
| `pnpm test -- --coverage` | ~20s | ~3,000 (output) |
| `axis analyze .` (self-analysis) | ~30s | 0 (terminal) |
| Single test file | ~2s | ~500 (output) |

### Optimization Rules for CI

1. Run single test file during development, full suite before commit
2. Use `--reporter=dot` for pass/fail only (~100 tokens of output)
3. Coverage report: read summary line only unless investigating a specific file
4. Parallel test execution: Vitest handles this natively, no manual sharding needed

---

## Context Window Management

### For 200K Context Models (Claude Opus/Sonnet)

The entire AXIS Toolbox codebase (~115K tokens) fits within a single context window. This means:
- Full snapshot compilation is feasible in one pass
- Cross-package refactoring can reference all affected files simultaneously
- Test verification can include both implementation and test file

### For 128K Context Models

Prioritize:
1. AGENTS.md + CLAUDE.md (always)
2. The specific package being edited
3. Related test file
4. continuation.yaml (for state context)

Drop from context:
- Other packages not being edited
- apps/web/ (unless frontend work)
- Historical YAML governance files (begin.yaml, memory_generator.yaml)

### For 32K Context Models

Emergency mode:
1. CLAUDE.md only (500 tokens)
2. Single file being edited
3. Single test file
4. Run tests in terminal, paste only failures
