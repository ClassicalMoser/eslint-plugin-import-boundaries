# Standalone Package Setup Summary

## ✅ What's Ready

The `eslint-rules/` directory is now configured as a standalone npm package:

### Files Created/Updated

1. **`package.json`** - Standalone package manifest with:
   - Name: `eslint-plugin-import-boundaries`
   - Proper exports for ESM
   - Peer dependency on ESLint >=9.0.0
   - Build/test/lint scripts
   - `prepublishOnly` hook

2. **`.npmignore`** - Excludes source files, tests, configs (keeps only built output)

3. **`MIGRATION.md`** - Step-by-step guide for extracting to new repo

4. **`tsdown.config.ts`** - Already configured correctly ✅

5. **`vitest.config.ts`** - Needs minor update (see below)

6. **`README.md`** - Already publication-ready ✅

## 🔧 Quick Fixes Needed

### 1. Update `vitest.config.ts` for Standalone

When you extract to a new repo, update the paths:

```typescript
export default defineConfig({
  test: {
    include: ['**/*.test.{js,ts}'],  // Remove eslint-rules/ prefix
    coverage: {
      include: ['eslint-plugin-import-boundaries/**/*.ts'],
      // ... rest stays the same
    },
  },
});
```

### 2. Create `tsconfig.json` for Standalone

The current one extends the parent. For standalone, it should be:

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

## 📦 Package Structure

```
eslint-plugin-import-boundaries/
├── eslint-plugin-import-boundaries/    # Source code
│   ├── index.ts
│   ├── importHandler.ts
│   ├── boundaryDetection.ts
│   └── ...
├── eslint-plugin-import-boundaries.js  # Built output (single file)
├── package.json
├── README.md
├── LICENSE
├── tsdown.config.ts
├── vitest.config.ts
├── tsconfig.json
└── .npmignore
```

## 🚀 Next Steps

1. **Create new GitHub repository**:
   ```bash
   gh repo create eslint-plugin-import-boundaries --public
   ```

2. **Copy files** (see `MIGRATION.md` for details):
   ```bash
   # Copy from eslint-rules/ to new repo
   ```

3. **Install & test**:
   ```bash
   npm install
   npm run build
   npm test
   ```

4. **Publish**:
   ```bash
   npm login
   npm publish
   ```

## 📋 What Gets Published

Only these files (via `.npmignore`):
- `eslint-plugin-import-boundaries.js` (built bundle)
- `README.md`
- `LICENSE`
- `package.json`

**Total package size**: ~50-100KB (single bundled JS file)

## 🔗 After Publishing

Update `prevail-rules` to use the published package:

```json
// package.json
{
  "devDependencies": {
    "eslint-plugin-import-boundaries": "^0.1.0"
  }
}
```

```javascript
// eslint.config.js
import importBoundaries from 'eslint-plugin-import-boundaries';
```

## ✨ Benefits of Standalone Package

1. **Independent versioning** - Can release rule updates separately
2. **Reusable** - Others can use it in their projects
3. **Focused** - Single responsibility, clear purpose
4. **Discoverable** - Shows up in npm search
5. **Maintainable** - Clear boundaries, easier to contribute

