/**
 * Port: Reporter interface
 * Defines the contract for reporting violations.
 * Infrastructure (ESLint) implements this interface.
 */

export type Severity = 'error' | 'warn';

export interface ViolationData {
  expectedPath?: string;
  actualPath?: string;
  alias?: string;
  path?: string;
  from?: string;
  to?: string;
  reason?: string;
}

export interface ReportOptions {
  messageId: string;
  data?: ViolationData;
  severity?: Severity;
  fix?: Fixer;
}

export interface Reporter {
  /**
   * Report a violation with a message ID and optional data.
   */
  report: (options: ReportOptions) => void;
}

export interface Fixer {
  /**
   * Apply the fix. Returns the fix result or null if not applicable.
   */
  apply: () => FixResult | null;
}

export interface FixResult {
  /**
   * The text replacement to apply.
   */
  text: string;
  /**
   * The range to replace (start and end positions).
   */
  range: [number, number];
}
