# AGENTS.md — axis-platform-slate

## Project Context

This is a **certification_system** built with **Python**.
Slate contains Gate 1–9 certified implementation of the
AXIS Platform Spine with artifact-first architecture.

### Stack

- Python · YAML · JSON · Shell

### Gate Certification Status

| Gate | Name              | Status     |
|------|-------------------|------------|
| 1    | Foundation        | CERTIFIED  |
| 2    | Core Components   | CERTIFIED  |
| 3    | Runtime           | CERTIFIED  |
| 4    | Design Suite      | CERTIFIED  |
| 5    | Enterprise Ops    | CERTIFIED  |
| 6    | Input Layer       | CERTIFIED  |
| 7    | Build Process     | CERTIFIED  |
| 8    | Integration       | CERTIFIED  |
| 9    | Medical Crossmap  | CERTIFIED  |

### Architecture (4 Areas)

- A1: Core — artifact management, validation
- A2: Runtime — deterministic execution engine
- A3: Design Suite — .axp pack format, schemas
- A4: Enterprise Ops — deployment, monitoring

### Key Documents

- ARTIFACT_FIRST.md — Primary development model
- ENTERPRISE_FEATURES.md — Complete feature list
- BUILD_PROCESS.md — Steps 0–9 with exit criteria
- GATE9_CERTIFICATION.md — 537-line certification report
- AXIS_ENGINE_DEVELOPMENT_ROADMAP.md — Phase 0–6

### Build Process (Steps 0–9)

Each step has entry criteria, required artifacts,
and exit evidence. No step may be skipped.
Format: .axp deterministic packs.

### Conventions

- Artifact-first: no spec without artifact
- Deterministic: same input → identical pack
- Evidence-required: no gate passes without proof
- No spec drift: docs match implementation
