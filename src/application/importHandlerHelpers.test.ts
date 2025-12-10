/**
 * Tests for import handler helper functions.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBoundary } from '../../src/__tests__/boundaryTestHelpers.js';
import {
  isNullPath,
  isUnknownBoundary,
  isValidPath,
  shouldDetectAncestorBarrel,
  shouldValidateAliasSubpath,
  shouldValidateBoundaryRules,
} from './importHandlerHelpers';

describe('importHandlerHelpers', () => {
  const cwd = '/project';
  const rootDir = 'src';

  describe('shouldValidateAliasSubpath', () => {
    it('should return true for alias style', () => {
      expect(shouldValidateAliasSubpath('alias')).toBe(true);
    });

    it('should return false for absolute style', () => {
      expect(shouldValidateAliasSubpath('absolute')).toBe(false);
    });
  });

  describe('shouldValidateBoundaryRules', () => {
    const boundary1: Boundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );

    const boundary2: Boundary = createBoundary(
      {
        dir: 'domain/queries',
        alias: '@queries',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );

    it('should return true when all conditions are met', () => {
      expect(shouldValidateBoundaryRules(false, boundary1, boundary2)).toBe(
        true,
      );
    });

    it('should return false when skipBoundaryRules is true', () => {
      expect(shouldValidateBoundaryRules(true, boundary1, boundary2)).toBe(
        false,
      );
    });

    it('should return false when fileBoundary is null', () => {
      expect(shouldValidateBoundaryRules(false, null, boundary2)).toBe(false);
    });

    it('should return false when targetBoundary is null', () => {
      expect(shouldValidateBoundaryRules(false, boundary1, null)).toBe(false);
    });

    it('should return false when boundaries are the same', () => {
      expect(shouldValidateBoundaryRules(false, boundary1, boundary1)).toBe(
        false,
      );
    });

    it('should return false when both boundaries are null', () => {
      expect(shouldValidateBoundaryRules(false, null, null)).toBe(false);
    });
  });

  describe('shouldDetectAncestorBarrel', () => {
    const boundary: Boundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );

    it('should return true when correctPath is null and fileBoundary exists', () => {
      expect(shouldDetectAncestorBarrel(null, boundary)).toBe(true);
    });

    it('should return false when correctPath is not null', () => {
      expect(shouldDetectAncestorBarrel('@entities', boundary)).toBe(false);
    });

    it('should return false when fileBoundary is null', () => {
      expect(shouldDetectAncestorBarrel(null, null)).toBe(false);
    });

    it('should return false when correctPath is not null and fileBoundary is null', () => {
      expect(shouldDetectAncestorBarrel('@entities', null)).toBe(false);
    });
  });

  describe('isNullPath', () => {
    it('should return true when correctPath is null', () => {
      expect(isNullPath(null)).toBe(true);
    });

    it('should return false when correctPath is a string', () => {
      expect(isNullPath('@entities')).toBe(false);
    });

    it('should return false when correctPath is UNKNOWN_BOUNDARY', () => {
      expect(isNullPath('UNKNOWN_BOUNDARY')).toBe(false);
    });
  });

  describe('isUnknownBoundary', () => {
    it('should return true when correctPath is UNKNOWN_BOUNDARY', () => {
      expect(isUnknownBoundary('UNKNOWN_BOUNDARY')).toBe(true);
    });

    it('should return false when correctPath is a normal path', () => {
      expect(isUnknownBoundary('@entities')).toBe(false);
    });

    it('should return false when correctPath is null', () => {
      expect(isUnknownBoundary(null)).toBe(false);
    });
  });

  describe('isValidPath', () => {
    it('should return true for valid non-empty paths', () => {
      expect(isValidPath('@entities')).toBe(true);
      expect(isValidPath('./sibling')).toBe(true);
      expect(isValidPath('../cousin')).toBe(true);
      expect(isValidPath('src/domain/entities')).toBe(true);
    });

    it('should return false when correctPath is null', () => {
      expect(isValidPath(null)).toBe(false);
    });

    it('should return false when correctPath is UNKNOWN_BOUNDARY', () => {
      expect(isValidPath('UNKNOWN_BOUNDARY')).toBe(false);
    });

    it('should return false when correctPath is an empty string', () => {
      expect(isValidPath('')).toBe(false);
    });

    it('should return false when correctPath is only whitespace', () => {
      expect(isValidPath('   ')).toBe(false);
      expect(isValidPath('\t\n')).toBe(false);
    });
  });
});
