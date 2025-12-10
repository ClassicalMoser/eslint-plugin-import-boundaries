/**
 * Unit tests for pathFormatting.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import {
  absoluteToRelativePath,
  choosePathFormat,
  formatAbsolutePath,
} from './pathFormatting';

describe('pathFormatting', () => {
  const cwd = '/project';
  const rootDir = 'src';
  let boundary: Boundary;

  beforeEach(() => {
    boundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
      },
      { cwd, rootDir },
    );
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
      const boundaryWithoutAlias: Boundary = createBoundary(
        {
          dir: 'domain/entities',
        },
        { cwd, rootDir },
      );

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

  describe('absoluteToRelativePath', () => {
    const fileDir = path.resolve(cwd, rootDir, 'domain', 'entities');
    const barrelFileName = 'index';

    it('should convert absolute file path to relative path', () => {
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'helper.ts');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('../../utils/helper');
    });

    it('should remove file extension', () => {
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'helper.tsx');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('../../utils/helper');
    });

    it('should remove barrel file name from path', () => {
      const targetPath = path.resolve(
        cwd,
        rootDir,
        'utils',
        'helper',
        'index.ts',
      );
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('../../utils/helper');
    });

    it('should handle barrel file in same directory', () => {
      const targetPath = path.resolve(fileDir, 'index.ts');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('./');
    });

    it('should handle barrel file in subdirectory', () => {
      const targetPath = path.resolve(
        cwd,
        rootDir,
        'domain',
        'entities',
        'army',
        'index.ts',
      );
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('./army');
    });

    it('should handle directory path (no extension)', () => {
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'helper');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('../../utils/helper');
    });

    it('should ensure path starts with ./ when in same directory', () => {
      const targetPath = path.resolve(fileDir, 'helper.ts');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      expect(result).toBe('./helper');
    });

    it('should ensure dirname starts with ./ after removing barrel file name', () => {
      // Test case where dirname doesn't start with ./ after removing barrel file
      // This happens when the barrel file is in a parent directory
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'index.ts');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      // Should ensure it starts with ./
      expect(result).toMatch(/^\.\./);
    });

    it('should ensure dirname starts with ./ when dirname does not start with . after processing', () => {
      // Test case for line 63: when dirname is not '.' or './' and doesn't start with '.' after replace
      // This tests the edge case where path.dirname might return a path without leading ./
      // We need to manually construct a scenario where this happens
      // Create a path where the barrel file is in a nested directory
      const targetPath = path.resolve(
        cwd,
        rootDir,
        'domain',
        'entities',
        'nested',
        'deep',
        'index.ts',
      );
      const fileDirForTest = path.resolve(
        cwd,
        rootDir,
        'domain',
        'entities',
        'other',
      );
      const result = absoluteToRelativePath(
        targetPath,
        fileDirForTest,
        barrelFileName,
      );

      // After removing /index, should be './nested/deep' or '../nested/deep'
      expect(result).toMatch(/^\./);
      expect(result).not.toContain('/index');
    });

    it('should ensure directory path starts with ./ when no extension', () => {
      // Test case where directory path doesn't start with ./
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'helper');
      const result = absoluteToRelativePath(
        targetPath,
        fileDir,
        barrelFileName,
      );

      // Should ensure it starts with ./
      expect(result).toMatch(/^\./);
    });

    it('should ensure directory path starts with ./ when path.relative returns path without leading dot', () => {
      // Test case for line 70: directory path (no extension) that doesn't start with '.'
      // This can happen when path.relative returns a path like 'utils/helper' instead of './utils/helper'
      // Create a scenario where the relative path calculation might not include the leading ./
      const targetPath = path.resolve(cwd, rootDir, 'utils', 'helper');
      // Use a fileDir that would result in a relative path without leading ./
      // This is an edge case that might occur with certain path combinations
      const fileDirForTest = path.resolve(cwd, rootDir, 'domain');
      const result = absoluteToRelativePath(
        targetPath,
        fileDirForTest,
        barrelFileName,
      );

      // Should ensure it starts with ./
      expect(result).toMatch(/^\./);
      expect(result).toBe('../utils/helper');
    });

    it('should handle Windows paths correctly', () => {
      // Use path.resolve to create proper absolute paths that path.relative can handle
      const windowsFileDir = path.resolve(
        'C:',
        'project',
        'src',
        'domain',
        'entities',
      );
      const windowsTargetPath = path.resolve(
        'C:',
        'project',
        'src',
        'utils',
        'helper.ts',
      );
      const result = absoluteToRelativePath(
        windowsTargetPath,
        windowsFileDir,
        barrelFileName,
      );

      expect(result).toBe('../../utils/helper');
    });
  });
});
