/**
 * Infrastructure: ESLint AST Node Adapter
 * Adapts ESLint AST nodes to the ASTNode port interface.
 */

import type { ASTNode } from '@ports';
import type { Rule } from 'eslint';

/**
 * Adapt an ESLint node to the ASTNode port interface.
 */
export function adaptESLintNode(node: Rule.Node): ASTNode {
  return {
    getImportSpecifier: (): string | null => {
      // Case 1: Standard import statement (import ... from 'path')
      if ('source' in node && node.source) {
        const source = node.source as { value?: string; raw?: string };
        return source.value ?? source.raw?.replace(/^['"]|['"]$/g, '') ?? null;
      }
      // Case 2: Dynamic import or require() call
      if (
        'arguments' in node &&
        Array.isArray(node.arguments) &&
        node.arguments[0]
      ) {
        const arg = node.arguments[0] as { value?: string; raw?: string };
        return arg.value ?? arg.raw?.replace(/^['"]|['"]$/g, '') ?? null;
      }
      return null;
    },

    isTypeOnly: (): boolean => {
      // Check if this is a type-only import
      if ('importKind' in node && node.importKind === 'type') {
        return true;
      }
      // Check for type-only import declarations
      if (
        node.type === 'ImportDeclaration' &&
        'importKind' in node &&
        node.importKind === 'type'
      ) {
        return true;
      }
      return false;
    },
  };
}
