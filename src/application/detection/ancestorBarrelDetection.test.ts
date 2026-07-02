/**
 * Unit tests for ancestorBarrelDetection.ts
 */

import type { Boundary } from '@shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary, createMockPorts } from '../../__tests__/testUtils.js';
import { reportAncestorDirectoryImport } from './ancestorBarrelDetection';

describe('ancestorBarrelDetection', () => {
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

  describe('reportAncestorDirectoryImport', () => {
    it('should report a non-fixable ancestorBarrelImport violation', () => {
      const { reporter } = createMockPorts();

      reportAncestorDirectoryImport({
        fileBoundary: queriesBoundary,
        reporter,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.boundaryIdentifier).toBe('@queries');
      expect(violation?.fix).toBeUndefined();
    });

    it('should identify the boundary by dir when it has no alias', () => {
      const noAliasBoundary = createBoundary(
        {
          dir: 'domain/entities',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );
      const { reporter } = createMockPorts();

      reportAncestorDirectoryImport({
        fileBoundary: noAliasBoundary,
        reporter,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.boundaryIdentifier).toBe(
        noAliasBoundary.identifier,
      );
    });
  });
});
