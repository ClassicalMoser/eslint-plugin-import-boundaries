# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
