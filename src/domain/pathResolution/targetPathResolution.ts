/**
 * Target path resolution from import specifiers.
 * Dispatches to specific resolution functions based on import type.
 */

import type { Boundary } from '@shared';
import { DEFAULTS } from '@shared';
import { resolveAbsoluteImport } from './absoluteImportResolution';
import { resolveAliasImport } from './aliasImportResolution';
import { resolveBareImport } from './bareImportResolution';
import { resolveRelativeImport } from './relativeImportResolution';
import { resolveRootDirAliasImport } from './rootDirAliasImportResolution';

/**
 * Resolve the target path from an import specifier.
 *
 * Resolution order for `@`-prefixed specifiers (or custom `rootDirAlias`):
 *  1. Try boundary alias (`@entities/army` → entities boundary)
 *  2. If unmatched, try root-dir alias (`@/domain/entities` → `src/domain/entities`)
 *  3. Otherwise return empty (treat as external)
 */
export function resolveTargetPath(
  rawSpec: string,
  fileDir: string,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  barrelFileName: string = DEFAULTS.barrelFileName,
  fileExtensions: string[] = [...DEFAULTS.fileExtensions],
  rootDirAlias: string = DEFAULTS.rootDirAlias,
): { targetAbs: string; targetDir: string } {
  // Enter the alias-form branch when the specifier could be either:
  //   - a boundary alias (conventionally `@`-prefixed), or
  //   - a root-dir alias of the form `<rootDirAlias>` or `<rootDirAlias>/<sub>`.
  //
  // We deliberately match the root-dir alias *exactly* (or with a trailing `/`)
  // so that an unconventional value like `rootDirAlias: 'foo'` does not capture
  // unrelated bare imports such as `foobar`.
  const matchesRootDirAlias =
    !!rootDirAlias &&
    (rawSpec === rootDirAlias || rawSpec.startsWith(`${rootDirAlias}/`));

  if (rawSpec.startsWith('@') || matchesRootDirAlias) {
    // 1. Boundary aliases take priority
    const aliasResult = resolveAliasImport(
      rawSpec,
      boundaries,
      barrelFileName,
      fileExtensions,
    );
    if (aliasResult.targetAbs || aliasResult.targetDir) {
      return aliasResult;
    }

    // 2. Fall through to root-dir alias (e.g. @/ or ~/)
    const rootAliasResult = resolveRootDirAliasImport(
      rawSpec,
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    if (rootAliasResult.targetAbs || rootAliasResult.targetDir) {
      return rootAliasResult;
    }

    // 3. No match — treat as external package
    return aliasResult;
  } else if (rawSpec.startsWith('.')) {
    return resolveRelativeImport(
      rawSpec,
      fileDir,
      barrelFileName,
      fileExtensions,
    );
  } else if (rawSpec === rootDir || rawSpec.startsWith(`${rootDir}/`)) {
    return resolveAbsoluteImport(rawSpec, cwd, barrelFileName, fileExtensions);
  } else {
    return resolveBareImport(
      rawSpec,
      boundaries,
      barrelFileName,
      fileExtensions,
    );
  }
}

// Re-export for backward compatibility
export { resolveAbsoluteImport } from './absoluteImportResolution';
export { resolveAliasImport } from './aliasImportResolution';
export { resolveBareImport } from './bareImportResolution';
export { extractBareImportSubpath } from './bareImportSubpathExtraction';
export { findMatchingBoundary } from './boundaryMatching';
export { resolveRelativeImport } from './relativeImportResolution';
