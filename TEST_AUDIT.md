# Test Audit - Correctness Focus

This audit compares tests against the README spec to identify gaps and incorrect behaviors.

## Critical Issues (Should Be Fixed)

### 1. Same-Directory Ancestor Barrel (BUG)

**Location:** `relationshipDetection.test.ts:442-465`

**Current Behavior:** Returns `'./index'` for `./index` in same directory
**Correct Behavior (per README):** Should return `null` - ancestor barrels are forbidden

**README Spec:** "Ancestor Barrel Prevention - Prevents circular dependencies by blocking ancestor barrel imports"

**Issue:** Test comment says "known limitation" but this violates the spec. Same-directory `./index` importing the directory's own index is an ancestor barrel and should be forbidden.

**Fix Required:** Update code to return `null` for same-directory barrel imports, or clarify in README if this is intentionally allowed.

---

## Test Coverage Gaps

### 2. Unknown Alias Handling

**Location:** `relationshipDetection.ts:58`

**Scenario:** Alias import that doesn't match any boundary (e.g., `@unknown`)
**Expected:** Should return empty `targetAbs` and `targetDir`
**Test Status:** ❌ Not explicitly tested

### 3. Falsy firstDifferingSegment

**Location:** `relationshipDetection.ts:286`

**Scenario:** Edge case where `firstDifferingSegment` is falsy
**Expected:** Should return `null`
**Test Status:** ❌ Not tested (should be unreachable, but should be tested)

### 4. Fallback Absolute Path (No Alias)

**Location:** `relationshipDetection.ts:317`

**Scenario:** Alias mode but boundary has no alias configured
**Expected:** Should fallback to absolute path
**Test Status:** ⚠️ Should be covered after recent fix, verify

### 5. Defensive Return False

**Location:** `importHandler.ts:194`

**Scenario:** Unreachable code path
**Expected:** Should never be reached
**Test Status:** ❌ Not tested (defensive code, but should verify it's truly unreachable)

---

## README Spec vs Tests

### Core Rule 1: Cross-Boundary Imports → No Subpath

**Spec:** Cross-boundary must use boundary identifier with no subpath

- ✅ `@domain` (correct)
- ❌ `@domain/entities` (wrong - subpath not allowed)
- ❌ `../domain` (wrong - relative not allowed)

**Test Coverage:**

- ✅ Cross-boundary alias (no subpath) - tested
- ✅ Cross-boundary absolute style - tested
- ⚠️ Cross-boundary subpath rejection - need to verify error message matches spec
- ⚠️ Cross-boundary relative rejection - need to verify error message matches spec

### Core Rule 2: Same-Boundary Imports → Relative (when close)

**Spec:**

- Same directory: `./helper` ✅
- Parent's sibling (cousin, max one ../): `../utils` ✅
- Distant: `@application/use-cases` ✅ (alias with subpath allowed for same-boundary)

**Test Coverage:**

- ✅ Same directory sibling - tested
- ✅ Cousin (../) - tested
- ✅ Distant same-boundary (alias with subpath) - tested
- ⚠️ Distant same-boundary (absolute style) - newly added, verify

### Core Rule 3: Architectural Boundary Enforcement

**Spec:** Allow/deny rules, nested boundaries, no inheritance

**Test Coverage:**

- ✅ Basic allow/deny - tested in `boundaryRules.test.ts`
- ✅ Type-only imports - tested
- ⚠️ Nested boundaries (parent/child resolution) - need to verify files use most specific boundary
- ⚠️ Sibling boundaries with different rules - need to verify
- ⚠️ Conflict resolution (same boundary in both allow/deny) - need to verify deny takes precedence

### Core Rule 4: Type-Only Imports

**Spec:** `allowTypeImportsFrom` allows type imports but not value imports

**Test Coverage:**

- ✅ Type import allowed when in `allowTypeImportsFrom` - tested
- ✅ Value import denied when only type allowed - tested
- ⚠️ Type import denied when not in `allowTypeImportsFrom` - verify

### Core Rule 5: Ancestor Barrel Prevention

**Spec:** Block ancestor barrel imports (boundary-level and directory-level)

**Test Coverage:**

- ✅ Boundary-level ancestor barrel - tested (returns null, reports error)
- ❌ Same-directory ancestor barrel - **BUG**: Currently returns `'./index'` instead of `null`
- ⚠️ Absolute style ancestor barrel - verify tested

---

## Missing Test Scenarios

### Absolute Path Style

- [ ] Same-boundary boundary root files in absolute mode
- [ ] Same-boundary top-level imports in absolute mode
- [ ] Ancestor barrel in absolute mode (boundary root)
- [ ] Ancestor barrel in absolute mode (same directory)

### Nested Boundaries

- [ ] File in child boundary uses child's rules (not parent's)
- [ ] Import can reference parent boundary identifier even when child exists
- [ ] Sibling boundaries with different rules work independently

### Edge Cases

- [ ] Boundary with no alias in alias mode (should error during validation)
- [ ] Boundary with alias in absolute mode (should work, alias optional)
- [ ] Unknown boundary import (outside all boundaries)
- [ ] Bare import that matches boundary dir pattern

### Rule Semantics

- [ ] Only `allowImportsFrom`: deny-all by default
- [ ] Only `denyImportsFrom`: allow-all by default
- [ ] Neither: deny-all by default (strictest)
- [ ] Both: allow list + deny list with conflict resolution (deny wins)

---

## Recommendations

1. **Fix the same-directory ancestor barrel bug** - it violates the spec
2. **Add tests for all README examples** - ensure every code example has a corresponding test
3. **Test nested boundary scenarios** - verify parent/child resolution works correctly
4. **Test absolute path style comprehensively** - ensure parity with alias style
5. **Test rule semantics edge cases** - verify allow/deny/neither/both combinations
6. **Add integration-style tests** - test full scenarios matching README examples
