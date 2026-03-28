# eslint-plugin-import-boundaries

> Enforce architectural boundaries with deterministic import paths. Auto-fixable.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Alpha release** -- originally developed for a personal project. Pin the version if you try it.

| Rule                                                          | Description                                               | Fixable  |
| ------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| [`import-boundaries/enforce`](#quick-start)                   | Deterministic import paths + architectural boundary rules | Auto-fix |
| [`import-boundaries/no-wildcard-barrel`](#no-wildcard-barrel) | Disallows `export *` in index files                       | Manual   |
| [`import-boundaries/index-sibling-only`](#index-sibling-only) | Index file imports must be direct siblings (`./file.ts`)  | Manual   |

## Quick Start

```bash
npm install --save-dev eslint-plugin-import-boundaries
```

### Absolute style

Import paths use `rootDir` + `dir` (e.g. `src/domain`). No path aliases or build config required.

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';

export default [
  {
    plugins: { 'import-boundaries': importBoundaries },
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          crossBoundaryStyle: 'absolute',
          boundaries: [
            { identifier: '@domain', dir: 'domain' },
            {
              identifier: '@application',
              dir: 'application',
              allowImportsFrom: ['@domain'],
            },
            {
              identifier: '@infrastructure',
              dir: 'infrastructure',
              allowImportsFrom: ['@domain'],
            },
          ],
        },
      ],
    },
  },
];
```

```typescript
import { Entity } from 'src/domain'; // cross-boundary -> boundary root path
import { helper } from './helper'; // same directory -> relative
import { utils } from '../utils'; // close cousin -> relative
import { uc } from 'src/application/use-cases'; // distant same-boundary -> absolute with subpath
```

### Alias style

Set `crossBoundaryStyle: 'alias'` and add `alias` to each boundary. Requires path aliases in your build tool (TypeScript `paths`, Vite `resolve.alias`, etc.).

```javascript
{
  rootDir: 'src',
  crossBoundaryStyle: 'alias',
  boundaries: [
    { identifier: '@domain', dir: 'domain', alias: '@domain' },
    { identifier: '@application', dir: 'application', alias: '@application', allowImportsFrom: ['@domain'] },
    { identifier: '@infrastructure', dir: 'infrastructure', alias: '@infrastructure', allowImportsFrom: ['@domain'] },
  ],
}
```

```typescript
import { Entity } from '@domain'; // cross-boundary -> alias
import { helper } from './helper'; // same directory -> relative
import { uc } from '@application/use-cases'; // distant same-boundary -> alias with subpath
```

---

## Configuration Reference

### Rule Options

| Option                   | Type                    | Default                                          | Description                                                                          |
| ------------------------ | ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `rootDir`                | `string`                | `'src'`                                          | Root directory for resolving boundary paths                                          |
| `boundaries`             | `BoundaryConfig[]`      | _required_                                       | Array of boundary definitions (see below)                                            |
| `crossBoundaryStyle`     | `'alias' \| 'absolute'` | _required_                                       | How cross-boundary imports are written                                               |
| `defaultSeverity`        | `'error' \| 'warn'`     | rule-level                                       | Default severity for violations                                                      |
| `enforceBoundaries`      | `boolean`               | `true`                                           | Check allow/deny rules. `false` = skip rules but still enforce path format           |
| `allowUnknownBoundaries` | `boolean`               | `false`                                          | Allow imports from paths outside all boundaries                                      |
| `maxRelativeDepth`       | `number`                | `1`                                              | Max `../` segments before switching to boundary path                                 |
| `skipIndexFiles`         | `boolean`               | `false`                                          | Skip checking index files (use with `index-sibling-only`)                            |
| `fileExtensions`         | `string[]`              | `['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']` | Extensions to recognize. Non-code imports (`.png`, `.css`, etc.) are always skipped. |

### Boundary Properties

| Property               | Required                           | Type                                 | Description                                                                      |
| ---------------------- | ---------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `identifier`           | yes                                | `string`                             | Canonical name used in `allowImportsFrom` / `denyImportsFrom` and error messages |
| `dir`                  | yes                                | `string`                             | Directory path relative to `rootDir`                                             |
| `alias`                | when `crossBoundaryStyle: 'alias'` | `string`                             | Import alias (e.g. `'@domain'`)                                                  |
| `allowImportsFrom`     | no                                 | `string[]`                           | Boundary identifiers this boundary may import from (deny-all default)            |
| `denyImportsFrom`      | no                                 | `string[]`                           | Boundary identifiers this boundary may NOT import from (allow-all default)       |
| `allowTypeImportsFrom` | no                                 | `string[]`                           | Like `allowImportsFrom` but for `import type` only                               |
| `nestedPathFormat`     | no                                 | `'alias' \| 'relative' \| 'inherit'` | Override path style when importing from a parent boundary                        |
| `severity`             | no                                 | `'error' \| 'warn'`                  | Override `defaultSeverity` for this boundary                                     |

### Allow / Deny Semantics

- **Only `allowImportsFrom`**: deny-all by default; only listed identifiers allowed.
- **Only `denyImportsFrom`**: allow-all by default; only listed identifiers denied.
- **Neither**: deny-all (strictest).
- **Both**: allow list applies, deny list overrides. Deny wins on conflict.

---

## How Paths Are Determined

All path decisions are deterministic -- one correct path per import, based on the relationship between file and target.

### Cross-boundary imports

Always use the boundary root path (alias or absolute depending on `crossBoundaryStyle`), with no subpath:

```typescript
import { Entity } from '@domain'; // alias style
import { Entity } from 'src/domain'; // absolute style
import { Entity } from '@domain/entities'; // WRONG -- no subpaths for cross-boundary
```

### Same-boundary imports

The rule picks the shortest readable path:

1. **Same directory** -- `./sibling`
2. **Cousin (shared parent, one `../`)** -- `../cousin`
3. **Siblings at boundary root** -- `./sibling` (relative, to avoid circular deps through index)
4. **Top-level target (file in subdirectory importing boundary root dir)** -- `@boundary/topLevel` or `src/.../topLevel`
5. **Distant (more `../` than `maxRelativeDepth`)** -- `@boundary/segment` or `src/.../segment`

### Ancestor barrel prevention

Importing from your own boundary root (e.g. `@application` from inside `application/`) is always forbidden -- it would create a circular dependency through the index file.

---

## Boundary Rules

### Allow / Deny

```javascript
{
  identifier: '@application',
  dir: 'application',
  alias: '@application',
  allowImportsFrom: ['@domain'],  // only @domain allowed; everything else denied
}
```

```typescript
import { Entity } from '@domain'; // allowed
import { DB } from '@infrastructure'; // VIOLATION
```

### Type-only imports

Use `allowTypeImportsFrom` to allow `import type` without allowing value imports:

```javascript
{
  identifier: '@infrastructure',
  dir: 'infrastructure',
  alias: '@infrastructure',
  allowImportsFrom: ['@domain'],
  allowTypeImportsFrom: ['@application'],  // type imports only
}
```

```typescript
import type { Port } from '@application'; // allowed (type only)
import { UseCase } from '@application'; // VIOLATION (value import)
```

### Nested boundaries

Boundaries can nest. Each boundary has independent rules (no inheritance). Files resolve to the most specific (deepest) matching boundary.

```javascript
boundaries: [
  {
    identifier: '@application',
    dir: 'application',
    alias: '@application',
    allowImportsFrom: ['@domain'],
  },
  {
    identifier: '@public-api',
    dir: 'application/public',
    alias: '@public-api',
    allowImportsFrom: ['@domain'],
  },
  {
    identifier: '@internal',
    dir: 'application/internal',
    alias: '@internal',
    allowImportsFrom: ['@domain'],
  },
];
```

A file in `application/public/` uses `@public-api` rules, not `@application` rules.

---

## Index File Rules

The plugin treats index files (`index.ts`) as **directory interfaces** -- the public API of a directory. Two companion rules enforce discipline within them.

### no-wildcard-barrel

Disallows `export *` in index files. Every export must be explicit.

```typescript
// BAD
export * from './army';

// GOOD
export { Army } from './army.ts';
```

```javascript
rules: { 'import-boundaries/no-wildcard-barrel': 'error' }
```

### index-sibling-only

Every import in an index file must be a direct sibling (`./file.ts` format, explicit extension, same directory).

```typescript
// BAD
import { foo } from '../parent';
import { bar } from './subdir/deep';

// GOOD
export { Army } from './army.ts';
export { Entity } from './entities'; // directory sibling -> hits entities/index.ts
```

```javascript
rules: { 'import-boundaries/index-sibling-only': 'error' }
```

### Using all three rules together

Use `skipIndexFiles: true` on `enforce` so the rules apply to disjoint file sets:

```javascript
rules: {
  'import-boundaries/enforce': ['error', { rootDir: 'src', crossBoundaryStyle: 'alias', boundaries, skipIndexFiles: true }],
  'import-boundaries/no-wildcard-barrel': 'error',
  'import-boundaries/index-sibling-only': 'error',
}
```

---

## Test File Configuration

Use ESLint's file matching to skip boundary rules for tests while keeping path format enforcement:

```javascript
const boundaries = [
  { identifier: '@domain', dir: 'domain', alias: '@domain' },
  {
    identifier: '@application',
    dir: 'application',
    alias: '@application',
    allowImportsFrom: ['@domain'],
  },
];

export default [
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      'import-boundaries/enforce': [
        'error',
        { rootDir: 'src', crossBoundaryStyle: 'alias', boundaries, enforceBoundaries: false },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      'import-boundaries/enforce': ['error', { rootDir: 'src', crossBoundaryStyle: 'alias', boundaries }],
    },
  },
];
```

- `enforceBoundaries: false` -- tests can import from any boundary, but path format is still enforced.

---

## Advanced

### Type-safe config with `defineConfig()`

```typescript
// boundaries.config.ts
import { defineConfig } from 'eslint-plugin-import-boundaries';

export default defineConfig({
  rootDir: 'src',
  crossBoundaryStyle: 'alias',
  boundaries: [
    { identifier: '@domain', dir: 'domain', alias: '@domain', allowImportsFrom: [] },
    {
      identifier: '@application',
      dir: 'application',
      alias: '@application',
      allowImportsFrom: ['@domain'],
    },
  ],
});
```

`defineConfig()` is a zero-overhead identity function for TypeScript autocompletion.

### `nestedPathFormat`

When a nested boundary imports from its parent boundary, `nestedPathFormat` overrides the path style:

- `'relative'` -- use `../` to reach the parent
- `'alias'` -- use the alias regardless of `crossBoundaryStyle`
- `'inherit'` (default) -- use whatever `crossBoundaryStyle` says

### Identifier vs alias vs dir

- **`identifier`** -- used in `allowImportsFrom` / `denyImportsFrom` rules and error messages. Arbitrary string.
- **`alias`** -- the import path prefix when using alias style (e.g. `@domain`). Must match your build tool config.
- **`dir`** -- the directory path relative to `rootDir`. Used for absolute-style imports and file resolution.

Convention: set `identifier` equal to `alias` (e.g. all three are `@domain`). The `identifier` exists to support cases where alias isn't feasible, like nested absolute paths where you want a clean name:

```javascript
{ identifier: '@user', dir: 'domain/entities/user', alias: '@user' }
// allowImportsFrom: ['@user']  -- uses the identifier, not the full dir path
```

### External packages

Imports that don't match any boundary or relative/absolute pattern (e.g. `vitest`, `react`) are treated as external packages and skipped entirely. No filesystem access is involved.

### Compatibility with other plugins

Compatible: `import/no-unresolved`, `import/no-duplicates`, `import/order`, `eslint-plugin-simple-import-sort`.

Conflicting (disable these): `eslint-plugin-no-relative-import-paths`, `eslint-plugin-absolute-imports`, `import/no-relative-packages`, `eslint-plugin-boundaries`.

---

## Error Messages

| Message                                             | Meaning             | Fixable  |
| --------------------------------------------------- | ------------------- | -------- |
| `Expected '@domain' but got '../domain'`            | Wrong path format   | Auto-fix |
| `Cannot import from '@infra' to '@app': ...`        | Boundary violation  | No       |
| `Cannot import from ancestor directory '@app'`      | Circular dependency | No       |
| `Cannot import from '...' - outside all boundaries` | Unknown boundary    | No       |

---

## License

ISC

## Contributing

Contributions welcome. Please open an issue or PR.
