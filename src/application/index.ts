/**
 * Application layer: Orchestrates domain logic (functional core)
 * Depends on domain and ports, NOT on infrastructure (Dependency Inversion).
 */

export {
  detectAndReportAncestorBarrel,
  isExternalPackage,
} from './detection';

export { handleUnknownBoundary } from './handling';

export { handleImport } from './importHandler';
export type { HandleImportOptions } from './importHandler';

export {
  getSeverity,
  reportViolation,
} from './reporting';
export type { ReportViolationOptions } from './reporting';

export {
  validateAliasSubpath,
  validateBoundaryRules,
  validatePathFormat,
} from './validation';
