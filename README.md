# eslint-plugin-import-boundaries

> One canonical import path per module, plus architectural boundary enforcement, with no module resolver. Path-form violations are auto-fixable.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Beta** -- public API is still evolving. Core behavior is stable across real projects; option surface may continue to change. Pin your version.

**Requires ESLint `>=9.0.0` and Node `>=18`.**

| Rule                                                          | What it does                                                             | Auto-fix                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| [`import-boundaries/enforce`](#enforce)                       | Picks canonical path form and checks allow/deny rules between boundaries | Path form: yes. Boundary violations: no |
| [`import-boundaries/no-wildcard-barrel`](#no-wildcard-barrel) | Disallows `export *` in index files                                      | No                                      |
| [`import-boundaries/index-sibling-only`](#index-sibling-only) | Index-file imports/re-exports must be direct siblings                    | No                                      |

---

## What this plugin does

Three things, designed to compose:

1. **Canonical import paths.** For each importable target, exactly one spelling is considered correct. Non-canonical forms are reported and auto-fixed.
2. **Boundary enforcement.** Enforces allow/deny rules across configured boundaries, with separate support for `import type`.
3. **Index-file discipline.** Treats `index.ts`/`index.js` as directory interfaces, with two companion rules that keep them explicit and local.

With the common **allow-list-only** setup (see [Allow/deny semantics](#allowdeny-semantics)), boundaries are deny-by-default: for example, if `@ui` does not include `@data` in `allowImportsFrom`, imports from `@data` into `@ui` are rejected.

This is intentionally opinionated: a single package where these concerns work together rather than being split across separate plugins.

---

## Why not `eslint-plugin-boundaries`?

`eslint-plugin-boundaries` is mature and powerful. If you only need element/layer import policy, it is a great option.

Use `eslint-plugin-import-boundaries` when you also want:

- **Canonical path enforcement with auto-fix.** It normalizes allowed imports to one canonical form.
- **Resolver-free operation.** The core rule is path- and config-driven; no module resolver stack to wire and keep in sync.
- **Companion index rules in the same package.** Public-surface discipline (`no-wildcard-barrel` + `index-sibling-only`) is part of the model.

Trade-off: no graph-based module analysis; it stays fast and config-driven.

The guiding principle is that the directory tree is the source of truth. Boundaries map to real `dir` paths (most specific / deepest match wins; nesting is supported), and `index` files are where a directory’s public surface is made explicit. Directory-based boundary maps also tend to be easier to audit in code review than long glob or pattern lists — though this is a style trade-off.

---

## The most opinionated part: index files as directory interfaces

The plugin’s strongest architectural opinion is that directories expose public surface through index files.

Important nuance:

- The plugin does **not** verify that every directory physically has an index file.
- It effectively **depends** on that convention for correctness: canonical cross-boundary imports target boundary roots, so without threaded index-directory interfaces, imports are forced through locations that may not represent the intended public surface.

Why this matters:

- Cross-boundary imports are canonicalized to boundary roots (for example, `@domain`, not `@domain/internal/x`).
- That keeps boundary crossing explicit and funnels public API decisions into index files.
- The companion rules keep index files mechanical: no wildcard exports, no deep traversal.

This introduces small, intentional friction: publishing something across a boundary means making it explicit in the directory interface.

---

## Setup

### 1: Install

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

### 2: Configure aliases

Alias style is the long-term target. `crossBoundaryStyle: 'absolute'` is deprecated and scheduled for removal in `v0.9.0`.

```json
{
  "compilerOptions": {
    "paths": {
      "@domain": ["./src/domain/index.ts"],
      "@domain/*": ["./src/domain/*"],
      "@ui": ["./src/ui/index.ts"],
      "@ui/*": ["./src/ui/*"],
      "@data": ["./src/data/index.ts"],
      "@data/*": ["./src/data/*"]
    }
  }
}
```

### 3: Define boundaries

`defineConfig` and `defineBoundaries` are typed identity helpers for editor autocomplete and type checking.

```typescript
// boundaries.config.ts
import type { RuleOptions } from 'eslint-plugin-import-boundaries';
import { defineConfig } from 'eslint-plugin-import-boundaries';

const boundariesConfig: RuleOptions = defineConfig({
  rootDir: 'src',
  boundaries: [
    {
      identifier: '@domain',
      dir: 'domain',
      alias: '@domain',
      // No allow/deny lists => deny all.
    },
    {
      identifier: '@ui',
      dir: 'ui',
      alias: '@ui',
      allowImportsFrom: ['@domain'],
    },
    {
      identifier: '@data',
      dir: 'data',
      alias: '@data',
      allowImportsFrom: ['@domain'],
    },
  ],
});

export default boundariesConfig;
```

```typescript
// boundaries.ts (optional split form)
import type { BoundaryConfig } from 'eslint-plugin-import-boundaries';
import { defineBoundaries } from 'eslint-plugin-import-boundaries';

export const boundaries: BoundaryConfig[] = defineBoundaries([
  { identifier: '@domain', dir: 'domain', alias: '@domain' },
  {
    identifier: '@ui',
    dir: 'ui',
    alias: '@ui',
    allowImportsFrom: ['@domain'],
  },
  {
    identifier: '@data',
    dir: 'data',
    alias: '@data',
    allowImportsFrom: ['@domain'],
  },
]);
```

These helpers exist to make config authoring in TypeScript easier and safer (autocomplete, option hints, typo detection on keys like `allowTypeImportsFrom`, `nestedPathFormat`, etc.). They add no runtime behavior beyond returning the same value.

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';
import boundariesConfig from './boundaries.config.ts';

export default [
  {
    plugins: { 'import-boundaries': importBoundaries },
    rules: {
      'import-boundaries/enforce': ['error', boundariesConfig],
      'import-boundaries/no-wildcard-barrel': 'error',
      'import-boundaries/index-sibling-only': 'error',
    },
  },
];
```

If your runtime does not load TypeScript config files directly, use one of these patterns:

- Keep boundaries in JavaScript (`boundaries.config.js`) and import that from `eslint.config.js`.
- Keep boundaries in TypeScript, then transpile to JavaScript and import the emitted `.js` file.
- Use `eslint.config.ts` when your toolchain/runtime supports it end-to-end.

### 4: Add an `index.ts` to each boundary root

A boundary's `index.ts` defines its public surface — the exports visible to other boundaries. But the same convention applies at every level: each subdirectory's `index.ts` defines what the rest of _that boundary_ may use from it. Cross-boundary imports resolve to the boundary alias (`@domain`), which in turn resolves through the boundary root's `index.ts`. Same-boundary imports deeper in the tree are canonicalized to paths like `@domain/feature`, which resolve through `src/domain/feature/index.ts`. Without index files threaded through the directory tree, the canonical path targets don't exist on disk.

```typescript
// src/domain/index.ts
export { User } from './user.ts';
export type { UserId } from './ids.ts';
```

**Bootstrap tip.** Threading index files through an existing codebase is the hardest part of adopting this plugin. It is significantly easier at project start than on a codebase that has grown without them — every directory that gets imported from needs one, not just boundary roots. Budget accordingly.

The `no-wildcard-barrel` rule blocks `export *`, so generic barrel generators (`barrelsby`, `create-ts-index`) won't produce the form this plugin expects — they emit wildcard re-exports. The fastest paths today:

- Use editor-assisted codegen or a one-shot codemod script to generate explicit named re-exports across the tree in one pass.
- Or write a small one-shot Node script per project to walk each boundary, parse exports, and emit named re-export lines.
- After bootstrap, maintenance is one line per public export — small cost, high visibility.

---

## TypeScript types

The package exports types so configs stay honest without relying on comments:

| Type                     | What it represents                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `RuleOptions`            | Full options object passed to `import-boundaries/enforce` (`rootDir`, `boundaries`, toggles, etc.) |
| `BoundaryConfig`         | One boundary entry inside `RuleOptions.boundaries`                                                 |
| `BarrelFileRuleOptions`  | Options for `no-wildcard-barrel` / `index-sibling-only` (mostly `barrelFileName`)                  |
| `ImportBoundariesRules`  | Typed ESLint flat-config rule entries for this plugin                                              |
| `ImportBoundariesPlugin` | Typed shape of the plugin default export                                                           |

`satisfies Partial<ImportBoundariesRules>` is a useful ergonomics pattern in `eslint.config.ts` to get rule-level type checking without widening the object type.

Helpers:

- `defineConfig(options: RuleOptions)` -- identity helper for `RuleOptions`
- `defineBoundaries(boundaries: readonly BoundaryConfig[])` -- identity helper for just the `boundaries` array

You can also skip the helpers and use `import type { RuleOptions } ...` + `satisfies RuleOptions` directly -- same typing outcome.

---

## Enforce

`import-boundaries/enforce` does two jobs:

1. Canonical path-form enforcement (fixable).
2. Boundary allow/deny enforcement (non-fixable).

### What it visits

- ES `import` and `import type` declarations
- Dynamic `import('...')` expressions
- `require('...')` calls (CommonJS interop, value imports only)
- `export ... from '...'` and `export * from '...'` re-exports

The index rules (`no-wildcard-barrel`, `index-sibling-only`) check ES module syntax only.

### Auto-fix highlights

Path-form violations are deterministic, so the fixer rewrites them to the canonical form. Boundary allow/deny violations are intentionally **not** fixable — there is no automatic right answer.

| Before                                    | After (`lint --fix`)             | Why                                                   |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| `import { User } from '../../domain'`     | `import { User } from '@domain'` | Climb past `maxRelativeDepth` → boundary alias        |
| `import { User } from 'src/domain'`       | `import { User } from '@domain'` | `src/...` style normalized to alias                   |
| `import { User } from '@/domain'`         | `import { User } from '@domain'` | `rootDirAlias` input normalized to canonical boundary |
| `import { User } from '@domain/entities'` | `import { User } from '@domain'` | Cross-boundary subpath collapses to boundary root     |

### Cross-boundary imports

Canonical form is the boundary root, no cross-boundary subpath:

```typescript
import { UserRepo } from '@data'; // ✓
import { UserRepo } from '@data/user-repo'; // ✗ cross-boundary subpath
import { UserRepo } from 'src/data'; // ✗ non-canonical (prefer `@data`)
```

### Same-boundary imports

Canonical choice depends on relationship:

- Same directory -> `./sibling`
- Nearby cousin (within `maxRelativeDepth`) -> `../cousin`
- Distant target (beyond `maxRelativeDepth`) -> `@boundary/segment`
- Own boundary root from inside that boundary -> forbidden (ancestor-directory cycle risk)

`maxRelativeDepth` defaults to `1`.

### Ancestor-directory import

Importing your own boundary root from inside that boundary is always reported (not auto-fixable):

```typescript
// inside src/data/...
import { something } from '@data'; // ✗
```

### `crossBoundaryStyle` status

- Supported values: `'alias' | 'absolute'`
- Omitted by default: inferred per file extension
  - `.ts`, `.tsx`, `.mts`, `.cts` -> `'alias'`
  - `.js`, `.jsx`, `.mjs`, `.cjs`, and others -> `'absolute'`
- **`'absolute'` is deprecated** and will be removed in `v0.9.0`

In inferred mode, TypeScript files require aliases on all boundaries.

---

## Index rules

### `no-wildcard-barrel`

Disallows wildcard re-exports in index files.

```typescript
// BAD
export * from './user-service';
export * as User from './user-service';

// GOOD
export { UserService } from './user-service.ts';
```

### `index-sibling-only`

In index files, import/re-export sources must be direct siblings:

```typescript
// BAD
import { foo } from '../parent';
export { bar } from './subdir/deep/thing';
import { baz } from '@data';

// GOOD
export { UserService } from './user-service.ts';
export { Routes } from './routes'; // sibling directory index
```

### Composing all three rules

Use `skipIndexFiles: true` on `enforce` so file sets are disjoint:

```javascript
rules: {
  'import-boundaries/enforce': ['error', { ...boundariesConfig, skipIndexFiles: true }],
  'import-boundaries/no-wildcard-barrel': 'error',
  'import-boundaries/index-sibling-only': 'error',
}
```

---

## Boundary rules

### Allow/deny semantics

- Only `allowImportsFrom`: deny-all default, then allow listed identifiers
- Only `denyImportsFrom`: allow-all default, then deny listed identifiers
- Both: allow list applies, deny list overrides
- Neither: deny all (strictest)

### Type-only imports

```javascript
{
  identifier: '@ui',
  dir: 'ui',
  alias: '@ui',
  allowImportsFrom: ['@domain'],
  allowTypeImportsFrom: ['@data'],
}
```

```typescript
import type { Row } from '@data'; // ✓ type-only escape hatch
import { pool } from '@data'; // ✗ value import
```

### Nested boundaries

Nested boundaries resolve to the most specific match. Rules do not inherit automatically — a file inside `data/internal/` resolves to `@data-internal` only. Even if `@data` allows `@domain`, `@data-internal` must still list `@domain` in its own `allowImportsFrom`; parent allow/deny lists do not cascade.

```javascript
boundaries: [
  {
    identifier: '@data',
    dir: 'data',
    alias: '@data',
    allowImportsFrom: ['@domain'],
  },
  {
    identifier: '@data-internal',
    dir: 'data/internal',
    alias: '@data-internal',
    allowImportsFrom: ['@domain', '@data'],
    nestedPathFormat: 'relative',
  },
];
```

`nestedPathFormat` applies when a nested boundary imports from its parent:

- `'relative'` -> force `../...`
- `'alias'` -> force alias path
- `'inherit'` (default) -> follow current cross-boundary style

---

## Config reference

### Rule options

| Option                   | Type                    | Default                                          | Purpose                                                                    |
| ------------------------ | ----------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `rootDir`                | `string`                | `'src'`                                          | Root dir for resolving boundary `dir` paths                                |
| `boundaries`             | `BoundaryConfig[]`      | required                                         | Boundary definitions                                                       |
| `crossBoundaryStyle`     | `'alias' \| 'absolute'` | inferred                                         | Per-file inference when omitted                                            |
| `defaultSeverity`        | `'error' \| 'warn'`     | rule-level                                       | Default boundary-violation severity                                        |
| `enforceBoundaries`      | `boolean`               | `true`                                           | `false` skips allow/deny checks but still enforces path form               |
| `allowUnknownBoundaries` | `boolean`               | `false`                                          | Allow targets outside all configured boundaries                            |
| `maxRelativeDepth`       | `number`                | `1`                                              | Max `../` segments before canonicalizing to boundary path                  |
| `skipIndexFiles`         | `boolean`               | `false`                                          | Skip `enforce` on index files                                              |
| `fileExtensions`         | `string[]`              | `['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']` | Recognized code imports                                                    |
| `rootDirAlias`           | `string`                | `'@'`                                            | Accept `<alias>/...` as root-dir import input (`@/foo` -> `<rootDir>/foo`) |

### Boundary properties

| Property               | Required                       | Type                                 | Purpose                                            |
| ---------------------- | ------------------------------ | ------------------------------------ | -------------------------------------------------- |
| `identifier`           | yes                            | `string`                             | Name used in allow/deny lists and diagnostics      |
| `dir`                  | yes                            | `string`                             | Directory under `rootDir`                          |
| `alias`                | required for alias-style usage | `string`                             | Canonical boundary import prefix (`@domain`)       |
| `allowImportsFrom`     | no                             | `string[]`                           | Allowed source boundary identifiers                |
| `denyImportsFrom`      | no                             | `string[]`                           | Denied source boundary identifiers                 |
| `allowTypeImportsFrom` | no                             | `string[]`                           | Type-only allow list                               |
| `nestedPathFormat`     | no                             | `'alias' \| 'relative' \| 'inherit'` | Parent-import style override for nested boundaries |
| `severity`             | no                             | `'error' \| 'warn'`                  | Per-boundary severity override                     |

---

## `rootDirAlias` and naming guidance

`rootDirAlias` exists for project-root aliases like `@/foo` (or `~/foo` if configured).
These are accepted as input and normalized to canonical paths.

Collision guidance:

- Do not reuse plain package-like names for boundary aliases.
- Prefer explicit boundary aliases like `@domain`, `@ui`, `@data`.
- If you want `~/foo` source-root imports, use `rootDirAlias: '~'`. This does **not** make `~server` a boundary alias format.

---

## Test-file config pattern

Common setup: skip allow/deny checks in tests while still enforcing canonical path form. Keep it maintainable by using shared globs and a base options object:

```javascript
const testFileGlobs = ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'];
const enforceBase = boundariesConfig;
const enforceForTests = { ...enforceBase, enforceBoundaries: false };

export default [
  {
    files: testFileGlobs,
    rules: {
      'import-boundaries/enforce': ['error', enforceForTests],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: testFileGlobs,
    rules: {
      'import-boundaries/enforce': ['error', enforceBase],
    },
  },
];
```

---

## Error messages

### `enforce`

| Message                                                                                                                         | Meaning                                                                                                                           | Auto-fix |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `Expected '@data' but got '../../data'`                                                                                         | Wrong path form                                                                                                                   | Yes      |
| `Cannot import from '@data' into '@ui': ...`                                                                                    | Boundary violation: `@data` is the imported boundary, `@ui` is the file's boundary; that direction is denied by allow/deny lists. | No       |
| `Cannot import from ancestor directory '@data'`                                                                                 | Importing your own boundary root from inside that boundary                                                                        | No       |
| `Cannot import from '...' - path is outside all configured boundaries`                                                          | Target resolves outside every configured boundary (and `allowUnknownBoundaries` is `false`)                                       | No       |
| `When 'crossBoundaryStyle' is omitted, TypeScript files use alias paths; every boundary must have an 'alias'. Missing for: ...` | Inferred-style config error (TS file but boundaries lack `alias`)                                                                 | No       |

### `no-wildcard-barrel`

| Message                                                                                                                                 | Meaning                                       | Auto-fix |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------- |
| `Wildcard export 'export * from "..."' is not allowed in index files. Use explicit named exports instead: 'export { Name } from "..."'` | `export *` in an index file                   | No       |
| `Wildcard namespace export 'export * as Name from "..."' is not allowed in index files. Use explicit named exports instead.`            | `export * as Foo from '...'` in an index file | No       |

### `index-sibling-only`

| Message                                                                                                                                                | Meaning                                                                                | Auto-fix |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------- |
| `Index files may only import from direct siblings. '...' is not a sibling import. Use './filename.ext' (flat file) or './dirname' (directory) format.` | Index file references a non-sibling path (parent traversal, nested, or cross-boundary) | No       |

---

## Compatibility

**Non-goal:** CommonJS `require()` is not checked — only ES `import`/`export` statements and dynamic `import()` expressions.

Compatible:

- `import/no-unresolved`
- `import/no-duplicates`
- `import/order`
- `eslint-plugin-simple-import-sort`

Potentially conflicting path-style enforcers (disable if present):

- `eslint-plugin-no-relative-import-paths`
- `eslint-plugin-absolute-imports`
- `import/no-relative-packages`
- `eslint-plugin-boundaries`

---

## License

ISC

## Contributing

Issues and PRs are welcome.
