# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
