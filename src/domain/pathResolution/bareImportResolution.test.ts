/**
 * Unit tests for bareImportResolution.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveBareImport } from './bareImportResolution';

describe('bareImportResolution', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [],
    };
  });

  describe('resolveBareImport', () => {
    it('should resolve bare import matching boundary dir', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport('domain/entities', boundaries, 'index', [
        '.ts',
      ]);

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
      expect(result.targetDir).toBe(path.join(entitiesBoundary.absDir, 'army'));
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
      const result = resolveBareImport('lodash', boundaries, 'index', ['.ts']);

      expect(result.targetAbs).toBe('');
      expect(result.targetDir).toBe('');
    });

    it('should resolve bare import with just boundary dir (no subpath)', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveBareImport('domain/entities', boundaries, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'index.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });
  });
});
