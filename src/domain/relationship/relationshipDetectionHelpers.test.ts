/**
 * Tests for relationship detection helper functions.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isAncestorBarrelImport,
  isCrossBoundaryImport,
} from './relationshipDetectionHelpers';

describe('relationshipDetectionHelpers', () => {
  const cwd = '/project';
  const rootDir = 'src';

  describe('isAncestorBarrelImport', () => {
    const boundary: Boundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [],
    };

    it('should return true for ancestor barrel in alias style', () => {
      const result = isAncestorBarrelImport(
        '@entities',
        boundary,
        rootDir,
        'alias',
      );
      expect(result).toBe(true);
    });

    it('should return true for ancestor barrel in absolute style', () => {
      const result = isAncestorBarrelImport(
        'src/domain/entities',
        boundary,
        rootDir,
        'absolute',
      );
      expect(result).toBe(true);
    });

    it('should return false for non-ancestor barrel import', () => {
      const result = isAncestorBarrelImport(
        '@queries',
        boundary,
        rootDir,
        'alias',
      );
      expect(result).toBe(false);
    });

    it('should return false for same-boundary non-barrel import', () => {
      const result = isAncestorBarrelImport(
        './sibling',
        boundary,
        rootDir,
        'alias',
      );
      expect(result).toBe(false);
    });

    it('should handle absolute style with trailing slash', () => {
      const result = isAncestorBarrelImport(
        'src/domain/entities/',
        boundary,
        rootDir,
        'absolute',
      );
      expect(result).toBe(true);
    });
  });

  describe('isCrossBoundaryImport', () => {
    const boundary1: Boundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [],
    };

    const boundary2: Boundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      allowImportsFrom: [],
    };

    it('should return true when fileBoundary is null', () => {
      expect(isCrossBoundaryImport(null, boundary1)).toBe(true);
    });

    it('should return true when boundaries are different', () => {
      expect(isCrossBoundaryImport(boundary1, boundary2)).toBe(true);
    });

    it('should return false when boundaries are the same', () => {
      expect(isCrossBoundaryImport(boundary1, boundary1)).toBe(false);
    });

    it('should return true when fileBoundary is null and targetBoundary is null', () => {
      expect(isCrossBoundaryImport(null, null)).toBe(true);
    });
  });
});
