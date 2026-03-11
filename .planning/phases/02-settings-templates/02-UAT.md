---
status: diagnosed
phase: 02-settings-templates
source: [02-07-SUMMARY.md, 02-08-SUMMARY.md, 02-09-SUMMARY.md, 02-10-SUMMARY.md]
started: 2026-03-11T00:00:00Z
updated: 2026-03-11T08:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running instance. Start the app from scratch with `npm run dev`. App boots without errors (no "better-sqlite3 compiled against wrong NODE_MODULE_VERSION" error, no Zod validation error for masterPrompt). Main window opens and Settings is accessible.
result: pass

### 2. Settings Navigation in Sidebar
expected: Settings sub-navigation is integrated into the main app sidebar (not a separate tab panel). Clicking "Settings" in the sidebar expands it inline to reveal 13 sub-items (Brand Voice, Target Persona, Content Pillars, etc.). Nav stays pinned to top - no vertical re-centering when switching items.
result: pass

### 3. Mechanics Toggles - Now Interactive
expected: Mechanics tab shows 7 cards each with an active/inactive toggle. Clicking a toggle actually switches it (not just a read-only display). The toggle state saves and persists when you navigate away and return.
result: pass
notes: "User requests full CRUD for Mechanics (also Story Tools and Themes) - logged as gap"

### 4. Story Tools Toggles - Now Interactive
expected: Story Tools tab shows 18 cards each with an active/inactive toggle. Clicking a toggle actually switches it. Toggle state saves and persists.
result: pass

### 5. Brand Guidance - Standard Fonts Dropdown
expected: Alongside the font upload slots, there is now a dropdown to select from ~20 standard system fonts (e.g., Arial, Georgia, Roboto, etc.). Selecting a font applies it as the active font choice without requiring a file upload.
result: issue
reported: "a) The entire card for brand colors is WHITE --> text not readable. b) Selector for standard font only available for CTA. Make it also available for Headline and body fonts. Remove the huge preview for the uploaded fonts. We have the preview window on the right which is sufficient for preview. This preview DOES NOT show a preview --> always: Preview will appear here"
severity: major

### 6. Brand Guidance - Field Labels Clarity
expected: The IG handle field and last slide rules field have clearer labels with helper text explaining what they're for. All px fields have default/placeholder values shown.
result: pass

### 7. Brand Preview - No More 431 Errors
expected: Brand Guidance tab shows a live preview card on the right. The preview renders without any HTTP 431 "Request Header Fields Too Large" errors. Changing colors or fonts updates the preview within ~1 second.
result: issue
reported: "No error, but no preview. It remains at Preview will appear here"
severity: major

### 8. Settings Version History - Records Changes
expected: Settings History tab now shows version entries after making settings changes. After saving changes in any settings tab, navigate to Settings History and see at least one version entry with a timestamp. (Requires changes to have been made this session.)
result: pass

### 9. Template Builder - Image Loads
expected: In the Template Builder, when a background image is set, it displays on the canvas without errors. No 431 errors, no broken image. Image loading uses data URLs to bypass file:// restrictions.
result: issue
reported: "a) white buttons still have white text. b) cards are white not dark themed. c) Image loads, but cannot select any zone - mousedown does not trigger zone selection. Also not possible on color or gradient background."
severity: blocker

### 10. Template Builder - Zone Drawing Persists
expected: In Template Builder, click and drag on the canvas to draw a zone rectangle. The zone appears and stays on canvas (does not disappear). Fast mouse movements do not lose the zone. Zones are visible after drawing.
result: issue
reported: "Cannot select any zone - mousedown does not trigger zone selection on any background mode (image, color, gradient)"
severity: blocker

### 11. Template Builder - Canvas Sized Properly
expected: The template builder canvas fits within the UI without requiring scroll or being cut off. Canvas is constrained to max ~700px width and displays proportionally within the layout.
result: issue
reported: "still much scrolling required vertically; preview zone is HUGE"
severity: major

### 12. Template Builder - Button Text Readable
expected: All buttons in the template builder are readable - no white text on white background. Dark theme is applied consistently throughout the template builder UI.
result: issue
reported: "Buttons still white with white text (Cancel, Story amongst others), dark theme NOT applied consistently, still white cards: Background, Overlay Settings"
severity: blocker

## Summary

total: 12
passed: 6
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Brand colors card uses dark theme (readable text), standard font selector available for Headline/Body/CTA, per-slot upload preview removed, right-side preview renders live"
  status: failed
  reason: "User reported: a) The entire card for brand colors is WHITE --> text not readable. b) Selector for standard font only available for CTA. Make it also available for Headline and body fonts. Remove the huge preview for the uploaded fonts. We have the preview window on the right which is sufficient for preview. This preview DOES NOT show a preview --> always: Preview will appear here"
  severity: major
  test: 5
  root_cause: "Three separate issues: (1) BrandGuidanceSection.tsx:60 has hardcoded bg-white on left column div - needs dark theme classes. (2) FontUpload.tsx standard fonts dropdown is in the 'no fontConfig' else-branch only; headline/body already have fonts configured so they show configured state without dropdown. Need to always show dropdown. (3) FontUpload.tsx:125-135 has the large font preview block ('The quick brown fox...') - remove it."
  artifacts:
    - path: "src/renderer/src/components/settings/BrandGuidanceSection.tsx"
      issue: "Line 60: bg-white on left column; line 179: bg-white on right preview column; all text uses gray-* instead of slate-*"
    - path: "src/renderer/src/components/settings/FontUpload.tsx"
      issue: "Line 100: text-gray-700 label; lines 125-135: large 'quick brown fox' preview; dropdown only in else-branch"
  missing:
    - "Replace bg-white/gray-* with dark theme classes in BrandGuidanceSection.tsx"
    - "Show standard fonts dropdown in configured state too (or always show it)"
    - "Remove lines 125-135 (large font preview) from FontUpload.tsx"
  debug_session: "direct-code-inspection"

- truth: "Template builder canvas fits viewport without vertical scrolling; preview zone is proportionally sized"
  status: failed
  reason: "User reported: still much scrolling required vertically; preview zone is HUGE"
  severity: major
  test: 11
  root_cause: "ZoneEditor.tsx:86 calculates height as (containerWidth / 1080) * canvasHeight. At 700px width, feed format = 875px tall, story = 1244px. Canvas maintains full Instagram aspect ratio making it too tall for the UI. Need to cap max displayed height (~500px) and derive scale from whichever constraint is smaller (width or height)."
  artifacts:
    - path: "src/renderer/src/components/templates/ZoneEditor.tsx"
      issue: "Line 86: height = (width / CANVAS_WIDTH) * canvasHeight - no max height cap; line 66: initial containerSize has height: 875 at 700px width"
  missing:
    - "Add maxDisplayHeight constant (~500px) and compute scale as Math.min(containerWidth/CANVAS_WIDTH, maxDisplayHeight/canvasHeight)"
    - "Update initial containerSize to use constrained height"
  debug_session: "direct-code-inspection"

- truth: "Template builder has dark theme throughout - no white cards, no white-on-white buttons"
  status: failed
  reason: "User reported: Buttons still white with white text (Cancel, Story amongst others), dark theme NOT applied consistently, still white cards: Background, Overlay Settings"
  severity: blocker
  test: 9
  root_cause: "BackgroundSelector.tsx:61 uses bg-gray-50 for its card wrapper. OverlayControls.tsx:39 uses bg-gray-50. Both need dark theme. Buttons ('Story', 'Cancel') inside TemplateBuilder with variant='outline' are likely using default Button component styles that don't inherit dark context."
  artifacts:
    - path: "src/renderer/src/components/templates/BackgroundSelector.tsx"
      issue: "Line 61: bg-gray-50 rounded-lg border - should be bg-slate-800 border-slate-700; all text uses default (dark on light)"
    - path: "src/renderer/src/components/templates/OverlayControls.tsx"
      issue: "Line 39: bg-gray-50 rounded-lg border - same issue; text-gray-* colors throughout"
  missing:
    - "Replace bg-gray-50/border with bg-slate-800/border-slate-700 in BackgroundSelector.tsx and OverlayControls.tsx"
    - "Update all text-gray-* and text-sm to text-slate-* variants"
    - "Ensure format toggle buttons (Feed/Story) use explicit dark styling"
  debug_session: "direct-code-inspection"

- truth: "Template builder zone drawing works - mousedown triggers zone creation on all background modes"
  status: failed
  reason: "User reported: cannot select any zone - mousedown does not trigger zone selection on any background mode (image, color, gradient)"
  severity: blocker
  test: 10
  root_cause: "Zone drawing requires 'Draw Zone' button to be clicked first to enable drawMode (ZoneEditor.tsx:63 - drawMode starts false). The 'Draw Zone' button has correct dark styling (border-slate-600 text-slate-300) but its parent TemplateBuilder context may need inspection. More likely: the Button component's outline variant applies default white background via CSS variables, making text invisible against it. Once dark theme is fixed in BackgroundSelector/OverlayControls, the Draw Zone button styling should also be verified."
  artifacts:
    - path: "src/renderer/src/components/templates/ZoneEditor.tsx"
      issue: "Lines 352-363: Draw Zone button requires drawMode=true to begin drawing; default state is false; button must be clicked first"
    - path: "src/renderer/src/components/ui/button.tsx"
      issue: "outline variant may not apply dark background, making text invisible in dark context"
  missing:
    - "Verify Button outline variant renders correctly in dark context"
    - "Consider making drawMode default to true, or adding visible instruction text on canvas"
    - "Ensure Draw Zone button text is always visible"
  debug_session: "direct-code-inspection"

- truth: "Brand preview renders live when settings change (colors, fonts)"
  status: failed
  reason: "User reported: No error, but no preview. It remains at Preview will appear here"
  severity: major
  test: 7
  root_cause: "BrandPreview.tsx calls window.api.renderToPNG() which uses a hidden BrowserWindow (render-service.ts) to render HTML to PNG. The IPC is wired correctly (rendering.ts, preload). Most likely cause: the renderToPNG call fails silently (error caught at line 88 and only console.error'd, not surfaced to UI). The render service may fail if: (1) the hidden window hasn't fully initialized, (2) the encoded HTML data URI exceeds URL length limits, or (3) capturePage times out. Secondary cause: BrandGuidanceSection.tsx wraps BrandPreview in bg-white card (line 179) which the preview component works around with its own bg-slate-800 inner container."
  artifacts:
    - path: "src/renderer/src/components/settings/BrandPreview.tsx"
      issue: "Line 88-90: catch block only console.error's - no error state shown to user; line 76: renderToPNG call may fail silently"
    - path: "src/main/services/render-service.ts"
      issue: "renderToPNG uses data URI encoding which may exceed URL length limits for large HTML"
  missing:
    - "Add error state display in BrandPreview.tsx when renderToPNG fails"
    - "Check render service initialization at app startup"
    - "Consider switching to IPC-based HTML passing (not data URI) for large HTML content"
  debug_session: "direct-code-inspection"

- truth: "Mechanics, Story Tools, and Themes catalogs support full CRUD (create, edit, delete items)"
  status: failed
  reason: "User reported: Include option to CRUD the Mechanics. This also goes for Story Tools, Themes."
  severity: major
  test: 3
  root_cause: "MechanicsSection.tsx, StoryToolsSection.tsx only support toggle (active/inactive). No create/edit/delete. Data lives in settings.mechanics.mechanics[] / settings.storyTools.storyTools[] persisted in SQLite via settings-service. The settings onUpdate() already handles saves. Need to add: (1) Add button + dialog form for new items, (2) Edit button per card opening same dialog pre-filled, (3) Delete button per card with confirmation. Same pattern for Story Tools and Themes sections."
  artifacts:
    - path: "src/renderer/src/components/settings/MechanicsSection.tsx"
      issue: "No create/edit/delete UI - only toggles"
    - path: "src/renderer/src/components/settings/StoryToolsSection.tsx"
      issue: "Same - only toggles"
  missing:
    - "Add 'Add Mechanic' button and create/edit dialog (form fields: name, description, hookRules, slideRange, structureGuidelines, pillarMapping)"
    - "Add edit/delete buttons to each mechanic card"
    - "Repeat pattern for StoryTools and Themes sections"
  debug_session: "direct-code-inspection"
