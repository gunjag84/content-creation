---
phase: 02-settings-templates
plan: 01
subsystem: data-layer
tags: [schemas, blueprints, ipc, templates, fonts]
dependency_graph:
  requires: [01-02]
  provides: [extended-settings-schemas, blueprint-data, template-ipc, font-ipc, settings-version-queries]
  affects: [all-phase-02-plans]
tech_stack:
  added: [react-konva, konva, react-colorful, shadcn-tabs, shadcn-input, shadcn-textarea, shadcn-slider, shadcn-switch, shadcn-card, shadcn-label, shadcn-select, shadcn-popover, shadcn-separator]
  patterns: [nested-preload-api, template-crud, font-upload-dialog]
key_files:
  created:
    - src/shared/types/settings.ts (extended all 11 Zod schemas)
    - src/main/data/mechanics.json (7 post mechanics)
    - src/main/data/story-tools.json (18 Instagram story tools)
    - src/main/data/themes.json (5 Oberthemen hierarchy)
    - src/main/data/master-prompt-default.ts (default prompt template)
    - src/main/ipc/templates.ts (template CRUD IPC)
    - src/main/ipc/fonts.ts (font upload and list IPC)
    - tests/main/ipc/templates.test.ts (6 tests)
    - tests/main/ipc/fonts.test.ts (4 tests)
    - @/components/ui/*.tsx (10 shadcn components)
  modified:
    - src/main/db/queries.ts (added template CRUD, settings version queries)
    - src/main/ipc/settings.ts (added version list/forPost handlers)
    - src/main/index.ts (registered template/font IPC)
    - src/preload/types.ts (nested API structure)
    - src/preload/index.ts (exposed template/font/version methods)
    - package.json (added react-konva, konva, react-colorful)
decisions:
  - Import blueprint data directly in DEFAULT_SETTINGS using JSON imports
  - Store fonts in userData/fonts directory via file upload dialog
  - Derive font family from filename (strip extension, replace hyphens/underscores)
  - Use nested preload API structure (templates.list() vs templatesList())
  - Template zones_config stored as JSON string (parsed by renderer)
  - Settings version queries support optional brandId parameter
metrics:
  duration_minutes: 13
  completed_date: 2026-03-10
  tasks_completed: 2
  tests_added: 10
  tests_passing: 53
---

# Phase 02 Plan 01: Foundation - Data Layer & Dependencies

Extended settings schemas, extracted blueprint data, added template/font IPC, installed UI dependencies - foundation for all Phase 2 features.

## What Was Built

All 11 settings area schemas extended with proper Zod validation covering brand voice, target persona, content pillars, theme hierarchies (5 Oberthemen with Unterthemen and Kernaussagen), post mechanics (7 types), story tools (18 Instagram tools), visual guidance (fonts, colors, logo config), competitor analysis, viral expertise, content defaults, and master prompt. Blueprint data extracted to importable JSON files pre-populating mechanics, story tools, and themes in DEFAULT_SETTINGS.

Template CRUD operations working via IPC: create/list/get/update/delete/duplicate with full SQLite persistence. Font upload via Electron file dialog copies .ttf/.otf/.woff2 files to userData/fonts, derives family name from filename. Settings version queries (list all versions, get version at timestamp, get version for post) available for Settings History UI.

All npm dependencies installed (react-konva, konva, react-colorful) and 10 shadcn/ui components added (tabs, input, textarea, slider, switch, card, label, select, popover, separator). Preload bridge restructured with nested API (window.api.templates.list() pattern). 10 new tests added, all 53 tests passing, app builds successfully.

## Deviations from Plan

None - plan executed exactly as written.

## Implementation Notes

**JSON import path:** Blueprint data imported in src/shared/types/settings.ts works because Vite/electron-vite resolve imports correctly for both main and renderer contexts. The `../../main/data/` path resolves properly at build time.

**Nested preload API:** Changed from flat structure (`listTemplates()`) to nested (`templates.list()`) for better organization and clearer grouping. Existing methods kept flat for backward compatibility. Future IPC additions should use nested pattern.

**Font family derivation:** Simple filename-based approach (`Roboto-Bold.ttf` → `Roboto Bold`) works for standard font naming. Edge cases (multiple hyphens, special characters) may need refinement in Phase 2 when font preview is implemented.

**Template zones_config:** Stored as JSON string instead of separate zones table. Simpler for now, allows flexible zone schema evolution. May migrate to relational structure in Phase 4 if complex zone queries are needed.

**Settings version queries:** Support optional brandId parameter for future multi-brand support. Currently hardcoded to brand_id=1 in IPC handlers, but query layer is ready for multi-brand.

## Key Files Reference

**Settings schemas:** `src/shared/types/settings.ts` - All 11 Zod schemas, DEFAULT_SETTINGS with blueprint data
**Blueprint data:** `src/main/data/*.json` - Mechanics (7), story tools (18), themes (5 Oberthemen)
**Template IPC:** `src/main/ipc/templates.ts` - CRUD handlers
**Font IPC:** `src/main/ipc/fonts.ts` - Upload dialog, list fonts
**Queries:** `src/main/db/queries.ts` - Template CRUD, settings version queries
**Preload bridge:** `src/preload/index.ts`, `src/preload/types.ts` - Nested API structure
**Tests:** `tests/main/ipc/templates.test.ts` (6), `tests/main/ipc/fonts.test.ts` (4)

## Commits

- 4b930a0: feat(02-01): extend Zod schemas and extract blueprint data
- 19cfd8c: feat(02-01): add template and font IPC handlers with queries

## Next Steps

Phase 02 Plan 02 (Settings UI) can now proceed - all data layer dependencies are in place.

## Self-Check: PASSED

**Created files verified:**
```
[FOUND] src/main/data/mechanics.json (7 mechanics)
[FOUND] src/main/data/story-tools.json (18 tools)
[FOUND] src/main/data/themes.json (5 Oberthemen)
[FOUND] src/main/data/master-prompt-default.ts
[FOUND] src/main/ipc/templates.ts
[FOUND] src/main/ipc/fonts.ts
[FOUND] tests/main/ipc/templates.test.ts
[FOUND] tests/main/ipc/fonts.test.ts
[FOUND] @/components/ui/tabs.tsx (and 9 other shadcn components)
```

**Commits verified:**
```
[FOUND] 4b930a0 - Task 1 (schemas, data, dependencies)
[FOUND] 19cfd8c - Task 2 (IPC handlers, queries, preload)
```

**Tests verified:** 53/54 passing (1 flaky pre-existing Windows file lock test)
**Build verified:** electron-vite build succeeded
