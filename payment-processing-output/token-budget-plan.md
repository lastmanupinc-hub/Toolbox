# Token Budget Plan — avery-pay-platform

Generated: 2026-04-05T07:37:21.803Z

## Project Token Profile

| Metric | Value |
|--------|-------|
| Total LOC | 413,885 |
| Total Files | 1800 |
| Est. Total Tokens | 1,862,483 |
| Avg Tokens/File | 1,035 |

## Token Budget by Language

| Language | LOC | Tokens | % of Budget |
|----------|-----|--------|-------------|
| Go | 303,678 | 1,366,551 | 73.4% |
| YAML | 39,835 | 179,258 | 9.6% |
| Svelte | 27,505 | 123,773 | 6.6% |
| TypeScript | 17,577 | 79,097 | 4.2% |
| Markdown | 14,091 | 63,410 | 3.4% |
| SQL | 4,824 | 21,708 | 1.2% |
| HTML | 3,038 | 13,671 | 0.7% |
| JSON | 997 | 4,487 | 0.2% |
| PowerShell | 987 | 4,442 | 0.2% |
| Shell | 663 | 2,984 | 0.2% |
| CSS | 479 | 2,156 | 0.1% |
| JavaScript | 164 | 738 | 0.0% |
| Dockerfile | 29 | 131 | 0.0% |
| XML | 15 | 68 | 0.0% |
| TOML | 3 | 14 | 0.0% |

## Context Window Allocation

| Model | Context Window | Repo Fits | Recommended Strategy |
|-------|---------------|-----------|----------------------|
| GPT-4o | 128K | ❌ No | Chunked / RAG approach |
| Claude 3.5 Sonnet | 200K | ❌ No | Chunked / RAG approach |
| Claude Opus 4 | 200K | ❌ No | Chunked / RAG approach |
| Gemini 1.5 Pro | 1000K | ❌ No | Selective file context |

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
| Code review (1 file) | 2,000 | 500 | 10 | $2.20 |
| Feature implementation | 5,000 | 2,000 | 5 | $3.58 |
| Bug investigation | 8,000 | 1,000 | 3 | $1.98 |
| Refactoring | 4,000 | 3,000 | 2 | $1.76 |
| Documentation | 3,000 | 1,500 | 2 | $0.99 |
