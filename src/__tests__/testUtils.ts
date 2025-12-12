/**
 * Test utilities for creating port mocks using Vitest.
 *
 * **When to use**: Application layer tests that need Reporter/Fixer ports
 * **When NOT to use**: Domain layer tests - use pure value testing instead
 *
 * Domain layer functions are pure and should be tested with plain values.
 * Only application layer tests that orchestrate domain logic with ports need these mocks.
 */

import type { Fixer, FixResult, Reporter, ReportOptions } from '@ports';
import type { Boundary } from '@shared';
import path from 'node:path';

import { vi } from 'vitest';

export { createBoundaries, createBoundary } from './boundaryTestHelpers';

/**
 * Mock reporter with helper methods for testing.
 * The report function is a Vitest spy, so you can use all spy methods like:
 * - reporter.report.mock.calls
 * - reporter.report.mock.results
 * - expect(reporter.report).toHaveBeenCalledWith(...)
 */
export interface MockReporter {
  /**
   * The report function is a Vitest spy - use report.mock.calls, report.mock.results, etc.
   * Also satisfies the Reporter interface.
   */
  report: Reporter['report'] & ReturnType<typeof vi.fn>;
  /**
   * Get all reports (convenience accessor for report.mock.calls).
   */
  readonly reports: ReportOptions[];
  /**
   * Get the last report.
   */
  getLastReport: () => ReportOptions | undefined;
  /**
   * Get all reports with a specific messageId.
   */
  getReportsByMessageId: (messageId: string) => ReportOptions[];
  /**
   * Check if a specific messageId was reported.
   */
  hasReported: (messageId: string) => boolean;
  /**
   * Clear all reports (clears the spy).
   */
  clear: () => void;
}

/**
 * Factory function type for creating mock reporters.
 * Can be overridden in tests for custom behavior.
 */
export type MockReporterFactory = () => MockReporter;

/**
 * Default factory for creating a mock reporter.
 * Uses vi.fn() spy which provides mock.calls, mock.results, etc.
 */
export function createMockReporterFactory(): MockReporterFactory {
  return () => {
    const reportFn = vi.fn((_options: ReportOptions) => {
      // Spy implementation - vi.fn() tracks calls automatically
    }) as Reporter['report'] & ReturnType<typeof vi.fn>;

    return {
      get reports(): ReportOptions[] {
        return reportFn.mock.calls.map((call) => call[0] as ReportOptions);
      },
      report: reportFn,
      /**
       * Get the last report.
       */
      getLastReport: (): ReportOptions | undefined => {
        const lastCall = reportFn.mock.calls[reportFn.mock.calls.length - 1];
        return lastCall?.[0] as ReportOptions | undefined;
      },
      /**
       * Get all reports with a specific messageId.
       */
      getReportsByMessageId: (messageId: string): ReportOptions[] => {
        return reportFn.mock.calls
          .map((call) => call[0] as ReportOptions)
          .filter((r) => r.messageId === messageId);
      },
      /**
       * Check if a specific messageId was reported.
       */
      hasReported: (messageId: string): boolean => {
        return reportFn.mock.calls.some(
          (call) => (call[0] as ReportOptions)?.messageId === messageId,
        );
      },
      /**
       * Clear all reports (clears the spy).
       */
      clear: (): void => {
        reportFn.mockClear();
      },
    };
  };
}

/**
 * Factory function type for creating mock fixers.
 */
export type MockFixerFactory = (newPath: string) => Fixer;

/**
 * Default factory for creating mock fixer factories.
 * Uses vi.fn() spy which provides mock.calls, mock.results, etc.
 */
export function createMockFixerFactoryFactory(): () => MockFixerFactory {
  return () => {
    return (newPath: string): Fixer => {
      const applyFn = vi.fn((): FixResult | null => {
        return {
          text: `'${newPath}'`,
          range: [0, 10], // Mock range
        };
      });

      return {
        apply: applyFn,
      };
    };
  };
}

/**
 * Helper to create mock ports with overridable factories.
 * Factories can be overridden for custom test behavior.
 *
 * @example
 * ```typescript
 * // Default usage
 * const { reporter, createFixer } = createMockPorts();
 *
 * // Use spy methods directly
 * expect(reporter.report).toHaveBeenCalledWith({
 *   messageId: 'incorrectImportPath',
 *   data: { expectedPath: '@entities', actualPath: '@entities/army' }
 * });
 *
 * // Or use convenience helpers
 * expect(reporter.hasReported('incorrectImportPath')).toBe(true);
 * ```
 */
export function createMockPorts(options?: {
  reporterFactory?: MockReporterFactory;
  fixerFactoryFactory?: () => MockFixerFactory;
}) {
  const reporterFactory =
    options?.reporterFactory ?? createMockReporterFactory();
  const fixerFactoryFactory =
    options?.fixerFactoryFactory ?? createMockFixerFactoryFactory();

  return {
    reporter: reporterFactory(),
    createFixer: fixerFactoryFactory(),
  };
}

/**
 * Helper to create a Boundary object for testing.
 * Provides smart defaults: identifier defaults to alias ?? dir (works for >95% of tests).
 * Automatically computes absDir from dir.
 *
 * @example
 * ```typescript
 * // Most common case - identifier defaults to alias
 * const boundary = createTestBoundary({
 *   dir: 'domain/entities',
 *   alias: '@entities',
 * });
 * // boundary.identifier === '@entities'
 * // boundary.absDir === '/project/src/domain/entities'
 *
 * // Override identifier when needed
 * const boundary = createTestBoundary({
 *   identifier: 'core',
 *   dir: 'domain/entities',
 *   alias: '@entities',
 * });
 * ```
 */
export function createTestBoundary(
  config: {
    identifier?: string; // Optional - defaults to alias ?? dir (smart default for >95% of tests)
    dir: string;
    alias?: string;
    allowImportsFrom?: string[];
    denyImportsFrom?: string[];
    allowTypeImportsFrom?: string[];
    nestedPathFormat?: 'alias' | 'relative' | 'inherit';
    severity?: 'error' | 'warn';
  },
  options?: {
    rootDir?: string;
    cwd?: string;
  },
): Boundary {
  const rootDir = options?.rootDir ?? 'src';
  const cwd = options?.cwd ?? '/project';
  return {
    identifier: config.identifier ?? config.alias ?? config.dir,
    dir: config.dir,
    alias: config.alias,
    absDir: path.resolve(cwd, rootDir, config.dir),
    allowImportsFrom: config.allowImportsFrom,
    denyImportsFrom: config.denyImportsFrom,
    allowTypeImportsFrom: config.allowTypeImportsFrom,
    nestedPathFormat: config.nestedPathFormat,
    severity: config.severity,
  };
}
