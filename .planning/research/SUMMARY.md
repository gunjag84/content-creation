# Project Research Summary

**Project:** AI-powered Instagram Content Creation System
**Domain:** Electron Desktop Application
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This is an Electron desktop app for AI-powered Instagram content creation with a performance-based learning system. The product combines three capabilities no competitor currently integrates: (1) AI text generation with deep brand context via Claude API, (2) visual template system with custom design and HTML-to-PNG rendering, and (3) performance-based learning that improves recommendations over time. The recommended approach uses Electron 40.8.0 with React 19, TypeScript 6.0, and better-sqlite3 for local data, focusing on single-brand desktop MVP before considering web deployment or multi-brand features.

The architecture follows standard Electron patterns with strict IPC security boundaries: renderer process (React UI) communicates with main process (Node.js services) via contextBridge-secured preload script. Critical services include ConfigService (JSON settings with versioning), DatabaseService (SQLite for learning data), AIService (Claude API with master prompt assembly), and RenderService (Puppeteer HTML-to-PNG pipeline). The key architectural decision is using Electron's built-in BrowserWindow.capturePage instead of Puppeteer to avoid 300MB+ dependency and protocol compatibility issues.

The primary risks center on Electron-specific production failures that work perfectly in development: Puppeteer executable path breaking after packaging, better-sqlite3 ABI mismatches requiring electron-rebuild, cross-platform font rendering inconsistencies, and SQLite corruption from improper shutdown. All of these have known prevention strategies that must be implemented during Phase 1 (rendering) and Phase 2 (data layer) rather than deferred to pre-launch polish. The research confidence is HIGH across all areas with comprehensive source validation from official documentation and 2026-current community patterns.

## Key Findings

### Recommended Stack

The stack prioritizes developer experience, production reliability, and avoiding over-engineering for single-brand desktop MVP. Electron 40.8.0 provides the latest Chromium 144 and Node 24.11 with built-in screenshot capabilities. React 19.2.4 with TypeScript 6.0 RC gives modern patterns without migration risk (TypeScript 7.0 Go-based rewrite coming later). electron-vite delivers instant HMR for renderer and hot reload for main process, superior to webpack-based alternatives. better-sqlite3 provides synchronous SQLite with straightforward migration path to PostgreSQL if web deployment happens.

**Core technologies:**
- **Electron 40.8.0**: Desktop framework with built-in BrowserWindow.capturePage for HTML-to-PNG without Puppeteer dependencies
- **React 19.2.4 + TypeScript 6.0**: UI framework with latest stable patterns, full type safety across IPC boundaries
- **electron-vite**: Next-gen build tool with Vite-powered instant HMR, pre-configured for Electron, compiles to V8 bytecode
- **better-sqlite3 12.6.2**: Fastest SQLite library for Node.js, synchronous API, works seamlessly with Electron, 4,292 projects use it
- **Tailwind CSS 4.2.1**: Latest v4 with CSS-first @theme configuration, 5x faster engine, dedicated Vite plugin
- **@anthropic-ai/sdk**: Official Claude API client with idiomatic TypeScript, automatic retries, streaming, tool use helpers

**Supporting libraries:**
- **electron-store**: JSON settings persistence in app.getPath('userData'), ESM-native for Electron 30+
- **dnd-kit**: Modern lightweight drag-and-drop for React, hooks API, React 19 compatible
- **react-konva**: Canvas rendering for visual zone editor on uploaded images
- **zustand**: Minimal 1KB state library for UI state (wizard, editor, current post)
- **react-router 7.13.1**: Client-side routing for settings, workflow, performance views

**What NOT to use:**
- **Puppeteer in Electron**: Protocol compatibility issues, 300MB+ download when Chromium bundled - use BrowserWindow.capturePage instead
- **Drizzle ORM**: Type safety illusion, adds complexity for simple learning queries - use better-sqlite3 directly with prepared statements
- **localStorage for settings**: 5-10MB limit, loses type safety - use electron-store with schema validation
- **React Beautiful DnD**: Deprecated, no React 19 support - use dnd-kit

### Expected Features

The feature landscape is well-defined with clear table stakes (users expect), differentiators (competitive advantage), and anti-features (commonly requested but problematic). The MVP scope balances validating the core loop (recommendation → generation → rendering → performance tracking → learning) against feature completeness.

**Must have (table stakes):**
- AI text generation for captions and hooks - 85% of marketers use AI writing tools in 2026
- Visual template system with brand consistency - required for on-brand content at scale
- Instagram format support (Feed 1080x1350, Stories 1080x1920) - multi-format is baseline expectation
- Performance analytics with manual input - data-driven decisions require metrics, API integration deferred to v1.x
- Content scheduling and preview - 100% of social tools offer these as baseline
- Hashtag management and multi-post workflow - discovery and iteration are fundamental

**Should have (competitive differentiators):**
- Performance-based learning system with balance matrix - AI predicts what works from actual data, not guesses
- Guided content recommendation flow - suggests topic + mechanic combinations, reduces decision fatigue
- Visual template builder with drag-and-drop zones - no design skills needed, competitive alternative to Canva's pre-built templates
- Master prompt system - assembles all 11 brand config areas automatically for consistent generation
- Story-feed content linking - Stories as satellite content extending feed post reach
- Content pillar balancing - strategic mix (50% Generate Demand, 30% Convert, 20% Nurture) automated

**Defer (v2+):**
- Instagram Graph API direct posting - manual export (download PNG, upload in app) validates core loop without API complexity
- Carousel posts - add after single-image validated
- Video/Reel generation - massive complexity increase, defer until image content proven
- Multi-brand UI - data model is brand-aware but single-brand UI reduces complexity for MVP
- Web deployment - desktop validates faster, React/Tailwind supports migration later

**Anti-features to avoid:**
- Pre-built template library - creates generic content with no brand differentiation, authenticity beats polish in 2026
- Real-time Instagram preview - perfect match impossible across devices/OS, high-fidelity preview with disclaimer instead
- Provider-agnostic LLM layer - abstraction dilutes prompt optimization, optimize deeply for Claude only
- Infinite customization - decision fatigue and support burden, use opinionated defaults with strategic flexibility

### Architecture Approach

Standard Electron architecture with strict process separation and IPC security boundaries. Renderer process (React + Tailwind UI) has zero Node.js access and communicates exclusively via preload script's contextBridge-exposed API. Main process contains all business logic in service layer (ConfigService, DatabaseService, AIService, RenderService) with thin IPC handler orchestration. Data storage uses JSON files for settings (electron-store with versioning) and SQLite for operational data (learning history, performance metrics, posts).

**Major components:**
1. **Renderer Process** - React components with Tailwind CSS, handles UI and user interactions, communicates via window.api.* typed interface
2. **Preload Script** - Security boundary exposing whitelisted IPC functions via contextBridge, never exposes raw ipcRenderer
3. **Main Process Services** - ConfigService (JSON settings), DatabaseService (SQLite learning data), AIService (Claude API + prompt assembly), RenderService (BrowserWindow.capturePage HTML-to-PNG)
4. **IPC Handlers** - Request routing and validation, always use invoke/handle async pattern, never sendSync
5. **Data Storage** - JSON files in app.getPath('userData')/settings for config, SQLite database for queryable time-series performance data

**Key patterns:**
- **IPC Invoke/Handle**: All renderer-initiated operations use async invoke/handle, never synchronous to avoid blocking main process
- **Service Layer Isolation**: Business logic separated from IPC handlers for testability and reusability
- **Context Isolation**: Always enabled with nodeIntegration: false, sandbox: true for security
- **JSON Config with Versioning**: Timestamp backups on every settings write to prevent data loss
- **Puppeteer Lifecycle Management**: Reuse single browser instance across renders, close only on idle timeout to prevent memory leaks

**Scaling considerations:**
- Single-brand MVP architecture handles thousands of posts easily with no changes needed
- Multi-brand (Phase 2) only requires UI changes and brand_id filtering, data model already supports it
- Web deployment (Phase 3+) requires major refactor: services to Node.js server, IPC to HTTP API, SQLite to PostgreSQL
- First bottleneck will be Puppeteer rendering if 10+ simultaneous - move to worker threads or queue system

### Critical Pitfalls

These are production-killing issues that work perfectly in development and surface only after packaging or in production use. Every one has known prevention strategies.

1. **Puppeteer Executable Path Breaks After Packaging** - Chromium path breaks when packaged to ASAR. Use BrowserWindow.capturePage instead (built-in, no dependencies) or configure asarUnpack for Puppeteer. Must test production build on clean Windows VM in Phase 1.

2. **better-sqlite3 Native Module ABI Mismatch** - Compiled for wrong Node.js version causes startup crashes. Add @electron/rebuild, configure postinstall script, set npmRebuild: true in electron-builder, unpack from ASAR. Must verify packaged app performs SQLite operations in Phase 2.

3. **HTML-to-Image Rendering Differs Across Environments** - System fonts render differently on Windows/macOS, breaks layouts. Launch with --font-render-hinting=none, bundle custom fonts with @font-face, generous padding in text zones. Must test on clean Windows VM in Phase 1.

4. **SQLite Database Corruption from Improper Shutdown** - Process killed during write corrupts database. Enable WAL mode (PRAGMA journal_mode=WAL), set PRAGMA synchronous=NORMAL, implement graceful shutdown with app.on('before-quit'), run integrity_check on startup. Must be part of database initialization in Phase 2.

5. **Main Process Blocking from Synchronous Operations** - Entire app freezes during Puppeteer renders. Never use ipcRenderer.sendSync(), always invoke/handle async pattern, show loading UI immediately, use page.waitForSelector() not waitForTimeout(). Must establish async IPC pattern in Phase 1 foundation.

6. **Memory Leaks from Unclosed Puppeteer Instances** - Memory grows to 2GB+ after 20-30 renders. Reuse single browser instance, close pages after render, implement browser timeout, use try/finally to ensure cleanup. Must verify no chromium.exe leaks after 50 renders in Phase 1.

7. **Claude API Token Stored Insecurely** - Plain text in settings.json exposes token to theft. Use Electron's safeStorage API for encryption at rest (DPAPI on Windows, Keychain on macOS), never log tokens, mask in UI. Must implement in Phase 3 settings before user testing.

8. **Race Conditions in JSON Settings File Writes** - Concurrent writes corrupt settings.json. Implement write queue, use atomic writes (temp file + fs.rename), debounce rapid changes, add file locking with proper-lockfile. Must implement before settings editor production in Phase 3.

## Implications for Roadmap

Based on research, suggested 6-phase structure following dependency graph and pitfall prevention order:

### Phase 1: Core Rendering Pipeline
**Rationale:** HTML-to-PNG rendering is the foundation for visual content output. Must establish working production build early because Puppeteer/font issues only surface after packaging. Validates async IPC patterns that all later phases depend on. Critical pitfalls (executable path, font rendering, main process blocking, memory leaks) must be prevented here before building on top.

**Delivers:** Working BrowserWindow.capturePage implementation that renders HTML templates to PNG at Instagram dimensions (1080x1350 feed, 1080x1920 story), tested in packaged .exe on clean Windows VM.

**Addresses:** HTML/CSS rendering pipeline (table stakes), visual template system foundation

**Avoids:** Pitfalls #1 (Puppeteer paths), #3 (font rendering), #5 (main process blocking), #6 (memory leaks)

**Technical scope:**
- Electron project scaffolding with electron-vite + React + TypeScript + Tailwind
- Preload script with basic IPC structure and contextBridge API
- RenderService in main process using BrowserWindow.capturePage
- IPC handler for render operations with async invoke/handle pattern
- Browser instance lifecycle management (reuse, cleanup, timeout)
- Font bundling strategy with @font-face
- Production build testing on Windows VM

### Phase 2: Data Layer Foundation
**Rationale:** Settings storage and learning database must exist before any features can consume them. SQLite corruption and ABI mismatch pitfalls must be addressed at initialization, not retrofitted. Services are independent and can be built in parallel. Brand-aware data model (brand_id columns) prevents painful refactor when multi-brand features arrive.

**Delivers:** ConfigService for JSON settings with versioning, DatabaseService with SQLite learning data, working in packaged production app with WAL mode and integrity checks.

**Uses:** better-sqlite3 with electron-rebuild, electron-store for JSON config

**Addresses:** Settings persistence, performance tracking foundation, brand-aware data model

**Avoids:** Pitfalls #2 (ABI mismatch), #4 (SQLite corruption), #7 (token security partially - storage exists)

**Technical scope:**
- ConfigService with JSON read/write, timestamp versioning, backup strategy
- DatabaseService with SQLite connection, schema migrations, WAL mode, integrity checks
- IPC handlers for config and database operations
- React hooks (useSettings, useDatabase) to consume IPC
- Graceful shutdown handler (app.on('before-quit'))
- electron-rebuild configuration and asarUnpack for better-sqlite3
- Production build verification for SQLite operations

### Phase 3: Settings Management UI
**Rationale:** Brand configuration must exist before AI generation can produce on-brand content. All 11 config areas (voice, persona, themes, mechanics, visual guidance, etc.) are dependencies for master prompt assembly. Settings race conditions and API token security must be resolved here since settings editor is the entry point for sensitive data.

**Delivers:** Complete settings editor with 11 configuration areas, visual template creation with drag-and-drop zone editor, secure API token storage via safeStorage.

**Addresses:** Brand voice configuration (table stakes), visual template builder (differentiator), master prompt system foundation

**Avoids:** Pitfalls #4 (JSON write races), #7 (token insecurity), #9 (form re-render storms)

**Technical scope:**
- Settings screen layout with React components
- Form components for 11 config areas with field-level subscriptions to avoid re-render storms
- Visual template editor using dnd-kit or react-konva for zone definition on uploaded images
- Write queue or locking for settings file operations
- safeStorage integration for Claude API token encryption
- Atomic writes (temp file + fs.rename)
- Debounced auto-save with manual "Save" confirmation

### Phase 4: AI Integration & Text Generation
**Rationale:** Depends on ConfigService for prompt assembly and settings for brand context. Claude API integration is straightforward with official SDK. Master prompt loader reads all config files and assembles context dynamically. Text generation is core value proposition but can't exist until brand configuration is defined.

**Delivers:** Working AI text generation via Claude API with master prompt system that assembles all 11 config areas, text editor with generation trigger and editing.

**Uses:** @anthropic-ai/sdk official TypeScript client

**Addresses:** AI text generation (table stakes, core value), master prompt system (differentiator)

**Technical scope:**
- AIService with Claude API client, error handling, retry logic
- Master prompt loader that reads brand-voice.json, persona.json, themes, mechanics, etc.
- Dynamic prompt assembly from config + user-provided context
- IPC handler for text generation operations
- React text editor component with generation trigger
- API key loading from safeStorage
- Rate limiting and usage warnings
- Token validation and rotation flow

### Phase 5: Full Post Workflow & Learning System
**Rationale:** Integrates all previous components into end-to-end workflow. Learning system needs DatabaseService and multiple workflow executions to learn from. Performance tracking feeds learning with manual input (Instagram Graph API deferred). Balance matrix implements equal rotation cold start, then soft-signal recommendations as data accumulates. This is the key differentiator feature.

**Delivers:** Complete post generation workflow (recommendation → selection → text generation → editing → rendering → visual review → export), performance-based learning system with balance matrix, story generation linked to feed posts.

**Implements:** Guided content recommendations (differentiator), performance-based learning (key differentiator), story-feed linking (differentiator), content pillar balancing

**Addresses:** Full post workflow (table stakes), learning system (competitive advantage), story generation (table stakes)

**Technical scope:**
- Workflow state machine managing recommendation → generation → rendering flow
- Recommendation engine using theme/mechanic catalog with rules
- Balance matrix implementation (equal rotation cold start, soft-signal tracking)
- Post mechanic catalog (7 formats with structure rules)
- Theme hierarchy and pillar assignment
- Performance tracking UI with manual input forms
- Story generation workflow with 18 Instagram tools catalog
- Story-feed relationship model in database
- Draft state management and edit history
- Content pillar distribution tracking and balancing slider

### Phase 6: Production Readiness & Polish
**Rationale:** Logging infrastructure, error handling, production debugging capabilities must exist before external testing. UX polish (preview, progress indicators, error messages, onboarding) transforms functional prototype into usable product. This phase addresses pitfall #10 (no production debugging) and UX pitfalls.

**Delivers:** Comprehensive logging with winston/electron-log, user-friendly error messages, onboarding wizard, preview-before-export flow, progress indicators, crash recovery.

**Addresses:** Preview before publish (table stakes), content scheduling UI (table stakes), production debugging, UX completeness

**Avoids:** Pitfall #10 (no debugging in production)

**Technical scope:**
- winston or electron-log integration logging to app.getPath('userData')/logs/
- Uncaught exception handlers (process.on('uncaughtException'), window.onerror)
- "Export Logs" feature for user troubleshooting
- Log rotation (size-based or daily, keep last 7 days)
- User-friendly error message translations from technical errors
- Progress indicators for long operations (rendering, generation)
- Preview screen with "Looks good?" confirmation before export
- First-run onboarding wizard (brand setup, template creation, first post)
- Auto-save draft recovery on crash
- Scheduling/calendar view UI
- Image auto-scale/crop for uploaded assets
- Memory monitoring and warnings

### Phase Ordering Rationale

- **Rendering first (Phase 1)** because production build issues (Puppeteer paths, fonts) only surface after packaging. Catching these early prevents painful late-stage refactors. Establishes async IPC patterns that all later phases follow.

- **Data layer second (Phase 2)** because settings and database must exist before features can consume them. SQLite WAL mode and integrity checks are initialization concerns, not add-ons. Brand-aware schema prevents multi-brand migration pain.

- **Settings third (Phase 3)** because AI generation needs brand context. Writing race conditions and token security must be resolved before sensitive data enters system. Template editor enables visual content creation.

- **AI integration fourth (Phase 4)** because it depends on settings for prompt assembly. Official SDK makes integration straightforward. Master prompt system is architectural foundation for consistent generation.

- **Workflow fifth (Phase 5)** because it orchestrates all previous components. Learning system needs database and multiple executions. This validates the complete value proposition (generate → render → track → learn → improve).

- **Production readiness sixth (Phase 6)** because logging and error handling can't be retrofitted easily. Transforms working prototype into shippable product with usable UX.

**Dependency chain:**
```
Rendering Pipeline (Phase 1) - foundational for all visual output
    ↓
Data Layer (Phase 2) - storage for settings and learning
    ↓
Settings UI (Phase 3) - brand configuration for generation
    ↓
AI Integration (Phase 4) - text generation with brand context
    ↓
Full Workflow (Phase 5) - orchestrates all components
    ↓
Production Polish (Phase 6) - makes it shippable
```

### Research Flags

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Rendering)**: BrowserWindow.capturePage is documented in Electron official docs, patterns are straightforward
- **Phase 2 (Data Layer)**: better-sqlite3 and electron-store have clear documentation and established patterns
- **Phase 3 (Settings)**: Form state management in React is well-trodden territory, safeStorage has official docs
- **Phase 4 (AI)**: @anthropic-ai/sdk official documentation is comprehensive, integration is standard HTTP client pattern
- **Phase 6 (Production)**: winston/electron-log have extensive documentation, error handling patterns are standard

Phases that might benefit from targeted research during planning:
- **Phase 5 (Learning System)**: Balance matrix and soft-signal recommendation logic are custom algorithms. Research might validate approach against ML recommendation system patterns or explore simpler alternatives if complexity grows. However, the learning system design is already detailed in project conception, so this is more "validation" than "exploration."

**Overall recommendation:** All phases have sufficient research clarity to proceed directly to requirements definition and task breakdown. No phases require `/gsd:research-phase` during roadmap planning. The learning system in Phase 5 has the highest conceptual complexity but is well-defined from project inception.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from official releases as of March 10, 2026. Electron 40.8.0, React 19.2.4, TypeScript 6.0 RC, better-sqlite3 12.6.2, Tailwind 4.2.1 confirmed current. electron-vite and supporting libraries actively maintained with strong community adoption. |
| Features | HIGH | Competitor analysis covers 2026 landscape (Canva AI, Later/Buffer/Planoly, Jasper/Copy.ai). Instagram trends validated (algorithm changes, 2026 best practices). MVP scope aligns with 85% of marketers using AI tools. Anti-features identified from common mistakes documented in community. |
| Architecture | HIGH | Standard Electron patterns from official documentation. IPC security, context isolation, service layer separation are established best practices. Puppeteer integration issues well-documented with solutions. Project structure follows community-validated conventions from LogRocket, Medium tutorials. |
| Pitfalls | HIGH | All critical pitfalls sourced from production experience reports (GitHub issues, DEV Community, Stack Overflow). Puppeteer executable path, better-sqlite3 ABI mismatch, SQLite corruption, font rendering issues have documented occurrence patterns and verified solutions. Prevention strategies tested in community. |

**Overall confidence:** HIGH

Research is comprehensive with primary sources (official documentation, release notes, GitHub repositories) for all core technology decisions. Feature landscape validated against 2026 competitor analysis from multiple independent sources. Pitfalls extracted from real production experience reports with verified solutions. Architecture follows established patterns with extensive community validation.

### Gaps to Address

No significant gaps that block MVP development. Areas requiring validation during implementation:

- **Learning system effectiveness**: Balance matrix and soft-signal recommendations are conceptually sound but effectiveness depends on data quality and tuning thresholds. Plan to validate with real performance data during Phase 5 and iterate on recommendation weights if needed. Consider A/B testing cold start vs immediate learning if performance seems better than random.

- **BrowserWindow.capturePage vs Puppeteer trade-off**: Research recommends BrowserWindow.capturePage to avoid Puppeteer dependencies/issues, but Puppeteer offers more control over rendering (waiting for fonts, animations, network idle). If BrowserWindow.capturePage proves insufficient for complex templates, fallback to Puppeteer with proper configuration (executablePath, asarUnpack). Make this decision in Phase 1 during rendering implementation.

- **Manual performance tracking adoption**: MVP relies on manual input (reach, engagement, saves) with Instagram Graph API deferred to v1.x. User discipline required for learning system to work. If manual tracking adoption is low during beta, prioritize API integration higher. Consider automated reminders or make tracking part of post-publish workflow.

- **Font rendering consistency**: Cross-platform font rendering is complex with OS-level hinting differences. Bundling fonts and --font-render-hinting=none should solve it, but edge cases may exist. Test on Windows 10, Windows 11, and macOS during Phase 1. If issues persist, consider rendering with specific font subsets or fallback to web-safe fonts with warning.

- **Multi-brand migration timing**: Data model is brand-aware but UI is single-brand for MVP. When to add multi-brand UI depends on validation with single-brand users first. Don't prematurely optimize for agencies until solopreneur/small brand value is proven. Track feature requests during beta to gauge demand.

All gaps have clear decision points and fallback strategies. None block starting Phase 1 implementation.

## Sources

### Primary (HIGH confidence)
- [Electron Releases](https://releases.electronjs.org/) - Electron 40.8.0 version verification (March 5, 2026)
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - Architecture patterns
- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc) - IPC invoke/handle patterns
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) - Security boundaries
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security) - Context isolation, node integration
- [Electron safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage) - Token encryption
- [React Versions](https://react.dev/versions) - React 19.2.4 latest version
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/) - TypeScript 6.0 RC announcement
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3) - Version 12.6.2, compatibility notes
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) - Official SDK features
- [Tailwind CSS Releases](https://github.com/tailwindlabs/tailwindcss/releases) - v4.2.1 verification

### Secondary (MEDIUM confidence)
- [The best Instagram AI tools in 2026 based on real testing | Jotform](https://www.jotform.com/ai/agents/instagram-ai-tools/) - Competitor analysis
- [Buffer vs Planoly 2026 | SocialRails](https://socialrails.com/blog/buffer-vs-planoly) - Feature comparison
- [Jasper Social Media Content Generator](https://www.jasper.ai/blog/social-media-content-generator) - AI tool capabilities
- [How the Instagram Algorithm Works 2026 | Sprout Social](https://sproutsocial.com/insights/instagram-algorithm/) - Platform trends
- [Advanced Electron.js Architecture - LogRocket](https://blog.logrocket.com/advanced-electron-js-architecture/) - Architecture patterns
- [Desktop Apps with Electron, React and SQLite](https://tuliocalil.com/desktop-apps-with-electron-react-and-sqlite/) - Integration patterns
- [Puppeteer in Electron: Compatibility Issues](https://community.latenode.com/t/integrating-puppeteer-with-electron-compatibility-issues/13575) - Known issues
- [Puppeteer in Node.js: Common Mistakes](https://blog.appsignal.com/2023/02/08/puppeteer-in-nodejs-common-mistakes-to-avoid.html) - Pitfall documentation
- [SQLite Database Corruption: Prevention](https://runebook.dev/en/articles/sqlite/howtocorrupt) - WAL mode guidance
- [A Step-by-Step Guide to Integrating Better-SQLite3 with Electron](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16) - Setup patterns
- [electron-vite Official Docs](https://electron-vite.org/) - Build tool features
- [dnd-kit Docs](https://docs.dndkit.com/) - Drag-and-drop library
- [Zustand vs Redux 2026](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/) - State management comparison

### Tertiary (LOW confidence)
- Community blog posts on Electron production deployment challenges (validated against multiple sources)
- Medium tutorials on React form performance optimization (concepts verified, not implementations)

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
