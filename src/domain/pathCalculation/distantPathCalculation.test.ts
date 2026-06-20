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
  const barrelFileName = 'index';

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

  function makeBarrelTarget(targetParts: string[]) {
    const targetDir = path.join(entitiesBoundary.absDir, ...targetParts);
    const targetAbs = path.join(targetDir, `${barrelFileName}.ts`);
    return { targetAbs, targetDir };
  }

  function makeFileTarget(targetParts: string[], fileName: string) {
    const targetDir = path.join(entitiesBoundary.absDir, ...targetParts);
    const targetAbs = path.join(targetDir, `${fileName}.ts`);
    return { targetAbs, targetDir };
  }

  describe('calculateDistantPath', () => {
    it('should return ./segment for subdirectory', () => {
      const targetParts = ['parent', 'subdir'];
      const fileParts = ['parent'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('./subdir');
    });

    it('should return ../segment for cousin (non-top-level)', () => {
      const targetParts = ['parent', 'cousin'];
      const fileParts = ['parent', 'sibling'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('../cousin');
    });

    it('should return full relative path for nested cousin', () => {
      const targetParts = ['parent', 'cousin', 'nested'];
      const fileParts = ['parent', 'sibling'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('../cousin/nested');
    });

    it('should return ./segment for sibling at boundary root', () => {
      const targetParts = ['topLevel'];
      const fileParts: string[] = [];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('./topLevel');
    });

    it('should return alias path for top-level distant import (file in subdir)', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('@entities/topLevel');
    });

    it('should return absolute path for top-level in absolute style', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'absolute',
      );

      expect(result).toBe('src/domain/entities/topLevel');
    });

    it('should return ../segment for cousin (one ../)', () => {
      const targetParts = ['level1', 'level2', 'target'];
      const fileParts = ['level1', 'level2', 'other'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        2,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('../target');
    });

    it('should return alias path with full subpath for requires >1 ../', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'level3', 'other'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('@entities/level1/target');
    });

    it('should return alias path with full subpath for nested file import', () => {
      const targetParts = ['http'];
      const fileParts = ['http', 'sub', 'a', 'b', 'c'];
      const { targetAbs, targetDir } = makeFileTarget(
        targetParts,
        'route-definitions',
      );
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
      );

      expect(result).toBe('@entities/http/route-definitions');
    });
  });

  describe('maxRelativeDepth', () => {
    it('should use alias path for cousin when maxRelativeDepth is 0', () => {
      const targetParts = ['parent', 'cousin'];
      const fileParts = ['parent', 'sibling'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
        0,
      );

      expect(result).toBe('@entities/parent/cousin');
    });

    it('should use relative path for 2-step import when maxRelativeDepth is 2', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'other'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
        2,
      );

      expect(result).toBe('../../target');
    });

    it('should use alias path with full subpath for 3-step import when maxRelativeDepth is 2', () => {
      const targetParts = ['level1', 'target'];
      const fileParts = ['level1', 'level2', 'level3', 'other'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
        2,
      );

      expect(result).toBe('@entities/level1/target');
    });

    it('should still use alias for top-level import regardless of maxRelativeDepth', () => {
      const targetParts = ['topLevel'];
      const fileParts = ['subdir'];
      const { targetAbs, targetDir } = makeBarrelTarget(targetParts);
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        0,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
        99,
      );

      expect(result).toBe('@entities/topLevel');
    });

    it('should use relative path for ancestor file import within maxRelativeDepth', () => {
      const targetParts = ['http'];
      const fileParts = ['http', 'sub', 'a'];
      const { targetAbs, targetDir } = makeFileTarget(
        targetParts,
        'route-definitions',
      );
      const result = calculateDistantPath(
        targetParts,
        fileParts,
        1,
        targetAbs,
        targetDir,
        entitiesBoundary,
        rootDir,
        barrelFileName,
        'alias',
        2,
      );

      expect(result).toBe('../../route-definitions');
    });
  });
});
