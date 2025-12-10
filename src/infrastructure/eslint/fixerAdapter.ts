/**
 * Infrastructure: ESLint Fixer Adapter
 * Implements the Fixer port using ESLint's fixer API.
 */

import type { Fixer, FixResult } from '@ports';
import type { Rule } from 'eslint';

/**
 * Create a Fixer factory that can create fixers for a given node and path.
 * This allows the infrastructure layer to create fixers with access to the node.
 */
export function createFixerFactory(node: Rule.Node) {
  return (newPath: string): Fixer => {
    return {
      apply: (): FixResult | null => {
        // Find the source node (the string literal with the import path)
        let sourceNode: Rule.Node | null = null;

        // Case 1: Standard import statement (import ... from 'path')
        if ('source' in node && node.source) {
          sourceNode = node.source as Rule.Node;
        }
        // Case 2: Dynamic import or require() call
        else if (
          'arguments' in node &&
          Array.isArray(node.arguments) &&
          node.arguments[0]
        ) {
          sourceNode = node.arguments[0] as Rule.Node;
        }

        if (!sourceNode || !('range' in sourceNode) || !sourceNode.range) {
          return null;
        }

        // Get the range of the source node
        const [start, end] = sourceNode.range;

        // Return the fix result
        return {
          text: `'${newPath}'`,
          range: [start, end],
        };
      },
    };
  };
}

/**
 * Convert a port Fixer to an ESLint ReportFixer.
 */
export function toESLintReportFixer(
  node: Rule.Node,
  fixer: Fixer,
): Rule.ReportFixer {
  return (eslintFixer) => {
    const result = fixer.apply();
    if (!result) {
      return null;
    }

    // Apply the fix using ESLint's fixer
    return eslintFixer.replaceTextRange(result.range, result.text);
  };
}
