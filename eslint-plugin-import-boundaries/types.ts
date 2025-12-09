/**
 * Type definitions for the boundary-alias-vs-relative ESLint rule.
 */

/**
 * Represents a boundary configuration with its directory and alias.
 * absDir is computed at rule initialization for efficient path comparisons.
 */
export interface Boundary {
  dir: string; // Relative directory path (e.g., 'domain/entities')
  alias: string; // Import alias (e.g., '@entities')
  absDir: string; // Absolute resolved directory path
  allowImportsFrom?: string[]; // Array of boundary aliases that can be imported from
  denyImportsFrom?: string[]; // Array of boundary aliases that cannot be imported from
  allowTypeImportsFrom?: string[]; // Array of boundary aliases that can be imported as types (overrides allowImportsFrom for type-only imports)
  nestedPathFormat?: 'alias' | 'relative' | 'inherit'; // Path format for nested boundaries
  severity?: 'error' | 'warn'; // Severity for violations in this boundary
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
 * Boundary definition with optional allow/deny rules.
 */
export interface BoundaryConfig {
  dir: string; // Relative directory path (e.g., 'domain/entities')
  alias: string; // Import alias (e.g., '@entities')
  allowImportsFrom?: string[]; // Array of boundary aliases that can be imported from
  denyImportsFrom?: string[]; // Array of boundary aliases that cannot be imported from
  allowTypeImportsFrom?: string[]; // Array of boundary aliases that can be imported as types (overrides allowImportsFrom for type-only imports)
  nestedPathFormat?: 'alias' | 'relative' | 'inherit'; // Path format for nested boundaries
  severity?: 'error' | 'warn'; // Severity for violations in this boundary (default: 'error')
}

/**
 * Rule configuration options from ESLint config.
 */
export interface RuleOptions {
  rootDir?: string; // Root directory (defaults to 'src')
  boundaries: BoundaryConfig[]; // Array of boundary definitions
  crossBoundaryStyle?: 'alias' | 'absolute'; // Style for cross-boundary imports (default: 'alias')
  // 'alias': Use alias paths like @entities
  // 'absolute': Use absolute paths relative to rootDir like src/domain/entities
  defaultSeverity?: 'error' | 'warn'; // Default severity for violations (if not set, uses rule-level severity)
  allowUnknownBoundaries?: boolean; // Allow imports from paths not in any boundary (default: false)
  skipBoundaryRulesForTestFiles?: boolean; // Skip allow/deny boundary rules for test files, but still enforce path format (default: true)
  testFilePatterns?: string[]; // Patterns to detect test files (default: common test patterns)
}

/**
 * Alias subpath check result.
 */
export interface AliasSubpathCheck {
  isSubpath: boolean;
  baseAlias?: string;
}
