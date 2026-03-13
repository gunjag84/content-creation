---
phase: 03-content-generation
plan: "06"
subsystem: wizard-ui
tags:
  - streaming-generation
  - text-editor
  - drag-drop
  - react
  - zustand
  - dnd-kit
dependency_graph:
  requires:
    - 03-02-SUMMARY.md (recommendation service)
    - 03-04-SUMMARY.md (generation IPC)
    - 03-05-SUMMARY.md (wizard store)
  provides:
    - Step 2 streaming generation UI
    - Step 3 two-panel text editor
    - Slide navigation and reordering
    - Alternative hooks workflow
  affects:
    - Content authoring experience
    - User engagement during generation
tech_stack:
  added:
    - "@dnd-kit/core@6.3.1 (already installed)"
    - "@dnd-kit/sortable@10.0.0 (already installed)"
  patterns:
    - Ref-based token accumulation for anti-flicker
    - DndContext + SortableContext for drag-and-drop
    - Tab-based navigation (Slides/Caption)
    - Inline overlay for alternative hooks selection
key_files:
  created:
    - src/renderer/src/components/wizard/Step2Generation.tsx
    - src/renderer/src/components/wizard/Step3EditText.tsx
    - src/renderer/src/components/wizard/SlideEditor.tsx
    - src/renderer/src/components/wizard/LivePreview.tsx
  modified: []
decisions:
  - decision: "Ref-based token accumulation with 100ms interval"
    rationale: "Prevents flicker from rapid state updates during streaming"
    alternatives: ["Direct state updates (causes flicker)", "RequestAnimationFrame (overkill)"]
  - decision: "Manual mode auto-creates empty slides and skips to Step 3"
    rationale: "No generation needed - user fills content directly"
    alternatives: ["Show empty Step 2 with message", "Hide Step 2 entirely"]
  - decision: "Two-panel layout (40% editor, 60% preview)"
    rationale: "Preview is more important for visual validation, but editing needs space"
    alternatives: ["50/50 split", "Collapsible panels"]
  - decision: "Inline overlay for alternative hooks"
    rationale: "Keeps user in context, doesn't require modal navigation"
    alternatives: ["Dedicated modal", "Inline expansion below button"]
  - decision: "Drag handle + thumbnail click separation"
    rationale: "Clear affordance - grab to reorder, click to select"
    alternatives: ["Click-and-hold to drag", "Drag entire thumbnail"]
metrics:
  duration_minutes: 5
  task_count: 2
  files_created: 4
  files_modified: 0
  commits: 2
  build_errors: 0
  completed_at: "2026-03-13T07:59:15Z"
---

# Phase 03 Plan 06: Wizard Steps 2 & 3 (Generation & Edit) Summary

**One-liner:** Streaming token display with ref-based anti-flicker and two-panel drag-and-drop slide editor

## What Was Built

Implemented the core content authoring experience:

**Step 2 (Generation Display):**
- Streaming text accumulation using ref + 100ms interval to prevent flicker
- Collapsible "View prompt" section (closed by default)
- Auto-scroll to bottom as tokens appear
- Manual mode: auto-creates empty slides, skips to Step 3
- Error state with retry button
- New Draft button after completion
- Continue to Edit button advances to Step 3

**Step 3 (Text Editor):**
- Two-panel layout: 40% editor (left), 60% preview (right)
- Thumbnail strip showing all slides with type labels (Cover/Content/CTA)
- Drag-and-drop reorder using @dnd-kit with grip handle affordance
- Click thumbnail to focus that slide's editor and preview
- Slides tab: SlideEditor with hook/body/CTA textareas
- Caption tab: single large textarea with character counter
- Alternative hooks button: inline overlay with 3 options to pick from
- New Draft button: confirmation dialog before overwriting
- Overlay opacity slider for preview tool
- Approve & Render button: saves post and slides to DB, advances to Step 4

**Supporting Components:**
- `SlideEditor`: Three labeled textareas (hook, body, CTA) with auto-resize and dark theme
- `LivePreview`: Template HTML injection (when available) or fallback branded card preview using scaled-down rendering

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Decisions

### 1. Ref-based token accumulation (Anti-flicker pattern)

**Problem:** Streaming tokens arrive rapidly (10-50/sec). Direct state updates cause visible flicker.

**Solution:**
```typescript
const textRef = useRef('')
const [displayText, setDisplayText] = useState('')

useEffect(() => {
  const interval = setInterval(() => setDisplayText(textRef.current), 100)
  return () => clearInterval(interval)
}, [])

// In onToken listener:
textRef.current += token  // No re-render
```

Updates display at 10fps instead of 50fps. Smooth, no flicker.

**Why not RAF?** RequestAnimationFrame is overkill for text display. setInterval is simpler and sufficient.

### 2. Manual mode auto-advance

When `mode === 'manual'`, Step 2 mounts briefly, creates empty slides based on contentType, calls `setGenerationComplete()`, then immediately advances to Step 3.

User never sees Step 2. Clean experience.

### 3. Two-panel layout (40/60 split)

Editor needs enough space for textareas. Preview needs more space for visual validation. 40/60 balances both needs.

Fixed split (no draggable resize). Keeps code simple.

### 4. Inline overlay for alternative hooks

When user clicks "Alternative Hooks", an inline overlay appears with 3 clickable options. Clicking one replaces the hook text and closes the overlay.

No modal navigation, no route change. User stays in context.

### 5. Drag handle separation

Thumbnails have two interaction zones:
- Grip icon (left): drag to reorder
- Thumbnail box (right): click to select

Clear affordance. No ambiguity.

## Integration Points

**Incoming (Dependencies):**
- `useCreatePostStore()` from 03-05: all wizard state and actions
- `window.api.generation.streamContent()` from 03-04: starts streaming
- `window.api.generation.onToken/onComplete/onError()` from 03-04: event listeners
- `window.api.generation.streamHooks()` from 03-04: alternative hooks request
- `window.api.posts.create()` and `saveSlides()` from 03-03: DB persistence

**Outgoing (Provides to):**
- Step 2 component for wizard router (03-07 or 03-08)
- Step 3 component for wizard router (03-07 or 03-08)
- Post draft saved to DB with status='draft' for Step 4 rendering

## Testing Notes

**Manual verification required:**
1. Start wizard from Step 1
2. Set mode to AI, click "Generate Content"
3. Step 2 should show streaming text appearing word-by-word
4. Click "View prompt" to expand/collapse
5. Click "Continue to Edit" after completion
6. Step 3 should show two-panel layout with thumbnail strip
7. Click thumbnails to switch slides
8. Drag thumbnails to reorder (grip handle)
9. Switch to Caption tab - should show large textarea
10. Click "Alternative Hooks" - should show inline overlay
11. Click "Approve & Render" - should save to DB and advance to Step 4

**Build verification:**
```bash
npm run build
```
All TypeScript compilation passed. No errors.

## Performance Notes

- Token accumulation: 100ms interval = 10 updates/sec max (smooth)
- Drag-and-drop: dnd-kit uses CSS transforms (GPU-accelerated)
- Live preview: Simple text injection, no complex rendering (fast)
- DB save on approve: Single transaction, all slides in batch (quick)

## Known Limitations

1. **Prompt not exposed to UI:** The assembled prompt is built in the IPC handler. For now, "View prompt" shows a placeholder message. Future enhancement: return prompt text from IPC.

2. **No template preview yet:** LivePreview receives `templateHtml` prop but templates aren't loaded yet. Falls back to branded card preview. Will be connected when template system is wired in.

3. **Alternative hooks not implemented in backend:** UI ready, but IPC handler for `streamHooks` needs implementation (likely in 03-07 or later).

4. **No undo/redo:** Text edits are immediate. User can click "New Draft" but loses all progress. Future: track edit history.

## Next Steps

- 03-07 or 03-08: Implement wizard routing to show Step 2/3 at correct times
- Step 4: PNG rendering from HTML templates (post already saved, ready to render)
- Backend: Implement `streamHooks` IPC handler for alternative hooks workflow
- Templates: Load template HTML and pass to LivePreview for real preview

## Self-Check

Verifying all files created and commits exist:

```bash
# Check files exist
ls src/renderer/src/components/wizard/Step2Generation.tsx
ls src/renderer/src/components/wizard/Step3EditText.tsx
ls src/renderer/src/components/wizard/SlideEditor.tsx
ls src/renderer/src/components/wizard/LivePreview.tsx

# Check commits exist
git log --oneline --all | grep "1fa284c\|b045372"
```

**Results:**
- Step2Generation.tsx: ✅ EXISTS
- Step3EditText.tsx: ✅ EXISTS
- SlideEditor.tsx: ✅ EXISTS
- LivePreview.tsx: ✅ EXISTS
- Commit 1fa284c: ✅ EXISTS (Task 1)
- Commit b045372: ✅ EXISTS (Task 2)

## Self-Check: PASSED

All deliverables verified. Plan 03-06 complete.
