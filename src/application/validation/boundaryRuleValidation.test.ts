/**
 * Unit tests for boundaryRuleValidation.ts
 */

import type { Boundary } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ESLintReporter } from '../../infrastructure/eslint/reporterAdapter.js';
import { validateBoundaryRules } from './boundaryRuleValidation';

describe('boundaryRuleValidation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let eventsBoundary: Boundary;
  let mockContext: Rule.RuleContext;
  let mockNode: Rule.Node;
  let reportedViolations: Array<{
    node: Rule.Node;
    messageId: string;
    data?: Record<string, string>;
    fix?: Rule.ReportFixer;
    severity?: number;
  }>;

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

    reportedViolations = [];

    mockNode = {
      type: 'ImportDeclaration',
      source: {
        type: 'Literal',
        value: '@entities',
        raw: "'@entities'",
      },
    } as Rule.Node;

    mockContext = {
      report: vi.fn((descriptor) => {
        reportedViolations.push(descriptor as any);
      }),
    } as unknown as Rule.RuleContext;
  });

  describe('validateBoundaryRules', () => {
    it('should report violations for disallowed boundaries', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];

      const result = validateBoundaryRules({
        fileBoundary: queriesBoundary,
        targetBoundary: eventsBoundary,
        boundaries,
        isTypeOnly: false,
        reporter,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('boundaryViolation');
      expect(violation.data?.from).toBe('@queries');
      expect(violation.data?.to).toBe('@events');
    });

    it('should not report when boundary rule allows import', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];
      reportedViolations = [];

      const result = validateBoundaryRules({
        fileBoundary: queriesBoundary,
        targetBoundary: entitiesBoundary,
        boundaries,
        isTypeOnly: false,
        reporter,
      });

      expect(result).toBe(false);
      const boundaryViolation = reportedViolations.find(
        (v) => v.messageId === 'boundaryViolation',
      );
      expect(boundaryViolation).toBeUndefined();
    });

    it('should allow type-only imports from allowTypeImportsFrom', () => {
      const fileBoundaryWithTypeAllow: Boundary = {
        ...queriesBoundary,
        allowImportsFrom: ['@entities'],
        allowTypeImportsFrom: ['@events'],
      };

      const reporter = new ESLintReporter(mockContext, mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];
      reportedViolations = [];

      const result = validateBoundaryRules({
        fileBoundary: fileBoundaryWithTypeAllow,
        targetBoundary: eventsBoundary,
        boundaries,
        isTypeOnly: true,
        reporter,
      });

      expect(result).toBe(false);
      const boundaryViolation = reportedViolations.find(
        (v) => v.messageId === 'boundaryViolation',
      );
      expect(boundaryViolation).toBeUndefined();
    });
  });
});

