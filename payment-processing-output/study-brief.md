# Study Brief — avery-pay-platform

> Structured learning guide for understanding this codebase

## Prerequisites

Before diving into this codebase, you should be comfortable with:

- **Go** — the primary language
- **Svelte** — used framework
- **Build tools**: vite

## Recommended Reading Order

### Phase 1: Orientation

1. Read the project README and any CONTRIBUTING.md
2. Understand the top-level directory structure:

   - `go-backend` — project_directory (1291 files)
   - `frontend` — project_directory (217 files)
   - `trust-fabric-frontend` — project_directory (92 files)
   - `archive` — project_directory (79 files)
   - `src` — application_source (41 files)
   - `wedge_portfolio` — project_directory (15 files)
   - `docs` — documentation (11 files)
   - `scripts` — build_scripts (11 files)

### Phase 2: Entry Points

Start with these files to understand the application flow:

- `src/index.ts` — Application entry point

### Phase 3: Core Abstractions

These are the key concepts to understand:

- **go-backend/ (project_directory)**
- **frontend/ (project_directory)**
- **trust-fabric-frontend/ (project_directory)**
- **archive/ (project_directory)**
- **src/ (application_source)**
- **wedge_portfolio/ (project_directory)**
- **docs/ (documentation)**
- **scripts/ (build_scripts)**

### Phase 4: Data Flow

Trace the flow of data through the system:

Key routes to trace:

- `GET /` → `go-backend/tests/trustflow/trustflow_certification_test.go`
- `POST /v1/payments` → `go-backend/tests/trustflow/trustflow_certification_test.go`
- `POST /v1/payouts` → `go-backend/tests/trustflow/trustflow_certification_test.go`
- `POST /v1/kyc/check` → `go-backend/tests/trustflow/trustflow_certification_test.go`
- `POST /v1/providers/:name/connect` → `go-backend/tests/trustflow/trustflow_certification_test.go`

### Phase 5: Testing

Test framework: **vitest**

- Run the test suite to verify your environment
- Read test files — they're the best documentation of expected behavior
- Modify one test, break it, fix it — confirm your understanding

## Study Questions

Answer these to confirm understanding:

1. What is the primary purpose of avery-pay-platform?
2. What happens when a request enters the system?
3. Where is state stored and how is it managed?
4. What are the key boundaries between modules?
5. What would break if you renamed the primary entry point?
