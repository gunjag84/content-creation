---
status: diagnosed
trigger: "custom background image uploaded in Step 1 not applied in Step 4 render"
created: 2026-03-17T00:00:00Z
updated: 2026-03-17T00:00:00Z
---

## Current Focus

hypothesis: The background IS being read and injected into HTML correctly - the data flow is intact
test: Traced full path from upload through store to buildSlideHTML
expecting: Find a break in the chain
next_action: Report findings - the background path flow is actually correct

## Symptoms

expected: Custom background uploaded in Step 1 should appear in rendered slides in Step 4
actual: Background not applied when rendering
errors: none reported
reproduction: Upload custom background in Step 1, proceed to Step 4, render
started: unknown

## Eliminated

- hypothesis: customBackgroundPath not stored in zustand store
  evidence: Step1 calls setSelection('customBackgroundPath', path) at line 65, store accepts it via generic setSelection handler at line 106-112
  timestamp: 2026-03-17

- hypothesis: Step 4 buildSlideHTML doesn't read customBackgroundPath
  evidence: Step4 destructures customBackgroundPath from store at line 23 and uses it at line 98-100 in buildSlideHTML
  timestamp: 2026-03-17

- hypothesis: Background not injected into HTML template
  evidence: Lines 96-109 of Step4 show clear priority chain: customBackgroundPath > template > settings fallback. When customBackgroundPath is truthy, it generates file:/// URL CSS
  timestamp: 2026-03-17

## Evidence

- timestamp: 2026-03-17
  checked: IPC handler for templates:upload-background (src/main/ipc/fonts.ts:93-118)
  found: Handler copies file to userData/templates/images/ and returns the absolute destPath string
  implication: Store receives a filesystem path like "C:/Users/.../templates/images/photo.jpg"

- timestamp: 2026-03-17
  checked: buildSlideHTML background CSS generation (Step4RenderReview.tsx:96-109)
  found: Line 98-100 checks customBackgroundPath, replaces backslashes, creates file:/// URL
  implication: CSS should be valid - generates background-image: url('file:///C:/Users/.../photo.jpg')

- timestamp: 2026-03-17
  checked: renderToPNG call context
  found: Rendering happens in an offscreen BrowserWindow via window.api.renderToPNG. The file:/// URL must be accessible from that context.
  implication: The file:/// URL SHOULD work in Electron's offscreen renderer since it has file access

- timestamp: 2026-03-17
  checked: Rendering is NOT automatic - requires manual button click
  found: Step4 line 321-339 shows "Render & Preview" button only appears when !hasRendered. User must click it to trigger handleRenderPreviews.
  implication: This is the "unnecessary button step" the user mentioned

## Resolution

root_cause: |
  The data flow from Step 1 -> store -> Step 4 buildSlideHTML is CORRECT.
  customBackgroundPath is stored, read, and injected into the HTML as a file:/// URL properly.

  PRIMARY SUSPECT: Race condition in render-service.ts - the 300ms delay after did-finish-load
  may not be sufficient for CSS background-image to load from file:///. did-finish-load fires
  when DOM is ready, NOT when all CSS resources (like background images) are loaded.
  The capturePage() call may execute before the image is painted.

  SECONDARY: The 50% black overlay (overlay_opacity defaults to 0.5, overlay_enabled defaults to true)
  may obscure the background, making it appear absent when it's actually there but darkened.

  UX ISSUE: The "Render & Preview" button (Step4 line 321-339) requires a manual click. Rendering
  could auto-start when the step mounts since all data is already available.
fix: |
  1. render-service.ts:86-87 - Replace fixed 300ms delay with image-load-aware waiting:
     inject JS that waits for all images/backgrounds to load before resolving
  2. Step4RenderReview.tsx - auto-trigger handleRenderPreviews on mount via useEffect
verification:
files_changed: []
