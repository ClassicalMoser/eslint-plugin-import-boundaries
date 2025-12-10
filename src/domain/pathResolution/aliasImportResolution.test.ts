/**
 * Unit tests for aliasImportResolution.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { resolveAliasImport } from './aliasImportResolution';

describe('aliasImportResolution', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );
  });

  describe('resolveAliasImport', () => {
    it('should resolve alias without subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport('@entities', boundaries, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'index.ts'),
      );
      expect(result.targetDir).toBe(entitiesBoundary.absDir);
    });

    it('should resolve alias with directory subpath', () => {
      const boundaries = [entitiesBoundary];
      const result = resolveAliasImport('@entities/army', boundaries, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(
        path.join(entitiesBoundary.absDir, 'army', 'index.ts'),
      );
      expect(result.targetDir).toBe(path.join(entitiesBoundary.absDir, 'army'));
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
      const result = resolveAliasImport('@unknown', boundaries, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe('');
      expect(result.targetDir).toBe('');
    });
  });
});
