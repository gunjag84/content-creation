---
status: complete
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
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Template builder canvas fits viewport without vertical scrolling; preview zone is proportionally sized"
  status: failed
  reason: "User reported: still much scrolling required vertically; preview zone is HUGE"
  severity: major
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Template builder has dark theme throughout - no white cards, no white-on-white buttons"
  status: failed
  reason: "User reported: Buttons still white with white text (Cancel, Story amongst others), dark theme NOT applied consistently, still white cards: Background, Overlay Settings"
  severity: blocker
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Template builder zone drawing works - mousedown triggers zone creation on all background modes"
  status: failed
  reason: "User reported: cannot select any zone - mousedown does not trigger zone selection on any background mode (image, color, gradient)"
  severity: blocker
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Brand preview renders live when settings change (colors, fonts)"
  status: failed
  reason: "User reported: No error, but no preview. It remains at Preview will appear here"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Mechanics, Story Tools, and Themes catalogs support full CRUD (create, edit, delete items)"
  status: failed
  reason: "User reported: Include option to CRUD the Mechanics. This also goes for Story Tools, Themes."
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
