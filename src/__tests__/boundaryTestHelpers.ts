/**
 * Shared helpers for unit tests — build Boundary objects with resolved absDir.
 */

import type { Boundary } from '@shared';
import path from 'node:path';

const DEFAULT_CWD = '/project';
const DEFAULT_ROOT_DIR = 'src';

export type CreateBoundaryInput = Partial<
  Omit<Boundary, 'absDir' | 'dir' | 'identifier'>
> & {
  dir: string;
  identifier?: string;
};

export function createBoundary(
  config: CreateBoundaryInput,
  context?: { cwd: string; rootDir: string },
): Boundary {
  const cwd = context?.cwd ?? DEFAULT_CWD;
  const rootDir = context?.rootDir ?? DEFAULT_ROOT_DIR;
  const identifier = config.identifier ?? config.alias ?? config.dir;
  const absDir = path.resolve(cwd, rootDir, config.dir);
  return {
    identifier,
    dir: config.dir,
    alias: config.alias,
    absDir,
    allowImportsFrom: config.allowImportsFrom,
    denyImportsFrom: config.denyImportsFrom,
    allowTypeImportsFrom: config.allowTypeImportsFrom,
    nestedPathFormat: config.nestedPathFormat,
    severity: config.severity,
  };
}
