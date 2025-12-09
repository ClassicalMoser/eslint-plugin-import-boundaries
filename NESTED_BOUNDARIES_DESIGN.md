# Nested Boundaries Design

## Overview

Extend the `boundary-alias-vs-relative` rule to support nested architectural boundaries with independent allow/deny rules. This enables patterns like:

- `@ports` (nested in `@application`) can import from `@infrastructure`
- `@application` (parent) cannot import from `@infrastructure`
- Sub-boundaries can have **broader** allow patterns than their parents

## Core Concepts

### Boundary Hierarchy

Boundaries are nested when one boundary's directory is contained within another:

```
@application (domain/application)
  └── @ports (domain/application/ports)  // nested
  └── @use-cases (domain/application/use-cases)  // nested
```

The current "most specific boundary" logic already handles this by selecting the longest matching path.

### Allow/Deny Rules

Each boundary can define:

- `allowImportsFrom`: Array of boundary aliases that **can** be imported from
- `denyImportsFrom`: Array of boundary aliases that **cannot** be imported from
- Default behavior: If neither is specified, use parent's rules (if nested) or deny all cross-boundary imports

**Key Insight**: Sub-boundaries can have **broader** allow patterns than parents. This is intentional for architectural patterns like ports/adapters.

## Configuration Schema

```typescript
interface Boundary {
  dir: string; // e.g., 'domain/application'
  alias: string; // e.g., '@application'
  absDir: string; // Computed absolute path

  // NEW: Import restrictions
  allowImportsFrom?: string[]; // e.g., ['@domain', '@shared']
  denyImportsFrom?: string[]; // e.g., ['@infrastructure']

  // NEW: Path format rules for nested boundaries
  nestedPathFormat?: 'alias' | 'relative' | 'inherit';
  // 'alias': Always use @parent/... for parent imports
  // 'relative': Use ../... for parent imports (treat as same logical boundary)
  // 'inherit': Use parent's nestedPathFormat (default)
}
```

## Detection Logic

### 1. Find Boundary Hierarchy

```typescript
function findBoundaryHierarchy(
  fileBoundary: Boundary | null,
  targetBoundary: Boundary | null,
  allBoundaries: Boundary[],
): {
  fileBoundary: Boundary | null;
  targetBoundary: Boundary | null;
  isNested: boolean;
  parentBoundary: Boundary | null;
  relationship: 'same' | 'parent' | 'child' | 'sibling' | 'unrelated';
} {
  if (!fileBoundary || !targetBoundary) {
    return {
      fileBoundary,
      targetBoundary,
      isNested: false,
      parentBoundary: null,
      relationship: 'unrelated',
    };
  }

  if (fileBoundary === targetBoundary) {
    return {
      fileBoundary,
      targetBoundary,
      isNested: false,
      parentBoundary: null,
      relationship: 'same',
    };
  }

  // Check if target is parent of file (file is nested in target)
  const fileIsNestedInTarget = isInsideDir(
    targetBoundary.absDir,
    fileBoundary.absDir,
  );

  // Check if file is parent of target (target is nested in file)
  const targetIsNestedInFile = isInsideDir(
    fileBoundary.absDir,
    targetBoundary.absDir,
  );

  if (fileIsNestedInTarget) {
    return {
      fileBoundary,
      targetBoundary,
      isNested: true,
      parentBoundary: targetBoundary,
      relationship: 'parent',
    };
  }

  if (targetIsNestedInFile) {
    return {
      fileBoundary,
      targetBoundary,
      isNested: true,
      parentBoundary: fileBoundary,
      relationship: 'child',
    };
  }

  // Check if they share a common parent
  const commonParent = findCommonParent(
    fileBoundary,
    targetBoundary,
    allBoundaries,
  );
  if (commonParent) {
    return {
      fileBoundary,
      targetBoundary,
      isNested: true,
      parentBoundary: commonParent,
      relationship: 'sibling',
    };
  }

  return {
    fileBoundary,
    targetBoundary,
    isNested: false,
    parentBoundary: null,
    relationship: 'unrelated',
  };
}

function findCommonParent(
  boundary1: Boundary,
  boundary2: Boundary,
  allBoundaries: Boundary[],
): Boundary | null {
  // Find boundaries that contain both
  const candidates = allBoundaries.filter(
    (b) =>
      isInsideDir(b.absDir, boundary1.absDir) &&
      isInsideDir(b.absDir, boundary2.absDir) &&
      b !== boundary1 &&
      b !== boundary2,
  );

  // Return the most specific (longest path)
  return candidates.length > 0
    ? candidates.sort((a, b) => b.absDir.length - a.absDir.length)[0]!
    : null;
}
```

### 2. Check Allow/Deny Rules

```typescript
function isImportAllowed(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  allBoundaries: Boundary[],
): { allowed: boolean; reason?: string } {
  // Same boundary - always allowed (path format is enforced separately)
  if (fileBoundary === targetBoundary) {
    return { allowed: true };
  }

  const hierarchy = findBoundaryHierarchy(
    fileBoundary,
    targetBoundary,
    allBoundaries,
  );

  // PRIORITY 1: Check explicit allow (highest priority - can override denies)
  // This handles cases where a parent is denied, but a specific child is allowed
  if (fileBoundary.allowImportsFrom?.includes(targetBoundary.alias)) {
    // But check: is target nested inside a denied boundary?
    const deniedAncestor = findDeniedAncestor(
      fileBoundary,
      targetBoundary,
      allBoundaries,
    );
    if (deniedAncestor) {
      // Explicit allow overrides denied ancestor
      return { allowed: true };
    }
    return { allowed: true };
  }

  // PRIORITY 2: Check explicit deny
  if (fileBoundary.denyImportsFrom?.includes(targetBoundary.alias)) {
    return {
      allowed: false,
      reason: `Boundary '${fileBoundary.alias}' explicitly denies imports from '${targetBoundary.alias}'`,
    };
  }

  // PRIORITY 3: Check if target is nested inside a denied boundary
  const deniedAncestor = findDeniedAncestor(
    fileBoundary,
    targetBoundary,
    allBoundaries,
  );
  if (deniedAncestor) {
    // Target is inside a denied boundary, but wasn't explicitly allowed above
    return {
      allowed: false,
      reason: `Cannot import from '${targetBoundary.alias}' because it is nested inside '${deniedAncestor.alias}', which is denied`,
    };
  }

  // PRIORITY 4: If file is nested, check parent's rules (inherit if not explicitly set)
  if (hierarchy.isNested && hierarchy.parentBoundary) {
    const parentRules = getEffectiveRules(fileBoundary, allBoundaries);

    // Check parent's deny (but allow can be overridden by explicit allow above)
    if (parentRules.denyImportsFrom?.includes(targetBoundary.alias)) {
      return {
        allowed: false,
        reason: `Parent boundary '${parentRules.alias}' denies imports from '${targetBoundary.alias}'`,
      };
    }

    // Check parent's allow
    if (parentRules.allowImportsFrom?.includes(targetBoundary.alias)) {
      return { allowed: true };
    }
  }

  // Default: deny cross-boundary imports unless explicitly allowed
  return {
    allowed: false,
    reason: `Cross-boundary import from '${targetBoundary.alias}' to '${fileBoundary.alias}' is not allowed`,
  };
}

/**
 * Find if target boundary is nested inside any boundary that fileBoundary denies.
 * Returns the denied ancestor, or null if none found.
 *
 * Example:
 * - fileBoundary: @application (denies @composition)
 * - targetBoundary: @context (nested in @composition)
 * - Returns: @composition (the denied ancestor)
 */
function findDeniedAncestor(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  allBoundaries: Boundary[],
): Boundary | null {
  // Get all boundaries that contain targetBoundary (its ancestors)
  const targetAncestors = allBoundaries.filter(
    (b) =>
      b !== targetBoundary &&
      isInsideDir(b.absDir, targetBoundary.absDir) &&
      b.absDir.length < targetBoundary.absDir.length,
  );

  // Check if any ancestor is in fileBoundary's deny list
  const deniedAncestors = targetAncestors.filter((ancestor) =>
    fileBoundary.denyImportsFrom?.includes(ancestor.alias),
  );

  if (deniedAncestors.length === 0) {
    return null;
  }

  // Return the most specific denied ancestor (closest to target)
  return deniedAncestors.sort((a, b) => b.absDir.length - a.absDir.length)[0]!;
}

/**
 * Get effective rules for a boundary, walking up the hierarchy.
 * Sub-boundaries can override parent rules, but we need to check the chain.
 */
function getEffectiveRules(
  boundary: Boundary,
  allBoundaries: Boundary[],
): { allowImportsFrom?: string[]; denyImportsFrom?: string[] } {
  const rules: { allowImportsFrom?: string[]; denyImportsFrom?: string[] } = {
    allowImportsFrom: boundary.allowImportsFrom,
    denyImportsFrom: boundary.denyImportsFrom,
  };

  // Find parent boundary
  const parent = allBoundaries.find(
    (b) =>
      b !== boundary &&
      isInsideDir(b.absDir, boundary.absDir) &&
      b.absDir.length < boundary.absDir.length,
  );

  if (!parent) {
    return rules;
  }

  // Merge with parent rules (child rules take precedence)
  const parentRules = getEffectiveRules(parent, allBoundaries);

  // Deny: child's deny list + parent's deny list (union)
  rules.denyImportsFrom = [
    ...(rules.denyImportsFrom || []),
    ...(parentRules.denyImportsFrom || []),
  ];

  // Allow: child's allow list OR parent's allow list (child can be broader)
  // If child has allowImportsFrom, use it (can be broader than parent)
  // Otherwise, inherit parent's allow list
  if (!rules.allowImportsFrom && parentRules.allowImportsFrom) {
    rules.allowImportsFrom = parentRules.allowImportsFrom;
  }
  // If both exist, child's list is used (it can be broader)

  return rules;
}
```

### 3. Path Format for Nested Boundaries

```typescript
function calculateNestedBoundaryPath(
  rawSpec: string,
  fileDir: string,
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  allBoundaries: Boundary[],
  rootDir: string,
  cwd: string,
): string | null {
  const hierarchy = findBoundaryHierarchy(
    fileBoundary,
    targetBoundary,
    allBoundaries,
  );

  if (hierarchy.relationship === 'parent') {
    // Importing from parent boundary
    // Check nestedPathFormat setting
    const format = fileBoundary.nestedPathFormat || 'inherit';

    if (format === 'relative') {
      // Use relative path (treat parent as same logical boundary)
      return calculateCorrectImportPath(
        rawSpec,
        fileDir,
        fileBoundary,
        allBoundaries,
        rootDir,
        cwd,
      );
    }

    if (format === 'alias') {
      // Always use alias for parent
      return targetBoundary.alias;
    }

    // 'inherit': check parent's setting or default to 'alias'
    const parentFormat = getParentNestedPathFormat(fileBoundary, allBoundaries);
    if (parentFormat === 'relative') {
      return calculateCorrectImportPath(
        rawSpec,
        fileDir,
        fileBoundary,
        allBoundaries,
        rootDir,
        cwd,
      );
    }
    return targetBoundary.alias;
  }

  if (hierarchy.relationship === 'child') {
    // Importing from child boundary
    // Use relative path (child is within our boundary)
    return calculateCorrectImportPath(
      rawSpec,
      fileDir,
      fileBoundary,
      allBoundaries,
      rootDir,
      cwd,
    );
  }

  if (hierarchy.relationship === 'sibling') {
    // Both are nested in same parent
    // Use relative path (they're siblings within parent)
    return calculateCorrectImportPath(
      rawSpec,
      fileDir,
      fileBoundary,
      allBoundaries,
      rootDir,
      cwd,
    );
  }

  // Unrelated or same - use existing logic
  return calculateCorrectImportPath(
    rawSpec,
    fileDir,
    fileBoundary,
    allBoundaries,
    rootDir,
    cwd,
  );
}

function getParentNestedPathFormat(
  boundary: Boundary,
  allBoundaries: Boundary[],
): 'alias' | 'relative' {
  const parent = allBoundaries.find(
    (b) =>
      b !== boundary &&
      isInsideDir(b.absDir, boundary.absDir) &&
      b.absDir.length < boundary.absDir.length,
  );

  if (!parent) {
    return 'alias'; // Default
  }

  if (parent.nestedPathFormat === 'inherit') {
    return getParentNestedPathFormat(parent, allBoundaries);
  }

  return parent.nestedPathFormat || 'alias';
}
```

## Integration Points

### 1. Update `heuristicHandler.ts`

```typescript
export function handleImportWithHeuristic(): boolean {
// ... existing params
  // ... existing alias subpath check

  // NEW: Check if import is allowed
  if (fileBoundary && targetBoundary && fileBoundary !== targetBoundary) {
    const allowCheck = isImportAllowed(
      fileBoundary,
      targetBoundary,
      boundaries,
    );
    if (!allowCheck.allowed) {
      context.report({
        node,
        messageId: 'boundaryViolation',
        data: {
          from: fileBoundary.alias,
          to: targetBoundary.alias,
          reason: allowCheck.reason || 'Import not allowed',
        },
        // Not auto-fixable - requires architectural decision
      });
      return true;
    }
  }

  // Calculate correct path (now handles nested boundaries)
  const correctPath = calculateCorrectImportPath(
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
  );

  // ... rest of existing logic
}
```

### 2. Update `calculateCorrectImportPath`

```typescript
export function calculateCorrectImportPath(
  rawSpec: string,
  fileDir: string,
  fileBoundary: Boundary | null,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
): string | null {
  // ... existing target resolution

  if (!fileBoundary || targetBoundary !== fileBoundary) {
    // Check if nested boundary relationship
    if (fileBoundary && targetBoundary) {
      const hierarchy = findBoundaryHierarchy(
        fileBoundary,
        targetBoundary,
        boundaries,
      );
      if (hierarchy.isNested) {
        return calculateNestedBoundaryPath(
          rawSpec,
          fileDir,
          fileBoundary,
          targetBoundary,
          boundaries,
          rootDir,
          cwd,
        );
      }
    }

    // Cross-boundary: use @boundary (no subpath)
    if (targetBoundary) {
      return targetBoundary.alias;
    }
    return null;
  }

  // ... rest of existing same-boundary logic
}
```

## Example Configuration

```javascript
{
  boundaries: [
    {
      dir: 'domain/application',
      alias: '@application',
      denyImportsFrom: ['@infrastructure', '@composition'],
      allowImportsFrom: ['@context'], // Can import @context even though it's nested in denied @composition
      nestedPathFormat: 'alias', // Use @application/... for parent imports
    },
    {
      dir: 'domain/application/ports',
      alias: '@ports',
      allowImportsFrom: ['@infrastructure', '@application'], // Broader than parent!
      nestedPathFormat: 'relative', // Use ../... for @application imports
    },
    {
      dir: 'domain/composition',
      alias: '@composition',
      // No restrictions - can be imported by anyone who allows it
    },
    {
      dir: 'domain/composition/context',
      alias: '@context',
      // Nested in @composition, but @application can import it explicitly
    },
    {
      dir: 'domain/infrastructure',
      alias: '@infrastructure',
      // No restrictions - can be imported by anyone who allows it
    },
  ],
}
```

### Example Scenarios

1. **Sub-boundary broader than parent**:
   - `@application` denies `@infrastructure`
   - `@ports` (nested in `@application`) allows `@infrastructure` ✅
   - Result: `@ports` can import from `@infrastructure` even though parent denies it

2. **Parent allows specific child of denied boundary**:
   - `@application` denies `@composition`
   - `@application` allows `@context` (nested in `@composition`) ✅
   - Result: `@application` can import from `@context` even though `@composition` is denied

3. **Denied ancestor blocks import**:
   - `@application` denies `@composition`
   - `@context` is nested in `@composition`
   - `@application` does NOT explicitly allow `@context` ❌
   - Result: `@application` cannot import from `@context` (blocked by denied ancestor)

## Key Design Decisions

1. **Sub-boundaries can be broader**: A child boundary's `allowImportsFrom` can include boundaries that the parent denies. This enables ports/adapters pattern.

2. **Deny takes precedence**: If any boundary in the hierarchy denies an import, it's blocked (even if a child allows it).

3. **Inheritance with override**: If a child doesn't specify `allowImportsFrom`, it inherits from parent. But if specified, it can be broader.

4. **Path format is configurable**: Nested boundaries can choose to use relative paths for parent imports (treating them as same logical boundary) or aliases (emphasizing the boundary).

5. **Backward compatible**: If no `allowImportsFrom`/`denyImportsFrom` are specified, behavior is unchanged (only path format is enforced).

## Error Messages

```typescript
messages: {
  // ... existing messages
  boundaryViolation: "Cannot import from '{{to}}' to '{{from}}': {{reason}}",
}
```

## Future Considerations

- **Wildcard patterns**: `allowImportsFrom: ['@domain/*']` to allow all domain boundaries
- **Layer ordering**: Enforce that boundaries can only import from lower layers
- **Circular dependency detection**: Warn about circular allow patterns
- **Visualization**: Generate a graph of boundary relationships and allowed imports
