/**
 * Unit tests for boundaryDetection.ts
 * Tests boundary detection and alias subpath checking.
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { getFileData, checkAliasSubpath } from './boundaryDetection.js';
import type { Boundary } from './types.js';

describe('boundaryDetection', () => {
  const cwd = '/project';
  const rootDir = 'src';

  const entitiesBoundary: Boundary = {
    dir: 'domain/entities',
    alias: '@entities',
    absDir: path.resolve(cwd, rootDir, 'domain/entities'),
  };

  const queriesBoundary: Boundary = {
    dir: 'domain/queries',
    alias: '@queries',
    absDir: path.resolve(cwd, rootDir, 'domain/queries'),
  };

  const transformsBoundary: Boundary = {
    dir: 'domain/transforms',
    alias: '@transforms',
    absDir: path.resolve(cwd, rootDir, 'domain/transforms'),
  };

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

  describe('getFileData', () => {
    it('should detect file in boundary', () => {
      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'getLine.ts',
      );

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, rootDir, 'domain/queries'));
      expect(result.fileBoundary).toBe(queriesBoundary);
    });

    it('should detect file in nested directory within boundary', () => {
      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'subdir',
        'deep',
        'file.ts',
      );

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(
        path.resolve(cwd, rootDir, 'domain/queries', 'subdir', 'deep'),
      );
      expect(result.fileBoundary).toBe(queriesBoundary);
    });

    it('should return null boundary for files outside all boundaries', () => {
      const filename = path.resolve(cwd, 'other', 'file.ts');

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, 'other'));
      expect(result.fileBoundary).toBeNull();
    });

    it('should return most specific boundary for nested boundaries', () => {
      // If we had nested boundaries, the most specific (longest path) should win
      // For now, we test with the existing boundaries
      const filename = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'file.ts',
      );

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(queriesBoundary);
    });

    it('should return invalid for non-absolute paths', () => {
      const filename = 'relative/path/file.ts';

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(false);
      expect(result.fileDir).toBeUndefined();
      expect(result.fileBoundary).toBeUndefined();
    });

    it('should handle Windows paths', () => {
      const windowsCwd = 'C:\\project';
      const windowsBoundaries: Boundary[] = [
        {
          dir: 'domain/entities',
          alias: '@entities',
          absDir: path.resolve(windowsCwd, rootDir, 'domain/entities'),
        },
      ];

      const filename = path.resolve(
        windowsCwd,
        rootDir,
        'domain/entities',
        'file.ts',
      );

      const result = getFileData(filename, windowsBoundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(windowsBoundaries[0]);
    });
  });
});

