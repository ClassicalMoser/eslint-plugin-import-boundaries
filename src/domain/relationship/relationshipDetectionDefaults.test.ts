/**
 * Tests for relationship detection defaults.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '@shared';
import {
  DEFAULT_BARREL_FILE_NAME,
  getDefaultFileExtensions,
} from './relationshipDetectionDefaults';

describe('relationshipDetectionDefaults', () => {
  describe('constants', () => {
    it('should not have a default for crossBoundaryStyle', () => {
      expect(DEFAULTS.crossBoundaryStyle).toBeUndefined();
    });

    it('should delegate barrel file name from shared DEFAULTS', () => {
      expect(DEFAULT_BARREL_FILE_NAME).toBe(DEFAULTS.barrelFileName);
      expect(DEFAULT_BARREL_FILE_NAME).toBe('index');
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

    it('should not mutate the shared DEFAULTS', () => {
      const result = getDefaultFileExtensions();
      result.push('.d.ts');

      expect([...DEFAULTS.fileExtensions]).not.toContain('.d.ts');
      expect(result).toContain('.d.ts');
    });
  });
});
