---
phase: 03-content-generation
plan: "03"
subsystem: learning-system-backend
tags: [tdd, database, ipc, services]
dependency_graph:
  requires: [03-01]
  provides: [balance-matrix-queries, soft-signal-warnings, pillar-balance-calculator, post-crud-ipc]
  affects: [dashboard, recommendation-engine, post-wizard]
tech_stack:
  added: []
  patterns: [tdd-red-green, ipc-request-response, service-layer]
key_files:
  created:
    - tests/main/db/queries.test.ts
    - tests/main/services/learning-warnings.test.ts
    - tests/main/services/pillar-balance.test.ts
    - src/main/services/learning-warnings.ts
    - src/main/services/pillar-balance.ts
    - src/main/ipc/posts.ts
  modified:
    - src/main/db/queries.ts
    - src/main/index.ts
    - src/preload/types.ts
    - src/preload/index.ts
decisions:
  - "TDD approach: Write RED tests first, implement GREEN, verify all passing"
  - "Service layer pattern: Pure functions (generateWarnings, calculatePillarBalance) separate from DB queries"
  - "IPC namespace: posts.* for all post/slide CRUD and balance operations"
  - "Balance matrix includes all posts (ad_hoc included) - filtering happens at UI/service layer"
  - "Soft-signal threshold: usage_count > 3 AND last_used within 14 days"
metrics:
  duration: 12
  completed_at: "2026-03-13T07:49:09Z"
  tasks_completed: 2
  files_created: 6
  files_modified: 4
  test_coverage: 17/17 passing
  commits: 3
---

# Phase 03 Plan 03: Learning System Backend Summary

JWT authentication with refresh rotation using jose library, middleware integration, and session management.

## Implementation Summary

Implemented the learning system backend data layer using TDD methodology. Started with RED (failing tests), progressed to GREEN (implementation), and verified all 17 tests passing. Created two pure service functions (generateWarnings, calculatePillarBalance) and extended DB queries with slide operations. Wired everything through IPC handlers exposed in the posts.* namespace.

**One-liner:** Learning system backend with balance matrix tracking, soft-signal warnings, pillar balance calculator, and comprehensive post/slide CRUD via IPC.

## Tasks Completed

### Task 1: TDD RED - Write Failing Tests

**Status:** ✅ Complete
**Commit:** c5ba88e
**Duration:** 5 min

Created comprehensive test suites for:
- DB queries (insertSlide, updatePostStatus, getPostWithSlides, balance matrix operations)
- Learning warnings service (threshold-based warning generation)
- Pillar balance calculator (actual vs target percentage calculation)

All tests failed initially (RED phase) as expected - functions didn't exist yet.

**Files created:**
- tests/main/db/queries.test.ts (8 tests)
- tests/main/services/learning-warnings.test.ts (5 tests)
- tests/main/services/pillar-balance.test.ts (4 tests)

**Verification:** Tests failed with "function not defined" errors - correct RED state.

### Task 2: TDD GREEN - Implement Services and IPC

**Status:** ✅ Complete
**Commits:** 43bed0f (IPC handlers)
**Duration:** 7 min

Implemented all required functionality to make tests pass:

1. **Extended queries.ts** with:
   - insertSlide() - Create carousel slide with all text zones
   - updatePostStatus() - Change post status (draft/approved/exported)
   - getPostWithSlides() - Fetch post + array of slides
   - Interfaces: SlideInsert, Slide, PostWithSlides

2. **Created learning-warnings.ts**:
   - generateWarnings() - Pure function analyzing balance entries
   - Triggers when usage_count > 3 AND last_used within 14 days
   - Returns array of BalanceWarning with formatted messages

3. **Created pillar-balance.ts**:
   - calculatePillarBalance() - Pure function grouping balance data
   - Calculates actual_pct = (count / total) * 100
   - Compares to target percentages from settings
   - Returns BalanceDashboardData with pillars, mechanics, themes

4. **Created posts.ts IPC handlers**:
   - posts:create - insertPost(), returns postId
   - posts:save-slides - insertSlide() for array, returns slideIds
   - posts:update-status - updatePostStatus()
   - posts:get-with-slides - getPostWithSlides()
   - posts:get-recommendation-data - combines getBalanceMatrix() + generateWarnings() + calculatePillarBalance()
   - posts:update-balance - updateBalanceMatrix() for multiple variables

5. **Wired IPC into preload layer**:
   - Added posts namespace to IElectronAPI in types.ts
   - Exposed 6 IPC methods in index.ts with type-safe signatures
   - Imported posts.ts handler in main/index.ts

**Files created:**
- src/main/services/learning-warnings.ts
- src/main/services/pillar-balance.ts
- src/main/ipc/posts.ts

**Files modified:**
- src/main/db/queries.ts (+78 lines: interfaces, insertSlide, updatePostStatus, getPostWithSlides)
- src/main/index.ts (+1 line: import './ipc/posts')
- src/preload/types.ts (+16 lines: posts namespace definition)
- src/preload/index.ts (+7 lines: posts IPC method exposure)

**Verification:**
- All 17 tests passing (GREEN)
- Build successful (no TypeScript errors)
- IPC handlers registered and exposed to renderer

## Deviations from Plan

None - plan executed exactly as written. TDD cycle followed (RED → GREEN), all specified functions implemented, IPC handlers created with correct signatures, preload layer wired correctly.

## Technical Decisions

1. **Service layer separation:** generateWarnings() and calculatePillarBalance() are pure functions - no DB coupling, easy to test, reusable.

2. **Balance matrix inclusivity:** getBalanceMatrix() returns ALL entries (including ad_hoc posts). Filtering happens at the service layer (e.g., learning-warnings can filter by variable_type).

3. **IPC error handling:** All handlers return `{ success: boolean; error?: string }` pattern for consistent error propagation.

4. **Timestamp precision:** Use Math.floor(Date.now() / 1000) for unix timestamps to match SQLite's strftime('%s', 'now').

5. **Slide type enum:** TypeScript literal type 'cover' | 'content' | 'cta' enforced in interfaces - matches DB CHECK constraint.

## Test Results

```
Test Files  3 passed (3)
Tests       17 passed (17)
Duration    2.14s
```

**Coverage:**
- queries.test.ts: 8/8 passing (insertSlide, updatePostStatus, getPostWithSlides, balance matrix CRUD)
- learning-warnings.test.ts: 5/5 passing (threshold logic, edge cases, multiple warnings)
- pillar-balance.test.ts: 4/4 passing (percentage calc, grouping, empty state, missing targets)

**Build verification:** `npm run build` succeeded - all TypeScript types correct, IPC signatures match.

## Integration Points

**Downstream consumers:**
- Dashboard widget will call `posts.getRecommendationData()` to populate balance overview
- Step 1 recommendation engine will use balance data to suggest pillar/theme/mechanic
- Step 3 editor will call `posts.saveSlides()` to persist slide edits
- Step 4 render will call `posts.updateStatus()` to mark post as approved
- Export flow will call `posts.updateBalance()` to increment usage counts

**Data flow:**
1. User creates post → `posts.create()` → insertPost() → returns postId
2. User saves slides → `posts.saveSlides()` → insertSlide() for each → returns slideIds
3. User completes post → `posts.updateStatus(postId, 'approved')` → updatePostStatus()
4. User exports → `posts.updateBalance(brandId, variables)` → updateBalanceMatrix() → increments usage_count, sets last_used
5. Dashboard loads → `posts.getRecommendationData()` → getBalanceMatrix() + generateWarnings() + calculatePillarBalance() → dashboard displays

## Files Changed

**Created (6 files):**
- tests/main/db/queries.test.ts (161 lines)
- tests/main/services/learning-warnings.test.ts (103 lines)
- tests/main/services/pillar-balance.test.ts (116 lines)
- src/main/services/learning-warnings.ts (43 lines)
- src/main/services/pillar-balance.ts (61 lines)
- src/main/ipc/posts.ts (106 lines)

**Modified (4 files):**
- src/main/db/queries.ts (+78 lines)
- src/main/index.ts (+1 line)
- src/preload/types.ts (+16 lines)
- src/preload/index.ts (+7 lines)

**Total lines:** 692 lines (590 created, 102 modified)

## Commits

1. **c5ba88e** - test(03-03): add failing tests for learning system backend
   - Created 3 test files with 17 total tests
   - All tests RED (expected failures)

2. **43bed0f** - feat(03-03): add post CRUD and balance IPC handlers
   - Implemented services (learning-warnings, pillar-balance)
   - Extended queries.ts with slide operations
   - Created posts.ts IPC handler with 6 channels
   - Wired IPC into preload layer
   - All tests GREEN (17/17 passing)

## Next Steps

**Immediate blockers:** None - backend complete, ready for UI integration.

**Dependencies satisfied:** This plan provides balance-matrix-queries, soft-signal-warnings, pillar-balance-calculator, and post-crud-ipc. All downstream plans (03-04, 03-05, 03-06) can now proceed.

**Recommended next:** Execute plan 03-04 (Export IPC) or 03-05 (Wizard State) - both are unblocked.

## Self-Check: PASSED

**Created files verified:**
```
FOUND: tests/main/db/queries.test.ts
FOUND: tests/main/services/learning-warnings.test.ts
FOUND: tests/main/services/pillar-balance.test.ts
FOUND: src/main/services/learning-warnings.ts
FOUND: src/main/services/pillar-balance.ts
FOUND: src/main/ipc/posts.ts
```

**Commits verified:**
```
FOUND: c5ba88e (test: add failing tests)
FOUND: 43bed0f (feat: add IPC handlers)
```

**Test verification:**
```
All 17 tests passing
Build successful (no TypeScript errors)
```

All deliverables confirmed present and working.
