---
status: diagnosed
trigger: "Alternative Hooks in Step 3 hangs with Generating options notification and never completes"
created: 2026-03-17T00:00:00Z
updated: 2026-03-17T00:00:00Z
---

## Current Focus

hypothesis: Two combined bugs - empty prompt sent to Claude API + missing onError listener causes silent hang
test: confirmed via code reading
expecting: n/a
next_action: return diagnosis

## Symptoms

expected: Clicking "Alternative Hooks" generates hook alternatives and displays them
actual: Overlay shows "Generating options..." forever, never completes
errors: None visible to user (error swallowed silently)
reproduction: Click "Alternative Hooks" button on any slide in Step 3
started: Likely since feature was first implemented

## Eliminated

(none needed - root cause found on first pass)

## Evidence

- timestamp: 2026-03-17
  checked: Step3EditText.tsx handleRequestHooks (lines 122-145)
  found: prompt passed to streamHooks is empty string (line 139), comment says "Will be assembled in backend" but backend has no assembly
  implication: Claude API receives empty message content, which is invalid

- timestamp: 2026-03-17
  checked: generation.ts generate:hooks handler (lines 52-71)
  found: args.prompt is forwarded directly to streamHooks() with no assembly logic (line 66)
  implication: Empty prompt goes straight to API

- timestamp: 2026-03-17
  checked: generation.ts streamHooks function (lines 136-164)
  found: On error, sends generate:error event (line 162) but UI never listens for it
  implication: Error is silently lost

- timestamp: 2026-03-17
  checked: Step3EditText.tsx handleRequestHooks error handling
  found: Sets up onHooksComplete listener but NO onError listener
  implication: UI stays stuck in isLoadingHooks=true forever when API fails

## Resolution

root_cause: |
  Two bugs combine to cause the hang:
  1. Empty prompt: Step3EditText.tsx:139 sends prompt='' to backend. The comment "Will be assembled in backend" is wrong - generation.ts:66 forwards args.prompt directly with no assembly.
  2. Missing error listener: Step3EditText.tsx:122-145 registers onHooksComplete but never registers onError, so the API error is silently lost and isLoadingHooks stays true forever.
fix: |
  Bug 1: Build a proper prompt in either the frontend (before calling streamHooks) or the backend (in the generate:hooks handler). Use currentHook and slideContext to construct a prompt like "Generate 5 alternative hooks for this slide. Current hook: {currentHook}. Slide context: {slideContext}. Return as a JSON array of strings."
  Bug 2: Add an onError listener in handleRequestHooks that sets isLoadingHooks=false and optionally shows an error message.
verification:
files_changed: []
