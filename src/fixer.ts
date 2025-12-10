/**
 * Utility function for creating ESLint fixes for import paths.
 */

import type { Rule } from 'eslint';

/**
 * Create a fixer function to replace an import path.
 * Handles different import node types: ImportDeclaration, ImportExpression, require().
 *
 * @param node - AST node for the import
 * @param newPath - New import path to use
 * @returns Fixer function, or null if node type is unsupported
 */
export function createFixer(
  node: Rule.Node,
  newPath: string,
): Rule.ReportFixer | null {
  return (fixer) => {
    // Case 1: Standard import statement (import ... from 'path')
    if ('source' in node && node.source) {
      return fixer.replaceText(node.source as Rule.Node, `'${newPath}'`);
    }
    // Case 2: Dynamic import or require() call
    if (
      'arguments' in node &&
      Array.isArray(node.arguments) &&
      node.arguments[0]
    ) {
      return fixer.replaceText(node.arguments[0] as Rule.Node, `'${newPath}'`);
    }
    // Unsupported node type
    return null;
  };
}
