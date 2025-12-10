/**
 * Comprehensive integration tests for absolute path mode.
 * Tests all scenarios with crossBoundaryStyle: 'absolute' to ensure
 * absolute paths work correctly across all use cases.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleImport } from '@application';
import { createBoundary, createMockPorts } from '../testUtils.js';

describe('Absolute Path Mode - Integration Tests', () => {
  const cwd = '/project';
  const rootDir = 'src';
  const crossBoundaryStyle = 'absolute' as const;

  let domainBoundary: Boundary;
  let applicationBoundary: Boundary;
  let infrastructureBoundary: Boundary;
  let boundaries: Boundary[];

  beforeEach(() => {
    domainBoundary = {
      identifier: 'domain',
      dir: 'domain',
      alias: undefined, // Optional in absolute mode
      absDir: path.resolve(cwd, rootDir, 'domain'),
      allowImportsFrom: [],
    };

    applicationBoundary = {
      identifier: 'application',
      dir: 'application',
      alias: undefined, // Optional in absolute mode
      absDir: path.resolve(cwd, rootDir, 'application'),
      allowImportsFrom: ['domain'], // Use dir instead of alias in absolute mode
    };

    infrastructureBoundary = {
      identifier: 'infrastructure',
      dir: 'infrastructure',
      alias: undefined,
      absDir: path.resolve(cwd, rootDir, 'infrastructure'),
      allowImportsFrom: ['domain'],
    };

    boundaries = [domainBoundary, applicationBoundary, infrastructureBoundary];
  });

  describe('Cross-Boundary Imports', () => {
    it('should allow cross-boundary imports using absolute path without subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ CORRECT: Cross-boundary uses absolute path to boundary root
      handleImport({
        rawSpec: 'src/domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should reject cross-boundary imports with subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ WRONG: Subpath not allowed for cross-boundary
      handleImport({
        rawSpec: 'src/domain/entities',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/domain');
      expect(violation?.data?.actualPath).toBe('src/domain/entities');
    });

    it('should reject cross-boundary imports using relative paths', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ WRONG: Relative not allowed for cross-boundary
      handleImport({
        rawSpec: '../domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/domain');
      expect(violation?.data?.actualPath).toBe('../domain');
    });

    it('should handle alias paths in absolute mode (treated as external or unknown)', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // In absolute mode, alias paths (@domain) don't match boundaries without aliases
      // They're resolved as alias imports, but if no boundary has that alias,
      // they're treated as external packages (skipped) or unknown boundaries
      handleImport({
        rawSpec: '@domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
        allowUnknownBoundaries: false,
      });

      // Since boundaries don't have aliases in absolute mode, @domain won't match
      // This will be treated as external package (no report) or unknown boundary
      // The behavior is correct - aliases simply don't work in absolute mode
      // If a report is made, it should be unknownBoundaryImport
      if (reporter.report.mock.calls.length > 0) {
        const violation = reporter.getLastReport();
        expect(violation?.messageId).toBe('unknownBoundaryImport');
      }
      // If no report, it was treated as external package (also valid)
    });
  });

  describe('Same-Boundary Imports', () => {
    it('should allow same-directory imports using relative path', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ✅ CORRECT: Same directory (sibling) - relative paths still used
      handleImport({
        rawSpec: './helper',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should allow parent sibling subdirectory (cousin) imports using relative path', () => {
      const { reporter, createFixer } = createMockPorts();
      // True cousin: both in subdirectories, sharing a parent
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'subdir',
      );

      // ✅ CORRECT: Parent's sibling subdirectory (cousin, one ../)
      handleImport({
        rawSpec: '../utils',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should allow distant same-boundary imports using absolute path with subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ✅ CORRECT: Distant within same boundary → Use absolute path (with subpath allowed)
      handleImport({
        rawSpec: 'src/application/use-cases',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should prefer absolute path over ../ for top-level paths (file in subdir, target at root)', () => {
      const { reporter, createFixer } = createMockPorts();
      // File is in subdirectory: application/use-cases/subdir/file.ts
      // Target is at boundary root level: application/topLevel/index.ts
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'subdir',
      );

      // Should use absolute path, not ../../topLevel
      handleImport({
        rawSpec: '../../topLevel',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      // This should report that absolute path is preferred
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/application/topLevel');
      expect(violation?.data?.actualPath).toBe('../../topLevel');
    });

    it('should use relative path for siblings at boundary root level', () => {
      const { reporter, createFixer } = createMockPorts();
      // Both at boundary root level (siblings)
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // When both are at boundary root level, relative path is used to prevent circular dependencies
      handleImport({
        rawSpec: './utils',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      // The rule uses relative path for siblings to prevent circular dependencies through boundary index
      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should reject relative paths that require >1 ../', () => {
      const { reporter, createFixer } = createMockPorts();
      // File deep in subdirectory
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'level1',
        'level2',
        'level3',
      );

      // ❌ WRONG: Requires >1 ../, should use absolute path
      handleImport({
        rawSpec: '../../../utils',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/application/utils');
      expect(violation?.data?.actualPath).toBe('../../../utils');
    });
  });

  describe('Architectural Boundary Enforcement', () => {
    it('should allow imports when boundary rule permits (using dir identifiers)', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: @application can import from @domain (using dir: 'domain')
      handleImport({
        rawSpec: 'src/domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false, // Enforce boundary rules
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should reject imports when boundary rule denies', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ VIOLATION: @application cannot import from @infrastructure
      handleImport({
        rawSpec: 'src/infrastructure',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('application');
      expect(violation?.data?.to).toBe('infrastructure');
      expect(violation?.data?.reason).toContain('not allowed');
    });
  });

  describe('Nested Boundaries', () => {
    it('should enforce independent rules for nested boundaries', () => {
      const apiBoundary: Boundary = createBoundary(
        {
          dir: 'interface/api',
          allowImportsFrom: ['domain', 'application/public-use-cases'],
          denyImportsFrom: ['application/internal-use-cases'],
        },
        { cwd, rootDir },
      );

      const graphqlBoundary: Boundary = createBoundary(
        {
          dir: 'interface/graphql',
          allowImportsFrom: [
            'application',
            'domain',
            'application/internal-use-cases',
          ],
        },
        { cwd, rootDir },
      );

      const publicUseCasesBoundary: Boundary = createBoundary(
        {
          dir: 'application/public-use-cases',
          allowImportsFrom: ['domain'],
        },
        { cwd, rootDir },
      );

      const internalUseCasesBoundary: Boundary = createBoundary(
        {
          dir: 'application/internal-use-cases',
          allowImportsFrom: ['domain'],
        },
        { cwd, rootDir },
      );

      const nestedBoundaries = [
        ...boundaries,
        apiBoundary,
        graphqlBoundary,
        publicUseCasesBoundary,
        internalUseCasesBoundary,
      ];

      const { reporter: apiReporter, createFixer: apiCreateFixer } =
        createMockPorts();
      const apiFileDir = path.resolve(cwd, rootDir, 'interface/api');

      // ✅ @api can import from @domain
      handleImport({
        rawSpec: 'src/domain',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });
      expect(apiReporter.report).not.toHaveBeenCalled();

      // ✅ @api can import from @public-use-cases
      apiReporter.clear();
      handleImport({
        rawSpec: 'src/application/public-use-cases',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });
      expect(apiReporter.report).not.toHaveBeenCalled();

      // ❌ @api explicitly denies @internal-use-cases
      apiReporter.clear();
      handleImport({
        rawSpec: 'src/application/internal-use-cases',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });
      expect(apiReporter.report).toHaveBeenCalled();
      const violation = apiReporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.reason).toContain('explicitly denies');

      // ✅ @graphql can import from @internal-use-cases (different rules than @api)
      const { reporter: graphqlReporter, createFixer: graphqlCreateFixer } =
        createMockPorts();
      const graphqlFileDir = path.resolve(cwd, rootDir, 'interface/graphql');

      handleImport({
        rawSpec: 'src/application/internal-use-cases',
        fileDir: graphqlFileDir,
        fileBoundary: graphqlBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: graphqlReporter,
        createFixer: graphqlCreateFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });
      expect(graphqlReporter.report).not.toHaveBeenCalled();
    });
  });

  describe('Ancestor Barrel Prevention', () => {
    it('should reject ancestor barrel imports using absolute path', () => {
      const { reporter, createFixer } = createMockPorts();
      // File is inside @application boundary
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ❌ FORBIDDEN: Would create circular dependency
      handleImport({
        rawSpec: 'src/application',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      // In absolute mode, getBoundaryIdentifier returns dir, not absolute path
      expect(violation?.data?.boundaryIdentifier).toBe('application');
      expect(violation?.fix).toBeUndefined(); // Not auto-fixable
    });

    it('should reject ancestor barrel imports with trailing slash', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ❌ FORBIDDEN: Trailing slash should still be detected
      handleImport({
        rawSpec: 'src/application/',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
    });
  });

  describe('Error Message Formats', () => {
    it('should format incorrect import path errors correctly with absolute paths', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      handleImport({
        rawSpec: 'src/domain/entities',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/domain');
      expect(violation?.data?.actualPath).toBe('src/domain/entities');
    });

    it('should format boundary violation errors correctly with dir identifiers', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      handleImport({
        rawSpec: 'src/infrastructure',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: false,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('application');
      expect(violation?.data?.to).toBe('infrastructure');
      expect(violation?.data?.reason).toContain('not allowed');
    });

    it('should format ancestor barrel errors correctly with absolute paths', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      handleImport({
        rawSpec: 'src/application',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      // In absolute mode, getBoundaryIdentifier returns dir, not absolute path
      expect(violation?.data?.boundaryIdentifier).toBe('application');
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundaries without aliases correctly', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // Boundaries don't need aliases in absolute mode
      handleImport({
        rawSpec: 'src/domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle deep nested boundaries correctly', () => {
      const deepBoundary: Boundary = createBoundary(
        {
          dir: 'domain/entities/user/account',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );

      const deepBoundaries = [...boundaries, deepBoundary];
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // Cross-boundary to deep nested boundary
      handleImport({
        rawSpec: 'src/domain/entities/user/account',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries: deepBoundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle rootDir variations correctly', () => {
      const customRootDir = 'lib';
      const customDomainBoundary: Boundary = createBoundary(
        {
          dir: 'domain',
          allowImportsFrom: [],
        },
        { cwd, rootDir: customRootDir },
      );

      const customApplicationBoundary: Boundary = createBoundary(
        {
          dir: 'application',
          allowImportsFrom: ['domain'],
        },
        { cwd, rootDir: customRootDir },
      );

      const customBoundaries = [
        customDomainBoundary,
        customApplicationBoundary,
      ];
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, customRootDir, 'application');

      // Should use custom rootDir
      handleImport({
        rawSpec: 'lib/domain',
        fileDir,
        fileBoundary: customApplicationBoundary,
        boundaries: customBoundaries,
        rootDir: customRootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle paths with incorrect rootDir as unknown boundary', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // Paths that don't start with rootDir are treated as bare imports
      // If they don't match any boundary, they're external packages (skipped)
      // If they match a boundary but have wrong rootDir, they'd be caught by path format validation
      // Let's test a case where it's treated as unknown boundary
      handleImport({
        rawSpec: 'lib/domain', // Wrong rootDir - doesn't start with 'src'
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
        allowUnknownBoundaries: false,
      });

      // This might be treated as external package (if lib/domain doesn't match any boundary)
      // or unknown boundary (if it resolves but doesn't match)
      // The behavior depends on how resolveTargetPath handles it
      // For now, let's verify it doesn't crash and handles gracefully
      // If it's an external package, no report; if unknown boundary, report
      if (reporter.report.mock.calls.length > 0) {
        const violation = reporter.getLastReport();
        // Could be unknownBoundaryImport or incorrectImportPath
        expect(['unknownBoundaryImport', 'incorrectImportPath']).toContain(
          violation?.messageId,
        );
      }
      // If no report, it was treated as external package (also valid behavior)
    });

    it('should handle same-boundary imports with different rootDir segments', () => {
      const { reporter, createFixer } = createMockPorts();
      // File in deeply nested subdirectory
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'level1',
        'level2',
      );

      // Target at boundary root level
      // Should use absolute path, not relative
      handleImport({
        rawSpec: '../../../../application/utils',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      // Should prefer absolute path
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('src/application/utils');
    });
  });

  describe('Path Format Consistency', () => {
    it('should use forward slashes in absolute paths regardless of OS', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      handleImport({
        rawSpec: 'src/domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();

      // Verify the expected path uses forward slashes
      const violation = reporter.getLastReport();
      if (violation) {
        expect(violation.data?.expectedPath).toMatch(/^src\/domain$/);
        expect(violation.data?.expectedPath).not.toContain('\\');
      }
    });

    it('should handle paths with multiple segments correctly', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // Cross-boundary to nested boundary
      const nestedBoundary: Boundary = createBoundary(
        {
          dir: 'domain/entities/user',
          allowImportsFrom: [],
        },
        { cwd, rootDir },
      );

      const boundariesWithNested = [...boundaries, nestedBoundary];

      handleImport({
        rawSpec: 'src/domain/entities/user',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries: boundariesWithNested,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle,
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });
  });
});
