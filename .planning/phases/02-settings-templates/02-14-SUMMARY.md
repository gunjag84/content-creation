---
phase: 02-settings-templates
plan: 14
subsystem: templates
tags: [ux, canvas, discoverability, gap-closure]
dependencies:
  requires: [02-13]
  provides: [height-capped-canvas, draw-mode-instructions]
  affects: [template-builder]
tech_stack:
  added: []
  patterns: [responsive-canvas-scaling, instructional-overlay]
key_files:
  created: []
  modified:
    - src/renderer/src/components/templates/ZoneEditor.tsx
decisions:
  - Canvas height capped at 500px using Math.min(scaleByWidth, scaleByHeight)
  - Instructional overlay shown when canvas empty and draw mode off
  - Hint text displayed below toolbar for discoverability
metrics:
  duration_minutes: 3.3
  completed: 2026-03-11
  tasks: 2
  files: 1
  commits: 2
---

# Phase 02 Plan 14: Fix ZoneEditor Canvas Height and Draw Mode Discoverability Summary

**One-liner:** Canvas height capped at 500px with dual-constraint scaling, draw mode instruction overlay guides first-time users

## What Was Done

Fixed two critical UX issues in ZoneEditor: (1) Canvas too tall requiring excessive vertical scroll for Instagram story format, (2) Draw mode not discoverable - users didn't understand they must click "Draw Zone" first.

### Task 1: Cap canvas height and fix scale computation (Commit: 5150d9b)

- Added `MAX_DISPLAY_HEIGHT = 500` constant
- Fixed `ResizeObserver` to compute `constrainedScale = Math.min(scaleByWidth, scaleByHeight)`
- Updated initial `containerSize` state to use `MAX_DISPLAY_HEIGHT` instead of hardcoded 875
- Set container div explicit `width` and `height` inline styles from `containerSize` state
- Removed `max-w-[700px]` class since sizing is now controlled by state

**Impact:** Canvas no longer exceeds 500px height regardless of format (feed/story). Story format (1920px tall) now scales down correctly to fit.

### Task 2: Draw mode discoverability - instructional overlay (Commit: 932623e)

- Added instructional overlay on canvas when `zones.length === 0 && !drawMode`
  - Semi-transparent black overlay (`rgba(0,0,0,0.4)`)
  - Centered text: "Click 'Draw Zone' above, then drag to define text zones on the canvas"
  - Uses `#94a3b8` (slate-400) for readable overlay text
- Added hint text below toolbar when `zones.length === 0`
  - Small text: "Click 'Draw Zone' then drag on the canvas to define text areas"

**Impact:** First-time users immediately understand the workflow. Draw Zone button purpose is obvious.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

Build completed successfully. TypeScript compiles without errors.

Manual verification steps (from plan):
- Start dev app
- Open Template Builder
- Verify canvas displays without vertical scroll (~500px tall or less)
- When no zones exist: overlay text instructs user to click "Draw Zone"
- Click "Draw Zone" button - activates, cursor becomes crosshair
- Drag on canvas - zone rectangle appears and persists after mouseup
- Canvas scales correctly for both feed and story format

## Files Changed

**Modified:**
- `src/renderer/src/components/templates/ZoneEditor.tsx` - Canvas height cap, scale computation, instructional overlay

## Commits

| Hash    | Message                                                      |
| ------- | ------------------------------------------------------------ |
| 5150d9b | fix(02-14): cap canvas height with constrained scale computation |
| 932623e | feat(02-14): add draw mode discoverability to ZoneEditor     |

## Next Steps

Continue to plan 02-15 (final plan in phase).

## Self-Check

**Result: PASSED**

- ✓ FOUND: src/renderer/src/components/templates/ZoneEditor.tsx
- ✓ FOUND: commit 5150d9b
- ✓ FOUND: commit 932623e
