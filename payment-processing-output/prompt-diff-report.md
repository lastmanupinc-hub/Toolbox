# Prompt Diff Report — avery-pay-platform

> Before/after recommendations for prompt quality improvement

## Score Summary

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Context Precision | 30/100 | 60/100 | +30 |
| Convention Compliance | 40/100 | 90/100 | +50 |
| Dependency Awareness | 70/100 | 90/100 | +20 |
| Architecture Alignment | 40/100 | 85/100 | +45 |
| Route Awareness | 35/100 | 85/100 | +50 |
| **Overall** | **43/100** | **82/100** | **+39** |

## Recommendations

### Context Precision

Use dependency hotspot analysis to select the 10 highest-signal files instead of including entire directories.

### Convention Compliance

Embed 1 detected conventions as system-level constraints in every code generation prompt.

### Dependency Awareness

Include package.json to ensure generated code uses existing dependencies.

### Architecture Alignment

Reference 1 detected patterns (separation score: 0/100) in architectural prompts to maintain layer boundaries.

### Route Awareness

Include route map (15 routes) in prompts when working on API or page code to prevent duplicate endpoints.

## Token Budget Guidance

Estimated full-project tokens: ~1,877,247

**Selective context required.** Use this priority order:
1. Active file being modified
2. Direct imports / dependencies (1 hop)
3. Dependency hotspots from optimization-rules.md
4. Type definitions and interfaces
5. Test files (for TDD context)
