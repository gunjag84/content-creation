# QA Report: Content Creation System

**Date:** 2026-03-17
**Target:** Electron + React app (localhost:5173 renderer)
**Mode:** Code Review QA (gstack unavailable on Windows)
**Tier:** Quick (fix critical + high only)
**Branch:** master
**Duration:** ~15 minutes (5 QA agents + 7 fix agents, parallelized)
**Commits:** 19 atomic fix commits (d48a2c4..a642194)
**Build:** Verified passing (electron-vite build)

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| Critical | 3 | 3 | 0 |
| High | 16 | 16 | 0 |
| Medium | 24 | 0 | 24 |
| Low | 16 | 0 | 16 |
| **Total** | **59** | **19** | **40** |

## Health Score (Baseline)

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 70 | 15% | 10.5 |
| Links | 100 | 10% | 10.0 |
| Visual | 100 | 10% | 10.0 |
| Functional | 0 | 20% | 0.0 |
| UX | 55 | 15% | 8.3 |
| Performance | 76 | 10% | 7.6 |
| Content | 100 | 5% | 5.0 |
| Accessibility | 100 | 15% | 15.0 |
| **Total** | | | **66.4** |

---

## Critical Issues

### ISSUE-001: Arbitrary file read via `file:read-as-data-url`
- **File:** src/main/ipc/fonts.ts:121-126
- **Category:** Security
- **Description:** IPC handler accepts any file path and returns base64 content. No path validation or allowlist. A compromised renderer could read SSH keys, .env files, etc.

### ISSUE-002: `webSecurity: false` on render BrowserWindow
- **File:** src/main/services/render-service.ts:26
- **Category:** Security
- **Description:** Hidden render window has same-origin policy disabled. Combined with ISSUE-001, malicious HTML from LLM could exfiltrate data.

### ISSUE-003: Race condition in `handleNewDraft` - reset() clears store before generation reads it
- **File:** src/renderer/src/components/wizard/Step2Generation.tsx:135-141
- **Category:** Functional
- **Description:** `reset()` clears selectedPillar/Theme/Mechanic to empty strings, then `startGeneration()` reads them from stale closure. New draft generates with empty parameters.

---

## High Issues

### ISSUE-004: No React error boundary - any render crash kills the app
- **File:** src/renderer/src/App.tsx
- **Category:** Functional
- **Description:** No error boundary wraps pages. An unhandled render error white-screens the Electron app with no recovery path.

### ISSUE-005: Missing .catch() on getAppInfo/getDbStatus
- **File:** src/renderer/src/pages/Dashboard.tsx:17-18
- **Category:** Functional
- **Description:** IPC failures leave component stuck on "Loading..." with no error feedback.

### ISSUE-006: Event listener leak on unmount during generation
- **File:** src/renderer/src/components/wizard/Step2Generation.tsx:88-104
- **Category:** Performance
- **Description:** onToken/onComplete/onError listeners never cleaned up if user exits mid-generation.

### ISSUE-007: activeSlideIndex can go to -1 after drag reorder
- **File:** src/renderer/src/components/wizard/Step3EditText.tsx:107-111
- **Category:** Functional
- **Description:** Specific drag patterns cause `activeSlideIndex - 1 = -1`, accessing `generatedSlides[-1]` = undefined.

### ISSUE-008: handleApprove sends empty pillar/theme/mechanic/impulse
- **File:** src/renderer/src/components/wizard/Step3EditText.tsx:175-179
- **Category:** Functional
- **Description:** Post created with hardcoded empty strings for all dimension fields. Balance engine gets no data.

### ISSUE-009: Opacity slider reads stale closure - PNG uses previous value
- **File:** src/renderer/src/components/wizard/Step4RenderReview.tsx:204-209
- **Category:** Functional
- **Description:** setSlide updates store but buildSlideHTML reads old closure. Visual update always one step behind.

### ISSUE-010: source_slide_index from LLM can be out of bounds
- **File:** src/renderer/src/components/wizard/Step5Stories.tsx:222
- **Category:** Functional
- **Description:** No validation that LLM-returned index is within generatedSlides array bounds.

### ISSUE-011: Path traversal in export:save-files
- **File:** src/main/ipc/export.ts:43-44
- **Category:** Security
- **Description:** file.name with `../` sequences can write files outside selected folder.

### ISSUE-012: posts:save-slides not transactional
- **File:** src/main/ipc/posts.ts:30-41
- **Category:** Functional
- **Description:** Slides inserted in loop without transaction. Failure mid-loop = partial carousel in DB.

### ISSUE-013: posts:update-balance not transactional
- **File:** src/main/ipc/posts.ts:110-126
- **Category:** Functional
- **Description:** Multiple updateBalanceMatrix calls without transaction wrapper.

### ISSUE-014: Concurrent generation streams interleave tokens
- **File:** src/main/ipc/generation.ts:43-48
- **Category:** Functional
- **Description:** All streams use same `generate:token` channel with no stream ID. Concurrent generations produce garbled output.

### ISSUE-015: generate:content throws when window not focused
- **File:** src/main/ipc/generation.ts:20-23
- **Category:** Functional
- **Description:** `BrowserWindow.getFocusedWindow()` returns null when user alt-tabs. Generation fails with unhandled error instead of using event.sender.

### ISSUE-016: Double duplicate-name prompt in templates
- **File:** src/renderer/src/components/templates/TemplateCard.tsx:24-31
- **Category:** UX
- **Description:** TemplateCard prompts for name, discards it, then TemplateSection prompts again. User sees two dialogs.

### ISSUE-017: Image background button does nothing or sets color as image path
- **File:** src/renderer/src/components/templates/BackgroundSelector.tsx:64-70
- **Category:** Functional
- **Description:** Clicking "Image" type sets the current color hex as the image path instead of opening upload dialog.

### ISSUE-018: Gradient direction lost in ZoneEditor preview
- **File:** src/renderer/src/components/templates/ZoneEditor.tsx:429-442
- **Category:** Functional
- **Description:** Gradient value stores 3 parts (color1, color2, direction) but ZoneEditor only reads first 2.

### ISSUE-019: useAutoSave infinite loop risk with unstable onSave reference
- **File:** src/renderer/src/hooks/useAutoSave.ts:67
- **Category:** Performance
- **Description:** Inline arrow function as onSave creates new ref every render, re-triggering the effect.

---

## Medium Issues

### ISSUE-020: Hardcoded brandId=1 in BalanceWidget
### ISSUE-021: BalanceWidget sorts arrays in-place (mutates state)
### ISSUE-022: Missing startGeneration in useEffect deps (Step2)
### ISSUE-023: retrying state reset before stream completes (Step2)
### ISSUE-024: No error feedback on handleApprove failure (Step3)
### ISSUE-025: No double-click guard on Approve & Render button (Step3)
### ISSUE-026: caption can be undefined causing .length crash (Step3)
### ISSUE-027: Event listener leak in Step5Stories on unmount
### ISSUE-028: Auto-render can fire twice on settings change (Step4)
### ISSUE-029: Temp PNG files never cleaned up (render-service)
### ISSUE-030: Concurrent renders share single BrowserWindow (render-service)
### ISSUE-031: Unescaped HTML in slide text (XSS in render window)
### ISSUE-032: Stale local state in LogoPlacement when props change
### ISSUE-033: Debounce timers not cleaned up on unmount (LogoPlacement)
### ISSUE-034: Non-null assertion on parentElement (TemplateCard)
### ISSUE-035: Missing .catch() on loadAPIKey (APIKeySection)
### ISSUE-036: Double-save on tonality field (BrandVoiceSection)
### ISSUE-037: handleBlur removes items during typing (EditableList)
### ISSUE-038: DB init failure swallowed, app continues broken
### ISSUE-039: Settings IPC handlers have no error handling
### ISSUE-040: Template IPC handlers have no error handling
### ISSUE-041: Security IPC handlers have no error handling
### ISSUE-042: before-quit async handler may not complete
### ISSUE-043: No database migration strategy for schema changes

---

## Low Issues (deferred)

ISSUE-044 through ISSUE-059: Non-null assertion on root, unmount race conditions, SVG MIME type, redundant setStep calls, dialog state persistence, format change warnings, type mismatches, etc. See agent transcripts for details.
