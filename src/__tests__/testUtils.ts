/**
 * Test doubles for application-layer ports (Reporter, Fixer factory).
 */

import type { Fixer, Reporter, ReportOptions } from '@ports';
import { vi } from 'vitest';

export { createBoundary } from './boundaryTestHelpers';

export type MockReporter = Reporter & {
  reports: ReportOptions[];
  getLastReport: () => ReportOptions | undefined;
  hasReported: (messageId: string) => boolean;
};

export function createMockPorts(): {
  reporter: MockReporter;
  createFixer: (newPath: string) => Fixer;
} {
  const reports: ReportOptions[] = [];
  const report = vi.fn((opts: ReportOptions) => {
    reports.push(opts);
  });

  const reporter: MockReporter = {
    report,
    reports,
    getLastReport: () => reports.at(-1),
    hasReported: (messageId: string) =>
      reports.some((r) => r.messageId === messageId),
  };

  const createFixer = (newPath: string): Fixer => ({
    apply: () => ({
      text: newPath,
      range: [0, 0],
    }),
  });

  return { reporter, createFixer };
}
