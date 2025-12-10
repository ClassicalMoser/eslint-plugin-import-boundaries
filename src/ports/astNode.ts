/**
 * Port: AST Node interface
 * Abstract representation of AST nodes.
 * Infrastructure (ESLint) adapts its AST nodes to this interface.
 */

/**
 * Abstract AST node interface.
 * ESLint-specific nodes are adapted to this interface.
 */
export interface ASTNode {
  /**
   * Get the source text of the import specifier.
   */
  getImportSpecifier: () => string | null;

  /**
   * Check if this is a type-only import.
   */
  isTypeOnly: () => boolean;
}
