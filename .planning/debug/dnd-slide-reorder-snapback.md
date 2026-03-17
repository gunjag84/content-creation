---
status: investigating
trigger: "drag-and-drop slide reorder in Step 3 snaps back to original position instead of persisting"
created: 2026-03-17T00:00:00Z
updated: 2026-03-17T00:00:00Z
---

## Current Focus

hypothesis: dnd-kit IDs are index-based (`slide-${index}`), so after reorder the items array regenerates the same IDs at new positions, but the React keys are also index-based causing React to unmatch the DOM nodes - combined with a potential mismatch between how dnd-kit uses arrayMove vs how the store uses splice
test: Compare dnd-kit's expected reorder (arrayMove) with store's splice-based reorder, and check React key stability
expecting: If IDs are unstable (derived from index), dnd-kit can't track items across renders and snaps back
next_action: Confirm the two bugs - unstable IDs/keys and potential arrayMove vs splice mismatch

## Symptoms

expected: Dragging a slide thumbnail to a new position should persist the new order
actual: Slide snaps back to original position after drop
errors: none reported
reproduction: Drag any slide thumbnail in Step 3 to a new position
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-03-17T00:01:00Z
  checked: SortableThumbnail component - useSortable ID
  found: ID is `slide-${index}` where index is the array position, not a stable slide identifier
  implication: After reorder, the items array passed to SortableContext regenerates IDs from new indices - dnd-kit sees the "same" IDs in the "same" positions and thinks nothing changed

- timestamp: 2026-03-17T00:01:30Z
  checked: React key on SortableThumbnail
  found: `key={idx}` (line 243) - index-based key, not stable
  implication: React will reuse DOM nodes by position rather than tracking moved items, compounding the ID instability

- timestamp: 2026-03-17T00:02:00Z
  checked: SortableContext items prop (line 237)
  found: `items={generatedSlides.map((_, idx) => 'slide-${idx}')}` - regenerated from current array indices every render
  implication: Before and after reorder, items are always ['slide-0', 'slide-1', 'slide-2', ...] - dnd-kit sees identical item lists

- timestamp: 2026-03-17T00:02:30Z
  checked: store reorderSlides implementation (line 122-134)
  found: Uses splice-based reorder which is correct for the indices passed. Also updates slide_number.
  implication: Store logic is fine. The problem is entirely in the component's ID strategy.

## Resolution

root_cause: SortableContext items and useSortable IDs are derived from array index (`slide-${index}`), not from a stable slide identity. After the store reorders slides and the component re-renders, the items array regenerates identical IDs (`['slide-0', 'slide-1', 'slide-2']`) regardless of which slide is at which position. dnd-kit sees the same IDs in the same order and renders as if nothing changed. Additionally, `key={idx}` on the map causes React to reuse DOM nodes by position. The visual result is a "snap back" even though the store state may have updated correctly.
fix: Use a stable unique ID per slide (e.g., `slide_number` from before reorder, or a generated UUID). Since slides don't have a natural unique ID, the simplest fix is to use `slide.slide_number` as it exists on every slide - BUT reorderSlides reassigns slide_number, so that won't work either. The correct fix is to either (a) add a stable `id` field to each slide, or (b) use a composite key that doesn't change on reorder. The pragmatic fix: use a ref-based stable ID map, or simply use the slide's hook_text + slide_type as a compound key (fragile). Best: add a `uid` field assigned at generation time.
verification:
files_changed: []
