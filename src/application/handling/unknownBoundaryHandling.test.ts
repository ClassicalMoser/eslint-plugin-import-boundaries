/**
 * Unit tests for unknownBoundaryHandling.ts
 */

import type { Rule } from 'eslint';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ESLintReporter } from '../../infrastructure/eslint/reporterAdapter.js';
import { handleUnknownBoundary } from './unknownBoundaryHandling';

describe('unknownBoundaryHandling', () => {
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
    reportedViolations = [];

    mockNode = {
      type: 'ImportDeclaration',
      source: {
        type: 'Literal',
        value: '../unknown',
        raw: "'../unknown'",
      },
    } as Rule.Node;

    mockContext = {
      report: vi.fn((descriptor) => {
        reportedViolations.push(descriptor as any);
      }),
    } as unknown as Rule.RuleContext;
  });

  describe('handleUnknownBoundary', () => {
    it('should report unknown boundary imports when not allowed', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);

      const result = handleUnknownBoundary({
        rawSpec: '../unknown',
        allowUnknownBoundaries: false,
        reporter,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('unknownBoundaryImport');
      expect(violation.data?.path).toBe('../unknown');
      expect(violation.fix).toBeUndefined();
    });

    it('should allow unknown boundary imports when allowed', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      reportedViolations = [];

      const result = handleUnknownBoundary({
        rawSpec: '../unknown',
        allowUnknownBoundaries: true,
        reporter,
      });

      expect(result).toBe(false);
      const violation = reportedViolations.find(
        (v) => v.messageId === 'unknownBoundaryImport',
      );
      expect(violation).toBeUndefined();
    });
  });
});

