---
status: investigating
trigger: "CTA text on the last carousel slide is barely visible and needs click/zoom to read in Step 4 preview"
created: 2026-03-17T00:00:00Z
updated: 2026-03-17T00:00:00Z
---

## Current Focus

hypothesis: CTA text is rendered at full-size canvas (1080x1350) but displayed in a small thumbnail grid, making font sizes that look fine at full resolution become unreadable at thumbnail scale
test: Analyze the font sizes used for CTA zones vs the thumbnail display dimensions
expecting: CTA font size is small relative to canvas and gets crushed at thumbnail scale
next_action: Calculate effective display size and CTA font size ratio

## Symptoms

expected: CTA text on last slide should be readable in the Step 4 preview grid
actual: CTA text is barely visible, requires click/zoom to read
errors: none (visual issue)
reproduction: Generate a carousel, render previews in Step 4, observe last slide CTA text
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-03-17T00:01:00Z
  checked: buildSlideHTML CTA rendering (line 136-141, 155-156)
  found: Zone-based CTA uses zone.fontSize (default 40px fallback). Fallback layout CTA uses hardcoded 34px. Both on a 1080x1350 canvas.
  implication: CTA text is the smallest text element in both paths (headline=56px fallback, body=38px fallback)

- timestamp: 2026-03-17T00:02:00Z
  checked: ZoneEditor default CTA font size (line 126)
  found: Default CTA font size from brand guidance is 32px (ctaFontSize || 32). Headline default is 48px, body is 24px.
  implication: Zone-based CTA at 32px is even smaller than the 40px fallback in buildSlideHTML

- timestamp: 2026-03-17T00:03:00Z
  checked: Preview grid layout (lines 379-403)
  found: Grid is grid-cols-2 md:grid-cols-3 within max-w-5xl (1024px). At 3 cols with gap-6, each thumbnail is ~325px wide. Scale factor = 325/1080 = 0.30x. A 32px CTA renders at ~10px effective. A 34px fallback CTA at ~10px. A 40px default at ~12px.
  implication: CTA text at 10-12px effective size is at or below comfortable reading threshold

- timestamp: 2026-03-17T00:04:00Z
  checked: Overlay interaction with CTA readability
  found: Default overlay_opacity is 0.5 (line 111) with overlay covering entire slide (inset:0). CTA text (white on dark overlay) at 10px effective size with semi-transparent overlay behind it reduces contrast
  implication: Overlay makes already-small text harder to read

- timestamp: 2026-03-17T00:05:00Z
  checked: Click-to-zoom or modal preview functionality
  found: No zoom/modal exists. Preview grid just renders img tags in aspect-[4/5] containers with no click handler.
  implication: Users have no way to see full-resolution slides without exporting

## Resolution

root_cause: >
  Two compounding issues make CTA text barely visible in Step 4 preview:

  1. SCALE COMPRESSION: The 1080x1350 canvas is displayed in a ~325px wide thumbnail (0.30x scale).
     CTA font sizes (32-40px at canvas resolution) render at only 10-12px effective display size,
     which is at the readability threshold. CTA is the smallest text element - headline gets 48-56px
     (14-17px effective) and body gets 24-38px (7-11px effective), so CTA is similar to body but
     expected to be a prominent call-to-action.

  2. NO ZOOM CAPABILITY: The preview grid has no click-to-zoom or modal preview. Users cannot
     inspect individual slides at full resolution without exporting first, making the small CTA
     completely inaccessible for review.

  Contributing factor: The default overlay at 50% opacity further reduces contrast on the
  already-small CTA text.

fix:
verification:
files_changed: []
