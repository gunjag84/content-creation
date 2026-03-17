---
status: diagnosed
trigger: "Investigate two related issues in the Template Builder: Issue A - dark theme not applied consistently (white cards for Background and Overlay Settings, unreadable buttons). Issue B - zone drawing broken, mousedown doesn't trigger."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED both root causes found
test: Read all relevant files completely
expecting: N/A - diagnosis complete
next_action: Return structured diagnosis

## Symptoms

expected:
  - All cards in TemplateBuilder should render with dark theme (dark backgrounds, dark text)
  - Clicking and dragging on the canvas zone editor should draw a rectangle zone

actual:
  - "Background" and "Overlay Settings" cards remain white (light theme)
  - Buttons (Cancel, Story) have white text on white background - unreadable
  - mousedown does not fire or register in the zone editor canvas (no zone drawn)

errors: []

reproduction:
  - Open TemplateBuilder, see white cards for Background and Overlay Settings
  - See Cancel button (outline variant on dark bg) is white-on-white
  - See Story button (outline variant when not selected) is white-on-white
  - Enable draw mode, try to draw a zone by clicking and dragging - nothing appears

started: unknown

## Eliminated

- hypothesis: CSS pointer-events on the outer div blocking the Stage
  evidence: The outer div only has cursor style, no pointer-events property
  timestamp: 2026-03-11

- hypothesis: The Stage onMouseDown handler is not wired up
  evidence: onMouseDown={handleStageMouseDown} is correctly wired on Stage element (line 387)
  timestamp: 2026-03-11

- hypothesis: Some element outside Konva is intercepting mouse events via z-index overlay
  evidence: No HTML overlay sits on top of the canvas container div
  timestamp: 2026-03-11

## Evidence

- timestamp: 2026-03-11
  checked: BackgroundSelector.tsx line 61
  found: Root container uses `bg-gray-50 rounded-lg border` - light gray background, light border
  implication: This is the "Background" card that shows white in dark theme. No dark theme classes.

- timestamp: 2026-03-11
  checked: OverlayControls.tsx line 39
  found: Root container uses `bg-gray-50 rounded-lg border` - light gray background, light border
  implication: This is the "Overlay Settings" card that shows white in dark theme. No dark theme classes.

- timestamp: 2026-03-11
  checked: button.tsx lines 17-19
  found: variant='outline' has `border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900` - bg-white with no text color specified (defaults to black), which is unreadable when rendered inside the dark bg-slate-900 page background
  implication: When TemplateBuilder is rendered in the dark Settings page, the white bg-white outline buttons appear on top of the dark page. BUT in the header area (TemplateBuilder.tsx line 236 `space-y-6 p-6`), there is no explicit dark background wrapper on TemplateBuilder itself, so the page background shows through. The button text has no explicit text color - it inherits the page text (likely text-slate-100 or similar white), making it white text on white bg-white button.

- timestamp: 2026-03-11
  checked: TemplateBuilder.tsx lines 236-250
  found: TemplateBuilder's outer div is `space-y-6 p-6` with no background class. Cancel button uses `variant="outline"` (line 243). Story button uses `variant={format === 'story' ? 'default' : 'outline'}` (line 278). Feed button uses `variant={format === 'feed' ? 'default' : 'outline'}` (line 270).
  implication: The outline variant has `bg-white` and inherits text color from the parent dark context (white/light text from Settings page). Result: white text on white button background. Unreadable.

- timestamp: 2026-03-11
  checked: ZoneEditor.tsx lines 392-430, handleStageMouseDown lines 125-160
  found: The `handleStageMouseDown` check is `e.target === e.target.getStage()`. In Konva, `e.target.getStage()` returns the Stage object. `e.target` will be the Stage object only when clicking on a completely empty area with NO shapes. However, all three background modes render a full-canvas Rect or KonvaImage covering the entire stage surface. Additionally the overlay Rect covers the full canvas. None of these background/overlay shapes have `listening={false}`.
  implication: When the user clicks anywhere on the canvas, e.target is the background Rect (or KonvaImage, or overlay Rect) - NOT the stage itself. So `e.target === e.target.getStage()` is ALWAYS false. `clickedOnEmpty` is always false. The code path enters the `if (!clickedOnEmpty)` branch, tries to find a zone ID, fails (background shape has no zone ID), and returns early. The draw mode code block at line 150 is NEVER reached.

- timestamp: 2026-03-11
  checked: ZoneEditor.tsx line 424 (overlay Rect) and lines 400-420 (background Rects)
  found: Background Rect, KonvaImage, and overlay Rect have no `listening={false}` prop
  implication: All these shapes intercept mouse events. The overlay Rect is the topmost shape covering the entire canvas. Clicking anywhere "empty" actually hits the overlay Rect (or background Rect), making `clickedOnEmpty` = false every time.

## Resolution

root_cause:
  issue_a_dark_theme: |
    BackgroundSelector.tsx and OverlayControls.tsx were built with light-mode Tailwind classes.
    Both components use `bg-gray-50 rounded-lg border` as their root container (light gray card
    background, default gray border). They have no dark: variants or dark slate classes.
    Additionally, button.tsx `variant='outline'` is hardcoded to `bg-white` with no text color,
    so it inherits parent text color (white from the dark Settings page), creating white-on-white
    unreadable buttons. The TemplateBuilder wrapper has no dark background, so outline buttons
    rendered inside a dark context (Settings page) get white inherited text on white bg-white.

  issue_b_zone_drawing: |
    The "clicked on empty canvas" detection logic in handleStageMouseDown is broken.
    The check `e.target === e.target.getStage()` only returns true when the user clicks on the
    Stage with NO shapes underneath. But there is ALWAYS a background shape covering the full
    canvas (solid_color Rect, gradient Rect, or KonvaImage) and optionally an overlay Rect on
    top. None of these shapes have `listening={false}`, so they intercept all mouse events.
    When the user clicks anywhere, e.target is a background/overlay Rect, NOT the Stage.
    clickedOnEmpty is always false. The code returns early, the draw mode block is never reached,
    and zone drawing never starts regardless of background mode.

fix: ""
verification: ""
files_changed: []
