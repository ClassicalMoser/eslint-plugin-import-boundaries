# eslint-plugin-import-boundaries

> Enforce architectural boundaries with **deterministic import paths**. The missing ESLint rule for clean architecture.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A powerful ESLint rule that enforces architectural boundaries using **deterministic import path rules**. Unlike other plugins that just enforce "use absolute paths everywhere," this rule intelligently determines when to use alias vs relative imports based on your architecture.

## ✨ Features

- 🎯 **Deterministic**: One correct path for every import (eliminates import formatting discussions)
- 📦 **Explicit Exports**: Ensures every directory is explicit about what it exports (via barrel files)
- 📍 **Readable Paths**: Resolves to sane, logical, easily-readable filepaths (no `../../../../../../` chains)
- 🏗️ **Architectural Fit**: Avoids incredibly long absolute paths that might not suit your architecture
- 🏛️ **Architectural Boundaries**: Enforce clean architecture, hexagonal architecture, or any boundary pattern
- 🔄 **Auto-fixable**: 95% of violations are automatically fixable
- ⚡ **Zero I/O**: Pure path math and AST analysis - fast even on large codebases
- 🎨 **Type-aware**: Different rules for type-only imports vs value imports
- 🚫 **Circular Dependency Prevention**: Blocks ancestor barrel imports
- 🔧 **Highly Configurable**: Works with any architectural pattern

## 🚀 Quick Start

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';

export default {
  plugins: {
    'import-boundaries': importBoundaries,
  },
  rules: {
    'import-boundaries/enforce': [
      'error',
      {
        rootDir: 'src',
        boundaries: [
          { dir: 'domain/entities', alias: '@entities' },
          { dir: 'domain/queries', alias: '@queries' },
          { dir: 'domain/events', alias: '@events' },
        ],
      },
    ],
  },
};
```

## 🎯 What Problem Does This Solve?

Most projects have inconsistent import patterns:

- Sometimes `@entities`, sometimes `../entities`, sometimes `../../domain/entities`
- No clear rules for when to use alias vs relative
- Import formatting discussions waste time in code reviews
- Long relative paths like `../../../../../../utils` are hard to read
- Absolute paths might not fit your architecture (`src/domain/entities/army/unit/weapon/sword`)
- Directories aren't explicit about their exports (no barrel files)
- Architectural boundaries are violated without enforcement
- Circular dependencies sneak in
- Refactoring is risky because import paths are ambiguous

**This rule provides deterministic import paths with architectural boundary enforcement** - one correct answer for every import, eliminating debates and making refactoring safe.

## 📖 Core Rules

### 1. Cross-Boundary Imports → Alias

When importing from a different boundary, **always use the boundary alias** (no subpaths):

```typescript
// ✅ CORRECT
import { Entity } from '@entities';
import { Query } from '@queries';

// ❌ WRONG
import { Entity } from '@entities/army'; // Subpath not allowed
import { Entity } from '../entities'; // Relative not allowed
```

### 2. Same-Boundary Imports → Relative (when close)

When importing within the same boundary, use relative paths for close imports:

```typescript
// Same directory (sibling)
import { helper } from './helper'; // ✅

// Parent's sibling (cousin, max one ../)
import { utils } from '../utils'; // ✅

// Top-level or distant → Use alias
import { something } from '@queries/topLevel'; // ✅
```

### 3. Architectural Boundary Enforcement

Prevent violations of your architecture:

```javascript
{
  dir: 'domain/entities',
  alias: '@entities',
  allowImportsFrom: ['@events'],  // Only allow imports from @events
  denyImportsFrom: ['@queries'],  // Deny imports from @queries
}
```

```typescript
// ✅ ALLOWED: @entities can import from @events
import { Event } from '@events';

// ❌ VIOLATION: @entities cannot import from @queries
import { Query } from '@queries';
// Error: Cannot import from '@queries' to '@entities': Import not allowed
```

### 4. Type-Only Imports

Different rules for types vs values (types don't create runtime dependencies):

```javascript
{
  dir: 'domain/entities',
  alias: '@entities',
  allowImportsFrom: ['@events'],           // Value imports
  allowTypeImportsFrom: ['@events', '@queries'], // Type imports (more permissive)
}
```

```typescript
// ✅ ALLOWED: Type import from @queries
import type { QueryResult } from '@queries';

// ❌ VIOLATION: Value import from @queries
import { executeQuery } from '@queries';
```

### 5. Ancestor Barrel Prevention

Prevents circular dependencies by blocking ancestor barrel imports:

```typescript
// ❌ FORBIDDEN: Would create circular dependency
import { something } from '@queries'; // When inside @queries boundary
// Error: Cannot import from ancestor barrel '@queries'.
//        This would create a circular dependency.
```

## ⚙️ Configuration

### Basic Configuration

```javascript
{
  rootDir: 'src',                    // Root directory (default: 'src')
  crossBoundaryStyle: 'alias',      // 'alias' | 'absolute' (default: 'alias')
  defaultSeverity: 'error',         // 'error' | 'warn' (default: 'error')
  allowUnknownBoundaries: false,    // Allow imports outside boundaries (default: false)
  skipBoundaryRulesForTestFiles: true, // Skip boundary rules for tests (default: true)
  boundaries: [                    // Required: Array of boundary definitions
    {
      dir: 'domain/entities',       // Required: Relative directory path
      alias: '@entities',           // Required: Import alias
      severity: 'error',            // Optional: Override default severity
      allowImportsFrom: ['@events'], // Optional: Allowed boundaries (value imports)
      denyImportsFrom: ['@queries'], // Optional: Denied boundaries
      allowTypeImportsFrom: ['@events', '@queries'], // Optional: Allowed for types
    },
  ],
}
```

### Test Files Configuration

Use ESLint's file matching for test files:

```javascript
export default [
  {
    files: ['src/**/*.ts'],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          /* config */
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          skipBoundaryRulesForTestFiles: true, // Tests can import from any boundary
          // ... rest of config
        },
      ],
    },
  },
];
```

## 🔍 How It Works

The rule uses **pure path math** - no file I/O, just deterministic algorithms:

1. **Boundary Detection**: Determines which boundary a file belongs to
2. **Path Calculation**: Calculates the correct import path using the "first differing segment" algorithm
3. **Boundary Rules**: Checks allow/deny rules for cross-boundary imports
4. **Type Detection**: Distinguishes type-only imports from value imports

### Barrel Files as Module Interface

The rule assumes **barrel files** (`index.ts`) are the module interface for each directory. This means:

- `./dir` imports from `dir/index.ts` (the barrel)
- You cannot bypass the barrel: `./dir/file` is not allowed
- This enforces a clear public API for each module

**This barrel file assumption is what enables zero I/O**: Because we know every directory has a barrel file, we can determine correct paths using pure path math - no file system access needed. This makes the rule fast, reliable, and deterministic.

The rule is **barrel-agnostic** - it enforces the path pattern (must go through the barrel), not what the barrel exports. Whether you use selective exports (`export { A, B } from './module'`) or universal exports (`export * from './module'`) is your choice based on your codebase needs.

**Scale considerations**:

- **Small projects**: If you have boundaries worth enforcing, you have enough structure for barrel files. For truly tiny projects (single file), this rule may be overkill.
- **Large projects**: The pattern works at any scale. Performance depends on what you export (use selective exports in large apps), not the pattern itself. The rule's zero I/O approach means it stays fast even in massive codebases.
- **Monorepos**: Works across packages, but requires manual configuration. You'd configure boundaries that span packages (e.g., `{ dir: 'packages/pkg-a/src/domain', alias: '@pkg-a/domain' }`). Each package maintains its own barrel structure, and the rule enforces boundaries between them based on your configuration.

## 🚫 What Gets Skipped

The rule **automatically skips** checking for:

- External packages (`node_modules`, npm packages)
- Imports that don't match any boundary alias and aren't relative paths

Only internal imports (relative paths, boundary aliases, and absolute paths within `rootDir`) are checked.

## 🛠️ Error Messages

Clear, actionable error messages:

```
Expected '@entities' but got '@entities/army'
Expected './sibling' but got '@queries/sibling'
Expected '../cousin' but got '@queries/nested/cousin'
Cannot import from '@queries' to '@entities': Import not allowed
Cannot import from ancestor barrel '@queries'. This would create a circular dependency.
```

## 🤝 Comparison with Other Plugins

### Simple Path Enforcers

Plugins like `eslint-plugin-no-relative-import-paths` and `eslint-plugin-absolute-imports` only enforce "use absolute paths everywhere" or "use relative paths everywhere." They don't handle:

- ❌ Deterministic alias vs relative (when to use which)
- ❌ Architectural boundaries
- ❌ Allow/deny rules between boundaries
- ❌ Type-only import handling
- ❌ Circular dependency prevention
- ❌ Barrel file enforcement

### Architectural Boundary Plugins

`eslint-plugin-boundaries` does enforce architectural boundaries, but uses a different approach:

- Pattern-based element matching (more complex configuration)
- File I/O for resolution (slower, requires file system access)
- Different rule structure

**This plugin** combines the best of both:

- ✅ Simple, deterministic path rules (pure path math, **zero I/O**)
- ✅ Architectural boundary enforcement
- ✅ Zero-config defaults for hexagonal architecture
- ✅ Type-aware rules
- ✅ Fast and auto-fixable

**Why zero I/O matters**: By assuming barrel files at every directory, this plugin can determine correct paths using pure path math - no file system access needed. This makes it faster, more reliable, and works in any environment. The barrel file pattern also enforces clear module interfaces (you must go through the barrel), which is good architecture. Because paths are deterministic, there's no debugging overhead - you always know exactly where a module comes from.

## 🗺️ Roadmap

- **Nested Boundaries**: Support for nested boundaries where sub-boundaries can have broader allow patterns than their parents (e.g., `@ports` nested in `@application` can import from `@infrastructure` even though `@application` cannot). This is required for proper hexagonal architecture support. See [Nested Boundaries Design](./NESTED_BOUNDARIES_DESIGN.md) for the design document.

## 📝 License

ISC

## 🙏 Contributing

Contributions welcome! Please open an issue or PR.

---

**Made with ❤️ for clean architecture**
