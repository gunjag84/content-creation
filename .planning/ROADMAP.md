# Roadmap: Content Creation System

## Overview

This roadmap transforms an AI-powered Instagram content creation concept into a working Electron desktop app. The journey starts with core infrastructure and rendering capabilities, builds up the settings and template system that defines brand identity, integrates AI generation with the full post workflow and learning system, and finishes with production readiness and polish. Each phase delivers a coherent capability that can be verified independently, building toward the complete core loop: pick a topic and mechanic, generate text via Claude, render branded images from HTML/CSS templates, and export upload-ready PNGs - all guided by brand settings and performance insights.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Rendering** - Electron scaffolding, HTML-to-PNG rendering pipeline, data layer with SQLite and JSON config
- [ ] **Phase 2: Settings & Templates** - Brand configuration (11 settings areas), visual template builder with drag-and-drop zone editor (UAT gap closure in progress)
- [ ] **Phase 3: Content Generation** - AI integration, full post workflow, story generation, performance-based learning system
- [ ] **Phase 4: Production Readiness** - Performance tracking UI, logging and error handling, testing and polish

## Phase Details

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
- [ ] 01-01-PLAN.md - Scaffold electron-vite project, app shell with sidebar nav, dark mode, IPC type contracts
- [ ] 01-02-PLAN.md - SQLite data layer with full schema, JSON settings with Zod validation and versioning, secure API key storage, graceful shutdown
- [ ] 01-03-PLAN.md - HTML-to-PNG rendering pipeline with hidden BrowserWindow, test render page, build verification

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
- [ ] 02-01-PLAN.md - Extend Zod schemas for all 11 settings areas, extract blueprint data to JSON, install dependencies, template/font IPC handlers
- [ ] 02-02-PLAN.md - Settings page shell with vertical tabs, Zustand store, auto-save hook, 6 simple form sections (voice, persona, defaults, competitor, viral, master prompt)
- [ ] 02-03-PLAN.md - Interactive settings sections: coupled pillar sliders, theme hierarchy display, mechanics catalog, story tools catalog
- [ ] 02-04-PLAN.md - Brand guidance section with color pickers, font upload/preview, logo placement, live brand preview card
- [ ] 02-05-PLAN.md - Template builder with react-konva zone editor, overlay controls, background selector
- [ ] 02-06-PLAN.md - Template management UI (list, edit, delete, duplicate), carousel variant editor, save-as-template dialog
- [ ] 02-07-PLAN.md - [GAP CLOSURE] Fix startup errors (better-sqlite3 rebuild, Zod validation), wire settings versioning to SQLite
- [ ] 02-08-PLAN.md - [GAP CLOSURE] Integrate settings sub-navigation into main sidebar
- [ ] 02-09-PLAN.md - [GAP CLOSURE] Fix toggle switches for dark theme, add standard fonts, improve Brand Guidance labels
- [ ] 02-10-PLAN.md - [GAP CLOSURE] Fix template builder (image loading, zone persistence, canvas sizing, button contrast) and brand preview 431 error
- [ ] 02-11-PLAN.md - [GAP CLOSURE] Brand Guidance dark theme fix (left column bg-white, font dropdown in all slots, remove oversized preview)
- [ ] 02-12-PLAN.md - [GAP CLOSURE] Brand preview render fix (temp file HTML loading, JSON parse fix, error state display)
- [ ] 02-13-PLAN.md - [GAP CLOSURE] Template builder dark theme (BackgroundSelector, OverlayControls, Button outline variant)
- [ ] 02-14-PLAN.md - [GAP CLOSURE] Zone editor canvas height cap and draw mode discoverability
- [ ] 02-15-PLAN.md - [GAP CLOSURE] Full CRUD for Mechanics, Story Tools, and Themes catalogs

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Production Readiness
**Goal**: Production-ready app with performance tracking, logging, error handling, and polished UX
**Depends on**: Phase 3
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06
**Success Criteria** (what must be TRUE):
  1. System auto-captures post metadata on creation and shows manual performance input form 7 days after publication
  2. User can add revenue attribution and qualitative notes per post, with story performance linked to parent feed post
  3. Comprehensive logging to app.getPath('userData')/logs/ with user-friendly error messages and "Export Logs" feature
  4. App handles uncaught exceptions gracefully without crashing and shows user-friendly error dialogs with recovery options
  5. User sees progress indicators for long operations (rendering, generation) and preview confirmation before export
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Rendering | 3/3 | Complete | 2026-03-10 |
| 2. Settings & Templates | 11/15 | In Progress|  |
| 3. Content Generation | 0/3 | Not started | - |
| 4. Production Readiness | 0/2 | Not started | - |
