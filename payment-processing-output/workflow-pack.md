# Workflow Pack — avery-pay-platform

Reusable AI-assisted workflows for common development tasks.

## Workflow: Feature Development

```yaml
name: feature-development
trigger: "New feature request"
steps:
  - name: analyze_scope
    action: Review architecture-summary.md for affected layers
  - name: plan_implementation
    action: Identify files to modify using dependency-hotspots.md
  - name: write_code
    action: Follow conventions from Svelte
  - name: write_tests
    action: Add tests using vitest
  - name: validate
    action: Run vite
  - name: review
    action: Check against component-guidelines.md and frontend-rules.md
```

## Workflow: Bug Fix

```yaml
name: bug-fix
trigger: "Bug report or failing test"
steps:
  - name: reproduce
    action: Follow root-cause-checklist.md Step 1
  - name: isolate
    action: Use debug-playbook.md triage section
  - name: trace
    action: Check tracing-rules.md for log points
  - name: fix
    action: Apply minimal change in isolated scope
  - name: regression_test
    action: Add test covering the exact failure case
  - name: verify
    action: Run full test suite
```

## Workflow: Code Review

```yaml
name: code-review
trigger: "Pull request opened"
steps:
  - name: architecture_check
    action: Verify changes respect layer boundaries from architecture-summary.md
  - name: convention_check
    action: Validate against Go conventions
  - name: test_coverage
    action: Ensure new code has tests
  - name: dependency_check
    action: Check dependency-hotspots.md for coupling increase
```

## Workflow: Refactor

```yaml
name: refactor
trigger: "Scheduled improvement or tech debt review"
steps:
  - name: identify_targets
    action: Use refactor-checklist.md and dependency-hotspots.md
  - name: plan_scope
    action: Define clear boundaries — one concern per refactor
  - name: baseline_tests
    action: Ensure existing tests pass before any changes
  - name: execute
    action: Apply changes incrementally with working tests at each step
  - name: validate
    action: Run full suite, check for regressions
```
