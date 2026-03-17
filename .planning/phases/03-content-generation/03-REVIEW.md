# Phase 3: Content Generation - CEO Plan Review

**Reviewed:** 2026-03-12
**Mode:** HOLD SCOPE
**Status:** Review complete, ready for planning

## System Audit

- **Branch:** master (single-branch workflow)
- **Codebase:** Clean - 0 TODO/FIXME/HACK comments
- **Phase 2:** 100% complete (15/15 plans, 9 gap closures)
- **Phase 3:** 0% - only 03-CONTEXT.md exists, plans TBD
- **Stashed work:** None
- **Open PRs:** None
- **Key finding:** `@anthropic-ai/sdk` not installed. `create` route still points to TestRender (Phase 1 artifact).
- **Retrospective pattern:** Phase 2 had 9 gap closure plans (mostly dark theme, template builder, CRUD). Expect similar UI polish needs in Phase 3.

## Scope

33 requirements in scope: POST-01 to POST-17, STORY-01 to STORY-10, LEARN-01 to LEARN-06.
No scope expansion. No scope reduction. Maximum rigor on execution quality.

## Architecture

```
  ELECTRON RENDERER
  +---------------------------------------------------------------+
  |  Sidebar          Content Area                                 |
  |  - Dashboard  --> CreatePostWizard (NEW)                       |
  |  - Create         Step 1: Recommend & Select                   |
  |  - Settings       Step 2: Generate (Claude API streaming)      |
  |                   Step 3: Edit Text (dual panel + live preview)|
  |                   Step 4: Render & Review (Puppeteer PNGs)     |
  |                   Step 5: Stories (auto-generate on entry)     |
  |                                                                |
  |  createPostStore (Zustand, NEW)    settingsStore (existing)    |
  +---------------------------------------------------------------+
                    | IPC (contextBridge)
  ELECTRON MAIN
  +---------------------------------------------------------------+
  |  NEW IPC Handlers:                                             |
  |  - generation.ts (stream start/token/complete/error/cancel)    |
  |  - posts.ts (create, update, list drafts)                      |
  |  - balance.ts (get matrix, get recommendation)                 |
  |  - export.ts (export post + stories to folder)                 |
  |                                                                |
  |  NEW Services:                                                 |
  |  - ClaudeService (API calls, streaming, abort)                 |
  |  - PromptAssemblyService (template filling from settings)      |
  |  - RecommendationService (balance-based selection, warnings)   |
  |  - ExportService (file writing to user-chosen folder)          |
  |  - StoryService (story proposal generation via Claude)         |
  |                                                                |
  |  EXISTING Services (reused directly):                          |
  |  - RenderService (HTML-to-PNG, carousel rendering)             |
  |  - SettingsService (load all 11 config areas)                  |
  |  - SecurityService (API key decrypt)                           |
  |                                                                |
  |  DATA LAYER (existing, extended):                              |
  |  - SQLite: posts, slides, stories, balance_matrix              |
  |  - JSON: settings files                                        |
  +---------------------------------------------------------------+
                    | HTTPS
  CLAUDE API (Anthropic)
  - messages.create() with streaming
  - tool_use for structured extraction
```

### Wizard State Machine

```
  IDLE --> SELECTING --> GENERATING --> EDITING --> RENDERING --> STORIES --> EXPORTED
   |          |              |            |            |             |
   v          v              v            v            v             v
  (reset)  (user picks)  (streaming)  (user edits)  (puppeteer)  (story gen)
```

### Streaming Pattern

`webContents.send` event stream from main to renderer:
- Main process: `mainWindow.webContents.send('generation:token', chunk)`
- Renderer: `ipcRenderer.on('generation:token', callback)`
- Cancellation: renderer sends `generation:cancel`, main calls `AbortController.abort()`

### Prompt Assembly

Lives in main process as `PromptAssemblyService`. Reads settings from `SettingsService`, template zones from DB, formats into final prompt. Renderer never touches raw prompt - only sees read-only "View prompt" preview.

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Review mode | HOLD SCOPE | 33 requirements is already ambitious. Rigor > ambition |
| 2 | HTML escaping for AI output | Build in Phase 3 | Claude output injected into HTML templates - must escape `<script>`, `&` etc. |
| 3 | API key validation | Validate on first gen attempt | Lightweight API test call before first real generation. Cache result |
| 4 | Draft resumability | Deferred to TODOS.md | M effort, P2. Schema supports it. Build after wizard store shape is final |
| 5 | Response format | tool_use / structured JSON | Reliable parsing, no regex fragility |
| 6 | Streaming UX | Two-phase: stream text visibly, then parse | Phase A: stream text word-by-word (Claude.ai feel). Phase B: parse structured data from streamed text or second tool_use call |
| 7 | Story generation trigger | Auto-generate on Step 5 entry | Seamless flow, no extra clicks |
| 8 | Dashboard balance widget | Build in Phase 3 | Needed for LEARN-01/LEARN-06 verification. Simple horizontal bars |
| 9 | Live HTML preview in Step 3 | Build in-browser preview | Core UX from context doc. iframe/div render, updates as user types (debounced) |
| 10 | Export file collision | Silent overwrite | Same filename = same content. Date+slug naming prevents cross-post collision |

## Mandatory Implementation Details

These have one correct answer - no decision needed, must be in plans:

1. **AbortController for stream cancellation** - cleanup on wizard unmount via `useEffect` return
2. **`removeAllListeners` for streaming IPC** - prevent memory leaks when wizard unmounts
3. **Confirmation dialog before "New Draft"** - prevent accidental data loss (POST-12 overwrites all content)
4. **Character limit enforcement per zone** - respect template `max_lines` config
5. **Disable "Generate" button during active generation** - prevent double-click / duplicate API calls
6. **Structured logging for Claude API calls** - log: prompt length, model, start time, token count, duration, success/error
7. **`escapeHtml()` utility** - sanitize all AI-generated text before HTML template injection

## Error & Rescue Registry

```
  METHOD/CODEPATH                  | WHAT CAN GO WRONG                    | EXCEPTION CLASS
  ---------------------------------|--------------------------------------|--------------------------
  ClaudeService.stream()           | API key missing                      | ConfigError
                                   | API key invalid/expired              | Anthropic.AuthError
                                   | API timeout                          | Anthropic.APIConnectionError
                                   | Rate limited (429)                   | Anthropic.RateLimitError
                                   | Claude returns refusal               | ContentFilterError (custom)
                                   | Network down                         | Anthropic.APIConnectionError
                                   | Malformed JSON in response           | JSON.SyntaxError
                                   | Stream interrupted mid-response      | Anthropic.APIError
                                   | Model overloaded (529)               | Anthropic.InternalServerError
  PromptAssemblyService.assemble() | Settings not loaded                  | ConfigError
                                   | Template not found                   | NotFoundError
                                   | Template zones_config invalid JSON   | JSON.SyntaxError
                                   | Master prompt template empty         | ConfigError
  RenderService.renderToPNG()      | Hidden window destroyed              | Error ('not initialized')
                                   | Disk full on temp file write         | ENOSPC
                                   | capturePage returns empty            | RenderError (custom)
  ExportService.exportPost()       | User cancels folder picker           | null return (not error)
                                   | Destination folder not writable      | EACCES
                                   | Disk full during PNG write           | ENOSPC
  RecommendationService.recommend()| No themes active in settings         | ConfigError
                                   | No mechanics active                  | ConfigError
                                   | Balance matrix empty (cold start)    | Handled: equal rotation
                                   | Division by zero in weighting        | Guard required
  IPC generation stream            | Listener memory leak                 | Prevention: removeAllListeners
                                   | User navigates away mid-stream       | AbortController.abort()
```

```
  EXCEPTION CLASS                  | RESCUED? | RESCUE ACTION                    | USER SEES
  ---------------------------------|----------|----------------------------------|--------------------------
  ConfigError (missing API key)    | Y        | Block generation, show setup msg | "Set your API key in Settings"
  Anthropic.AuthError              | Y        | Show error, link to settings     | "API key invalid. Check Settings"
  Anthropic.APIConnectionError     | Y        | Retry 1x, then show error        | "Could not reach Claude. Check connection"
  Anthropic.RateLimitError         | Y        | Backoff 30s + auto-retry 1x      | "Rate limited. Retrying..."
  ContentFilterError               | Y        | Show refusal reason              | "Claude declined. Try different topic"
  JSON.SyntaxError (response)      | Y        | Show error, offer retry          | "Response format error. Try again"
  Anthropic.APIError (stream)      | Y        | Preserve partial text, offer retry| "Generation interrupted. Resume or retry?"
  Anthropic.InternalServerError    | Y        | Wait 10s, retry 1x              | "Claude overloaded. Retrying..."
  NotFoundError (template)         | Y        | Block generation                 | "Selected template not found"
  ConfigError (no active themes)   | Y        | Block recommendation             | "No active themes. Configure in Settings"
  EACCES (export)                  | Y        | Show error, offer new folder     | "Cannot write to folder. Pick another"
  ENOSPC (disk full)               | Y        | Show error                       | "Disk full. Free space and try again"
  SqliteError                      | Y        | Log full context, show generic   | "Database error. Check logs"
```

**CRITICAL GAPS: 0** - All error paths have rescue actions.

## Failure Modes Registry

```
  CODEPATH                 | FAILURE MODE          | RESCUED | TEST | USER SEES     | LOGGED
  -------------------------|-----------------------|---------|------|---------------|-------
  ClaudeService.stream()   | API timeout           | Y       | Y    | Error msg     | Y
  ClaudeService.stream()   | Rate limited          | Y       | Y    | Retry msg     | Y
  ClaudeService.stream()   | Auth error            | Y       | Y    | Settings link | Y
  ClaudeService.stream()   | Refusal               | Y       | Y    | Warning msg   | Y
  ClaudeService.stream()   | Stream break          | Y       | Y    | Partial+retry | Y
  ClaudeService.stream()   | Malformed response    | Y       | Y    | Error+retry   | Y
  PromptAssembly.assemble()| Template not found    | Y       | Y    | Error msg     | Y
  PromptAssembly.assemble()| Settings not loaded   | Y       | Y    | Error msg     | Y
  Recommendation.recommend | No active themes      | Y       | Y    | Config msg    | Y
  Recommendation.recommend | Cold start (no data)  | Y       | Y    | Equal rotation| Y
  ExportService.export()   | Folder not writable   | Y       | Y    | Error+retry   | Y
  ExportService.export()   | Disk full             | Y       | Y    | Error msg     | Y
  ExportService.export()   | File exists           | Y       | Y    | Silent overwrite | Y
  IPC generation:cancel    | Nav away mid-stream   | Y       | Y    | Nothing       | Y
```

**CRITICAL GAPS: 0**

## Security Assessment

| Threat | Likelihood | Impact | Mitigated |
|--------|-----------|--------|-----------|
| API key exposed in renderer | Med | High | YES - key stays in main process |
| Prompt injection via impulse | Low | Low | ACCEPTABLE - single user, own content |
| Claude output containing HTML/script | Low | Med | YES - escapeHtml() utility |
| File path traversal in export | Low | Med | YES - Electron native folder picker |
| Dependency risk (@anthropic-ai/sdk) | Low | Low | OK - official Anthropic package |

## Interaction Edge Cases

```
  INTERACTION                | EDGE CASE                    | HANDLED | HOW
  ---------------------------|------------------------------|---------|------------------
  "Generate Content" button  | Double-click                 | YES     | Disable during generation
                             | No API key set               | YES     | Validate before API call
                             | No template selected         | YES     | Require selection
  Streaming text display     | User navigates away          | YES     | AbortController + cleanup
                             | Stream >60s                  | YES     | Progress indicator
                             | Empty result                 | YES     | Error message + retry
  Slide text editing         | Paste very long text         | YES     | Character limit per zone
                             | Empty all fields             | YES     | Block render until content
  "New Draft" button         | Click mid-edit (data loss)   | YES     | Confirmation dialog
                             | Click during stream          | YES     | Cancel current, start new
  Carousel slide reorder     | Drag to same position        | YES     | No-op
                             | Single slide only            | YES     | Hide reorder UI
  Overlay opacity            | Rapid slider changes         | YES     | Debounce re-render (300ms)
  Export folder picker       | User cancels dialog          | YES     | Return to review step
                             | Files exist at destination   | YES     | Silent overwrite
  Story proposals            | Zero generated               | YES     | Message + skip
                             | User rejects all             | YES     | Skip export, finish wizard
```

## What Already Exists (Reusable)

| Existing Code | Reused For |
|---|---|
| `RenderService.renderToPNG()` | Step 4 renders, story renders |
| `RenderService.renderCarousel()` | Multi-slide carousel rendering |
| `SettingsService.load()` | Prompt assembly - all 11 config areas |
| `SecurityService.loadAPIKey()` | Claude API authentication |
| `insertPost()` in queries.ts | Post persistence |
| `insertStory()` in queries.ts | Story persistence |
| `updateBalanceMatrix()` | Balance tracking on post creation |
| `getBalanceMatrix()` | Recommendation engine input |
| `useAutoSave` hook | Draft auto-save pattern |
| Zustand store pattern (settingsStore) | createPostStore |
| `DEFAULT_MASTER_PROMPT` | Prompt template |
| shadcn/ui components | All wizard UI elements |

## NOT in Scope

| Item | Rationale |
|------|-----------|
| Performance tracking UI (PERF-01 to PERF-06) | Phase 4 |
| Electron-log structured logging | Phase 4 |
| Content calendar view | v2 (UX-02) |
| Draft crash recovery | v2 (UX-03) |
| Instagram API integration | v2 (API-01 to API-03) |
| Undo/redo in text editor | Not in requirements |
| AI-powered caption optimization | Not in requirements |
| Multi-language UI | Not in requirements |

## Test Coverage Plan

| Item | Unit | Integration | E2E |
|------|------|------------|-----|
| PromptAssemblyService | YES - each format method | YES - full assembly | NO |
| ClaudeService.stream() | Mock API responses | YES - stream lifecycle | NO |
| RecommendationService | YES - cold start, balanced, skewed | NO | NO |
| Response parser | YES - valid, empty, malformed | NO | NO |
| HTML template filler | YES - each zone type | NO | NO |
| ExportService | YES - file write, naming | NO | NO |
| Post/Slide CRUD queries | YES - insert, update, list | NO | NO |
| Balance matrix queries | YES - update, aggregation | NO | NO |
| Wizard state transitions | YES - each step, edge cases | NO | NO |
| Stream cancellation | NO | YES - cancel mid-stream | NO |

## Deferred TODOs

### Draft Persistence & Resumability
- **What:** Save wizard state to DB as draft on each step transition. Dashboard shows "Continue Draft" card
- **Why:** Prevents data loss when app closes mid-wizard
- **Context:** Schema supports `status: 'draft'`. Zustand store state needs to be serializable. Resume loads store from DB row
- **Effort:** M
- **Priority:** P2
- **Blocked by:** Phase 3 wizard store must be designed first (store shape determines what's serializable)

## Dream State Delta

Phase 3 delivers the core product (100% MVP). After Phase 3 + Phase 4:
- **Achieved:** Full content creation loop, learning system, export
- **Remaining for 12-month ideal:** Instagram API, multi-brand, web deployment, video, calendar, auto-posting
- **Gap:** ~60% of 12-month ideal

## Metrics

- Reversibility: 5/5 (fully additive, git revert works)
- Technical debt introduced: 0
- New dependencies: 1 (@anthropic-ai/sdk)
- New services: 5
- New IPC handlers: 4
- Existing code reused: 12 assets

---
*Review completed: 2026-03-12*
*Reviewer: Claude (CEO Plan Review mode)*
