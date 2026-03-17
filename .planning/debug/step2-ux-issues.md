---
status: diagnosed
trigger: "Investigate two minor UX issues in Step 2: Content ready message shows from start, manual mode shows empty edit screen briefly"
created: 2026-03-17T00:00:00Z
updated: 2026-03-17T00:00:00Z
---

## Current Focus

hypothesis: Both issues traced to root causes in Step2Generation.tsx
test: Code review
expecting: n/a - diagnosis only
next_action: Return findings

## Symptoms

expected: Issue 1 - "Content Ready!" should only show after generation completes. Issue 2 - Manual mode should show loading indicator during transition.
actual: Issue 1 - "Content Ready!" flashes immediately when component mounts before streaming starts. Issue 2 - Manual mode returns null but may flash empty screen before useEffect fires.
errors: none
reproduction: Issue 1 - Start AI generation and observe header text. Issue 2 - Select manual mode and watch transition to Step 3.
started: Since implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-17
  checked: Step2Generation.tsx lines 157-165 (CardTitle ternary)
  found: Three-way ternary - isGenerating ? "Generating..." : generationError ? "Failed" : "Content Ready!". Initial store state has isGenerating=false and generationError=null, so the ELSE branch ("Content Ready!") renders on mount before startGeneration() sets isGenerating=true.
  implication: Root cause of Issue 1 confirmed.

- timestamp: 2026-03-17
  checked: Step2Generation.tsx lines 34-55 and 147-150
  found: Manual mode useEffect calls setStep(3) but this is async (next render). Meanwhile line 148-150 returns null. This creates a brief blank frame. No loading indicator exists.
  implication: Root cause of Issue 2 confirmed, though severity depends on render timing.

## Resolution

root_cause: |
  Issue 1: The header ternary at line 159-165 has no state for "not yet started". isGenerating starts as false in the store (line 78 of useCreatePostStore.ts), so on mount the component falls through to the else branch showing "Content Ready!" before the useEffect on line 58-63 calls startGeneration() which sets isGenerating=true.

  Issue 2: Manual mode at lines 34-54 sets generation data and calls setStep(3) inside a useEffect, but this runs after the first render. Lines 148-150 return null for manual mode, creating a blank flash. No spinner or loading state exists for this transition frame.
fix: |
  Issue 1: Add a fourth state. Either (a) track a `hasCompleted` boolean that only becomes true inside onComplete callback, and use that for "Content Ready!" display, or (b) check for displayText presence: show "Content Ready!" only when !isGenerating && !generationError && displayText.length > 0, otherwise show a neutral "Preparing..." message.

  Issue 2: Instead of returning null at line 148-150, return a centered loading spinner component (e.g., Loader2 from lucide-react with animate-spin). The useEffect will fire immediately after and navigate away, but the spinner covers the gap.
verification: Code review only - diagnosis mode
files_changed: []
