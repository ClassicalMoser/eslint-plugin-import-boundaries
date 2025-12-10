/**
 * Unit tests for pathFormatValidation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { validatePathFormat } from './pathFormatValidation';

describe('pathFormatValidation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let queriesBoundary: Boundary;

  beforeEach(() => {
    queriesBoundary = createBoundary(
      {
        dir: 'domain/queries',
        alias: '@queries',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );
  });

  describe('validatePathFormat', () => {
    it('should report incorrect path format', () => {
      const { reporter, createFixer } = createMockPorts();

      const result = validatePathFormat({
        rawSpec: '../entities',
        correctPath: '@entities',
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.fix).toBeDefined();
    });

    it('should not report when path is correct', () => {
      const { reporter, createFixer } = createMockPorts();

      const result = validatePathFormat({
        rawSpec: '@entities',
        correctPath: '@entities',
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
      expect(reporter.hasReported('incorrectImportPath')).toBe(false);
    });
  });
});
