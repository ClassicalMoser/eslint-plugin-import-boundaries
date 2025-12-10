/**
 * Unit tests for pathUtilsHelpers.ts
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isEmptyRelativePath,
  isNotCurrentDir,
  isOutsidePath,
  isTruthy,
} from './pathUtilsHelpers';

describe('pathUtilsHelpers', () => {
  describe('isEmptyRelativePath', () => {
    it('should return true for empty string', () => {
      expect(isEmptyRelativePath('')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmptyRelativePath('a')).toBe(false);
      expect(isEmptyRelativePath('a/b')).toBe(false);
      expect(isEmptyRelativePath('..')).toBe(false);
    });
  });

  describe('isOutsidePath', () => {
    it('should return true for paths starting with ..', () => {
      expect(isOutsidePath('../a')).toBe(true);
      expect(isOutsidePath('../../a')).toBe(true);
    });

    it('should return true for absolute paths', () => {
      expect(isOutsidePath('/a/b')).toBe(true);
      // Use path.resolve to create a proper absolute path for the platform
      expect(isOutsidePath(path.resolve('/a/b'))).toBe(true);
    });

    it('should return false for relative paths inside directory', () => {
      expect(isOutsidePath('a')).toBe(false);
      expect(isOutsidePath('a/b')).toBe(false);
      expect(isOutsidePath('subdir/file')).toBe(false);
    });
  });

  describe('isTruthy', () => {
    it('should return true for non-empty strings', () => {
      expect(isTruthy('a')).toBe(true);
      expect(isTruthy('abc')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isTruthy('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTruthy(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTruthy(undefined)).toBe(false);
    });
  });

  describe('isNotCurrentDir', () => {
    it('should return true for non-current-dir strings', () => {
      expect(isNotCurrentDir('a')).toBe(true);
      expect(isNotCurrentDir('b')).toBe(true);
      expect(isNotCurrentDir('')).toBe(true);
    });

    it('should return false for current directory marker', () => {
      expect(isNotCurrentDir('.')).toBe(false);
    });
  });
});

