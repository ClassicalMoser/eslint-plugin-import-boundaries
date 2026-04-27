/**
 * Root-dir alias import resolution (e.g. `@/foo` → `<cwd>/<rootDir>/foo`).
 *
 * Many TypeScript projects configure a path alias that maps a single symbol
 * to the source root, e.g. `"@/*": ["./src/*"]` in tsconfig or a bundler
 * alias like `{ '@': resolve('src') }`.  The alias character itself is
 * configurable (`rootDirAlias`); the default is `'@'`.
 *
 * Valid npm scoped packages must have a non-empty scope (`@scope/name`), so
 * the shape `<alias>/...` (where the alias ends immediately before the slash)
 * is safe to reserve for filesystem resolution and cannot collide with any
 * real registry package.
 */

import path from 'node:path';
import { getBarrelPath } from '@domain/path';
import { resolveTarget } from './resolveTarget';

/**
 * Resolve a root-dir alias specifier to its target absolute path and directory.
 *
 * Recognised forms (where `alias` = rootDirAlias, e.g. `'@'`):
 *  - `<alias>`         → barrel file of the root directory itself
 *  - `<alias>/<sub>`   → `resolveTarget` under `path.join(cwd, rootDir)`
 *
 * Any other specifier returns empty strings so callers can fall through to
 * the next resolution strategy.
 *
 * @param rawSpec        - Import specifier from source code
 * @param cwd            - Current working directory (project root)
 * @param rootDir        - Configured root directory (e.g. `'src'`)
 * @param rootDirAlias   - The alias prefix to recognise (e.g. `'@'` or `'~'`)
 * @param barrelFileName - Barrel file name (typically `'index'`)
 * @param fileExtensions - File extensions to try when no extension present
 */
export function resolveRootDirAliasImport(
  rawSpec: string,
  cwd: string,
  rootDir: string,
  rootDirAlias: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  if (!rootDirAlias) {
    return { targetAbs: '', targetDir: '' };
  }

  const prefix = `${rootDirAlias}/`;
  const isSubpath = rawSpec.startsWith(prefix);
  const isBareAlias = rawSpec === rootDirAlias;

  if (!isSubpath && !isBareAlias) {
    return { targetAbs: '', targetDir: '' };
  }

  const baseDir = path.join(cwd, rootDir);

  if (isBareAlias) {
    return {
      targetAbs: getBarrelPath(baseDir, barrelFileName, fileExtensions),
      targetDir: baseDir,
    };
  }

  const subpath = rawSpec.slice(prefix.length);
  return resolveTarget(baseDir, subpath, barrelFileName, fileExtensions);
}
