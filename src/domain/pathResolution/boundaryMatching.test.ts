/**
 * Unit tests for boundaryMatching.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { findMatchingBoundary } from './boundaryMatching';

describe('boundaryMatching', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );

    queriesBoundary = createBoundary(
      {
        dir: 'domain/queries',
        alias: '@queries',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );
  });

  describe('findMatchingBoundary', () => {
    it('should find boundary by exact dir match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('domain/entities', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should find boundary by prefix match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('domain/entities/army', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should find boundary by suffix match', () => {
      // This tests line 25: if (importParts.length > 0 && boundaryParts.length > 0)
      // When the first check (line 17) doesn't match, we reach line 25
      // Both importParts and boundaryParts have length > 0, so condition is true
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('entities/army', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should return null for no match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('unknown/path', boundaries);

      expect(result).toBeNull();
    });

    it('should handle empty import parts', () => {
      const boundaries = [entitiesBoundary];
      // Empty string should not match
      const result = findMatchingBoundary('', boundaries);

      expect(result).toBeNull();
    });

    it('should handle boundary with empty dir', () => {
      const emptyBoundary: Boundary = createBoundary(
        {
          dir: '',
          alias: '@root',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );
      const boundaries = [emptyBoundary];
      // When boundary dir is empty, boundaryParts.length is 0
      // This tests line 25: if (importParts.length > 0 && boundaryParts.length > 0)
      // When boundaryParts.length is 0, the condition is false
      const result = findMatchingBoundary('some/path', boundaries);

      // Should not match due to empty boundary dir
      expect(result).toBeNull();
    });

    it('should handle case where both importParts and boundaryParts have length > 0', () => {
      // Test line 25: if (importParts.length > 0 && boundaryParts.length > 0)
      // Branch 1: both true - importParts.length > 0 && boundaryParts.length > 0
      const boundaries = [entitiesBoundary];
      const result = findMatchingBoundary('entities/army/unit', boundaries);

      // Should match via suffix matching
      expect(result).toBe(entitiesBoundary);
    });

    it('should handle all branch combinations for importParts and boundaryParts at line 25', () => {
      // Test line 25: if (importParts.length > 0 && boundaryParts.length > 0)
      // Need to test all branch combinations:
      // 1. importParts.length > 0 = true, boundaryParts.length > 0 = true → condition true
      // 2. importParts.length > 0 = true, boundaryParts.length > 0 = false → condition false
      // 3. importParts.length > 0 = false → condition false (short-circuit, doesn't evaluate second)
      // 4. importParts.length > 0 = false, boundaryParts.length > 0 = false → condition false (short-circuit)

      // Branch 1: both true - already tested in "should find boundary by suffix match"
      const boundaries1 = [entitiesBoundary];
      const result1 = findMatchingBoundary('entities/army', boundaries1);
      expect(result1).toBe(entitiesBoundary);

      // Branch 2: importParts.length > 0 = true, boundaryParts.length > 0 = false
      // Need a boundary with empty dir but non-empty import to reach line 25
      const emptyBoundary: Boundary = createBoundary(
        {
          dir: '',
          alias: '@root',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );
      const boundaries2 = [emptyBoundary];
      // 'some/path' doesn't match line 17 (b.dir is empty, so rawSpec !== b.dir and !rawSpec.startsWith(''))
      // So we reach line 25 with importParts.length > 0, boundaryParts.length === 0
      const result2 = findMatchingBoundary('some/path', boundaries2);
      expect(result2).toBeNull();

      // Branch 3: importParts.length === 0 (short-circuit)
      // Empty string with non-empty boundary dir - line 17 won't match, so we reach line 25
      const boundaries3 = [entitiesBoundary];
      // '' doesn't match 'domain/entities' on line 17, so we reach line 25
      // importParts.length === 0, so condition is false (short-circuit)
      const result3 = findMatchingBoundary('', boundaries3);
      expect(result3).toBeNull();
    });
  });
});
