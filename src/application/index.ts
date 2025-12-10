/**
 * Application layer: Orchestrates domain logic (functional core)
 * Depends on domain and ports, NOT on infrastructure (Dependency Inversion).
 */

export * from './detection';
export * from './handling';
export { handleImport, type HandleImportOptions } from './importHandler';
export * from './reporting';
export * from './validation';
