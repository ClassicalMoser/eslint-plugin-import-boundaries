/**
 * Unit tests for targetPathResolution.ts
 * Tests target path resolution from import specifiers.
 */

import type { Boundary } from './types.js';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  extractBareImportSubpath,
  findMatchingBoundary,
  resolveAliasImport,
  resolveAbsoluteImport,
  resolveBareImport,
  resolveRelativeImport,
  resolveTargetPath,
} from './targetPathResolution.js';

describe('targetPathResolution', () => {
  const cwd = '/project';
  const rootDir = 'src';

  // Test boundaries
  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let transformsBoundary: Boundary;

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

    transformsBoundary = {
      dir: 'domain/transforms',
      alias: '@transforms',
      absDir: path.resolve(cwd, rootDir, 'domain/transforms'),
      allowImportsFrom: [],
    };
  });

  describe('resolveTargetPath', () => {
    it('should resolve alias imports without subpath', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        '@entities',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'index.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should resolve alias imports with directory subpath', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        '@entities/army',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army', 'index.ts'),
      );
      expect(result.targetDir).toBe(path.join(entitiesBoundary.absDir, 'army'));
    });

    it('should resolve alias imports with file subpath', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        '@entities/army.ts',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should resolve relative imports', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        './file.ts',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(path.join(fileDir, 'file.ts'));
      expect(result.targetDir).toBe(fileDir);
    });

    it('should resolve relative imports with ../', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = resolveTargetPath(
        '../parent.ts',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(
        path.join(cwd, rootDir, 'domain/queries', 'parent.ts'),
      );
      expect(result.targetDir).toBe(
        path.join(cwd, rootDir, 'domain/queries'),
      );
    });

    it('should resolve absolute paths', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        'src/domain/entities/army.ts',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe(
        path.resolve(cwd, 'src/domain/entities/army.ts'),
      );
      expect(result.targetDir).toBe(
        path.resolve(cwd, 'src/domain/entities'),
      );
    });

    it('should return empty strings for unknown aliases', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveTargetPath(
        '@unknown',
        fileDir,
        boundaries,
        rootDir,
        cwd,
      );

      expect(result.targetAbs).toBe('');
      expect(result.targetDir).toBe('');
    });
  });

  describe('resolveAliasImport', () => {
    it('should resolve alias without subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport(
        '@entities',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'index.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should resolve alias with directory subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport(
        '@entities/army',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army', 'index.ts'),
      );
      expect(result.targetDir).toBe(
        path.join(entitiesBoundary.absDir, 'army'),
      );
    });

    it('should resolve alias with file subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport(
        '@entities/army.ts',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should return empty strings for unknown alias', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport(
        '@unknown',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe('');
      expect(result.targetDir).toBe('');
    });
  });

  describe('resolveRelativeImport', () => {
    it('should resolve relative file import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveRelativeImport(
        './file.ts',
        fileDir,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(path.join(fileDir, 'file.ts'));
      expect(result.targetDir).toBe(fileDir);
    });

    it('should resolve relative directory import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveRelativeImport(
        './subdir',
        fileDir,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(fileDir, 'subdir', 'index.ts'),
      );
      expect(result.targetDir).toBe(path.join(fileDir, 'subdir'));
    });

    it('should resolve same directory index file (ancestor barrel)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = resolveRelativeImport(
        './index',
        fileDir,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(path.join(fileDir, 'index.ts'));
      expect(result.targetDir).toBe(fileDir);
    });

    it('should resolve parent directory import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = resolveRelativeImport(
        '../parent.ts',
        fileDir,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(cwd, rootDir, 'domain/queries', 'parent.ts'),
      );
      expect(result.targetDir).toBe(
        path.join(cwd, rootDir, 'domain/queries'),
      );
    });
  });

  describe('resolveAbsoluteImport', () => {
    it('should resolve absolute file import', () => {
      const result = resolveAbsoluteImport(
        'src/domain/entities/army.ts',
        cwd,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.resolve(cwd, 'src/domain/entities/army.ts'),
      );
      expect(result.targetDir).toBe(
        path.resolve(cwd, 'src/domain/entities'),
      );
    });

    it('should resolve absolute directory import', () => {
      const result = resolveAbsoluteImport(
        'src/domain/entities',
        cwd,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.resolve(cwd, 'src/domain/entities', 'index.ts'),
      );
      expect(result.targetDir).toBe(
        path.resolve(cwd, 'src/domain/entities'),
      );
    });
  });

  describe('findMatchingBoundary', () => {
    it('should find boundary by exact dir match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('domain/entities', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should find boundary by prefix match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('domain/entities/army', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should find boundary by suffix match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('entities/army', boundaries);

      expect(result).toBe(entitiesBoundary);
    });

    it('should return null for no match', () => {
      const boundaries = [entitiesBoundary, queriesBoundary];
      const result = findMatchingBoundary('unknown/path', boundaries);

      expect(result).toBeNull();
    });
  });

  describe('extractBareImportSubpath', () => {
    it('should return empty string for exact boundary match', () => {
      const result = extractBareImportSubpath(
        'domain/entities',
        entitiesBoundary,
      );

      expect(result).toBe('');
    });

    it('should extract subpath for prefix match', () => {
      const result = extractBareImportSubpath(
        'domain/entities/army',
        entitiesBoundary,
      );

      expect(result).toBe('army');
    });

    it('should extract subpath for suffix match', () => {
      const result = extractBareImportSubpath(
        'entities/army',
        entitiesBoundary,
      );

      expect(result).toBe('army');
    });

    it('should extract nested subpath', () => {
      const result = extractBareImportSubpath(
        'domain/entities/army/unit',
        entitiesBoundary,
      );

      expect(result).toBe('army/unit');
    });
  });

  describe('resolveBareImport', () => {
    it('should resolve bare import matching boundary dir', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport(
        'domain/entities',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'index.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should resolve bare import with directory subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport(
        'domain/entities/army',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army', 'index.ts'),
      );
      expect(result.targetDir).toBe(
        path.join(entitiesBoundary.absDir, 'army'),
      );
    });

    it('should resolve bare import with file subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport(
        'domain/entities/army.ts',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should return empty strings for external package', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport(
        'lodash',
        boundaries,
        'index',
        ['.ts'],
      );

      expect(result.targetAbs).toBe('');
      expect(result.targetDir).toBe('');
    });
  });
});

