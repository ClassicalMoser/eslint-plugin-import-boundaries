/**
 * Unit tests for targetPathResolution.ts
 * Tests the dispatcher function that routes to specific resolution functions.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveTargetPath } from './targetPathResolution';

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
      expect(result.targetDir).toBe(path.join(cwd, rootDir, 'domain/queries'));
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
      expect(result.targetDir).toBe(path.resolve(cwd, 'src/domain/entities'));
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
});
