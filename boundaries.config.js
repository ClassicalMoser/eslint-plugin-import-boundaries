/**
 * Boundary configuration for this codebase.
 * Enforces hexagonal architecture with functional core, imperative shell.
 */

/**
 * Hexagonal architecture boundaries for this ESLint plugin.
 *
 * Structure:
 * - domain: Pure business logic (functional core)
 * - ports: Interfaces only (dependency inversion contracts)
 * - application: Orchestrates domain logic (functional core)
 * - infrastructure: Imperative shell (ESLint adapters)
 * - shared: Types and utilities (used by all)
 */
export const boundariesConfig = {
  rootDir: 'src',
  boundaries: [
    {
      dir: 'domain',
      alias: '@domain',
      // Domain: Pure business logic (functional core)
      // Can import types from shared, but not other layers
      allowImportsFrom: ['@shared'],
    },
    {
      dir: 'ports',
      alias: '@ports',
      // Ports: Interfaces only (dependency inversion contracts)
      // No dependencies
    },
    {
      dir: 'application',
      alias: '@application',
      // Application: Orchestrates domain logic (functional core)
      // Depends on domain and ports, NOT infrastructure (dependency inversion)
      // Whitelist pattern - only allows domain, ports, and shared
      allowImportsFrom: ['@domain', '@ports', '@shared'],
    },
    {
      dir: 'infrastructure',
      alias: '@infrastructure',
      // Infrastructure: Imperative shell (ESLint adapters)
      // Can use domain, ports, shared, and ESLint
      // Calls application (driving adapter)
      allowImportsFrom: ['@domain', '@ports', '@shared', '@application'],
    },
    {
      dir: 'shared',
      alias: '@shared',
      // Shared: Types and utilities
      // No dependencies, used by all layers
    },
  ],
  crossBoundaryStyle: 'alias',
  allowUnknownBoundaries: true, // Allow imports from outside src (node_modules, etc.)
};
