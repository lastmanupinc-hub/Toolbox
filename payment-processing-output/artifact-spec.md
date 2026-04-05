# Artifact Specification — avery-pay-platform

Generated: 2026-04-05T07:37:21.795Z

## Project Overview

| Field | Value |
|-------|-------|
| Name | avery-pay-platform |
| Type | static_site |
| Language | Go |
| Frameworks | Svelte |

## Language Distribution

- **Go**: 73.4% ███████████████ (1054 files, 303678 LOC)
- **YAML**: 9.6% ██ (129 files, 39835 LOC)
- **Svelte**: 6.6% █ (196 files, 27505 LOC)
- **TypeScript**: 4.2% █ (167 files, 17577 LOC)
- **Markdown**: 3.4% █ (66 files, 14091 LOC)
- **SQL**: 1.2% █ (129 files, 4824 LOC)
- **HTML**: 0.7% █ (7 files, 3038 LOC)
- **JSON**: 0.2% █ (20 files, 997 LOC)
- **PowerShell**: 0.2% █ (9 files, 987 LOC)
- **Shell**: 0.2% █ (11 files, 663 LOC)
- **CSS**: 0.1% █ (3 files, 479 LOC)
- **JavaScript**: 0% █ (5 files, 164 LOC)
- **Dockerfile**: 0% █ (2 files, 29 LOC)
- **XML**: 0% █ (1 files, 15 LOC)
- **TOML**: 0% █ (1 files, 3 LOC)

## Architecture

### Patterns Detected
- containerized

## Entry Points

| Path | Type | Description |
|------|------|-------------|
| `src/index.ts` | app_entry | Application entry point |

## Hotspots

| Path | Inbound | Outbound | Risk |
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

## Artifact Generation Rules

When generating artifacts for this project:

1. **Component artifacts** should use Svelte conventions
2. **Widget artifacts** should render project metrics from real data
3. **Embed snippets** should include all conventions and warnings
4. **File naming** should follow Go conventions
5. **Architecture score**: 0/100

## Dependencies (Top 10)

- `@types/node` @ ^20.10.0
- `typescript` @ ^5.3.0
- `vitest` @ ^4.1.0
