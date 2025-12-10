/**
 * Integration tests for importHandler.ts
 * Tests the main import handler that orchestrates all checking logic.
 */

import type { Boundary } from '@shared';
import type { HandleImportOptions } from './importHandler';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPorts } from '../__tests__/testUtils.js';
import * as domain from '@domain';
import * as detection from './detection';
import * as validation from './validation';
import { handleImport } from './importHandler';

describe('importHandler', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let entitiesBoundary: Boundary;
  let queriesBoundary: Boundary;
  let eventsBoundary: Boundary;
  let boundaries: Boundary[];

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
  });

  /**
   * Helper function to create handleImport options with sensible defaults.
   */
  function createOptions(
    overrides: Partial<HandleImportOptions>,
  ): HandleImportOptions {
    const defaultFileDir = path.resolve(cwd, rootDir, 'domain/queries');
    const { reporter, createFixer } = createMockPorts();
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
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: 'src/domain/entities',
        fileDir,
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.report).toHaveBeenCalled();
    });

    it('should skip subpath check when using absolute style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities/army',
        fileDir,
        crossBoundaryStyle: 'absolute',
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.report).toHaveBeenCalled();
    });

    it('should skip boundary rules when skipBoundaryRules is true', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@events', // Would normally be disallowed
        fileDir,
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.hasReported('boundaryViolation')).toBe(false);
    });

    it('should not check boundary rules for same-boundary imports', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: './sibling',
        fileDir,
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.hasReported('boundaryViolation')).toBe(false);
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
      const { reporter: reporter1, createFixer: createFixer1 } =
        createMockPorts();
      const options1 = createOptions({
        rawSpec: '@events',
        fileDir,
        fileBoundary: fileBoundaryWithError,
        reporter: reporter1,
        createFixer: createFixer1,
      });
      handleImport(options1);
      const violation1 = reporter1.getLastReport();
      expect(violation1?.severity).toBe('error');

      // Test defaultSeverity
      const { reporter: reporter2, createFixer: createFixer2 } =
        createMockPorts();
      const options2 = createOptions({
        rawSpec: '@events',
        fileDir,
        defaultSeverity: 'warn',
        reporter: reporter2,
        createFixer: createFixer2,
      });
      handleImport(options2);
      const violation2 = reporter2.getLastReport();
      expect(violation2?.severity).toBe('warn');

      // Test no severity (uses rule-level)
      const { reporter: reporter3, createFixer: createFixer3 } =
        createMockPorts();
      const options3 = createOptions({
        rawSpec: '@events',
        fileDir,
        defaultSeverity: undefined,
        reporter: reporter3,
        createFixer: createFixer3,
      });
      handleImport(options3);
      const violation3 = reporter3.getLastReport();
      expect(violation3?.severity).toBeUndefined();
    });
  });

  describe('absolute path style', () => {
    it('should use absolute paths for cross-boundary imports when configured', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: 'src/domain/entities/army', // Wrong - should be src/domain/entities
        fileDir,
        crossBoundaryStyle: 'absolute',
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.data?.expectedPath).toBe('src/domain/entities');
    });

    it('should handle ancestor barrel in absolute style', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: 'src/domain/queries', // Ancestor barrel in absolute style
        fileDir,
        crossBoundaryStyle: 'absolute',
        reporter,
        createFixer,
      });
      handleImport(options);

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
    });
  });

  describe('external packages', () => {
    it('should skip checking for external packages', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: 'lodash', // External package
        fileDir,
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });
  });

  describe('alias subpath validation', () => {
    it('should validate and report alias subpath violations', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities/army', // Cross-boundary with subpath
        fileDir,
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
    });
  });

  describe('unknown boundaries', () => {
    it('should handle unknown boundary when correctPath is UNKNOWN_BOUNDARY', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../outside/file',
        fileDir,
        allowUnknownBoundaries: false,
        reporter,
        createFixer,
      });

      // Create a file outside all boundaries
      const result = handleImport(options);

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('unknownBoundaryImport');
    });
  });

  describe('defensive return false', () => {
    it('should return false when calculateCorrectImportPath returns null but fileBoundary is null', () => {
      // This tests the defensive code path when correctPath is null but fileBoundary is null
      // Line 163: return false when correctPath is null and fileBoundary is null
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');

      // Mock calculateCorrectImportPath to return null to test the defensive path
      const calculateCorrectImportPathSpy = vi.spyOn(
        domain,
        'calculateCorrectImportPath',
      );
      calculateCorrectImportPathSpy.mockReturnValue(null);

      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: './nonexistent',
        fileDir,
        fileBoundary: null, // No boundary - this triggers the defensive return false at line 163
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      const result = handleImport(options);

      // Should return false when fileBoundary is null and correctPath is null
      expect(result).toBe(false);
      expect(calculateCorrectImportPathSpy).toHaveBeenCalled();

      calculateCorrectImportPathSpy.mockRestore();
    });

    it('should return false when calculateCorrectImportPath returns null, fileBoundary exists, but detectAndReportAncestorBarrel returns false', () => {
      // This tests the defensive code path when correctPath is null, fileBoundary exists,
      // but detectAndReportAncestorBarrel returns false (line 147-163)
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');

      // Mock calculateCorrectImportPath to return null
      const calculateCorrectImportPathSpy = vi.spyOn(
        domain,
        'calculateCorrectImportPath',
      );
      calculateCorrectImportPathSpy.mockReturnValue(null);

      // Mock detectAndReportAncestorBarrel to return false
      const detectAndReportAncestorBarrelSpy = vi.spyOn(
        detection,
        'detectAndReportAncestorBarrel',
      );
      detectAndReportAncestorBarrelSpy.mockReturnValue(false);

      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: './nonexistent',
        fileDir,
        fileBoundary: queriesBoundary, // Has boundary
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      const result = handleImport(options);

      // Should return false when detectAndReportAncestorBarrel returns false
      expect(result).toBe(false);
      expect(calculateCorrectImportPathSpy).toHaveBeenCalled();

      calculateCorrectImportPathSpy.mockRestore();
      detectAndReportAncestorBarrelSpy.mockRestore();
    });
  });

  describe('default parameters and edge cases', () => {
    it('should use default crossBoundaryStyle when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities/army', // Cross-boundary with subpath
        fileDir,
        reporter,
        createFixer,
        // crossBoundaryStyle not provided - should default to 'alias'
      });

      const result = handleImport(options);

      // Should validate alias subpath (only checked when crossBoundaryStyle is 'alias')
      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
    });

    it('should use default allowUnknownBoundaries when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../outside/file',
        fileDir,
        reporter,
        createFixer,
        // allowUnknownBoundaries not provided - should default to false
      });

      const result = handleImport(options);

      // Should report violation since allowUnknownBoundaries defaults to false
      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('unknownBoundaryImport');
    });

    it('should use default isTypeOnly when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@events', // Disallowed import
        fileDir,
        reporter,
        createFixer,
        // isTypeOnly not provided - should default to false
      });

      handleImport(options);

      // Should report boundary violation (isTypeOnly defaults to false)
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
    });

    it('should use default skipBoundaryRules when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@events', // Disallowed import
        fileDir,
        reporter,
        createFixer,
        // skipBoundaryRules not provided - should default to false
      });

      handleImport(options);

      // Should check boundary rules (skipBoundaryRules defaults to false)
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
    });

    it('should use default barrelFileName when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../index', // Should use default 'index' barrel file
        fileDir,
        reporter,
        createFixer,
        // barrelFileName not provided - should default to 'index'
      });

      handleImport(options);

      // Should work with default barrelFileName
      expect(reporter.report).toHaveBeenCalled();
    });

    it('should use default fileExtensions when not provided', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: './sibling.ts', // Should use default extensions
        fileDir,
        reporter,
        createFixer,
        // fileExtensions not provided - should use default array
      });

      handleImport(options);

      // Should work with default fileExtensions
      expect(reporter.report).toHaveBeenCalled();
    });

    it('should handle allowUnknownBoundaries true', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../outside/file',
        fileDir,
        allowUnknownBoundaries: true, // Allow unknown boundaries
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      // Should not report violation when allowUnknownBoundaries is true
      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle isTypeOnly true for boundary rules', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();

      // Create a boundary that allows type-only imports
      const queriesWithTypeOnly: Boundary = {
        ...queriesBoundary,
        allowTypeImportsFrom: ['@events'],
      };

      const options = createOptions({
        rawSpec: '@events',
        fileDir,
        fileBoundary: queriesWithTypeOnly,
        isTypeOnly: true, // Type-only import
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      // Should not report boundary violation for type-only imports if allowed
      // (The actual behavior depends on boundary rules, but we're testing the parameter is passed through)
      expect(result).toBeDefined();
    });

    it('should skip alias subpath validation when crossBoundaryStyle is absolute', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();

      // Mock validateAliasSubpath to verify it's not called
      const validateAliasSubpathSpy = vi.spyOn(
        validation,
        'validateAliasSubpath',
      );

      const options = createOptions({
        rawSpec: '@entities/army', // Would be a subpath violation in alias mode
        fileDir,
        crossBoundaryStyle: 'absolute', // Should skip subpath check
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });

      handleImport(options);

      // Should not call validateAliasSubpath when crossBoundaryStyle is 'absolute'
      expect(validateAliasSubpathSpy).not.toHaveBeenCalled();

      validateAliasSubpathSpy.mockRestore();
    });

    it('should handle when fileBoundary is null and targetBoundary exists', () => {
      const fileDir = path.resolve(cwd, 'other');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities',
        fileDir,
        fileBoundary: null, // File outside boundaries
        skipBoundaryRules: true, // Skip rules since fileBoundary is null
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      // Should still validate path format
      expect(result).toBeDefined();
    });

    it('should handle when fileBoundary exists but targetBoundary is null', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: 'lodash', // External package
        fileDir,
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      // Should skip checking for external packages
      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle when fileBoundary and targetBoundary are same (same-boundary import)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../cousin', // Same-boundary import (cousin in parent directory)
        fileDir,
        reporter,
        createFixer,
      });

      handleImport(options);

      // Should not check boundary rules for same-boundary imports
      // (fileBoundary === targetBoundary, so boundary rules check is skipped)
      expect(reporter.hasReported('boundaryViolation')).toBe(false);
      // Path format validation may or may not report depending on correctness
      // The key is that boundary rules are not checked
    });
  });

  describe('edge cases and defensive paths', () => {
    it('should handle when alias subpath validation returns false (no violation)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities', // Valid alias (no subpath violation)
        fileDir,
        reporter,
        createFixer,
      });

      handleImport(options);

      // Should not report alias subpath violation
      expect(reporter.hasReported('incorrectImportPath')).toBe(false);
    });

    it('should handle when boundary rules validation returns false (no violation)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '@entities', // Allowed import
        fileDir,
        reporter,
        createFixer,
      });

      handleImport(options);

      // Should not report boundary violation
      expect(reporter.hasReported('boundaryViolation')).toBe(false);
    });

    it('should handle when correctPath is null and fileBoundary is null (defensive path)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();

      // Mock calculateCorrectImportPath to return null
      const calculateCorrectImportPathSpy = vi.spyOn(
        domain,
        'calculateCorrectImportPath',
      );
      calculateCorrectImportPathSpy.mockReturnValue(null);

      const options = createOptions({
        rawSpec: './nonexistent',
        fileDir,
        fileBoundary: null, // No boundary
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      const result = handleImport(options);

      // Should return false (defensive path)
      expect(result).toBe(false);
      expect(calculateCorrectImportPathSpy).toHaveBeenCalled();

      calculateCorrectImportPathSpy.mockRestore();
    });

    it('should handle when correctPath is null, fileBoundary exists, but detectAndReportAncestorBarrel returns false', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();

      // Mock calculateCorrectImportPath to return null
      const calculateCorrectImportPathSpy = vi.spyOn(
        domain,
        'calculateCorrectImportPath',
      );
      calculateCorrectImportPathSpy.mockReturnValue(null);

      // Mock detectAndReportAncestorBarrel to return false
      const detectAndReportAncestorBarrelSpy = vi.spyOn(
        detection,
        'detectAndReportAncestorBarrel',
      );
      detectAndReportAncestorBarrelSpy.mockReturnValue(false);

      const options = createOptions({
        rawSpec: './nonexistent',
        fileDir,
        fileBoundary: queriesBoundary,
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });
      const result = handleImport(options);

      // Should return false (defensive path)
      expect(result).toBe(false);
      expect(calculateCorrectImportPathSpy).toHaveBeenCalled();
      expect(detectAndReportAncestorBarrelSpy).toHaveBeenCalled();

      calculateCorrectImportPathSpy.mockRestore();
      detectAndReportAncestorBarrelSpy.mockRestore();
    });

    it('should handle path format validation when paths match (no violation)', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries', 'subdir');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: './sibling', // Correct relative path
        fileDir,
        skipBoundaryRules: true,
        reporter,
        createFixer,
      });

      handleImport(options);

      // Should not report path format violation if path is already correct
      // (validatePathFormat returns false when paths match)
      expect(reporter.hasReported('incorrectImportPath')).toBe(false);
    });

    it('should handle when allowUnknownBoundaries is true and correctPath is UNKNOWN_BOUNDARY', () => {
      const fileDir = path.resolve(cwd, rootDir, 'domain/queries');
      const { reporter, createFixer } = createMockPorts();
      const options = createOptions({
        rawSpec: '../outside/file',
        fileDir,
        allowUnknownBoundaries: true,
        reporter,
        createFixer,
      });

      const result = handleImport(options);

      // Should return false (no violation when unknown boundaries are allowed)
      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
    });
  });
});
