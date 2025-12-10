/**
 * Unit tests for crossBoundaryPathCalculation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateCrossBoundaryPath } from './crossBoundaryPathCalculation';

describe('crossBoundaryPathCalculation', () => {
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

  describe('calculateCrossBoundaryPath', () => {
    it('should return alias for alias style', () => {
      const result = calculateCrossBoundaryPath(
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('@entities');
    });

    it('should return absolute path for absolute style', () => {
      const result = calculateCrossBoundaryPath(
        entitiesBoundary,
        rootDir,
        'absolute',
      );

      expect(result).toBe('src/domain/entities');
    });

    it('should return absolute path when alias missing in alias style', () => {
      const boundaryWithoutAlias: Boundary = {
        ...entitiesBoundary,
        alias: undefined,
      };
      const result = calculateCrossBoundaryPath(
        boundaryWithoutAlias,
        rootDir,
        'alias',
      );

      expect(result).toBe('src/domain/entities');
    });

    it('should return UNKNOWN_BOUNDARY for null boundary', () => {
      const result = calculateCrossBoundaryPath(null, rootDir, 'alias');

      expect(result).toBe('UNKNOWN_BOUNDARY');
    });
  });
});
