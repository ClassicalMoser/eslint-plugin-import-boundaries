/**
 * Unit tests for ancestorBarrelCheckHelpers.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import {
  absolutePathMatchesAncestorBarrel,
  aliasMatchesAncestorBarrel,
} from './ancestorBarrelCheckHelpers';

describe('ancestorBarrelCheckHelpers', () => {
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

  describe('aliasMatchesAncestorBarrel', () => {
    it('should return true when alias matches', () => {
      expect(aliasMatchesAncestorBarrel(entitiesBoundary, '@entities')).toBe(
        true,
      );
    });

    it('should return false when alias does not match', () => {
      expect(aliasMatchesAncestorBarrel(entitiesBoundary, '@queries')).toBe(
        false,
      );
    });

    it('should return false when boundary has no alias', () => {
      const boundaryWithoutAlias: Boundary = createBoundary(
        {
          dir: 'domain/entities',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );
      expect(
        aliasMatchesAncestorBarrel(boundaryWithoutAlias, '@entities'),
      ).toBe(false);
    });
  });

  describe('absolutePathMatchesAncestorBarrel', () => {
    it('should return true when path matches exactly', () => {
      expect(
        absolutePathMatchesAncestorBarrel(
          'src/domain/entities',
          'src/domain/entities',
        ),
      ).toBe(true);
    });

    it('should return true when path matches with trailing slash', () => {
      expect(
        absolutePathMatchesAncestorBarrel(
          'src/domain/entities/',
          'src/domain/entities',
        ),
      ).toBe(true);
    });

    it('should return false when path does not match', () => {
      expect(
        absolutePathMatchesAncestorBarrel(
          'src/domain/queries',
          'src/domain/entities',
        ),
      ).toBe(false);
    });
  });
});
