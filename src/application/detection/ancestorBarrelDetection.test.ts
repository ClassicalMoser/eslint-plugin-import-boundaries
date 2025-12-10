/**
 * Unit tests for ancestorBarrelDetection.ts
 */

import type { Boundary } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ESLintReporter } from '../../infrastructure/eslint/reporterAdapter.js';
import { detectAndReportAncestorBarrel } from './ancestorBarrelDetection';

describe('ancestorBarrelDetection', () => {
  const cwd = '/project';
  const rootDir = 'src';

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
        value: '@queries',
        raw: "'@queries'",
      },
    } as Rule.Node;

    mockContext = {
      report: vi.fn((descriptor) => {
        reportedViolations.push(descriptor as any);
      }),
    } as unknown as Rule.RuleContext;
  });

  describe('detectAndReportAncestorBarrel', () => {
    it('should report ancestor barrel imports in alias style', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);

      const result = detectAndReportAncestorBarrel({
        rawSpec: '@queries',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'alias',
        reporter,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('ancestorBarrelImport');
      expect(violation.data?.alias).toBe('@queries');
      expect(violation.fix).toBeUndefined();
    });

    it('should report ancestor barrel imports in absolute style', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);

      const result = detectAndReportAncestorBarrel({
        rawSpec: 'src/domain/queries',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'absolute',
        reporter,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('ancestorBarrelImport');
    });

    it('should return false when not an ancestor barrel', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      reportedViolations = [];

      const result = detectAndReportAncestorBarrel({
        rawSpec: '@entities',
        fileBoundary: queriesBoundary,
        rootDir,
        crossBoundaryStyle: 'alias',
        reporter,
      });

      expect(result).toBe(false);
      expect(mockContext.report).not.toHaveBeenCalled();
    });
  });
});

