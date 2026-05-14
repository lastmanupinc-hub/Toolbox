# Token Budget Plan — axis-iliad

Generated: 2026-05-14T02:05:25.590Z

## Project Token Profile

| Metric | Value |
|--------|-------|
| Total LOC | 118,348 |
| Total Files | 486 |
| Est. Total Tokens | 532,566 |
| Avg Tokens/File | 1,096 |

## Token Budget by Language

| Language | LOC | Tokens | % of Budget |
|----------|-----|--------|-------------|
| TypeScript | 87,403 | 393,314 | 73.9% |
| JSON | 11,089 | 49,901 | 9.4% |
| YAML | 9,206 | 41,427 | 7.8% |
| Markdown | 7,742 | 34,839 | 6.5% |
| JavaScript | 2,093 | 9,419 | 1.8% |
| CSS | 675 | 3,038 | 0.6% |
| HTML | 120 | 540 | 0.1% |
| Dockerfile | 20 | 90 | 0.0% |

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
| API endpoint work (485 routes detected) | 8,000 | 2,000 | 5 | $4.40 |
| Hotspot refactor (7 hotspots, avg 1013 tok each) | 12,000 | 1,500 | 3 | $2.97 |
| Domain model change (215 models) | 8,000 | 2,500 | 2 | $1.98 |
| Documentation | 26,628 | 1,500 | 2 | $3.59 |

> Token estimates derived from detected project signals: routes, hotspots, domain models, and average file size.

## Source-Verified Token Estimate

- Source files scanned: 500
- Total source lines: 151,162
- Estimated tokens: ~680,229
