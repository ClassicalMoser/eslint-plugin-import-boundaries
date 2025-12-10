/**
 * Unit tests for bareImportSubpathExtraction.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { extractBareImportSubpath } from './bareImportSubpathExtraction';

describe('bareImportSubpathExtraction', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [],
    };
  });

  describe('extractBareImportSubpath', () => {
    it('should return empty string for exact boundary match', () => {
      const result = extractBareImportSubpath(
        'domain/entities',
        entitiesBoundary,
      );

      expect(result).toBe('');
    });

    it('should extract subpath for prefix match', () => {
      const result = extractBareImportSubpath(
        'domain/entities/army',
        entitiesBoundary,
      );

      expect(result).toBe('army');
    });

    it('should extract subpath for suffix match', () => {
      const result = extractBareImportSubpath(
        'entities/army',
        entitiesBoundary,
      );

      expect(result).toBe('army');
    });

    it('should extract nested subpath', () => {
      const result = extractBareImportSubpath(
        'domain/entities/army/unit',
        entitiesBoundary,
      );

      expect(result).toBe('army/unit');
    });

    it('should handle suffix match edge case (lines 184-188)', () => {
      // Test the loop that finds matching suffix
      const boundary: Boundary = {
        dir: 'domain/entities',
        alias: '@entities',
        absDir: path.resolve('/project', 'src', 'domain/entities'),
      };

      // Test case where rawSpec matches a suffix of boundary.dir
      const result = extractBareImportSubpath('entities', boundary);

      expect(result).toBe('');
    });

    it('should handle suffix match with subpath', () => {
      const boundary: Boundary = {
        dir: 'domain/entities',
        alias: '@entities',
        absDir: path.resolve('/project', 'src', 'domain/entities'),
      };

      const result = extractBareImportSubpath('entities/army', boundary);

      expect(result).toBe('army');
    });

    it('should return empty string when no match found in loop', () => {
      const boundary: Boundary = {
        dir: 'domain/entities',
        alias: '@entities',
        absDir: path.resolve('/project', 'src', 'domain/entities'),
      };

      // This should not match any suffix, so loop completes and returns ''
      const result = extractBareImportSubpath('completely/unrelated', boundary);

      expect(result).toBe('');
    });
  });
});
