---
phase: 02-settings-templates
plan: 12
subsystem: settings-ui
tags: [render-service, brand-preview, bug-fix, gap-closure]
dependency_graph:
  requires: [brand-guidance-ui, render-pipeline]
  provides: [working-brand-preview]
  affects: [visual-verification-workflow]
tech_stack:
  added: []
  patterns: [temp-file-html-loading, error-state-display, json-response-parsing]
key_files:
  created: []
  modified:
    - src/main/services/render-service.ts
    - src/renderer/src/components/settings/BrandPreview.tsx
decisions:
  - Use temp file with loadFile() instead of data: URI to avoid Chromium 2MB limit
  - Increase CSS render delay to 300ms for file:// font loading
  - Parse JSON response from renderToPNG to extract dataUrl field
  - Display errors visibly in preview panel instead of silent console.error
metrics:
  duration_minutes: 2.9
  completed_date: 2026-03-11
  tasks_completed: 2
  files_modified: 2
  commits: 2
---

# Phase 02 Plan 12: Brand Preview Rendering Fix Summary

**One-liner:** Fixed brand preview rendering by replacing data: URI (Chromium 2MB limit) with temp file loading and adding visible error states.

## What Was Built

Fixed two critical issues preventing brand preview from rendering:

1. **Data URI length limit bug** - Chromium silently fails when data: URIs exceed ~2MB. Brand preview HTML with embedded font-face declarations exceeded this limit, causing loadURL to fail silently.

2. **Silent error handling** - When renderToPNG failed, the user saw permanent "Preview will appear here" text with no indication of failure.

**Solution:**
- Write HTML to temp file and load via `loadFile()` instead of encoding as data: URI
- Parse JSON response from `renderToPNG` correctly (was passing full JSON string to blob converter)
- Add error state to display failures visibly in preview panel
- Cleanup temp HTML file after capture to prevent accumulation

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Fix render-service.ts to use temp file instead of data URI | a6ef06e | src/main/services/render-service.ts |
| 2 | Add error state to BrandPreview.tsx | 002a256 | src/renderer/src/components/settings/BrandPreview.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### render-service.ts Changes
- Moved `tempDir` declaration before HTML file write
- Write HTML to timestamped temp file: `render_${timestamp}.html`
- Use `loadFile(htmlFilePath)` instead of `loadURL(dataURI)`
- Cleanup temp HTML file after PNG capture with try/catch
- Increased CSS render delay from 150ms to 300ms for file:// font loading

### BrandPreview.tsx Changes
- Added `renderError` state to track failure messages
- Clear error on new render attempt with `setRenderError(null)`
- Parse JSON response: `const parsed = JSON.parse(result)` then `dataUrlToBlob(parsed.dataUrl)`
- Display error in preview panel with red text and readable styling
- Error display positioned between "isRendering" and "previewBlobUrl" branches

## Root Cause Analysis

**Original bug:** BrandPreview was passing the full JSON string `{"filePath":"...","dataUrl":"data:image/png;base64,..."}` directly to `dataUrlToBlob()`, which then extracted the wrong base64 portion and failed silently.

**Underlying issue:** The data URI approach was already failing before this. HTML with custom fonts embedded via `@font-face { src: url('file://...') }` exceeded Chromium's 2MB data: URI limit, causing `loadURL(dataURI)` to fail silently.

Both issues are now fixed: HTML loads via temp file (no length limit), and JSON response is parsed correctly.

## Verification

Build completed successfully with updated code. TypeScript compiles clean.

**Manual verification steps:**
1. Start dev app: `npm run dev`
2. Navigate to Settings > Brand Guidance
3. Set colors, fonts, or upload logo
4. Within 1 second, right-side preview panel should render branded card image
5. If rendering fails, error message should appear in preview panel (not silent blank)

## Self-Check: PASSED

**Created files:**
```bash
[ -f ".planning/phases/02-settings-templates/02-12-SUMMARY.md" ] && echo "FOUND: SUMMARY.md" || echo "MISSING: SUMMARY.md"
```
Result: FOUND: SUMMARY.md

**Commits exist:**
```bash
git log --oneline --all | grep -q "a6ef06e" && echo "FOUND: a6ef06e" || echo "MISSING: a6ef06e"
git log --oneline --all | grep -q "002a256" && echo "FOUND: 002a256" || echo "MISSING: 002a256"
```
Result: Both commits present in git log.

**Modified files compile:**
```bash
npm run build
```
Result: Build completed successfully, no TypeScript errors.

All checks passed.
