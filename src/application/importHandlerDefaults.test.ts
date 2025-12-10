/**
 * Tests for import handler defaults.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALLOW_UNKNOWN_BOUNDARIES,
  DEFAULT_BARREL_FILE_NAME,
  DEFAULT_CROSS_BOUNDARY_STYLE,
  DEFAULT_FILE_EXTENSIONS,
  DEFAULT_IS_TYPE_ONLY,
  DEFAULT_SKIP_BOUNDARY_RULES,
  getImportHandlerDefaults,
} from './importHandlerDefaults';

describe('importHandlerDefaults', () => {
  describe('constants', () => {
    it('should export default cross boundary style', () => {
      expect(DEFAULT_CROSS_BOUNDARY_STYLE).toBe('alias');
    });

    it('should export default allow unknown boundaries', () => {
      expect(DEFAULT_ALLOW_UNKNOWN_BOUNDARIES).toBe(false);
    });

    it('should export default is type only', () => {
      expect(DEFAULT_IS_TYPE_ONLY).toBe(false);
    });

    it('should export default skip boundary rules', () => {
      expect(DEFAULT_SKIP_BOUNDARY_RULES).toBe(false);
    });

    it('should export default barrel file name', () => {
      expect(DEFAULT_BARREL_FILE_NAME).toBe('index');
    });

    it('should export default file extensions', () => {
      expect(DEFAULT_FILE_EXTENSIONS).toEqual([
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

      expect(defaults.crossBoundaryStyle).toBe('alias');
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
