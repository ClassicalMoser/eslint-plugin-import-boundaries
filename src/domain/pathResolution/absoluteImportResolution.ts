/**
 * Absolute import resolution (e.g., src/domain/entities).
 */

import path from 'node:path';
import { hasExtension } from '@domain/path';

/**
 * Resolve absolute import (e.g., src/domain/entities).
 */
export function resolveAbsoluteImport(
  rawSpec: string,
  cwd: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  if (!hasExtension(rawSpec, fileExtensions)) {
    // Directory - assume barrel file
    const targetDir = path.resolve(cwd, rawSpec);
    const targetAbs = path.join(
      targetDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir };
  } else {
    // File with extension
    const targetAbs = path.resolve(cwd, rawSpec);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  }
}
