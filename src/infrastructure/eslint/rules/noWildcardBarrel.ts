/**
 * ESLint rule: no-wildcard-barrel
 *
 * Disallows wildcard exports (`export * from '...'`) and wildcard namespace
 * re-exports (`export * as Foo from '...'`) in index (barrel) files.
 *
 * Index files should explicitly list what they export so that:
 * - Tree shaking works correctly
 * - The public API of each boundary is intentional and visible
 * - Consumers know exactly what is available
 *
 * @example
 * // ❌ Bad (in index.ts):
 * export * from './army';
 * export * as Army from './army';
 *
 * // ✅ Good (in index.ts):
 * export { Army } from './army';
 * export { createSoldier, Soldier } from './soldier';
 */

import type { Rule } from 'eslint';
import { DEFAULT_BARREL_FILE_NAME, isBarrelFile } from './barrelFileHelpers';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: undefined,
    docs: {
      description:
        'Disallows wildcard exports (`export * from ...`) in index/barrel files. Explicit exports make the public API intentional and visible.',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          barrelFileName: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noWildcardExport:
        'Wildcard export \'export * from "{{source}}"\' is not allowed in index files. Use explicit named exports instead: \'export { Name } from "{{source}}"\'.',
      noWildcardNamespaceExport:
        'Wildcard namespace export \'export * as {{name}} from "{{source}}"\' is not allowed in index files. Use explicit named exports instead.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const barrelFileName: string =
      options.barrelFileName ?? DEFAULT_BARREL_FILE_NAME;

    const filename = context.filename;
    if (!isBarrelFile(filename, barrelFileName)) {
      return {}; // Not an index file - no checks needed
    }

    return {
      ExportAllDeclaration(node) {
        const source = (node.source as { value?: string })?.value ?? '';
        const exportedName = (node as { exported?: { name?: string } })
          ?.exported?.name;

        if (exportedName) {
          // export * as Foo from '...'
          context.report({
            node,
            messageId: 'noWildcardNamespaceExport',
            data: {
              name: exportedName,
              source,
            },
          });
        } else {
          // export * from '...'
          context.report({
            node,
            messageId: 'noWildcardExport',
            data: { source },
          });
        }
      },
    };
  },
};
