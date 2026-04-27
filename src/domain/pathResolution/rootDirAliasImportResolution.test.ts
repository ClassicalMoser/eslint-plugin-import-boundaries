/**
 * Unit tests for rootDirAliasImportResolution.ts
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRootDirAliasImport } from './rootDirAliasImportResolution';

describe('resolveRootDirAliasImport', () => {
  const cwd = '/project';
  const rootDir = 'src';
  const rootDirAlias = '@';
  const barrelFileName = 'index';
  const fileExtensions = ['.ts', '.tsx'];

  it('should resolve bare alias to rootDir barrel', () => {
    const result = resolveRootDirAliasImport(
      '@',
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe(path.join(cwd, rootDir, 'index.ts'));
    expect(result.targetDir).toBe(path.join(cwd, rootDir));
  });

  it('should resolve @/subpath to directory barrel', () => {
    const result = resolveRootDirAliasImport(
      '@/domain/entities',
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe(
      path.join(cwd, rootDir, 'domain', 'entities', 'index.ts'),
    );
    expect(result.targetDir).toBe(
      path.join(cwd, rootDir, 'domain', 'entities'),
    );
  });

  it('should resolve @/subpath with file extension', () => {
    const result = resolveRootDirAliasImport(
      '@/domain/entities/army.ts',
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe(
      path.join(cwd, rootDir, 'domain', 'entities', 'army.ts'),
    );
    expect(result.targetDir).toBe(
      path.join(cwd, rootDir, 'domain', 'entities'),
    );
  });

  it('should return empty strings when prefix does not match', () => {
    const result = resolveRootDirAliasImport(
      '@entities/army',
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe('');
    expect(result.targetDir).toBe('');
  });

  it('should return empty strings for relative imports', () => {
    const result = resolveRootDirAliasImport(
      './foo',
      cwd,
      rootDir,
      rootDirAlias,
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe('');
    expect(result.targetDir).toBe('');
  });

  it('should return empty strings when rootDirAlias is empty', () => {
    const result = resolveRootDirAliasImport(
      '@/foo',
      cwd,
      rootDir,
      '',
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe('');
    expect(result.targetDir).toBe('');
  });

  it('should work with a custom non-@ prefix', () => {
    const result = resolveRootDirAliasImport(
      '~/domain/entities',
      cwd,
      rootDir,
      '~',
      barrelFileName,
      fileExtensions,
    );
    expect(result.targetAbs).toBe(
      path.join(cwd, rootDir, 'domain', 'entities', 'index.ts'),
    );
    expect(result.targetDir).toBe(
      path.join(cwd, rootDir, 'domain', 'entities'),
    );
  });
});
