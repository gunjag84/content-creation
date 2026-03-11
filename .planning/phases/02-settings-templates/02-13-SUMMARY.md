---
phase: 02-settings-templates
plan: 13
type: gap-closure
subsystem: ui-templates
tags: [uat-gap-closure, dark-theme, button-fix, template-builder]
requirements: [TPL-05]
dependencies:
  requires: []
  provides: [dark-themed-template-builder]
  affects: [button-component-global]
tech_stack:
  added: []
  patterns: [global-button-styling, dark-theme-consistency]
key_files:
  created: []
  modified:
    - src/renderer/src/components/templates/BackgroundSelector.tsx
    - src/renderer/src/components/templates/OverlayControls.tsx
    - src/renderer/src/components/ui/button.tsx
decisions:
  - decision: "Apply Button outline variant fix GLOBALLY (not just locally)"
    rationale: "Entire app uses dark theme - transparent background with visible text ensures consistency across all contexts"
    alternatives_considered: ["Local override in template components"]
    trade_offs: "Affects all outline buttons app-wide, but app is uniformly dark-themed"
  - decision: "Replace bg-white with bg-transparent/slate-600/slate-200"
    rationale: "White background made text invisible in dark context - transparent with explicit text color works in all dark contexts"
    impact: "All outline buttons now visible against dark backgrounds"
metrics:
  duration_minutes: 4.1
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_modified: 3
  commits: 2
---

# Phase 02 Plan 13: Fix Template Builder Dark Theme Summary

**One-liner:** Eliminated white cards and invisible button text in template builder by applying consistent dark slate theme (slate-800 cards, transparent outline buttons with slate-200 text)

## What Was Built

Applied comprehensive dark theme fixes to template builder components:

**BackgroundSelector.tsx:**
- Card wrapper: `bg-gray-50` → `bg-slate-800 border-slate-700`
- All labels and headings: slate-300/slate-200 text colors
- Color swatch borders: `border-gray-300` → `border-slate-600`
- Custom color input: styled with `bg-slate-700 border-slate-600 text-slate-100`
- Image thumbnail wrapper: `bg-gray-100` → `bg-slate-700`
- Helper text: `text-gray-500` → `text-slate-500`

**OverlayControls.tsx:**
- Card wrapper: `bg-gray-50` → `bg-slate-800 border-slate-700`
- All labels and headings: slate-300/slate-200 text colors
- Color swatch border: `border-gray-300` → `border-slate-600`
- Hex input: styled with `bg-slate-700 border-slate-600 text-slate-100`
- Color picker popover: `bg-white border-gray-200` → `bg-slate-800 border-slate-600`
- Opacity value span: `text-gray-600` → `text-slate-300`

**button.tsx (GLOBAL fix per user decision):**
- Outline variant: `bg-white` → `bg-transparent`
- Border: `border-slate-200` → `border-slate-600`
- Text: added explicit `text-slate-200` (previously inherited)
- Hover: `hover:bg-slate-100` → `hover:bg-slate-700 hover:text-slate-100`
- Ring offset: `ring-offset-white` → `ring-offset-slate-900` (focus rings)

## Deviations from Plan

None - plan executed exactly as written. User decision to apply button fix globally was communicated upfront and incorporated.

## Testing Notes

**Verification performed:**
- TypeScript compilation passed (via `npm run build`)
- All modified files built successfully
- No type errors introduced

**Manual testing required (per plan):**
- Start dev app, navigate to Template Builder
- Verify Background card has dark slate-800 background
- Verify Overlay Settings card has dark slate-800 background
- Check Image/Solid Color/Gradient toggle buttons have visible text and borders
- Verify Cancel Drawing and other outline buttons have readable text
- Confirm no white cards visible in template builder

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Dark theme BackgroundSelector and OverlayControls | `60668c5` | BackgroundSelector.tsx, OverlayControls.tsx |
| 2 | Fix Button outline variant for dark context (global) | `7c31e93` | button.tsx |

## Impact Assessment

**Template Builder UX:**
- Consistent dark theme eliminates jarring white cards
- All text now readable against dark backgrounds
- Format toggle buttons (Image/Solid Color/Gradient, Feed/Story) have visible borders and text

**Global Button Component:**
- All outline buttons app-wide now work in dark context
- Transparent background prevents white-on-white rendering
- Explicit text color ensures visibility
- Safe change: entire app is dark-themed

**Risk:** Low. The app is uniformly dark-themed, so global button change has no light-context edge cases.

## Follow-up Items

None identified.

## Self-Check: PASSED

**Files created/modified:**
- FOUND: src/renderer/src/components/templates/BackgroundSelector.tsx
- FOUND: src/renderer/src/components/templates/OverlayControls.tsx
- FOUND: src/renderer/src/components/ui/button.tsx

**Commits:**
- FOUND: 60668c5
- FOUND: 7c31e93

All artifacts verified.
