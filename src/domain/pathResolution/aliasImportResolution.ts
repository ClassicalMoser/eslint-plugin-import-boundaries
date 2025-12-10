/**
 * Alias import resolution (e.g., @boundary, @boundary/path).
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { hasExtension } from '@domain/path';

/**
 * Resolve alias import (e.g., @boundary, @boundary/path).
 */
export function resolveAliasImport(
  rawSpec: string,
  boundaries: Boundary[],
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  const boundary = boundaries.find(
    (b) =>
      b.alias && (rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`)),
  );
  if (!boundary?.alias) {
    return { targetAbs: '', targetDir: '' };
  }

  const subpath = rawSpec.slice(boundary.alias.length + 1); // Remove '@boundary/'
  if (subpath && !hasExtension(subpath, fileExtensions)) {
    // Directory - assume barrel file
    const targetDir = path.resolve(boundary.absDir, subpath);
    const targetAbs = path.join(
      targetDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir };
  } else if (subpath) {
    // File with extension
    const targetAbs = path.resolve(boundary.absDir, subpath);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  } else {
    // Just @boundary (no subpath) - ancestor barrel
    const targetAbs = path.join(
      boundary.absDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir: boundary.absDir };
  }
}
