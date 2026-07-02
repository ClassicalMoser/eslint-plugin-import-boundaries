/**
 * Application layer: Orchestrates domain logic (functional core)
 * Depends on domain and ports, NOT on infrastructure (Dependency Inversion).
 *
 * Only the cross-boundary API is exported here; internals are imported
 * directly by sibling modules within the application layer.
 */

export { handleImport } from './importHandler';
export type { HandleImportOptions } from './importHandler';
