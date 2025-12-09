import path from "node:path";
import process from "node:process";

//#region eslint-plugin-import-boundaries/pathUtils.ts
/**
 * Path utility functions for the boundary-alias-vs-relative ESLint rule.
 * Pure path math - no file I/O.
 */
/**
 * Check if a path is inside a directory.
 * Uses path.relative() which is more reliable than string comparison.
 *
 * @param absDir - Absolute directory path
 * @param absPath - Absolute file or directory path to check
 * @returns true if absPath is inside absDir (or is absDir itself)
 *
 * Examples:
 * - isInsideDir('/a/b', '/a/b/file.ts') => true
 * - isInsideDir('/a/b', '/a/b/c/file.ts') => true
 * - isInsideDir('/a/b', '/a/file.ts') => false (../file.ts)
 * - isInsideDir('/a/b', '/a/b') => true (empty relative path)
 */
function isInsideDir(absDir, absPath) {
  const rel = path.relative(absDir, absPath);
  if (rel === "") return true;
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}
/**
 * Check if a path has a file extension.
 * Extension-agnostic - checks for any extension, not just specific ones.
 *
 * @param filePath - Path to check
 * @param extensions - Optional list of extensions to check for (if provided, only matches these)
 * @returns true if path has an extension
 *
 * Examples:
 * - hasExtension('file.ts') => true
 * - hasExtension('file.tsx') => true
 * - hasExtension('file.js') => true
 * - hasExtension('dir') => false
 * - hasExtension('dir/file') => false
 */
function hasExtension(filePath, extensions) {
  const ext = path.extname(filePath);
  if (!ext) return false;
  if (extensions) return extensions.includes(ext);
  return true;
}
/**
 * Get the basename without extension from a file path.
 * Extension-agnostic - strips any extension.
 *
 * @param filePath - File path
 * @returns Basename without extension
 *
 * Examples:
 * - getBasenameWithoutExt('/a/b/file.ts') => 'file'
 * - getBasenameWithoutExt('/a/b/file.tsx') => 'file'
 * - getBasenameWithoutExt('/a/b/file.js') => 'file'
 * - getBasenameWithoutExt('/a/b/index.ts') => 'index'
 */
function getBasenameWithoutExt(filePath) {
  const basename = path.basename(filePath);
  const ext = path.extname(basename);
  return ext ? basename.slice(0, -ext.length) : basename;
}

//#endregion
//#region eslint-plugin-import-boundaries/boundaryDetection.ts
/**
 * Check if an import specifier is using an alias subpath (e.g., '@entities/army').
 * Subpaths should be converted to the base alias (e.g., '@entities').
 *
 * @param spec - Import specifier to check
 * @param boundaries - Array of resolved boundaries
 * @returns Object indicating if it's a subpath and which base alias it uses
 *
 * Examples:
 * - checkAliasSubpath('@entities/army', boundaries) => { isSubpath: true, baseAlias: '@entities' }
 * - checkAliasSubpath('@entities', boundaries) => { isSubpath: false }
 */
function checkAliasSubpath(spec, boundaries) {
  for (const b of boundaries)
    if (b.alias && spec.startsWith(`${b.alias}/`))
      return {
        isSubpath: true,
        baseAlias: b.alias,
      };
  return { isSubpath: false };
}
/**
 * Resolve a file to the nearest boundary that has rules specified.
 * If no boundaries with rules are found, returns null.
 *
 * @param filename - Absolute filename
 * @param boundaries - Array of all boundaries
 * @returns The nearest boundary with rules, or null if none found
 */
function resolveToSpecifiedBoundary(filename, boundaries) {
  const specifiedBoundaries = boundaries
    .filter((b) => isInsideDir(b.absDir, filename))
    .filter(
      (b) =>
        b.allowImportsFrom !== void 0 ||
        b.denyImportsFrom !== void 0 ||
        b.allowTypeImportsFrom !== void 0,
    );
  if (specifiedBoundaries.length > 0)
    return specifiedBoundaries.sort(
      (a, b) => b.absDir.length - a.absDir.length,
    )[0];
  const ancestors = boundaries
    .filter(
      (b) =>
        b.allowImportsFrom !== void 0 ||
        b.denyImportsFrom !== void 0 ||
        b.allowTypeImportsFrom !== void 0,
    )
    .filter((b) => isInsideDir(b.absDir, filename));
  if (ancestors.length > 0)
    return ancestors.sort((a, b) => b.absDir.length - a.absDir.length)[0];
  return null;
}
/**
 * Get metadata about the current file being linted.
 * Results are cached per file to avoid recomputation.
 *
 * @param filename - Absolute filename from ESLint context
 * @param boundaries - Array of resolved boundaries
 * @returns FileData with directory and boundary information, or { isValid: false } if file path is invalid
 */
function getFileData(filename, boundaries) {
  if (!path.isAbsolute(filename)) return { isValid: false };
  return {
    isValid: true,
    fileDir: path.dirname(filename),
    fileBoundary: resolveToSpecifiedBoundary(filename, boundaries),
  };
}

//#endregion
//#region eslint-plugin-import-boundaries/boundaryRules.ts
/**
 * Get the identifier for a boundary (alias if present, otherwise dir).
 * Used for allow/deny rules and error messages.
 */
function getBoundaryIdentifier(boundary) {
  return boundary.alias ?? boundary.dir;
}
/**
 * Check if a boundary identifier matches a target boundary.
 * Matches by alias (if present) or by dir path.
 */
function matchesBoundaryIdentifier(identifier, targetBoundary) {
  if (targetBoundary.alias && identifier === targetBoundary.alias) return true;
  return identifier === targetBoundary.dir;
}
/**
 * Check if an import from fileBoundary to targetBoundary is allowed.
 * Returns violation info if not allowed, null if allowed.
 *
 * Semantics:
 * - If both allowImportsFrom and denyImportsFrom are specified, they work as:
 *   - allowImportsFrom: explicit allow list (overrides deny for those items)
 *   - denyImportsFrom: explicit deny list (overrides default allow for those items)
 * - If only allowImportsFrom: only those boundaries are allowed (deny-all by default)
 * - If only denyImportsFrom: all boundaries allowed except those (allow-all by default)
 * - If neither: deny-all by default (strictest)
 * - allowTypeImportsFrom: For type-only imports, this overrides allowImportsFrom (allows types from more boundaries)
 */
function checkBoundaryRules(
  fileBoundary,
  targetBoundary,
  allBoundaries,
  isTypeOnly = false,
) {
  if (fileBoundary === targetBoundary) return null;
  const fileIdentifier = getBoundaryIdentifier(fileBoundary);
  const targetIdentifier = getBoundaryIdentifier(targetBoundary);
  if (
    isTypeOnly &&
    fileBoundary.allowTypeImportsFrom?.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  )
    return null;
  const hasAllowList =
    fileBoundary.allowImportsFrom && fileBoundary.allowImportsFrom.length > 0;
  const hasDenyList =
    fileBoundary.denyImportsFrom && fileBoundary.denyImportsFrom.length > 0;
  if (
    hasAllowList &&
    fileBoundary.allowImportsFrom.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  )
    return null;
  if (
    hasDenyList &&
    fileBoundary.denyImportsFrom.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  )
    return {
      reason: `Boundary '${fileIdentifier}' explicitly denies imports from '${targetIdentifier}'`,
    };
  if (hasAllowList && !hasDenyList)
    return {
      reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.`,
    };
  if (hasDenyList && !hasAllowList) return null;
  return {
    reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.`,
  };
}

//#endregion
//#region eslint-plugin-import-boundaries/fixer.ts
/**
 * Create a fixer function to replace an import path.
 * Handles different import node types: ImportDeclaration, ImportExpression, require().
 *
 * @param node - AST node for the import
 * @param newPath - New import path to use
 * @returns Fixer function, or null if node type is unsupported
 */
function createFixer(node, newPath) {
  return (fixer) => {
    if ("source" in node && node.source)
      return fixer.replaceText(node.source, `'${newPath}'`);
    if (
      "arguments" in node &&
      Array.isArray(node.arguments) &&
      node.arguments[0]
    )
      return fixer.replaceText(node.arguments[0], `'${newPath}'`);
    return null;
  };
}

//#endregion
//#region eslint-plugin-import-boundaries/relationshipDetection.ts
/**
 * Resolve the target path from an import specifier.
 */
function resolveTargetPath(
  rawSpec,
  fileDir,
  boundaries,
  rootDir,
  cwd,
  barrelFileName = "index",
  fileExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
) {
  let targetAbs;
  let targetDir;
  if (rawSpec.startsWith("@")) {
    const boundary = boundaries.find(
      (b) =>
        b.alias && (rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`)),
    );
    if (boundary && boundary.alias) {
      const subpath = rawSpec.slice(boundary.alias.length + 1);
      if (subpath && !hasExtension(subpath, fileExtensions)) {
        targetDir = path.resolve(boundary.absDir, subpath);
        targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
      } else if (subpath) {
        targetAbs = path.resolve(boundary.absDir, subpath);
        targetDir = path.dirname(targetAbs);
      } else {
        targetAbs = path.join(
          boundary.absDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        targetDir = boundary.absDir;
      }
    } else {
      targetAbs = "";
      targetDir = "";
    }
  } else if (rawSpec.startsWith("."))
    if (!hasExtension(rawSpec, fileExtensions)) {
      targetDir = path.resolve(fileDir, rawSpec);
      targetAbs = path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`);
    } else {
      targetAbs = path.resolve(fileDir, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  else if (rawSpec.startsWith(rootDir))
    if (!hasExtension(rawSpec, fileExtensions)) {
      targetDir = path.resolve(cwd, rawSpec);
      targetAbs = path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`);
    } else {
      targetAbs = path.resolve(cwd, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  else {
    const matchingBoundary = boundaries.find((b) => {
      if (rawSpec === b.dir || rawSpec.startsWith(`${b.dir}/`)) return true;
      const boundaryParts = b.dir.split("/");
      if (rawSpec.split("/").length > 0 && boundaryParts.length > 0)
        for (let i = boundaryParts.length - 1; i >= 0; i--) {
          const boundarySuffix = boundaryParts.slice(i).join("/");
          if (
            rawSpec === boundarySuffix ||
            rawSpec.startsWith(`${boundarySuffix}/`)
          )
            return true;
        }
      return false;
    });
    if (matchingBoundary) {
      let subpath = "";
      if (rawSpec === matchingBoundary.dir) subpath = "";
      else if (rawSpec.startsWith(`${matchingBoundary.dir}/`))
        subpath = rawSpec.slice(matchingBoundary.dir.length + 1);
      else {
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
        targetDir = path.resolve(matchingBoundary.absDir, subpath);
        targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
      } else if (subpath) {
        targetAbs = path.resolve(matchingBoundary.absDir, subpath);
        targetDir = path.dirname(targetAbs);
      } else {
        targetAbs = path.join(
          matchingBoundary.absDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        targetDir = matchingBoundary.absDir;
      }
    } else {
      targetAbs = "";
      targetDir = "";
    }
  }
  return {
    targetAbs,
    targetDir,
  };
}
/**
 * Calculate the correct import path using the simplified algorithm.
 */
function calculateCorrectImportPath(
  rawSpec,
  fileDir,
  fileBoundary,
  boundaries,
  rootDir,
  cwd,
  crossBoundaryStyle = "alias",
  barrelFileName = "index",
  fileExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
) {
  const { targetAbs, targetDir } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
    barrelFileName,
    fileExtensions,
  );
  const targetBoundary = resolveToSpecifiedBoundary(targetAbs, boundaries);
  if (!fileBoundary || targetBoundary !== fileBoundary) {
    if (targetBoundary) {
      if (crossBoundaryStyle === "absolute")
        return path.join(rootDir, targetBoundary.dir).replace(/\\/g, "/");
      if (!targetBoundary.alias)
        return path.join(rootDir, targetBoundary.dir).replace(/\\/g, "/");
      return targetBoundary.alias;
    }
    return "UNKNOWN_BOUNDARY";
  }
  if (crossBoundaryStyle === "alias") {
    if (fileBoundary.alias && rawSpec === fileBoundary.alias) return null;
  } else {
    const boundaryAbsPath = path
      .join(rootDir, fileBoundary.dir)
      .replace(/\\/g, "/");
    if (rawSpec === boundaryAbsPath || rawSpec === `${boundaryAbsPath}/`)
      return null;
  }
  const targetRelativeToBoundary = path.relative(
    fileBoundary.absDir,
    targetDir,
  );
  const fileRelativeToBoundary = path.relative(fileBoundary.absDir, fileDir);
  const targetParts =
    targetRelativeToBoundary === "" || targetRelativeToBoundary === "."
      ? []
      : targetRelativeToBoundary.split(path.sep).filter((p) => p && p !== ".");
  const fileParts =
    fileRelativeToBoundary === "" || fileRelativeToBoundary === "."
      ? []
      : fileRelativeToBoundary.split(path.sep).filter((p) => p && p !== ".");
  if (targetParts.length === 0) {
    const targetBasename = getBasenameWithoutExt(targetAbs);
    if (targetBasename !== barrelFileName) {
      if (fileBoundary.alias) return `${fileBoundary.alias}/${targetBasename}`;
      return path
        .join(rootDir, fileBoundary.dir, targetBasename)
        .replace(/\\/g, "/");
    }
    return null;
  }
  let firstDifferingIndex = 0;
  while (
    firstDifferingIndex < targetParts.length &&
    firstDifferingIndex < fileParts.length &&
    targetParts[firstDifferingIndex] === fileParts[firstDifferingIndex]
  )
    firstDifferingIndex++;
  if (
    firstDifferingIndex >= targetParts.length &&
    firstDifferingIndex >= fileParts.length
  ) {
    const targetBasename = getBasenameWithoutExt(targetAbs);
    if (targetBasename !== barrelFileName) return `./${targetBasename}`;
    return null;
  }
  const firstDifferingSegment = targetParts[firstDifferingIndex];
  if (!firstDifferingSegment) return null;
  if (firstDifferingIndex === fileParts.length)
    return `./${firstDifferingSegment}`;
  if (firstDifferingIndex === fileParts.length - 1) {
    if (!(firstDifferingIndex === 0)) return `../${firstDifferingSegment}`;
  }
  if (fileBoundary.alias)
    return `${fileBoundary.alias}/${firstDifferingSegment}`;
  return path
    .join(rootDir, fileBoundary.dir, firstDifferingSegment)
    .replace(/\\/g, "/");
}

//#endregion
//#region eslint-plugin-import-boundaries/importHandler.ts
/**
 * Main handler for all import statements.
 * Validates import paths against boundary rules and enforces correct path format.
 *
 * @returns true if a violation was reported, false otherwise
 */
function handleImport(options) {
  const {
    node,
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
    context,
    crossBoundaryStyle = "alias",
    defaultSeverity,
    allowUnknownBoundaries = false,
    isTypeOnly = false,
    skipBoundaryRules = false,
    barrelFileName = "index",
    fileExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
  } = options;
  const { targetAbs } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
    barrelFileName,
    fileExtensions,
  );
  if (!targetAbs) return false;
  if (crossBoundaryStyle === "alias") {
    const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
    if (aliasSubpathCheck.isSubpath) {
      const targetBoundary$1 = boundaries.find(
        (b) => b.alias === aliasSubpathCheck.baseAlias,
      );
      if (
        targetBoundary$1 &&
        targetBoundary$1.alias &&
        fileBoundary &&
        targetBoundary$1 !== fileBoundary
      ) {
        const expectedPath = targetBoundary$1.alias;
        const severity$1 = fileBoundary.severity || defaultSeverity;
        const reportOptions$1 = {
          node,
          messageId: "incorrectImportPath",
          data: {
            expectedPath,
            actualPath: rawSpec,
          },
          fix: createFixer(node, expectedPath),
          ...(severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }),
        };
        context.report(reportOptions$1);
        return true;
      }
    }
  }
  const targetBoundary = resolveToSpecifiedBoundary(targetAbs, boundaries);
  if (
    !skipBoundaryRules &&
    fileBoundary &&
    targetBoundary &&
    fileBoundary !== targetBoundary
  ) {
    const violation = checkBoundaryRules(
      fileBoundary,
      targetBoundary,
      boundaries,
      isTypeOnly,
    );
    if (violation) {
      const severity$1 = fileBoundary.severity || defaultSeverity;
      const reportOptions$1 = {
        node,
        messageId: "boundaryViolation",
        data: {
          from: getBoundaryIdentifier(fileBoundary),
          to: getBoundaryIdentifier(targetBoundary),
          reason: violation.reason,
        },
        ...(severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }),
      };
      context.report(reportOptions$1);
      return true;
    }
  }
  const correctPath = calculateCorrectImportPath(
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
    crossBoundaryStyle,
    barrelFileName,
    fileExtensions,
  );
  if (!correctPath) {
    if (fileBoundary) {
      if (
        crossBoundaryStyle === "alias"
          ? fileBoundary.alias && rawSpec === fileBoundary.alias
          : rawSpec === `${rootDir}/${fileBoundary.dir}`.replace(/\\/g, "/") ||
            rawSpec === `${rootDir}/${fileBoundary.dir}/`.replace(/\\/g, "/")
      ) {
        const severity$1 = fileBoundary.severity || defaultSeverity;
        const reportOptions$1 = {
          node,
          messageId: "ancestorBarrelImport",
          data: { alias: getBoundaryIdentifier(fileBoundary) },
          ...(severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }),
        };
        context.report(reportOptions$1);
        return true;
      }
    }
    return false;
  }
  if (correctPath === "UNKNOWN_BOUNDARY") {
    if (!allowUnknownBoundaries) {
      const reportOptions$1 = {
        node,
        messageId: "unknownBoundaryImport",
        data: { path: rawSpec },
        ...(defaultSeverity && {
          severity: defaultSeverity === "warn" ? 1 : 2,
        }),
      };
      context.report(reportOptions$1);
      return true;
    }
    return false;
  }
  if (rawSpec === correctPath) return false;
  const severity = fileBoundary?.severity || defaultSeverity;
  const reportOptions = {
    node,
    messageId: "incorrectImportPath",
    data: {
      expectedPath: correctPath,
      actualPath: rawSpec,
    },
    fix: createFixer(node, correctPath),
    ...(severity && { severity: severity === "warn" ? 1 : 2 }),
  };
  context.report(reportOptions);
  return true;
}

//#endregion
//#region eslint-plugin-import-boundaries/index.ts
const rule = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Enforces architectural boundaries with deterministic import path rules: cross-boundary uses alias without subpath, siblings use relative, boundary-root and top-level paths use alias, cousins use relative (max one ../).",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          rootDir: { type: "string" },
          boundaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dir: { type: "string" },
                alias: { type: "string" },
                allowImportsFrom: {
                  type: "array",
                  items: { type: "string" },
                },
                denyImportsFrom: {
                  type: "array",
                  items: { type: "string" },
                },
                allowTypeImportsFrom: {
                  type: "array",
                  items: { type: "string" },
                },
                nestedPathFormat: {
                  type: "string",
                  enum: ["alias", "relative", "inherit"],
                },
                severity: {
                  type: "string",
                  enum: ["error", "warn"],
                },
              },
              required: ["dir"],
            },
            minItems: 1,
          },
          crossBoundaryStyle: {
            type: "string",
            enum: ["alias", "absolute"],
            default: "alias",
          },
          defaultSeverity: {
            type: "string",
            enum: ["error", "warn"],
          },
          allowUnknownBoundaries: {
            type: "boolean",
            default: false,
          },
          skipBoundaryRulesForTestFiles: {
            type: "boolean",
            default: true,
          },
          barrelFileName: {
            type: "string",
            default: "index",
          },
          fileExtensions: {
            type: "array",
            items: { type: "string" },
            default: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
          },
        },
        required: ["boundaries"],
      },
    ],
    messages: {
      incorrectImportPath:
        "Expected '{{expectedPath}}' but got '{{actualPath}}'.",
      ancestorBarrelImport:
        "Cannot import from ancestor barrel '{{alias}}'. This would create a circular dependency. Import from the specific file or directory instead.",
      unknownBoundaryImport:
        "Cannot import from '{{path}}' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.",
      boundaryViolation:
        "Cannot import from '{{to}}' to '{{from}}': {{reason}}",
    },
  },
  create(context) {
    if (!context.options || context.options.length === 0)
      throw new Error(
        "boundary-alias-vs-relative requires boundaries configuration",
      );
    const {
      rootDir = "src",
      boundaries,
      crossBoundaryStyle = "alias",
      defaultSeverity,
      allowUnknownBoundaries = false,
      skipBoundaryRulesForTestFiles = true,
      barrelFileName = "index",
      fileExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    } = context.options[0];
    const cwd = context.getCwd?.() ?? process.cwd();
    if (crossBoundaryStyle === "alias") {
      const boundariesWithoutAlias = boundaries.filter((b) => !b.alias);
      if (boundariesWithoutAlias.length > 0) {
        const missingAliases = boundariesWithoutAlias
          .map((b) => b.dir)
          .join(", ");
        throw new Error(
          `When crossBoundaryStyle is 'alias', all boundaries must have an 'alias' property. Missing aliases for: ${missingAliases}`,
        );
      }
    }
    const resolvedBoundaries = boundaries.map((b) => ({
      dir: b.dir,
      alias: b.alias,
      absDir: path.resolve(cwd, rootDir, b.dir),
      allowImportsFrom: b.allowImportsFrom,
      denyImportsFrom: b.denyImportsFrom,
      allowTypeImportsFrom: b.allowTypeImportsFrom,
      nestedPathFormat: b.nestedPathFormat,
      severity: b.severity,
    }));
    let cachedFileData = null;
    /**
     * Get metadata about the current file being linted.
     * Results are cached per file to avoid recomputation.
     *
     * @returns FileData with directory and boundary information, or { isValid: false } if file path is invalid
     */
    function getFileDataCached() {
      if (cachedFileData) return cachedFileData;
      cachedFileData = getFileData(
        context.filename ?? context.getFilename?.() ?? "<unknown>",
        resolvedBoundaries,
      );
      return cachedFileData;
    }
    /**
     * Wrapper function that prepares file data and calls the main import handler.
     *
     * @param node - AST node for the import (ImportDeclaration, ImportExpression, or CallExpression)
     * @param rawSpec - Raw import specifier string (e.g., '@entities', './file', '../parent')
     * @param isTypeOnly - Whether this is a type-only import (TypeScript)
     */
    function handleImportStatement(node, rawSpec, isTypeOnly = false) {
      const fileData = getFileDataCached();
      if (!fileData.isValid) return;
      const { fileDir, fileBoundary } = fileData;
      if (!fileDir) return;
      handleImport({
        node,
        rawSpec,
        fileDir,
        fileBoundary: fileBoundary ?? null,
        boundaries: resolvedBoundaries,
        rootDir,
        cwd,
        context,
        crossBoundaryStyle,
        defaultSeverity,
        allowUnknownBoundaries,
        isTypeOnly,
        skipBoundaryRules: skipBoundaryRulesForTestFiles,
        barrelFileName,
        fileExtensions,
      });
    }
    return {
      Program() {
        cachedFileData = null;
      },
      ImportDeclaration(node) {
        const spec = node.source?.value;
        if (typeof spec === "string")
          handleImportStatement(node, spec, node.importKind === "type");
      },
      ImportExpression(node) {
        const arg = node.source;
        if (arg?.type === "Literal" && typeof arg.value === "string")
          handleImportStatement(node, arg.value, false);
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments.length === 1 &&
          node.arguments[0]?.type === "Literal" &&
          typeof node.arguments[0].value === "string"
        )
          handleImportStatement(node, node.arguments[0].value, false);
      },
      ExportNamedDeclaration(node) {
        const spec = node.source?.value;
        if (typeof spec === "string")
          handleImportStatement(node, spec, node.exportKind === "type");
      },
      ExportAllDeclaration(node) {
        const spec = node.source?.value;
        if (typeof spec === "string")
          handleImportStatement(node, spec, node.exportKind === "type");
      },
    };
  },
};
var eslint_plugin_import_boundaries_default = { rules: { enforce: rule } };

//#endregion
export { eslint_plugin_import_boundaries_default as default };
