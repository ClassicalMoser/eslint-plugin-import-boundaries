/**
 * Unit tests for no-wildcard-barrel rule.
 *
 * The core logic (isBarrelFile) is tested in barrelFileHelpers.test.ts.
 * This file tests the rule's integration: that it correctly hooks up the
 * ESLint listeners and only applies to barrel files.
 *
 * Note: We test the rule module metadata rather than invoking listeners
 * directly, since listener args require ESLint's internal node types.
 * The pure business logic is covered in barrelFileHelpers.test.ts.
 */

import { describe, expect, it } from 'vitest';
import { rule } from './noWildcardBarrel';

describe('no-wildcard-barrel rule', () => {
  describe('rule metadata', () => {
    it('should have type problem', () => {
      expect(rule.meta?.type).toBe('problem');
    });

    it('should not be auto-fixable', () => {
      expect(rule.meta?.fixable).toBeUndefined();
    });

    it('should have the expected message IDs', () => {
      expect(rule.meta?.messages).toHaveProperty('noWildcardExport');
      expect(rule.meta?.messages).toHaveProperty('noWildcardNamespaceExport');
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

    it('should return an empty object for files named re-index.ts', () => {
      const fakeContext = {
        filename: '/project/src/domain/re-index.ts',
        getFilename: () => '/project/src/domain/re-index.ts',
        options: [],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
      expect(Object.keys(listeners)).toHaveLength(0);
    });
  });

  describe('create() - index files produce ExportAllDeclaration listener', () => {
    it('should return an ExportAllDeclaration listener for index.ts', () => {
      const fakeContext = {
        filename: '/project/src/domain/index.ts',
        getFilename: () => '/project/src/domain/index.ts',
        options: [],
        report: () => {},
      };
      const listeners = rule.create(fakeContext as never);
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
      expect(listeners).toHaveProperty('ExportAllDeclaration');
    });

    it('should NOT trigger for index.ts when barrelFileName is barrel', () => {
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
