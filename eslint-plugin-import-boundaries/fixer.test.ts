/**
 * Unit tests for fixer.ts
 * Tests ESLint fixer creation for different import types.
 */

import { describe, it, expect, vi } from 'vitest';
import { createFixer } from './fixer.js';
import type { Rule } from 'eslint';

describe('fixer', () => {
  describe('createFixer', () => {
    it('should create fixer for ImportDeclaration', () => {
      const node: Rule.Node = {
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          value: '@entities',
          raw: "'@entities'",
        },
      } as Rule.Node;

      const fixer = createFixer(node, '@entities');
      expect(fixer).not.toBeNull();

      // Mock fixer object
      const mockFixer = {
        replaceText: vi.fn().mockReturnValue({}),
      };

      const result = fixer!(mockFixer as any);
      expect(mockFixer.replaceText).toHaveBeenCalledWith(
        node.source,
        "'@entities'",
      );
    });

    it('should create fixer for ImportExpression (dynamic import)', () => {
      const node: Rule.Node = {
        type: 'ImportExpression',
        source: {
          type: 'Literal',
          value: '@entities',
          raw: "'@entities'",
        },
      } as Rule.Node;

      const fixer = createFixer(node, '@entities');
      expect(fixer).not.toBeNull();

      const mockFixer = {
        replaceText: vi.fn().mockReturnValue({}),
      };

      const result = fixer!(mockFixer as any);
      expect(mockFixer.replaceText).toHaveBeenCalledWith(
        node.source,
        "'@entities'",
      );
    });

    it('should create fixer for require() calls', () => {
      const node: Rule.Node = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'require',
        },
        arguments: [
          {
            type: 'Literal',
            value: '@entities',
            raw: "'@entities'",
          },
        ],
      } as Rule.Node;

      const fixer = createFixer(node, '@entities');
      expect(fixer).not.toBeNull();

      const mockFixer = {
        replaceText: vi.fn().mockReturnValue({}),
      };

      const result = fixer!(mockFixer as any);
      expect(mockFixer.replaceText).toHaveBeenCalledWith(
        (node as any).arguments[0],
        "'@entities'",
      );
    });

    it('should handle paths with special characters', () => {
      const node: Rule.Node = {
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          value: './file',
          raw: "'./file'",
        },
      } as Rule.Node;

      const fixer = createFixer(node, '../cousin');
      expect(fixer).not.toBeNull();

      const mockFixer = {
        replaceText: vi.fn().mockReturnValue({}),
      };

      fixer!(mockFixer as any);
      expect(mockFixer.replaceText).toHaveBeenCalledWith(
        node.source,
        "'../cousin'",
      );
    });

    it('should return fixer that returns null for unsupported node types', () => {
      const node: Rule.Node = {
        type: 'VariableDeclaration',
      } as Rule.Node;

      const fixer = createFixer(node, '@entities');
      // The fixer function itself is created, but it returns null when called
      expect(fixer).not.toBeNull();

      const mockFixer = {
        replaceText: vi.fn(),
      };

      const result = fixer!(mockFixer as any);
      expect(result).toBeNull();
      expect(mockFixer.replaceText).not.toHaveBeenCalled();
    });
  });
});

