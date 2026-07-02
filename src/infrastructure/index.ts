/**
 * Infrastructure: Imperative shell (adapters)
 * Implements ports and adapts external systems (ESLint) to our application layer.
 *
 * Only the rules consumed by the plugin entry point are exported here;
 * adapters and helpers are internal to the infrastructure layer.
 */

export {
  enforceRule,
  indexSiblingOnlyRule,
  noWildcardBarrelRule,
} from './eslint';
