# Migration Guide: Moving to Standalone Package

This guide helps you migrate `eslint-plugin-import-boundaries` from the monorepo to a standalone npm package.

## Step 1: Create New Repository

```bash
# Create new repository on GitHub
gh repo create eslint-plugin-import-boundaries --public

# Clone it
git clone git@github.com:ClassicalMoser/eslint-plugin-import-boundaries.git
cd eslint-plugin-import-boundaries
```

## Step 2: Copy Files

Copy the following from `prevail-rules/eslint-rules/`:

```bash
# From the monorepo
cp -r eslint-rules/eslint-plugin-import-boundaries/ .
cp eslint-rules/README.md .
cp eslint-rules/tsdown.config.ts .
cp eslint-rules/vitest.config.ts .
cp eslint-rules/tsconfig.json .
cp eslint-rules/package.json .
cp eslint-rules/.npmignore .
cp eslint-rules/LICENSE .  # If it exists, or create one
```

## Step 3: Update Configuration

### Update `tsdown.config.ts`

The entry path should be relative to the new root:

```typescript
export default defineConfig({
  entry: {
    'eslint-plugin-import-boundaries': path.resolve(
      __dirname,
      'eslint-plugin-import-boundaries/index.ts',
    ),
  },
  // ... rest stays the same
});
```

### Update `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    include: ['**/*.test.{js,ts}'],  // Remove eslint-rules/ prefix
    coverage: {
      include: ['eslint-plugin-import-boundaries/**/*.ts'],
      // ... rest
    },
  },
});
```

### Update `tsconfig.json`

Remove the `extends` if it references the parent:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "rootDir": ".",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": false,
    "declarationMap": false,
    "outDir": ".",
    "isolatedDeclarations": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 4: Create ESLint Config

Create `eslint.config.js`:

```javascript
import antfu from '@antfu/eslint-config';
import prettierConfig from 'eslint-config-prettier';

export default antfu(
  {
    typescript: true,
    stylistic: false,
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '*.js'],
  },
  prettierConfig,
);
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Test Build

```bash
npm run build
npm test
```

## Step 7: Update README

Update repository URLs in `README.md`:

```markdown
[![npm version](https://img.shields.io/npm/v/eslint-plugin-import-boundaries)](https://www.npmjs.com/package/eslint-plugin-import-boundaries)

Repository: https://github.com/ClassicalMoser/eslint-plugin-import-boundaries
```

## Step 8: Create LICENSE

If not already present:

```bash
cat > LICENSE << EOF
ISC License

Copyright (c) 2024 ClassicalMoser

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
EOF
```

## Step 9: Publish to npm

```bash
# Login to npm
npm login

# Publish (will run prepublishOnly script)
npm publish
```

## Step 10: Update Original Repository

In `prevail-rules`, update `eslint.config.js` to use the published package:

```javascript
import importBoundaries from 'eslint-plugin-import-boundaries';

export default {
  plugins: {
    'import-boundaries': importBoundaries,
  },
  // ... rest
};
```

And update `package.json`:

```json
{
  "devDependencies": {
    "eslint-plugin-import-boundaries": "^0.1.0"
  }
}
```

## Optional: GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm typecheck
      - run: pnpm lint
```

## Optional: Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

