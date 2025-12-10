/**
 * Unit tests for absoluteImportResolution.ts
 */

import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveAbsoluteImport } from './absoluteImportResolution';

describe('absoluteImportResolution', () => {
  const cwd = '/project';

  beforeEach(() => {
    // Setup if needed
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
      expect(result.targetDir).toBe(path.resolve(cwd, 'src/domain/entities'));
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
      expect(result.targetDir).toBe(path.resolve(cwd, 'src/domain/entities'));
    });
  });
});
