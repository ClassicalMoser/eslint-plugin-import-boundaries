/**
 * Unit tests for resolveTarget.ts
 * Tests the shared target path resolution logic.
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveTarget } from './resolveTarget';

describe('resolveTarget', () => {
  const baseDir = '/project/src/domain';
  const barrelFileName = 'index';
  const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  describe('directory imports (no extension)', () => {
    it('should resolve directory import to barrel file', () => {
      const spec = 'entities';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.join(baseDir, 'entities', 'index.ts'));
      expect(result.targetDir).toBe(path.resolve(baseDir, 'entities'));
    });

    it('should resolve nested directory import to barrel file', () => {
      const spec = 'entities/user';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.join(baseDir, 'entities', 'user', 'index.ts'),
      );
      expect(result.targetDir).toBe(path.resolve(baseDir, 'entities', 'user'));
    });

    it('should use first extension from fileExtensions array', () => {
      const spec = 'entities';
      const extensions = ['.js', '.ts'];

      const result = resolveTarget(baseDir, spec, barrelFileName, extensions);

      expect(result.targetAbs).toBe(path.join(baseDir, 'entities', 'index.js'));
    });

    it('should handle relative directory specifiers', () => {
      const spec = './entities';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.join(baseDir, 'entities', 'index.ts'));
      expect(result.targetDir).toBe(path.resolve(baseDir, 'entities'));
    });

    it('should handle parent directory specifiers', () => {
      const spec = '../application';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.join(path.dirname(baseDir), 'application', 'index.ts'),
      );
      expect(result.targetDir).toBe(
        path.resolve(path.dirname(baseDir), 'application'),
      );
    });
  });

  describe('file imports (with extension)', () => {
    it('should resolve file import directly', () => {
      const spec = 'entities.ts';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.ts'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.ts')),
      );
    });

    it('should resolve nested file import', () => {
      const spec = 'entities/user.ts';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.resolve(baseDir, 'entities', 'user.ts'),
      );
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities', 'user.ts')),
      );
    });

    it('should recognize .tsx extension', () => {
      const spec = 'entities.tsx';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.tsx'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.tsx')),
      );
    });

    it('should recognize .js extension', () => {
      const spec = 'entities.js';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.js'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.js')),
      );
    });

    it('should recognize .jsx extension', () => {
      const spec = 'entities.jsx';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.jsx'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.jsx')),
      );
    });

    it('should handle relative file specifiers', () => {
      const spec = './entities.ts';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.ts'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.ts')),
      );
    });

    it('should handle parent directory file specifiers', () => {
      const spec = '../application.ts';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.resolve(path.dirname(baseDir), 'application.ts'),
      );
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(path.dirname(baseDir), 'application.ts')),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty specifier as directory', () => {
      const spec = '';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(path.join(baseDir, 'index.ts'));
      expect(result.targetDir).toBe(path.resolve(baseDir));
    });

    it('should handle root directory as baseDir', () => {
      const spec = 'entities';
      const rootBaseDir = '/';

      const result = resolveTarget(
        rootBaseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.join(rootBaseDir, 'entities', 'index.ts'),
      );
      expect(result.targetDir).toBe(path.resolve(rootBaseDir, 'entities'));
    });

    it('should handle custom barrel file name', () => {
      const spec = 'entities';
      const customBarrelFileName = 'barrel';

      const result = resolveTarget(
        baseDir,
        spec,
        customBarrelFileName,
        fileExtensions,
      );

      expect(result.targetAbs).toBe(
        path.join(baseDir, 'entities', 'barrel.ts'),
      );
      expect(result.targetDir).toBe(path.resolve(baseDir, 'entities'));
    });

    it('should handle file with multiple dots (not an extension)', () => {
      const spec = 'entities.test.ts';

      const result = resolveTarget(
        baseDir,
        spec,
        barrelFileName,
        fileExtensions,
      );

      // Should be treated as a file because it ends with .ts
      expect(result.targetAbs).toBe(path.resolve(baseDir, 'entities.test.ts'));
      expect(result.targetDir).toBe(
        path.dirname(path.resolve(baseDir, 'entities.test.ts')),
      );
    });
  });
});
