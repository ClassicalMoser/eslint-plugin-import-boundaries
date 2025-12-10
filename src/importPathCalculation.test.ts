/**
 * Unit tests for importPathCalculation.ts
 * Tests import path calculation based on file relationships.
 */

import type { Boundary } from './types.js';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateBoundaryRootPath,
  calculateCrossBoundaryPath,
  calculateDistantPath,
  calculateSameBoundaryPath,
  calculateSameDirectoryPath,
  checkAncestorBarrel,
} from './importPathCalculation.js';

describe('importPathCalculation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  // Test boundaries
  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let transformsBoundary: Boundary;

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

    transformsBoundary = {
      dir: 'domain/transforms',
      alias: '@transforms',
      absDir: path.resolve(cwd, rootDir, 'domain/transforms'),
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

  describe('checkAncestorBarrel', () => {
    it('should detect ancestor barrel in alias style', () => {
      const result = checkAncestorBarrel(
        '@entities',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe(true);
    });

    it('should not detect ancestor barrel for different alias', () => {
      const result = checkAncestorBarrel(
        '@queries',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe(false);
    });

    it('should detect ancestor barrel in absolute style', () => {
      const result = checkAncestorBarrel(
        'src/domain/entities',
        entitiesBoundary,
        rootDir,
        'absolute',
      );

      expect(result).toBe(true);
    });

    it('should detect ancestor barrel with trailing slash in absolute style', () => {
      const result = checkAncestorBarrel(
        'src/domain/entities/',
        entitiesBoundary,
        rootDir,
        'absolute',
      );

      expect(result).toBe(true);
    });

    it('should not detect ancestor barrel for different path in absolute style', () => {
      const result = checkAncestorBarrel(
        'src/domain/queries',
        entitiesBoundary,
        rootDir,
        'absolute',
      );

      expect(result).toBe(false);
    });
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

  describe('calculateSameDirectoryPath', () => {
    it('should return relative path for same directory file', () => {
      const targetAbs = path.resolve(cwd, rootDir, 'domain/queries', 'file.ts');
      const result = calculateSameDirectoryPath(targetAbs, 'index');

      expect(result).toBe('./file');
    });

    it('should return null for ancestor barrel (index file)', () => {
      const targetAbs = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'index.ts',
      );
      const result = calculateSameDirectoryPath(targetAbs, 'index');

      expect(result).toBeNull();
    });
  });

  describe('calculateDistantPath', () => {
    it('should return ./segment for subdirectory', () => {
      const targetParts = ['parent', 'subdir'];
      const fileParts = ['parent'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1, // firstDifferingIndex (at fileParts.length)
        'subdir',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('./subdir');
    });

    it('should return ../segment for cousin (non-top-level)', () => {
      const targetParts = ['parent', 'cousin'];
      const fileParts = ['parent', 'sibling'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1, // firstDifferingIndex (at fileParts.length - 1)
        'cousin',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('../cousin');
    });

    it('should return ./segment for sibling at boundary root', () => {
      const targetParts = ['topLevel'];
      const fileParts: string[] = [];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0, // firstDifferingIndex (both at root = siblings)
        'topLevel',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('./topLevel');
    });

    it('should return alias path for top-level distant import (file in subdir)', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0, // firstDifferingIndex (top-level: target at root, file in subdir)
        'topLevel',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('@entities/topLevel');
    });

    it('should return absolute path for top-level in absolute style', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0,
        'topLevel',
        entitiesBoundary,
        rootDir,
        'absolute',
      );

      expect(result).toBe('src/domain/entities/topLevel');
    });

    it('should return ../segment for cousin (one ../)', () => {
      const targetParts = ['level1', 'level2', 'target'];
      const fileParts = ['level1', 'level2', 'other'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        2, // firstDifferingIndex (cousin - one ../)
        'target',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('../target');
    });

    it('should return alias path for requires >1 ../', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'level3', 'other'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1, // firstDifferingIndex (requires >1 ../)
        'target',
        entitiesBoundary,
        rootDir,
        'alias',
      );

      expect(result).toBe('@entities/target');
    });
  });

  describe('calculateSameBoundaryPath', () => {
    it('should calculate path for boundary root file', () => {
      const targetDir = entitiesBoundary.absDir;
      const targetAbs = path.join(targetDir, 'rootFile.ts');
      const fileDir = path.join(entitiesBoundary.absDir, 'subdir');
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        entitiesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('@entities/rootFile');
    });

    it('should calculate path for same directory file', () => {
      const targetDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const targetAbs = path.join(targetDir, 'file.ts');
      const fileDir = targetDir;
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        queriesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('./file');
    });

    it('should calculate path for subdirectory', () => {
      const targetDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const targetAbs = path.join(targetDir, 'index.ts');
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        queriesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('./subdir');
    });

    it('should calculate path for cousin', () => {
      const targetDir = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'parent',
        'cousin',
      );
      const targetAbs = path.join(targetDir, 'index.ts');
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'parent',
        'sibling',
      );
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        queriesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('../cousin');
    });

    it('should calculate path for top-level distant import', () => {
      const targetDir = path.resolve(cwd, rootDir, 'domain/queries', 'topLevel');
      const targetAbs = path.join(targetDir, 'index.ts');
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        queriesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBe('@queries/topLevel');
    });

    it('should return null for ancestor barrel at boundary root', () => {
      const targetDir = entitiesBoundary.absDir;
      const targetAbs = path.join(targetDir, 'index.ts');
      const fileDir = path.join(entitiesBoundary.absDir, 'subdir');
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        entitiesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBeNull();
    });

    it('should return null for ancestor barrel in same directory', () => {
      const targetDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const targetAbs = path.join(targetDir, 'index.ts');
      const fileDir = targetDir;
      const result = calculateSameBoundaryPath(
        targetDir,
        targetAbs,
        fileDir,
        queriesBoundary,
        rootDir,
        'index',
        'alias',
      );

      expect(result).toBeNull();
    });
  });
});

