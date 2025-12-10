/**
 * Unit tests for pathFormatting.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { choosePathFormat, formatAbsolutePath } from './pathFormatting';

describe('pathFormatting', () => {
  const cwd = '/project';
  const rootDir = 'src';
  let boundary: Boundary;

  beforeEach(() => {
    boundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
    };
  });

  describe('formatAbsolutePath', () => {
    it('should format path with forward slashes', () => {
      const result = formatAbsolutePath(rootDir, 'domain', 'entities');
      expect(result).toBe('src/domain/entities');
    });

    it('should handle Windows-style paths', () => {
      const result = formatAbsolutePath('src', 'domain\\entities');
      expect(result).toBe('src/domain/entities');
    });

    it('should handle multiple path segments', () => {
      const result = formatAbsolutePath(rootDir, 'domain', 'entities', 'army');
      expect(result).toBe('src/domain/entities/army');
    });
  });

  describe('choosePathFormat', () => {
    it('should use alias when available and crossBoundaryStyle is alias', () => {
      const result = choosePathFormat(boundary, 'army', rootDir, 'alias');

      expect(result).toBe('@entities/army');
    });

    it('should use absolute path when crossBoundaryStyle is absolute', () => {
      const result = choosePathFormat(boundary, 'army', rootDir, 'absolute');

      expect(result).toBe('src/domain/entities/army');
    });

    it('should fallback to absolute path when no alias available', () => {
      const boundaryWithoutAlias: Boundary = {
        dir: 'domain/entities',
        alias: undefined,
        absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      };

      const result = choosePathFormat(
        boundaryWithoutAlias,
        'army',
        rootDir,
        'alias',
      );

      expect(result).toBe('src/domain/entities/army');
    });

    it('should use absolute path when crossBoundaryStyle is absolute even with alias', () => {
      const result = choosePathFormat(boundary, 'army', rootDir, 'absolute');

      expect(result).toBe('src/domain/entities/army');
      expect(result).not.toContain('@entities');
    });
  });
});
