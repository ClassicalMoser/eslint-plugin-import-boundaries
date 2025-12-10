/**
 * Integration tests for arbitrary boundary identifiers.
 * Tests that identifiers can be set independently of alias, dir, or absolute paths.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleImport } from '@application';
import { createMockPorts } from '../testUtils.js';

describe('Arbitrary Boundary Identifiers - Integration Tests', () => {
  const cwd = '/project';
  const rootDir = 'src';

  describe('Alias Mode with Arbitrary Identifiers', () => {
    let domainBoundary: Boundary;
    let applicationBoundary: Boundary;
    let infrastructureBoundary: Boundary;
    let boundaries: Boundary[];

    beforeEach(() => {
      // Use arbitrary identifiers that don't match alias or dir
      domainBoundary = {
        dir: 'domain',
        alias: '@domain',
        identifier: 'core', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'domain'),
        allowImportsFrom: [],
      };

      applicationBoundary = {
        dir: 'application',
        alias: '@application',
        identifier: 'app', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'application'),
        allowImportsFrom: ['core'], // Uses arbitrary identifier, not alias
      };

      infrastructureBoundary = {
        dir: 'infrastructure',
        alias: '@infrastructure',
        identifier: 'infra', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'infrastructure'),
        allowImportsFrom: ['core'], // Uses arbitrary identifier
      };

      boundaries = [
        domainBoundary,
        applicationBoundary,
        infrastructureBoundary,
      ];
    });

    it('should use arbitrary identifiers in allowImportsFrom rules', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: app can import from core (using arbitrary identifiers)
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
        skipBoundaryRules: false,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should deny imports when arbitrary identifier is not in allowImportsFrom', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ DENIED: app cannot import from infra (arbitrary identifier not in allow list)
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
      expect(violation?.data?.from).toBe('app'); // Uses arbitrary identifier
      expect(violation?.data?.to).toBe('infra'); // Uses arbitrary identifier
      expect(violation?.data?.reason).toContain('not allowed');
    });

    it('should use arbitrary identifiers in error messages', () => {
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
      // Error message should use arbitrary identifiers, not aliases
      expect(violation?.data?.from).toBe('app');
      expect(violation?.data?.to).toBe('infra');
      expect(violation?.data?.reason).toContain('infra');
      expect(violation?.data?.reason).toContain('app');
    });

    it('should use arbitrary identifier in ancestor barrel error messages', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ❌ FORBIDDEN: Ancestor barrel import
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
      expect(violation?.data?.boundaryIdentifier).toBe('app'); // Uses arbitrary identifier
    });

    it('should work with denyImportsFrom using arbitrary identifiers', () => {
      const { reporter, createFixer } = createMockPorts();
      const restrictedBoundary: Boundary = {
        ...applicationBoundary,
        allowImportsFrom: ['core', 'infra'], // Allow both
        denyImportsFrom: ['infra'], // But deny infra specifically
      };

      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ DENIED: infra is in deny list (using arbitrary identifier)
      handleImport({
        rawSpec: '@infrastructure',
        fileDir,
        fileBoundary: restrictedBoundary,
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
      expect(violation?.data?.to).toBe('infra');
    });
  });

  describe('Absolute Mode with Arbitrary Identifiers', () => {
    let domainBoundary: Boundary;
    let applicationBoundary: Boundary;
    let infrastructureBoundary: Boundary;
    let boundaries: Boundary[];

    beforeEach(() => {
      // Use arbitrary identifiers in absolute mode
      domainBoundary = {
        dir: 'domain',
        alias: undefined, // No alias in absolute mode
        identifier: 'core', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'domain'),
        allowImportsFrom: [],
      };

      applicationBoundary = {
        dir: 'application',
        alias: undefined,
        identifier: 'app', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'application'),
        allowImportsFrom: ['core'], // Uses arbitrary identifier
      };

      infrastructureBoundary = {
        dir: 'infrastructure',
        alias: undefined,
        identifier: 'infra', // Arbitrary identifier
        absDir: path.resolve(cwd, rootDir, 'infrastructure'),
        allowImportsFrom: ['core'],
      };

      boundaries = [
        domainBoundary,
        applicationBoundary,
        infrastructureBoundary,
      ];
    });

    it('should use arbitrary identifiers in absolute mode', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: app can import from core (using arbitrary identifiers)
      handleImport({
        rawSpec: 'src/domain',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'absolute',
        skipBoundaryRules: false,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should use arbitrary identifiers in error messages in absolute mode', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ❌ DENIED: app cannot import from infra
      handleImport({
        rawSpec: 'src/infrastructure',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'absolute',
        skipBoundaryRules: false,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('boundaryViolation');
      expect(violation?.data?.from).toBe('app'); // Uses arbitrary identifier
      expect(violation?.data?.to).toBe('infra'); // Uses arbitrary identifier
    });

    it('should use arbitrary identifier in ancestor barrel error in absolute mode', () => {
      const { reporter, createFixer } = createMockPorts();
      const fileDir = path.resolve(cwd, rootDir, 'application', 'use-cases');

      // ❌ FORBIDDEN: Ancestor barrel import
      handleImport({
        rawSpec: 'src/application',
        fileDir,
        fileBoundary: applicationBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'absolute',
        skipBoundaryRules: true,
      });

      expect(reporter.report).toHaveBeenCalled();
      const violation = reporter.getLastReport();
      expect(violation?.messageId).toBe('ancestorBarrelImport');
      expect(violation?.data?.boundaryIdentifier).toBe('app'); // Uses arbitrary identifier
    });
  });

  describe('Complex Arbitrary Identifier Scenarios', () => {
    it('should handle identifiers that are completely different from dir and alias', () => {
      const { reporter, createFixer } = createMockPorts();

      const domainBoundary: Boundary = {
        dir: 'domain/entities/user',
        alias: '@entities/user',
        identifier: 'user-domain', // Completely arbitrary
        absDir: path.resolve(cwd, rootDir, 'domain/entities/user'),
        allowImportsFrom: [],
      };

      const applicationBoundary: Boundary = {
        dir: 'application/use-cases',
        alias: '@application/use-cases',
        identifier: 'use-cases', // Different from alias and dir
        absDir: path.resolve(cwd, rootDir, 'application/use-cases'),
        allowImportsFrom: ['user-domain'], // Uses arbitrary identifier
      };

      const boundaries = [domainBoundary, applicationBoundary];

      const fileDir = path.resolve(cwd, rootDir, 'application/use-cases');

      // ✅ ALLOWED: use-cases can import from user-domain
      handleImport({
        rawSpec: '@entities/user',
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

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle short arbitrary identifiers', () => {
      const { reporter, createFixer } = createMockPorts();

      const domainBoundary: Boundary = {
        dir: 'domain',
        alias: '@domain',
        identifier: 'd', // Very short identifier
        absDir: path.resolve(cwd, rootDir, 'domain'),
        allowImportsFrom: [],
      };

      const applicationBoundary: Boundary = {
        dir: 'application',
        alias: '@application',
        identifier: 'a', // Very short identifier
        absDir: path.resolve(cwd, rootDir, 'application'),
        allowImportsFrom: ['d'], // Uses short identifier
      };

      const boundaries = [domainBoundary, applicationBoundary];

      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: a can import from d
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
        skipBoundaryRules: false,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle identifiers with special characters', () => {
      const { reporter, createFixer } = createMockPorts();

      const domainBoundary: Boundary = {
        dir: 'domain',
        alias: '@domain',
        identifier: 'domain-core', // With hyphen
        absDir: path.resolve(cwd, rootDir, 'domain'),
        allowImportsFrom: [],
      };

      const applicationBoundary: Boundary = {
        dir: 'application',
        alias: '@application',
        identifier: 'app_layer', // With underscore
        absDir: path.resolve(cwd, rootDir, 'application'),
        allowImportsFrom: ['domain-core'], // Uses identifier with hyphen
      };

      const boundaries = [domainBoundary, applicationBoundary];

      const fileDir = path.resolve(cwd, rootDir, 'application');

      // ✅ ALLOWED: app_layer can import from domain-core
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
        skipBoundaryRules: false,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });

    it('should handle type-only imports with arbitrary identifiers', () => {
      const { reporter, createFixer } = createMockPorts();

      const domainBoundary: Boundary = {
        dir: 'domain',
        alias: '@domain',
        identifier: 'core',
        absDir: path.resolve(cwd, rootDir, 'domain'),
        allowImportsFrom: [],
      };

      const infrastructureBoundary: Boundary = {
        dir: 'infrastructure',
        alias: '@infrastructure',
        identifier: 'infra',
        absDir: path.resolve(cwd, rootDir, 'infrastructure'),
        allowImportsFrom: ['core'], // Value imports from core
        allowTypeImportsFrom: ['app'], // Type imports from app (arbitrary identifier)
      };

      const applicationBoundary: Boundary = {
        dir: 'application',
        alias: '@application',
        identifier: 'app',
        absDir: path.resolve(cwd, rootDir, 'application'),
        allowImportsFrom: ['core'],
      };

      const boundaries = [
        domainBoundary,
        applicationBoundary,
        infrastructureBoundary,
      ];

      const fileDir = path.resolve(cwd, rootDir, 'infrastructure');

      // ✅ ALLOWED: Type-only import from app (using arbitrary identifier)
      handleImport({
        rawSpec: '@application',
        fileDir,
        fileBoundary: infrastructureBoundary,
        boundaries,
        rootDir,
        cwd,
        reporter,
        createFixer,
        crossBoundaryStyle: 'alias',
        skipBoundaryRules: false,
        isTypeOnly: true,
      });

      expect(reporter.report).not.toHaveBeenCalled();
    });
  });
});
