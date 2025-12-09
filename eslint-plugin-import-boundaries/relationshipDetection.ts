/**
 * Simplified import path calculation.
 * Algorithm:
 * 1. Resolve both file and target to boundary-relative paths (as arrays)
 * 2. Compare arrays to find first differing segment
 * 3. Determine correct import path based on relationship
 */

import type { Boundary } from "./types";
import path from "node:path";
import { resolveToBoundary } from "./boundaryDetection";
import { getBasenameWithoutExt, hasExtension } from "./pathUtils";

/**
 * Resolve the target path from an import specifier.
 */
export function resolveTargetPath(
  rawSpec: string,
  fileDir: string,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  barrelFileName: string = "index",
  fileExtensions: string[] = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]
): { targetAbs: string; targetDir: string } {
  let targetAbs: string;
  let targetDir: string;

  if (rawSpec.startsWith("@")) {
    // Alias import - resolve via boundary
    const boundary = boundaries.find(
      (b) =>
        b.alias && (rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`))
    );
    if (boundary && boundary.alias) {
      const subpath = rawSpec.slice(boundary.alias.length + 1); // Remove '@boundary/'
      if (subpath && !hasExtension(subpath, fileExtensions)) {
        // Directory - assume barrel file
        targetDir = path.resolve(boundary.absDir, subpath);
        // Try to find the barrel file with any of the configured extensions
        // For now, use the first extension (will be resolved by module resolver)
        targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`
        );
      } else if (subpath) {
        targetAbs = path.resolve(boundary.absDir, subpath);
        targetDir = path.dirname(targetAbs);
      } else {
        // Just @boundary (no subpath) - ancestor barrel
        targetAbs = path.join(
          boundary.absDir,
          `${barrelFileName}${fileExtensions[0]}`
        );
        targetDir = boundary.absDir;
      }
    } else {
      targetAbs = "";
      targetDir = "";
    }
  } else if (rawSpec.startsWith(".")) {
    // Relative import
    if (!hasExtension(rawSpec, fileExtensions)) {
      targetDir = path.resolve(fileDir, rawSpec);
      targetAbs = path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`);
    } else {
      targetAbs = path.resolve(fileDir, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  } else if (rawSpec.startsWith(rootDir)) {
    // Absolute path
    if (!hasExtension(rawSpec, fileExtensions)) {
      targetDir = path.resolve(cwd, rawSpec);
      targetAbs = path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`);
    } else {
      targetAbs = path.resolve(cwd, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  } else {
    // Bare import - try to match against boundary directory paths
    // e.g., 'entities/army' could match boundary dir 'domain/entities'
    // or 'domain/entities/army' could match boundary dir 'domain/entities'
    const matchingBoundary = boundaries.find((b) => {
      // Check if import starts with boundary dir (e.g., 'domain/entities/army' matches 'domain/entities')
      if (rawSpec === b.dir || rawSpec.startsWith(`${b.dir}/`)) {
        return true;
      }
      // Check if import matches a suffix of boundary dir (e.g., 'entities/army' matches 'domain/entities')
      // This handles path mappings like 'entities' -> 'src/domain/entities'
      const boundaryParts = b.dir.split("/");
      const importParts = rawSpec.split("/");
      // Check if import starts with the last segment(s) of boundary dir
      if (importParts.length > 0 && boundaryParts.length > 0) {
        // Try matching from the end of boundary dir
        for (let i = boundaryParts.length - 1; i >= 0; i--) {
          const boundarySuffix = boundaryParts.slice(i).join("/");
          if (
            rawSpec === boundarySuffix ||
            rawSpec.startsWith(`${boundarySuffix}/`)
          ) {
            return true;
          }
        }
      }
      return false;
    });

    if (matchingBoundary) {
      // Resolve the subpath within the boundary
      let subpath = "";
      if (rawSpec === matchingBoundary.dir) {
        subpath = "";
      } else if (rawSpec.startsWith(`${matchingBoundary.dir}/`)) {
        subpath = rawSpec.slice(matchingBoundary.dir.length + 1);
      } else {
        // Find the matching suffix and get the subpath
        const boundaryParts = matchingBoundary.dir.split("/");
        for (let i = boundaryParts.length - 1; i >= 0; i--) {
          const boundarySuffix = boundaryParts.slice(i).join("/");
          if (rawSpec.startsWith(`${boundarySuffix}/`)) {
            subpath = rawSpec.slice(boundarySuffix.length + 1);
            break;
          } else if (rawSpec === boundarySuffix) {
            subpath = "";
            break;
          }
        }
      }

      if (subpath && !hasExtension(subpath, fileExtensions)) {
        // Directory - assume barrel file
        targetDir = path.resolve(matchingBoundary.absDir, subpath);
        targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`
        );
      } else if (subpath) {
        targetAbs = path.resolve(matchingBoundary.absDir, subpath);
        targetDir = path.dirname(targetAbs);
      } else {
        // Just boundary dir (no subpath) - ancestor barrel
        targetAbs = path.join(
          matchingBoundary.absDir,
          `${barrelFileName}${fileExtensions[0]}`
        );
        targetDir = matchingBoundary.absDir;
      }
    } else {
      // Doesn't match any boundary - external package
      targetAbs = "";
      targetDir = "";
    }
  }

  return { targetAbs, targetDir };
}

/**
 * Calculate the correct import path using the simplified algorithm.
 */
export function calculateCorrectImportPath(
  rawSpec: string,
  fileDir: string,
  fileBoundary: Boundary | null,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  crossBoundaryStyle: "alias" | "absolute" = "alias",
  barrelFileName: string = "index",
  fileExtensions: string[] = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]
): string | null {
  // Resolve target path
  const { targetAbs, targetDir } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
    barrelFileName,
    fileExtensions
  );

  // Resolve target to nearest boundary (even if it has no rules)
  // Target boundaries should be returned as-is for path calculation
  const targetBoundary = resolveToBoundary(targetAbs, boundaries);

  // 1. Cross-boundary: use @boundary (no subpath) or absolute path
  if (!fileBoundary || targetBoundary !== fileBoundary) {
    if (targetBoundary) {
      if (crossBoundaryStyle === "absolute") {
        // Use absolute path relative to rootDir (e.g., 'src/domain/entities')
        return path.join(rootDir, targetBoundary.dir).replace(/\\/g, "/");
      }
      // Alias style requires alias to be present
      if (!targetBoundary.alias) {
        // This shouldn't happen if validation is correct, but handle gracefully
        return path.join(rootDir, targetBoundary.dir).replace(/\\/g, "/");
      }
      return targetBoundary.alias;
    }
    // Target is outside all boundaries - return special marker
    return "UNKNOWN_BOUNDARY";
  }

  // 2. Ancestor barrel: forbidden
  // Check based on crossBoundaryStyle
  if (crossBoundaryStyle === "alias") {
    if (fileBoundary.alias && rawSpec === fileBoundary.alias) {
      return null; // Handled separately (not fixable)
    }
  } else {
    // Absolute style: check if rawSpec matches the absolute path to boundary root
    const boundaryAbsPath = path
      .join(rootDir, fileBoundary.dir)
      .replace(/\\/g, "/");
    if (rawSpec === boundaryAbsPath || rawSpec === `${boundaryAbsPath}/`) {
      return null; // Handled separately (not fixable)
    }
  }

  // 3. Same boundary: resolve both to boundary-relative paths (as arrays)
  const targetRelativeToBoundary = path.relative(
    fileBoundary.absDir,
    targetDir
  );
  const fileRelativeToBoundary = path.relative(fileBoundary.absDir, fileDir);

  // Convert to arrays for easy comparison
  // Normalize: empty string or '.' means boundary root (empty array)
  const targetParts =
    targetRelativeToBoundary === "" || targetRelativeToBoundary === "."
      ? []
      : targetRelativeToBoundary.split(path.sep).filter((p) => p && p !== ".");
  const fileParts =
    fileRelativeToBoundary === "" || fileRelativeToBoundary === "."
      ? []
      : fileRelativeToBoundary.split(path.sep).filter((p) => p && p !== ".");

  // Handle boundary root file (target is at boundary root)
  if (targetParts.length === 0) {
    const targetBasename = getBasenameWithoutExt(targetAbs);
    if (targetBasename !== barrelFileName) {
      // Use alias if available, otherwise use absolute path
      if (fileBoundary.alias) {
        return `${fileBoundary.alias}/${targetBasename}`;
      }
      // Absolute style: use absolute path
      return path
        .join(rootDir, fileBoundary.dir, targetBasename)
        .replace(/\\/g, "/");
    }
    return null; // Ancestor barrel
  }

  // Find first differing segment using array comparison
  let firstDifferingIndex = 0;
  while (
    firstDifferingIndex < targetParts.length &&
    firstDifferingIndex < fileParts.length &&
    targetParts[firstDifferingIndex] === fileParts[firstDifferingIndex]
  ) {
    firstDifferingIndex++;
  }

  // Same directory: both paths exhausted, filename is the differing segment
  if (
    firstDifferingIndex >= targetParts.length &&
    firstDifferingIndex >= fileParts.length
  ) {
    const targetBasename = getBasenameWithoutExt(targetAbs);
    if (targetBasename !== barrelFileName) {
      return `./${targetBasename}`;
    }
    return null; // Ancestor barrel (barrel file in same directory)
  }

  // Get first differing segment (only - we assume barrel files)
  const firstDifferingSegment = targetParts[firstDifferingIndex];
  if (!firstDifferingSegment) {
    return null;
  }

  // If first differing segment is at fileParts.length, it's in our directory (subdirectory)
  if (firstDifferingIndex === fileParts.length) {
    // Directory in our directory - use first differing segment only (barrel file)
    return `./${firstDifferingSegment}`;
  }

  // If first differing segment is at fileParts.length - 1, it's in our parent's directory (cousin)
  if (firstDifferingIndex === fileParts.length - 1) {
    const isTopLevel = firstDifferingIndex === 0;
    if (!isTopLevel) {
      // Cousin (parent's sibling, non-top-level) → ../segment (barrel file)
      return `../${firstDifferingSegment}`;
    }
    // Top-level → @boundary/segment (prefer alias even if ../ would work)
  }

  // Otherwise: top-level or requires >1 ../ → @boundary/segment (first differing segment only)
  // Use alias if available, otherwise use absolute path
  if (fileBoundary.alias) {
    return `${fileBoundary.alias}/${firstDifferingSegment}`;
  }
  // Absolute style: use absolute path
  return path
    .join(rootDir, fileBoundary.dir, firstDifferingSegment)
    .replace(/\\/g, "/");
}
