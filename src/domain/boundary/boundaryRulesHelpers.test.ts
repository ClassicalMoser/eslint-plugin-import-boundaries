/**
 * Unit tests for boundaryRulesHelpers.ts
 */

import type { Boundary } from '@shared';
import { describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import {
  hasAllowList,
  hasDenyList,
  isInAllowList,
  isInDenyList,
} from './boundaryRulesHelpers';
import { matchesBoundaryIdentifier } from './boundaryRulesHelpers.test-utils.js';

describe('boundaryRulesHelpers', () => {
  const entitiesBoundary: Boundary = createBoundary({
    dir: 'domain/entities',
    alias: '@entities',
  });

  const queriesBoundary: Boundary = createBoundary({
    dir: 'domain/queries',
    alias: '@queries',
  });

  describe('hasAllowList', () => {
    it('should return true when allowImportsFrom exists and has items', () => {
      const boundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: ['@queries'],
      });
      expect(hasAllowList(boundary)).toBe(true);
    });

    it('should return false when allowImportsFrom is undefined', () => {
      expect(hasAllowList(entitiesBoundary)).toBe(false);
    });

    it('should return false when allowImportsFrom is empty', () => {
      const boundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      });
      expect(hasAllowList(boundary)).toBe(false);
    });
  });

  describe('hasDenyList', () => {
    it('should return true when denyImportsFrom exists and has items', () => {
      const boundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        denyImportsFrom: ['@queries'],
      });
      expect(hasDenyList(boundary)).toBe(true);
    });

    it('should return false when denyImportsFrom is undefined', () => {
      expect(hasDenyList(entitiesBoundary)).toBe(false);
    });

    it('should return false when denyImportsFrom is empty', () => {
      const boundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        denyImportsFrom: [],
      });
      expect(hasDenyList(boundary)).toBe(false);
    });
  });

  describe('isInDenyList', () => {
    it('should return true when target is in deny list', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        denyImportsFrom: ['@queries'],
      });
      expect(
        isInDenyList(fileBoundary, queriesBoundary, matchesBoundaryIdentifier),
      ).toBe(true);
    });

    it('should return false when target is not in deny list', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        denyImportsFrom: ['@events'],
      });
      expect(
        isInDenyList(fileBoundary, queriesBoundary, matchesBoundaryIdentifier),
      ).toBe(false);
    });

    it('should return false when deny list does not exist', () => {
      expect(
        isInDenyList(
          entitiesBoundary,
          queriesBoundary,
          matchesBoundaryIdentifier,
        ),
      ).toBe(false);
    });
  });

  describe('isInAllowList', () => {
    it('should return true when target is in allow list', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: ['@queries'],
      });
      expect(
        isInAllowList(fileBoundary, queriesBoundary, matchesBoundaryIdentifier),
      ).toBe(true);
    });

    it('should return false when target is not in allow list', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: ['@events'],
      });
      expect(
        isInAllowList(fileBoundary, queriesBoundary, matchesBoundaryIdentifier),
      ).toBe(false);
    });

    it('should return false when allow list does not exist', () => {
      expect(
        isInAllowList(
          entitiesBoundary,
          queriesBoundary,
          matchesBoundaryIdentifier,
        ),
      ).toBe(false);
    });
  });
});
