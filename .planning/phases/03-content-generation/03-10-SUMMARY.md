---
phase: 03-content-generation
plan: "10"
subsystem: generation
tags: [hooks, ipc, error-handling, bug-fix]
dependency_graph:
  requires: []
  provides: [working-hooks-generation]
  affects: [Step3EditText, generation-ipc]
tech_stack:
  added: []
  patterns: [IPC event cleanup, prompt assembly in backend]
key_files:
  modified:
    - src/main/ipc/generation.ts
    - src/renderer/src/components/wizard/Step3EditText.tsx
decisions:
  - Prompt assembled in backend (IPC handler) from currentHook + slideContext - frontend passes empty string as placeholder, keeping API surface stable
  - onError cleanup calls both cleanup() and cleanupError() to prevent listener leaks on either path
metrics:
  duration: 2 min
  completed: 2026-03-17
  tasks: 1
  files: 2
---

# Phase 3 Plan 10: Fix Alternative Hooks - Backend Prompt Assembly and Frontend Error Handling

Hooks prompt assembled from currentHook + slideContext in the IPC handler with onError listener to prevent overlay hang on API failure.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Build hooks prompt in backend and add frontend error handling | c55d420 | src/main/ipc/generation.ts, src/renderer/src/components/wizard/Step3EditText.tsx |

## What Was Built

**Bug 1 fixed - empty prompt:** The `generate:hooks` handler was forwarding `args.prompt` (always empty string from frontend) directly to the Claude API. The handler now assembles a complete prompt using `args.currentHook` and `args.slideContext` before calling `streamHooks`.

**Bug 2 fixed - no error listener:** `handleRequestHooks` registered `onHooksComplete` but not `onError`. When the API returned an error, `isLoadingHooks` stayed `true` and the overlay never closed. Added `cleanupError` listener that closes the overlay and resets loading state, with cross-cleanup so both listeners remove each other on either success or error.

**Bonus fix:** Added markdown code fence stripping in `streamHooks` (matching the pattern already used in `streamContent` and `streamStories`) so partial-fenced JSON responses don't cause a parse failure.

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

- Prompt assembled in backend (IPC handler) from currentHook + slideContext - frontend passes empty string as placeholder, keeping API surface stable
- onError cleanup calls both cleanup() and cleanupError() to prevent listener leaks on either path (success removes error listener, error removes complete listener)

## Self-Check: PASSED
