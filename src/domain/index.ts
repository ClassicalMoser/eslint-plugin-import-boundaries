/**
 * Domain layer: Pure business logic (functional core)
 * No dependencies on infrastructure, application, or ports.
 */

// Boundary detection and rules
export {
  checkAliasSubpath,
  checkBoundaryRules,
  getBoundaryIdentifier,
  getFileData,
  resolveToBoundary,
} from './boundary';

// Path utilities
export {
  absoluteToRelativePath,
  choosePathFormat,
  formatAbsolutePath,
  getBarrelPath,
  getBasenameWithoutExt,
  hasExtension,
  isInsideDir,
  isNonCodeSpecifier,
  pathToParts,
} from './path';

// Path calculation
export {
  calculateBoundaryRootPath,
  calculateCrossBoundaryPath,
  calculateDistantPath,
  calculateSameBoundaryPath,
  calculateSameDirectoryPath,
  checkAncestorBarrel,
} from './pathCalculation';

// Path resolution
export {
  extractBareImportSubpath,
  findMatchingBoundary,
  resolveAbsoluteImport,
  resolveAliasImport,
  resolveBareImport,
  resolveRelativeImport,
  resolveTarget,
  resolveTargetPath,
} from './pathResolution';

// Relationship detection
export { calculateCorrectImportPath } from './relationship';
