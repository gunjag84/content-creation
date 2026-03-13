---
phase: 03-content-generation
plan: "05"
subsystem: Wizard UI
tags: [zustand, react, ui, wizard, tdd]
completed: 2026-03-13T07:44:54Z
duration_minutes: 8.6

# Dependency graph
requires: [03-01-generation-types]
provides: [wizard-store, step-1-ui, wizard-shell]
affects: [App.tsx-navigation]

# Tech stack
added:
  - zustand (wizard state management)
  - wizard component pattern
patterns:
  - TDD for store logic
  - Step-based navigation
  - Recommendation-driven UX

# Key files
created:
  - src/renderer/src/stores/useCreatePostStore.ts
  - tests/renderer/stores/createPostStore.test.ts
  - src/renderer/src/components/wizard/StepIndicator.tsx
  - src/renderer/src/components/wizard/Step1Recommendation.tsx
  - src/renderer/src/pages/CreatePost.tsx
modified:
  - src/renderer/src/App.tsx

# Decisions
key_decisions:
  - TDD approach for store: RED tests first, then GREEN implementation
  - Zustand over Context API: simpler, performant, established pattern from Phase 2
  - Step 1 loads recommendations on mount: automatic cold-start detection
  - Warning badges on affected dropdowns: inline UX, no separate alert
  - Mode toggle controls CTA button text and destination: "Generate Content" vs "Fill In Manually"
  - Steps 2-5 as placeholders: established routing pattern, ready for Plan 06/07 implementation
---

# Phase 03 Plan 05: Wizard Store + Step 1 UI - Summary

**One-liner:** Zustand wizard store with TDD-tested state management plus fully functional Step 1 (recommendation card, override controls, mode toggle, custom background upload)

## What Was Built

Built the foundational wizard architecture: Zustand store managing all 5 steps of state, Step 1 UI showing AI recommendations with override controls, and the CreatePost page shell routing between steps.

**Key capabilities:**
- **Wizard store** with state for all 5 steps (recommendations, slides, renders, stories, export)
- **Step 1 UI** showing recommendation card with pillar/theme/mechanic, override dropdowns, mode toggle, impulse field, and custom background upload
- **StepIndicator** component showing 5-step progress with checkmarks and current step highlighting
- **CreatePost page** routing between steps with exit button
- **TDD coverage** with 4 passing tests for core store actions

## Implementation Notes

### TDD Cycle (Task 1)
**RED:** Created 4 failing tests for setSlide, reorderSlides, reset, and setStep
**GREEN:** Implemented useCreatePostStore with full wizard state and actions
**Result:** All 4 tests pass

### Store Design
- **Navigation:** currentStep (1-5), mode (ai/manual)
- **Step 1:** recommendation, warnings, selections, impulse, custom background
- **Step 2/3:** generatedSlides, caption, isGenerating, generationError
- **Step 4:** renderedPNGs (base64 data URLs), postId
- **Step 5:** storyProposals, approvedStories, exportFolder
- **Actions:** 14 actions covering all wizard operations (setStep, setSlide, reorderSlides, reset, etc.)

### Step 1 UI Features
- **Recommendation card:** Shows pillar/theme/mechanic from balance engine or "cold start" message
- **Override dropdowns:** Three Select components pre-populated from recommendation, with warning badges
- **Warning badges:** Amber AlertCircle icon + tooltip for overused dimensions
- **Content type selector:** Radio-style buttons for Single vs Carousel
- **Impulse textarea:** Optional free-text guidance for AI
- **Custom background upload:** Calls window.api.templates.uploadBackground()
- **Mode toggle:** Switch between AI generation and manual entry
- **CTA button:** "Generate Content" (AI mode to Step 2) or "Fill In Manually" (manual mode to Step 3)

### Component Architecture
- **StepIndicator:** Reusable 5-step progress indicator with checkmarks
- **Step1Recommendation:** Loads recommendation data on mount, manages local settings state
- **CreatePost:** Wizard container with step routing, exit button calls reset() and navigates to dashboard
- **App.tsx:** Updated 'create' case to use CreatePost instead of TestRender

## Tests

**Store tests (4 passing):**
- setSlide updates specific slide field
- reorderSlides moves slide from index 0 to 2 correctly
- reset clears all state to initial values
- setStep updates current step

**Build status:** Clean build, no TypeScript errors

## Verification

- [x] All 4 store tests GREEN
- [x] Build passes without errors
- [x] Clicking Create in sidebar shows wizard (replaces content area)
- [x] Step 1 shows recommendation card with pillar/theme/mechanic
- [x] Override dropdowns populated from settings
- [x] Mode toggle visible and functional
- [x] Step indicator shows 5 steps with current step highlighted
- [x] Steps 2-5 render placeholder content

## Deviations from Plan

None - plan executed exactly as written.

## Performance

- **Duration:** 8.6 minutes
- **Tasks completed:** 2 (TDD store + UI components)
- **Files created:** 5
- **Files modified:** 1
- **Tests added:** 4 (all passing)
- **Commits:** 2

## Commits

| Hash    | Message                                       |
| ------- | --------------------------------------------- |
| 913c51f | test(03-05): add failing tests for createPostStore |
| 7cd00b2 | feat(03-05): implement wizard UI components   |

## Next Steps

Plan 06 will implement Steps 2 and 3 (AI generation and slide editing). The wizard store shape is established, and the routing pattern is ready.

**Ready for:** 03-06 (Step 2: AI Generation + Step 3: Slide Editor)

## Self-Check

**PASSED**

All created files verified:
- src/renderer/src/stores/useCreatePostStore.ts: FOUND
- tests/renderer/stores/createPostStore.test.ts: FOUND
- src/renderer/src/components/wizard/StepIndicator.tsx: FOUND
- src/renderer/src/components/wizard/Step1Recommendation.tsx: FOUND
- src/renderer/src/pages/CreatePost.tsx: FOUND

All commits verified:
- 913c51f: FOUND
- 7cd00b2: FOUND
