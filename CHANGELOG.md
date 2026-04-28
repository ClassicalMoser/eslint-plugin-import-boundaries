# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-04-28

### Bug Fixes

- **`boundaryViolation` message**: Template and report data now read correctly in English (`Cannot import from '<imported boundary>' into '<file boundary>'`). Placeholders `from` / `into` match semantics; message `data.to` is renamed to `data.into` for tooling that reads rule message data.

### Removed

- **`require()` in `enforce`**: CommonJS `require()` calls are no longer visited. Only ES `import`/`export` and dynamic `import()` participate in boundary and path rules.

### Documentation

- README rewrite (positioning, setup, TypeScript types, compatibility, non-goals).
- JSDoc on exported configuration types in `src/shared/types.ts`.
- Remove `HEXAGONAL_DEFAULTS.md` (superseded by README).

## [0.8.0] - 2026-04-27

### Features

- **Root-directory alias (`rootDirAlias`)**: Recognise specifiers of the shape `@/foo` (or any configured prefix such as `~/foo`) as internal imports anchored at the source root, so they participate in boundary rules and path-format enforcement instead of being treated as external packages. Default prefix is `'@'`; set `rootDirAlias: ''` to disable, or supply a custom prefix (e.g. `'~'`). The fixer normalises matched specifiers to your existing canonical form (`@boundary` for cross-boundary alias style, `src/...` for absolute style, or `./relative` within the same boundary) — `@/...` is accepted as input only.

### Deprecations

- **`crossBoundaryStyle: 'absolute'`** is deprecated and will be removed in **v0.9.0**. The option emits a console deprecation warning when explicitly set. Migrate by:
  1. Adding an `alias` to every boundary (e.g. `alias: '@entities'`).
  2. Configuring matching `paths` in `tsconfig.json` (and your bundler) so the runtime can resolve the aliases.
  3. Setting `crossBoundaryStyle: 'alias'` (or omitting it for `.ts`/`.tsx`/`.mts`/`.cts` files, which already default to alias style).

  The plugin will keep recognising `src/...` imports as input for the foreseeable future — you'll just get them auto-fixed to `@boundary` form.

### Improvements

- Tightened the `rootDirAlias` dispatcher contract so unconventional prefix values (e.g. `rootDirAlias: 'foo'`) cannot capture unrelated bare imports such as `foobar`. Match requires exact equality with the alias or a trailing `/`.

## [0.7.0] - 2026-04-27

### Features

- **Typed ESLint flat config**: Export `ImportBoundariesRules` (`Linter.RuleEntry` per rule), `ImportBoundariesPlugin` (default export shape), and `BarrelFileRuleOptions` for barrel rules. Use `satisfies Partial<ImportBoundariesRules>` when composing `rules` with `defineConfig` from `eslint/config`.
- **`defineBoundaries`**: Type-check and document a `boundaries` array in a dedicated file (e.g. `boundaries.ts`) while keeping other rule options in `eslint.config`.
- **Plugin export**: Default export is checked with `satisfies ImportBoundariesPlugin` so `rules` keys and `Rule.RuleModule` values are validated at compile time.

### Improvements

- **`Program` visitor typing**: Uses `AST.Program` for ESLint 10 `RuleListener` compatibility.

## [0.6.0] - 2026-03-28

### Bug Fixes

- **Non-code imports ignored**: Imports whose specifiers look like asset or style modules (e.g. `.png`, `.svg`, `.css`, including Vite-style `?url` / `#` suffixes) are skipped so boundary and path-format rules do not apply to them.
- **ESLint 10 types**: Rule code uses `context.filename` and `process.cwd()` instead of removed `getFilename` / `getCwd` APIs on the typed `RuleContext`, so the package type-checks cleanly against current ESLint.

### Improvements

- **`crossBoundaryStyle` optional with per-file default**: If omitted, `.ts`/`.tsx`/`.mts`/`.cts` files use `alias`; `.js`/`.jsx`/`.mjs`/`.cjs` (and other extensions) use `absolute`. TypeScript files still require an `alias` on every boundary when this default applies; a dedicated lint message explains missing aliases. Set `crossBoundaryStyle` explicitly to force one style for all files.
- README documents automatic style and when to set the option explicitly.
- `tsconfig.json`: `noEmit`, `types: ["node"]`, tighter `include`, and path aliases without deprecated `baseUrl`.
- Test utilities restored under `src/__tests__/` (`boundaryTestHelpers`, `testUtils`).
- Satisfy `e18e/prefer-static-regex` by hoisting a few regex literals to module scope.

## [0.5.0] - 2025-12-12

### Breaking Changes

- **Removed `barrelFileName` configuration option**: The `barrelFileName` option has been removed from the configuration schema. Index files must be named `index` (e.g., `index.ts`, `index.js`) to match runtime module resolution behavior, and this is no longer configurable.

  **Migration**: Remove `barrelFileName` from your configuration if present. The rule now always uses `index` as the index file name.

  ```javascript
  // Before (0.4.x)
  {
    rootDir: 'src',
    barrelFileName: 'index', // This option is removed
    boundaries: [...],
  }

  // After (0.5.0)
  {
    rootDir: 'src',
    // barrelFileName removed - always uses 'index'
    boundaries: [...],
  }
  ```

### Improvements

- **Terminology update**: Replaced references to "barrel files" with "directory interface" and "index files" throughout documentation and code comments. Index files are now explicitly described as directory interfaces that define the public API of a directory and act as boundaries.
- **Error message clarity**: Updated error messages to use "ancestor directory" instead of "ancestor barrel" for better clarity.
- **Documentation**: Enhanced documentation to emphasize that index files are NOT "barrel files" but rather directory interfaces that enforce boundaries and define explicit exports.
- **Export best practices**: Added documentation recommending explicit named exports (e.g., `export { Entity } from './entity'`) instead of `export *` in index files for better tree shaking and bundle size optimization.

### Planned Changes

- **Future enforcement of explicit exports**: A future version will add a rule to enforce explicit named exports in index files, blocking `export *` statements. This will improve tree shaking and make directory interfaces more explicit about their exports.

## [0.4.0] - 2025-12-10

### Breaking Changes

- **`identifier` is now required in boundary configuration**: Previously, `identifier` defaulted to `alias ?? dir` when not specified. It is now a required field in the boundary configuration schema.

  **Migration**: Add `identifier` to all boundary configurations. When using alias style, set `identifier` to match the `alias` value. When using absolute style, set `identifier` to match the `dir` value or use a custom identifier.

  ```javascript
  // Before (0.3.x)
  {
    dir: 'domain',
    alias: '@domain',
    // identifier was optional
  }

  // After (0.4.0)
  {
    identifier: '@domain', // Now required
    dir: 'domain',
    alias: '@domain',
  }
  ```

### Improvements

- **Path normalization fixes**: Fixed path normalization for files outside boundaries when boundaries aren't enforced
- **100% test coverage**: Achieved 100% code coverage across all statements, branches, functions, and lines
- **Code quality**: Removed unreachable defensive code and simplified path formatting logic
- **Documentation**: Updated README to clarify the distinction between boundary identifiers and import paths

### Bug Fixes

- Fixed path normalization issue where files outside boundaries weren't properly normalized to relative paths
- Fixed barrel file handling to prevent `/index` loops in path resolution
- Specified missing path string expectation when resolved to a file outside of defined boundaries.
- Improved support for absolute paths

## [0.3.1] - Previous Release

Initial stable release with core boundary enforcement features.
