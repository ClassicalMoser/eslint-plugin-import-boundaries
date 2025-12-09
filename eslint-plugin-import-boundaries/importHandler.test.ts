/**
 * Unit tests for importHandler.ts
 * Tests the main import handler that orchestrates all checking logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Rule } from 'eslint';
import path from 'node:path';
import { handleImport, type HandleImportOptions } from './importHandler.js';
import type { Boundary } from './types.js';

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
    return {
      node: mockNode,
      rawSpec: '',
      fileDir: path.resolve(cwd, rootDir, 'domain/queries'),
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      context: mockContext,
      crossBoundaryStyle: 'alias',
      defaultSeverity: undefined,
      allowUnknownBoundaries: false,
      isTypeOnly: false,
      skipBoundaryRules: false,
      ...overrides,
    };
  }

  describe('external package detection', () => {
    it('should skip checking for external packages', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const result = handleImport(
        createOptions({
          rawSpec: 'lodash',
          fileDir,
        }),
      );

      expect(result).toBe(false);
      expect(mockContext.report).not.toHaveBeenCalled();
    });

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
  });

  describe('cross-boundary alias subpaths', () => {
    it('should flag cross-boundary alias subpaths', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: '@entities/army',
          fileDir,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('incorrectImportPath');
      expect(violation.data?.expectedPath).toBe('@entities');
      expect(violation.fix).toBeDefined();
    });

    it('should not flag subpaths within same boundary', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '@queries/otherSubdir',
          fileDir,
          skipBoundaryRules: true,
        }),
      );

      const subpathViolation = reportedViolations.find(
        (v) =>
          v.data?.actualPath === '@queries/otherSubdir' &&
          v.data?.expectedPath === '@queries',
      );
      expect(subpathViolation).toBeUndefined();
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
  });

  describe('boundary rules enforcement', () => {
    it('should report violations for disallowed boundaries', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: '@events', // Not in allowImportsFrom
          fileDir,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('boundaryViolation');
      expect(violation.data?.from).toBe('@queries');
      expect(violation.data?.to).toBe('@events');
    });

    it('should not report when boundary rule allows import', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '@entities', // Allowed by boundary rules
          fileDir,
        }),
      );

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

      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '@events',
          fileDir,
          fileBoundary: fileBoundaryWithTypeAllow,
          isTypeOnly: true,
        }),
      );

      const boundaryViolation = reportedViolations.find(
        (v) => v.messageId === 'boundaryViolation',
      );
      expect(boundaryViolation).toBeUndefined();
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

  describe('path format enforcement', () => {
    it('should report incorrect path format', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      handleImport(
        createOptions({
          rawSpec: '../entities', // Wrong - should be @entities for cross-boundary
          fileDir,
          skipBoundaryRules: true,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('incorrectImportPath');
      expect(violation.fix).toBeDefined();
    });

    it('should not report when path is correct', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '@entities', // Correct for cross-boundary
          fileDir,
          skipBoundaryRules: true,
        }),
      );

      const pathViolation = reportedViolations.find(
        (v) => v.messageId === 'incorrectImportPath',
      );
      expect(pathViolation).toBeUndefined();
    });
  });

  describe('ancestor barrel imports', () => {
    it('should report ancestor barrel imports', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      handleImport(
        createOptions({
          rawSpec: '@queries', // Ancestor barrel
          fileDir,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('ancestorBarrelImport');
      expect(violation.data?.alias).toBe('@queries');
      expect(violation.fix).toBeUndefined();
    });
  });

  describe('unknown boundaries', () => {
    it('should report unknown boundary imports when not allowed', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      handleImport(
        createOptions({
          rawSpec: '../unknown',
          fileDir,
          allowUnknownBoundaries: false,
        }),
      );

      expect(mockContext.report).toHaveBeenCalled();
      const violation = reportedViolations[0];
      expect(violation.messageId).toBe('unknownBoundaryImport');
      expect(violation.data?.path).toBe('../unknown');
      expect(violation.fix).toBeUndefined();
    });

    it('should allow unknown boundary imports when allowed', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      reportedViolations = [];

      handleImport(
        createOptions({
          rawSpec: '../unknown',
          fileDir,
          allowUnknownBoundaries: true,
        }),
      );

      const violation = reportedViolations.find(
        (v) => v.messageId === 'unknownBoundaryImport',
      );
      expect(violation).toBeUndefined();
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
  });
});
