# Test Utilities

## Port Mocks (`testUtils.ts`)

**Purpose**: Create mock implementations of port interfaces (`Reporter`, `Fixer`) for application layer tests.

**When to use**:

- ✅ Application layer tests (`src/application/**/*.test.ts`)
- ✅ Tests that need to verify reporting behavior
- ✅ Tests that need to verify fixer behavior

**When NOT to use**:

- ❌ Domain layer tests (`src/domain/**/*.test.ts`) - use pure value testing
- ❌ Tests that don't use ports/interfaces

## Domain Layer Testing

Domain layer functions are **pure** - they take inputs and return outputs with no side effects. Test them with plain values:

```typescript
// ✅ Domain test - pure value testing
import { checkBoundaryRules } from './boundaryRules';

const fileBoundary: Boundary = {
  dir: 'domain/entities',
  alias: '@entities',
  absDir: '/project/src/domain/entities',
  allowImportsFrom: ['@events'],
};

const result = checkBoundaryRules(fileBoundary, targetBoundary, boundaries);
expect(result).toBeNull(); // or expect(result?.reason).toContain('...')
```

## Application Layer Testing

Application layer functions use ports (interfaces). Use port mocks:

```typescript
// ✅ Application test - use port mocks
import { createMockPorts } from '../../__tests__/testUtils.js';
import { validatePathFormat } from './pathFormatValidation';

const { reporter, createFixer } = createMockPorts();
const result = validatePathFormat({
  rawSpec: '../entities',
  correctPath: '@entities',
  reporter,
  createFixer,
});

expect(reporter.report).toHaveBeenCalled();
expect(reporter.hasReported('incorrectImportPath')).toBe(true);
```

## Summary

| Layer              | Testing Approach      | Example                                         |
| ------------------ | --------------------- | ----------------------------------------------- |
| **Domain**         | Pure value testing    | `checkBoundaryRules(boundary1, boundary2, [])`  |
| **Application**    | Port mocks            | `createMockPorts()` → `reporter`, `createFixer` |
| **Infrastructure** | Don't test (adapters) | Excluded from coverage                          |
