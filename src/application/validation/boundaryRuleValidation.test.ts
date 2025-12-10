/**
 * Unit tests for boundaryRuleValidation.ts
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { validateBoundaryRules } from './boundaryRuleValidation';

describe('boundaryRuleValidation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let eventsBoundary: Boundary;

  beforeEach(() => {
    entitiesBoundary = createBoundary(
      {
        dir: 'domain/entities',
        alias: '@entities',
        allowImportsFrom: ['@events'],
      },
      { cwd, rootDir },
    );

    queriesBoundary = createBoundary(
      {
        dir: 'domain/queries',
        alias: '@queries',
        allowImportsFrom: ['@entities'],
      },
      { cwd, rootDir },
    );

    eventsBoundary = createBoundary(
      {
        dir: 'domain/events',
        alias: '@events',
        allowImportsFrom: [],
      },
      { cwd, rootDir },
    );
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
      const fileBoundaryWithTypeAllow: Boundary = createBoundary(
        {
          dir: 'domain/queries',
          alias: '@queries',
          allowImportsFrom: ['@entities'],
          allowTypeImportsFrom: ['@events'],
        },
        { cwd, rootDir },
      );

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
