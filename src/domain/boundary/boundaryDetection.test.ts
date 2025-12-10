/**
 * Unit tests for boundaryDetection.ts
 * Tests boundary detection and alias subpath checking.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import {
  checkAliasSubpath,
  getFileData,
  resolveToSpecifiedBoundary,
} from './boundaryDetection';

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

    it('should not detect base alias as subpath', () => {
      const result = checkAliasSubpath('@entities', boundaries);

      expect(result.isSubpath).toBe(false);
      expect(result.baseAlias).toBeUndefined();
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

  describe('resolveToSpecifiedBoundary', () => {
    it('should resolve to boundary with rules', () => {
      const boundaryWithRules: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [boundaryWithRules]);

      expect(result).toBe(boundaryWithRules);
    });

    it('should resolve to parent boundary when child has no rules', () => {
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
          // No rules specified
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/ports',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [
        parentBoundary,
        childBoundary,
      ]);

      expect(result).toBe(parentBoundary);
    });

    it('should resolve to most specific boundary with rules', () => {
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

      const result = resolveToSpecifiedBoundary(filename, [
        parentBoundary,
        childBoundary,
      ]);

      expect(result).toBe(childBoundary);
    });

    it('should return null when no boundaries with rules are found', () => {
      const boundaryWithoutRules: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          // No rules specified
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [
        boundaryWithoutRules,
      ]);

      expect(result).toBeNull();
    });

    it('should return null for files outside all boundaries', () => {
      const boundary: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: ['@domain'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(cwd, 'other', 'file.ts');

      const result = resolveToSpecifiedBoundary(filename, [boundary]);

      expect(result).toBeNull();
    });

    it('should handle denyImportsFrom as rules', () => {
      const boundaryWithDeny: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          denyImportsFrom: ['@infrastructure'],
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [boundaryWithDeny]);

      expect(result).toBe(boundaryWithDeny);
    });

    it('should handle allowTypeImportsFrom as rules', () => {
      const boundaryWithTypeOnly: Boundary = createBoundary(
        {
          dir: 'domain/infrastructure',
          alias: '@infrastructure',
          allowTypeImportsFrom: ['@application'], // Only type imports allowed
          // No allowImportsFrom or denyImportsFrom
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/infrastructure',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [
        boundaryWithTypeOnly,
      ]);

      expect(result).toBe(boundaryWithTypeOnly);
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

    it('should return actual boundary when child has no rules (for same-boundary detection)', () => {
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
          // No rules
        },
        { cwd, rootDir },
      );

      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/ports',
        'file.ts',
      );

      // getFileData now returns the actual boundary (for same-boundary detection)
      // Rule checking will resolve to parent via resolveToSpecifiedBoundary
      const result = getFileData(filename, [parentBoundary, childBoundary]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(childBoundary); // Returns actual boundary, not parent
    });

    it('should return most specific boundary with rules for nested boundaries', () => {
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

    it('should return most specific ancestor when file is deeply nested with multiple rule configs', () => {
      // Test line 112: return ancestors.sort(...)[0]!
      // Need a deeply nested file with multiple boundaries that have rules
      // The function should return the longest/most specific one
      const rootBoundary: Boundary = createBoundary(
        {
          dir: 'domain',
          alias: '@domain',
          allowImportsFrom: [], // Has rules
        },
        { cwd, rootDir },
      );

      const midBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application',
          alias: '@application',
          allowImportsFrom: [], // Has rules
        },
        { cwd, rootDir },
      );

      const deepBoundary: Boundary = createBoundary(
        {
          dir: 'domain/application/services',
          alias: '@services',
          allowImportsFrom: [], // Has rules
        },
        { cwd, rootDir },
      );

      // File is deeply nested - all three boundaries are ancestors
      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/application/services/nested/deep',
        'file.ts',
      );

      const result = resolveToSpecifiedBoundary(filename, [
        rootBoundary,
        midBoundary,
        deepBoundary,
      ]);

      // Should return the most specific (longest path) ancestor - line 112
      expect(result).toBe(deepBoundary);
      expect(result?.absDir.length).toBeGreaterThan(midBoundary.absDir.length);
      expect(result?.absDir.length).toBeGreaterThan(rootBoundary.absDir.length);
    });
  });
});
