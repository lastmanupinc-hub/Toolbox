# AGENTS.md — axis-scalpel

## Project Context

This is a **medical_device** platform built with **Python**.
AXIS-Scalpel is a surgical robotics training system
with Gate 9 certification and deterministic execution.

### Stack

- Python · TypeScript · pytest

### Safety Constraints

- 12 enumerated refusal conditions
- Full audit trails for regulatory compliance
- Hash verification on every training run
- PCE (Perceptual Constraint Engine) boundaries

### Key Directories

- slate/core/ — Artifact management, validation, refusal enforcement
- slate/axis/ — CLI tools, evidence signing, facility management
- slate/tests/ — 186 passing tests across 3 phases

### Test Coverage

| Phase   | Tests | Status |
|---------|-------|--------|
| Phase 1 | 62    | PASS   |
| Phase 2 | 58    | PASS   |
| Phase 3 | 66    | PASS   |

### Refusal Conditions (12)

1. Missing authority binding
2. Expired capability envelope
3. Unsigned evidence artifact
4. Hash mismatch on training data
5. PCE boundary violation
6. Unregistered facility
7. Invalid operator credentials
8. Audit trail discontinuity
9. Determinism check failure
10. Unapproved model version
11. Missing phase prerequisite
12. Exhaustion proof absent

### Conventions

- Deterministic execution: same input → identical output
- Evidence signing: every artifact gets a hash
- Refusal-first: reject before accepting
- No runtime state in generators
