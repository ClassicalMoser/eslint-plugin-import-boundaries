/**
 * Unit tests for sameDirectoryPathCalculation.ts
 */

import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateSameDirectoryPath } from './sameDirectoryPathCalculation';

describe('sameDirectoryPathCalculation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  beforeEach(() => {
    // Setup if needed
  });

  describe('calculateSameDirectoryPath', () => {
    it('should return relative path for same directory file', () => {
      const targetAbs = path.resolve(cwd, rootDir, 'domain/queries', 'file.ts');
      const result = calculateSameDirectoryPath(targetAbs, 'index');

      expect(result).toBe('./file');
    });

    it('should return null for ancestor barrel (index file)', () => {
      const targetAbs = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'index.ts',
      );
      const result = calculateSameDirectoryPath(targetAbs, 'index');

      expect(result).toBeNull();
    });
  });
});
