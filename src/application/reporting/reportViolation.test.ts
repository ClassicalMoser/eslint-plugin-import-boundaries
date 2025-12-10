/**
 * Unit tests for reportViolation.ts
 * Tests the violation reporting logic with proper severity handling.
 */

import type { Boundary } from '@shared';
import type { Fixer, Reporter } from '@ports';
import { describe, expect, it, vi } from 'vitest';
import { createBoundary } from '../../__tests__/boundaryTestHelpers.js';
import { reportViolation } from './reportViolation';

describe('reportViolation', () => {
  describe('reportViolation', () => {
    it('should call reporter.report with correct options', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      reportViolation({
        reporter: mockReporter,
        messageId: 'incorrectImportPath',
        data: { expectedPath: '@domain', actualPath: '@domain/entities' },
        fileBoundary,
        defaultSeverity: 'error',
      });

      expect(mockReporter.report).toHaveBeenCalledWith({
        messageId: 'incorrectImportPath',
        data: { expectedPath: '@domain', actualPath: '@domain/entities' },
        severity: 'error',
        fix: undefined,
      });
    });

    it('should use boundary-specific severity when set', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
        severity: 'warn',
      });

      reportViolation({
        reporter: mockReporter,
        messageId: 'boundaryViolation',
        data: { from: '@entities', to: '@queries', reason: 'not allowed' },
        fileBoundary,
        defaultSeverity: 'error',
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
        }),
      );
    });

    it('should use default severity when boundary has no severity', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      reportViolation({
        reporter: mockReporter,
        messageId: 'incorrectImportPath',
        data: { expectedPath: '@domain', actualPath: '../domain' },
        fileBoundary,
        defaultSeverity: 'warn',
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
        }),
      );
    });

    it('should pass undefined severity when neither boundary nor default is set', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      reportViolation({
        reporter: mockReporter,
        messageId: 'ancestorBarrelImport',
        data: { boundaryIdentifier: '@entities' },
        fileBoundary,
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: undefined,
        }),
      );
    });

    it('should handle null fileBoundary', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };

      reportViolation({
        reporter: mockReporter,
        messageId: 'unknownBoundaryImport',
        data: { path: '../outside' },
        fileBoundary: null,
        defaultSeverity: 'error',
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        }),
      );
    });

    it('should pass fixer when provided', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const mockFixer: Fixer = {
        apply: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      reportViolation({
        reporter: mockReporter,
        messageId: 'incorrectImportPath',
        data: { expectedPath: '@domain', actualPath: '../domain' },
        fileBoundary,
        defaultSeverity: 'error',
        fix: mockFixer,
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          fix: mockFixer,
        }),
      );
    });

    it('should pass all data fields correctly', () => {
      const mockReporter: Reporter = {
        report: vi.fn(),
      };
      const fileBoundary: Boundary = createBoundary({
        dir: 'domain/entities',
        alias: '@entities',
      });

      const data = {
        expectedPath: '@domain',
        actualPath: '@domain/entities',
        boundaryIdentifier: '@domain',
      };

      reportViolation({
        reporter: mockReporter,
        messageId: 'incorrectImportPath',
        data,
        fileBoundary,
        defaultSeverity: 'error',
      });

      expect(mockReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'incorrectImportPath',
          data,
        }),
      );
    });
  });
});
