# eslint-plugin-import-boundaries

> Automatically enforce architectural boundaries with deterministic import paths.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Note: This is an alpha release, originally developed for a personal project. It is not yet stable and may have breaking changes. Pin the version and watch updates carefully if you would like to try it!**

An opinionated, TypeScript-first ESLint rule that enforces architectural boundaries using deterministic import path expectations. It automatically selects the correct import path (boundary alias, absolute, or relative) based on file relationships and your architecture, auto-fixes path format issues, enforces boundary rules to prevent violations, distinguishes type-only from value imports, and blocks circular dependencies.

**Important:** This rule expects index files (default: `index.ts`) at every directory level. This requirement enables zero I/O path resolution and fast performance. See [Why Index Files?](#why-index-files) for details.

## What Problem Does This Solve?

Most projects struggle to maintain architectural boundaries as they grow:

**Architectural Violations:**

- Boundaries are violated without enforcement (e.g., `@application` importing from `@infrastructure`)
- Circular dependencies sneak in through imports from ancestor entry points
- No automated way to enforce clean architecture, hexagonal architecture, feature-sliced design, or other boundary patterns
- Code reviews can easily overlook bad dependency directions for smaller calls

**Import Path Chaos:**

- Inconsistent patterns: sometimes `@domain`, sometimes `../domain`, sometimes `../../src/domain`
- Unreadable paths: `../../../../../../utils` chains that obscure relationships
- Long absolute paths in directory entry points: `src/domain/entities/user/payment, src/domain/entities/user/meta`
- No single source of truth for "the correct way" to import

**Existing Solutions Don't Work:**

Existing tools solve parts of this problem, but each has significant shortcomings:

- **`no-restricted-imports`**: Requires manual path whitelists/blacklists, no auto-fix, hard to maintain as codebase grows
- **`eslint-plugin-boundaries`**: Uses file I/O (slower, not correct for a linter), requires complex element type definitions, hierarchical inheritance can be confusing, doesn't normalize import paths, doesn't recognize types.
- **`eslint-plugin-no-relative-import-paths`**: Forces absolute paths everywhere, ignores architectural relationships
- **Pattern-based rules**: Brittle, high-maintenance, don't understand file relationships, can't determine optimal paths

**The Core Issue:** Existing tools solve path format OR boundaries, but not both intelligently. They either require manual maintenance, use slow file I/O, or ignore architecture entirely.

This rule provides **automated architectural boundary enforcement with deterministic import paths** - preventing violations before they happen, eliminating import path debates, and auto-fixing most issues.

## Features

- **Deterministic**: One correct path for every import (auto-fixable!)
- **Readable Paths**: No `../../../../../../` chains - always the most readable path
- **Enforced Boundaries**: Architectural violations caught before they happen
- **Configurable**: Declare any architectural boundaries and enforce them automatically
- **Zero I/O**: Pure path math - fast even on very large codebases
- **Type-aware**: Different rules for type-only imports vs value imports
- **Test-ready**: Flexible configuration for test files
- **Circular Dependency Prevention**: Blocks imports from ancestor entry points
- **Explicit Exports**: Ensures every directory is explicit about what it exports (via index files that serve as entry points)

## Quick Start

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

### Minimal Example

Start with just 2-3 boundaries. Here's a complete setup using the recommended separate config file:

```javascript
// boundaries.config.js
export const boundaries = [
  {
    identifier: '@domain',
    dir: 'domain',
    alias: '@domain',
    // Domain is pure - no imports allowed by default
  },
  {
    identifier: '@application',
    dir: 'application',
    alias: '@application',
    allowImportsFrom: ['@domain'], // Application can use domain
  },
];
```

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';
import { boundaries } from './boundaries.config.js';

export default [
  // Source files - enforce boundary rules
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      '**/*.test.{ts,js}',
      '**/*.spec.{ts,js}',
      '**/__tests__/**/*.{ts,js}',
    ],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          enforceBoundaries: true, // Enforce boundary rules
          boundaries,
        },
      ],
    },
  },
  // Test files - skip boundary rules but keep path format enforcement
  {
    files: [
      '**/*.test.{ts,js}',
      '**/*.spec.{ts,js}',
      '**/__tests__/**/*.{ts,js}',
    ],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          enforceBoundaries: false, // Tests can import from any boundary
          boundaries,
        },
      ],
    },
  },
];
```

**What you get:**

```typescript
// ✅ Cross-boundary imports → use boundary root path
import { Entity } from '@domain';

// ✅ Same-boundary, close imports → use relative
import { helper } from './helper'; // Same directory
import { utils } from '../utils'; // Parent's sibling

// ✅ Same-boundary, distant imports → use boundary path
import { useCase } from '@application/use-cases'; // Distant in same boundary

// ❌ Boundary violations are caught automatically
import { Database } from '@infrastructure';
// Error: Cannot import from '@infrastructure' to '@application': ...
```

## Auto-Fix in Action

The rule automatically fixes most import path issues. Here's what you'll see:

### Before: Messy Import Paths

```typescript
// application/use-cases/user-use-cases/create-user.ts
import type { RepositoryPort } from 'src/application/ports'; // ❌ Wrong: absolute path when alias is default
import type { User } from '@domain/entities'; // ❌ Wrong: subpath not allowed for cross-boundary
import { getUserEmail } from '../../../../domain/functions/user'; // ❌ Wrong: long relative path for cross-boundary
import { validate } from '../utils/validation'; // ❌ Wrong: should use index file (entry point) (close same-boundary)
import { getPurchase } from '../../../../application/purchase-use-cases'; // ❌ Wrong: long relative chain (distant same-boundary)
import { Database } from '@infrastructure/database'; // ❌ Violation: not allowed
import { helper } from './helper'; // ✅ Already correct
```

### After: Clean, Correct, Readable Paths

```typescript
// application/use-cases/user-use-cases/create-user.ts
import type { RepositoryPort } from '@ports'; // ✅ Auto-fixed: cross-boundary type import uses alias root
import type { User } from '@domain'; // ✅ Auto-fixed: subpath removed for cross-boundary
import { getUserEmail } from '@domain'; // ✅ Auto-fixed: cross-boundary uses root
import { validate } from '../utils'; // ✅ Auto-fixed: close same-boundary uses relative index (entry point)
import { getPurchase } from '@application/purchase-use-cases'; // ✅ Auto-fixed: distant same-boundary uses boundary path
import { Database } from '@infrastructure'; // ❌ ERROR: boundary violation (not auto-fixed, requires config change)
import { helper } from './helper'; // ✅ Already correct
```

**Or if you prefer absolute paths:**

```typescript
// Before (absolute style)
import type { RepositoryPort } from '@ports'; // ❌ Wrong: alias when absolute is configured
import type { User } from 'src/domain/entities'; // ❌ Wrong: subpath not allowed for cross-boundary
import { getUserEmail } from '../../../domain/functions/user'; // ❌ Wrong: long relative path for cross-boundary
import { validate } from '../../utils/validation'; // ❌ Wrong: should use index file (entry point) (close same-boundary)
import { useCase } from '../../../../application/other-use-cases'; // ❌ Wrong: long relative chain (distant same-boundary)

// After (absolute style)
import type { RepositoryPort } from 'src/ports'; // ✅ Auto-fixed: cross-boundary type import uses absolute root
import type { User } from 'src/domain'; // ✅ Auto-fixed: subpath removed for cross-boundary
import { getUserEmail } from 'src/domain'; // ✅ Auto-fixed: cross-boundary uses absolute root
import { validate } from '../utils'; // ✅ Auto-fixed: close same-boundary uses relative to nearest index
import { useCase } from 'src/application/other-use-cases'; // ✅ Auto-fixed: distant same-boundary uses absolute path
```

### What Gets Fixed Automatically

✅ **Auto-fixable:**

- Wrong relative paths → correct boundary paths
- Boundary subpaths → boundary root paths (for cross-boundary)
- Long relative chains → boundary paths (for distant same-boundary)
- Path format inconsistencies

❌ **Requires Manual Fix:**

- Boundary violations (need config change)
- Missing index files (need to create)
- Circular dependencies (use more specific import)

### Try It

```bash
eslint --fix src/
```

Most import path issues will be fixed automatically. Boundary violations will show clear error messages explaining what needs to change.

## Why This Approach?

We made deliberate trade-offs to solve the problems with existing solutions:

### The Trade-offs We Chose

- **Index files required** → but enables zero I/O and explicit architecture
- **Opinionated path rules** → but deterministic and auto-fixable
- **No file I/O** → but requires index files everywhere

### What We Avoided

- **Complex element type systems** (like `eslint-plugin-boundaries`): We use simple directory paths instead
- **Manual path whitelists/blacklists** (like `no-restricted-imports`): We use boundary-based rules
- **"Always absolute" or "always relative"** (like path-only plugins): We choose based on relationships
- **File system access**: Slower, harder to reason about, breaks determinism

### When This Works Best

✅ You want explicit architecture (index files are a feature, not a bug)  
✅ You need fast linting (zero I/O means instant feedback)  
✅ You want auto-fixable paths (most issues fix themselves)  
✅ You're okay with the index file requirement

### When to Use Alternatives

- **Can't use index files** → Use `eslint-plugin-boundaries` (uses file I/O)
- **Only need path format** → Use simpler path-only plugins
- **Need custom element types** → Use `eslint-plugin-boundaries`

## Why Index Files?

This is the biggest requirement and the biggest objection. Here's why we require it:

### The Trade-off

**Con:** Every directory needs an index file (`index.ts` by default)  
**Pro:** Zero I/O, fast performance, deterministic paths, explicit exports

### What It Means

- `./dir` imports from `dir/index.ts` - you cannot bypass the index from outside the directory
- **The index file is an entry point and interface** - it defines the contract for what the directory exposes
- **No file can reach "past" the index** - imports must go through the index file, which serves as the boundary
- Every directory must explicitly declare what it exports through its index file
- Exports must be explicit (a future rule will enforce this by blocking `export *`)
- The rule enforces path patterns and boundary contracts, not index file contents - forcing clarity about what each directory exposes

### Why Not File I/O?

Existing solutions that use file I/O have significant downsides:

- **Slower**: Must check filesystem for every import
- **Harder to reason about**: What files exist? What if they're created/deleted?
- **Can't do pure path math**: Need to resolve actual file locations
- **Breaks determinism**: Same import might resolve differently based on filesystem state

**Our choice:** Require index files to enable zero I/O. This means:

- Fast linting even on huge codebases
- Deterministic path resolution (pure math)
- Explicit architecture (every directory declares its interface)
- Works at any scale (monorepos, large teams)

### Is It Worth It?

**Yes, if:**

- You want fast linting (zero I/O is a game-changer)
- You value explicit architecture (index files force clarity)
- You want auto-fixable paths (deterministic = fixable)
- You're building a large codebase (scales better)

**Maybe not, if:**

- You prefer implicit exports
- You don't want index files (entry points)
- Your codebase is very small (file I/O overhead is minimal)

**Note:** Many projects already use this pattern (entry point exports). If you're already using `index.ts` files, this requirement is natural.

## Configuration Made Simple

### Recommended: Separate Config File

Using a separate `boundaries.config.js` file provides:

- **Reusability**: Same boundaries for source files and test files
- **Cleaner eslint.config**: Configuration separated from ESLint setup
- **Easier maintenance**: All boundaries in one place

### Three Required Fields Per Boundary

Each boundary needs just three fields:

```javascript
{
  identifier: '@domain',  // Name used in allowImportsFrom rules
  dir: 'domain',          // Directory path relative to rootDir
  alias: '@domain',       // Import path (when using alias style)
  // No whitelist specified - all cross-boundary imports forbidden
}
```

### Optional Fields

Most boundaries need at least one optional field to define import rules:

```javascript
{
  identifier: '@application',
  dir: 'application',
  alias: '@application',
  allowImportsFrom: ['@domain'], // What this boundary can import (whitelist, most common)
}
```

Other optional fields:

- `allowTypeImportsFrom`: Type-only imports (whitelist, for dependency inversion)
- `denyImportsFrom`: Explicitly deny specific boundaries (deny takes precedence over allow)
- `severity`: Override default severity for this boundary

**That's it!** Most boundaries are 3-4 lines.

### Complete Configuration Example

Here's a complete setup with all common options:

```javascript
// boundaries.config.js
export const boundaries = [
  {
    identifier: '@domain',
    dir: 'domain',
    alias: '@domain',
    // Domain is pure - no imports allowed by default
  },
  {
    identifier: '@application',
    dir: 'application',
    alias: '@application',
    allowImportsFrom: ['@domain'],
  },
  {
    identifier: '@infrastructure',
    dir: 'infrastructure',
    alias: '@infrastructure',
    allowImportsFrom: ['@domain'],
    allowTypeImportsFrom: ['@application'], // Types only (for ports/interfaces)
  },
];
```

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';
import { boundaries } from './boundaries.config.js';

export default [
  // Test files - skip boundary rules but keep path format enforcement
  {
    files: [
      '**/*.test.{ts,js}',
      '**/*.spec.{ts,js}',
      '**/__tests__/**/*.{ts,js}',
    ],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          enforceBoundaries: false, // Tests can import from any boundary
          boundaries,
        },
      ],
    },
  },
  // Regular source files - enforce boundary rules
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      '**/*.test.{ts,js}',
      '**/*.spec.{ts,js}',
      '**/__tests__/**/*.{ts,js}',
    ],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          enforceBoundaries: true, // Enforce boundary rules
          boundaries,
          // Optional: customize defaults
          defaultSeverity: 'error',
          barrelFileName: 'index',
          fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
        },
      ],
    },
  },
];
```

### vs. Other Plugins

**`eslint-plugin-boundaries`:**

- Requires element types, patterns, file I/O
- Complex configuration with hierarchical inheritance

**`no-restricted-imports`:**

- Requires manual path lists
- No auto-fix, hard to maintain

**This plugin:**

- Just directory paths + allow/deny rules
- Simple, maintainable, auto-fixable

## Basic Usage Patterns

Once configured, the rule automatically enforces correct import paths:

### Cross-Boundary Imports

When importing from a different boundary, always use the boundary's root path:

```typescript
// ✅ CORRECT
import { Entity } from '@domain';
import { UseCase } from '@application';

// ❌ WRONG
import { Entity } from '@domain/entities'; // Subpath not allowed for cross-boundary
import { Entity } from '../domain'; // Relative not allowed for cross-boundary
```

### Same-Boundary Imports

When importing within the same boundary, use relative paths for close imports, boundary paths for distant imports:

```typescript
// Same directory (sibling)
import { helper } from './helper'; // ✅

// Parent's sibling subdirectory (cousin, max one ../)
import { utils } from '../utils'; // ✅ When both are in subdirectories sharing a parent

// Siblings at boundary root level → Use relative (prevents circular dependencies)
import { utils } from './utils'; // ✅ When both are at boundary root level

// Distant within same boundary → Use boundary path (with subpath allowed)
import { useCase } from '@application/use-cases'; // ✅ Same boundary, distant location
```

### Boundary Violations

The rule automatically catches architectural violations:

```typescript
// File in @application boundary
import { Database } from '@infrastructure'; // ❌ Violation
// Error: Cannot import from '@infrastructure' to '@application':
//        Cross-boundary import is not allowed.
//        Add '@infrastructure' to 'allowImportsFrom' if this import is intentional.
```

## Compatibility & Conflicts

### ✅ Works With

These rules complement `import-boundaries/enforce`:

- **`import/no-unresolved`**: Checks file existence (we don't verify files)
- **`import/no-extraneous-dependencies`**: Different concern (dev deps)
- **`import/no-duplicates`**: Different concern (duplicate imports)
- **`import/order`** / **`eslint-plugin-simple-import-sort`**: Different concern (import sorting)
- **`import/no-unused-modules`**: Different concern (unused exports)
- **`no-duplicate-imports`**: Different concern (duplicate imports, core ESLint rule)
- **`no-restricted-imports`**: Can be used for additional restrictions beyond boundaries

### ⚠️ Conflicts With

These rules have overlapping concerns:

**`eslint-plugin-boundaries`:**

- **Conflict**: Both enforce boundaries but with different approaches
- **Why**: We use path math + index files; they use file I/O + element types
- **Solution**: Use only one

**`eslint-plugin-no-relative-import-paths`:**

- **Conflict**: Forces absolute paths everywhere
- **Why**: We use relative paths for close same-boundary imports, and prefer alias paths for boundaries when configured
- **Solution**: Disable this plugin

**`eslint-plugin-absolute-imports`:**

- **Conflict**: Forces absolute paths everywhere
- **Why**: Same as above
- **Solution**: Disable this plugin

### Why These Conflicts?

We're solving the same problems differently:

- **Path format plugins**: "Always use X" vs. our "Use the right path for the relationship"
- **Boundary plugins**: File I/O + element types vs. our path math + directory paths
- **Relative import rules**: Don't understand boundaries vs. our boundary-aware rules

### Recommended Configuration Pattern

Here's a recommended setup that combines compatible rules:

```javascript
import importBoundaries from 'eslint-plugin-import-boundaries';
import importPlugin from 'eslint-plugin-import';
import { boundaries } from './boundaries.config.js';

export default {
  plugins: {
    'import-boundaries': importBoundaries,
    import: importPlugin,
  },
  rules: {
    // Your boundary enforcement
    'import-boundaries/enforce': [
      'error',
      {
        rootDir: 'src',
        boundaries,
      },
    ],

    // Compatible import rules
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-duplicates': 'error',
  },
  settings: {
    'import/resolver': {
      // Configure resolver for import/no-unresolved
      typescript: true, // or node, etc.
    },
  },
};
```

### Testing Compatibility

After configuring multiple import rules:

1. Run ESLint on your codebase: `eslint .`
2. Check for conflicting errors (same import flagged by multiple rules for different reasons)
3. Verify auto-fix doesn't create conflicts: `eslint --fix`
4. Correct unfixable errors (circular dependencies, boundary violations, missing index files)

### Migration Path

**From `eslint-plugin-no-relative-import-paths` or `eslint-plugin-absolute-imports`:**

1. Remove the old plugin
2. **Important:** Ensure every directory exports through its index file (`index.ts` by default). This is required for the rule to work—see [Why Index Files?](#why-index-files) for details.
3. Configure `import-boundaries/enforce` with your boundaries
4. Run `eslint --fix` to update import paths

**From `eslint-plugin-boundaries`:**

1. Map element patterns to boundary `dir` paths
2. Convert layer rules to `allowImportsFrom`/`denyImportsFrom`
3. Test thoroughly (different rule logic)

**From `import/no-restricted-paths`:**

1. Convert path restrictions to boundary `denyImportsFrom` rules
2. Consider if you need both (this plugin may be sufficient)

## Core Rules

The rule automatically enforces these patterns:

### 1. Cross-Boundary Imports → Boundary Root (No Subpath)

Always use the boundary's root path when importing from a different boundary:

```typescript
// ✅ CORRECT
import { Entity } from '@domain';
import { UseCase } from '@application';

// ❌ WRONG
import { Entity } from '@domain/entities'; // Subpath not allowed
import { Entity } from '../domain'; // Relative not allowed
```

### 2. Same-Boundary Imports → Relative (when close) or Boundary Path (when distant)

Choose based on file relationship:

```typescript
// Close: Same directory or parent's sibling
import { helper } from './helper'; // ✅ Same directory
import { utils } from '../utils'; // ✅ Parent's sibling

// Distant: More than one directory level away
import { useCase } from '@application/use-cases'; // ✅ Distant in same boundary
```

### 3. Architectural Boundary Enforcement

Boundaries can only import from allowed boundaries:

**Important distinction:** The boundary `identifier` is separate from import paths:

- **`identifier`**: Used for `allowImportsFrom`/`denyImportsFrom` rules and error messages. Can be arbitrary (e.g., `'core'`, `'domain'`, `'@domain'`) and is independent of import path style.
  - **Standard**: When using alias style, the identifier should match the alias (e.g., `identifier: '@domain'` when `alias: '@domain'`). This ensures consistency between rules and import paths. The identifier exists mainly to support absolute paths when alias isn't feasible (e.g., nested boundaries like `domain/entities/user` where you want a clean identifier like `'@user'`).
- **Import paths**: Use `alias` (alias style) or `dir` path (absolute style) - these are what you write in your import statements.

```typescript
// ✅ ALLOWED: @application can import from @domain
import { Entity } from '@domain';

// ❌ VIOLATION: @application cannot import from @infrastructure
import { Database } from '@infrastructure';
// Error: Cannot import from '@infrastructure' to '@application': ...
```

### 4. Type-Only Imports

Different rules for types vs values:

```typescript
// ✅ ALLOWED: Type import (for dependency inversion)
import type { RepositoryPort } from '@application';

// ❌ VIOLATION: Value import not allowed
import { UseCase } from '@application';
```

### 5. Preventing Imports from Ancestor Entry Points

Prevents circular dependencies:

```typescript
// When inside @application boundary
import { something } from '@application'; // ❌ FORBIDDEN: Would create circular dependency
// Error: Cannot import from ancestor entry point '@application'.
//        This would create a circular dependency.
```

## Using Absolute Paths

Alias paths (e.g., `@domain`) are the default and preferred for readability, but absolute paths are fully supported. Use `crossBoundaryStyle: 'absolute'` if your build configuration doesn't support path aliases:

```javascript
// boundaries.config.js
export const boundaries = [
  {
    identifier: 'domain',
    dir: 'domain',
    // No alias required when using absolute paths
  },
  {
    identifier: 'application',
    dir: 'application',
    allowImportsFrom: ['domain'],
  },
];
```

```javascript
// eslint.config.js
{
  rootDir: 'src',
  crossBoundaryStyle: 'absolute', // Use absolute paths instead of aliases
  boundaries,
}
```

**Import patterns with absolute paths:**

```typescript
// Cross-boundary imports → use absolute path
import { Entity } from 'src/domain'; // ✅
import { UseCase } from 'src/application'; // ✅

// Same-boundary, close imports → use relative (same as alias style)
import { helper } from './helper'; // ✅ Same directory
import { utils } from '../utils'; // ✅ Parent's sibling

// Same-boundary, distant imports → use absolute path
import { useCase } from 'src/application/use-cases'; // ✅ Distant in same boundary
```

**When to use absolute paths:**

- Your build configuration doesn't support path aliases
- You prefer explicit paths over aliases
- You're working in a codebase that already uses absolute paths

**Note:** Alias paths are recommended for readability, especially for boundaries at deeper directory levels (e.g., `@entities/user` vs `src/hexagonal/domain/entities/user`). They also make it easier to distinguish the identity of the boundary, especially when nested (e.g., `@application` and `@port` vs `src/application` and `src/application/port`). However, absolute paths are fully supported and work identically.

## Advanced Topics

### Nested Boundaries

Boundaries can be nested, and each boundary explicitly declares its import rules (no inheritance):

```javascript
{
  boundaries: [
    {
      identifier: '@interface',
      dir: 'interface',
      alias: '@interface',
      allowImportsFrom: ['@application', '@domain'],
    },
    {
      identifier: '@api',
      dir: 'interface/api',
      alias: '@api',
      allowImportsFrom: ['@domain', '@public-use-cases'],
      denyImportsFrom: ['@internal-use-cases'], // More restrictive than parent
    },
  ],
}
```

**Example behavior:**

```typescript
// File: interface/api/user-controller.ts
import { Entity } from '@domain'; // ✅ Allowed: @api can import from @domain
import { CreateUser } from '@public-use-cases'; // ✅ Allowed: @api can import from @public-use-cases
import { InternalAudit } from '@internal-use-cases'; // ❌ Violation: @api explicitly denies @internal-use-cases

// File: interface/graphql/user-resolver.ts
import { Entity } from '@domain'; // ✅ Allowed: @graphql can import from @domain
import { CreateUser } from '@public-use-cases'; // ✅ Allowed: @graphql can import from any @application code
import { InternalAudit } from '@internal-use-cases'; // ✅ Allowed: @graphql has different rules than @api sibling
```

**Key behaviors:**

- Each boundary has independent rules (no inheritance)
- Files use the most specific matching boundary's rules
- Nested boundaries can be more restrictive OR more permissive than parents
- Sibling boundaries can have completely different rules
- **Import permissions**: If a boundary allows imports from a parent boundary, it can also import from that parent's child boundaries by default (e.g., if `interface` can import from `application`, it can also import from `application/ports` unless explicitly denied)

**Identifier vs import path example:**

The `identifier` (used in rules) can differ from the import path. The main use case is nested absolute paths where you want a clean identifier name:

```javascript
{
  identifier: '@user',              // Clean name for rules and error messages
                                    // As a standard, it ought to match alias if configured
                                    // It exists mainly to support absolute paths when alias isn't feasible
  dir: 'domain/entities/user',       // Nested directory path (used for import paths in absolute style)
  alias: '@user',                   // Clean alias (used for import paths in alias style)
  // Import: import type { UserData } from '@user';  // or 'src/domain/entities/user' (absolute style)
  // Rule: allowImportsFrom: ['@user']  // Uses identifier, not the full dir path
}
```

### Type-Only Imports

Different rules for types vs values (types don't create runtime dependencies):

```javascript
{
  identifier: '@infrastructure',
  dir: 'infrastructure',
  alias: '@infrastructure',
  allowImportsFrom: ['@domain'],           // Value imports from domain
  allowTypeImportsFrom: ['@application'], // Type imports from application (ports)
}
```

```typescript
// ✅ ALLOWED: Type import
import type { RepositoryPort } from '@application';

// ❌ VIOLATION: Value import
import { UseCase } from '@application';
```

### Rule Semantics

- **Only `allowImportsFrom`**: Deny-all by default (whitelist)
- **Only `denyImportsFrom`**: Allow-all by default (blacklist)
- **Neither**: Deny-all by default (strictest)
- **Both**: Allow list applies, deny list overrides (explicit denials win)

## How It Works

The rule uses pure path math - no file I/O, just deterministic algorithms:

1. **Boundary Detection**: Determines which boundary a file belongs to
2. **Path Calculation**: Calculates the correct import path based on file relationships
3. **Boundary Rules**: Checks allow/deny rules for cross-boundary imports
4. **Type Detection**: Distinguishes type-only imports from value imports

### Path Selection Rules for Same-Boundary Imports

When importing within the same boundary, the rule selects paths based on the relationship:

1. **Same directory** → `./sibling` (relative)
   - File and target are in the same directory
   - Example: `application/use-cases/file.ts` importing `application/use-cases/helper.ts`
   - Uses: `./helper`

2. **Parent's sibling subdirectory (cousin)** → `../cousin` (relative, max one `../`)
   - When both file and target are in subdirectories sharing a parent
   - Example: File `application/use-cases/subdir/file.ts` importing `application/use-cases/utils/index.ts`
   - Uses: `../utils` (one `../` from shared parent)

3. **Siblings at boundary root level** → `./sibling` (relative)
   - When both file and target are at boundary root level (different root-level directories)
   - Example: File `application/use-cases/file.ts` importing `application/utils/index.ts`
   - Uses: `./utils` (not `@application/utils`) - relative prevents circular dependencies through boundary entry points

4. **Top-level at boundary root** → `@boundary/topLevel` (boundary path, even if `../topLevel` would work)
   - When target is at boundary root level AND file is in a subdirectory
   - Example: File `src/domain/entities/subdir/file.ts` importing `src/domain/entities/topLevel/index.ts`
   - Uses: `@entities/topLevel` (not `../topLevel`) - alias style shown, absolute style would use `src/domain/entities/topLevel`

5. **Distant imports (requires more than one `../`)** → `@boundary/segment` (boundary path)
   - When target requires more than one `../` to reach (more than one directory level up)
   - Boundary path (alias or absolute) is preferred for readability - avoids long `../../../../` chains that obscure relationships
   - Example: File `src/domain/entities/level1/level2/file.ts` importing `src/domain/entities/target/index.ts`
   - Uses: `@entities/target` (alias style) or `src/domain/entities/target` (absolute style) - clearer and more maintainable than relative path chains

### Index Files as Module Interface

The rule requires index files (default: `index.ts`, configurable) at every directory level. These files serve as **entry points** and **interfaces** that define the contract for each directory. This enables zero I/O path resolution:

- `./dir` imports from `dir/index.ts` - you cannot bypass the index from outside the directory
- **No file can reach "past" the index** - the index file is the boundary that defines what the directory exposes
- Every directory must explicitly declare what it exports through its index file
- Exports must be explicit (a future rule will enforce this by blocking `export *`)
- The rule enforces path patterns and boundary contracts, not index file contents
- Supports multiple file extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` by default)
- Works at any scale - zero I/O means fast performance even on very large codebases and monorepos

### Why Zero I/O Matters

- **Correctness**: Linters should analyze code structure, not parse files or introspect the filesystem—that's the compiler's job
- **Performance**: No filesystem access = instant linting
- **Scalability**: Works on huge codebases and monorepos
- **Determinism**: Same import always resolves the same way
- **Reliability**: No race conditions or filesystem state issues

## What Gets Skipped vs Checked

**Skipped (External Packages):**

- npm packages like `vitest`, `react`, `@types/node`
- If the import string doesn't match any configured boundary and isn't a relative/absolute path, it's treated as an external package

**Checked (Files Outside Boundaries):**

- Files in your project that exist but are outside all configured boundaries
- These trigger an "unknown boundary" error unless `allowUnknownBoundaries: true` is set

## Error Messages

Clear, actionable error messages with full context:

### Incorrect Import Path

When the import path format is wrong (e.g., using boundary subpath for cross-boundary, or wrong relative/boundary path choice):

```
Expected '@domain' but got '@domain/entities'
```

**Full ESLint message format**: `"Expected '{{expectedPath}}' but got '{{actualPath}}'."`

**Examples**:

- Cross-boundary with subpath: `Expected '@domain' but got '@domain/entities'`
- Wrong relative for cross-boundary: `Expected '@domain' but got '../domain'`
- Wrong boundary path for close same-boundary: `Expected './sibling' but got '@application/sibling'`
- Wrong relative for distant same-boundary: `Expected '@application/use-cases' but got '../../use-cases'`

**Auto-fixable**: ✅ Yes - ESLint can automatically fix these.

### Boundary Violation

When importing violates architectural boundary rules:

```
Cannot import from '@infrastructure' to '@application': Cross-boundary import from '@infrastructure' to '@application' is not allowed. Add '@infrastructure' to 'allowImportsFrom' if this import is intentional.
```

**Full ESLint message format**: `"Cannot import from '{{to}}' to '{{from}}': {{reason}}"`

**Note**: The message format is `from '{{to}}' to '{{from}}'` - this means "importing FROM the target boundary TO the file boundary". For example, if a file in `@application` tries to import from `@infrastructure`, the message shows `from '@infrastructure' to '@application'`.

**Examples**:

- Deny-all default: `Cannot import from '@infrastructure' to '@application': Cross-boundary import from '@infrastructure' to '@application' is not allowed. Add '@infrastructure' to 'allowImportsFrom' if this import is intentional.`
- Explicit deny: `Cannot import from '@internal-use-cases' to '@api': Boundary '@api' explicitly denies imports from '@internal-use-cases'`
- Deny overrides allow: `Cannot import from '@units' to '@interface': Boundary '@interface' explicitly denies imports from '@units' (deny takes precedence over allow)`

**Auto-fixable**: ❌ No - These require configuration changes or architectural decisions.

### Import from Ancestor Entry Point

When importing from an ancestor entry point (would create circular dependency):

```
Cannot import from ancestor entry point '@application'. This would create a circular dependency. Import from the specific file or directory instead.
```

**Full ESLint message format**: `"Cannot import from ancestor entry point '{{alias}}'. This would create a circular dependency. Import from the specific file or directory instead."`

**Examples**:

- Alias style: `Cannot import from ancestor entry point '@application'. This would create a circular dependency. Import from the specific file or directory instead.`
- Absolute style: `Cannot import from ancestor entry point 'src/domain/entities'. This would create a circular dependency. Import from the specific file or directory instead.`

**Auto-fixable**: ❌ No - Requires manual fix to import from specific file/directory.

### Unknown Boundary

When importing from a path outside all configured boundaries:

```
Cannot import from 'src/shared/utils' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.
```

**Auto-fixable**: ❌ No - Requires configuration change.

## Comparison with Other Plugins

### Simple Path Enforcers

Plugins like `eslint-plugin-no-relative-import-paths` and `eslint-plugin-absolute-imports` only enforce "use absolute paths everywhere" or "use relative paths everywhere." They don't handle:

- Deterministic path selection (when to use boundary path vs relative)
- Architectural boundary enforcement
- Boundary allow/deny rules
- Type-only import handling
- Circular dependency prevention
- Index file enforcement

### Architectural Boundary Plugins

`eslint-plugin-boundaries` enforces architectural boundaries using a different approach:

- Pattern-based element matching (requires element type definitions)
- File I/O for resolution
- Hierarchical inheritance for nested boundaries

By enforcing stronger, opinionated constraints (index files), this plugin enables a simpler, faster, path-based approach:

- Directory paths instead of element types
- Zero I/O (pure path math)
- Independent rules per boundary (no inheritance)
- Deterministic paths and type-aware rules

**Configuration comparison:**

```javascript
// eslint-plugin-boundaries
{
  settings: {
    'boundaries/elements': [
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'application', pattern: 'src/application/**' },
    ],
  },
  rules: { 'boundaries/element-types': ['error', { /* rules */ }] },
}

// import-boundaries/enforce
{
  boundaries: [
    { dir: 'domain', alias: '@domain', identifier: '@domain' },
    { dir: 'application', alias: '@application', identifier: '@application' },
  ],
}
```

## Examples

See [Hexagonal Architecture Defaults](./HEXAGONAL_DEFAULTS.md) for a complete example configuration for hexagonal architecture (ports and adapters) projects.

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.
