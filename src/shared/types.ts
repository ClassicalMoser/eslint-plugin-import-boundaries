/**
 * Type definitions for `import-boundaries/enforce` and related rules.
 */

/**
 * Resolved boundary record used at lint time.
 *
 * Built from {@link BoundaryConfig} plus derived fields (`absDir`).
 */
export interface Boundary {
  /**
   * Stable label used in allow/deny lists and diagnostics.
   *
   * Often matches `alias` (for example `'@domain'`), but may differ when you want a readable identifier separate from import spelling.
   */
  identifier: string;
  /** Directory path relative to {@link RuleOptions.rootDir}. */
  dir: string;
  /**
   * Import alias prefix when using alias-style paths (for example `'@domain'`).
   *
   * Optional when `crossBoundaryStyle` is `'absolute'` (deprecated).
   */
  alias?: string;
  /** Absolute filesystem path for `dir`, computed once when the rule initializes. */
  absDir: string;
  /**
   * Identifiers this boundary may import from (deny-by-default when used alone).
   *
   * Identifiers refer to other boundaries' {@link Boundary.identifier} values.
   */
  allowImportsFrom?: string[];
  /**
   * Identifiers this boundary must not import from (allow-by-default when used alone).
   *
   * If both allow and deny lists are present, deny wins on conflicts.
   */
  denyImportsFrom?: string[];
  /**
   * Identifiers allowed for `import type` even when value imports are denied.
   *
   * Overrides {@link allowImportsFrom} for type-only imports.
   */
  allowTypeImportsFrom?: string[];
  /**
   * When this boundary is nested inside another boundary and imports from its parent,
   * choose how to spell that parent import.
   *
   * - `'inherit'` – follow the active cross-boundary style (`alias` vs `absolute`).
   * - `'relative'` – prefer `../...` into the parent directory.
   * - `'alias'` – prefer the parent's alias path.
   */
  nestedPathFormat?: 'alias' | 'relative' | 'inherit';
  /** Override severity for violations originating from files in this boundary. */
  severity?: 'error' | 'warn';
}

/**
 * Cached file metadata for the current file being linted.
 * Cached to avoid recomputing on every import statement.
 */
export interface FileData {
  isValid: boolean; // False if file path couldn't be resolved
  fileDir?: string; // Directory containing the file
  fileBoundary?: Boundary | null; // Boundary this file belongs to, or null if outside all boundaries
}

/**
 * One boundary entry in user configuration.
 *
 * Files resolve to the **deepest** matching `dir` when boundaries nest.
 */
export interface BoundaryConfig {
  /**
   * Stable label used in allow/deny lists and diagnostics.
   *
   * Convention: match {@link alias} when using alias imports (for example both `'@domain'`).
   */
  identifier: string;
  /** Directory path under {@link RuleOptions.rootDir} (for example `'domain'` or `'application/internal'`). */
  dir: string;
  /**
   * Import alias prefix for this boundary (for example `'@domain'`).
   *
   * Required when `crossBoundaryStyle` is `'alias'`, or when inference picks alias style for TypeScript files.
   */
  alias?: string;
  /**
   * Identifiers this boundary may import from (deny-by-default when used alone).
   *
   * Values are other boundaries' {@link identifier} strings.
   */
  allowImportsFrom?: string[];
  /**
   * Identifiers this boundary must not import from (allow-by-default when used alone).
   *
   * If both allow and deny lists are present, deny wins on conflicts.
   */
  denyImportsFrom?: string[];
  /**
   * Identifiers allowed for `import type` even when value imports are denied.
   *
   * Overrides {@link allowImportsFrom} for type-only imports.
   */
  allowTypeImportsFrom?: string[];
  /**
   * When this nested boundary imports from its parent boundary, choose import spelling.
   *
   * See {@link Boundary.nestedPathFormat} for semantics.
   */
  nestedPathFormat?: 'alias' | 'relative' | 'inherit';
  /** Per-boundary severity override (defaults to rule severity). */
  severity?: 'error' | 'warn';
}

/**
 * Options for barrel-related rules (`no-wildcard-barrel`, `index-sibling-only`).
 */
export interface BarrelFileRuleOptions {
  /**
   * Basename of index files to treat as directory interfaces (without extension).
   *
   * Must stay `'index'` to match runtime module resolution and `enforce` behavior.
   */
  barrelFileName?: string;
}

/**
 * Options for `import-boundaries/enforce`.
 */
export interface RuleOptions {
  /**
   * Source root directory containing boundary folders.
   *
   * Defaults to `'src'`.
   */
  rootDir?: string;
  /** Boundary definitions; at least one entry is required. */
  boundaries: BoundaryConfig[];
  /**
   * Cross-boundary import spelling style.
   *
   * Omit to infer from the linted file extension (TypeScript → `alias`, JavaScript → `absolute`).
   *
   * @deprecated `'absolute'` is deprecated and scheduled for removal in v0.9.0; prefer alias imports with matching TS/bundler path mappings.
   */
  crossBoundaryStyle?: 'alias' | 'absolute';
  /** Default severity for boundary violations when not overridden per-boundary. */
  defaultSeverity?: 'error' | 'warn';
  /**
   * Allow imports whose resolved targets fall outside every configured boundary directory.
   *
   * Default `false` reports unknown-boundary imports.
   */
  allowUnknownBoundaries?: boolean;
  /**
   * When `false`, skip allow/deny checks but still enforce canonical import paths.
   *
   * Useful for tests or gradual rollout.
   */
  enforceBoundaries?: boolean;
  /**
   * Skip `enforce` entirely for index files (`index.*`).
   *
   * Pair with `index-sibling-only` / `no-wildcard-barrel` to avoid overlapping checks.
   */
  skipIndexFiles?: boolean;
  /**
   * Extensions treated as code imports for boundary and path rules.
   *
   * Non-code specifiers (assets, styles, query strings) are skipped separately.
   */
  fileExtensions?: string[];
  /**
   * Maximum number of `../` segments allowed before switching to boundary-root style paths.
   *
   * Default `1`.
   */
  maxRelativeDepth?: number;
  /**
   * Recognise root-relative alias imports like `@/foo` as `<rootDir>/foo`.
   *
   * Set to `''` to disable. Default `'@'`.
   */
  rootDirAlias?: string;
}

/**
 * Canonical defaults — single source of truth for all layers.
 */
export const DEFAULTS = {
  crossBoundaryStyle: undefined as 'alias' | 'absolute' | undefined,
  rootDir: 'src',
  allowUnknownBoundaries: false,
  enforceBoundaries: true,
  skipIndexFiles: false,
  maxRelativeDepth: 1,
  barrelFileName: 'index',
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const,
  rootDirAlias: '@',
} as const;

/**
 * Result of detecting whether an alias import includes a disallowed subpath
 * (for example `'@domain/foo'` vs boundary root `'@domain'`).
 *
 * Used inside domain helpers; not part of the public configuration surface.
 *
 * @internal
 */
export interface AliasSubpathCheck {
  isSubpath: boolean;
  baseAlias?: string;
}
