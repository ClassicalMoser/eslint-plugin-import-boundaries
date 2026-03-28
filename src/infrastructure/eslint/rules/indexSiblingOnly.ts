/**
 * ESLint rule: index-sibling-only
 *
 * In index (barrel) files, ALL imports and re-exports must be direct siblings:
 * either `./filename.ext` (flat sibling file) or `./dirname` (sibling directory
 * whose index.ts is the public interface). No `../` traversal, no nested paths,
 * no cross-boundary imports.
 *
 * This rule enforces that index files act as clean barrel re-exports that
 * only expose what is directly in their own directory. It prevents:
 * - Importing from parent directories (`../something`)
 * - Importing from nested subdirectories (`./subdir/something`)
 * - Cross-boundary imports (`src/domain`, `@domain`)
 *
 * NOTE: Both `./name.ext` (explicit flat-file reference) and `./name` (directory
 * reference) are valid. Without file I/O we cannot distinguish them, and both
 * are legitimate: `./army.ts` re-exports a flat file, `./entities` re-exports a
 * sibling directory's barrel. The rule enforces no-traversal, not extension format.
 *
 * @example
 * // ❌ Bad (in index.ts):
 * import { foo } from '../parent';          // above current directory
 * import { bar } from './subdir/deep';      // below current directory
 * import { qux } from 'src/domain';         // cross-boundary
 * export * from './army';                   // wildcard (use no-wildcard-barrel rule)
 *
 * // ✅ Good (in index.ts):
 * export { Army } from './army.ts';         // flat file sibling (explicit ext)
 * export { Entity } from './entities';      // directory sibling (hits entities/index.ts)
 * export { Soldier } from './soldier.ts';
 * export type { SoldierOptions } from './soldier.ts';
 */

import type { Rule } from 'eslint';
import {
  classifyBarrelImport,
  DEFAULT_BARREL_FILE_NAME,
  isBarrelFile,
} from './barrelFileHelpers';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: undefined,
    docs: {
      description:
        "In index/barrel files, only direct sibling imports are allowed: './file.ts' (flat file) or './dir' (directory). No parent traversal, no nested paths, no cross-boundary imports.",
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
        "Index files may only import from direct siblings. '{{spec}}' is not a sibling import. Use './filename.ext' (flat file) or './dirname' (directory) format.",
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
      if (classifyBarrelImport(spec) === 'not-sibling') {
        context.report({
          node,
          messageId: 'notSibling',
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
