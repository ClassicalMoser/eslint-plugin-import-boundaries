// ESLint plugins must export an object with a 'rules' property
// eslint-disable-next-line import-boundaries/enforce
import { rule } from './infrastructure/eslint/rule.js';

export default {
  rules: {
    enforce: rule,
  },
};
