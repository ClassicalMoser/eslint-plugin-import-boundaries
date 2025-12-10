/**
 * Tests for bare import subpath extraction helper functions.
 */

import { describe, expect, it } from 'vitest';
import {
  extractExactMatchSubpath,
  extractPrefixMatchSubpath,
  extractSuffixMatchSubpath,
} from './bareImportSubpathExtractionHelpers';

describe('bareImportSubpathExtractionHelpers', () => {
  describe('extractExactMatchSubpath', () => {
    it('should return empty string for exact match', () => {
      const result = extractExactMatchSubpath(
        'domain/entities',
        'domain/entities',
      );
      expect(result).toBe('');
    });

    it('should return null for no match', () => {
      const result = extractExactMatchSubpath(
        'domain/queries',
        'domain/entities',
      );
      expect(result).toBeNull();
    });

    it('should return null for prefix match (not exact)', () => {
      const result = extractExactMatchSubpath(
        'domain/entities/army',
        'domain/entities',
      );
      expect(result).toBeNull();
    });
  });

  describe('extractPrefixMatchSubpath', () => {
    it('should return subpath for prefix match', () => {
      const result = extractPrefixMatchSubpath(
        'domain/entities/army',
        'domain/entities',
      );
      expect(result).toBe('army');
    });

    it('should return nested subpath for prefix match', () => {
      const result = extractPrefixMatchSubpath(
        'domain/entities/army/unit',
        'domain/entities',
      );
      expect(result).toBe('army/unit');
    });

    it('should return null for exact match', () => {
      const result = extractPrefixMatchSubpath(
        'domain/entities',
        'domain/entities',
      );
      expect(result).toBeNull();
    });

    it('should return null for no match', () => {
      const result = extractPrefixMatchSubpath(
        'domain/queries',
        'domain/entities',
      );
      expect(result).toBeNull();
    });
  });

  describe('extractSuffixMatchSubpath', () => {
    it('should return empty string for exact suffix match', () => {
      const result = extractSuffixMatchSubpath('entities', 'domain/entities');
      expect(result).toBe('');
    });

    it('should return subpath for suffix match with subpath', () => {
      const result = extractSuffixMatchSubpath(
        'entities/army',
        'domain/entities',
      );
      expect(result).toBe('army');
    });

    it('should return nested subpath for suffix match', () => {
      const result = extractSuffixMatchSubpath(
        'entities/army/unit',
        'domain/entities',
      );
      expect(result).toBe('army/unit');
    });

    it('should return empty string when no match found', () => {
      const result = extractSuffixMatchSubpath(
        'completely/unrelated',
        'domain/entities',
      );
      expect(result).toBe('');
    });

    it('should handle multi-segment suffix match', () => {
      // 'domain/entities/army' should match 'src/domain/entities' via 'domain/entities' suffix
      const result = extractSuffixMatchSubpath(
        'domain/entities/army',
        'src/domain/entities',
      );
      expect(result).toBe('army');
    });

    it('should handle single-segment boundary', () => {
      const result = extractSuffixMatchSubpath('entities/army', 'entities');
      expect(result).toBe('army');
    });
  });
});
