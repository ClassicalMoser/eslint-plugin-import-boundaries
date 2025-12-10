/**
 * Helper functions for building ESLint rule schemas.
 * Reduces repetition in schema definitions.
 */

import type { Rule } from 'eslint';

// Type for schema properties - simplified to avoid complex union indexing
type SchemaProperty =
  | { type: 'string'; enum?: string[]; default?: unknown }
  | { type: 'boolean'; default?: unknown }
  | { type: 'array'; items: { type: 'string' }; default?: unknown }
  | {
      type: 'object';
      properties?: Record<string, SchemaProperty>;
      required?: string[];
      minItems?: number;
    };

/**
 * Common schema property definitions.
 */
const schemaProps = {
  string: { type: 'string' } as const,
  boolean: { type: 'boolean' } as const,
  stringArray: { type: 'array', items: { type: 'string' } } as const,
} as const;

/**
 * Create a string enum schema property.
 */
function stringEnum(values: string[]): SchemaProperty {
  return { type: 'string', enum: values };
}

/**
 * Create a schema property with default value.
 */
function withDefault<T extends SchemaProperty>(
  property: T,
  defaultValue: unknown,
): T & { default: unknown } {
  return { ...property, default: defaultValue };
}

/**
 * Boundary config schema definition.
 */
const boundaryConfigSchema: SchemaProperty = {
  type: 'object',
  properties: {
    dir: schemaProps.string,
    alias: schemaProps.string,
    allowImportsFrom: schemaProps.stringArray,
    denyImportsFrom: schemaProps.stringArray,
    allowTypeImportsFrom: schemaProps.stringArray,
    nestedPathFormat: stringEnum(['alias', 'relative', 'inherit']),
    severity: stringEnum(['error', 'warn']),
  },
  required: ['dir'],
};

/**
 * Rule schema for boundary-alias-vs-relative.
 */
export const ruleSchema: Rule.RuleMetaData['schema'] = [
  {
    type: 'object',
    properties: {
      rootDir: schemaProps.string,
      boundaries: {
        type: 'array',
        items: boundaryConfigSchema,
        minItems: 1,
      },
      crossBoundaryStyle: withDefault(
        stringEnum(['alias', 'absolute']),
        'alias',
      ),
      defaultSeverity: stringEnum(['error', 'warn']),
      allowUnknownBoundaries: withDefault(schemaProps.boolean, false),
      enforceBoundaries: withDefault(schemaProps.boolean, true),
      barrelFileName: withDefault(schemaProps.string, 'index'),
      fileExtensions: withDefault(schemaProps.stringArray, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.mjs',
        '.cjs',
      ]),
    },
    required: ['boundaries'],
  },
];
