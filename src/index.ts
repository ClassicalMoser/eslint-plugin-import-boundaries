/**
 * ESLint rule: boundary-alias-vs-relative
 *
 * Enforces architectural boundaries using a deterministic heuristic.
 * The rule uses pure path math and AST analysis - no file I/O.
 * All violations are auto-fixable.
 */

import type { Rule } from 'eslint';
import {
  createFileDataGetter,
  extractRuleOptions,
} from './ruleContext.js';
import { ruleMessages, ruleSchema } from './ruleSchema.js';
import { createRuleVisitors } from './ruleVisitors.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Enforces architectural boundaries with deterministic import path rules: cross-boundary uses alias without subpath, siblings use relative, boundary-root and top-level paths use alias, cousins use relative (max one ../).',
      recommended: false,
    },
    schema: ruleSchema,
    messages: ruleMessages,
  },

  create(context) {
    // Extract and validate rule options
    const ruleContext = extractRuleOptions(context);

    // Create cached file data getter
    const { getFileData, clearCache } = createFileDataGetter(
      context,
      ruleContext.boundaries,
    );

    // Create AST visitors
    return createRuleVisitors({
      context,
      getFileData,
      clearCache,
      rootDir: ruleContext.rootDir,
      boundaries: ruleContext.boundaries,
      cwd: ruleContext.cwd,
      crossBoundaryStyle: ruleContext.crossBoundaryStyle,
      defaultSeverity: ruleContext.defaultSeverity,
      allowUnknownBoundaries: ruleContext.allowUnknownBoundaries,
      enforceBoundaries: ruleContext.enforceBoundaries,
      barrelFileName: ruleContext.barrelFileName,
      fileExtensions: ruleContext.fileExtensions,
    });
  },
};

// ESLint plugins must export an object with a 'rules' property
export default {
  rules: {
    enforce: rule,
  },
};
