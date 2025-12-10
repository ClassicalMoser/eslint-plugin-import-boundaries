/**
 * Unit tests for boundaryRootPathCalculation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateBoundaryRootPath } from './boundaryRootPathCalculation';

describe('boundaryRootPathCalculation', () => {
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

  describe('calculateBoundaryRootPath', () => {
    it('should return alias path for boundary root file in alias style', () => {
      const targetAbs = path.join(entitiesBoundary.absDir, 'rootFile.ts');
      const result = calculateBoundaryRootPath(
        targetAbs,
        entitiesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('@entities/rootFile');
    });

    it('should return absolute path for boundary root file in absolute style', () => {
      const targetAbs = path.join(entitiesBoundary.absDir, 'rootFile.ts');
      const result = calculateBoundaryRootPath(
        targetAbs,
        entitiesBoundary,
        rootDir,
        'index',
        'absolute',
      );

      expect(result).toBe('src/domain/entities/rootFile');
    });

    it('should return null for ancestor barrel (index file)', () => {
      const targetAbs = path.join(entitiesBoundary.absDir, 'index.ts');
      const result = calculateBoundaryRootPath(
        targetAbs,
        entitiesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBeNull();
    });
  });
});
