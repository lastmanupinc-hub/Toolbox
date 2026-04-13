# AGENTS.md — spacey

## Project Context

This is an **enterprise_platform** built with **TypeScript**.
SpaceY enforces deterministic boundaries for side effects
with a custom Babble DSL compiler and 4-outcome auth model.

### Stack

- Node.js · React · TypeScript · Babble DSL · Vitest

### Architecture

- Monorepo (apps/ + services/ + compiler/)
- Deterministic boundary evaluation
- 4 terminal states: compliance / violation / no-outcome / invalid

### Key Components

| Component              | Role                         |
|------------------------|------------------------------|
| BabbleEditor.tsx       | DSL policy editor + compiler |
| AuthorizationView.tsx  | 4-outcome authorization      |
| CanonBrowser.tsx       | Canon reference browser      |
| VerificationViewer.tsx | Verification artifacts       |
| GovernanceViewer.tsx   | Supersession viewer          |
| AuditLogExplorer.tsx   | Audit log query UI           |

### Key Directories

- apps/web/src/components/ — React components
- apps/web/src/pages/ — Page components
- apps/web/src/services/ — API client
- babble/ — DSL compiler source

### Conventions

- TypeScript strict mode everywhere
- Deterministic boundaries: side effects are explicit
- CI publication gate: no deploy without passing gates
- Test vectors: expected outcomes defined upfront
