/**
 * Unit tests for ancestorBarrelCheck.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { checkAncestorBarrel } from './ancestorBarrelCheck';

describe('ancestorBarrelCheck', () => {
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
});
