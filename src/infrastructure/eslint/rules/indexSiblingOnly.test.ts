/**
 * Unit tests for index-sibling-only rule.
 *
 * The core logic (isBarrelFile, classifyBarrelImport) is tested in
 * barrelFileHelpers.test.ts. This file tests the rule's integration:
 * that it correctly hooks up ESLint listeners and only applies to barrel files.
 */

import { describe, expect, it } from 'vitest';
import { rule } from './indexSiblingOnly';

describe('index-sibling-only rule', () => {
  describe('rule metadata', () => {
    it('should have type problem', () => {
      expect(rule.meta?.type).toBe('problem');
    });

    it('should not be auto-fixable', () => {
      expect(rule.meta?.fixable).toBeUndefined();
    });

    it('should have the expected message IDs', () => {
      expect(rule.meta?.messages).toHaveProperty('notSibling');
      expect(rule.meta?.messages).toHaveProperty('missingExtension');
    });

    it('should accept optional barrelFileName option', () => {
      const schema = rule.meta?.schema;
      expect(Array.isArray(schema)).toBe(true);
      const firstSchema = (schema as unknown[])[0] as {
        properties: Record<string, unknown>;
      };
      expect(firstSchema.properties).toHaveProperty('barrelFileName');
    });
  });

  describe('create() - non-index files produce empty listener', () => {
    it('should return an empty object for non-index files', () => {
      const fakeContext = {
        filename: '/project/src/domain/army.ts',
        getFilename: () => '/project/src/domain/army.ts',
        options: [],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
      expect(Object.keys(listeners)).toHaveLength(0);
    });
  });

  describe('create() - index files produce all import/export listeners', () => {
    it('should register all relevant listeners for index.ts', () => {
      const fakeContext = {
        filename: '/project/src/domain/index.ts',
        getFilename: () => '/project/src/domain/index.ts',
        options: [],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
      expect(listeners).toHaveProperty('ImportDeclaration');
      expect(listeners).toHaveProperty('ImportExpression');
      expect(listeners).toHaveProperty('ExportNamedDeclaration');
      expect(listeners).toHaveProperty('ExportAllDeclaration');
    });

    it('should use custom barrelFileName when provided', () => {
      const fakeContext = {
        filename: '/project/src/domain/barrel.ts',
        getFilename: () => '/project/src/domain/barrel.ts',
        options: [{ barrelFileName: 'barrel' }],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
      expect(listeners).toHaveProperty('ImportDeclaration');
    });

    it('should NOT register listeners for index.ts when barrelFileName is barrel', () => {
      const fakeContext = {
        filename: '/project/src/domain/index.ts',
        getFilename: () => '/project/src/domain/index.ts',
        options: [{ barrelFileName: 'barrel' }],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
      expect(Object.keys(listeners)).toHaveLength(0);
    });
  });
});
