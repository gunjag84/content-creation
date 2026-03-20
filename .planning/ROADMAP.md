# Roadmap: Content Creation System

## Milestones

- [x] **v1.0 Core System** - Phases 1-3.1 (shipped 2026-03-17)
- [ ] **v2.0 Dynamic Zone Model** - Phases 4-8 (in progress)

## Phases

<details>
<summary>v1.0 Core System (Phases 1-3.1) - SHIPPED 2026-03-17</summary>

### Phase 1: Foundation & Rendering
**Goal**: Working Electron app with HTML-to-PNG rendering at Instagram dimensions and persistent data storage
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, TPL-07
**Success Criteria** (what must be TRUE):
  1. User can launch Electron app via double-click on .exe file without terminal or dev server
  2. System can render HTML/CSS templates to PNG at 1080x1350 (feed) and 1080x1920 (story) using BrowserWindow.capturePage
  3. SQLite database persists learning data with WAL mode enabled and integrity checks on startup
  4. JSON settings files are stored in app.getPath('userData') with automatic timestamp versioning on every write
  5. App shuts down gracefully without corrupting SQLite database
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Scaffold electron-vite project, app shell with sidebar nav, dark mode, IPC type contracts
- [x] 01-02-PLAN.md - SQLite data layer with full schema, JSON settings with Zod validation and versioning, secure API key storage, graceful shutdown
- [x] 01-03-PLAN.md - HTML-to-PNG rendering pipeline with hidden BrowserWindow, test render page, build verification

### Phase 2: Settings & Templates
**Goal**: Complete brand configuration system with all 11 settings areas and visual template creation tools with canvas-based zone editor
**Depends on**: Phase 1
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07, SET-08, SET-09, SET-10, SET-11, SET-12, TPL-01, TPL-02, TPL-03, TPL-04, TPL-05, TPL-06, TPL-08, TPL-09
**Success Criteria** (what must be TRUE):
  1. User can configure all 11 brand settings areas (voice, persona, pillars, themes, mechanics, defaults, visual guidance, competitor analysis, story tools, viral expertise, master prompt)
  2. User can create a template by uploading an image and visually dragging rectangles to define text zones and no-text zones
  3. User can manage templates in settings (list, edit zones, delete, duplicate) and templates persist across sessions
  4. Claude API key is stored securely via Electron safeStorage API and never appears in plain text in settings.json
  5. Settings changes are automatically versioned with timestamps and system can show which settings version was active for any post
**Plans**: 15 plans

Plans:
- [x] 02-01-PLAN.md - Extend Zod schemas for all 11 settings areas, extract blueprint data to JSON, install dependencies, template/font IPC handlers
- [x] 02-02-PLAN.md - Settings page shell with vertical tabs, Zustand store, auto-save hook, 6 simple form sections (voice, persona, defaults, competitor, viral, master prompt)
- [x] 02-03-PLAN.md - Interactive settings sections: coupled pillar sliders, theme hierarchy display, mechanics catalog, story tools catalog
- [x] 02-04-PLAN.md - Brand guidance section with color pickers, font upload/preview, logo placement, live brand preview card
- [x] 02-05-PLAN.md - Template builder with react-konva zone editor, overlay controls, background selector
- [x] 02-06-PLAN.md - Template management UI (list, edit, delete, duplicate), carousel variant editor, save-as-template dialog
- [x] 02-07-PLAN.md - [GAP CLOSURE] Fix startup errors (better-sqlite3 rebuild, Zod validation), wire settings versioning to SQLite
- [x] 02-08-PLAN.md - [GAP CLOSURE] Integrate settings sub-navigation into main sidebar
- [x] 02-09-PLAN.md - [GAP CLOSURE] Fix toggle switches for dark theme, add standard fonts, improve Brand Guidance labels
- [x] 02-10-PLAN.md - [GAP CLOSURE] Fix template builder (image loading, zone persistence, canvas sizing, button contrast) and brand preview 431 error
- [x] 02-11-PLAN.md - [GAP CLOSURE] Brand Guidance dark theme fix (left column bg-white, font dropdown in all slots, remove oversized preview)
- [x] 02-12-PLAN.md - [GAP CLOSURE] Brand preview render fix (temp file HTML loading, JSON parse fix, error state display)
- [x] 02-13-PLAN.md - [GAP CLOSURE] Template builder dark theme (BackgroundSelector, OverlayControls, Button outline variant)
- [x] 02-14-PLAN.md - [GAP CLOSURE] Zone editor canvas height cap and draw mode discoverability
- [x] 02-15-PLAN.md - [GAP CLOSURE] Full CRUD for Mechanics, Story Tools, and Themes catalogs

### Phase 3: Content Generation
**Goal**: End-to-end content workflow from recommendation to export with AI generation and performance-based learning
**Depends on**: Phase 2
**Requirements**: POST-01, POST-02, POST-03, POST-04, POST-05, POST-06, POST-07, POST-08, POST-09, POST-10, POST-11, POST-12, POST-13, POST-14, POST-15, POST-16, POST-17, STORY-01, STORY-02, STORY-03, STORY-04, STORY-05, STORY-06, STORY-07, STORY-08, STORY-09, STORY-10, LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, LEARN-06
**Success Criteria** (what must be TRUE):
  1. System recommends content pillar, theme, and mechanic based on rotation balance (equal rotation until learning data exists, then data-driven weighting)
  2. User can generate slide text and caption via Claude API using master prompt assembled from all active config areas
  3. User can edit slide texts and caption inline, reorder carousel slides, request alternative hooks, and request completely new drafts
  4. System automatically renders PNGs after text is approved and user can adjust per-slide overlay opacity before final export
  5. System generates 2-4 story proposals linked to feed post with interactive tool recommendations and dedicated story templates
  6. User can approve and export upload-ready feed PNGs and story PNGs with caption text file
  7. Learning system tracks balance matrix across steerable variables and generates soft-signal warnings when variables are overused
**Plans**: 13 plans

Plans:
- [x] 03-01-PLAN.md - Install deps (@anthropic-ai/sdk, @dnd-kit, react-hook-form), shared generation types, Wave 0 test scaffolds
- [x] 03-02-PLAN.md - [TDD] Recommendation engine (round-robin cold start + performance-weighted) + prompt assembler
- [x] 03-03-PLAN.md - [TDD] Learning system (balance matrix queries, warning thresholds, pillar balance) + post/slide CRUD IPC
- [x] 03-04-PLAN.md - [TDD] Claude API generation IPC handlers (streaming) + file export IPC handlers
- [x] 03-05-PLAN.md - [TDD] Zustand wizard store + CreatePost shell + Step 1 (Recommendation & Selection UI)
- [x] 03-06-PLAN.md - Step 2 (streaming generation display) + Step 3 (two-panel text editor, thumbnails, caption, drag reorder)
- [x] 03-07-PLAN.md - Step 4 (render & review, export) + Step 5 (story proposals, story render, story export)
- [x] 03-08-PLAN.md - Dashboard BalanceWidget + final end-to-end UAT checkpoint
- [x] 03-09-PLAN.md - [GAP CLOSURE] Fix Step 2 header ternary, manual mode spinner, and drag-and-drop UID-based reorder
- [x] 03-10-PLAN.md - [GAP CLOSURE] Fix alternative hooks prompt assembly and error handling
- [x] 03-11-PLAN.md - [GAP CLOSURE] Fix render service image wait, auto-render on mount, and click-to-zoom modal
- [x] 03-12-PLAN.md - [GAP CLOSURE] Add avg_performance display to BalanceWidget (LEARN-02)
- [x] 03-13-PLAN.md - [GAP CLOSURE] Add ad-hoc post support with theme balance exclusion (LEARN-05)

### Phase 3.1: Visual Slide Editor (INSERTED)
**Goal**: Per-slide visual editing in Step 3 with zone position/font overrides, undo/redo history, and reusable presets - all with immediate live preview feedback
**Depends on**: Phase 3
**Requirements**: VSED-01, VSED-02, VSED-03, VSED-04, VSED-05, VSED-06, VSED-07, VSED-08
**Success Criteria** (what must be TRUE):
  1. User can adjust per-slide zone position (X/Y offset), font size, font weight, and color for each template zone
  2. Zone overrides merge over template defaults at render time without modifying the template
  3. Undo/redo restores/re-applies slide state with history capped at 50 entries
  4. User can save zone override configurations as named presets and apply them to any slide
  5. LivePreview in Step 3 shows actual template rendering with zone overrides in real-time
  6. Rendered PNGs in Step 4 reflect all zone overrides from Step 3
**Plans**: 4 plans

Plans:
- [x] 03.1-01-PLAN.md - ZoneOverride types, extract buildSlideHTML to shared utility, extend Zustand store with history/undo/redo/zone overrides (TDD)
- [x] 03.1-02-PLAN.md - PresetsService JSON persistence, IPC handlers, preload API, store applyPreset action (TDD)
- [x] 03.1-03-PLAN.md - SlideZoneOverrides UI panel, template loading in Step 3, LivePreview upgrade, undo/redo toolbar
- [x] 03.1-04-PLAN.md - SlidePresetManager UI, full visual editor human verification checkpoint

</details>

---

## v2.0 Dynamic Zone Model (In Progress)

**Milestone Goal:** Replace fixed 3-zone slide architecture with dynamic N-zone model - configurable style types, layout templates, and PowerPoint-style text formatting.

### Phase 4: Data Model
**Goal**: Shared types, Zod schemas, and DB schema that support dynamic N-zone slides throughout the entire system
**Depends on**: Phase 3.1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Slide type uses zones[] array instead of hook_text/body_text/cta_text - all existing code that references the old fields fails type-check until updated
  2. Zone entity carries id, styleType, content (HTML), position (top/left/width/height), and style overrides with Zod validation enforcing the shape
  3. SQLite slides table has a JSON zones column and the three old text columns are removed - migrations run cleanly on a fresh database
  4. Shared Zod schemas for Zone, StyleType, and LayoutTemplate are importable from a single location by both client and server code
**Plans**: TBD

Plans:
- [ ] 04-01-PLAN.md - Zone, StyleType, LayoutTemplate Zod schemas + TypeScript types + unit tests
- [ ] 04-02-PLAN.md - DB migration: drop hook_text/body_text/cta_text, add zones JSON column + update all query files + integration tests

### Phase 5: Style System
**Goal**: User-configurable style type registry in settings and layout templates that pre-configure zones per slide
**Depends on**: Phase 4
**Requirements**: STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05
**Success Criteria** (what must be TRUE):
  1. User can create a custom style type (e.g., "Hook 2") with fontSize, fontWeight, fontFamily, color, textAlign, lineHeight, and letterSpacing and it persists across sessions
  2. Default style types (Hook, Body, CTA) are present on first launch, editable, and cannot leave the system in a state with zero style types
  3. User can create a layout template that defines zone count, positions, and style type assignments, then apply it to a new slide
  4. Applying a style type to a zone updates the entire zone's text appearance to that type's defaults immediately in the editor
  5. User can select individual words within a zone and override font, size, or color independently of the zone-level style type
**Plans**: TBD

Plans:
- [ ] 05-01-PLAN.md - StyleType registry: Zod schema extension, settings JSON persistence, IPC handlers, default seeding
- [ ] 05-02-PLAN.md - Style types settings UI (list, create, edit, delete with confirmation)
- [ ] 05-03-PLAN.md - LayoutTemplate registry: schema, persistence, IPC handlers
- [ ] 05-04-PLAN.md - Layout templates settings UI + zone-level style type application + TipTap word-level override integration

### Phase 6: Editor UI
**Goal**: Slide editor supports adding, removing, and visually positioning N zones per slide with full drag, resize, and style type controls
**Depends on**: Phase 4, Phase 5
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):
  1. User can click a plus button on any slide, pick a style type from a dropdown, and a new zone appears on the slide canvas with default position and sizing
  2. User can delete any zone from a slide and the slide renders correctly without the deleted zone
  3. User can add a carousel slide and choose from available layout templates to pre-populate zones
  4. SlidePreview renders all zones from the zones[] array with correct position, size, and style - drag and resize work on each zone independently
  5. SlideEditor renders one editor panel per zone dynamically, showing the zone's style type and TipTap content editor
**Plans**: TBD

Plans:
- [ ] 06-01-PLAN.md - Update SlidePreview to render N zones dynamically with drag/resize per zone
- [ ] 06-02-PLAN.md - Update SlideEditor to render dynamic zone panels from zones array
- [ ] 06-03-PLAN.md - Add zone controls (plus button with style type picker, delete) + add slide with layout template picker

### Phase 7: Generation Pipeline
**Goal**: AI generation outputs dynamic zone arrays and the HTML renderer builds slides from N zones
**Depends on**: Phase 4
**Requirements**: GEN-01, GEN-02, GEN-03
**Success Criteria** (what must be TRUE):
  1. Claude API returns a zones[] array per slide with styleType and content fields - the response parses without error and maps to the Zone type
  2. Prompt assembler constructs the generation prompt using zone array structure instead of the three named text fields (hook_text, body_text, cta_text)
  3. buildSlideHTML renders a complete slide HTML string from an arbitrary zones[] array, positioning each zone using its top/left/width/height values
**Plans**: TBD

Plans:
- [ ] 07-01-PLAN.md - Update prompt assembler to output zone array structure + update Claude response parser
- [ ] 07-02-PLAN.md - Rewrite buildSlideHTML to render N zones from array with dynamic positioning

### Phase 8: Drafts
**Goal**: Users can save, resume, export, and import post drafts as a complete snapshot of slide state
**Depends on**: Phase 4
**Requirements**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04
**Success Criteria** (what must be TRUE):
  1. User can save the current post state as a draft - all slides, zones, styling, and background settings are persisted to SQLite
  2. User can open a saved draft and resume editing from exactly where they left off, with all zones and content restored
  3. User can export any draft as a JSON file to the filesystem for external backup
  4. User can import a previously exported JSON file and it opens as an editable draft in the editor
**Plans**: TBD

Plans:
- [ ] 08-01-PLAN.md - Draft SQLite schema, save/load IPC handlers, Zustand store actions (TDD)
- [ ] 08-02-PLAN.md - Drafts UI (save button, draft list, resume, delete) + JSON export/import

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 3.1
v2.0: 4 -> 5 -> 6 -> 7 -> 8 (Phase 7 can start after Phase 4; Phase 8 can start after Phase 4)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Rendering | v1.0 | 3/3 | Complete | 2026-03-10 |
| 2. Settings & Templates | v1.0 | 15/15 | Complete | 2026-03-11 |
| 3. Content Generation | v1.0 | 13/13 | Complete | 2026-03-17 |
| 3.1. Visual Slide Editor | v1.0 | 4/4 | Complete | 2026-03-17 |
| 4. Data Model | v2.0 | 0/2 | Not started | - |
| 5. Style System | v2.0 | 0/4 | Not started | - |
| 6. Editor UI | v2.0 | 0/3 | Not started | - |
| 7. Generation Pipeline | v2.0 | 0/2 | Not started | - |
| 8. Drafts | v2.0 | 0/2 | Not started | - |
