---
phase: 03-content-generation
plan: "02"
subsystem: content-generation
tags: [tdd, services, recommendation, prompt-assembly, learning, claude-api]
dependency_graph:
  requires: [03-01]
  provides: [recommendation-engine, prompt-assembler]
  affects: [generation-workflow, learning-system]
tech_stack:
  added: []
  patterns: [tdd-red-green, weighted-random-selection, token-budget-management]
key_files:
  created:
    - src/main/services/recommendation.ts
    - src/main/services/prompt-assembler.ts
    - tests/main/services/recommendation.test.ts
    - tests/main/services/prompt-assembler.test.ts
  modified: []
decisions:
  - Weighted random selection for performance-based recommendations using normalized probabilities
  - Token budget management with 8000 token limit for assembled prompts
  - Truncation priority: drop competitor analysis first, then viral expertise
  - Round-robin fallback per dimension when no performance data exists
  - Alphabetical tie-breaking for deterministic round-robin behavior
  - Minimal weight of 1 for zero-performance entries to ensure they can still be selected
metrics:
  duration_minutes: 11
  completed_date: "2026-03-13"
  test_count: 27
  test_pass_rate: 100
---

# Phase 03 Plan 02: Recommendation Engine & Prompt Assembler Summary

**One-liner:** Round-robin and performance-weighted recommendation engine with token-aware prompt assembly for Claude API integration.

## What Was Built

Implemented the intelligence layer for content generation: recommendation engine determines what to create next (Step 1), and prompt assembler builds the context Claude receives (Step 2).

### Recommendation Engine (recommendation.ts)

**Cold Start (Round-Robin):**
- Selects entry with lowest usage_count per dimension (pillar, theme, mechanic)
- Alphabetical tie-breaking by variable_value for deterministic behavior
- Validates all three required dimensions present

**Warm Start (Performance-Weighted):**
- Weighted random selection proportional to avg_performance scores
- Per-dimension fallback to round-robin when no performance data exists
- Normalizes weights and handles edge cases (zero/negative performance)
- Minimum weight of 1 ensures even zero-performance entries can be selected

**Key Design:**
- Pure function - accepts BalanceEntry[] parameter, no DB calls
- DB interaction is IPC handler's responsibility
- Returns BalanceRecommendation with reasoning field ('cold_start_round_robin' | 'performance_weighted')

### Prompt Assembler (prompt-assembler.ts)

**Master Prompt Assembly:**
- Required sections: brand voice, target persona, pillar/theme, content defaults, master template
- Conditional sections: mechanic rules (when active), competitor analysis, viral expertise, impulse
- Token estimation: chars/4 approximation
- Token budget: 8000 token limit with truncation
- Truncation priority: competitor analysis first, then viral expertise
- Master template always appended at end

**Story Prompt Assembly:**
- Includes feed post context (slides, caption)
- Includes story proposal details (type, tool, timing, rationale)
- Requests final story text and tool content from Claude

## Tests

**27 tests, 100% pass rate:**

### Recommendation Engine Tests (8 tests)
- Cold start round-robin selection (lowest usage_count)
- Alphabetical tie-breaking verification
- Single entry per dimension handling
- Performance-weighted distribution (1000 iterations, chi-square-style verification)
- Fallback to round-robin for dimensions without performance data
- Edge case handling (zero performance, empty arrays, missing dimensions)

### Prompt Assembler Tests (19 tests)
- Required sections inclusion verification
- Mechanic rules conditional inclusion
- Optional sections (competitor, viral, impulse) handling
- Token estimation accuracy
- Truncation behavior with 32000-char competitor text
- Story prompt context inclusion

## TDD Execution

**RED Phase:**
- Created comprehensive test suite with 27 tests
- All tests failing initially (implementation files didn't exist)
- Committed: `c3f43d6`

**GREEN Phase:**
- Implemented recommendation.ts with round-robin and weighted selection
- Implemented prompt-assembler.ts with token management
- Fixed tie-breaking test (added missing dimensions)
- Fixed truncation test (increased test data size to trigger truncation)
- All 27 tests passing
- Committed: `43a64eb`

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Recommendation Engine:**
- Used by: Generation IPC handler (Step 1 - recommendation display)
- Depends on: getBalanceMatrix() from src/main/db/queries.ts
- Exports: recommendContent(brandId, balanceEntries) -> BalanceRecommendation

**Prompt Assembler:**
- Used by: Generation IPC handler (Step 2 - Claude API call)
- Depends on: loadSettings() from src/main/services/settings-service.ts
- Exports: assembleMasterPrompt(), assembleStoryPrompt()

## Next Steps

Plan 03-03 will implement the IPC handlers that consume these services:
- Generation IPC: calls Claude API with assembled prompts
- Posts IPC: CRUD operations for draft/approved/exported posts
- Balance IPC: queries for recommendation engine

## Self-Check

Verifying deliverables:

**Files Created:**
- [x] src/main/services/recommendation.ts exists
- [x] src/main/services/prompt-assembler.ts exists
- [x] tests/main/services/recommendation.test.ts exists
- [x] tests/main/services/prompt-assembler.test.ts exists

**Commits:**
- [x] c3f43d6 (test commit - RED)
- [x] 43a64eb (implementation commit - GREEN)

**Tests:**
- [x] All 27 tests passing (verified via npm test)

## Self-Check: PASSED

All deliverables verified. Services are pure, well-tested, and ready for integration in plan 03-03.
