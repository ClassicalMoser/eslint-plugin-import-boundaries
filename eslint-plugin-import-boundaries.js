import path from "node:path";
import process from "node:process";

//#region src/pathUtils.ts
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
//#region src/boundaryDetection.ts
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
	for (const b of boundaries) if (b.alias && spec.startsWith(`${b.alias}/`)) return {
		isSubpath: true,
		baseAlias: b.alias
	};
	return { isSubpath: false };
}
/**
* Resolve a file/path to the nearest boundary (regardless of rules).
* Used for target boundaries - returns the boundary if it exists, even without rules.
*
* @param filename - Absolute filename
* @param boundaries - Array of all boundaries
* @returns The nearest boundary, or null if none found
*/
function resolveToBoundary(filename, boundaries) {
	const matchingBoundaries = boundaries.filter((b) => isInsideDir(b.absDir, filename));
	if (matchingBoundaries.length > 0) return matchingBoundaries.sort((a, b) => b.absDir.length - a.absDir.length)[0];
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
		fileBoundary: resolveToBoundary(filename, boundaries)
	};
}

//#endregion
//#region src/ruleContext.ts
/**
* Extract and validate rule options.
*/
function extractRuleOptions(context) {
	if (!context.options || context.options.length === 0) throw new Error("boundary-alias-vs-relative requires boundaries configuration");
	const { rootDir = "src", boundaries, crossBoundaryStyle = "alias", defaultSeverity, allowUnknownBoundaries = false, enforceBoundaries = true, barrelFileName = "index", fileExtensions = [
		".ts",
		".tsx",
		".js",
		".jsx",
		".mjs",
		".cjs"
	] } = context.options[0];
	const cwd = context.getCwd?.() ?? process.cwd();
	if (crossBoundaryStyle === "alias") {
		const boundariesWithoutAlias = boundaries.filter((b) => !b.alias);
		if (boundariesWithoutAlias.length > 0) {
			const missingAliases = boundariesWithoutAlias.map((b) => b.dir).join(", ");
			throw new Error(`When crossBoundaryStyle is 'alias', all boundaries must have an 'alias' property. Missing aliases for: ${missingAliases}`);
		}
	}
	return {
		rootDir,
		boundaries: boundaries.map((b) => ({
			dir: b.dir,
			alias: b.alias,
			absDir: path.resolve(cwd, rootDir, b.dir),
			allowImportsFrom: b.allowImportsFrom,
			denyImportsFrom: b.denyImportsFrom,
			allowTypeImportsFrom: b.allowTypeImportsFrom,
			nestedPathFormat: b.nestedPathFormat,
			severity: b.severity
		})),
		crossBoundaryStyle,
		defaultSeverity,
		allowUnknownBoundaries,
		enforceBoundaries,
		barrelFileName,
		fileExtensions,
		cwd
	};
}
/**
* Create a cached file data getter with cache clearing capability.
*/
function createFileDataGetter(context, boundaries) {
	const cache = { data: null };
	function getFileDataCached() {
		if (cache.data) return cache.data;
		cache.data = getFileData(context.filename ?? context.getFilename?.() ?? "<unknown>", boundaries);
		return cache.data;
	}
	function clearCache() {
		cache.data = null;
	}
	return {
		getFileData: getFileDataCached,
		clearCache
	};
}

//#endregion
//#region src/schemaHelpers.ts
/**
* Common schema property definitions.
*/
const schemaProps = {
	string: { type: "string" },
	boolean: { type: "boolean" },
	stringArray: {
		type: "array",
		items: { type: "string" }
	}
};
/**
* Create a string enum schema property.
*/
function stringEnum(values) {
	return {
		type: "string",
		enum: values
	};
}
/**
* Create a schema property with default value.
*/
function withDefault(property, defaultValue) {
	return {
		...property,
		default: defaultValue
	};
}
/**
* Boundary config schema definition.
*/
const boundaryConfigSchema = {
	type: "object",
	properties: {
		dir: schemaProps.string,
		alias: schemaProps.string,
		allowImportsFrom: schemaProps.stringArray,
		denyImportsFrom: schemaProps.stringArray,
		allowTypeImportsFrom: schemaProps.stringArray,
		nestedPathFormat: stringEnum([
			"alias",
			"relative",
			"inherit"
		]),
		severity: stringEnum(["error", "warn"])
	},
	required: ["dir"]
};
/**
* Rule schema for boundary-alias-vs-relative.
*/
const ruleSchema = [{
	type: "object",
	properties: {
		rootDir: schemaProps.string,
		boundaries: {
			type: "array",
			items: boundaryConfigSchema,
			minItems: 1
		},
		crossBoundaryStyle: withDefault(stringEnum(["alias", "absolute"]), "alias"),
		defaultSeverity: stringEnum(["error", "warn"]),
		allowUnknownBoundaries: withDefault(schemaProps.boolean, false),
		enforceBoundaries: withDefault(schemaProps.boolean, true),
		barrelFileName: withDefault(schemaProps.string, "index"),
		fileExtensions: withDefault(schemaProps.stringArray, [
			".ts",
			".tsx",
			".js",
			".jsx",
			".mjs",
			".cjs"
		])
	},
	required: ["boundaries"]
}];

//#endregion
//#region src/ruleSchema.ts
/**
* Rule messages for boundary-alias-vs-relative.
*/
const ruleMessages = {
	incorrectImportPath: "Expected '{{expectedPath}}' but got '{{actualPath}}'.",
	ancestorBarrelImport: "Cannot import from ancestor barrel '{{alias}}'. This would create a circular dependency. Import from the specific file or directory instead.",
	unknownBoundaryImport: "Cannot import from '{{path}}' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.",
	boundaryViolation: "Cannot import from '{{to}}' to '{{from}}': {{reason}}"
};

//#endregion
//#region src/boundaryRules.ts
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
*   - Both lists apply independently (allow applies to items in allow list, deny applies to items in deny list)
*   - If the same identifier appears in both lists (configuration error), denyImportsFrom takes precedence for safety
* - If only allowImportsFrom: only those boundaries are allowed (deny-all by default)
* - If only denyImportsFrom: all boundaries allowed except those (allow-all by default)
* - If neither: deny-all by default (strictest)
* - allowTypeImportsFrom: For type-only imports, this overrides allowImportsFrom (allows types from more boundaries)
*/
function checkBoundaryRules(fileBoundary, targetBoundary, allBoundaries, isTypeOnly = false) {
	if (fileBoundary === targetBoundary) return null;
	const fileIdentifier = getBoundaryIdentifier(fileBoundary);
	const targetIdentifier = getBoundaryIdentifier(targetBoundary);
	if (isTypeOnly && fileBoundary.allowTypeImportsFrom?.some((id) => matchesBoundaryIdentifier(id, targetBoundary))) return null;
	const hasAllowList = fileBoundary.allowImportsFrom && fileBoundary.allowImportsFrom.length > 0;
	const hasDenyList = fileBoundary.denyImportsFrom && fileBoundary.denyImportsFrom.length > 0;
	if (hasDenyList && fileBoundary.denyImportsFrom.some((id) => matchesBoundaryIdentifier(id, targetBoundary))) return { reason: hasAllowList && fileBoundary.allowImportsFrom.some((id) => matchesBoundaryIdentifier(id, targetBoundary)) ? `Boundary '${fileIdentifier}' explicitly denies imports from '${targetIdentifier}' (deny takes precedence over allow)` : `Boundary '${fileIdentifier}' explicitly denies imports from '${targetIdentifier}'` };
	if (hasAllowList && fileBoundary.allowImportsFrom.some((id) => matchesBoundaryIdentifier(id, targetBoundary))) return null;
	if (hasAllowList && !hasDenyList) return { reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.` };
	if (hasDenyList && !hasAllowList) return null;
	return { reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.` };
}

//#endregion
//#region src/fixer.ts
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
		if ("source" in node && node.source) return fixer.replaceText(node.source, `'${newPath}'`);
		if ("arguments" in node && Array.isArray(node.arguments) && node.arguments[0]) return fixer.replaceText(node.arguments[0], `'${newPath}'`);
		return null;
	};
}

//#endregion
//#region src/pathFormatting.ts
/**
* Format a path as a forward-slash path relative to rootDir.
*/
function formatAbsolutePath(rootDir, ...pathSegments) {
	return path.join(rootDir, ...pathSegments).replace(/\\/g, "/");
}
/**
* Choose between alias and absolute path based on crossBoundaryStyle.
* Returns the appropriate path format for same-boundary imports.
*/
function choosePathFormat(boundary, segment, rootDir, crossBoundaryStyle) {
	if (crossBoundaryStyle === "absolute") return formatAbsolutePath(rootDir, boundary.dir, segment);
	if (boundary.alias) return `${boundary.alias}/${segment}`;
	return formatAbsolutePath(rootDir, boundary.dir, segment);
}

//#endregion
//#region src/importPathCalculation.ts
/**
* Calculate path for cross-boundary imports.
*/
function calculateCrossBoundaryPath(targetBoundary, rootDir, crossBoundaryStyle) {
	if (!targetBoundary) return "UNKNOWN_BOUNDARY";
	if (crossBoundaryStyle === "absolute") return formatAbsolutePath(rootDir, targetBoundary.dir);
	if (!targetBoundary.alias) return formatAbsolutePath(rootDir, targetBoundary.dir);
	return targetBoundary.alias;
}
/**
* Check if import is an ancestor barrel (forbidden).
*/
function checkAncestorBarrel(rawSpec, fileBoundary, rootDir, crossBoundaryStyle) {
	if (crossBoundaryStyle === "alias") return fileBoundary.alias !== null && rawSpec === fileBoundary.alias;
	else {
		const boundaryAbsPath = formatAbsolutePath(rootDir, fileBoundary.dir);
		return rawSpec === boundaryAbsPath || rawSpec === `${boundaryAbsPath}/`;
	}
}
/**
* Convert boundary-relative paths to arrays for comparison.
*/
function pathToParts(relativePath) {
	return relativePath === "" || relativePath === "." ? [] : relativePath.split(path.sep).filter((p) => p && p !== ".");
}
/**
* Find first differing segment between target and file paths.
*/
function findFirstDifferingIndex(targetParts, fileParts) {
	let firstDifferingIndex = 0;
	while (firstDifferingIndex < targetParts.length && firstDifferingIndex < fileParts.length && targetParts[firstDifferingIndex] === fileParts[firstDifferingIndex]) firstDifferingIndex++;
	return firstDifferingIndex;
}
/**
* Calculate path for boundary root file (target at boundary root).
*/
function calculateBoundaryRootPath(targetAbs, fileBoundary, rootDir, barrelFileName, crossBoundaryStyle) {
	const targetBasename = getBasenameWithoutExt(targetAbs);
	if (targetBasename !== barrelFileName) return choosePathFormat(fileBoundary, targetBasename, rootDir, crossBoundaryStyle);
	return null;
}
/**
* Calculate path for same directory file.
*/
function calculateSameDirectoryPath(targetAbs, barrelFileName) {
	const targetBasename = getBasenameWithoutExt(targetAbs);
	if (targetBasename !== barrelFileName) return `./${targetBasename}`;
	return null;
}
/**
* Calculate path for distant imports (cousin, top-level, etc.).
*/
function calculateDistantPath(targetParts, fileParts, firstDifferingIndex, firstDifferingSegment, fileBoundary, rootDir, crossBoundaryStyle) {
	if (firstDifferingIndex === fileParts.length) return `./${firstDifferingSegment}`;
	if (targetParts.length === 1 && fileParts.length > 0) return choosePathFormat(fileBoundary, firstDifferingSegment, rootDir, crossBoundaryStyle);
	if (firstDifferingIndex === fileParts.length - 1) return `../${firstDifferingSegment}`;
	return choosePathFormat(fileBoundary, firstDifferingSegment, rootDir, crossBoundaryStyle);
}
/**
* Calculate path for same-boundary imports.
*/
function calculateSameBoundaryPath(targetDir, targetAbs, fileDir, fileBoundary, rootDir, barrelFileName, crossBoundaryStyle) {
	const targetRelativeToBoundary = path.relative(fileBoundary.absDir, targetDir);
	const fileRelativeToBoundary = path.relative(fileBoundary.absDir, fileDir);
	const targetParts = pathToParts(targetRelativeToBoundary);
	const fileParts = pathToParts(fileRelativeToBoundary);
	if (targetParts.length === 0) return calculateBoundaryRootPath(targetAbs, fileBoundary, rootDir, barrelFileName, crossBoundaryStyle);
	const firstDifferingIndex = findFirstDifferingIndex(targetParts, fileParts);
	if (firstDifferingIndex >= targetParts.length && firstDifferingIndex >= fileParts.length) return calculateSameDirectoryPath(targetAbs, barrelFileName);
	const firstDifferingSegment = targetParts[firstDifferingIndex];
	if (!firstDifferingSegment) return null;
	return calculateDistantPath(targetParts, fileParts, firstDifferingIndex, firstDifferingSegment, fileBoundary, rootDir, crossBoundaryStyle);
}

//#endregion
//#region src/targetPathResolution.ts
/**
* Resolve alias import (e.g., @boundary, @boundary/path).
*/
function resolveAliasImport(rawSpec, boundaries, barrelFileName, fileExtensions) {
	const boundary = boundaries.find((b) => b.alias && (rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`)));
	if (!boundary?.alias) return {
		targetAbs: "",
		targetDir: ""
	};
	const subpath = rawSpec.slice(boundary.alias.length + 1);
	if (subpath && !hasExtension(subpath, fileExtensions)) {
		const targetDir = path.resolve(boundary.absDir, subpath);
		return {
			targetAbs: path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`),
			targetDir
		};
	} else if (subpath) {
		const targetAbs = path.resolve(boundary.absDir, subpath);
		return {
			targetAbs,
			targetDir: path.dirname(targetAbs)
		};
	} else return {
		targetAbs: path.join(boundary.absDir, `${barrelFileName}${fileExtensions[0]}`),
		targetDir: boundary.absDir
	};
}
/**
* Resolve relative import (e.g., ./file, ../parent).
*/
function resolveRelativeImport(rawSpec, fileDir, barrelFileName, fileExtensions) {
	if (!hasExtension(rawSpec, fileExtensions)) if (path.basename(rawSpec) === barrelFileName) {
		const resolvedPath = path.resolve(fileDir, rawSpec);
		const normalizedSpec = path.normalize(rawSpec);
		if (normalizedSpec === `./${barrelFileName}` || normalizedSpec === barrelFileName) {
			const targetDir = fileDir;
			return {
				targetAbs: path.join(fileDir, `${barrelFileName}${fileExtensions[0]}`),
				targetDir
			};
		} else {
			const targetDir = resolvedPath;
			return {
				targetAbs: path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`),
				targetDir
			};
		}
	} else {
		const targetDir = path.resolve(fileDir, rawSpec);
		return {
			targetAbs: path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`),
			targetDir
		};
	}
	else {
		const targetAbs = path.resolve(fileDir, rawSpec);
		return {
			targetAbs,
			targetDir: path.dirname(targetAbs)
		};
	}
}
/**
* Resolve absolute import (e.g., src/domain/entities).
*/
function resolveAbsoluteImport(rawSpec, cwd, barrelFileName, fileExtensions) {
	if (!hasExtension(rawSpec, fileExtensions)) {
		const targetDir = path.resolve(cwd, rawSpec);
		return {
			targetAbs: path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`),
			targetDir
		};
	} else {
		const targetAbs = path.resolve(cwd, rawSpec);
		return {
			targetAbs,
			targetDir: path.dirname(targetAbs)
		};
	}
}
/**
* Find matching boundary for bare import (e.g., entities/army).
*/
function findMatchingBoundary(rawSpec, boundaries) {
	return boundaries.find((b) => {
		if (rawSpec === b.dir || rawSpec.startsWith(`${b.dir}/`)) return true;
		const boundaryParts = b.dir.split("/");
		if (rawSpec.split("/").length > 0 && boundaryParts.length > 0) for (let i = boundaryParts.length - 1; i >= 0; i--) {
			const boundarySuffix = boundaryParts.slice(i).join("/");
			if (rawSpec === boundarySuffix || rawSpec.startsWith(`${boundarySuffix}/`)) return true;
		}
		return false;
	}) || null;
}
/**
* Extract subpath from bare import relative to matching boundary.
*/
function extractBareImportSubpath(rawSpec, matchingBoundary) {
	if (rawSpec === matchingBoundary.dir) return "";
	else if (rawSpec.startsWith(`${matchingBoundary.dir}/`)) return rawSpec.slice(matchingBoundary.dir.length + 1);
	else {
		const boundaryParts = matchingBoundary.dir.split("/");
		for (let i = boundaryParts.length - 1; i >= 0; i--) {
			const boundarySuffix = boundaryParts.slice(i).join("/");
			if (rawSpec.startsWith(`${boundarySuffix}/`)) return rawSpec.slice(boundarySuffix.length + 1);
			else if (rawSpec === boundarySuffix) return "";
		}
		return "";
	}
}
/**
* Resolve bare import (e.g., entities/army) that matches a boundary.
*/
function resolveBareImport(rawSpec, boundaries, barrelFileName, fileExtensions) {
	const matchingBoundary = findMatchingBoundary(rawSpec, boundaries);
	if (!matchingBoundary) return {
		targetAbs: "",
		targetDir: ""
	};
	const subpath = extractBareImportSubpath(rawSpec, matchingBoundary);
	if (subpath && !hasExtension(subpath, fileExtensions)) {
		const targetDir = path.resolve(matchingBoundary.absDir, subpath);
		return {
			targetAbs: path.join(targetDir, `${barrelFileName}${fileExtensions[0]}`),
			targetDir
		};
	} else if (subpath) {
		const targetAbs = path.resolve(matchingBoundary.absDir, subpath);
		return {
			targetAbs,
			targetDir: path.dirname(targetAbs)
		};
	} else return {
		targetAbs: path.join(matchingBoundary.absDir, `${barrelFileName}${fileExtensions[0]}`),
		targetDir: matchingBoundary.absDir
	};
}
/**
* Resolve the target path from an import specifier.
*/
function resolveTargetPath(rawSpec, fileDir, boundaries, rootDir, cwd, barrelFileName = "index", fileExtensions = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs"
]) {
	if (rawSpec.startsWith("@")) return resolveAliasImport(rawSpec, boundaries, barrelFileName, fileExtensions);
	else if (rawSpec.startsWith(".")) return resolveRelativeImport(rawSpec, fileDir, barrelFileName, fileExtensions);
	else if (rawSpec.startsWith(rootDir)) return resolveAbsoluteImport(rawSpec, cwd, barrelFileName, fileExtensions);
	else return resolveBareImport(rawSpec, boundaries, barrelFileName, fileExtensions);
}

//#endregion
//#region src/relationshipDetection.ts
/**
* Calculate the correct import path using the simplified algorithm.
*/
function calculateCorrectImportPath(rawSpec, fileDir, fileBoundary, boundaries, rootDir, cwd, crossBoundaryStyle = "alias", barrelFileName = "index", fileExtensions = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs"
]) {
	const { targetAbs, targetDir } = resolveTargetPath(rawSpec, fileDir, boundaries, rootDir, cwd, barrelFileName, fileExtensions);
	const targetBoundary = resolveToBoundary(targetAbs, boundaries);
	if (!fileBoundary || targetBoundary !== fileBoundary) return calculateCrossBoundaryPath(targetBoundary, rootDir, crossBoundaryStyle);
	if (checkAncestorBarrel(rawSpec, fileBoundary, rootDir, crossBoundaryStyle)) return null;
	return calculateSameBoundaryPath(targetDir, targetAbs, fileDir, fileBoundary, rootDir, barrelFileName, crossBoundaryStyle);
}

//#endregion
//#region src/importHandler.ts
/**
* Main handler for all import statements.
* Validates import paths against boundary rules and enforces correct path format.
*
* @returns true if a violation was reported, false otherwise
*/
function handleImport(options) {
	const { node, rawSpec, fileDir, fileBoundary, boundaries, rootDir, cwd, context, crossBoundaryStyle = "alias", defaultSeverity, allowUnknownBoundaries = false, isTypeOnly = false, skipBoundaryRules = false, barrelFileName = "index", fileExtensions = [
		".ts",
		".tsx",
		".js",
		".jsx",
		".mjs",
		".cjs"
	] } = options;
	const { targetAbs } = resolveTargetPath(rawSpec, fileDir, boundaries, rootDir, cwd, barrelFileName, fileExtensions);
	if (!targetAbs) return false;
	if (crossBoundaryStyle === "alias") {
		const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
		if (aliasSubpathCheck.isSubpath) {
			const targetBoundary$1 = boundaries.find((b) => b.alias === aliasSubpathCheck.baseAlias);
			if (targetBoundary$1 && targetBoundary$1.alias && fileBoundary && targetBoundary$1 !== fileBoundary) {
				const expectedPath = targetBoundary$1.alias;
				const severity$1 = fileBoundary.severity || defaultSeverity;
				const reportOptions$1 = {
					node,
					messageId: "incorrectImportPath",
					data: {
						expectedPath,
						actualPath: rawSpec
					},
					fix: createFixer(node, expectedPath),
					...severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }
				};
				context.report(reportOptions$1);
				return true;
			}
		}
	}
	const targetBoundary = resolveToBoundary(targetAbs, boundaries);
	if (!skipBoundaryRules && fileBoundary && targetBoundary && fileBoundary !== targetBoundary) {
		const violation = checkBoundaryRules(fileBoundary, targetBoundary, boundaries, isTypeOnly);
		if (violation) {
			const severity$1 = fileBoundary.severity || defaultSeverity;
			const reportOptions$1 = {
				node,
				messageId: "boundaryViolation",
				data: {
					from: getBoundaryIdentifier(fileBoundary),
					to: getBoundaryIdentifier(targetBoundary),
					reason: violation.reason
				},
				...severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }
			};
			context.report(reportOptions$1);
			return true;
		}
	}
	const correctPath = calculateCorrectImportPath(rawSpec, fileDir, fileBoundary, boundaries, rootDir, cwd, crossBoundaryStyle, barrelFileName, fileExtensions);
	if (!correctPath) {
		if (fileBoundary) {
			if (crossBoundaryStyle === "alias" ? fileBoundary.alias && rawSpec === fileBoundary.alias : rawSpec === `${rootDir}/${fileBoundary.dir}`.replace(/\\/g, "/") || rawSpec === `${rootDir}/${fileBoundary.dir}/`.replace(/\\/g, "/")) {
				const severity$1 = fileBoundary.severity || defaultSeverity;
				const reportOptions$1 = {
					node,
					messageId: "ancestorBarrelImport",
					data: { alias: getBoundaryIdentifier(fileBoundary) },
					...severity$1 && { severity: severity$1 === "warn" ? 1 : 2 }
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
				...defaultSeverity && { severity: defaultSeverity === "warn" ? 1 : 2 }
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
			actualPath: rawSpec
		},
		fix: createFixer(node, correctPath),
		...severity && { severity: severity === "warn" ? 1 : 2 }
	};
	context.report(reportOptions);
	return true;
}

//#endregion
//#region src/ruleVisitors.ts
/**
* Create AST visitor functions for the rule.
*/
function createRuleVisitors(options) {
	const { context, getFileData: getFileData$1, clearCache, rootDir, boundaries, cwd, crossBoundaryStyle, defaultSeverity, allowUnknownBoundaries, enforceBoundaries, barrelFileName, fileExtensions } = options;
	/**
	* Wrapper function that prepares file data and calls the main import handler.
	*/
	function handleImportStatement(node, rawSpec, isTypeOnly = false) {
		const fileData = getFileData$1();
		if (!fileData.isValid) return;
		const { fileDir, fileBoundary } = fileData;
		if (!fileDir) return;
		handleImport({
			node,
			rawSpec,
			fileDir,
			fileBoundary: fileBoundary ?? null,
			boundaries,
			rootDir,
			cwd,
			context,
			crossBoundaryStyle,
			defaultSeverity,
			allowUnknownBoundaries,
			isTypeOnly,
			skipBoundaryRules: !enforceBoundaries,
			barrelFileName,
			fileExtensions
		});
	}
	return {
		Program() {
			clearCache();
		},
		ImportDeclaration(node) {
			const spec = node.source?.value;
			if (typeof spec === "string") handleImportStatement(node, spec, node.importKind === "type");
		},
		ImportExpression(node) {
			const arg = node.source;
			if (arg?.type === "Literal" && typeof arg.value === "string") handleImportStatement(node, arg.value, false);
		},
		CallExpression(node) {
			if (node.callee.type === "Identifier" && node.callee.name === "require" && node.arguments.length === 1 && node.arguments[0]?.type === "Literal" && typeof node.arguments[0].value === "string") handleImportStatement(node, node.arguments[0].value, false);
		},
		ExportNamedDeclaration(node) {
			const spec = node.source?.value;
			if (typeof spec === "string") handleImportStatement(node, spec, node.exportKind === "type");
		},
		ExportAllDeclaration(node) {
			const spec = node.source?.value;
			if (typeof spec === "string") handleImportStatement(node, spec, node.exportKind === "type");
		}
	};
}

//#endregion
//#region src/index.ts
const rule = {
	meta: {
		type: "problem",
		fixable: "code",
		docs: {
			description: "Enforces architectural boundaries with deterministic import path rules: cross-boundary uses alias without subpath, siblings use relative, boundary-root and top-level paths use alias, cousins use relative (max one ../).",
			recommended: false
		},
		schema: ruleSchema,
		messages: ruleMessages
	},
	create(context) {
		const ruleContext = extractRuleOptions(context);
		const { getFileData: getFileData$1, clearCache } = createFileDataGetter(context, ruleContext.boundaries);
		return createRuleVisitors({
			context,
			getFileData: getFileData$1,
			clearCache,
			rootDir: ruleContext.rootDir,
			boundaries: ruleContext.boundaries,
			cwd: ruleContext.cwd,
			crossBoundaryStyle: ruleContext.crossBoundaryStyle,
			defaultSeverity: ruleContext.defaultSeverity,
			allowUnknownBoundaries: ruleContext.allowUnknownBoundaries,
			enforceBoundaries: ruleContext.enforceBoundaries,
			barrelFileName: ruleContext.barrelFileName,
			fileExtensions: ruleContext.fileExtensions
		});
	}
};
var src_default = { rules: { enforce: rule } };

//#endregion
export { src_default as default };