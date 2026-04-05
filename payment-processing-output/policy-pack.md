# Policy Pack — avery-pay-platform

AI governance policies for code generation, review, and compliance.

## Policy: Code Generation Rules

```yaml
id: code-generation
scope: all-ai-generated-code
rules:
  - language: Go
  - strict_types: true
  - no_any_types: true
  - no_stub_implementations: true
  - no_placeholder_data: true
  - convention: "TypeScript strict mode"
```

## Policy: Boundary Enforcement

```yaml
id: boundary-enforcement
scope: architecture-layers
rules:
  - no-layers-detected: true
  - fallback: enforce-module-boundaries-by-directory
```

## Policy: Security Baseline

```yaml
id: security-baseline
scope: all-code
rules:
  - no_hardcoded_secrets: true
  - no_eval: true
  - no_innerHTML: true
  - validate_all_inputs: true
  - parameterize_queries: true
  - use_env_vars_for_config: true
  - no_debug_logging_in_production: true
```

## Policy: Testing Requirements

```yaml
id: testing-requirements
scope: all-changes
rules:
  - new_code_requires_tests: true
  - bug_fixes_require_regression_tests: true
  - minimum_test_coverage: 80%
  - no_skipped_tests_in_ci: true
  - test_frameworks: [vitest]
```

## Policy: Known Warnings

These project-specific warnings must be addressed in all AI-generated code:

- ⚠️ No CI/CD pipeline detected
- ⚠️ No lockfile found — dependency versions may be inconsistent

## Policy: Framework-Specific Rules

### Svelte

- Follow Svelte community best practices
