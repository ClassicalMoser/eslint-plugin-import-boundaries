/**
 * Rule context setup and validation.
 * Handles options extraction, validation, and boundary resolution.
 */

import type { Boundary, FileData, RuleOptions } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import process from 'node:process';
import { getFileData } from '@domain';
import { DEFAULTS } from '@shared';

/**
 * Validated and resolved rule context.
 */
export interface RuleContextData {
  rootDir: string;
  boundaries: Boundary[];
  /** From options only; omit means infer per linted file from its extension. */
  crossBoundaryStyle?: 'alias' | 'absolute';
  defaultSeverity?: 'error' | 'warn';
  allowUnknownBoundaries: boolean;
  enforceBoundaries: boolean;
  skipIndexFiles: boolean;
  maxRelativeDepth: number;
  barrelFileName: string;
  fileExtensions: string[];
  cwd: string;
}

const TS_STYLE_EXTS = new Set(['.ts', '.tsx', '.mts', '.cts']);

/**
 * When `crossBoundaryStyle` is omitted from rule options, pick a style from the linted file.
 * TypeScript-family extensions use `alias` (typical `paths` / bundler aliases). JavaScript and
 * everything else use `absolute` (no TS path mapping; root-relative paths are the usual story).
 */
export function inferCrossBoundaryStyleFromFilename(
  filename: string,
): 'alias' | 'absolute' {
  const ext = path.extname(filename).toLowerCase();
  return TS_STYLE_EXTS.has(ext) ? 'alias' : 'absolute';
}

/**
 * Extract and validate rule options.
 */
export function extractRuleOptions(context: Rule.RuleContext): RuleContextData {
  // Validate that options are provided
  if (!context.options || context.options.length === 0) {
    throw new Error(
      'import-boundaries/enforce requires a boundaries configuration',
    );
  }
  const options: RuleOptions = context.options[0];
  const {
    rootDir = DEFAULTS.rootDir,
    boundaries,
    crossBoundaryStyle,
    defaultSeverity,
    allowUnknownBoundaries = DEFAULTS.allowUnknownBoundaries,
    enforceBoundaries = DEFAULTS.enforceBoundaries,
    skipIndexFiles = DEFAULTS.skipIndexFiles,
    maxRelativeDepth = DEFAULTS.maxRelativeDepth,
    fileExtensions = [...DEFAULTS.fileExtensions],
  } = options;

  // barrelFileName is not configurable - must be 'index' to match runtime module resolution
  const barrelFileName = 'index';
  const cwd = process.cwd();

  // Validate: aliases are required when crossBoundaryStyle is 'alias'
  if (crossBoundaryStyle === 'alias') {
    const boundariesWithoutAlias = boundaries.filter((b) => !b.alias);
    if (boundariesWithoutAlias.length > 0) {
      const missingAliases = boundariesWithoutAlias
        .map((b) => b.dir)
        .join(', ');
      throw new Error(
        `When crossBoundaryStyle is 'alias', all boundaries must have an 'alias' property. Missing aliases for: ${missingAliases}`,
      );
    }
  }

  // Pre-resolve all boundary directories to absolute paths for efficient comparison
  const resolvedBoundaries: Boundary[] = boundaries.map(
    (b: RuleOptions['boundaries'][number]) => ({
      identifier: b.identifier, // Required - no fallback needed
      dir: b.dir,
      alias: b.alias,
      absDir: path.resolve(cwd, rootDir, b.dir),
      allowImportsFrom: b.allowImportsFrom,
      denyImportsFrom: b.denyImportsFrom,
      allowTypeImportsFrom: b.allowTypeImportsFrom,
      nestedPathFormat: b.nestedPathFormat,
      severity: b.severity,
    }),
  );

  return {
    rootDir,
    boundaries: resolvedBoundaries,
    crossBoundaryStyle,
    defaultSeverity,
    allowUnknownBoundaries,
    enforceBoundaries,
    skipIndexFiles,
    maxRelativeDepth,
    barrelFileName,
    fileExtensions,
    cwd,
  };
}

/**
 * Create a cached file data getter with cache clearing capability.
 */
export function createFileDataGetter(
  context: Rule.RuleContext,
  boundaries: Boundary[],
): { getFileData: () => FileData; clearCache: () => void } {
  const cache: { data: FileData | null } = { data: null };

  function getFileDataCached(): FileData {
    // Return cached data if available
    if (cache.data) return cache.data;

    // Get filename from context, with fallbacks for different ESLint versions
    const filename = context.filename || '<unknown>';

    // Use the module function to get file data
    cache.data = getFileData(filename, boundaries);
    return cache.data;
  }

  function clearCache(): void {
    cache.data = null;
  }

  return { getFileData: getFileDataCached, clearCache };
}
