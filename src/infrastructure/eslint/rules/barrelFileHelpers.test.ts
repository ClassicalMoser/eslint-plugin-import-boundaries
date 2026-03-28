/**
 * Unit tests for barrelFileHelpers.ts
 * Tests the pure functions that power the barrel file rules.
 */

import { describe, expect, it } from 'vitest';
import { classifyBarrelImport, isBarrelFile } from './barrelFileHelpers';

describe('isBarrelFile', () => {
  describe('with default index barrel name', () => {
    it('should return true for index.ts', () => {
      expect(isBarrelFile('/project/src/domain/index.ts', 'index')).toBe(true);
    });

    it('should return true for index.js', () => {
      expect(isBarrelFile('/project/src/domain/index.js', 'index')).toBe(true);
    });

    it('should return true for index.tsx', () => {
      expect(isBarrelFile('/project/src/domain/index.tsx', 'index')).toBe(true);
    });

    it('should return false for army.ts', () => {
      expect(isBarrelFile('/project/src/domain/army.ts', 'index')).toBe(false);
    });

    it('should return false for indexHelper.ts (starts with index but not exactly index)', () => {
      expect(isBarrelFile('/project/src/domain/indexHelper.ts', 'index')).toBe(
        false,
      );
    });

    it('should return false for re-index.ts', () => {
      expect(isBarrelFile('/project/src/domain/re-index.ts', 'index')).toBe(
        false,
      );
    });
  });

  describe('with custom barrel name', () => {
    it('should return true for barrel.ts with barrelFileName: barrel', () => {
      expect(isBarrelFile('/project/src/domain/barrel.ts', 'barrel')).toBe(
        true,
      );
    });

    it('should return false for index.ts with barrelFileName: barrel', () => {
      expect(isBarrelFile('/project/src/domain/index.ts', 'barrel')).toBe(
        false,
      );
    });
  });
});

describe('classifyBarrelImport', () => {
  describe('valid sibling imports', () => {
    it('should classify ./file.ts as valid', () => {
      expect(classifyBarrelImport('./file.ts')).toBe('valid');
    });

    it('should classify ./army.ts as valid', () => {
      expect(classifyBarrelImport('./army.ts')).toBe('valid');
    });

    it('should classify ./utils.js as valid', () => {
      expect(classifyBarrelImport('./utils.js')).toBe('valid');
    });

    it('should classify ./component.tsx as valid', () => {
      expect(classifyBarrelImport('./component.tsx')).toBe('valid');
    });

    it('should classify ./types.d.ts as valid', () => {
      expect(classifyBarrelImport('./types.d.ts')).toBe('valid');
    });
  });

  describe('directory references (no extension) — valid sibling dirs', () => {
    it('should classify ./sibling (no ext) as valid — directory reference', () => {
      expect(classifyBarrelImport('./sibling')).toBe('valid');
    });

    it('should classify ./army as valid — directory reference', () => {
      expect(classifyBarrelImport('./army')).toBe('valid');
    });

    it('should classify ./entities as valid — directory reference', () => {
      expect(classifyBarrelImport('./entities')).toBe('valid');
    });
  });

  describe('not-sibling imports', () => {
    it('should classify ../parent as not-sibling', () => {
      expect(classifyBarrelImport('../parent')).toBe('not-sibling');
    });

    it('should classify ../parent.ts as not-sibling', () => {
      expect(classifyBarrelImport('../parent.ts')).toBe('not-sibling');
    });

    it('should classify ./subdir/file.ts as not-sibling (below)', () => {
      expect(classifyBarrelImport('./subdir/file.ts')).toBe('not-sibling');
    });

    it('should classify ./sub/deep/file.ts as not-sibling', () => {
      expect(classifyBarrelImport('./sub/deep/file.ts')).toBe('not-sibling');
    });

    it('should classify src/domain as not-sibling (absolute)', () => {
      expect(classifyBarrelImport('src/domain')).toBe('not-sibling');
    });

    it('should classify @domain as not-sibling (alias)', () => {
      expect(classifyBarrelImport('@domain')).toBe('not-sibling');
    });

    it('should classify @domain/service as not-sibling', () => {
      expect(classifyBarrelImport('@domain/service')).toBe('not-sibling');
    });

    it('should classify lodash as not-sibling (npm package)', () => {
      expect(classifyBarrelImport('lodash')).toBe('not-sibling');
    });
  });
});
