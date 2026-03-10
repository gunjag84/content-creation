---
phase: 02-settings-templates
plan: 06
subsystem: templates
tags: [ui, crud, carousel, dialog]
dependency_graph:
  requires: [02-01-ipc, 02-05-builder]
  provides: [template-management, carousel-variants, save-dialog]
  affects: [phase-03-manual-post]
tech_stack:
  added: [carousel-variants, multi-tab-editor]
  patterns: [conditional-rendering, variant-zones, confirm-dialogs]
key_files:
  created:
    - src/renderer/src/components/templates/TemplateList.tsx
    - src/renderer/src/components/templates/TemplateCard.tsx
    - src/renderer/src/components/templates/CarouselVariantEditor.tsx
    - src/renderer/src/components/templates/SaveAsTemplateDialog.tsx
  modified:
    - src/renderer/src/components/settings/TemplateSection.tsx
    - src/renderer/src/components/templates/TemplateBuilder.tsx
decisions:
  - decision: "Carousel mode only for feed format (4:5)"
    rationale: "Story format (9:16) typically doesn't use carousels - Instagram stories are sequential by design"
    impact: "UI toggle only appears when format='feed'"
  - decision: "Confirmation dialogs when switching carousel mode"
    rationale: "Prevents accidental zone loss when toggling between single/carousel modes"
    impact: "User must explicitly confirm before zones are cleared"
  - decision: "zones_config stores variant-aware JSON"
    rationale: "Backward compatible - existing templates store flat arrays, carousel templates store {type: 'carousel', cover, content, cta}"
    impact: "Template loading logic checks for carousel structure and handles both formats"
  - decision: "SaveAsTemplateDialog creates empty zones initially"
    rationale: "User can add zones later via TemplateBuilder - keeps dialog simple and focused"
    impact: "Dialog offers 'Add zones now?' prompt after save"
metrics:
  duration: 6.5
  tasks_completed: 2
  files_modified: 6
  completed_at: "2026-03-10T18:59:00Z"
---

# Phase 2 Plan 6: Template Management UI and Carousel Variants Summary

**One-liner:** Full template CRUD with grid view, carousel variant support (cover/content/CTA zones), and reusable save-as-template dialog ready for Phase 3.

## What Was Built

### Template Management (Task 1)
- **TemplateSection:** Manages view state (list/builder), loads templates, handles CRUD operations
- **TemplateList:** Responsive grid (3/2/1 columns), loading skeletons, empty state
- **TemplateCard:** Template preview with background thumbnail, metadata (format, zone count, created date), action buttons (edit/duplicate/delete)
- **Delete flow:** Confirmation dialog before deletion
- **Duplicate flow:** Name prompt with default "{original} (Copy)"
- **Edit flow:** Opens TemplateBuilder with templateId pre-populated

### Carousel Variants (Task 2)
- **CarouselVariantEditor:** 3-tab interface for cover/content/CTA slide zones
- **Tab navigation:** Active tab styling, descriptive text, zone count summary
- **Zone storage:** Serialized as `{type: 'carousel', cover: [], content: [], cta: []}`
- **TemplateBuilder integration:** Carousel toggle (feed format only), confirmation on mode switch, conditional rendering of ZoneEditor vs CarouselVariantEditor

### Save-as-Template Dialog (Task 2)
- **SaveAsTemplateDialog:** Reusable dialog for creating templates from custom backgrounds
- **Input:** Template name, format (read-only, inherited from context)
- **Save flow:** Creates template via IPC with empty zones, offers to add zones now
- **Exported:** Ready for Phase 3 manual post creation flow integration

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### zones_config Format
**Single slide templates:**
```json
[
  {"id": "zone-1", "type": "hook", "x": 100, "y": 200, "width": 880, "height": 300, "fontSize": 48, "minFontSize": 24},
  {"id": "zone-2", "type": "body", "x": 100, "y": 550, "width": 880, "height": 400, "fontSize": 24, "minFontSize": 14}
]
```

**Carousel templates:**
```json
{
  "type": "carousel",
  "cover": [{"id": "zone-1", "type": "hook", ...}],
  "content": [{"id": "zone-2", "type": "body", ...}],
  "cta": [{"id": "zone-3", "type": "cta", ...}]
}
```

### Template Loading Logic
1. Parse zones_config JSON
2. Check if object (not array) with type="carousel"
3. If carousel: extract cover/content/cta into carouselVariants state
4. If array: load into zones state (single slide)
5. Set isCarousel flag accordingly

### Carousel Mode Toggle
- Only visible when format="feed"
- Switching modes triggers confirmation if zones exist
- Clears zones when switching to prevent data corruption
- User must explicitly confirm before proceeding

## Verification Results

### Build
- `npx electron-vite build` - PASSED
- No TypeScript errors
- All components compiled successfully

### Tests
- `npm test -- tests/main/ipc/templates.test.ts` - PASSED (6/6)
- Template IPC operations verified
- CRUD functionality confirmed

## Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| 1 | d3c1002 | 3 | Template list, card, and CRUD management UI |
| 2 | e3ea62d | 3 | Carousel variant editor and save-as-template dialog |

## Key Files

### Created
- `src/renderer/src/components/templates/TemplateList.tsx` - Grid display with loading/empty states
- `src/renderer/src/components/templates/TemplateCard.tsx` - Individual template preview card
- `src/renderer/src/components/templates/CarouselVariantEditor.tsx` - 3-tab variant zone editor
- `src/renderer/src/components/templates/SaveAsTemplateDialog.tsx` - Reusable save dialog

### Modified
- `src/renderer/src/components/settings/TemplateSection.tsx` - Replaced stub with full management UI
- `src/renderer/src/components/templates/TemplateBuilder.tsx` - Integrated carousel mode toggle and variant editor

## Integration Points for Phase 3

1. **SaveAsTemplateDialog:** Import and use during manual post creation when user uploads custom background
2. **Template selection:** Use `window.api.templates.list()` to populate template picker
3. **Carousel awareness:** Check zones_config structure to determine if template is carousel or single slide
4. **Zone application:** Extract appropriate variant zones (cover/content/cta) based on slide position in carousel

## Success Criteria Met

- [x] Full template lifecycle management: create, view, edit, delete, duplicate
- [x] Carousel templates support different zone layouts for cover/content/CTA slides
- [x] SaveAsTemplateDialog ready for Phase 3 integration
- [x] All templates persist in SQLite database
- [x] Template list loads and displays all templates
- [x] Template CRUD operations functional
- [x] Carousel variant editor shows separate zone configurations per slide type
- [x] SaveAsTemplateDialog creates template when user confirms
- [x] Build passes
- [x] Tests pass

## Self-Check: PASSED

**Files verified:**
```
[FOUND] src/renderer/src/components/templates/TemplateList.tsx
[FOUND] src/renderer/src/components/templates/TemplateCard.tsx
[FOUND] src/renderer/src/components/templates/CarouselVariantEditor.tsx
[FOUND] src/renderer/src/components/templates/SaveAsTemplateDialog.tsx
[FOUND] src/renderer/src/components/settings/TemplateSection.tsx (modified)
[FOUND] src/renderer/src/components/templates/TemplateBuilder.tsx (modified)
```

**Commits verified:**
```
[FOUND] d3c1002 - feat(02-06): implement template list and CRUD management UI
[FOUND] e3ea62d - feat(02-06): add carousel variant editor and save-as-template dialog
```

All claimed files and commits exist. Self-check PASSED.
