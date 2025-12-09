/**
 * Unit tests for pathUtils.ts
 * Tests path utility functions.
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getBasenameWithoutExt,
  hasExtension,
  isInsideDir,
} from './pathUtils.js';

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

  describe('hasExtension', () => {
    it('should return true for paths with extensions', () => {
      expect(hasExtension('file.ts')).toBe(true);
      expect(hasExtension('file.tsx')).toBe(true);
      expect(hasExtension('file.js')).toBe(true);
      expect(hasExtension('file.jsx')).toBe(true);
      expect(hasExtension('file.mjs')).toBe(true);
      expect(hasExtension('file.cjs')).toBe(true);
    });

    it('should return false for paths without extensions', () => {
      expect(hasExtension('file')).toBe(false);
      expect(hasExtension('dir/file')).toBe(false);
      expect(hasExtension('dir/subdir')).toBe(false);
    });

    it('should filter by specific extensions when provided', () => {
      const extensions = ['.ts', '.tsx'];
      expect(hasExtension('file.ts', extensions)).toBe(true);
      expect(hasExtension('file.tsx', extensions)).toBe(true);
      expect(hasExtension('file.js', extensions)).toBe(false);
      expect(hasExtension('file.jsx', extensions)).toBe(false);
    });
  });

  describe('getBasenameWithoutExt', () => {
    it('should return basename without extension', () => {
      expect(getBasenameWithoutExt('/a/b/file.ts')).toBe('file');
      expect(getBasenameWithoutExt('/a/b/file.tsx')).toBe('file');
      expect(getBasenameWithoutExt('/a/b/file.js')).toBe('file');
      expect(getBasenameWithoutExt('/a/b/index.ts')).toBe('index');
      expect(getBasenameWithoutExt('/a/b/index.js')).toBe('index');
    });

    it('should return full basename if no extension', () => {
      expect(getBasenameWithoutExt('/a/b/file')).toBe('file');
      expect(getBasenameWithoutExt('/a/b/dir')).toBe('dir');
    });
  });
});
