# Dependency Hotspots — avery-pay-platform

Generated: 2026-04-05T07:37:21.800Z

## Risk Summary

| Severity | Count |
|----------|-------|
| High (>7) | 0 |
| Medium (4–7) | 0 |
| Low (≤4) | 10 |
| **Total** | **10** |

## Hotspot Files

| File | Risk | Inbound | Outbound | Total Connections |
|------|------|---------|----------|-------------------|
| `frontend/src/lib/api/types.ts` | 🟢 1.0 | 103 | 0 | 103 |
| `frontend/src/lib/api/client.ts` | 🟢 1.0 | 1 | 102 | 103 |
| `trust-fabric-frontend/src/lib/api/types.ts` | 🟢 1.0 | 104 | 0 | 104 |
| `trust-fabric-frontend/src/lib/api/client.ts` | 🟢 1.0 | 0 | 104 | 104 |
| `archive/trust-fabric-frontend/src/lib/api/client.ts` | 🟢 0.9 | 18 | 0 | 18 |
| `archive/trust-fabric-frontend/src/lib/api/client.test.ts` | 🟢 0.9 | 0 | 18 | 18 |
| `src/domain/models/PaymentIntent.ts` | 🟢 0.5 | 9 | 0 | 9 |
| `frontend/src/lib/pos/types.ts` | 🟢 0.1 | 3 | 0 | 3 |
| `src/domain/models/FinancialEvent.ts` | 🟢 0.1 | 3 | 0 | 3 |
| `src/domain/models/Account.ts` | 🟢 0.1 | 3 | 0 | 3 |

## Coupling Analysis

### `frontend/src/lib/api/types.ts`

- **Risk Score**: 1.0/10
- **Inbound**: 103 files depend on this
- **Outbound**: 0 dependencies
- **Refactor Priority**: LOW — acceptable coupling

### `frontend/src/lib/api/client.ts`

- **Risk Score**: 1.0/10
- **Inbound**: 1 files depend on this
- **Outbound**: 102 dependencies
- **Refactor Priority**: LOW — acceptable coupling

### `trust-fabric-frontend/src/lib/api/types.ts`

- **Risk Score**: 1.0/10
- **Inbound**: 104 files depend on this
- **Outbound**: 0 dependencies
- **Refactor Priority**: LOW — acceptable coupling

### `trust-fabric-frontend/src/lib/api/client.ts`

- **Risk Score**: 1.0/10
- **Inbound**: 0 files depend on this
- **Outbound**: 104 dependencies
- **Refactor Priority**: LOW — acceptable coupling

### `archive/trust-fabric-frontend/src/lib/api/client.ts`

- **Risk Score**: 0.9/10
- **Inbound**: 18 files depend on this
- **Outbound**: 0 dependencies
- **Refactor Priority**: LOW — acceptable coupling

## External Dependency Risk

| Package | Version | Risk Factor |
|---------|---------|-------------|
| @types/node | ^20.10.0 | Stable |
| typescript | ^5.3.0 | Stable |
| vitest | ^4.1.0 | Stable |

## Recommendations

1. **Review circular dependencies** in the import graph
