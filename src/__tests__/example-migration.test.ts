/**
 * Example test showing how to use port mocks instead of infrastructure adapters.
 * This demonstrates the improved test setup that decouples tests from infrastructure.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleImport } from '@application';
import { createMockPorts } from './testUtils.js';

describe('Example: Using Port Mocks', () => {
  const cwd = '/project';
  const rootDir = 'src';

  const entitiesBoundary: Boundary = {
    dir: 'domain/entities',
    alias: '@entities',
    absDir: path.resolve(cwd, rootDir, 'domain/entities'),
    allowImportsFrom: [],
  };

  const queriesBoundary: Boundary = {
    dir: 'domain/queries',
    alias: '@queries',
    absDir: path.resolve(cwd, rootDir, 'domain/queries'),
    allowImportsFrom: ['@entities'],
  };

  const boundaries = [entitiesBoundary, queriesBoundary];

  it('should report violations using port mocks', () => {
    const { reporter, createFixer } = createMockPorts();
    const fileDir = path.resolve(cwd, rootDir, 'domain/queries');

    // Test cross-boundary import with subpath (should be rejected)
    handleImport({
      rawSpec: '@entities/army', // Wrong - should be '@entities'
      fileDir,
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle: 'alias',
      skipBoundaryRules: true, // Skip boundary rules, just test path format
    });

    // Assert using port interface - no infrastructure coupling
    expect(reporter.hasReported('incorrectImportPath')).toBe(true);
    const report = reporter.getLastReport();
    expect(report?.data?.expectedPath).toBe('@entities');
    expect(report?.data?.actualPath).toBe('@entities/army');
  });

  it('should not report when path is correct', () => {
    const { reporter, createFixer } = createMockPorts();
    const fileDir = path.resolve(cwd, rootDir, 'domain/queries');

    handleImport({
      rawSpec: '@entities', // Correct
      fileDir,
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle: 'alias',
      skipBoundaryRules: true,
    });

    expect(reporter.reports.length).toBe(0);
  });

  it('should capture multiple reports', () => {
    const { reporter, createFixer } = createMockPorts();
    const fileDir = path.resolve(cwd, rootDir, 'domain/queries');

    // First violation
    handleImport({
      rawSpec: '@entities/army',
      fileDir,
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle: 'alias',
      skipBoundaryRules: true,
    });

    // Second violation
    handleImport({
      rawSpec: '@entities/unit',
      fileDir,
      fileBoundary: queriesBoundary,
      boundaries,
      rootDir,
      cwd,
      reporter,
      createFixer,
      crossBoundaryStyle: 'alias',
      skipBoundaryRules: true,
    });

    expect(reporter.reports.length).toBe(2);
    const pathFormatReports = reporter.getReportsByMessageId(
      'incorrectImportPath',
    );
    expect(pathFormatReports.length).toBe(2);
  });
});
