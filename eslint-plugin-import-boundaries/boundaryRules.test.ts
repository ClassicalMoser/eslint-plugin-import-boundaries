/**
 * Unit tests for boundaryRules.ts
 * Tests the allow/deny boundary rule logic.
 */

import { describe, it, expect } from 'vitest';
import { checkBoundaryRules } from './boundaryRules.js';
import type { Boundary } from './types.js';

describe('boundaryRules', () => {
  const entitiesBoundary: Boundary = {
    dir: 'domain/entities',
    alias: '@entities',
    absDir: '/project/src/domain/entities',
  };

  const queriesBoundary: Boundary = {
    dir: 'domain/queries',
    alias: '@queries',
    absDir: '/project/src/domain/queries',
  };

  const eventsBoundary: Boundary = {
    dir: 'domain/events',
    alias: '@events',
    absDir: '/project/src/domain/events',
  };

  const utilsBoundary: Boundary = {
    dir: 'domain/utils',
    alias: '@utils',
    absDir: '/project/src/domain/utils',
  };

  const allBoundaries = [
    entitiesBoundary,
    queriesBoundary,
    eventsBoundary,
    utilsBoundary,
  ];

  describe('checkBoundaryRules - same boundary', () => {
    it('should allow imports within the same boundary', () => {
      const result = checkBoundaryRules(
        entitiesBoundary,
        entitiesBoundary,
        allBoundaries,
        false,
      );

      expect(result).toBeNull();
    });
  });

  describe('checkBoundaryRules - allowImportsFrom', () => {
    it('should allow imports from boundaries in allowImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events', '@utils'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        eventsBoundary,
        allBoundaries,
        false,
      );

      expect(result).toBeNull();
    });

    it('should deny imports from boundaries not in allowImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        false,
      );

      expect(result).not.toBeNull();
      expect(result?.reason).toContain('not allowed');
      expect(result?.reason).toContain('@queries');
    });

    it('should deny all by default when only allowImportsFrom is specified', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        utilsBoundary,
        allBoundaries,
        false,
      );

      expect(result).not.toBeNull();
    });
  });

  describe('checkBoundaryRules - denyImportsFrom', () => {
    it('should deny imports from boundaries in denyImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        denyImportsFrom: ['@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        false,
      );

      expect(result).not.toBeNull();
      expect(result?.reason).toContain('explicitly denies');
      expect(result?.reason).toContain('@queries');
    });

    it('should allow imports from boundaries not in denyImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        denyImportsFrom: ['@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        eventsBoundary,
        allBoundaries,
        false,
      );

      expect(result).toBeNull();
    });

    it('should allow all by default when only denyImportsFrom is specified', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        denyImportsFrom: ['@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        utilsBoundary,
        allBoundaries,
        false,
      );

      expect(result).toBeNull();
    });
  });

  describe('checkBoundaryRules - both allow and deny', () => {
    it('should allow imports when in both lists (allow takes precedence)', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@queries', '@events'],
        denyImportsFrom: ['@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        false,
      );

      expect(result).toBeNull();
    });

    it('should deny imports when in deny list but not in allow list', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
        denyImportsFrom: ['@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        false,
      );

      expect(result).not.toBeNull();
    });
  });

  describe('checkBoundaryRules - no rules', () => {
    it('should deny all by default when neither allow nor deny is specified', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        false,
      );

      expect(result).not.toBeNull();
      expect(result?.reason).toContain('not allowed');
    });
  });

  describe('checkBoundaryRules - type-only imports', () => {
    it('should allow type imports from allowTypeImportsFrom even if not in allowImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
        allowTypeImportsFrom: ['@utils', '@queries'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        utilsBoundary,
        allBoundaries,
        true, // isTypeOnly
      );

      expect(result).toBeNull();
    });

    it('should deny type imports not in allowTypeImportsFrom', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
        allowTypeImportsFrom: ['@utils'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        true, // isTypeOnly
      );

      expect(result).not.toBeNull();
    });

    it('should fall back to allowImportsFrom for type imports if allowTypeImportsFrom not specified', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
      };

      const result = checkBoundaryRules(
        fileBoundary,
        eventsBoundary,
        allBoundaries,
        true, // isTypeOnly
      );

      expect(result).toBeNull();
    });

    it('should use allowTypeImportsFrom over allowImportsFrom for type imports', () => {
      const fileBoundary: Boundary = {
        ...entitiesBoundary,
        allowImportsFrom: ['@events'],
        allowTypeImportsFrom: ['@queries'],
      };

      // @queries is in allowTypeImportsFrom but not allowImportsFrom
      const result = checkBoundaryRules(
        fileBoundary,
        queriesBoundary,
        allBoundaries,
        true, // isTypeOnly
      );

      expect(result).toBeNull();
    });
  });
});

