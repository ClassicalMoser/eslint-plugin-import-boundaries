/**
 * Unit tests for aliasSubpathValidationHelpers.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { shouldReportAliasSubpathViolation } from './aliasSubpathValidationHelpers';

describe('aliasSubpathValidationHelpers', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;

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
  });

  describe('shouldReportAliasSubpathViolation', () => {
    it('should return true when all conditions are met', () => {
      expect(
        shouldReportAliasSubpathViolation(entitiesBoundary, queriesBoundary),
      ).toBe(true);
    });

    it('should return false when targetBoundary is undefined', () => {
      expect(shouldReportAliasSubpathViolation(undefined, queriesBoundary)).toBe(
        false,
      );
    });

    it('should return false when targetBoundary has no alias', () => {
      const boundaryWithoutAlias: Boundary = {
        ...entitiesBoundary,
        alias: undefined,
      };
      expect(
        shouldReportAliasSubpathViolation(boundaryWithoutAlias, queriesBoundary),
      ).toBe(false);
    });

    it('should return false when fileBoundary is null', () => {
      expect(shouldReportAliasSubpathViolation(entitiesBoundary, null)).toBe(
        false,
      );
    });

    it('should return false when boundaries are the same', () => {
      expect(
        shouldReportAliasSubpathViolation(entitiesBoundary, entitiesBoundary),
      ).toBe(false);
    });
  });
});

