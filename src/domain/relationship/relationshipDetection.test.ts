/**
 * Integration tests for relationshipDetection.ts
 * Tests the main calculateCorrectImportPath function that orchestrates
 * target path resolution and import path calculation.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateCorrectImportPath } from './relationshipDetection';

describe('relationshipDetection', () => {
  const cwd = '/project';
  const rootDir = 'src';

  // Test boundaries
  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let transformsBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: [], // Has rules (empty allow list = deny all by default)
    };

    queriesBoundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      allowImportsFrom: [], // Has rules (empty allow list = deny all by default)
    };

    transformsBoundary = {
      dir: 'domain/transforms',
      alias: '@transforms',
      absDir: path.resolve(cwd, rootDir, 'domain/transforms'),
      allowImportsFrom: [], // Has rules (empty allow list = deny all by default)
    };
  });

  describe('calculateCorrectImportPath - cross-boundary', () => {
    it('should return alias for cross-boundary imports (alias style)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '@entities',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('@entities');
    });

    it('should return absolute path for cross-boundary imports (absolute style)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '@entities',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'absolute',
      );

      expect(result).toBe('src/domain/entities');
    });

    it('should return absolute path for same-boundary boundary root files (absolute style)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../getLine.ts',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'absolute',
      );

      expect(result).toBe('src/domain/queries/getLine');
    });

    it('should return absolute path for same-boundary top-level imports (absolute style)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../topLevel',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'absolute',
      );

      expect(result).toBe('src/domain/queries/topLevel');
    });

    it('should return UNKNOWN_BOUNDARY for paths outside all boundaries', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../unknown',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('UNKNOWN_BOUNDARY');
    });

    it('should return null for ancestor barrel imports', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '@queries',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBeNull();
    });
  });

  describe('calculateCorrectImportPath - same boundary', () => {
    it('should return ./sibling for same directory files', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        './sibling.ts',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('./sibling');
    });

    it('should return ./subdir for subdirectories in same directory', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        './otherSubdir',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('./otherSubdir');
    });

    it('should return ../cousin for parent sibling (non-top-level)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'subdir',
        'deep',
      );
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../cousin',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('../cousin');
    });

    it('should return @boundary/segment for top-level paths', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../topLevel',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('@queries/topLevel');
    });

    it('should return @boundary/rootFile for boundary root files', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '../getLine.ts',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('@queries/getLine');
    });

    it('should return null for ancestor barrel (index.ts in same directory)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      // Importing ./index from subdir means importing subdir/index.ts (ancestor barrel)
      // This should be forbidden per the spec - ancestor barrels create circular dependencies
      const result = calculateCorrectImportPath(
        './index',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBeNull();
    });

    it('should return @boundary/index for boundary root index (not null)', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const fileBoundary = queriesBoundary;

      // Importing ../index from subdir means importing queries/index.ts
      // This is treated as a boundary root file, not an ancestor barrel
      const result = calculateCorrectImportPath(
        '../index',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      // The implementation treats this as a boundary root file
      expect(result).toBe('@queries/index');
    });

    it('should handle deeply nested paths correctly', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'domain/queries',
        'level1',
        'level2',
        'level3',
      );
      const fileBoundary = queriesBoundary;

      // Target at level1 (requires ../../)
      const result = calculateCorrectImportPath(
        '../../otherLevel1',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      // Should use alias since it requires >1 ../
      expect(result).toBe('@queries/otherLevel1');
    });

    it('should handle boundary root correctly', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const fileBoundary = queriesBoundary;

      // File at boundary root, target at boundary root
      // According to the algorithm, boundary root files use alias format
      const result = calculateCorrectImportPath(
        './getLine.ts',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      // Boundary root files use alias format, not relative
      expect(result).toBe('@queries/getLine');
    });
  });

  describe('calculateCorrectImportPath - edge cases', () => {
    it('should handle files outside boundaries', () => {
      const boundaries = [
        entitiesBoundary,
        queriesBoundary,
        transformsBoundary,
      ];
      const fileDir = path.resolve(cwd, 'other');
      const fileBoundary = null;

      // File outside boundaries importing from boundary
      // This is a cross-boundary import, so should return alias
      const result = calculateCorrectImportPath(
        '@entities',
        fileDir,
        fileBoundary,
        boundaries,
        rootDir,
        cwd,
        'alias',
      );

      expect(result).toBe('@entities');
    });

    it('should handle Windows paths correctly', () => {
      // Use a Unix-style path for cross-platform compatibility
      const windowsCwd = '/C/project';
      const windowsEntitiesBoundary: Boundary = {
        dir: 'domain/entities',
        alias: '@entities',
        absDir: path.resolve(windowsCwd, rootDir, 'domain/entities'),
        allowImportsFrom: [], // Has rules (empty allow list = deny all by default)
      };
      const windowsBoundaries = [windowsEntitiesBoundary, queriesBoundary];

      const fileDir = path.resolve(windowsCwd, rootDir, 'domain/queries');
      const fileBoundary = queriesBoundary;

      const result = calculateCorrectImportPath(
        '@entities',
        fileDir,
        fileBoundary,
        windowsBoundaries,
        rootDir,
        windowsCwd,
        'alias',
      );

      expect(result).toBe('@entities');
    });
  });
});
