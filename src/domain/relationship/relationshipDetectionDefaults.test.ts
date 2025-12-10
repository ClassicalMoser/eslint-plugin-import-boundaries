/**
 * Tests for relationship detection defaults.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BARREL_FILE_NAME,
  DEFAULT_CROSS_BOUNDARY_STYLE,
  DEFAULT_FILE_EXTENSIONS,
  getDefaultFileExtensions,
} from './relationshipDetectionDefaults';

describe('relationshipDetectionDefaults', () => {
  describe('constants', () => {
    it('should export default cross boundary style', () => {
      expect(DEFAULT_CROSS_BOUNDARY_STYLE).toBe('alias');
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

  describe('getDefaultFileExtensions', () => {
    it('should return default file extensions as a new array', () => {
      const result = getDefaultFileExtensions();
      expect(result).toEqual(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
    });

    it('should return a new array each time', () => {
      const result1 = getDefaultFileExtensions();
      const result2 = getDefaultFileExtensions();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should not mutate the original constant', () => {
      const result = getDefaultFileExtensions();
      result.push('.d.ts');

      expect(DEFAULT_FILE_EXTENSIONS).not.toContain('.d.ts');
      expect(result).toContain('.d.ts');
    });
  });
});
