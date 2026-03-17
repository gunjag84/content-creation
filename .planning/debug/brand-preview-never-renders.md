---
status: diagnosed
trigger: "Investigate why the brand preview in the Brand Guidance settings tab never renders - it stays permanently stuck at 'Preview will appear here' with no errors."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - BrandPreview.tsx calls dataUrlToBlob() on a JSON string, not a data URL. The renderToPNG IPC returns JSON.stringify({filePath, dataUrl}) but the component treats the entire JSON string as a raw data URL. The split/atob call throws silently, leaving previewBlobUrl null forever.
test: Traced the full data flow: render-service.ts line 88 -> BrandPreview.tsx line 76-79
expecting: N/A - root cause confirmed
next_action: Fix BrandPreview.tsx to JSON.parse the response and extract the dataUrl field

## Symptoms

expected: Brand preview panel renders a live PNG of the brand layout when the settings tab is opened or any setting is changed
actual: Panel permanently shows "Preview will appear here" regardless of settings changes
errors: No user-visible errors. console.error('Preview render failed:', error) fires internally but is swallowed
reproduction: Open app -> go to Brand Guidance settings tab
started: Since the blob URL fix was introduced (the fix converted direct data URL usage to blob URLs but introduced a new parsing bug)

## Eliminated

- hypothesis: useEffect never fires on mount
  evidence: React useEffect with dependency array runs on mount AND when deps change. It fires on first render with the default visualGuidance values.
  timestamp: 2026-03-11

- hypothesis: IPC handler not registered / renderService not initialized
  evidence: main/index.ts lines 72-78 show renderService is initialized and registerRenderingIPC is called. The IPC call succeeds - the failure is in the renderer-side response handling.
  timestamp: 2026-03-11

- hypothesis: visualGuidance prop is null/undefined when passed to BrandPreview
  evidence: BrandGuidanceSection.tsx line 13-21 provides a full default object with all required color/size fields. BrandPreview always receives a valid object.
  timestamp: 2026-03-11

## Evidence

- timestamp: 2026-03-11
  checked: src/main/services/render-service.ts line 88
  found: renderToPNG returns JSON.stringify({ filePath, dataUrl: `data:image/png;base64,${base64}` })
  implication: The return value is a JSON string, NOT a raw data URL string

- timestamp: 2026-03-11
  checked: src/renderer/src/components/settings/BrandPreview.tsx lines 76-79
  found: const dataUrl = await window.api.renderToPNG(...) then dataUrlToBlob(dataUrl) - no JSON.parse
  implication: dataUrlToBlob receives the full JSON string e.g. '{"filePath":"/tmp/render_123.png","dataUrl":"data:image/png;base64,iVBOR..."}'

- timestamp: 2026-03-11
  checked: BrandPreview.tsx dataUrlToBlob function lines 60-68
  found: parts = dataUrl.split(',') splits at FIRST comma in JSON (after the filePath value), not at the base64 separator. parts[1] = '"dataUrl":"data:image/png;base64' which is not valid base64. atob() throws InvalidCharacterError.
  implication: The thrown exception is caught at line 88-90 with console.error only. previewBlobUrl stays null. UI permanently shows "Preview will appear here".

- timestamp: 2026-03-11
  checked: src/renderer/src/components/settings/BrandPreview.tsx lines 86-93
  found: catch block only does console.error('Preview render failed:', error) then setIsRendering(false). No user-visible error state, no retry.
  implication: The failure is completely silent to the user.

- timestamp: 2026-03-11
  checked: src/main/index.ts lines 68-78
  found: createWindow() is called BEFORE renderService.initialize() completes. If user navigates to Brand Guidance tab very quickly, the IPC handler may not be registered yet.
  implication: Secondary race condition - though the primary bug (JSON parsing) would fail regardless of timing.

## Resolution

root_cause: |
  TWO bugs stacked:

  BUG 1 (primary, always fails):
  render-service.ts returns JSON.stringify({filePath, dataUrl}) at line 88.
  BrandPreview.tsx receives this JSON string and passes it directly to dataUrlToBlob()
  without parsing it first. dataUrlToBlob does split(',') which splits at the wrong comma
  in the JSON structure. The resulting parts[1] is not valid base64, so atob() throws.
  The error is caught silently. previewBlobUrl stays null forever.
  Fix: In BrandPreview.tsx renderPreview(), parse the JSON response:
    const result = JSON.parse(await window.api.renderToPNG(...))
    const blob = dataUrlToBlob(result.dataUrl)

  BUG 2 (secondary, race condition):
  main/index.ts creates the window at line 69 THEN initializes renderService at lines 72-78.
  If the renderer loads quickly and the user opens Brand Guidance immediately, the
  'render:to-png' IPC handler may not be registered yet. This would throw "No handler
  registered for 'render:to-png'" which is also caught silently.
  Fix: Move registerRenderingIPC(renderService) before createWindow(), or handle
  the "not initialized" case gracefully in the renderer.

fix: |
  Primary fix in BrandPreview.tsx renderPreview():
    const rawResult = await window.api.renderToPNG(html, { width: 1080, height: 1350 })
    const parsed = JSON.parse(rawResult)
    const blob = dataUrlToBlob(parsed.dataUrl)

  Secondary fix in main/index.ts:
    Initialize renderService before createWindow() or register a stub handler first.

verification: not yet applied
files_changed: []
