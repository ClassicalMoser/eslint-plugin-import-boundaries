/**
 * Integration tests that verify README examples work as documented.
 * These tests ensure documentation accuracy and serve as usage examples.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleImport } from '@application';
import { createMockPorts } from '../testUtils.js';

describe('README Examples - Integration Tests', () => {
  const cwd = '/project';
  const rootDir = 'src';

  let domainBoundary: Boundary;
  let applicationBoundary: Boundary;
  let infrastructureBoundary: Boundary;
  let boundaries: Boundary[];

  beforeEach(() => {
    domainBoundary = {
      dir: 'domain',
      alias: '@domain',
      absDir: path.resolve(cwd, rootDir, 'domain'),
      allowImportsFrom: [],
    };

    applicationBoundary = {
      dir: 'application',
      alias: '@application',
      absDir: path.resolve(cwd, rootDir, 'application'),
      allowImportsFrom: ['@domain'],
    };

    infrastructureBoundary = {
      dir: 'infrastructure',
      alias: '@infrastructure',
      absDir: path.resolve(cwd, rootDir, 'infrastructure'),
      allowImportsFrom: ['@domain'],
    };

    boundaries = [domainBoundary, applicationBoundary, infrastructureBoundary];
  });

  describe('Core Rules - Cross-Boundary Imports', () => {
    it('should allow cross-boundary imports using boundary identifier without subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ CORRECT: @application can import from @domain
      handleImport({
        rawSpec: '@domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true, // Just test path format
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should reject cross-boundary imports with subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ WRONG: Subpath not allowed for cross-boundary
      handleImport({
        rawSpec: '@domain/entities',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('@domain');
      expect(violation?.data?.actualPath).toBe('@domain/entities');
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
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('@domain');
      expect(violation?.data?.actualPath).toBe('../domain');
    });
  });

  describe('Core Rules - Same-Boundary Imports', () => {
    it('should allow same-directory imports using relative path', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ✅ CORRECT: Same directory (sibling)
      handleImport({
        rawSpec: './helper',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle sibling imports at boundary root level', () => {
      const { reporter, createFixer } = createMockPorts();
      // Both at boundary root level (siblings)
      // File: application/use-cases/file.ts
      // Target: application/utils/index.ts
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
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      // The rule uses relative path for siblings to prevent circular dependencies through boundary index
      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should allow true cousin imports (parent sibling, both in subdirs)', () => {
      const { reporter, createFixer } = createMockPorts();
      // True cousin: both in subdirectories, sharing a parent
      // File: application/use-cases/subdir/file.ts
      // Target: application/use-cases/utils/index.ts (sibling of subdir)
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'subdir',
      );

      // ✅ CORRECT: Sibling subdirectory (one ../)
      handleImport({
        rawSpec: '../utils',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should allow distant same-boundary imports using alias with subpath', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ✅ CORRECT: Distant within same boundary → Use alias (with subpath allowed)
      handleImport({
        rawSpec: '@application/use-cases',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should prefer alias over ../ for top-level paths (file in subdir, target at root)', () => {
      const { reporter, createFixer } = createMockPorts();
      // File is in subdirectory: application/use-cases/subdir/file.ts
      const fileDir = path.resolve(
        cwd,
        rootDir,
        'application',
        'use-cases',
        'subdir',
      );
      // Target is at boundary root level: application/topLevel/index.ts
      // Relative path would be ../../topLevel, but alias is preferred

      // Should use alias, not ../../topLevel
      handleImport({
        rawSpec: '../../topLevel',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      // This should report that alias is preferred for top-level paths
      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('@application/topLevel');
      expect(violation?.data?.actualPath).toBe('../../topLevel');
    });
  });

  describe('Architectural Boundary Enforcement', () => {
    it('should allow imports when boundary rule permits', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: @application can import from @domain
      handleImport({
        rawSpec: '@domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false, // Enforce boundary rules
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should reject imports when boundary rule denies', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ VIOLATION: @application cannot import from @infrastructure
      handleImport({
        rawSpec: '@infrastructure',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('@application');
      expect(violation?.data?.to).toBe('@infrastructure');
      expect(violation?.data?.reason).toContain('not allowed');
    });
  });

  describe('Nested Boundaries', () => {
    it('should enforce independent rules for nested boundaries', () => {
      const apiBoundary: Boundary = {
        dir: 'interface/api',
        alias: '@api',
        absDir: path.resolve(cwd, rootDir, 'interface/api'),
        allowImportsFrom: ['@domain', '@public-use-cases'],
        denyImportsFrom: ['@internal-use-cases'],
      };

      const graphqlBoundary: Boundary = {
        dir: 'interface/graphql',
        alias: '@graphql',
        absDir: path.resolve(cwd, rootDir, 'interface/graphql'),
        allowImportsFrom: ['@application', '@domain', '@internal-use-cases'], // Must explicitly allow sub-boundaries
      };

      const publicUseCasesBoundary: Boundary = {
        dir: 'application/public-use-cases',
        alias: '@public-use-cases',
        absDir: path.resolve(cwd, rootDir, 'application/public-use-cases'),
        allowImportsFrom: ['@domain'],
      };

      const internalUseCasesBoundary: Boundary = {
        dir: 'application/internal-use-cases',
        alias: '@internal-use-cases',
        absDir: path.resolve(cwd, rootDir, 'application/internal-use-cases'),
        allowImportsFrom: ['@domain'],
      };

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
        rawSpec: '@domain',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
      });
      expect(apiReporter.report).not.toHaveBeenCalled();

      // ✅ @api can import from @public-use-cases
      apiReporter.clear();
      handleImport({
        rawSpec: '@public-use-cases',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
      });
      expect(apiReporter.report).not.toHaveBeenCalled();

      // ❌ @api explicitly denies @internal-use-cases
      apiReporter.clear();
      handleImport({
        rawSpec: '@internal-use-cases',
        fileDir: apiFileDir,
        fileBoundary: apiBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: apiReporter,
        createFixer: apiCreateFixer,
        crossBoundaryStyle: 'alias',
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
        rawSpec: '@internal-use-cases',
        fileDir: graphqlFileDir,
        fileBoundary: graphqlBoundary,
        boundaries: nestedBoundaries,
        rootDir,
        cwd,
        reporter: graphqlReporter,
        createFixer: graphqlCreateFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
      });
      expect(graphqlReporter.report).not.toHaveBeenCalled();
    });
  });

  describe('Ancestor Barrel Prevention', () => {
    it('should reject ancestor barrel imports', () => {
      const { reporter, createFixer } = createMockPorts();
      // File is inside @application boundary
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ❌ FORBIDDEN: Would create circular dependency
      handleImport({
        rawSpec: '@application',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.alias).toBe('@application');
      expect(violation?.fix).toBeUndefined(); // Not auto-fixable
    });
  });

  describe('Error Message Formats', () => {
    it('should format incorrect import path errors correctly', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      handleImport({
        rawSpec: '@domain/entities',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('incorrectImportPath');
      expect(violation?.data?.expectedPath).toBe('@domain');
      expect(violation?.data?.actualPath).toBe('@domain/entities');
      // Message format: "Expected '{{expectedPath}}' but got '{{actualPath}}'."
    });

    it('should format ancestor barrel errors correctly', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      handleImport({
        rawSpec: '@application',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: true,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.alias).toBe('@application');
      // Message format: "Cannot import from ancestor barrel '{{alias}}'. This would create a circular dependency. Import from the specific file or directory instead."
    });

    it('should format boundary violation errors correctly', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      handleImport({
        rawSpec: '@infrastructure',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
      });

      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('@application');
      expect(violation?.data?.to).toBe('@infrastructure');
      expect(violation?.data?.reason).toContain('not allowed');
      // Message format: "Cannot import from '{{to}}' to '{{from}}': {{reason}}"
    });
  });
});
