/**
 * Unit tests for distantPathCalculation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateDistantPath } from './distantPathCalculation';

describe('distantPathCalculation', () => {
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
});
