/**
 * Unit tests for aliasSubpathValidation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { validateAliasSubpath } from './aliasSubpathValidation';

describe('aliasSubpathValidation', () => {
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

  describe('validateAliasSubpath', () => {
    it('should flag cross-boundary alias subpaths', () => {
      const { reporter, createFixer } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary];

      const result = validateAliasSubpath({
        rawSpec: '@entities/army',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('@entities');
      expect(violation?.fix).toBeDefined();
    });

    it('should not flag subpaths within same boundary', () => {
      const { reporter, createFixer } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary];

      const result = validateAliasSubpath({
        rawSpec: '@queries/otherSubdir',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should return false when not a subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary];

      const result = validateAliasSubpath({
        rawSpec: '@entities',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });
  });
});
