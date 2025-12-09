/**
 * ESLint rule: boundary-alias-vs-relative
 *
 * Enforces architectural boundaries using a deterministic heuristic:
 * - Cross-boundary: Must use alias without subpath (e.g., @entities, not @entities/army)
 * - Sibling files: Must use relative ./sibling
 * - Boundary root files: Must use alias @boundary/rootFile
 * - Top-level paths: Must use alias @boundary/path (preferred even if only one ../ would work)
 * - Cousins (otherwise): Must use relative ../cousin (max one ../)
 * - Ancestor barrel: Forbidden (prevents circular dependencies)
 *
 * The rule uses pure path math and AST analysis - no file I/O.
 * All violations are auto-fixable.
 */

import type { Rule } from 'eslint';

import type { Boundary, FileData, RuleOptions } from './types.js';
import path from 'node:path';
import process from 'node:process';
import { getFileData } from './boundaryDetection.js';
import { handleImport } from './importHandler.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Enforces architectural boundaries with deterministic import path rules: cross-boundary uses alias without subpath, siblings use relative, boundary-root and top-level paths use alias, cousins use relative (max one ../).',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          rootDir: { type: 'string' },
          boundaries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dir: { type: 'string' },
                alias: { type: 'string' },
                allowImportsFrom: {
                  type: 'array',
                  items: { type: 'string' },
                },
                denyImportsFrom: {
                  type: 'array',
                  items: { type: 'string' },
                },
                allowTypeImportsFrom: {
                  type: 'array',
                  items: { type: 'string' },
                },
                nestedPathFormat: {
                  type: 'string',
                  enum: ['alias', 'relative', 'inherit'],
                },
                severity: {
                  type: 'string',
                  enum: ['error', 'warn'],
                },
              },
              required: ['dir', 'alias'],
            },
            minItems: 1,
          },
          crossBoundaryStyle: {
            type: 'string',
            enum: ['alias', 'absolute'],
            default: 'alias',
          },
          skipBoundaryRulesForTestFiles: {
            type: 'boolean',
            default: true,
          },
        },
        required: ['boundaries'],
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
    // Extract and validate rule options
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
      skipBoundaryRulesForTestFiles = true,
    } = options;
    const cwd = context.getCwd?.() ?? process.cwd();

    // Pre-resolve all boundary directories to absolute paths for efficient comparison
    // This avoids repeated path resolution during linting
    const resolvedBoundaries: Boundary[] = boundaries.map(
      (b: RuleOptions['boundaries'][number]) => ({
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

    // Cache file metadata per file to avoid recomputation
    // Cleared at the start of each Program node
    let cachedFileData: FileData | null = null;

    // Note: importDeclarations tracking removed - no longer needed with heuristic handler

    /**
     * Get metadata about the current file being linted.
     * Results are cached per file to avoid recomputation.
     *
     * @returns FileData with directory and boundary information, or { isValid: false } if file path is invalid
     */
    function getFileDataCached(): FileData {
      // Return cached data if available
      if (cachedFileData) return cachedFileData;

      // Get filename from context, with fallbacks for different ESLint versions
      const filename =
        context.filename ?? context.getFilename?.() ?? '<unknown>';

      // Use the module function to get file data
      cachedFileData = getFileData(filename, resolvedBoundaries);
      return cachedFileData;
    }

    /**
     * Wrapper function that prepares file data and calls the main import handler.
     *
     * @param node - AST node for the import (ImportDeclaration, ImportExpression, or CallExpression)
     * @param rawSpec - Raw import specifier string (e.g., '@entities', './file', '../parent')
     * @param isTypeOnly - Whether this is a type-only import (TypeScript)
     */
    function handleImportStatement(
      node: Rule.Node,
      rawSpec: string,
      isTypeOnly: boolean = false,
    ): void {
      const fileData = getFileDataCached();
      // Skip if we can't determine file location
      if (!fileData.isValid) return;

      const { fileDir, fileBoundary } = fileData;
      if (!fileDir) return;

      // Main import handler (no file I/O, pure path math)
      // skipBoundaryRulesForTestFiles is set via ESLint config blocks for test files
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
      });
    }

    // ========================================================================
    // ESLint Rule Visitor Functions
    // ========================================================================
    // These functions are called by ESLint as it traverses the AST
    return {
      /**
       * Called once per file, before processing any imports.
       * Used to clear caches for new file.
       */
      Program() {
        // Clear caches for new file
        cachedFileData = null;
      },

      /**
       * Handle standard ES6 import statements: import ... from 'path'
       */
      ImportDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') {
          // Check if this is a type-only import (TypeScript ESLint parser adds importKind)
          const importKind = (
            node as { importKind?: 'type' | 'value' | 'type-value' }
          ).importKind;
          const isTypeOnly = importKind === 'type';
          handleImportStatement(node, spec, isTypeOnly);
        }
      },

      /**
       * Handle dynamic import() expressions: import('path')
       * These are always value imports (not type-only)
       */
      ImportExpression(node) {
        const arg = node.source;
        if (arg?.type === 'Literal' && typeof arg.value === 'string') {
          handleImportStatement(node, arg.value, false);
        }
      },

      /**
       * Handle CommonJS require() calls: require('path')
       * These are always value imports (not type-only)
       */
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0]?.type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          handleImportStatement(node, node.arguments[0].value, false);
        }
      },

      /**
       * Handle ES6 export statements with 'from': export { ... } from 'path'
       * Only checks re-exports (those with a source), not local exports
       */
      ExportNamedDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') {
          // Check if this is a type-only export (TypeScript ESLint parser adds exportKind)
          const exportKind = (node as { exportKind?: 'type' | 'value' })
            .exportKind;
          const isTypeOnly = exportKind === 'type';
          handleImportStatement(node, spec, isTypeOnly);
        }
      },

      /**
       * Handle ES6 export all statements: export * from 'path'
       * These are always value exports (not type-only)
       */
      ExportAllDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') {
          // Check if this is a type-only export (TypeScript ESLint parser adds exportKind)
          const exportKind = (node as { exportKind?: 'type' | 'value' })
            .exportKind;
          const isTypeOnly = exportKind === 'type';
          handleImportStatement(node, spec, isTypeOnly);
        }
      },
    };
  },
};

export default rule;
