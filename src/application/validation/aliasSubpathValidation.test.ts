/**
 * Unit tests for aliasSubpathValidation.ts
 */

import type { Boundary } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixerFactory } from '../../infrastructure/eslint/fixerAdapter.js';
import { ESLintReporter } from '../../infrastructure/eslint/reporterAdapter.js';
import { validateAliasSubpath } from './aliasSubpathValidation';

describe('aliasSubpathValidation', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
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
      allowImportsFrom: [],
    };

    queriesBoundary = {
      dir: 'domain/queries',
      alias: '@queries',
      absDir: path.resolve(cwd, rootDir, 'domain/queries'),
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

  describe('validateAliasSubpath', () => {
    it('should flag cross-boundary alias subpaths', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const createFixer = createFixerFactory(mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary];

      const result = validateAliasSubpath({
        rawSpec: '@entities/army',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('incorrectImportPath');
      expect(violation.data?.expectedPath).toBe('@entities');
      expect(violation.fix).toBeDefined();
    });

    it('should not flag subpaths within same boundary', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const createFixer = createFixerFactory(mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary];
      reportedViolations = [];

      const result = validateAliasSubpath({
        rawSpec: '@queries/otherSubdir',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      const subpathViolation = reportedViolations.find(
        (v) =>
          v.data?.actualPath === '@queries/otherSubdir' &&
          v.data?.expectedPath === '@queries',
      );
      expect(subpathViolation).toBeUndefined();
    });

    it('should return false when not a subpath', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const createFixer = createFixerFactory(mockNode);
      const boundaries = [entitiesBoundary, queriesBoundary];
      reportedViolations = [];

      const result = validateAliasSubpath({
        rawSpec: '@entities',
        boundaries,
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      expect(mockContext.report).not.toHaveBeenCalled();
    });
  });
});

