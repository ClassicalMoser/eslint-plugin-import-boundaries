/**
 * Unit tests for ancestorBarrelDetection.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { detectAndReportAncestorBarrel } from './ancestorBarrelDetection';

describe('ancestorBarrelDetection', () => {
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

  describe('detectAndReportAncestorBarrel', () => {
    it('should report ancestor barrel imports in alias style', () => {
      const { reporter } = createMockPorts();

      const result = detectAndReportAncestorBarrel({
        rawSpec: '@queries',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'alias',
        reporter,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.boundaryIdentifier).toBe('@queries');
      expect(violation?.fix).toBeUndefined();
    });

    it('should report ancestor barrel imports in absolute style', () => {
      const { reporter } = createMockPorts();

      const result = detectAndReportAncestorBarrel({
        rawSpec: 'src/domain/queries',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'absolute',
        reporter,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
    });

    it('should report ancestor barrel imports in absolute style with trailing slash', () => {
      const { reporter } = createMockPorts();

      const result = detectAndReportAncestorBarrel({
        rawSpec: 'src/domain/queries/',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'absolute',
        reporter,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
    });

    it('should return false when not an ancestor barrel', () => {
      const { reporter } = createMockPorts();

      const result = detectAndReportAncestorBarrel({
        rawSpec: '@entities',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'alias',
        reporter,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });
  });
});
