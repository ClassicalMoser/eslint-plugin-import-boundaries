/**
 * Unit tests for relativeImportResolution.ts
 */

import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveRelativeImport } from './relativeImportResolution';

describe('relativeImportResolution', () => {
  const cwd = '/project';
  const rootDir = 'src';

  beforeEach(() => {
    // Setup if needed
  });

  describe('resolveRelativeImport', () => {
    it('should resolve relative file import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveRelativeImport('./file.ts', fileDir, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(path.join(fileDir, 'file.ts'));
      expect(result.targetDir).toBe(fileDir);
    });

    it('should resolve relative directory import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = resolveRelativeImport('./subdir', fileDir, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(path.join(fileDir, 'subdir', 'index.ts'));
      expect(result.targetDir).toBe(path.join(fileDir, 'subdir'));
    });

    it('should resolve same directory index file (ancestor barrel)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = resolveRelativeImport('./index', fileDir, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(path.join(fileDir, 'index.ts'));
      expect(result.targetDir).toBe(fileDir);
    });

    it('should resolve parent directory import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const result = resolveRelativeImport('../parent.ts', fileDir, 'index', [
        '.ts',
      ]);

      expect(result.targetAbs).toBe(
        path.join(cwd, rootDir, 'domain/queries', 'parent.ts'),
      );
      expect(result.targetDir).toBe(path.join(cwd, rootDir, 'domain/queries'));
    });
  });
});
