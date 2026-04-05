# Test Generation Rules — avery-pay-platform

> Testing conventions and generation rules for a static site

## Test Framework

Detected: **vitest**

## File Naming Convention

- Test files: `<module>.test.ts` or `<module>.spec.ts`
- Co-locate with source: `src/store.ts` → `src/store.test.ts`
- Alternatively: `__tests__/<module>.test.ts`

## Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('<ModuleName>', () => {
  it('should <expected behavior> when <condition>', () => {
    // Arrange
    const input = makeTestInput();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

## Test Categories

### Unit Tests
- Test individual functions and methods in isolation
- Mock external dependencies (database, API, file system)
- Target: every exported function should have at least one unit test
- Speed: < 10ms per test

### Integration Tests
- Test module interactions with real dependencies where possible
- Use in-memory databases (SQLite :memory:) instead of mocks when available
- Test API endpoints with real HTTP requests
- Speed: < 500ms per test

## What to Test

### Always Test
- Public API surface (exported functions)
- Error handling paths
- Edge cases: empty input, null, boundary values
- Data transformations and calculations
- State transitions

### Skip Testing
- Private implementation details (test through public API)
- Third-party library behavior
- Simple type definitions
- Configuration files

## Assertion Patterns

| Pattern | When to Use | Example |
|---------|------------|---------|
| `toEqual` | Object/array equality | `expect(result).toEqual({ id: 1 })` |
| `toBe` | Primitive or reference equality | `expect(status).toBe('ready')` |
| `toContain` | Array/string inclusion | `expect(list).toContain('item')` |
| `toThrow` | Error handling | `expect(() => fn()).toThrow()` |
| `toBeGreaterThan` | Numeric bounds | `expect(count).toBeGreaterThan(0)` |
| `toBeTruthy` | Existence check | `expect(result).toBeTruthy()` |
