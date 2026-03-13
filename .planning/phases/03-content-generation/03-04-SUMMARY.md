---
phase: 03-content-generation
plan: "04"
subsystem: IPC Layer
tags: [ipc, claude-api, streaming, export, file-system]
dependency_graph:
  requires: [03-01-types]
  provides: [generation-ipc, export-ipc]
  affects: [wave-2-ui-plans]
tech_stack:
  added:
    - "@anthropic-ai/sdk streaming API"
    - "Electron IPC event emitters for streaming"
    - "base64 data URL decoding for PNG export"
  patterns:
    - "Async IPC handlers with webContents.send for streaming tokens"
    - "Event listener cleanup functions returned from preload API"
    - "Race condition prevention with module-level state flag"
    - "Partial response capture for error recovery"
key_files:
  created:
    - src/main/ipc/generation.ts: "Claude API streaming handlers for content/hooks/stories"
    - src/main/ipc/export.ts: "File export with folder selection and concurrent writes"
    - tests/main/ipc/export.test.ts: "Export operations validation tests"
  modified:
    - src/main/index.ts: "Register generation and export IPC handlers"
    - src/preload/index.ts: "Expose generation.* and export.* namespaces with event listeners"
    - src/preload/types.ts: "TypeScript interfaces for generation and export APIs"
decisions:
  - decision: "SecurityService instance created per IPC handler module"
    rationale: "Each IPC module needs independent access to loadAPIKey() without service injection complexity"
  - decision: "Partial response captured in local var during streaming"
    rationale: "Enables error recovery when stream fails mid-generation - renderer can salvage partial output"
  - decision: "isExporting flag at module level instead of Map per window"
    rationale: "Single main window app - simple boolean prevents double-export race condition"
  - decision: "Event listeners return cleanup functions"
    rationale: "Follows React useEffect pattern - prevents memory leaks when components unmount"
metrics:
  duration_minutes: 7
  tasks_completed: 2
  tests_added: 4
  commits: 2
  files_created: 3
  files_modified: 3
  completed_date: "2026-03-13"
---

# Phase 03 Plan 04: Generation & Export IPC Summary

**One-liner:** Claude API streaming IPC with token forwarding, error recovery, and base64 PNG export with race-condition prevention

## What Was Built

Implemented the main/preload IPC layer for Claude API streaming and file export. These are the backend I/O handlers that Wave 2 UI plans will invoke.

### Generation IPC (`src/main/ipc/generation.ts`)

Three streaming handlers built on Anthropic SDK:

1. **generate:content** - Feed post carousel generation (4096 tokens)
2. **generate:hooks** - Hook alternatives for refinement (2048 tokens)
3. **generate:stories** - Story proposals with interactive tools (4096 tokens)

**Streaming pattern:**
- Load API key from security-service before every call
- Create Anthropic client with `claude-sonnet-4-5-20250929`
- Stream via `client.messages.stream()`
- Forward each text chunk via `webContents.send('generate:token', text)`
- Parse finalMessage as JSON → send type-specific complete event
- Capture partial response for error recovery

**Error handling:**
- Return `{ started: false }` if API key missing/empty
- Send `generate:error` event with message
- Include `partial` field if stream failed mid-generation

### Export IPC (`src/main/ipc/export.ts`)

Two handlers for file export workflow:

1. **export:select-folder** - Opens directory picker with createDirectory option
2. **export:save-files** - Writes PNG/TXT files concurrently to chosen folder

**File writing:**
- PNG: Strip `data:image/png;base64,` prefix → Buffer.from(base64) → writeFile(buffer)
- TXT: Direct UTF-8 writeFile(content, 'utf-8')
- All files written via Promise.all (concurrent)

**Race prevention:**
- Module-level `isExporting` flag
- Return `{ success: false, error: 'Export already in progress' }` on duplicate calls
- Reset flag in finally block

### Preload API Extensions

**generation namespace:**
- `streamContent(prompt)` → Promise<{ started: boolean }>
- `streamHooks(args)` → Promise<{ started: boolean }>
- `streamStories(prompt)` → Promise<{ started: boolean }>
- `onToken(cb)` → cleanup function
- `onComplete(cb)` → cleanup function
- `onHooksComplete(cb)` → cleanup function
- `onStoriesComplete(cb)` → cleanup function
- `onError(cb)` → cleanup function

**export namespace:**
- `selectFolder()` → Promise<{ canceled, path? }>
- `saveFiles(folderPath, files)` → Promise<{ success, error? }>

All event listeners return cleanup functions for proper React integration.

## Deviations from Plan

None - plan executed exactly as written. Tests verified file operations work correctly before implementing IPC handlers.

## Verification

### Automated Tests
- **export.test.ts** - 4/4 passed GREEN
  - PNG write from base64 data URL
  - Text write with UTF-8 encoding
  - Concurrent multi-file writes
  - Success/error handling patterns

### Build Verification
- TypeScript compilation: SUCCESS
- Vite build: SUCCESS (no type errors)
- Full test suite: 74/84 passed (10 pre-existing render-service failures unrelated to this plan)

### Manual Testing
Generation streaming is manual-only per VALIDATION.md guidance:
- Will be tested in Wave 2 when Step 2 UI invokes these handlers
- Requires actual Claude API key and live generation flow

## Impact on Wave 2 Plans

Wave 2 UI plans can now:
- Call `window.api.generation.streamContent()` and listen for tokens/completion
- Implement real-time streaming display in Step 2
- Call `window.api.export.selectFolder()` and `saveFiles()` for export flow
- Build interactive story proposal UI with live Claude API integration

No further IPC implementation needed for Wave 2 - backend channels ready.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create export IPC tests (RED → GREEN) | e0b8ffb | tests/main/ipc/export.test.ts |
| 2 | Implement generation + export IPC handlers | 3857ad1 | generation.ts, export.ts, index.ts, preload/* |

## Key Files

**Created:**
- `src/main/ipc/generation.ts` - Claude API streaming with 3 handlers
- `src/main/ipc/export.ts` - File export with race-condition prevention
- `tests/main/ipc/export.test.ts` - Export operations validation

**Modified:**
- `src/main/index.ts` - Register generation/export IPC
- `src/preload/index.ts` - Expose generation/export namespaces
- `src/preload/types.ts` - TypeScript interfaces for new APIs

## Technical Notes

### API Key Loading
Each IPC module creates its own `SecurityService` instance to call `loadAPIKey()`. This avoids service injection complexity while maintaining proper encapsulation.

### Streaming Token Flow
```
Anthropic SDK stream.on('text')
→ win.webContents.send('generate:token', text)
→ ipcRenderer.on('generate:token', callback)
→ React component state update
```

### Error Recovery Pattern
Partial response captured during streaming:
```typescript
let partialResponse = ''
stream.on('text', (text) => {
  partialResponse += text
  win.webContents.send('generate:token', text)
})
// On error: send { message, partial: partialResponse }
```

Renderer can salvage partial JSON if parse fails.

### Base64 Data URL Handling
Export handler strips prefix before decode:
```typescript
const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
const buffer = Buffer.from(base64Data, 'base64')
await fs.writeFile(path, buffer)
```

## Dependencies

**Requires:**
- `03-01` (generation types) ✓
- `@anthropic-ai/sdk` npm package ✓
- `security-service.loadAPIKey()` ✓

**Provides:**
- Generation IPC channels for Wave 2 UI
- Export IPC channels for Wave 2 UI
- Preload API with event listeners

## Next Steps

Wave 2 plans can now build:
- Step 2 UI with streaming content generation
- Hook refinement UI with alternative suggestions
- Story proposal UI with interactive tools
- Export flow with folder selection and file writing

No additional backend work needed - IPC layer complete.

## Self-Check

Verifying claimed files and commits exist:

| Item | Status |
|------|--------|
| src/main/ipc/generation.ts | ✓ FOUND |
| src/main/ipc/export.ts | ✓ FOUND |
| tests/main/ipc/export.test.ts | ✓ FOUND |
| Commit e0b8ffb | ✓ FOUND |
| Commit 3857ad1 | ✓ FOUND |
| Export tests pass | ✓ PASSED (4/4) |
| Build succeeds | ✓ SUCCESS |

## Self-Check: PASSED
