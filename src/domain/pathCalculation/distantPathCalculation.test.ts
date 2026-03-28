/**
 * Unit tests for distantPathCalculation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { calculateDistantPath } from './distantPathCalculation';

describe('distantPathCalculation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );
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

  describe('maxRelativeDepth', () => {
    it('should use alias path for cousin when maxRelativeDepth is 0', () => {
      const targetParts = ['parent', 'cousin'];
      const fileParts = ['parent', 'sibling'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        'cousin',
        entitiesBoundary,
        rootDir,
        'alias',
        0, // maxRelativeDepth: 0 means never use relative paths
      );

      expect(result).toBe('@entities/cousin');
    });

    it('should use relative path for 2-step import when maxRelativeDepth is 2', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'other'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1, // steps = fileParts.length - firstDifferingIndex = 3 - 1 = 2
        'target',
        entitiesBoundary,
        rootDir,
        'alias',
        2, // maxRelativeDepth: 2 allows ../../
      );

      expect(result).toBe('../../target');
    });

    it('should use alias path for 3-step import when maxRelativeDepth is 2', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'level3', 'other'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1, // steps = 4 - 1 = 3, exceeds maxRelativeDepth
        'target',
        entitiesBoundary,
        rootDir,
        'alias',
        2,
      );

      expect(result).toBe('@entities/target');
    });

    it('should still use alias for top-level import regardless of maxRelativeDepth', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0, // top-level: target at root, file in subdir
        'topLevel',
        entitiesBoundary,
        rootDir,
        'alias',
        99, // even with very high maxRelativeDepth, top-level uses alias
      );

      expect(result).toBe('@entities/topLevel');
    });
  });
});
