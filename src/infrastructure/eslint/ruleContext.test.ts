/**
 * Tests for rule context helpers.
 */

import { describe, expect, it } from 'vitest';
import { inferCrossBoundaryStyleFromFilename } from './ruleContext';

describe('inferCrossBoundaryStyleFromFilename', () => {
  it('should use alias for TypeScript extensions', () => {
    expect(inferCrossBoundaryStyleFromFilename('/p/x.ts')).toBe('alias');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.tsx')).toBe('alias');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.mts')).toBe('alias');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.cts')).toBe('alias');
    expect(inferCrossBoundaryStyleFromFilename('/p/X.TS')).toBe('alias');
  });

  it('should use absolute for JavaScript extensions', () => {
    expect(inferCrossBoundaryStyleFromFilename('/p/x.js')).toBe('absolute');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.jsx')).toBe('absolute');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.mjs')).toBe('absolute');
    expect(inferCrossBoundaryStyleFromFilename('/p/x.cjs')).toBe('absolute');
  });

  it('should use absolute for other extensions (e.g. Vue)', () => {
    expect(inferCrossBoundaryStyleFromFilename('/p/C.vue')).toBe('absolute');
  });
});
