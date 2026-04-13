# 1. SpaceY = enterprise platform with deterministic boundaries for side effects.
# 2. Node.js + React + TypeScript. 56 files. Babble DSL compiler included.
# 3. 4-outcome authorization model: compliance / violation / no-outcome / invalid.
# 4. Build: `npm run build`. Test: `npx vitest run`. Dev: `npm run dev`.
# 5. Babble DSL: custom language for policy definition. Compiler in babble/ directory.
# 6. CI gate: publication requires all test vectors to pass. No manual overrides.
# 7. Deterministic: every boundary evaluation produces reproducible results.
# 8. Supersession: governance rules can be superseded with audit trail.
# 9. Canon: reference data is immutable once published.
# 10. No "I will create..." statements — all artifacts must exist as files.
