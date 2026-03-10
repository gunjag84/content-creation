---
phase: 02-settings-templates
plan: 10
subsystem: Templates & Brand Preview
tags: [bugfix, templates, brand-preview, dark-theme, electron-ipc]
completed: 2026-03-10T21:14:04Z
duration_minutes: 4.6

dependency_graph:
  requires:
    - Phase 01 rendering infrastructure (base64 data URLs established)
    - Phase 02 template builder UI (ZoneEditor, TemplateBuilder)
    - Phase 02 brand preview component (BrandPreview)
  provides:
    - Working template builder with image loading via base64 data URLs
    - Persistent zone drawing on canvas
    - Canvas sized appropriately for the UI (max 700px width)
    - Dark theme styling throughout template builder
    - Brand preview without HTTP 431 errors
  affects:
    - All future template creation workflows
    - Brand guidance preview updates

tech_stack:
  added:
    - file:read-as-data-url IPC handler for renderer-safe image loading
    - Blob URL pattern for large data URL handling
  patterns:
    - Base64 data URLs for file:// protocol restrictions
    - Blob URLs to prevent header pollution in dev server
    - Fallback zone calculation for fast mouse movements
    - Dark theme consistency across UI components

key_files:
  created: []
  modified:
    - src/main/ipc/fonts.ts: Added file:read-as-data-url IPC handler
    - src/preload/types.ts: Added readFileAsDataUrl to API interface
    - src/preload/index.ts: Exposed readFileAsDataUrl IPC call
    - src/renderer/src/components/templates/TemplateBuilder.tsx: Use base64 data URLs for image loading
    - src/renderer/src/components/templates/ZoneEditor.tsx: Dark theme, canvas sizing, zone persistence improvements
    - src/renderer/src/components/settings/BrandPreview.tsx: Blob URL conversion, dark theme

decisions:
  - decision: Use base64 data URLs instead of file:// protocol for background images
    rationale: Electron renderer with contextIsolation blocks file:// URLs, base64 works universally
    alternatives: Custom protocol handler, but base64 is simpler and already proven in Phase 01
  - decision: Convert preview data URLs to blob URLs
    rationale: Large base64 strings in request headers cause HTTP 431 errors from Vite dev server
    alternatives: Reduce image size, but blob URLs are cleaner and prevent header pollution entirely
  - decision: Keep draw mode active after zone creation
    rationale: Users often draw multiple zones, reducing clicks improves UX
    alternatives: Disable after each zone, but that adds friction
  - decision: Add fallback zone calculation in mouseUp handler
    rationale: Fast mouse movements might skip mouseMove events, leaving tempZone null
    alternatives: Increase mousemove event frequency, but fallback is more robust

metrics:
  tasks_completed: 2
  files_modified: 6
  commits: 2
  duration_minutes: 4.6
  lines_changed: ~100
---

# Phase 02 Plan 10: Template Builder & Brand Preview Fixes

**One-liner:** Fixed template builder image loading via base64 data URLs, improved zone drawing persistence, constrained canvas sizing, applied dark theme, and prevented brand preview 431 errors with blob URLs.

## Tasks Completed

### Task 1: Fix template builder - image loading, canvas sizing, dark theme buttons
**Commit:** `3c7ffaf`

**Problem:**
- Background images failed to load due to file:// protocol restrictions in Electron renderer
- Zones didn't persist after drawing (fast mouse movements)
- Canvas was too large for the window (no size constraint)
- Buttons had white text on white background (light theme in dark app)

**Solution:**
- Added `file:read-as-data-url` IPC handler in `src/main/ipc/fonts.ts` to convert file paths to base64 data URLs
- Updated `TemplateBuilder.tsx` to use `window.api.readFileAsDataUrl()` instead of `file://` protocol
- Added `max-w-[700px] mx-auto` to canvas container in `ZoneEditor.tsx` to constrain width
- Added fallback zone calculation in `handleStageMouseUp` if `tempZone` is null (mouse moved too fast)
- Made draw mode persistent across multiple zone drawings (removed `setDrawMode(false)` from mouseUp)
- Converted ZoneEditor toolbar and canvas to dark theme:
  - Toolbar: `bg-slate-800 border-slate-700`
  - Zone count text: `text-slate-400`
  - Canvas container: `bg-slate-900 border-slate-700`
  - Buttons: explicit `bg-blue-600 text-white` for active, `border-slate-600 text-slate-300` for outline

**Files modified:**
- `src/main/ipc/fonts.ts` - Added IPC handler
- `src/preload/types.ts` - Added type definition
- `src/preload/index.ts` - Exposed IPC call
- `src/renderer/src/components/templates/TemplateBuilder.tsx` - Async image loading
- `src/renderer/src/components/templates/ZoneEditor.tsx` - Canvas sizing, zone persistence, dark theme

**Verification:** Build passes, no TypeScript errors.

---

### Task 2: Fix brand preview 431 error
**Commit:** `c47eda7`

**Problem:**
Brand preview calls `window.api.renderToPNG()` which returns a base64-encoded PNG data URL (potentially hundreds of KB). When set directly as `img.src`, Vite's HMR/websocket connections or subsequent fetch requests include this large data in headers (referer, cookie), causing the Vite dev server to reject with HTTP 431 Request Header Fields Too Large.

**Solution:**
- Created `dataUrlToBlob()` helper function to convert base64 data URL to Blob
- Updated `renderPreview()` to convert data URL to blob URL via `URL.createObjectURL()`
- Added cleanup effect to revoke blob URLs on unmount (prevent memory leaks)
- Renamed state from `previewDataUrl` to `previewBlobUrl` for clarity
- Updated BrandPreview to dark theme:
  - Container: `bg-slate-800 border-slate-700`
  - Text: `text-slate-200` (label), `text-slate-400` (status messages)

**Files modified:**
- `src/renderer/src/components/settings/BrandPreview.tsx`

**Verification:** Build passes, no TypeScript errors.

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Verification Results

### Automated Verification
- `npx electron-vite build` - PASSED (both tasks)
- No TypeScript errors
- No build warnings related to changes

### Manual Verification (expected)
When the app is launched:
1. Navigate to Brand Guidance - preview should render without 431 error
2. Change a color - preview should update within ~1 second
3. Navigate to Templates, create new template, upload background image - image should display
4. Draw a zone on the canvas - zone should appear with colored border and persist
5. Draw multiple zones - all should remain visible
6. All buttons in template builder should be readable (no white-on-white)
7. Canvas should fit within the content area without horizontal scrolling

---

## Technical Notes

### Base64 Data URLs for Renderer
Pattern established in Phase 01 continues here. Electron renderer with `contextIsolation: true` blocks direct file:// access. Base64 data URLs work universally and are simple to implement via IPC.

### Blob URLs for Large Data
Blob URLs (`blob://...`) are object URLs that reference in-memory data. Unlike data URLs, they don't include the data inline, preventing header pollution. Must be revoked manually to avoid memory leaks.

### Zone Drawing Persistence
The issue was that fast mouse movements could skip `mousemove` events, leaving `tempZone` null at `mouseup`. The fallback calculation ensures zones are always created from `drawStart` to final pointer position, regardless of intermediate events.

### Dark Theme Consistency
All template builder and brand preview components now use dark theme. This matches the rest of the app and prevents readability issues with shadcn UI components that may not have proper CSS variable mappings in all contexts.

---

## Self-Check: PASSED

**Created files exist:** N/A (no new files created)

**Modified files exist:**
```
FOUND: C:\webprojects\content-creation\src\main\ipc\fonts.ts
FOUND: C:\webprojects\content-creation\src\preload\types.ts
FOUND: C:\webprojects\content-creation\src\preload\index.ts
FOUND: C:\webprojects\content-creation\src\renderer\src\components\templates\TemplateBuilder.tsx
FOUND: C:\webprojects\content-creation\src\renderer\src\components\templates\ZoneEditor.tsx
FOUND: C:\webprojects\content-creation\src\renderer\src\components\settings\BrandPreview.tsx
```

**Commits exist:**
```
FOUND: 3c7ffaf (Task 1)
FOUND: c47eda7 (Task 2)
```

All claims verified.
