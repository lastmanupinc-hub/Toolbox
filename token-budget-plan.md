# Token Budget Plan — axis-iliad

Generated: 2026-04-17T20:18:38.604Z

## Project Token Profile

| Metric | Value |
|--------|-------|
| Total LOC | 113,186 |
| Total Files | 488 |
| Est. Total Tokens | 509,337 |
| Avg Tokens/File | 1,044 |

## Token Budget by Language

| Language | LOC | Tokens | % of Budget |
|----------|-----|--------|-------------|
| TypeScript | 82,842 | 372,789 | 73.2% |
| JSON | 11,430 | 51,435 | 10.1% |
| YAML | 8,558 | 38,511 | 7.6% |
| Markdown | 8,021 | 36,095 | 7.1% |
| JavaScript | 1,313 | 5,909 | 1.2% |
| CSS | 849 | 3,821 | 0.8% |
| HTML | 120 | 540 | 0.1% |
| Dockerfile | 53 | 239 | 0.0% |

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
| API endpoint work (473 routes detected) | 8,000 | 2,000 | 5 | $4.40 |
| Hotspot refactor (7 hotspots, avg 1008 tok each) | 12,000 | 1,500 | 3 | $2.97 |
| Domain model change (163 models) | 8,000 | 2,500 | 2 | $1.98 |
| Documentation | 25,467 | 1,500 | 2 | $3.46 |

> Token estimates derived from detected project signals: routes, hotspots, domain models, and average file size.

## Source-Verified Token Estimate

- Source files scanned: 500
- Total source lines: 145,522
- Estimated tokens: ~654,849
