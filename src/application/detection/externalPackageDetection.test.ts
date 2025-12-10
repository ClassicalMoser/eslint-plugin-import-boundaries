/**
 * Unit tests for externalPackageDetection.ts
 */

import { describe, expect, it } from 'vitest';
import { isExternalPackage } from './externalPackageDetection';

describe('externalPackageDetection', () => {
  describe('isExternalPackage', () => {
    it('should return true for empty string', () => {
      expect(isExternalPackage('')).toBe(true);
    });

    it('should return false for non-empty path', () => {
      expect(isExternalPackage('/some/path')).toBe(false);
    });
  });
});
