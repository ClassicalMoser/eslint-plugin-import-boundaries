/**
 * Unit tests for pathFormatValidation.ts
 */

import type { Boundary } from '@shared';
import type { Rule } from 'eslint';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixerFactory } from '../../infrastructure/eslint/fixerAdapter.js';
import { ESLintReporter } from '../../infrastructure/eslint/reporterAdapter.js';
import { validatePathFormat } from './pathFormatValidation';

describe('pathFormatValidation', () => {
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
        value: '../entities',
        raw: "'../entities'",
      },
    } as Rule.Node;

    mockContext = {
      report: vi.fn((descriptor) => {
        reportedViolations.push(descriptor as any);
      }),
    } as unknown as Rule.RuleContext;
  });

  describe('validatePathFormat', () => {
    it('should report incorrect path format', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const createFixer = createFixerFactory(mockNode);

      const result = validatePathFormat({
        rawSpec: '../entities',
        correctPath: '@entities',
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(true);
      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('incorrectImportPath');
      expect(violation.fix).toBeDefined();
    });

    it('should not report when path is correct', () => {
      const reporter = new ESLintReporter(mockContext, mockNode);
      const createFixer = createFixerFactory(mockNode);
      reportedViolations = [];

      const result = validatePathFormat({
        rawSpec: '@entities',
        correctPath: '@entities',
        fileBoundary: queriesBoundary,
        reporter,
        createFixer,
      });

      expect(result).toBe(false);
      const pathViolation = reportedViolations.find(
        (v) => v.messageId === 'incorrectImportPath',
      );
      expect(pathViolation).toBeUndefined();
    });
  });
});

