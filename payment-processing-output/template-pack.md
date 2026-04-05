# Template Pack — avery-pay-platform

Generated: 2026-04-05T07:37:21.805Z

Obsidian note templates for consistent knowledge capture.

## Template: Decision Record

```markdown
---
type: decision
project: avery-pay-platform
date: {{date}}
status: proposed | accepted | deprecated
---
# Decision: {{title}}

## Context
What is the issue we're deciding on?

## Options Considered
1. Option A — description, pros, cons
2. Option B — description, pros, cons

## Decision
What we decided and why.

## Consequences
What changes as a result of this decision.

## Related
- [[architecture-summary]]
- [[]]
```

## Template: Meeting Notes

```markdown
---
type: meeting
project: avery-pay-platform
date: {{date}}
attendees: 
---
# Meeting: {{title}}

## Agenda
- 

## Notes
- 

## Action Items
- [ ] Item — @owner — due: 

## Decisions Made
- See [[decision-record-{{date}}]]
```

## Template: Bug Investigation

```markdown
---
type: investigation
project: avery-pay-platform
date: {{date}}
severity: low | medium | high | critical
status: investigating | root-caused | resolved
---
# Bug: {{title}}

## Symptoms
What was observed?

## Reproduction Steps
1. 

## Root Cause
See [[root-cause-checklist]] for systematic analysis.

## Fix
What was changed and why.

## Prevention
- [ ] Regression test added
- [ ] Monitoring updated
```

## Template: Technical Concept

```markdown
---
type: concept
project: avery-pay-platform
tags: ["go-backend/ (project_directory)", "frontend/ (project_directory)", "trust-fabric-frontend/ (project_directory)"]
---
# {{title}}

## Definition
One-paragraph explanation of this concept.

## In This Project
How this concept applies specifically to avery-pay-platform.

## Related Concepts
- [[]]

## Code References
- `path/to/file.ts` — description
```

## Template: Sprint Retrospective

```markdown
---
type: retrospective
project: avery-pay-platform
date: {{date}}
sprint: 
---
# Retro: Sprint {{sprint}}

## What Went Well
- 

## What Could Improve
- 

## Action Items
- [ ] 

## Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Velocity | | |
| Bugs Fixed | | |
| Tests Added | | |
```
