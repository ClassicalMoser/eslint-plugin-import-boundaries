/**
 * Unit tests for barrelPath.ts
 * Tests the barrel file path construction logic.
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBarrelPath } from './barrelPath';

describe('barrelPath', () => {
  describe('getBarrelPath', () => {
    it('should construct barrel path with first extension', () => {
      const dir = '/project/src/domain';
      const barrelFileName = 'index';
      const fileExtensions = ['.ts', '.js', '.tsx'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'index.ts'));
    });

    it('should use first extension when multiple extensions provided', () => {
      const dir = '/project/src/domain';
      const barrelFileName = 'index';
      const fileExtensions = ['.js', '.ts', '.mjs'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'index.js'));
    });

    it('should work with custom barrel file name', () => {
      const dir = '/project/src/domain';
      const barrelFileName = 'barrel';
      const fileExtensions = ['.ts'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'barrel.ts'));
    });

    it('should work with nested directories', () => {
      const dir = '/project/src/domain/entities/user';
      const barrelFileName = 'index';
      const fileExtensions = ['.ts'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'index.ts'));
    });

    it('should work with different file extensions', () => {
      const dir = '/project/src/domain';
      const barrelFileName = 'index';
      const fileExtensions = ['.jsx'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'index.jsx'));
    });

    it('should handle empty directory path', () => {
      const dir = '';
      const barrelFileName = 'index';
      const fileExtensions = ['.ts'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join('', 'index.ts'));
    });

    it('should handle root directory', () => {
      const dir = '/';
      const barrelFileName = 'index';
      const fileExtensions = ['.ts'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join('/', 'index.ts'));
    });

    it('should handle relative paths', () => {
      const dir = './src/domain';
      const barrelFileName = 'index';
      const fileExtensions = ['.ts'];

      const result = getBarrelPath(dir, barrelFileName, fileExtensions);

      expect(result).toBe(path.join(dir, 'index.ts'));
    });
  });
});
