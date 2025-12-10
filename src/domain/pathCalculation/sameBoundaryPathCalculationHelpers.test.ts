/**
 * Unit tests for sameBoundaryPathCalculationHelpers.ts
 */

import { describe, expect, it } from 'vitest';
import {
  areBothPathsExhausted,
  hasValidFirstDifferingSegment,
  isBoundaryRoot,
} from './sameBoundaryPathCalculationHelpers';

describe('sameBoundaryPathCalculationHelpers', () => {
  describe('isBoundaryRoot', () => {
    it('should return true for empty array', () => {
      expect(isBoundaryRoot([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isBoundaryRoot(['a'])).toBe(false);
      expect(isBoundaryRoot(['a', 'b'])).toBe(false);
    });
  });

  describe('areBothPathsExhausted', () => {
    it('should return true when both paths are exhausted', () => {
      expect(areBothPathsExhausted(2, ['a', 'b'], ['a', 'b'])).toBe(true);
      expect(areBothPathsExhausted(3, ['a', 'b'], ['a', 'b', 'c'])).toBe(true);
    });

    it('should return false when target parts remain', () => {
      expect(areBothPathsExhausted(1, ['a', 'b'], ['a'])).toBe(false);
    });

    it('should return false when file parts remain', () => {
      expect(areBothPathsExhausted(1, ['a'], ['a', 'b'])).toBe(false);
    });
  });

  describe('hasValidFirstDifferingSegment', () => {
    it('should return true for non-empty string', () => {
      expect(hasValidFirstDifferingSegment('a')).toBe(true);
      expect(hasValidFirstDifferingSegment('b')).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(hasValidFirstDifferingSegment(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasValidFirstDifferingSegment('')).toBe(false);
    });
  });
});
