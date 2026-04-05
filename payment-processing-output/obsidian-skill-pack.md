# Obsidian Skill Pack — avery-pay-platform

> Vault workflows, templates, and prompt snippets for a static site project

## Daily Note Template

```markdown
# {{date:YYYY-MM-DD}} — Dev Log

## Focus
- [ ] Primary task:
- [ ] Secondary task:

## Decisions
- 

## Blockers
- 

## Notes
- 

## avery-pay-platform Changes
- Files modified:
- Tests added/changed:
- Commit:
```

## ADR Template

```markdown
# ADR-NNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing and/or doing?]

## Consequences
[What becomes easier or harder as a result?]

## References
- Project: [[avery-pay-platform]]
- Related ADRs:
```

## Prompt Snippets

Reusable AI prompt fragments for this project context:

### Project Context Preamble
```
I'm working on avery-pay-platform, a static site built with Go.
Stack: Svelte.
Conventions: TypeScript strict mode.
```

### Code Review Prompt
```
Review this code change for:
1. Correctness — does it do what it claims?
2. Edge cases — what inputs would break it?
3. Conventions — does it match the project style?
4. Tests — what test cases are missing?
```

### Bug Investigation Prompt
```
In avery-pay-platform (Go), I'm seeing [describe bug].
Steps to reproduce: [steps]
Expected: [expected behavior]
Actual: [actual behavior]
Help me trace this from the entry point to the failure.
```

## Recommended Vault Structure

```
vault/
├── Projects/
│   └── avery-pay-platform/
│       ├── Overview.md
│       ├── Architecture.md
│       ├── ADRs/
│       ├── Meeting Notes/
│       └── Retrospectives/
├── Daily Notes/
├── Templates/
│   ├── Daily Note.md
│   ├── ADR.md
│   └── Bug Report.md
├── Prompts/
│   ├── Context Preamble.md
│   ├── Code Review.md
│   └── Bug Investigation.md
└── References/
```
