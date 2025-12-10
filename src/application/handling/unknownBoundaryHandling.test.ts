/**
 * Unit tests for unknownBoundaryHandling.ts
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPorts } from '../../__tests__/testUtils.js';
import { handleUnknownBoundary } from './unknownBoundaryHandling';

describe('unknownBoundaryHandling', () => {
  describe('handleUnknownBoundary', () => {
    it('should report unknown boundary imports when not allowed', () => {
      const { reporter } = createMockPorts();

      const result = handleUnknownBoundary({
        rawSpec: '../unknown',
        allowUnknownBoundaries: false,
        reporter,
      });

      expect(result).toBe(true);
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('unknownBoundaryImport');
      expect(violation?.data?.path).toBe('../unknown');
      expect(violation?.fix).toBeUndefined();
    });

    it('should allow unknown boundary imports when allowed', () => {
      const { reporter } = createMockPorts();

      const result = handleUnknownBoundary({
        rawSpec: '../unknown',
        allowUnknownBoundaries: true,
        reporter,
      });

      expect(result).toBe(false);
      expect(reporter.report).not.toHaveBeenCalled();
      expect(reporter.hasReported('unknownBoundaryImport')).toBe(false);
    });
  });
});
