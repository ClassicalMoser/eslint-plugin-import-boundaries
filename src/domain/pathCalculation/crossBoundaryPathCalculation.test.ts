/**
 * Unit tests for crossBoundaryPathCalculation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { calculateCrossBoundaryPath } from './crossBoundaryPathCalculation';

describe('crossBoundaryPathCalculation', () => {
  const cwd = '/project';
  const rootDir = 'src';
  const barrelFileName = 'index';

  let entitiesBoundary: Boundary;
  let applicationBoundary: Boundary;
  let portsBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );

    applicationBoundary = createBoundary(
      {
        dir: 'application',
        alias: '@application',
        allowImportsFrom: ['@domain'],
      },
      { cwd, rootDir },
    );

    portsBoundary = createBoundary(
      {
        dir: 'application/ports',
        alias: '@ports',
        allowImportsFrom: ['@application'],
        nestedPathFormat: 'relative',
      },
      { cwd, rootDir },
    );
  });

  describe('calculateCrossBoundaryPath', () => {
    it('should return alias for alias style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'application');
      const targetDir = path.resolve(cwd, rootDir, 'domain/entities');
      const result = calculateCrossBoundaryPath(
        entitiesBoundary,
        applicationBoundary,
        fileDir,
        targetDir,
        rootDir,
        'alias',
        barrelFileName,
      );

      expect(result).toBe('@entities');
    });

    it('should return absolute path for absolute style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'application');
      const targetDir = path.resolve(cwd, rootDir, 'domain/entities');
      const result = calculateCrossBoundaryPath(
        entitiesBoundary,
        applicationBoundary,
        fileDir,
        targetDir,
        rootDir,
        'absolute',
        barrelFileName,
      );

      expect(result).toBe('src/domain/entities');
    });

    it('should return absolute path when alias missing in alias style', () => {
      const boundaryWithoutAlias: Boundary = {
        ...entitiesBoundary,
        alias: undefined,
      };
      const fileDir = path.resolve(cwd, rootDir, 'application');
      const targetDir = path.resolve(cwd, rootDir, 'domain/entities');
      const result = calculateCrossBoundaryPath(
        boundaryWithoutAlias,
        applicationBoundary,
        fileDir,
        targetDir,
        rootDir,
        'alias',
        barrelFileName,
      );

      expect(result).toBe('src/domain/entities');
    });

    it('should return UNKNOWN_BOUNDARY for null boundary', () => {
      const fileDir = path.resolve(cwd, rootDir, 'application');
      const targetDir = path.resolve(cwd, rootDir, 'domain/entities');
      const result = calculateCrossBoundaryPath(
        null,
        applicationBoundary,
        fileDir,
        targetDir,
        rootDir,
        'alias',
        barrelFileName,
      );

      expect(result).toBe('UNKNOWN_BOUNDARY');
    });

    it('should use relative path for nested boundary with nestedPathFormat: relative', () => {
      // ports (application/ports) importing from application (parent boundary)
      const fileDir = path.resolve(cwd, rootDir, 'application/ports');
      const targetDir = path.resolve(cwd, rootDir, 'application');
      const result = calculateCrossBoundaryPath(
        applicationBoundary,
        portsBoundary,
        fileDir,
        targetDir,
        rootDir,
        'absolute',
        barrelFileName,
      );

      // From application/ports to application should be relative: ..
      expect(result).toBe('..');
    });

    it('should use relative path for nested boundary importing specific subdir of parent', () => {
      const fileDir = path.resolve(cwd, rootDir, 'application/ports');
      // Target is application/use-cases (within application boundary)
      const targetDir = path.resolve(cwd, rootDir, 'application/use-cases');
      const result = calculateCrossBoundaryPath(
        applicationBoundary,
        portsBoundary,
        fileDir,
        targetDir,
        rootDir,
        'absolute',
        barrelFileName,
      );

      expect(result).toBe('../use-cases');
    });

    it('should NOT use nestedPathFormat for non-parent boundaries', () => {
      // ports importing from domain (not its parent), nestedPathFormat should not apply
      const fileDir = path.resolve(cwd, rootDir, 'application/ports');
      const targetDir = path.resolve(cwd, rootDir, 'domain/entities');
      const result = calculateCrossBoundaryPath(
        entitiesBoundary,
        portsBoundary,
        fileDir,
        targetDir,
        rootDir,
        'absolute',
        barrelFileName,
      );

      // Not a parent boundary - use normal absolute path
      expect(result).toBe('src/domain/entities');
    });

    it('should use alias for nestedPathFormat: alias', () => {
      const portsWithAlias: Boundary = {
        ...portsBoundary,
        nestedPathFormat: 'alias',
      };
      const fileDir = path.resolve(cwd, rootDir, 'application/ports');
      const targetDir = path.resolve(cwd, rootDir, 'application');
      const result = calculateCrossBoundaryPath(
        applicationBoundary,
        portsWithAlias,
        fileDir,
        targetDir,
        rootDir,
        'absolute',
        barrelFileName,
      );

      expect(result).toBe('@application');
    });
  });
});
