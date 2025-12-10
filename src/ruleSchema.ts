/**
 * ESLint rule schema definition.
 */

import type { Rule } from 'eslint';

import { ruleSchema } from './schemaHelpers.js';
export { ruleSchema };

/**
 * Rule messages for boundary-alias-vs-relative.
 */
export const ruleMessages: Rule.RuleMetaData['messages'] = {
  incorrectImportPath: "Expected '{{expectedPath}}' but got '{{actualPath}}'.",
  ancestorBarrelImport:
    "Cannot import from ancestor barrel '{{alias}}'. This would create a circular dependency. Import from the specific file or directory instead.",
  unknownBoundaryImport:
    "Cannot import from '{{path}}' - path is outside all configured boundaries. Add this path to boundaries configuration or set 'allowUnknownBoundaries: true'.",
  boundaryViolation: "Cannot import from '{{to}}' to '{{from}}': {{reason}}",
};
