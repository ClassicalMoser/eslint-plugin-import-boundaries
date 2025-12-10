# eslint-plugin-import-boundaries

> Automatically enforce architectural boundaries with deterministic import paths.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Note: This is an alpha release, originally developed for a personal project. It is not yet stable and may have breaking changes.**

An opinionated, TypeScript-first ESLint rule that enforces architectural boundaries using deterministic import path expectations. This rule determines when to use alias (or absolute) vs relative imports based on your architecture, rather than enforcing a single pattern for all imports.

**Important:** This rule expects index files (default: `index.ts`) at every directory level. See [Index Files as Module Interface](#index-files-as-module-interface) for details.

## Features

- **Deterministic**: One correct path for every import
- **Explicit Exports**: Ensures every directory is explicit about what it exports (via barrel files)
- **Readable Paths**: Always resolves to the most readable filepath (no `../../../../../../` chains)
- **Architectural Boundaries**: Enforce clean architecture, hexagonal architecture, feature-sliced design, or any other boundary pattern (including nested boundaries)
- **Auto-fixable**: Legal import paths are auto-fixable and will always converge to the correct import string.
- **Zero I/O**: Pure path math and AST analysis - fast even on large codebases
- **Type-aware**: Allows different rules for type-only imports vs value imports
- **Test-ready**: Flexible configuration for test files (skip boundary rules while maintaining fixable and deterministic path format)
- **Circular Dependency Prevention**: Blocks ancestor barrel imports

## Quick Start

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

### Using Alias Paths (Default)

Aliases (e.g., `@domain`, `@application`) are the default and preferred for readability. Both alias and absolute paths are fully supported - see [Using Absolute Paths](#using-absolute-paths) if your build configuration doesn't support path aliases.

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
        crossBoundaryStyle: 'alias', // Default: alias paths (preferred for readability)
        boundaries: [
          { dir: 'domain', alias: '@domain'},
          { dir: 'application', alias: '@application' allowImportsFrom: ['domain']},
          { dir: 'infrastructure', alias: '@infrastructure' allowImportsFrom: ['domain'], allowTypeImportsFrom: ['application']},
          { dir: 'interface', alias: '@interface' allowImportsFrom: ['domain', 'application']},
          { dir: 'composition', alias: '@composition' allowImportsFrom: ['domain', 'application', 'interface', 'infrastructure']},
        ],
      },
    ],
  },
};
```

**Import patterns with aliases:**

```typescript
// Cross-boundary imports → use alias
import { Entity } from '@domain'; // ✅
import { UseCase } from '@application'; // ✅

// Same-boundary, close imports → use relative
import { helper } from './helper'; // ✅ Same directory
import { utils } from '../utils'; // ✅ Parent's sibling

// Same-boundary, distant imports → use alias
import { useCase } from '@application/use-cases'; // ✅ Distant in same boundary
```

## What Problem Does This Solve?

Most projects struggle to maintain architectural boundaries as they grow:

**Architectural Violations:**

- Boundaries are violated without enforcement (e.g., `@application` importing from `@infrastructure`)
- Circular dependencies sneak in through ancestor barrel imports
- No automated way to enforce clean architecture, hexagonal architecture, or other boundary patterns

**Import Path Chaos:**

- Inconsistent patterns: sometimes `@domain`, sometimes `../domain`, sometimes `../../src/domain`
- Unreadable paths: `../../../../../../utils` chains that obscure relationships
- No single source of truth for "the correct way" to import

This rule provides **automated architectural boundary enforcement with deterministic import paths** - preventing violations before they happen and eliminating import path debates.

## Core Rules

### 1. Cross-Boundary Imports → Boundary Identifier (No Subpath)

When importing from a different boundary, always use the boundary identifier (the configured alias, e.g., `@domain`) with no subpath. This imports from the boundary's root barrel file (`domain/index.ts`):

```typescript
// ✅ CORRECT
import { Entity } from '@domain';
import { UseCase } from '@application';

// ❌ WRONG
import { Entity } from '@domain/entities'; // Subpath not allowed for cross-boundary
import { Entity } from '../domain'; // Relative not allowed for cross-boundary
```

### 2. Same-Boundary Imports → Relative (when close)

When importing within the same boundary, use relative paths for close imports:

```typescript
// Same directory (sibling)
import { helper } from './helper'; // ✅

// Parent's sibling (cousin, max one ../)
import { utils } from '../utils'; // ✅

// Distant within same boundary → Use alias (with subpath allowed for same-boundary imports)
import { useCase } from '@application/use-cases'; // ✅ Same boundary, distant location
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
import { Entity } from '@domain';

// ❌ VIOLATION: @application cannot import from @infrastructure
import { Database } from '@infrastructure';
// Error: Cannot import from '@infrastructure' to '@application': Import not allowed
```

#### Nested Boundaries

Boundaries can be nested, and each boundary explicitly declares its import rules. Each nested boundary has independent rules (no inheritance from parent boundaries), which provides explicit control and prevents accidental rule inheritance:

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
import { Entity } from '@domain'; // ✅ Allowed: @api can import from @domain
import { CreateUser } from '@public-use-cases'; // ✅ Allowed: @api can import from @public-use-cases
import { InternalAudit } from '@internal-use-cases'; // ❌ Violation: @api explicitly denies @internal-use-cases

// File: interface/graphql/user-resolver.ts
import { Entity } from '@domain'; // ✅ Allowed: @graphql can import from @domain
import { CreateUser } from '@public-use-cases'; // ✅ Allowed: @graphql can import from any @application code
import { InternalAudit } from '@internal-use-cases'; // ✅ Allowed: @graphql has different rules than @api sibling

// File: composition/di/container.ts
import { Repository } from '@infrastructure'; // ✅ Allowed: @di can import from @infrastructure for wiring
import { UseCase } from '@application'; // ✅ Allowed: @di can import from @application
import { Controller } from '@interface'; // ❌ Violation: @di cannot import from @interface (more restrictive than parent)
```

**Key behaviors:**

- **Explicit rules**: Each boundary declares its own rules (via `allowImportsFrom`/`denyImportsFrom`) or defaults to "deny all" if neither is specified
- **No inheritance**: Each boundary uses its own rules directly - no automatic inheritance from parent boundaries. This ensures rules are explicit and prevents accidental rule propagation.
- **Parent and child boundaries**: You can define both parent and child boundaries (e.g., `dir: 'application'` and `dir: 'application/use-cases'`). Files use the most specific matching boundary's rules, while imports can reference any defined boundary identifier.
- **Flexible control**: You can make nested boundaries more restrictive OR more permissive than their parents, or give sibling boundaries completely different rules
- **Flat rule checking**: Rules work the same regardless of nesting depth - files resolve to their most specific boundary (longest matching path), which determines the rules to apply

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
import type { RepositoryPort } from '@application';

// ❌ VIOLATION: Value import from @application
import { UseCase } from '@application';
```

### 5. Ancestor Barrel Prevention

Prevents circular dependencies by blocking ancestor barrel imports:

```typescript
// ❌ FORBIDDEN: Would create circular dependency
import { something } from '@application'; // When inside @application boundary
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
      // Domain is pure - denies all other boundaries
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
import importBoundaries from 'eslint-plugin-import-boundaries';

// Define boundaries once - shared between regular files and test files
const boundaries = [
  {
    dir: 'domain',
    alias: '@domain',
    // No imports allowed by default
  },
  {
    dir: 'application',
    alias: '@application',
    allowImportsFrom: ['@domain'],
  },
  {
    dir: 'infrastructure',
    alias: '@infrastructure',
    allowImportsFrom: ['@domain'],
  },
];

export default [
  // Test files - skip boundary rules but keep path format enforcement
  // Put test files first so they take precedence over regular file patterns
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
          boundaries, // Same boundaries - needed for path format calculation
        },
      ],
    },
  },
  // Regular source files - enforce boundary rules
  // Excludes test files via ignores to prevent overlap
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
];
```

**What gets checked:**

- ✅ **Always enforced**: Path format (alias vs relative), barrel file imports, ancestor barrel prevention
- ⚠️ **Test files only**: Boundary allow/deny rules are skipped (tests can import from any boundary)
- ✅ **Regular files only**: Boundary allow/deny rules are enforced

### Using Absolute Paths

Alias paths are the default and preferred for readability, but absolute paths are fully supported. Use `crossBoundaryStyle: 'absolute'` if your build configuration doesn't support path aliases, or if you prefer explicit paths:

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
import { Entity } from 'src/domain'; // ✅
import { UseCase } from 'src/application'; // ✅

// Same-boundary, close imports → use relative (same as alias style)
import { helper } from './helper'; // ✅ Same directory
import { utils } from '../utils'; // ✅ Parent's sibling

// Same-boundary, distant imports → use absolute path
import { useCase } from 'src/application/use-cases'; // ✅ Distant in same boundary
```

**When to use absolute paths:**

- Your build configuration doesn't support path aliases (e.g., some bundlers or older tooling)
- You prefer explicit paths over aliases for clarity
- You're working in a codebase that already uses absolute paths

**Note:** Alias paths are recommended for readability, especially for boundaries defined at deeper directory levels (e.g., `@entities/user` vs `src/hexagonal/domain/entities/user`). However, this rule does not require them since not all build configurations support path aliases. When using `crossBoundaryStyle: 'absolute'`, the `alias` property in boundary definitions becomes optional, and the rule will use paths like `src/domain` instead of `@domain`.

## How It Works

The rule uses pure path math - no file I/O, just deterministic algorithms:

1. **Boundary Detection**: Determines which boundary a file belongs to
2. **Path Calculation**: Calculates the correct import path based on file relationships (sibling, cousin, cross-boundary, etc.)
3. **Boundary Rules**: Checks allow/deny rules for cross-boundary imports
4. **Type Detection**: Distinguishes type-only imports from value imports

### Index Files as Module Interface

The rule assumes index files (default: `index.ts`, configurable) are the module interface for each directory. This enables zero I/O path resolution: because we know every directory has an index file, we can determine correct paths using pure path math - no file system access needed.

- `./dir` imports from `dir/index.ts` - you cannot bypass the index from outside the directory
- The rule enforces path patterns and boundary contracts, not index file contents - forcing explicit clarity about what each directory exposes
- Supports multiple file extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` by default), configurable via `fileExtensions` and `barrelFileName` options
- Works at any scale - zero I/O means fast performance even on very large codebases and monorepos

## What Gets Skipped vs Checked

The rule distinguishes between **external packages** (skipped) and **files outside boundaries** (checked):

**Skipped (External Packages):**

- npm packages like `vitest`, `react`, `@types/node` - imports that don't resolve to any file path (e.g., `import { vi } from 'vitest'`)
- If the import string doesn't match any configured boundary and isn't a relative/absolute path, it's treated as an external package and skipped. The rule does not hit the filesystem to verify existence.

**Checked (Files Outside Boundaries):**

- Files in your project that exist but are outside all configured boundaries (e.g., `../shared/utils.ts` when `shared` isn't a boundary)
- These trigger an "unknown boundary" error unless `allowUnknownBoundaries: true` is set
- The rule detects these because the import resolves to a file path, but that path isn't inside any boundary

**Detection method**: The rule uses pattern matching to classify imports. If the import string doesn't match any configured boundary and isn't a relative/absolute path, it's treated as an external package and skipped. The rule does not hit the filesystem to verify existence - it's purely pattern-based. If an import matches a relative/absolute path pattern but that path isn't inside any configured boundary, it triggers an "unknown boundary" error.

## Error Messages

Clear, actionable error messages:

```
Expected '@domain' but got '@domain/entities'
Expected './sibling' but got '@application/sibling'
Expected '../cousin' but got 'src/hexagonal/application/nested/cousin'
Cannot import from '@infrastructure' to '@application': Import not allowed
Cannot import from ancestor barrel '@application'. This would create a circular dependency.
Cannot import from 'src/shared/utils' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.
```

## Comparison with Other Plugins

### Simple Path Enforcers

Plugins like `eslint-plugin-no-relative-import-paths` and `eslint-plugin-absolute-imports` only enforce "use absolute paths everywhere" or "use relative paths everywhere." Absolute paths are not always the correct answer, and they become particularly hard to read in index files or other closely-related modules. They also don't handle:

- Deterministic path selection (when to use alias vs relative)
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

By enforcing stronger, opinionated constraints, this plugin enables a simpler, faster, path-based approach:

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
    { dir: 'domain', alias: '@domain' },
    { dir: 'application', alias: '@application' },
  ],
}
```

**Nested boundaries:** This plugin uses explicit, independent rules per boundary (files resolve to the most specific boundary). This provides clear control - nested boundaries can be more restrictive or permissive than parents, and sibling boundaries can have different rules. `eslint-plugin-boundaries` uses hierarchical inheritance where rules automatically propagate. For file-specific rules, use ESLint's file matching (see [Test Files Configuration](#test-files-configuration)).

## Compatibility with Other Import Rules

The ESLint ecosystem has many import-related plugins and rules. This section explains which ones are compatible, which conflict, and how to configure them together.

### ✅ Compatible Rules (Use Together)

These rules complement `import-boundaries/enforce` and can be used simultaneously:

#### `eslint-plugin-import` Rules

Most rules from `eslint-plugin-import` are compatible because they check different aspects:

- **`import/no-unresolved`**: Checks that imports resolve to actual files (compatible - this plugin doesn't verify file existence)
- **`import/no-extraneous-dependencies`**: Prevents importing dev dependencies in production code (compatible - different concern)
- **`import/no-duplicates`**: Enforces combining multiple imports from the same module (compatible - different concern)
- **`import/order`** / **`eslint-plugin-simple-import-sort`**: Sorts import statements (compatible - different concern, handles formatting)
- **`import/no-unused-modules`**: Detects unused exports (compatible - different concern)

#### Core ESLint Rules

- **`no-duplicate-imports`**: Prevents duplicate imports (compatible - different from `import/no-duplicates`, but both are fine)
- **`no-restricted-imports`**: Restricts specific modules (compatible - can be used for additional restrictions beyond boundaries)

### ⚠️ Conflicting Rules (Disable or Configure Carefully)

These rules have overlapping or conflicting concerns with `import-boundaries/enforce`:

#### Path Format Enforcers (Conflicting)

These enforce a single import style, which conflicts with this plugin's deterministic approach:

- **`eslint-plugin-no-relative-import-paths`**: Forces absolute paths everywhere
  - **Conflict**: This plugin uses relative paths for close same-boundary imports
  - **Solution**: Disable this plugin when using `import-boundaries/enforce`

- **`eslint-plugin-absolute-imports`**: Forces absolute paths everywhere
  - **Conflict**: Same as above
  - **Solution**: Disable this plugin when using `import-boundaries/enforce`

- **`eslint-plugin-import` → `import/no-relative-packages`**: Prevents relative imports that might be confused with package imports
  - **Conflict**: This plugin intentionally uses relative paths for close same-boundary imports (e.g., `./helper`, `../utils`) as part of its deterministic path rules. `import/no-relative-packages` doesn't understand architectural boundaries and flags these as violations.
  - **Solution**: Disable `import/no-relative-packages` - this plugin already enforces correct relative import usage within boundaries

#### Architectural Boundary Plugins (Conflicting)

- **`eslint-plugin-boundaries`**: Enforces architectural boundaries
  - **Conflict**: Both plugins enforce boundaries but with different approaches (see [Architectural Boundary Plugins](#architectural-boundary-plugins) above)
  - **Solution**: Use only one

#### Path Restriction Rules (May Conflict)

- **`eslint-plugin-import` → `import/no-restricted-paths`**: Restricts imports from specific paths
  - **Potential Conflict**: If configured to restrict paths that this plugin allows
  - **Solution**: Configure `import/no-restricted-paths` to align with your boundary rules, or let `import-boundaries/enforce` handle path restrictions

### Recommended Configuration Pattern

Here's a recommended setup that combines compatible rules:

```javascript
import importBoundaries from 'eslint-plugin-import-boundaries';
import importPlugin from 'eslint-plugin-import';

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
        /* your config */
      },
    ],

    // Compatible import rules
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-duplicates': 'error',

    // Disable conflicting rules
    'import/no-relative-packages': 'off', // This plugin handles relative imports intelligently within boundaries
  },
  settings: {
    'import/resolver': {
      // Configure resolver for import/no-unresolved
      typescript: true, // or node, etc.
    },
  },
};
```

### Migration from Conflicting Plugins

If you're migrating from a conflicting plugin:

1. **From `eslint-plugin-no-relative-import-paths` or `eslint-plugin-absolute-imports`**:
   - Remove the old plugin
   - Configure `import-boundaries/enforce` with your boundaries
   - Run auto-fix to update import paths: `eslint --fix`

2. **From `eslint-plugin-boundaries`**:
   - Map your element patterns to boundary `dir` paths
   - Convert layer rules to `allowImportsFrom`/`denyImportsFrom`
   - Test thoroughly as the rule logic differs

3. **From `import/no-restricted-paths`**:
   - Convert path restrictions to boundary `denyImportsFrom` rules
   - Consider if you need both (this plugin may be sufficient)

### Testing Compatibility

After configuring multiple import rules:

1. Run ESLint on your codebase: `eslint .`
2. Check for conflicting errors (same import flagged by multiple rules for different reasons)
3. Verify auto-fix doesn't create conflicts: `eslint --fix`
4. Correct unfixable errors (circular dependencies, boundary violations, missing barrel files.)

## Examples

See [Hexagonal Architecture Defaults](./HEXAGONAL_DEFAULTS.md) for a complete example configuration for hexagonal architecture (ports and adapters) projects.

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.
