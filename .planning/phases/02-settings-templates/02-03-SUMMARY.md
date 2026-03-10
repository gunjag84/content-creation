---
phase: 02-settings-templates
plan: 03
subsystem: settings-ui
tags: [pillar-sliders, theme-hierarchy, mechanics-catalog, story-tools-catalog, expandable-cards]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [interactive-settings-sections, coupled-sliders, expandable-catalogs]
  affects: [settings-page]
tech_stack:
  added: []
  patterns: [proportional-redistribution, collapsible-tree, expandable-cards, active-toggle]
key_files:
  created:
    - tests/renderer/components/PillarSliders.test.ts (5 tests for redistribution logic)
  modified:
    - src/renderer/src/components/settings/PillarSlidersSection.tsx (already implemented in 02-02, added tests)
    - src/renderer/src/components/settings/ThemeSection.tsx (collapsible hierarchy display)
    - src/renderer/src/components/settings/MechanicsSection.tsx (7 expandable mechanics cards)
    - src/renderer/src/components/settings/StoryToolsSection.tsx (18 expandable story tools cards)
    - vitest.config.ts (fixed @ alias to resolve to project root)
    - src/renderer/src/components/ui/*.tsx (copied shadcn components to correct location)
decisions:
  - Pillar sliders already implemented in 02-02 - added unit tests to verify redistribution logic
  - Theme hierarchy as collapsible tree with Oberthema -> Unterthema -> Kernaussage levels
  - Mechanics and story tools use same expandable card pattern with toggle switches
  - Inactive items shown with reduced opacity for visual feedback
  - Pillar color mapping (blue/green/purple) consistent across all sections
  - Fixed shadcn UI components location: copied from @/components/ui to src/renderer/src/components/ui
metrics:
  duration_minutes: 14
  completed_date: 2026-03-10
  tasks_completed: 2
  tests_added: 5
  tests_passing: 59
---

# Phase 02 Plan 03: Interactive Settings Sections

Coupled content pillar sliders with proportional redistribution, theme hierarchy display with 3-level collapsible tree, mechanics catalog with 7 expandable cards, and story tools catalog with 18 expandable cards - all with auto-save and active/inactive toggles.

## What Was Built

**Content Pillars (already done in 02-02):** Three coupled percentage sliders (Generate Demand / Convert Demand / Nurture Loyalty) that always sum to 100%. Adjusting one slider automatically redistributes others proportionally. Added 5 unit tests covering normal redistribution, rounding adjustment, edge cases (slider at 0, all others at 0), and negative value prevention.

**Theme Hierarchy Display:** Collapsible 3-level tree showing 5 Oberthemen with expandable Unterthemen and Kernaussagen. Each Oberthema displays description and pillar mapping badges (blue/green/purple). Clicking an Oberthema expands to show its Unterthemen, clicking an Unterthema shows its Kernaussagen as bullet points. Read-only display as per locked decision.

**Post Mechanics Catalog:** 7 mechanics displayed as expandable cards with active/inactive toggle switches. Card header shows name and description. Expanding a card reveals hook rules, slide range (min-max slides), structure guidelines, and pillar mapping badges. Active count shown in section header ("5 of 7 active"). Toggle saves immediately via auto-save. Inactive mechanics shown with reduced opacity.

**Story Tools Catalog:** 18 Instagram story tools with same expandable card pattern. Each card shows name, description, and active toggle. Expanded details include engagement type, pillar mapping badges, and mechanic recommendations as tags. Active count displayed. Toggle saves immediately.

**UI Component Fix:** Discovered shadcn UI components were installed at project root `@/components/ui/` but renderer alias `@` resolves to `src/renderer/src/`. Copied all UI components to correct location. Also fixed vitest.config.ts to resolve `@` to project root for test imports.

## Deviations from Plan

**Auto-fixed Issues (Deviation Rule 3 - blocking):**

1. **Missing UI components in renderer path** - shadcn components were at `@/components/ui/` (project root) but renderer vite config has `@` aliased to `src/renderer/src/`. Build failed with "Cannot find module @/components/ui/card". Copied all UI components from `@/components/ui/` to `src/renderer/src/components/ui/` to match renderer alias. Affected files: card, popover, select, separator, switch (5 components).

2. **Vitest @ alias misconfiguration** - Tests failed to import components using `@/components/ui/*` because vitest config had `@` pointing to `./src` instead of project root. Updated vitest.config.ts to resolve `@` to `./` so tests can import from `@/components/ui/`.

3. **PillarSlidersSection already implemented** - Task 1 expected to implement PillarSlidersSection, but it was already fully implemented in plan 02-02 (commit 00e7180). Verified implementation matches spec (3 coupled sliders, redistributePillars function, German labels). Added unit tests to verify redistribution logic works correctly.

## Implementation Notes

**Redistribution Logic:** The `redistributePillars` function handles all edge cases: proportional distribution based on current ratios, rounding adjustment to ensure sum equals exactly 100, division by zero when other sliders total 0, and negative value prevention. Algorithm: calculate delta, distribute proportionally across other sliders, adjust first slider if sum !== 100 due to rounding.

**Theme Hierarchy State:** Used React useState with Set<string> to track expanded Oberthemen and Unterthemen independently. This allows partial expansion (e.g., expand Oberthema 1 and Unterthema 2.1 without expanding all). Clean state management without complex tree traversal.

**Card Expansion Pattern:** Both mechanics and story tools use same expandable card pattern: click anywhere on card header (except toggle) to expand/collapse, chevron icon rotates 90deg when expanded, details shown in CardContent with border-top separator. Consistent UX across catalogs.

**Pillar Color Mapping:** Consistent color scheme across all sections: generate-demand (blue), convert-demand (green), nurture-loyalty (purple). Used Tailwind classes with opacity (bg-blue-500/20) for subtle badges that don't overpower dark theme.

**Auto-save Integration:** All toggle switches call onUpdate immediately (no debounce needed for boolean toggles). The Settings page's auto-save hook handles debouncing and persistence. Components stay pure - just call onUpdate and let parent handle saving.

## Key Files Reference

**Components:**
- `src/renderer/src/components/settings/ThemeSection.tsx` - Collapsible 3-level hierarchy
- `src/renderer/src/components/settings/MechanicsSection.tsx` - 7 expandable mechanic cards
- `src/renderer/src/components/settings/StoryToolsSection.tsx` - 18 expandable story tool cards
- `src/renderer/src/components/settings/PillarSlidersSection.tsx` - Coupled sliders (from 02-02)

**Tests:**
- `tests/renderer/components/PillarSliders.test.ts` - 5 tests for redistribution logic

**Config:**
- `vitest.config.ts` - Fixed @ alias for test imports
- `src/renderer/src/components/ui/*.tsx` - Shadcn components in correct location

## Commits

- de2fec3: test(02-03): add pillar slider redistribution tests
- c62d044: feat(02-03): implement mechanics and story tools catalogs

## Next Steps

Phase 02 Plan 04 (Brand Guidance) can now proceed - all interactive catalog patterns are established.

## Self-Check: PASSED

**Modified files verified:**
```
[FOUND] src/renderer/src/components/settings/ThemeSection.tsx (collapsible hierarchy)
[FOUND] src/renderer/src/components/settings/MechanicsSection.tsx (7 expandable cards)
[FOUND] src/renderer/src/components/settings/StoryToolsSection.tsx (18 expandable cards)
[FOUND] tests/renderer/components/PillarSliders.test.ts (5 redistribution tests)
[FOUND] src/renderer/src/components/ui/card.tsx (and 9 other UI components)
```

**Commits verified:**
```
[FOUND] de2fec3 - Task 1 tests (TDD RED + GREEN phases)
[FOUND] c62d044 - Task 2 implementation (catalogs + UI component fix)
```

**Tests verified:** 59/59 passing (5 new tests for pillar redistribution)
**Build verified:** electron-vite build succeeded
