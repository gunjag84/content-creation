# Phase 1: Foundation & Rendering - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Working Electron app with HTML-to-PNG rendering at Instagram dimensions (1080x1350 feed, 1080x1920 story) and persistent data storage (SQLite + JSON config). This phase delivers the scaffolding, rendering pipeline, and data layer that all subsequent phases build on. No settings UI, no content generation, no performance tracking - just the foundation.

</domain>

<decisions>
## Implementation Decisions

### Rendering approach
- Use BrowserWindow.capturePage (Electron built-in) instead of Puppeteer - no extra dependencies, lighter app
- Dedicated persistent hidden BrowserWindow for rendering - stays loaded, fast captures, main window stays clean
- Carousel slides rendered sequentially in the same hidden window - simple, predictable, fast enough for 3-10 slides
- Rendered PNGs saved to temp directory first, then user picks export location via native file dialog on explicit export

### Database schema design
- Full schema created upfront in Phase 1 - all tables (posts, stories, performance, balance_matrix, settings_versions) defined now, avoiding migration headaches later
- Single schema SQL file (not a migration system) - one file defines all tables, version check + ALTER for updates
- better-sqlite3 as the SQLite library - synchronous API, fastest Node binding, native rebuild handled by electron-vite
- Thin wrapper over raw SQL - small helper layer for common operations, no ORM, full control over queries

### Project structure
- electron-vite as build/scaffolding tool - Vite-based, fast HMR, handles main/preload/renderer split, TypeScript out of the box
- Typed IPC with preload bridge - shared types file defining channels, preload exposes typed API object (window.api), type-safe and secure
- Zustand for frontend state management - lightweight, no providers, simple store pattern
- TypeScript strict mode enabled - catches more bugs at compile time

### App shell & initial UI
- Left sidebar navigation - collapsible, icons + labels, scales well as features are added
- Nav shell + test page for Phase 1 - sidebar with placeholder sections (Dashboard, Create Post, Settings), one working test page demonstrating HTML-to-PNG rendering
- Dark mode as default theme - professional content-tool feel, easier on eyes for long sessions
- shadcn/ui component library - copy-paste components built on Radix + Tailwind, accessible, customizable, dark-mode ready

### JSON settings storage
- Single settings.json file with all 11 config areas as top-level keys
- Copy-on-write versioning - on every save, copy current to versions/settings_TIMESTAMP.json, then write new settings.json
- Zod schema validation on read and write - catches corruption, provides TypeScript types automatically
- Generate defaults on first launch - sensible defaults for system settings, empty content areas for user to fill later

### Secure API key storage
- API key entered via Settings page field (implemented in Phase 2 UI, storage layer built in Phase 1)
- Full safeStorage implementation in Phase 1 - encrypt/decrypt ready, test with dummy key
- API key stored in separate encrypted file - never appears in settings.json, clean separation for backup safety

### Testing strategy
- Claude's discretion on test framework (likely Vitest given electron-vite stack)
- Core paths only - test DB operations (CRUD, WAL, integrity), settings read/write/versioning, rendering pipeline (HTML->PNG)
- Skip E2E tests for Phase 1 - manual verification of app launch and rendering, E2E added later

### Build & packaging
- electron-builder for packaging
- Portable .exe format (no installer) - simple double-click to run, NSIS installer deferred to later
- Phase 1 delivers dev mode + working build script - npm run dev for development, build/package pipeline configured and tested but polished .exe is Phase 4

### Claude's Discretion
- Test framework selection (Vitest vs Jest - likely Vitest given electron-vite)
- Loading skeleton and error state handling
- Exact spacing, typography, and UI polish
- Progress indicator implementation details
- Compression and temp file handling for rendering

</decisions>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches. The blueprint document (content-creation-system-blueprint-final.md) contains detailed specs for all 11 settings areas, post mechanics, story tools, and the master prompt template that downstream phases will implement.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None - this is a greenfield project with no existing source code

### Established Patterns
- None yet - Phase 1 establishes all patterns

### Integration Points
- Blueprint document at project root contains full system spec
- Input files directory contains brand content (voice, persona, themes, etc.) for the LEBEN.LIEBEN brand - useful for testing with real data

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-rendering*
*Context gathered: 2026-03-10*
