/**
 * Unit tests for boundaryRuleValidation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { validateBoundaryRules } from './boundaryRuleValidation';

describe('boundaryRuleValidation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let eventsBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = {
      dir: 'domain/entities',
      alias: '@entities',
      absDir: path.resolve(cwd, rootDir, 'domain/entities'),
      allowImportsFrom: ['@events'],
    };

    queriesBoundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      allowImportsFrom: ['@entities'],
    };

    eventsBoundary = {
      dir: 'domain/events',
      alias: '@events',
      absDir: path.resolve(cwd, rootDir, 'domain/events'),
      allowImportsFrom: [],
    };
  });

  describe('validateBoundaryRules', () => {
    it('should report violations for disallowed boundaries', () => {
      const { reporter } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];

      const result = validateBoundaryRules({
        fileBoundary: queriesBoundary,
        targetBoundary: eventsBoundary,
        boundaries,
        isTypeOnly: false,
        reporter,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('@queries');
      expect(violation?.data?.to).toBe('@events');
    });

    it('should not report when boundary rule allows import', () => {
      const { reporter } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];

      const result = validateBoundaryRules({
        fileBoundary: queriesBoundary,
        targetBoundary: entitiesBoundary,
        boundaries,
        isTypeOnly: false,
        reporter,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
      expect(reporter.hasReported('boundaryViolation')).toBe(false);
    });

    it('should allow type-only imports from allowTypeImportsFrom', () => {
      const fileBoundaryWithTypeAllow: Boundary = {
        ...queriesBoundary,
        allowImportsFrom: ['@entities'],
        allowTypeImportsFrom: ['@events'],
      };

      const { reporter } = createMockPorts();
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];

      const result = validateBoundaryRules({
        fileBoundary: fileBoundaryWithTypeAllow,
        targetBoundary: eventsBoundary,
        boundaries,
        isTypeOnly: true,
        reporter,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
      expect(reporter.hasReported('boundaryViolation')).toBe(false);
    });
  });
});
