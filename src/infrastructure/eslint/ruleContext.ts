/**
 * Rule context setup and validation.
 * Handles options extraction, validation, and boundary resolution.
 */

import type { Boundary, FileData, RuleOptions } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import process from 'node:process';
import { getFileData } from '@domain';

/**
 * Validated and resolved rule context.
 */
export interface RuleContextData {
  rootDir: string;
  boundaries: Boundary[];
  crossBoundaryStyle: 'alias' | 'absolute';
  defaultSeverity?: 'error' | 'warn';
  allowUnknownBoundaries: boolean;
  enforceBoundaries: boolean;
  barrelFileName: string;
  fileExtensions: string[];
  cwd: string;
}

/**
 * Extract and validate rule options.
 */
export function extractRuleOptions(context: Rule.RuleContext): RuleContextData {
  // Validate that options are provided
  if (!context.options || context.options.length === 0) {
    throw new Error(
      'boundary-alias-vs-relative requires boundaries configuration',
    );
  }
  const options: RuleOptions = context.options[0];
  const {
    rootDir = 'src',
    boundaries,
    crossBoundaryStyle = 'alias',
    defaultSeverity,
    allowUnknownBoundaries = false,
    enforceBoundaries = true,
    barrelFileName = 'index',
    fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  } = options;
  const cwd = context.getCwd?.() ?? process.cwd();

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
      dir: b.dir,
      alias: b.alias,
      // Use explicit identifier if provided, otherwise fall back to alias or dir
      identifier: b.identifier ?? b.alias ?? b.dir,
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
    const filename = context.filename ?? context.getFilename?.() ?? '<unknown>';

    // Use the module function to get file data
    cache.data = getFileData(filename, boundaries);
    return cache.data;
  }

  function clearCache(): void {
    cache.data = null;
  }

  return { getFileData: getFileDataCached, clearCache };
}
