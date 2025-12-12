/**
 * Infrastructure: ESLint Rule Visitors
 * ESLint-specific AST visitor functions that adapt to the application layer.
 */

import type { Boundary, FileData } from '@shared';
import type { Rule } from 'eslint';
import { handleImport } from '@application';
import { createFixerFactory } from './fixerAdapter';
import { ESLintReporter } from './reporterAdapter';

/**
 * Options for creating rule visitors.
 */
export interface RuleVisitorOptions {
  context: Rule.RuleContext;
  getFileData: () => FileData;
  clearCache: () => void;
  rootDir: string;
  boundaries: Boundary[];
  cwd: string;
  crossBoundaryStyle: 'alias' | 'absolute';
  defaultSeverity?: 'error' | 'warn';
  allowUnknownBoundaries: boolean;
  enforceBoundaries: boolean;
  barrelFileName: string;
  fileExtensions: string[];
}

/**
 * Create AST visitor functions for the rule.
 */
export function createRuleVisitors(
  options: RuleVisitorOptions,
): Rule.RuleListener {
  const {
    context,
    getFileData,
    clearCache,
    rootDir,
    boundaries,
    cwd,
    crossBoundaryStyle,
    defaultSeverity,
    allowUnknownBoundaries,
    enforceBoundaries,
    fileExtensions,
  } = options;

  /**
   * Wrapper function that prepares file data and calls the main import handler.
   * Creates ESLint adapters and passes them to the application layer.
   */
  function handleImportStatement(
    node: Rule.Node,
    rawSpec: string,
    isTypeOnly: boolean = false,
  ): void {
    const fileData = getFileData();
    // Skip if we can't determine file location
    if (!fileData.isValid) return;

    const { fileDir, fileBoundary } = fileData;
    if (!fileDir) return;

    // Create ESLint adapters (infrastructure layer)
    const reporter = new ESLintReporter(context, node);
    const createFixer = createFixerFactory(node);

    // Call application layer with ports (Dependency Inversion)
    handleImport({
      rawSpec,
      fileDir,
      fileBoundary: fileBoundary ?? null,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle,
      defaultSeverity,
      allowUnknownBoundaries,
      isTypeOnly,
      skipBoundaryRules: !enforceBoundaries, // Invert: enforceBoundaries=false means skip rules
      fileExtensions,
    });
  }

  return {
    /**
     * Called once per file, before processing any imports.
     * Used to clear caches for new file.
     */
    Program() {
      clearCache();
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
}
