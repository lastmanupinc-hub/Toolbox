# Root Cause Checklist — avery-pay-platform

Generated: 2026-04-05T07:37:21.800Z

## Triage Workflow

```
1. Reproduce → 2. Isolate → 3. Trace → 4. Root Cause → 5. Fix → 6. Verify → 7. Prevent
```

## Step 1: Reproduction

- [ ] Can you reproduce the issue consistently?
- [ ] What is the minimum input/state to trigger it?
- [ ] Does it reproduce in all environments (dev, staging, prod)?
- [ ] Is it timing-dependent (race condition, timeout)?

## Step 2: Isolation

- [ ] Which layer does the error surface in? (UI / API / DB / External)
- [ ] Which architectural pattern is involved? (Detected: containerized)
- [ ] Can you remove middleware/plugins to narrow the source?
- [ ] Does the issue persist with mocked dependencies?

## Step 3: Trace

- [ ] Add breakpoints in suspected code paths
- [ ] Check for unhandled promise rejections
- [ ] Review recent git changes (`git log --oneline -20`)

## Step 4: Root Cause Categories

| Category | Check | Typical Fix |
|----------|-------|-------------|
| State mutation | Shared mutable state modified concurrently | Immutable updates, copy-on-write |
| Race condition | Async operations with unguarded order | Mutex, semaphore, serial queue |
| Type mismatch | Runtime type differs from expected | Input validation, zod/yup schema |
| Null reference | Accessing property of undefined | Optional chaining, null guards |
| Resource leak | Connections/handles not released | try/finally, disposal pattern |
| Configuration | Wrong env var, missing secret | Environment diff, config validation |
| Dependency | Breaking change in library update | Lock versions, review changelogs |
| Data integrity | Corrupt/stale data in store | Migration, cache invalidation |

## Step 5: Suspect Files (by coupling)

High-coupling files are more likely to be involved in cross-cutting bugs:

- [ ] `frontend/src/lib/api/types.ts` — risk 1.0, 103 inbound, 0 outbound
- [ ] `frontend/src/lib/api/client.ts` — risk 1.0, 1 inbound, 102 outbound
- [ ] `trust-fabric-frontend/src/lib/api/types.ts` — risk 1.0, 104 inbound, 0 outbound
- [ ] `trust-fabric-frontend/src/lib/api/client.ts` — risk 1.0, 0 inbound, 104 outbound
- [ ] `archive/trust-fabric-frontend/src/lib/api/client.ts` — risk 0.9, 18 inbound, 0 outbound
- [ ] `archive/trust-fabric-frontend/src/lib/api/client.test.ts` — risk 0.9, 0 inbound, 18 outbound
- [ ] `src/domain/models/PaymentIntent.ts` — risk 0.5, 9 inbound, 0 outbound
- [ ] `frontend/src/lib/pos/types.ts` — risk 0.1, 3 inbound, 0 outbound

## Step 6: Verification

- [ ] Does the fix resolve the original reproduction case?
- [ ] Do all existing tests still pass?
- [ ] Is a new test added for this specific failure mode?
- [ ] Has the fix been reviewed for side effects on coupled files?

## Step 7: Prevention

- [ ] Add regression test
- [ ] Add monitoring/alerting for this failure class
- [ ] Update incident template if this is a new category
- [ ] Document root cause in team knowledge base
