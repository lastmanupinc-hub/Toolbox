# Token Budget Plan — axis-toolbox

Generated: 2026-04-15T20:25:20.095Z

## Project Token Profile

| Metric | Value |
|--------|-------|
| Total LOC | 114,692 |
| Total Files | 496 |
| Est. Total Tokens | 516,114 |
| Avg Tokens/File | 1,041 |

## Token Budget by Language

| Language | LOC | Tokens | % of Budget |
|----------|-----|--------|-------------|
| TypeScript | 81,263 | 365,684 | 70.9% |
| JSON | 12,048 | 54,216 | 10.5% |
| YAML | 10,492 | 47,214 | 9.1% |
| Markdown | 8,415 | 37,868 | 7.3% |
| JavaScript | 1,456 | 6,552 | 1.3% |
| CSS | 849 | 3,821 | 0.7% |
| HTML | 120 | 540 | 0.1% |
| Dockerfile | 49 | 221 | 0.0% |

## Context Window Allocation

| Model | Context Window | Repo Fits | Recommended Strategy |
|-------|---------------|-----------|----------------------|
| GPT-4o | 128K | ❌ No | Chunked / RAG approach |
| Claude 3.5 Sonnet | 200K | ❌ No | Selective file context |
| Claude Opus 4 | 200K | ❌ No | Selective file context |
| Gemini 1.5 Pro | 1000K | ✅ Yes | Full repo context |

## Budget Allocation Strategy

### Recommended Context Packing Order

1. **System prompt + instructions** (~500 tokens)
2. **Architecture summary** (~800 tokens)
3. **Relevant file contents** (variable)
4. **Type definitions** (~200 tokens per interface)
5. **Test context** (~300 tokens per test file)
6. **User query** (~100 tokens)

### Cost Optimization Rules

1. **Never send the entire repo** when a subset suffices
2. **Prioritize type definitions** over implementation details
3. **Include test files** only when debugging test failures
4. **Trim comments and blank lines** from context (saves ~15% tokens)
5. **Cache repeated context** across multi-turn conversations

## Daily Budget Estimates

| Operation | Input | Output | Daily | Monthly Cost (GPT-4o) |
|-----------|-------|--------|-------|----------------------|
| Code review (1 file) | 1,500 | 500 | 10 | $1.93 |
| API endpoint work (449 routes detected) | 8,000 | 2,000 | 5 | $4.40 |
| Hotspot refactor (7 hotspots, avg 968 tok each) | 12,000 | 1,500 | 3 | $2.97 |
| Domain model change (162 models) | 8,000 | 2,500 | 2 | $1.98 |
| Documentation | 25,806 | 1,500 | 2 | $3.50 |

> Token estimates derived from detected project signals: routes, hotspots, domain models, and average file size.

## Source-Verified Token Estimate

- Source files scanned: 500
- Total source lines: 137,673
- Estimated tokens: ~619,529
