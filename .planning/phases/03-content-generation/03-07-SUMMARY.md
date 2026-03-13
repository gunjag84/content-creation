---
phase: 03-content-generation
plan: "07"
subsystem: wizard-completion
tags: [render, export, stories, generation, wizard]
dependency_graph:
  requires: [03-02, 03-03, 03-04, 03-05]
  provides: [step-4-render-review, step-5-stories, story-generation]
  affects: [wizard-flow, content-pipeline]
tech_stack:
  added: [story-generator-service, badge-component]
  patterns: [incremental-render-preview, inline-edit-mode, story-html-templates]
key_files:
  created:
    - src/renderer/src/components/wizard/Step4RenderReview.tsx
    - src/renderer/src/components/wizard/Step5Stories.tsx
    - src/main/services/story-generator.ts
    - src/renderer/src/components/ui/badge.tsx
  modified: []
decisions:
  - slug: step-4-manual-render-trigger
    rationale: User clicks "Render & Preview" rather than auto-render on mount - prevents unwanted API calls and gives user control
  - slug: incremental-preview-display
    rationale: Show thumbnails as each slide completes rendering - provides immediate visual feedback during progress
  - slug: per-slide-opacity-re-render
    rationale: Debounced slider triggers re-render of single slide only - avoids re-rendering all slides for opacity adjustments
  - slug: standard-cta-injection-last-slide
    rationale: Last slide with CTA type automatically uses visualGuidance.standardCTA from settings - implements POST-17 requirement
  - slug: story-html-simple-templates
    rationale: Simple HTML templates for 9:16 stories rather than full template system - faster for Phase 3, dedicated story templates deferred
  - slug: auto-story-generation-on-mount
    rationale: Stories auto-generate when Step 5 loads - user has already exported feed post, stories are logical next action
  - slug: inline-story-edit-mode
    rationale: Edit form replaces card content rather than separate modal - simpler UX, fewer dialogs
  - slug: badge-component-created
    rationale: Added shadcn-style Badge component for story metadata display - follows existing UI component patterns
metrics:
  duration_minutes: 7
  tasks_completed: 2
  files_created: 4
  commits: 2
  completed_date: "2026-03-13"
---

# Phase 03 Plan 07: Render, Export, and Stories Summary

PNG rendering with live progress, native export flow, and complete story workflow from generation to export.

## What Was Built

**Step 4: Render & Review**
- Manual trigger: "Render & Preview" button initiates render process (user control, no auto-render)
- Sequential slide rendering: Each slide builds HTML from template, injects content, calls renderToPNG at 1080x1350
- Progress indicator: Linear progress bar + incremental thumbnail grid showing completion state per slide
- PNG preview grid: 2-3 columns with slide number and type labels
- Overlay opacity controls: Per-slide slider (0-100) with debounced re-render of specific slide only
- Standard CTA injection: Last slide automatically uses visualGuidance.standardCTA when slide_type is 'cta' (POST-17)
- Export flow: Native folder picker -> save all PNGs + caption.txt with date_themeSlug naming convention
- Post persistence: Creates post record + slides in DB, updates status to 'approved', updates balance matrix
- Navigation: Advances to Step 5 (Stories) after successful export

**Step 5: Stories**
- Auto-generation on mount: Triggers story generation immediately (user already exported feed post)
- Story generation service: buildStoryPrompt constructs prompt with feed context, slide texts, and active story tools
- Story proposal display: 2-4 cards with type/timing/tool badges, rationale, source slide reference
- Approve/Reject/Edit controls: Inline approval state with green border for approved stories
- Edit mode: Inline form with dropdowns for story_type, timing, tool_type, and textarea for text_content
- Story rendering: Approved stories render at 1080x1920 using simple HTML template with brand colors
- Story export: Writes story PNGs to same folder as feed post with date_themeSlug_story-0N.png naming
- Workflow completion: "Create Another Post" resets wizard, "Skip Stories" navigates to dashboard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Component] Created Badge component**
- **Found during:** Task 2 - Step5Stories implementation
- **Issue:** Step5Stories imports Badge component but it doesn't exist in the UI library
- **Fix:** Created src/renderer/src/components/ui/badge.tsx following shadcn pattern with variant support
- **Files modified:** src/renderer/src/components/ui/badge.tsx (created)
- **Commit:** 7264b2f

**2. [Rule 3 - Build Infrastructure] HTML template placeholder approach**
- **Found during:** Task 1 - buildSlideHTML implementation
- **Issue:** Template HTML uses basic string replacement rather than proper template engine
- **Fix:** Used simple {{placeholder}} replacement for zones and brand colors - works for Phase 3, proper template engine deferred
- **Files modified:** src/renderer/src/components/wizard/Step4RenderReview.tsx
- **Commit:** becefb6
- **Note:** This is temporary - production should use proper template engine with zone injection logic

## Verification Results

**Build:** Clean - no errors, all TypeScript compiles
**Components created:** 3 wizard components (Step4RenderReview, Step5Stories), 1 UI component (Badge), 1 service (story-generator)
**File naming convention:** Implements date_themeSlug pattern correctly for both feed and story exports
**IPC integration:** Uses existing generation.ts handlers for story streaming
**Store integration:** Leverages useCreatePostStore for state management across wizard steps

## Post-Completion State

**Requirements fulfilled:**
- POST-13: Render trigger with progress indicator
- POST-14: Final PNG thumbnails displayed
- POST-15: Per-slide overlay opacity re-render
- POST-16: Export via native folder picker
- POST-17: Standard CTA on last carousel slide
- STORY-01 through STORY-10: Story generation, editing, approval, and export workflow

**Wizard completion:** Full flow from Step 1 (Recommendation) through Step 5 (Stories) now functional
**Export artifacts:** Feed PNGs, caption.txt, story PNGs all written to user-selected folder
**Learning system integration:** Balance matrix updated on export with pillar/theme/mechanic usage

## Known Limitations

1. **Template engine:** Currently uses basic string replacement - proper template engine with zone injection needed for production
2. **Template selection:** Hardcoded to first template - needs user template picker in Step 1
3. **Story templates:** Simple HTML approach for 9:16 - dedicated story template system deferred to future phase
4. **Settings versioning:** Post creation uses settings_version_id: null - versioning system not yet implemented
5. **Brand ID:** Hardcoded to brand_id: 1 - multi-brand support deferred

## Next Steps

Plan 03-08 will implement the wizard container and routing to wire all 5 steps together into a complete Create Post page.

## Self-Check: PASSED

**Files created:**
- FOUND: src/renderer/src/components/wizard/Step4RenderReview.tsx
- FOUND: src/renderer/src/components/wizard/Step5Stories.tsx
- FOUND: src/main/services/story-generator.ts
- FOUND: src/renderer/src/components/ui/badge.tsx

**Commits:**
- FOUND: becefb6 (Task 1: Step 4 render/review/export)
- FOUND: 7264b2f (Task 2: Step 5 stories + generation service)

All artifacts verified. Plan execution complete.
