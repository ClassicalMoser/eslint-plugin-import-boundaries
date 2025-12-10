/**
 * Unit tests for ancestorBarrelDetectionHelpers.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { isAncestorBarrelImport } from './ancestorBarrelDetectionHelpers';

describe('ancestorBarrelDetectionHelpers', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let queriesBoundary: Boundary;

  beforeEach(() => {
    queriesBoundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      allowImportsFrom: [],
    };
  });

  describe('isAncestorBarrelImport', () => {
    it('should return true for ancestor barrel in alias style', () => {
      expect(
        isAncestorBarrelImport('@queries', queriesBoundary, rootDir, 'alias'),
      ).toBe(true);
    });

    it('should return false for different alias', () => {
      expect(
        isAncestorBarrelImport('@entities', queriesBoundary, rootDir, 'alias'),
      ).toBe(false);
    });

    it('should return true for ancestor barrel in absolute style', () => {
      expect(
        isAncestorBarrelImport(
          'src/domain/queries',
          queriesBoundary,
          rootDir,
          'absolute',
        ),
      ).toBe(true);
    });

    it('should return true for ancestor barrel with trailing slash in absolute style', () => {
      expect(
        isAncestorBarrelImport(
          'src/domain/queries/',
          queriesBoundary,
          rootDir,
          'absolute',
        ),
      ).toBe(true);
    });
  });
});

