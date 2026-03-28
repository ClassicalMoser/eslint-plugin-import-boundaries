/**
 * Unit tests for boundaryDetection.ts
 * Tests boundary detection and alias subpath checking.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { checkAliasSubpath, getFileData } from './boundaryDetection';

describe('boundaryDetection', () => {
  const cwd = '/project';
  const rootDir = 'src';

  const entitiesBoundary: Boundary = createBoundary(
    {
      dir: 'domain/entities',
      alias: '@entities',
    },
    { cwd, rootDir },
  );

  const queriesBoundary: Boundary = createBoundary(
    {
      dir: 'domain/queries',
      alias: '@queries',
    },
    { cwd, rootDir },
  );

  const transformsBoundary: Boundary = createBoundary(
    {
      dir: 'domain/transforms',
      alias: '@transforms',
    },
    { cwd, rootDir },
  );

  const boundaries = [entitiesBoundary, queriesBoundary, transformsBoundary];

  describe('checkAliasSubpath', () => {
    it('should detect alias subpaths', () => {
      const result = checkAliasSubpath('@entities/army', boundaries);

      expect(result.isSubpath).toBe(true);
      expect(result.baseAlias).toBe('@entities');
    });

    it('should detect nested subpaths', () => {
      const result = checkAliasSubpath('@entities/army/unit', boundaries);

      expect(result.isSubpath).toBe(true);
      expect(result.baseAlias).toBe('@entities');
    });

    it('should return false for unknown aliases', () => {
      const result = checkAliasSubpath('@unknown/path', boundaries);

      expect(result.isSubpath).toBe(false);
      expect(result.baseAlias).toBeUndefined();
    });
  });

  describe('getFileData', () => {
    it('should detect file in boundary with rules', () => {
      const boundaryWithRules: Boundary = createBoundary(
        {
          dir: 'domain/queries',
          alias: '@queries',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'getLine.ts',
      );

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, rootDir, 'domain/queries'));
      expect(result.fileBoundary).toBe(boundaryWithRules);
    });

    it('should detect file in nested directory within boundary with rules', () => {
      const boundaryWithRules: Boundary = createBoundary(
        {
          dir: 'domain/queries',
          alias: '@queries',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'subdir',
        'deep',
        'file.ts',
      );

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(
        path.resolve(cwd, rootDir, 'domain/queries', 'subdir', 'deep'),
      );
      expect(result.fileBoundary).toBe(boundaryWithRules);
    });

    it('should return null boundary for files outside all boundaries', () => {
      const boundaryWithRules: Boundary = createBoundary(
        {
          dir: 'domain/queries',
          alias: '@queries',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(cwd, 'other', 'file.ts');

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, 'other'));
      expect(result.fileBoundary).toBeNull();
    });

    it('should return actual (most specific) boundary for nested boundaries', () => {
      const parentBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const childBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application/ports',
          alias: '@ports',
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/ports',
        'file.ts',
      );

      const result = getFileData(filename, [parentBoundary, childBoundary]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(childBoundary); // Returns most specific boundary
    });

    it('should return most specific boundary for deeply nested files', () => {
      const parentBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const childBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application/ports',
          alias: '@ports',
          allowImportsFrom: ['@infrastructure'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/ports',
        'file.ts',
      );

      const result = getFileData(filename, [parentBoundary, childBoundary]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(childBoundary);
    });

    it('should return invalid for non-absolute paths', () => {
      const filename = 'relative/path/file.ts';

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(false);
      expect(result.fileDir).toBeUndefined();
      expect(result.fileBoundary).toBeUndefined();
    });

    it('should return most specific ancestor for file in deepest boundary', () => {
      const rootBoundary: Boundary = createBoundary(
        {
          dir: 'domain',
          alias: '@domain',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );

      const midBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );

      const deepBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application/services',
          alias: '@services',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/services/nested/deep',
        'file.ts',
      );

      const result = getFileData(filename, [
        rootBoundary,
        midBoundary,
        deepBoundary,
      ]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(deepBoundary);
      expect(result.fileBoundary?.absDir.length).toBeGreaterThan(
        midBoundary.absDir.length,
      );
      expect(result.fileBoundary?.absDir.length).toBeGreaterThan(
        rootBoundary.absDir.length,
      );
    });
  });
});
