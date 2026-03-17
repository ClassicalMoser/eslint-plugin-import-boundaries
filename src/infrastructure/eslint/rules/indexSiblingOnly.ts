/**
 * ESLint rule: index-sibling-only
 *
 * In index (barrel) files, ALL imports and re-exports must be sibling files
 * in the format `./filename.ext` — with an explicit file extension, and
 * referencing only files in the same directory (no `../` or nested paths).
 *
 * This rule enforces that index files act as clean barrel re-exports that
 * only expose what is directly in their own directory. It prevents:
 * - Importing from parent directories (`../something`)
 * - Importing from subdirectories (`./subdir/something`)
 * - Extension-less imports (`./something` without `.ts`)
 * - Cross-boundary imports (`src/domain`, `@domain`)
 *
 * @example
 * // ❌ Bad (in index.ts):
 * import { foo } from '../parent';          // above current directory
 * import { bar } from './subdir/deep';      // below current directory
 * import { baz } from './sibling';          // missing extension
 * import { qux } from 'src/domain';         // cross-boundary
 *
 * // ✅ Good (in index.ts):
 * export { Army } from './army.ts';
 * export { Soldier } from './soldier.ts';
 * export type { SoldierOptions } from './soldier.ts';
 */

import type { Rule } from 'eslint';
import {
  DEFAULT_BARREL_FILE_NAME,
  classifyBarrelImport,
  isBarrelFile,
} from './barrelFileHelpers';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: undefined,
    docs: {
      description:
        "In index/barrel files, only direct sibling imports with explicit extensions are allowed (e.g. './file.ts'). No parent imports, subdirectory imports, or extension-less imports.",
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
      notSibling:
        "Index files may only import from direct siblings. '{{spec}}' is not a sibling import. Use './filename.ext' format.",
      missingExtension:
        "Index files must use explicit file extensions in imports. Change '{{spec}}' to include the file extension (e.g. '{{spec}}.ts').",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const barrelFileName: string =
      options.barrelFileName ?? DEFAULT_BARREL_FILE_NAME;

    const filename = context.filename ?? context.getFilename?.() ?? '';
    if (!isBarrelFile(filename, barrelFileName)) {
      return {}; // Not an index file - no checks needed
    }

    function checkSpec(node: Rule.Node, spec: string): void {
      const classification = classifyBarrelImport(spec);
      if (classification === 'not-sibling') {
        context.report({
          node,
          messageId: 'notSibling',
          data: { spec },
        });
      } else if (classification === 'no-ext') {
        context.report({
          node,
          messageId: 'missingExtension',
          data: { spec },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') checkSpec(node, spec);
      },

      ImportExpression(node) {
        const arg = node.source;
        if (arg?.type === 'Literal' && typeof arg.value === 'string') {
          checkSpec(node, arg.value);
        }
      },

      ExportNamedDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') checkSpec(node, spec);
      },

      ExportAllDeclaration(node) {
        const spec = (node.source as { value?: string })?.value;
        if (typeof spec === 'string') checkSpec(node, spec);
      },
    };
  },
};
