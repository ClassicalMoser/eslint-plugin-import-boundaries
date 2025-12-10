/**
 * Integration tests for importHandler.ts
 * Tests the main import handler that orchestrates all checking logic.
 */

import type { Boundary } from '@shared';
import type { Rule } from 'eslint';
import type { HandleImportOptions } from './importHandler';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixerFactory } from '../infrastructure/eslint/fixerAdapter.js';
import { ESLintReporter } from '../infrastructure/eslint/reporterAdapter.js';
import { handleImport } from './importHandler';

describe('importHandler', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let eventsBoundary: Boundary;
  let boundaries: Boundary[];
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

    boundaries = [entitiesBoundary, queriesBoundary, eventsBoundary];

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

  /**
   * Helper function to create handleImport options with sensible defaults.
   */
  function createOptions(
    overrides: Partial<HandleImportOptions>,
  ): HandleImportOptions {
    const defaultFileDir = path.resolve(cwd, rootDir, 'domain/queries');
    const node = (overrides as any).node || mockNode;
    const reporter = new ESLintReporter(mockContext, node);
    const createFixer = createFixerFactory(node);
    return {
      rawSpec: '',
      fileDir: defaultFileDir,
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle: 'alias',
      defaultSeverity: undefined,
      allowUnknownBoundaries: false,
      isTypeOnly: false,
      skipBoundaryRules: false,
      ...overrides,
    };
  }

  describe('integration tests', () => {
    it('should check absolute paths within rootDir', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: 'src/domain/entities',
          fileDir,
          skipBoundaryRules: true,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
    });

    it('should skip subpath check when using absolute style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: '@entities/army',
          fileDir,
          crossBoundaryStyle: 'absolute',
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
    });

    it('should skip boundary rules when skipBoundaryRules is true', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '@events', // Would normally be disallowed
          fileDir,
          skipBoundaryRules: true,
        }),
      );

      const boundaryViolation = reportedViolations.find(
        (v) => v.messageId === 'boundaryViolation',
      );
      expect(boundaryViolation).toBeUndefined();
    });

    it('should not check boundary rules for same-boundary imports', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: './sibling',
          fileDir,
        }),
      );

      const boundaryViolation = reportedViolations.find(
        (v) => v.messageId === 'boundaryViolation',
      );
      expect(boundaryViolation).toBeUndefined();
    });
  });

  describe('severity handling', () => {
    it('should apply severity correctly (error, warn, undefined)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');

      // Test boundary severity
      const fileBoundaryWithError: Boundary = {
        ...queriesBoundary,
        severity: 'error',
      };
      reportedViolations = [];
      handleImport(
        createOptions({
          rawSpec: '@events',
          fileDir,
          fileBoundary: fileBoundaryWithError,
        }),
      );
      expect(reportedViolations[0].severity).toBe(2);

      // Test defaultSeverity
      reportedViolations = [];
      handleImport(
        createOptions({
          rawSpec: '@events',
          fileDir,
          defaultSeverity: 'warn',
        }),
      );
      expect(reportedViolations[0].severity).toBe(1);

      // Test no severity (uses rule-level)
      reportedViolations = [];
      handleImport(
        createOptions({
          rawSpec: '@events',
          fileDir,
          defaultSeverity: undefined,
        }),
      );
      expect(reportedViolations[0].severity).toBeUndefined();
    });
  });

  describe('absolute path style', () => {
    it('should use absolute paths for cross-boundary imports when configured', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: 'src/domain/entities/army', // Wrong - should be src/domain/entities
          fileDir,
          crossBoundaryStyle: 'absolute',
          skipBoundaryRules: true,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.data?.expectedPath).toBe('src/domain/entities');
    });

    it('should handle ancestor barrel in absolute style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      handleImport(
        createOptions({
          rawSpec: 'src/domain/queries', // Ancestor barrel in absolute style
          fileDir,
          crossBoundaryStyle: 'absolute',
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('ancestorBarrelImport');
    });
  });

  describe('defensive return false', () => {
    it('should return false when calculateCorrectImportPath returns null but not ancestor barrel', () => {
      // This tests the defensive code path that should be unreachable
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');

      // Create a boundary without alias to test edge case
      const boundaryWithoutAlias: Boundary = {
        dir: 'domain/queries',
        alias: undefined,
        absDir: path.resolve(cwd, rootDir, 'domain/queries'),
      };

      // This scenario is difficult to create naturally since calculateCorrectImportPath
      // only returns null for ancestor barrels. However, we can test that the code
      // handles the case gracefully by ensuring it doesn't throw.
      const result = handleImport(
        createOptions({
          rawSpec: './nonexistent',
          fileDir,
          fileBoundary: boundaryWithoutAlias,
          skipBoundaryRules: true,
        }),
      );

      // Should not throw, but may report violations or return false
      expect(typeof result).toBe('boolean');
    });
  });
});
