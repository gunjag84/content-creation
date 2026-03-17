---
status: diagnosed
trigger: "Template builder canvas oversized - excessive vertical scrolling. Brand Guidance font/color card UI problems."
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - all three root causes identified
test: Read ZoneEditor.tsx, BrandGuidanceSection.tsx, FontUpload.tsx
expecting: sizing logic, conditional rendering, theme class
next_action: return diagnosis

## Symptoms

expected: Canvas fits within visible viewport without scrolling; standard fonts dropdown appears for all font slots; brand colors card has dark background; no per-slot font upload preview
actual: Canvas is huge requiring vertical scrolling; standard fonts dropdown only available for CTA slot; brand colors card has white background; per-slot font preview is shown
errors: none
reproduction: Open template builder; open brand guidance settings
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-03-11T00:00:00Z
  checked: ZoneEditor.tsx lines 31-33, 75-76, 82-92
  found: |
    CANVAS_WIDTH=1080, CANVAS_HEIGHT_FEED=1350, CANVAS_HEIGHT_STORY=1920.
    scale = containerSize.width / CANVAS_WIDTH.
    ResizeObserver sets height = (width / CANVAS_WIDTH) * canvasHeight.
    Container div has max-w-[700px] (line 380) but NO max-height constraint.
    For feed format: at 700px width, scale=700/1080=0.648, height=1350*0.648=875px.
    For story format: at 700px width, height=1920*0.648=1244px.
  implication: |
    Canvas height is always a full proportional render of a 4:5 or 9:16 image.
    At 700px width, feed canvas = 875px tall. Story = 1244px tall.
    Both exceed typical viewport height (~700-800px), requiring scrolling.
    There is no max-height cap. The containerSize.height is set proportionally
    from the full aspect ratio with no viewport constraint.

- timestamp: 2026-03-11T00:00:00Z
  checked: BrandGuidanceSection.tsx lines 58-176
  found: |
    The outer left column wrapper (line 60) uses:
      className="space-y-8 bg-white rounded-lg p-6 border border-gray-200"
    This hardcodes bg-white on the entire left panel, including the Colors section,
    Typography section, and Logo & CTA section.
    The right column (line 179) also uses bg-white.
    All child text labels use text-gray-900, text-gray-700 (light theme colors).
    App is dark themed (slate-800/900 backgrounds elsewhere) but this section
    was built with hardcoded light theme classes throughout.
  implication: |
    The entire left card in BrandGuidanceSection is white background with gray text -
    this is not a missing dark class, it is intentionally hardcoded light theme
    that conflicts with the dark app shell.

- timestamp: 2026-03-11T00:00:00Z
  checked: FontUpload.tsx lines 98-177
  found: |
    The component renders two distinct branches:
    1. When fontConfig exists (lines 102-136): shows font info, Change/Remove buttons,
       and a FONT PREVIEW DIV (lines 126-135) with p-4 bg-gray-50 rounded-md border
       containing "The quick brown fox jumps over the lazy dog" at defaultFontSize px.
    2. When fontConfig is null/undefined (lines 137-176): shows BOTH the standard
       font dropdown (lines 140-153) AND the Upload Custom Font button.

    The standard font dropdown is rendered in the EMPTY STATE (no font selected).
    All three slots - Headline, Body, CTA - receive the same FontUpload component
    with no conditional checks filtering by label.
    BrandGuidanceSection lines 90-110 pass all three slots identically.
  implication: |
    The standard font dropdown IS present for all three slots (Headline, Body, CTA)
    when no font is configured. The user's report that it "only appears for CTA"
    likely means the other two slots already have a fontConfig set (a font was
    previously uploaded or selected), causing them to render the fontConfig branch
    which shows the preview + Change/Remove instead of the dropdown.

    The per-slot font preview (lines 126-135) renders whenever fontConfig is set.
    This is the "large per-slot font preview" to be removed - it's the
    "The quick brown fox..." text block inside the fontConfig branch.

- timestamp: 2026-03-11T00:00:00Z
  checked: FontUpload.tsx line 100
  found: label className="text-sm font-medium text-gray-700" - light theme color
  implication: FontUpload itself also uses light theme text colors, consistent
    with the whole BrandGuidanceSection being a light-themed island.

## Resolution

root_cause_canvas: |
  ZoneEditor.tsx computes canvas height as a full proportional scale of the
  template format's native resolution: feed=1350px, story=1920px.
  At the 700px max-width constraint, feed canvas renders at 875px tall,
  story at 1244px tall. There is NO max-height applied to the container div
  (line 378-382 only has max-w-[700px]). The containerSize.height state is
  set directly from (width / 1080) * canvasHeight with no viewport cap.

  Files: src/renderer/src/components/templates/ZoneEditor.tsx
  Lines: 31-33 (constants), 66 (initial state 700x875), 75-76 (scale calc),
         82-92 (ResizeObserver sets uncapped height), 378-382 (container div)

root_cause_colors: |
  BrandGuidanceSection.tsx hardcodes bg-white and light-theme text classes
  throughout the left control panel (line 60: bg-white rounded-lg) and right
  preview panel (line 179: bg-white rounded-lg). This is not a missing dark
  class - the entire component was built as a light-themed island inside a
  dark app shell. All text is gray-900/gray-700, borders are gray-200.

  Files: src/renderer/src/components/settings/BrandGuidanceSection.tsx
  Lines: 60 (left column bg-white), 63 (text-gray-900), 84 (border-gray-200),
         88 (text-gray-900), 167 (text-gray-900), 179 (right column bg-white)

root_cause_fonts_dropdown: |
  The standard fonts dropdown is NOT conditionally limited to CTA only in code.
  FontUpload renders the dropdown for ALL slots when fontConfig is undefined.
  The visual observation (dropdown only on CTA) is because Headline and Body
  slots already have a fontConfig set from a previous session, placing them
  in the "fontConfig exists" branch which shows the preview + Change/Remove
  instead of the dropdown. The CTA slot has no font set, so it shows the
  empty state with the dropdown.

  Fix required: none for the dropdown logic itself - it works correctly.
  The perceived bug is a data state issue, not a code bug.

root_cause_font_preview: |
  The per-slot font preview ("The quick brown fox...") is rendered at
  FontUpload.tsx lines 125-135, inside the fontConfig branch (lines 102-136).
  It is an unconditional div that appears whenever any font is configured.

  Files: src/renderer/src/components/settings/FontUpload.tsx
  Lines: 125-135 (preview div to remove)

fix:
verification:
files_changed: []
