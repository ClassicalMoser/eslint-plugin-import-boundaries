/**
 * Tests for rule context helpers.
 */

import type { Rule } from 'eslint';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetDeprecationWarningsForTest,
  extractRuleOptions,
  inferCrossBoundaryStyleFromFilename,
} from './ruleContext';

function makeContext(opts: unknown): Rule.RuleContext {
  return { options: [opts] } as unknown as Rule.RuleContext;
}

const minimalBoundary = { identifier: 'b', dir: 'domain/b' };

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

describe('extractRuleOptions — rootDirAlias validation', () => {
  it('should accept a valid rootDirAlias (default @)', () => {
    const ctx = makeContext({ boundaries: [minimalBoundary] });
    const result = extractRuleOptions(ctx);
    expect(result.rootDirAlias).toBe('@');
  });

  it('should accept an empty string to disable rootDirAlias', () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
      rootDirAlias: '',
    });
    const result = extractRuleOptions(ctx);
    expect(result.rootDirAlias).toBe('');
  });

  it('should accept a custom non-@ prefix', () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
      rootDirAlias: '~',
    });
    const result = extractRuleOptions(ctx);
    expect(result.rootDirAlias).toBe('~');
  });

  it('should throw when rootDirAlias starts with .', () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
      rootDirAlias: './src',
    });
    expect(() => extractRuleOptions(ctx)).toThrow("must not start with '.'");
  });

  it('should throw when rootDirAlias starts with /', () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
      rootDirAlias: '/src',
    });
    expect(() => extractRuleOptions(ctx)).toThrow('must not start with');
  });
});

describe("extractRuleOptions — crossBoundaryStyle: 'absolute' deprecation", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetDeprecationWarningsForTest();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("should warn once when crossBoundaryStyle is explicitly 'absolute'", () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
      crossBoundaryStyle: 'absolute',
    });
    extractRuleOptions(ctx);
    extractRuleOptions(ctx);
    extractRuleOptions(ctx);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATION'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("crossBoundaryStyle: 'absolute'"),
    );
  });

  it("should NOT warn when crossBoundaryStyle is 'alias'", () => {
    const ctx = makeContext({
      boundaries: [{ ...minimalBoundary, alias: '@b' }],
      crossBoundaryStyle: 'alias',
    });
    extractRuleOptions(ctx);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should NOT warn when crossBoundaryStyle is omitted', () => {
    const ctx = makeContext({
      boundaries: [minimalBoundary],
    });
    extractRuleOptions(ctx);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
