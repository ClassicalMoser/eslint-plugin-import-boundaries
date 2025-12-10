/**
 * Unit tests for boundaryMatching.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { findMatchingBoundary } from './boundaryMatching';

describe('boundaryMatching', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [],
    };

    queriesBoundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      allowImportsFrom: [],
    };
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
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('entities/army', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should return null for no match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('unknown/path', boundaries);

      expect(result).toBeNull();
    });
  });
});
