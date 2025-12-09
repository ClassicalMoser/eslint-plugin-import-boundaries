/**
 * Unit tests for pathUtils.ts
 * Tests path utility functions.
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { isInsideDir } from './pathUtils.js';

describe('pathUtils', () => {
  describe('isInsideDir', () => {
    it('should return true for file inside directory', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/queries/getLine.ts';

      expect(isInsideDir(absDir, absPath)).toBe(true);
    });

    it('should return true for file in nested directory', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/queries/subdir/deep/file.ts';

      expect(isInsideDir(absDir, absPath)).toBe(true);
    });

    it('should return true when path equals directory', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/queries';

      expect(isInsideDir(absDir, absPath)).toBe(true);
    });

    it('should return false for file outside directory (sibling)', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/entities/army.ts';

      expect(isInsideDir(absDir, absPath)).toBe(false);
    });

    it('should return false for file outside directory (parent)', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/file.ts';

      expect(isInsideDir(absDir, absPath)).toBe(false);
    });

    it('should return false for file outside directory (cousin)', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/other/file.ts';

      expect(isInsideDir(absDir, absPath)).toBe(false);
    });

    it('should handle Windows paths', () => {
      // Use path.resolve to ensure proper path normalization on Windows
      const absDir = path.resolve('C:/project/src/domain/queries');
      const absPath = path.resolve('C:/project/src/domain/queries/file.ts');

      expect(isInsideDir(absDir, absPath)).toBe(true);
    });

    it('should handle relative paths correctly', () => {
      const absDir = '/project/src/domain/queries';
      const absPath = '/project/src/domain/queries/../entities/file.ts';

      // Even though the path contains .., path.relative handles it correctly
      expect(isInsideDir(absDir, absPath)).toBe(false);
    });
  });
});

