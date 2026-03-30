/**
 * Tests for import handler defaults.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '@shared';
import {
  DEFAULT_IS_TYPE_ONLY,
  DEFAULT_SKIP_BOUNDARY_RULES,
  getImportHandlerDefaults,
} from './importHandlerDefaults';

describe('importHandlerDefaults', () => {
  describe('constants', () => {
    it('should not have a default for crossBoundaryStyle', () => {
      expect(DEFAULTS.crossBoundaryStyle).toBeUndefined();
    });

    it('should have default allow unknown boundaries in shared DEFAULTS', () => {
      expect(DEFAULTS.allowUnknownBoundaries).toBe(false);
    });

    it('should export default is type only', () => {
      expect(DEFAULT_IS_TYPE_ONLY).toBe(false);
    });

    it('should export default skip boundary rules', () => {
      expect(DEFAULT_SKIP_BOUNDARY_RULES).toBe(false);
    });

    it('should have default barrel file name in shared DEFAULTS', () => {
      expect(DEFAULTS.barrelFileName).toBe('index');
    });

    it('should have default file extensions in shared DEFAULTS', () => {
      expect(DEFAULTS.fileExtensions).toEqual([
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.mjs',
        '.cjs',
      ]);
    });
  });

  describe('getImportHandlerDefaults', () => {
    it('should return all default values', () => {
      const defaults = getImportHandlerDefaults();

      expect(defaults).not.toHaveProperty('crossBoundaryStyle');
      expect(defaults.allowUnknownBoundaries).toBe(false);
      expect(defaults.isTypeOnly).toBe(false);
      expect(defaults.skipBoundaryRules).toBe(false);
      expect(defaults.barrelFileName).toBe('index');
      expect(defaults.fileExtensions).toEqual([
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.mjs',
        '.cjs',
      ]);
    });

    it('should return a new array for fileExtensions each time', () => {
      const defaults1 = getImportHandlerDefaults();
      const defaults2 = getImportHandlerDefaults();

      expect(defaults1.fileExtensions).not.toBe(defaults2.fileExtensions);
      expect(defaults1.fileExtensions).toEqual(defaults2.fileExtensions);
    });
  });
});
