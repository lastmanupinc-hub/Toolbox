# Superpower Pack — avery-pay-platform

> High-leverage development workflows for a static site (Go)

## Quick Actions

Copy-paste-ready commands for common high-value operations:

### Build & Run

```bash
# Install dependencies
npm install

# Build
npm run build

# Dev server
npm run dev
```

### Testing

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest

# Single file
npx vitest run <file>

# Coverage
npx vitest run --coverage
```

### Debugging Workflow

1. **Reproduce** — Create a minimal test case that triggers the bug
2. **Isolate** — Use dependency hotspots to narrow the search area:

   - `frontend/src/lib/api/types.ts` (risk: 1.0, 103 inbound, 0 outbound)
   - `frontend/src/lib/api/client.ts` (risk: 1.0, 1 inbound, 102 outbound)
   - `trust-fabric-frontend/src/lib/api/types.ts` (risk: 1.0, 104 inbound, 0 outbound)
   - `trust-fabric-frontend/src/lib/api/client.ts` (risk: 1.0, 0 inbound, 104 outbound)
   - `archive/trust-fabric-frontend/src/lib/api/client.ts` (risk: 0.9, 18 inbound, 0 outbound)

3. **Trace** — Follow the import chain from entry point to failure
4. **Fix** — Make the smallest change that resolves the issue
5. **Verify** — Run the test case + full suite to confirm no regressions

## Code Review Checklist

- [ ] Types are correct and meaningful (no `any`, no untyped casts)
- [ ] Error paths are handled (not just the happy path)
- [ ] New code has test coverage
- [ ] No debug artifacts (console.log, TODO, commented code)
- [ ] Import graph doesn't create new circular dependencies
- [ ] Changes follow detected conventions:
  - TypeScript strict mode

## Planning Template

```markdown
## Task: [title]

### What
[One sentence describing the change]

### Why
[Business or technical reason]

### Files to Touch
- [ ] file1.ts — [what changes]
- [ ] file2.ts — [what changes]

### Tests
- [ ] [test case 1]
- [ ] [test case 2]

### Risks
- [potential issue and mitigation]
```
