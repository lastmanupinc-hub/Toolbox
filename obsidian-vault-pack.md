# AXIS Toolbox — Obsidian Vault Pack

## Vault Structure

```
AXIS-Toolbox-Vault/
├── 00-MOCs/
│   ├── Architecture MOC.md
│   ├── Programs MOC.md
│   ├── Governance MOC.md
│   ├── Testing MOC.md
│   └── Deployment MOC.md
├── 01-Architecture/
│   ├── System Overview.md
│   ├── Package Dependencies.md
│   ├── Execution Pipeline.md
│   ├── Database Schema.md
│   ├── API Surface.md
│   └── Frontend Dashboard.md
├── 02-Programs/
│   ├── Program Index.md
│   ├── Search.md
│   ├── Debug.md
│   ├── Skills.md
│   ├── Frontend + SEO.md
│   ├── Theme.md
│   ├── Brand.md
│   ├── Notebook.md
│   ├── Artifacts.md
│   ├── Optimization.md
│   ├── Marketing.md
│   ├── MCP.md
│   ├── Obsidian.md
│   ├── Superpowers.md
│   ├── Remotion.md
│   ├── Canvas.md
│   └── Algorithmic.md
├── 03-Governance/
│   ├── YAML Constitution.md
│   ├── begin.yaml.md
│   ├── continuation.yaml.md
│   ├── axis_all_tools.yaml.md
│   ├── snapshot_protocol.yaml.md
│   ├── rules_to_compile_snapshot.yaml.md
│   ├── automated_remedial_action.yaml.md
│   ├── hygiene_and_memory.yaml.md
│   ├── memory_generator.yaml.md
│   ├── capability_inventory.yaml.md
│   ├── human_user_audt.yaml.md
│   ├── static_analysis_phase.yaml.md
│   └── render.yaml.md
├── 04-Packages/
│   ├── generator-core.md
│   ├── repo-parser.md
│   ├── context-engine.md
│   └── snapshots.md
├── 05-Invariants/
│   ├── Zero External HTTP Deps.md
│   ├── Deterministic Generators.md
│   ├── SQLite Only.md
│   ├── Vanilla CSS.md
│   ├── YAML Truth Source.md
│   ├── Evidence-Required Promotion.md
│   ├── Per-Program Billing.md
│   ├── Snapshot Single Source.md
│   ├── Session Gate.md
│   └── Continuous Self-Audit.md
├── 06-Sessions/
│   ├── Session Template.md
│   └── (session logs go here)
├── 07-Evidence/
│   ├── Test Results/
│   ├── Coverage Reports/
│   └── Capability Audits/
├── Templates/
│   ├── Program Template.md
│   ├── Session Log Template.md
│   ├── Governance Note Template.md
│   └── Invariant Template.md
└── .obsidian/
    └── (workspace config)
```

---

## Maps of Content (MOCs)

### Architecture MOC

```markdown
# Architecture MOC

## System Layers
- [[System Overview]] — Full system diagram and layer map
- [[Execution Pipeline]] — 8-step pipeline from upload to artifacts
- [[Package Dependencies]] — Dependency flow across 4 packages

## Infrastructure
- [[Database Schema]] — SQLite WAL, 5 tables
- [[API Surface]] — 75+ REST endpoints
- [[Frontend Dashboard]] — React 19 + Vite 6 SPA

## Packages
- [[generator-core]] — 80 generators, template engine
- [[repo-parser]] — 60+ languages, 10+ frameworks
- [[context-engine]] — Context map, repo profile
- [[snapshots]] — SQLite store, intake pipeline

## Key Metrics
| Metric | Value |
|--------|-------|
| Endpoints | 75+ |
| Generators | 80 |
| Languages | 60+ |
| Frameworks | 10+ |
| Tables | 5 |
```

### Programs MOC

```markdown
# Programs MOC

## Free Tier
- [[Search]] — 4 generators: context-map, repo-profile, architecture-summary, dependency-hotspots
- [[Debug]] — 4 generators: playbook, tracing, error-catalog, health-check
- [[Skills]] — 5 generators: AGENTS.md, CLAUDE.md, .cursorrules, workflow, copilot-instructions

## Pro Tier
- [[Frontend + SEO]] — 5 generators
- [[Theme]] — 3 generators
- [[Brand]] — 4 generators
- [[Notebook]] — 4 generators
- [[Artifacts]] — 5 generators
- [[Optimization]] — 4 generators
- [[Marketing]] — 6 generators
- [[MCP]] — 4 generators
- [[Obsidian]] — 5 generators
- [[Superpowers]] — 4 generators
- [[Remotion]] — 5 generators
- [[Canvas]] — 4 generators
- [[Algorithmic]] — 5 generators

## Aggregate
| Stat | Value |
|------|-------|
| Total programs | 17 |
| Total generators | 80 |
| Free generators | 13 |
| Pro generators | 67 |
| Grade A | 81/82 |
```

### Governance MOC

```markdown
# Governance MOC

The 12 YAML files form a constitutional hierarchy.

## Session Control
- [[begin.yaml]] — 8 gate conditions for session entry
- [[continuation.yaml]] — Live state ledger (ground truth, 2000+ lines)

## Program Definition
- [[axis_all_tools.yaml]] — CANONICAL spec (supersedes all other sources)
- [[snapshot_protocol.yaml]] — 5 input methods, processing pipeline

## Quality Assurance
- [[automated_remedial_action.yaml]] — Self-audit loop, focus scoring
- [[capability_inventory.yaml]] — Grade A/B/F with evidence requirements
- [[human_user_audt.yaml]] — QA severity: blocker → strategic_gap
- [[rules_to_compile_snapshot.yaml]] — 13 required sections, anti-false-completion

## Behavior Control
- [[hygiene_and_memory.yaml]] — 4-phase behavior routing
- [[memory_generator.yaml]] — MEMORY.yaml v2.0, 6 typed layers
- [[static_analysis_phase.yaml]] — Deterministic dev spec

## Deployment
- [[render.yaml]] — Docker, Render starter plan, Oregon
```

---

## Dataview Queries

### All Programs by Generator Count

```dataview
TABLE generators AS "Generators", tier AS "Tier", grade AS "Grade"
FROM "02-Programs"
WHERE file.name != "Program Index"
SORT generators DESC
```

### Governance Files by Category

```dataview
TABLE category AS "Category", purpose AS "Purpose"
FROM "03-Governance"
WHERE file.name != "YAML Constitution"
SORT category ASC
```

### Invariants Status

```dataview
TABLE status AS "Status", enforcement AS "Enforcement", evidence AS "Evidence"
FROM "05-Invariants"
SORT file.name ASC
```

### Recent Sessions

```dataview
TABLE session_id AS "Session", date AS "Date", commits AS "Commits", tests_added AS "Tests Added"
FROM "06-Sessions"
SORT date DESC
LIMIT 10
```

### Capabilities Below Grade A

```dataview
TABLE grade AS "Grade", blocker AS "Blocker", remediation AS "Remediation"
FROM "07-Evidence/Capability Audits"
WHERE grade != "A"
SORT grade ASC
```

### Package Health Dashboard

```dataview
TABLE tests AS "Tests", coverage AS "Coverage", dependencies AS "Deps", exports AS "Exports"
FROM "04-Packages"
SORT tests DESC
```

---

## Templates

### Program Template

```markdown
---
name: "{{title}}"
tier: free | pro
generators: 0
grade: A | B | F
outputs: []
---

# {{title}}

## Purpose
What this program does and why it exists.

## Generators
| # | Generator | Output File | Format |
|---|-----------|-------------|--------|
| 1 | | | |

## Output Contract
Each generator produces:
- Deterministic output (same input → same bytes)
- Specific file at specific path
- Format defined in axis_all_tools.yaml

## Dependencies
- Requires: [[context-engine]] for context map data
- Feeds: (downstream consumers)

## Evidence
- Tests: (specific test file)
- Grade: (current grade with evidence)
```

### Session Log Template

```markdown
---
session_id: "session_NNN"
date: {{date}}
commits: []
tests_added: 0
capabilities_touched: []
---

# Session {{session_id}}

## Objectives
- [ ] Objective 1
- [ ] Objective 2

## Work Log
### Commit: (hash)
- Changed: (files)
- Added: (tests)
- Evidence: (commands run)

## State After Session
- Tests: N passing
- Coverage: N%
- Capabilities: N/82 Grade A
```

### Invariant Template

```markdown
---
name: "{{title}}"
status: enforced | aspirational | violated
enforcement: code | test | governance | manual
evidence: ""
---

# {{title}}

## Statement
One-sentence description of the invariant.

## Enforcement Mechanism
How this invariant is enforced (test, YAML rule, code constraint, CI check).

## Evidence
Specific file, test, or command that proves compliance.

## Violation History
| Date | Description | Resolution |
|------|------------|------------|
```

---

## Graph Configuration

### Recommended Graph View Settings
```json
{
  "colorGroups": [
    { "query": "path:00-MOCs", "color": "#58a6ff" },
    { "query": "path:01-Architecture", "color": "#3fb950" },
    { "query": "path:02-Programs", "color": "#d2a8ff" },
    { "query": "path:03-Governance", "color": "#d29922" },
    { "query": "path:04-Packages", "color": "#ffa657" },
    { "query": "path:05-Invariants", "color": "#f85149" },
    { "query": "path:06-Sessions", "color": "#8b949e" }
  ],
  "nodeSize": 5,
  "linkDistance": 30,
  "centerForce": 0.5,
  "repelForce": 200
}
```

### Expected Cluster Pattern
The graph will naturally form clusters around:
1. **Architecture hub**: System Overview as central node linking to all packages and infrastructure
2. **Program constellation**: 17 program nodes radiating from Programs MOC and axis_all_tools.yaml
3. **Governance chain**: 12 YAML files with cross-links for enforcement relationships
4. **Invariant ring**: 10 invariants each linking to their enforcement mechanism in governance or code
