---
phase: 02-settings-templates
plan: 15
subsystem: settings-ui
tags: [gap-closure, crud, user-experience]
dependency_graph:
  requires: [SET-05, SET-09, SET-04]
  provides: [editable-mechanics, editable-story-tools, editable-themes]
  affects: [content-catalog-customization]
tech_stack:
  added: []
  patterns: [inline-dialog-forms, modal-overlays, controlled-state-management]
key_files:
  created: []
  modified:
    - src/renderer/src/components/settings/MechanicsSection.tsx
    - src/renderer/src/components/settings/StoryToolsSection.tsx
    - src/renderer/src/components/settings/ThemeSection.tsx
decisions:
  - Use inline dialog overlays instead of external dialog library for lightweight CRUD forms
  - Preserve existing unterthemen when editing Oberthema - only metadata fields editable
  - Refactor ThemeSection header from single button to div wrapper with nested expand button
  - Mechanic recommendations in StoryTools stored as newline-separated textarea
metrics:
  duration_minutes: 6.2
  completed_date: 2026-03-11
---

# Phase 02 Plan 15: Add CRUD to Mechanics/StoryTools/Themes Summary

**One-liner:** Full create/edit/delete capability for Mechanics, Story Tools, and Themes using inline dialog forms with consistent UI patterns across all three catalog sections.

## What Was Built

All three content catalog sections (Mechanics, Story Tools, Themes) now support complete CRUD operations:

1. **MechanicsSection.tsx** - Add/Edit/Delete mechanics with full field support (name, description, hookRules, slideRange, structureGuidelines, pillarMapping)

2. **StoryToolsSection.tsx** - Add/Edit/Delete story tools with fields for name, description, engagementType, pillarMapping, and mechanicRecommendations

3. **ThemeSection.tsx** - Add/Edit/Delete at Oberthema level with name, description, and pillarMapping (preserves existing unterthemen)

Each section follows the same interaction pattern:
- "+ Add [Type]" button in section header
- Edit/Delete buttons on each card/item
- Inline modal dialogs for create/edit forms
- Delete confirmation overlays
- All operations persist via existing onUpdate() mechanism

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add CRUD to MechanicsSection.tsx | bbed91c |
| 2 | Add CRUD to StoryToolsSection and ThemeSection | e13242d |

## Technical Implementation

**Shared CRUD Pattern:**
- State management: `isCreating`, `editingItem`, `deleteConfirm`, `formData`
- Handlers: `handleCreate()`, `handleEdit(item)`, `handleSave()`, `handleDelete(id)`, `togglePillar(pillar)`
- Inline dialog overlays with dark theme styling matching existing UI
- Form validation: required name field, disabled save button until valid

**Section-Specific Details:**

**MechanicsSection:**
- Full mechanic schema fields in dialog form
- Number inputs for slideRange min/max
- Pillar toggles with visual feedback
- Hook rules and structure guidelines as textareas

**StoryToolsSection:**
- Engagement type as text input
- Mechanic recommendations as newline-separated textarea (split to array on save)
- Same pillar toggle pattern as MechanicsSection

**ThemeSection:**
- Simplified form: only name, description, pillarMapping
- Preserves existing unterthemen array when editing
- Refactored header structure from single `<button>` to `<div>` wrapper with nested expand button and separate action buttons
- Edit/Delete buttons positioned after pillar badges in header

**Persistence:**
All three sections use the existing `onUpdate(section, value)` mechanism:
- MechanicsSection: `onUpdate('mechanics', { mechanics: [...] })`
- StoryToolsSection: `onUpdate('storyTools', { tools: [...] })`
- ThemeSection: `onUpdate('themes', { oberthemen: [...] })`

## Deviations from Plan

None - plan executed exactly as written. All three sections implemented with consistent CRUD patterns. ThemeSection header successfully refactored to support separate Edit/Delete action buttons alongside the expand/collapse functionality.

## Verification Results

TypeScript compilation: PASSED (npm run build successful)
- MechanicsSection: Create/Edit/Delete handlers correctly typed
- StoryToolsSection: Array splitting for mechanicRecommendations works as expected
- ThemeSection: Oberthema type preserved, unterthemen array maintained on edit

## Self-Check

**Created files:**
```bash
[ -f ".planning/phases/02-settings-templates/02-15-SUMMARY.md" ] && echo "FOUND" || echo "MISSING"
```
FOUND: .planning/phases/02-settings-templates/02-15-SUMMARY.md

**Commits exist:**
```bash
git log --oneline --all | grep -q "bbed91c" && echo "FOUND: bbed91c" || echo "MISSING: bbed91c"
git log --oneline --all | grep -q "e13242d" && echo "FOUND: e13242d" || echo "MISSING: e13242d"
```
FOUND: bbed91c (feat(02-15): add CRUD for MechanicsSection)
FOUND: e13242d (feat(02-15): add CRUD for StoryToolsSection and ThemeSection)

**Modified files exist:**
```bash
[ -f "src/renderer/src/components/settings/MechanicsSection.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "src/renderer/src/components/settings/StoryToolsSection.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "src/renderer/src/components/settings/ThemeSection.tsx" ] && echo "FOUND" || echo "MISSING"
```
FOUND: src/renderer/src/components/settings/MechanicsSection.tsx
FOUND: src/renderer/src/components/settings/StoryToolsSection.tsx
FOUND: src/renderer/src/components/settings/ThemeSection.tsx

## Self-Check: PASSED

All commits exist, all files modified as expected, TypeScript compiles clean.
