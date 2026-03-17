---
status: diagnosed
phase: 03-content-generation
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md, 03-07-SUMMARY.md
started: 2026-03-17T11:40:00Z
updated: 2026-03-17T12:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill and restart the Electron app. App launches without errors, sidebar shows navigation, Dashboard loads as default view.
result: pass

### 2. Wizard Launch - Step 1 Recommendation
expected: Click "Create" in sidebar. Wizard opens with Step 1 showing recommendation card (pillar/theme/mechanic from balance engine or "cold start" message). StepIndicator shows 5 steps with Step 1 highlighted.
result: pass

### 3. Step 1 - Override Dropdowns
expected: Override dropdowns for pillar, theme, mechanic are populated from settings.
result: pass

### 4. Step 1 - Warning Badges
expected: If any dimension used >3 times in 14 days, amber warning badge on dropdown with tooltip.
result: skipped
reason: No dimension has enough usage data to trigger warnings yet

### 5. Step 1 - Controls
expected: Mode toggle (AI/Manual), content type selector (Single/Carousel), impulse textarea, custom background upload, CTA button text changes per mode.
result: pass

### 6. Step 2 - AI Generation Streaming
expected: Step 2 shows streaming text word-by-word, collapsible "View prompt", auto-scroll, "Continue to Edit" after completion.
result: issue
reported: "'Content ready' message shows from the very beginning instead of only after generation completes"
severity: minor

### 7. Step 2 - Manual Mode Skip
expected: Manual mode skips Step 2, auto-creates empty slides, lands on Step 3.
result: issue
reported: "Works but shows empty edit screen briefly before slides render. Needs loading indicator."
severity: minor

### 8. Step 3 - Two-Panel Editor Layout
expected: 40% editor left, 60% preview right. Thumbnail strip with type labels. Slides/Caption tabs.
result: pass

### 9. Step 3 - Slide Editing
expected: Click thumbnail to select slide. SlideEditor shows hook/body/CTA textareas. Caption tab shows textarea with character counter.
result: pass

### 10. Step 3 - Drag-and-Drop Reorder
expected: Drag thumbnail by grip handle to reorder. Order updates visually and in state.
result: issue
reported: "Reorder fails, slide snaps back into original position"
severity: major

### 11. Step 3 - Alternative Hooks
expected: Click "Alternative Hooks", inline overlay with 3 options, clicking one replaces hook text.
result: issue
reported: "Hangs with 'Generating options' notification, never completes"
severity: major

### 12. Step 3 - Approve and Persist
expected: Click "Approve & Render". Post and slides saved to DB, advances to Step 4.
result: pass

### 13. Step 4 - Render and Preview
expected: "Render & Preview" button triggers sequential rendering with progress bar. Thumbnails appear incrementally at 1080x1350.
result: issue
reported: "Unnecessary button step before preview. Custom background image from Step 1 not applied in render."
severity: major

### 14. Step 4 - Overlay Opacity Control
expected: Per-slide opacity slider (0-100), debounced re-render. Last CTA slide uses standardCTA from settings.
result: issue
reported: "Opacity slider works. CTA text present but barely visible, needs click/zoom modal to read."
severity: cosmetic

### 15. Step 4 - Export Flow
expected: Export button opens native folder picker. PNGs + caption.txt saved with date_themeSlug naming. Post status updated, balance matrix updated.
result: pass

### 16. Step 5 - Story Generation and Cards
expected: Auto-generates stories on mount. 2-4 cards with type/timing/tool badges and rationale.
result: pass

### 17. Step 5 - Story Approve/Edit/Export + Wizard Exit
expected: Approve/Reject/Edit controls, green border on approved, inline edit form, story render at 1080x1920, export, "Create Another Post" resets wizard. Exit button returns to Dashboard.
result: pass

## Summary

total: 17
passed: 10
issues: 6
pending: 0
skipped: 1

## Gaps

- truth: "'Content ready' should only appear after generation completes"
  status: failed
  reason: "User reported: 'Content ready' message shows from the very beginning instead of only after generation completes"
  severity: minor
  test: 6
  root_cause: "Step2Generation.tsx:159-165 - Header ternary falls through to 'Content Ready!' on mount because isGenerating starts false and generationError is null. First render happens before useEffect fires startGeneration()."
  artifacts:
    - path: "src/renderer/src/components/wizard/Step2Generation.tsx"
      issue: "Header ternary missing guard for pre-generation state"
  missing:
    - "Add displayText check: only show 'Content Ready!' when displayText has content, otherwise show 'Preparing...'"
  debug_session: ".planning/debug/step2-ux-issues.md"

- truth: "Manual mode should show loading state while creating empty slides"
  status: failed
  reason: "User reported: Works but shows empty edit screen briefly before slides render. Needs loading indicator."
  severity: minor
  test: 7
  root_cause: "Step2Generation.tsx:148-150 - Manual mode returns null (empty render). The useEffect at lines 34-54 calls setStep(3) after mount, causing one blank frame."
  artifacts:
    - path: "src/renderer/src/components/wizard/Step2Generation.tsx"
      issue: "Manual mode returns null instead of loading spinner"
  missing:
    - "Replace return null with centered Loader2 spinner from lucide-react"
  debug_session: ".planning/debug/step2-ux-issues.md"

- truth: "Drag-and-drop reorder should persist new slide order"
  status: failed
  reason: "User reported: Reorder fails, slide snaps back into original position"
  severity: major
  test: 10
  root_cause: "Step3EditText.tsx lines 40, 237, 243 - dnd-kit IDs are index-based (slide-${index}), not stable. SortableContext items regenerate identical array after reorder. React key={idx} prevents DOM tracking. Slide type has no stable UID."
  artifacts:
    - path: "src/renderer/src/components/wizard/Step3EditText.tsx"
      issue: "Index-based IDs for useSortable, SortableContext items, and React keys"
    - path: "src/shared/types/generation.ts"
      issue: "Slide type lacks stable uid field"
  missing:
    - "Add uid: string to Slide type, assign via crypto.randomUUID() at generation time"
    - "Use slide.uid for useSortable id, SortableContext items, and React key"
    - "Use findIndex by uid in handleDragEnd instead of parsing index from ID string"
  debug_session: ".planning/debug/dnd-slide-reorder-snapback.md"

- truth: "Alternative hooks should generate and display 3 options"
  status: failed
  reason: "User reported: Hangs with 'Generating options' notification, never completes"
  severity: major
  test: 11
  root_cause: "Two bugs: (1) Step3EditText.tsx:139 sends prompt:'' to streamHooks - backend has no assembly, forwards empty string to Claude API causing error. (2) Step3EditText.tsx:122-145 has no onError listener, so when API fails the UI stays stuck with isLoadingHooks=true forever."
  artifacts:
    - path: "src/renderer/src/components/wizard/Step3EditText.tsx"
      issue: "Empty prompt sent, no onError listener registered"
    - path: "src/main/ipc/generation.ts"
      issue: "generate:hooks handler has no prompt assembly logic"
  missing:
    - "Build real hooks prompt from currentHook + slideContext before calling streamHooks"
    - "Add onError listener that resets isLoadingHooks and closes overlay"
  debug_session: ".planning/debug/step3-hooks-hang.md"

- truth: "Render should apply custom background from Step 1 and not require extra button click"
  status: failed
  reason: "User reported: Unnecessary button step before preview. Custom background image from Step 1 not applied in render."
  severity: major
  test: 13
  root_cause: "render-service.ts:86-87 - Fixed 300ms delay after did-finish-load is a race condition. Background images loaded via file:// CSS may take longer, so capturePage() fires before image is painted. Secondary: 50% black overlay defaults obscure background. UX: manual Render button unnecessary since all data is available on mount."
  artifacts:
    - path: "src/main/services/render-service.ts"
      issue: "Fixed 300ms delay races against background image loading"
    - path: "src/renderer/src/components/wizard/Step4RenderReview.tsx"
      issue: "Manual render button instead of auto-start; 50% overlay default obscures background"
  missing:
    - "Replace setTimeout with JS injection that waits for CSS background images to load before capturePage()"
    - "Auto-trigger render via useEffect when slides/template/settings are ready"
  debug_session: ".planning/debug/custom-bg-not-applied.md"

- truth: "CTA text on last slide should be clearly readable without zoom"
  status: failed
  reason: "User reported: CTA text present but barely visible, needs click/zoom modal to read."
  severity: cosmetic
  test: 14
  root_cause: "Step4RenderReview.tsx:136-141,378-403 - CTA font is 32-34px at 1080px canvas, scales to ~10px in 3-column thumbnail grid (0.3x). No click-to-zoom/modal exists on preview thumbnails."
  artifacts:
    - path: "src/renderer/src/components/wizard/Step4RenderReview.tsx"
      issue: "No zoom/modal on thumbnail click; CTA font too small at preview scale"
  missing:
    - "Add click-to-zoom modal showing full-resolution PNG"
    - "Optionally bump CTA fallback font from 34px to 44-48px"
  debug_session: ".planning/debug/cta-text-barely-visible.md"
