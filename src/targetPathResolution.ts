/**
 * Target path resolution from import specifiers.
 * Handles alias, relative, absolute, and bare imports.
 */

import type { Boundary } from './types';
import path from 'node:path';
import { hasExtension } from './pathUtils';

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

/**
 * Resolve relative import (e.g., ./file, ../parent).
 */
export function resolveRelativeImport(
  rawSpec: string,
  fileDir: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  if (!hasExtension(rawSpec, fileExtensions)) {
    const basename = path.basename(rawSpec);

    // Special case: ./index or ./barrelFileName refers to same directory's index file
    // (ancestor barrel - forbidden)
    if (basename === barrelFileName) {
      const resolvedPath = path.resolve(fileDir, rawSpec);
      const normalizedSpec = path.normalize(rawSpec);
      if (
        normalizedSpec === `./${barrelFileName}` ||
        normalizedSpec === barrelFileName
      ) {
        // Same directory's index file (ancestor barrel)
        const targetDir = fileDir;
        const targetAbs = path.join(
          fileDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        return { targetAbs, targetDir };
      } else {
        // Directory - assume barrel file
        const targetDir = resolvedPath;
        const targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        return { targetAbs, targetDir };
      }
    } else {
      // Directory - assume barrel file
      const resolvedPath = path.resolve(fileDir, rawSpec);
      const targetDir = resolvedPath;
      const targetAbs = path.join(
        targetDir,
        `${barrelFileName}${fileExtensions[0]}`,
      );
      return { targetAbs, targetDir };
    }
  } else {
    // File with extension
    const targetAbs = path.resolve(fileDir, rawSpec);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  }
}

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

/**
 * Find matching boundary for bare import (e.g., entities/army).
 */
export function findMatchingBoundary(
  rawSpec: string,
  boundaries: Boundary[],
): Boundary | null {
  return (
    boundaries.find((b) => {
      // Check if import starts with boundary dir (e.g., 'domain/entities/army' matches 'domain/entities')
      if (rawSpec === b.dir || rawSpec.startsWith(`${b.dir}/`)) {
        return true;
      }
      // Check if import matches a suffix of boundary dir (e.g., 'entities/army' matches 'domain/entities')
      // This handles path mappings like 'entities' -> 'src/domain/entities'
      const boundaryParts = b.dir.split('/');
      const importParts = rawSpec.split('/');
      // Check if import starts with the last segment(s) of boundary dir
      if (importParts.length > 0 && boundaryParts.length > 0) {
        // Try matching from the end of boundary dir
        for (let i = boundaryParts.length - 1; i >= 0; i--) {
          const boundarySuffix = boundaryParts.slice(i).join('/');
          if (
            rawSpec === boundarySuffix ||
            rawSpec.startsWith(`${boundarySuffix}/`)
          ) {
            return true;
          }
        }
      }
      return false;
    }) || null
  );
}

/**
 * Extract subpath from bare import relative to matching boundary.
 */
export function extractBareImportSubpath(
  rawSpec: string,
  matchingBoundary: Boundary,
): string {
  if (rawSpec === matchingBoundary.dir) {
    return '';
  } else if (rawSpec.startsWith(`${matchingBoundary.dir}/`)) {
    return rawSpec.slice(matchingBoundary.dir.length + 1);
  } else {
    // Find the matching suffix and get the subpath
    const boundaryParts = matchingBoundary.dir.split('/');
    for (let i = boundaryParts.length - 1; i >= 0; i--) {
      const boundarySuffix = boundaryParts.slice(i).join('/');
      if (rawSpec.startsWith(`${boundarySuffix}/`)) {
        return rawSpec.slice(boundarySuffix.length + 1);
      } else if (rawSpec === boundarySuffix) {
        return '';
      }
    }
    return '';
  }
}

/**
 * Resolve bare import (e.g., entities/army) that matches a boundary.
 */
export function resolveBareImport(
  rawSpec: string,
  boundaries: Boundary[],
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  const matchingBoundary = findMatchingBoundary(rawSpec, boundaries);
  if (!matchingBoundary) {
    // Doesn't match any boundary - external package
    return { targetAbs: '', targetDir: '' };
  }

  const subpath = extractBareImportSubpath(rawSpec, matchingBoundary);

  if (subpath && !hasExtension(subpath, fileExtensions)) {
    // Directory - assume barrel file
    const targetDir = path.resolve(matchingBoundary.absDir, subpath);
    const targetAbs = path.join(
      targetDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir };
  } else if (subpath) {
    // File with extension
    const targetAbs = path.resolve(matchingBoundary.absDir, subpath);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  } else {
    // Just boundary dir (no subpath) - ancestor barrel
    const targetAbs = path.join(
      matchingBoundary.absDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir: matchingBoundary.absDir };
  }
}

/**
 * Resolve the target path from an import specifier.
 */
export function resolveTargetPath(
  rawSpec: string,
  fileDir: string,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  barrelFileName: string = 'index',
  fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
): { targetAbs: string; targetDir: string } {
  if (rawSpec.startsWith('@')) {
    return resolveAliasImport(
      rawSpec,
      boundaries,
      barrelFileName,
      fileExtensions,
    );
  } else if (rawSpec.startsWith('.')) {
    return resolveRelativeImport(
      rawSpec,
      fileDir,
      barrelFileName,
      fileExtensions,
    );
  } else if (rawSpec.startsWith(rootDir)) {
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

