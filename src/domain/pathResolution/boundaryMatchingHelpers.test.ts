/**
 * Tests for boundary matching helper functions.
 */

import { describe, expect, it } from 'vitest';
import {
  hasEmptyPath,
  matchesBoundaryDir,
  matchesBoundarySuffix,
} from './boundaryMatchingHelpers';

describe('boundaryMatchingHelpers', () => {
  describe('matchesBoundaryDir', () => {
    it('should return true for exact match', () => {
      expect(matchesBoundaryDir('domain/entities', 'domain/entities')).toBe(
        true,
      );
    });

    it('should return true for prefix match', () => {
      expect(
        matchesBoundaryDir('domain/entities/army', 'domain/entities'),
      ).toBe(true);
    });

    it('should return false for no match', () => {
      expect(matchesBoundaryDir('domain/queries', 'domain/entities')).toBe(
        false,
      );
    });

    it('should return false for partial match without slash', () => {
      expect(matchesBoundaryDir('domain/entitiesX', 'domain/entities')).toBe(
        false,
      );
    });
  });

  describe('hasEmptyPath', () => {
    it('should return true when rawSpec is empty', () => {
      expect(hasEmptyPath('', 'domain/entities')).toBe(true);
    });

    it('should return true when boundaryDir is empty', () => {
      expect(hasEmptyPath('some/path', '')).toBe(true);
    });

    it('should return true when both are empty', () => {
      expect(hasEmptyPath('', '')).toBe(true);
    });

    it('should return false when neither is empty', () => {
      expect(hasEmptyPath('some/path', 'domain/entities')).toBe(false);
    });
  });

  describe('matchesBoundarySuffix', () => {
    it('should return true for exact suffix match', () => {
      expect(matchesBoundarySuffix('entities', 'domain/entities')).toBe(true);
    });

    it('should return true for suffix match with subpath', () => {
      expect(matchesBoundarySuffix('entities/army', 'domain/entities')).toBe(
        true,
      );
    });

    it('should return true for multi-segment suffix match', () => {
      expect(
        matchesBoundarySuffix('entities/army', 'src/domain/entities'),
      ).toBe(true);
    });

    it('should return false for no match', () => {
      expect(matchesBoundarySuffix('queries', 'domain/entities')).toBe(false);
    });

    it('should return false for partial match', () => {
      expect(matchesBoundarySuffix('entitie', 'domain/entities')).toBe(false);
    });

    it('should handle single-segment boundary', () => {
      expect(matchesBoundarySuffix('entities', 'entities')).toBe(true);
    });

    it('should handle matching from middle of boundary dir', () => {
      // 'entities/army' should match 'src/domain/entities' via 'domain/entities' suffix
      expect(
        matchesBoundarySuffix('domain/entities/army', 'src/domain/entities'),
      ).toBe(true);
    });
  });
});
