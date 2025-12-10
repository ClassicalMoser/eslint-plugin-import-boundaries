# Refactoring Opportunities: Large Files and Functions

## Summary

This document identifies large files and functions that could benefit from being split into smaller, more focused modules.

## Priority 1: High Impact Refactoring

### 1. `relationshipDetection.ts` (355 lines)

#### `resolveTargetPath` function (~162 lines, lines 48-210)
**Current Structure**: Single function with 4 major branches:
- Alias imports (`@boundary/...`)
- Relative imports (`./...`, `../...`)
- Absolute imports (`src/...`)
- Bare imports (`entities/...`)

**Recommendation**: Extract into separate functions:
- `resolveAliasImport()` - Handle `@boundary` imports
- `resolveRelativeImport()` - Handle `./` and `../` imports
- `resolveAbsoluteImport()` - Handle `src/...` imports
- `resolveBareImport()` - Handle bare imports matching boundaries

**Benefits**:
- Each function has a single responsibility
- Easier to test each import type independently
- Reduces cognitive load when reading/maintaining
- Makes the main function a simple dispatcher

#### `calculateCorrectImportPath` function (~140 lines, lines 215-355)
**Current Structure**: Handles 3 main scenarios:
- Cross-boundary imports
- Ancestor barrel detection
- Same-boundary path calculation (with multiple sub-cases)

**Recommendation**: Extract helper functions:
- `calculateCrossBoundaryPath()` - Handle cross-boundary imports
- `checkAncestorBarrel()` - Check if import is ancestor barrel
- `calculateSameBoundaryPath()` - Handle same-boundary path calculation
  - `calculateBoundaryRootPath()` - Handle boundary root files
  - `calculateSameDirectoryPath()` - Handle same directory files
  - `calculateDistantPath()` - Handle distant imports (cousin, top-level, etc.)

**Benefits**:
- Clearer separation of concerns
- Easier to understand the path calculation algorithm
- Better testability for each scenario

### 2. `importHandler.ts` (240 lines)

#### `handleImport` function (~196 lines, lines 44-240)
**Current Structure**: Orchestrates multiple checks:
1. External package detection
2. Alias subpath checking (cross-boundary)
3. Boundary rules checking
4. Path format enforcement
5. Violation reporting

**Recommendation**: Extract into focused functions:
- `checkExternalPackage()` - Early return for external packages
- `checkAliasSubpathViolation()` - Handle cross-boundary alias subpaths
- `checkBoundaryRulesViolation()` - Handle allow/deny rules
- `checkPathFormatViolation()` - Handle path format enforcement
- `reportViolation()` - Centralized violation reporting

**Benefits**:
- Each function has a clear, single responsibility
- Easier to test each check independently
- Main function becomes a clear orchestration flow
- Violation reporting logic can be reused

## Priority 2: Medium Impact Refactoring

### 3. `index.ts` (320 lines)

**Current Structure**: ESLint rule definition with:
- Schema definition (~100 lines)
- Rule creation function (~200 lines)
- Multiple visitor functions (ImportDeclaration, ImportExpression, etc.)

**Recommendation**: Consider extracting:
- `ruleSchema` - Move schema definition to separate constant/function
- `createRuleContext()` - Extract context setup and validation
- Visitor functions are already well-separated, but could be moved to a separate file if they grow

**Benefits**:
- Reduces file size
- Schema definition is easier to maintain separately
- Visitor functions could be tested independently if extracted

## Priority 3: Lower Priority (Test Files)

### 4. `relationshipDetection.test.ts` (600 lines)
- Large test file but acceptable for comprehensive coverage
- Consider splitting by function: `resolveTargetPath.test.ts` and `calculateCorrectImportPath.test.ts`

### 5. `importHandler.test.ts` (423 lines)
- Consider splitting by responsibility: boundary rules tests vs path format tests

## Implementation Strategy

1. **Start with `resolveTargetPath`**: Extract the 4 import type handlers
2. **Then `calculateCorrectImportPath`**: Extract cross-boundary, ancestor barrel, and same-boundary helpers
3. **Finally `handleImport`**: Extract the 5 check/report functions

## Notes

- All refactoring should maintain 100% test coverage
- Use TDD approach: extract function, write tests, verify behavior unchanged
- Keep functions pure where possible (no side effects)
- Maintain existing function signatures for public APIs

