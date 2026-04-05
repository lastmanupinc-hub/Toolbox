# Optimization Rules — avery-pay-platform

> Prompt and context efficiency guidelines for a static site (Go)

## Context Window Budget

| Metric | Value |
|--------|-------|
| Total files | 1829 |
| Total LOC | 417,166 |
| Average LOC / file | 228 |
| Estimated token count | ~1,877,247 |

**Warning:** This project exceeds most context windows. Use selective context loading.

## High-Value Files

Include these files first when constructing prompts — they carry the most architectural signal:

### Dependency Hotspots

| File | Inbound | Outbound | Risk |
|------|---------|----------|------|
| `frontend/src/lib/api/types.ts` | 103 | 0 | 1.0 |
| `frontend/src/lib/api/client.ts` | 1 | 102 | 1.0 |
| `trust-fabric-frontend/src/lib/api/types.ts` | 104 | 0 | 1.0 |
| `trust-fabric-frontend/src/lib/api/client.ts` | 0 | 104 | 1.0 |
| `archive/trust-fabric-frontend/src/lib/api/client.ts` | 18 | 0 | 0.9 |
| `archive/trust-fabric-frontend/src/lib/api/client.test.ts` | 0 | 18 | 0.9 |
| `src/domain/models/PaymentIntent.ts` | 9 | 0 | 0.5 |
| `frontend/src/lib/pos/types.ts` | 3 | 0 | 0.1 |
| `src/domain/models/FinancialEvent.ts` | 3 | 0 | 0.1 |
| `src/domain/models/Account.ts` | 3 | 0 | 0.1 |

### Entry Points

- `src/index.ts` — Application entry point (app_entry)

## Low-Value Files (Exclude from Prompts)

These file types add noise without architectural value:

- *.lock, *.lockb (dependency lockfiles)
- *.min.js, *.min.css (minified bundles)
- *.map (source maps)
- dist/, build/, .next/, out/ (build artifacts)
- node_modules/ (dependencies)
- .git/ (version control)
- *.svg, *.png, *.jpg (binary assets)
- coverage/ (test coverage reports)

## Prompt Strategy

## Conventions to Embed in Prompts

Include these as system-level constraints when generating code:

- TypeScript strict mode

## Architecture Patterns

Reference these patterns in prompts for architectural consistency:

- containerized

## Optimization Warnings

- ⚠️ No CI/CD pipeline detected
- ⚠️ No lockfile found — dependency versions may be inconsistent
