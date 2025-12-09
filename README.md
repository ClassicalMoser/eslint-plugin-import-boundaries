# eslint-plugin-import-boundaries

> Enforce architectural boundaries with deterministic import paths.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Note: This is an alpha release, originally developed for a personal project. It is not yet stable and may have breaking changes.**

An opinionated ESLint rule that enforces architectural boundaries using deterministic import path rules. This rule determines when to use alias vs relative imports based on your architecture, rather than enforcing a single pattern for all imports.

**Important:** This rule expects an index or barrel file at every directory level. This barrel file represents the external accessibility of the module as a boundary interface, enabling zero I/O path resolution.

## Features

- **Deterministic**: One correct path for every import
- **Explicit Exports**: Ensures every directory is explicit about what it exports (via barrel files)
- **Readable Paths**: Always resolves to the most readable filepath (no `../../../../../../` chains)
- **Architectural Boundaries**: Enforce clean architecture, hexagonal architecture, feature-sliced design, or any other boundary pattern (including nested boundaries)
- **Auto-fixable**: Legal import paths are auto-fixable and will always converge to the correct import string.
- **Zero I/O**: Pure path math and AST analysis - fast even on large codebases
- **Type-aware**: Different rules for type-only imports vs value imports
- **Test-ready**: Flexible configuration for test files (skip boundary rules while maintaining path format)
- **Circular Dependency Prevention**: Blocks ancestor barrel imports
- **Configurable**: Works with any architectural pattern

## Quick Start

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

### Using Alias Paths (Default)

```javascript
// eslint.config.js
import importBoundaries from "eslint-plugin-import-boundaries";

export default {
  plugins: {
    "import-boundaries": importBoundaries,
  },
  rules: {
    "import-boundaries/enforce": [
      "error",
      {
        rootDir: "src",
        crossBoundaryStyle: "alias", // Default: use alias paths
        boundaries: [
          { dir: "domain", alias: "@domain" },
          { dir: "application", alias: "@application" },
          { dir: "infrastructure", alias: "@infrastructure" },
        ],
      },
    ],
  },
};
```

**Import patterns with aliases:**

```typescript
// Cross-boundary imports → use alias
import { Entity } from "@domain"; // ✅
import { UseCase } from "@application"; // ✅

// Same-boundary, close imports → use relative
import { helper } from "./helper"; // ✅ Same directory
import { utils } from "../utils"; // ✅ Parent's sibling

// Same-boundary, distant imports → use alias
import { useCase } from "@application/use-cases"; // ✅ Distant in same boundary
```

## What Problem Does This Solve?

Most projects suffer from inconsistent import patterns that create ambiguity and technical debt:

**Path Inconsistency:**

- No clear rules: sometimes `@domain`, sometimes `../domain`, sometimes `../../src/domain`
- Unreadable paths: `../../../../../../utils` chains that obscure relationships
- Absolute paths that don't fit your architecture (too long, harder to evaluate barrel files)

**Architectural Issues:**

- Boundaries are violated without enforcement (e.g., `@application` importing from `@infrastructure`)
- Circular dependencies sneak in through ancestor barrel imports
- Directories bypass barrel files, breaking encapsulation

**Maintainability Problems:**

- Import formatting debates waste time in code reviews
- Refactoring is risky because import paths are ambiguous
- No single source of truth for "the correct way" to import

This rule provides **deterministic import paths with architectural boundary enforcement** - one correct answer for every import, eliminating debates and making refactoring safer.

## Core Rules

### 1. Cross-Boundary Imports → Alias

When importing from a different boundary, always use the boundary alias (no subpaths):

```typescript
// ✅ CORRECT
import { Entity } from "@domain";
import { UseCase } from "@application";

// ❌ WRONG
import { Entity } from "@domain/entities"; // Subpath not allowed
import { Entity } from "../domain"; // Relative not allowed
```

### 2. Same-Boundary Imports → Relative (when close)

When importing within the same boundary, use relative paths for close imports:

```typescript
// Same directory (sibling)
import { helper } from "./helper"; // ✅

// Parent's sibling (cousin, max one ../)
import { utils } from "../utils"; // ✅

// Distant within same boundary → Use alias (with subpath allowed for same-boundary imports)
import { useCase } from "@application/use-cases"; // ✅ Same boundary, distant location
```

### 3. Architectural Boundary Enforcement

Prevent violations of your architecture:

```javascript
{
  dir: 'application',
  alias: '@application',
  allowImportsFrom: ['@domain'],  // Only allow imports from @domain (deny-all by default)
  // Note: denyImportsFrom is redundant here - anything not in allowImportsFrom is already denied
}
```

```typescript
// ✅ ALLOWED: @application can import from @domain
import { Entity } from "@domain";

// ❌ VIOLATION: @application cannot import from @infrastructure
import { Database } from "@infrastructure";
// Error: Cannot import from '@infrastructure' to '@application': Import not allowed
```

#### Nested Boundaries

Boundaries can be nested, and each boundary must explicitly declare its import rules. Each nested boundary has its own independent rules (no inheritance from parent boundaries):

```javascript
{
  boundaries: [
    {
      dir: 'interface',
      alias: '@interface',
      allowImportsFrom: ['@application', '@domain'], // @interface can import from @application and @domain
      // Implicitly denies all other boundaries (including @infrastructure, @composition, etc.)
    },
    {
      dir: 'interface/api',
      alias: '@api',
      allowImportsFrom: ['@domain', '@public-use-cases'],
      // @api (public REST API) only allows public use cases, not all of @application
      // This demonstrates selective access within an allowed parent boundary
      // Note: @public-use-cases and @internal-use-cases would be separate boundaries
      // defined elsewhere in your boundaries array
      denyImportsFrom: ['@internal-use-cases'],
    },
    {
      dir: 'interface/graphql',
      alias: '@graphql',
      allowImportsFrom: ['@application', '@domain'],
      // @graphql can import from all of @application (different rules than @api sibling)
      // This shows how sibling boundaries can have different rules
    },
    {
      dir: 'composition',
      alias: '@composition',
      allowImportsFrom: ['@domain', '@application', '@infrastructure', '@interface'],
      // @composition can import from all boundaries (wiring layer)
    },
    {
      dir: 'composition/di',
      alias: '@di',
      allowImportsFrom: ['@domain', '@application', '@infrastructure'],
      // @di (dependency injection setup) doesn't need @interface
      // This shows how nested boundaries can be more restrictive than parent
    },
  ],
}
```

**Example behavior:**

```typescript
// File: interface/api/user-controller.ts
import { Entity } from "@domain"; // ✅ Allowed: @api can import from @domain
import { CreateUser } from "@public-use-cases"; // ✅ Allowed: @api can import from @public-use-cases
import { InternalAudit } from "@internal-use-cases"; // ❌ Violation: @api explicitly denies @internal-use-cases

// File: interface/graphql/user-resolver.ts
import { Entity } from "@domain"; // ✅ Allowed: @graphql can import from @domain
import { CreateUser } from "@public-use-cases"; // ✅ Allowed: @graphql can import from any @application code
import { InternalAudit } from "@internal-use-cases"; // ✅ Allowed: @graphql has different rules than @api sibling

// File: composition/di/container.ts
import { Repository } from "@infrastructure"; // ✅ Allowed: @di can import from @infrastructure for wiring
import { UseCase } from "@application"; // ✅ Allowed: @di can import from @application
import { Controller } from "@interface"; // ❌ Violation: @di cannot import from @interface (more restrictive than parent)
```

**Key behaviors:**

- Each boundary has rules: explicit (via `allowImportsFrom`/`denyImportsFrom`) or implicit "deny all" (if neither is specified)
- Each boundary uses its own rules directly (no inheritance from parent boundaries)
- Rules work the same regardless of nesting depth (flat rule checking)
- You can selectively allow/deny specific nested boundaries
- Files resolve to their most specific boundary (longest matching path), which determines the rules to apply

**Rule semantics:**

- If only `allowImportsFrom`: deny-all by default (only items in allow list are allowed)
- If only `denyImportsFrom`: allow-all by default (everything except deny list is allowed)
- If neither: deny-all by default (strictest)
- If both `allowImportsFrom` and `denyImportsFrom` exist: Both lists apply independently. Items in the allow list are allowed (unless also in deny list), items in the deny list are denied, and items in neither list are denied by default (whitelist behavior). This allows you to deny specific sub-boundaries within an allowed parent boundary. For example, you can allow `@application` but deny its sub-boundary `@units`:

  ```javascript
  {
    dir: 'interface',
    alias: '@interface',
    allowImportsFrom: ['@application'],      // Allow all of @application
    denyImportsFrom: ['@units'],  // Deny this specific sub-boundary
  }
  ```

  Note: This works recursively - you can allow a boundary within a denied boundary within an allowed boundary, and so on.

  **Conflict resolution:** If the same boundary identifier appears in both lists (which indicates a configuration error), `denyImportsFrom` takes precedence - the import will be denied. This ensures safety: explicit denials override allows.

### 4. Type-Only Imports

Different rules for types vs values (types don't create runtime dependencies):

```javascript
{
  dir: 'infrastructure',
  alias: '@infrastructure',
  allowImportsFrom: ['@domain'],           // Value imports from domain
  allowTypeImportsFrom: ['@ports'],       // Type imports from ports (interfaces for dependency inversion)
}
```

```typescript
// ✅ ALLOWED: Type import from @application (port interface)
import type { RepositoryPort } from "@application";

// ❌ VIOLATION: Value import from @application
import { UseCase } from "@application";
```

### 5. Ancestor Barrel Prevention

Prevents circular dependencies by blocking ancestor barrel imports:

```typescript
// ❌ FORBIDDEN: Would create circular dependency
import { something } from "@application"; // When inside @application boundary
// Error: Cannot import from ancestor barrel '@application'.
//        This would create a circular dependency.
```

## Configuration

### Basic Configuration

Here's a complete configuration example with all boundary rules:

```javascript
{
  rootDir: 'src',                    // Required: Root directory (default: 'src')
  boundaries: [                    // Required: Array of boundary definitions
    {
      dir: 'domain',                // Required: Relative directory path
      alias: '@domain',             // Required: Import alias (e.g., '@domain')
      denyImportsFrom: ['@application', '@infrastructure', '@interface', '@composition'], // Domain is pure - denies all other boundaries
      severity: 'error',             // Optional: 'error' | 'warn' (overrides defaultSeverity for this boundary)
    },
    {
      dir: 'application',
      alias: '@application',
      allowImportsFrom: ['@domain'], // Application uses domain (deny-all by default)
      // Note: denyImportsFrom is redundant here - anything not in allowImportsFrom is already denied
    },
    {
      dir: 'infrastructure',
      alias: '@infrastructure',
      allowImportsFrom: ['@domain'], // Infrastructure uses domain entities
      allowTypeImportsFrom: ['@application'], // Infrastructure implements application ports (types only)
    },
  ],
  // Optional configuration options (all have sensible defaults):
  defaultSeverity: 'error',         // 'error' | 'warn' (default: 'error')
  enforceBoundaries: true,          // Enforce boundary rules (default: true)
  allowUnknownBoundaries: false,    // Allow imports outside boundaries (default: false)
  barrelFileName: 'index',          // Barrel file name without extension (default: 'index')
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'], // Extensions to recognize (default: all common JS/TS extensions)
}
```

**Important:** The `enforceBoundaries` option applies globally to all files when set. To have different behavior for test files vs regular files, you must use ESLint's file matching (see Test Files Configuration below).

### Test Files Configuration

**How test exclusion works:** When `enforceBoundaries: false`, the rule skips boundary rule checking (allow/deny rules) but still enforces path format (alias vs relative). This allows test files to import from any boundary while maintaining consistent import path patterns. The default is `true` (boundary rules are enforced by default).

**Why skip boundary rules for tests?** Test files often need to:

- Import from multiple boundaries to set up test scenarios (e.g., mocking infrastructure while testing application logic)
- Use test helper libraries or mocks that don't fit clean architectural boundaries
- Access internal implementation details for thorough testing
- Create test fixtures that span multiple boundaries

By setting `enforceBoundaries: false` for test files, you maintain architectural boundaries in production code while giving tests the flexibility they need. Path format (alias vs relative) is still enforced, keeping import paths consistent and readable.

**Alternative approach:** You can also define separate boundaries for test directories (e.g., `test/domain`, `test/application`) with their own import rules, but this has two downsides: it discourages test collocation (tests must live in separate test directories rather than alongside source files), and it requires much more configuration overhead than most projects need. The `enforceBoundaries: false` approach is simpler and sufficient for most use cases.

**Configuration pattern:** Use ESLint's file matching to apply different configs to test files vs regular files. Define boundaries once and reuse them in both config blocks:

```javascript
import importBoundaries from "eslint-plugin-import-boundaries";

// Define boundaries once - shared between regular files and test files
const boundaries = [
  {
    dir: "domain",
    alias: "@domain",
    // No imports allowed by default
  },
  {
    dir: "application",
    alias: "@application",
    allowImportsFrom: ["@domain"],
  },
  {
    dir: "infrastructure",
    alias: "@infrastructure",
    allowImportsFrom: ["@domain"],
  },
];

export default [
  // Test files - skip boundary rules but keep path format enforcement
  // Put test files first so they take precedence over regular file patterns
  {
    files: [
      "**/*.test.{ts,js}",
      "**/*.spec.{ts,js}",
      "**/__tests__/**/*.{ts,js}",
    ],
    rules: {
      "import-boundaries/enforce": [
        "error",
        {
          rootDir: "src",
          enforceBoundaries: false, // Tests can import from any boundary
          boundaries, // Same boundaries - needed for path format calculation
        },
      ],
    },
  },
  // Regular source files - enforce boundary rules
  // Excludes test files via ignores to prevent overlap
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "**/*.test.{ts,js}",
      "**/*.spec.{ts,js}",
      "**/__tests__/**/*.{ts,js}",
    ],
    rules: {
      "import-boundaries/enforce": [
        "error",
        {
          rootDir: "src",
          enforceBoundaries: true, // Enforce boundary rules
          boundaries,
        },
      ],
    },
  },
];
```

**What gets checked in test files:**

- ✅ Path format (alias vs relative) - still enforced
- ✅ Barrel file imports - still enforced
- ✅ Ancestor barrel prevention - still enforced
- ❌ Boundary allow/deny rules - **skipped** (tests can import from any boundary)

**What gets checked in regular files:**

- ✅ Path format (alias vs relative)
- ✅ Barrel file imports
- ✅ Ancestor barrel prevention
- ✅ Boundary allow/deny rules - **enforced**

### Using Absolute Paths

By default, the rule uses alias paths (e.g., `@domain`). If your build configuration doesn't support path aliases, or you prefer absolute paths, you can use `crossBoundaryStyle: 'absolute'`:

```javascript
{
  rootDir: 'src',
  crossBoundaryStyle: 'absolute', // Use absolute paths instead of aliases
  boundaries: [
    { dir: 'domain' }, // No alias required when using absolute paths
    { dir: 'application' },
    { dir: 'infrastructure' },
  ],
}
```

**Import patterns with absolute paths:**

```typescript
// Cross-boundary imports → use absolute path
import { Entity } from "src/domain"; // ✅
import { UseCase } from "src/application"; // ✅

// Same-boundary, close imports → use relative (same as alias style)
import { helper } from "./helper"; // ✅ Same directory
import { utils } from "../utils"; // ✅ Parent's sibling

// Same-boundary, distant imports → use absolute path
import { useCase } from "src/application/use-cases"; // ✅ Distant in same boundary
```

**When to use absolute paths:**

- Your build configuration doesn't support path aliases (e.g., some bundlers or older tooling)
- You prefer explicit paths over aliases for clarity
- You're working in a codebase that already uses absolute paths

**Note:** Alias paths are recommended for readability, especially for boundaries defined at deeper directory levels (e.g., `@entities/user` vs `src/hexagonal/domain/entities/user`). However, this rule does not require them since not all build configurations support path aliases. When using `crossBoundaryStyle: 'absolute'`, the `alias` property in boundary definitions becomes optional, and the rule will use paths like `src/domain` instead of `@domain`.

## How It Works

The rule uses pure path math - no file I/O, just deterministic algorithms:

1. **Boundary Detection**: Determines which boundary a file belongs to
2. **Path Calculation**: Calculates the correct import path using the "first differing segment" algorithm
3. **Boundary Rules**: Checks allow/deny rules for cross-boundary imports
4. **Type Detection**: Distinguishes type-only imports from value imports

### Barrel Files as Module Interface

The rule assumes barrel files (default: `index.ts`, configurable) are the module interface for each directory. This means:

- `./dir` imports from `dir/index.ts` (the barrel)
- You cannot bypass the barrel: `./dir/file` is not allowed
- This enforces a clear public API for each module

This barrel file assumption enables zero I/O: because we know every directory has a barrel file, we can determine correct paths using pure path math - no file system access needed. This makes the rule fast, reliable, and deterministic.

**Extension Support**: The rule supports multiple file extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` by default). You can configure which extensions to recognize and the barrel file name via `fileExtensions` and `barrelFileName` options.

The rule is barrel-agnostic - it enforces the path pattern (must go through the barrel), not what the barrel exports. Whether you use selective exports (`export { A, B } from './module'`) or universal exports (`export * from './module'`) is your choice based on your codebase needs.

**Scale considerations**:

- **Small projects**: If you have boundaries worth enforcing, you have enough structure for barrel files. For truly tiny projects (single file), this rule may be overkill.
- **Large projects**: The pattern works at any scale. Performance depends on what you export (use selective exports in large apps), not the pattern itself. The rule's zero I/O approach means it stays fast even in massive codebases.
- **Monorepos**: Works across packages, but requires manual configuration. You'd configure boundaries that span packages (e.g., `{ dir: 'packages/pkg-a/src/domain', alias: '@pkg-a/domain' }`). Each package maintains its own barrel structure, and the rule enforces boundaries between them based on your configuration.

## What Gets Skipped vs Checked

The rule distinguishes between **external packages** (skipped) and **files outside boundaries** (checked):

**Skipped (External Packages):**

- npm packages like `lodash`, `react`, `@types/node` - imports that don't resolve to any file path (e.g., `import _ from 'lodash'`)
- These are detected because `resolveTargetPath` returns an empty `targetAbs` (the import doesn't match any boundary pattern and isn't a relative/absolute path)

**Checked (Files Outside Boundaries):**

- Files in your project that exist but are outside all configured boundaries (e.g., `../shared/utils.ts` when `shared` isn't a boundary)
- These trigger an "unknown boundary" error unless `allowUnknownBoundaries: true` is set
- The rule detects these because the import resolves to a file path, but that path isn't inside any boundary

**Detection method**: The rule tries to resolve every import. If it resolves to a file path but that file isn't in any boundary, it's an "unknown boundary" error. If it doesn't resolve to any file path at all, it's treated as an external package and skipped.

## Error Messages

Clear, actionable error messages:

```
Expected '@domain' but got '@domain/entities'
Expected './sibling' but got '@application/sibling'
Expected '../cousin' but got '@application/nested/cousin'
Cannot import from '@infrastructure' to '@application': Import not allowed
Cannot import from ancestor barrel '@application'. This would create a circular dependency.
Cannot import from 'src/shared/utils' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.
```

## Comparison with Other Plugins

### Simple Path Enforcers

Plugins like `eslint-plugin-no-relative-import-paths` and `eslint-plugin-absolute-imports` only enforce "use absolute paths everywhere" or "use relative paths everywhere." They don't handle:

- Deterministic alias vs relative (when to use which)
- Architectural boundaries
- Allow/deny rules between boundaries
- Type-only import handling
- Circular dependency prevention
- Barrel file enforcement

### Architectural Boundary Plugins

`eslint-plugin-boundaries` does enforce architectural boundaries, but uses a different approach:

- Pattern-based element matching (more complex configuration)
- File I/O for resolution (slower, requires file system access)
- Different rule structure

This plugin uses a different approach:

- Simple, deterministic path rules (pure path math, zero I/O)
- Architectural boundary enforcement
- Type-aware rules
- Fast and auto-fixable

By assuming barrel files at every directory, this plugin can determine correct paths using pure path math - no file system access needed. This makes it faster and more reliable. The barrel file pattern also enforces clear module interfaces (you must go through the barrel), which is good architecture. Because paths are deterministic, there's no debugging overhead - you always know exactly where a module comes from.

## Examples

See [Hexagonal Architecture Defaults](./HEXAGONAL_DEFAULTS.md) for a complete example configuration for hexagonal architecture (ports and adapters) projects.

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.
