# Refactor Checklist — avery-pay-platform

> Systematic refactoring guide based on codebase analysis

## Risk Assessment

| Risk Level | Files | Action |
|-----------|-------|--------|
| High (>5.0) | 0 | Refactor with full test coverage first |
| Medium (2-5) | 0 | Refactor when touching for features |
| Low (<2) | 10 | Refactor opportunistically |

## Pre-Refactor Checklist

Before starting any refactor:

- [ ] Existing tests pass (run full suite)
- [ ] The refactor target has test coverage (add tests if not)
- [ ] The goal is clear: what improves and what stays the same
- [ ] A branch has been created for the refactor
- [ ] No other in-progress work touches the same files

## Refactoring Patterns

### Extract Function
- **When:** A block of code inside a function does one distinct thing
- **How:** Move the block to a named function, pass needed values as parameters
- **Test:** Existing tests still pass + new unit test for extracted function

### Extract Module
- **When:** A file has multiple unrelated responsibilities
- **How:** Move related functions/types to a new file, update imports
- **Test:** All existing imports resolve, no circular dependencies introduced

### Simplify Conditionals
- **When:** Nested if/else chains or complex boolean expressions
- **How:** Extract conditions to named booleans, use early returns, use lookup tables
- **Test:** Cover all branches before and after

### Replace Magic Values
- **When:** Hardcoded strings, numbers, or config values in business logic
- **How:** Extract to named constants or config
- **Test:** Behavior unchanged, constants are importable

## Architecture Alignment

Detected patterns to preserve during refactoring:

- containerized

## Post-Refactor Checklist

- [ ] All tests pass
- [ ] No new circular dependencies (check import graph)
- [ ] Build succeeds with no new warnings
- [ ] No dead code left behind (unused imports, unreachable branches)
- [ ] Type coverage maintained or improved
- [ ] Commit message describes what changed and why
