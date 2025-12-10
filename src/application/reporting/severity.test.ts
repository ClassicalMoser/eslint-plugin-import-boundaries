/**
 * Unit tests for severity.ts
 * Tests the severity calculation logic.
 */

import type { Boundary } from '@shared';
import { describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { getSeverity } from './severity';

describe('severity', () => {
  describe('getSeverity', () => {
    it('should return boundary-specific severity when set', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        severity: 'warn',
      });

      const result = getSeverity(fileBoundary, 'error');

      expect(result).toBe('warn');
    });

    it('should return default severity when boundary has no severity', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      const result = getSeverity(fileBoundary, 'error');

      expect(result).toBe('error');
    });

    it('should return undefined when neither boundary nor default severity is set', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      const result = getSeverity(fileBoundary);

      expect(result).toBeUndefined();
    });

    it('should return default severity when fileBoundary is null', () => {
      const result = getSeverity(null, 'warn');

      expect(result).toBe('warn');
    });

    it('should return undefined when fileBoundary is null and no default severity', () => {
      const result = getSeverity(null);

      expect(result).toBeUndefined();
    });

    it('should prioritize boundary severity over default severity', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        severity: 'error',
      });

      const result = getSeverity(fileBoundary, 'warn');

      expect(result).toBe('error');
    });

    it('should handle warn severity from boundary', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        severity: 'warn',
      });

      const result = getSeverity(fileBoundary, 'error');

      expect(result).toBe('warn');
    });

    it('should handle error severity from boundary', () => {
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        severity: 'error',
      });

      const result = getSeverity(fileBoundary, 'warn');

      expect(result).toBe('error');
    });
  });
});
