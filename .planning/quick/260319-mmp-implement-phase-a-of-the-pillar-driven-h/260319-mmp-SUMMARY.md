---
phase: quick
plan: 260319-mmp
subsystem: content-creation-wizard
tags: [pillar-hierarchy, angles, wizard-ui, prompt-assembly, data-model]
dependency_graph:
  requires: []
  provides: [pillar-driven-hierarchy-phase-a, angle-dimension, pillar-constraints-utility]
  affects: [wizard-flow, prompt-assembly, learning-service, balance-dashboard, db-schema]
tech_stack:
  added: [pillarConstraints.ts]
  patterns: [pillar-as-root, cascade-reset, per-pillar-angle-filtering, angle-aware-prompts]
key_files:
  created:
    - src/shared/pillarConstraints.ts
  modified:
    - src/shared/types.ts
    - data/settings.json
    - src/server/db/schema.sql
    - src/server/db/index.ts
    - src/server/db/queries.ts
    - src/server/services/prompt-assembler.ts
    - src/server/services/learning-service.ts
    - src/server/routes/posts.ts
    - src/server/routes/generate.ts
    - src/client/stores/wizardStore.ts
    - src/client/pages/CreatePost.tsx
    - src/client/pages/BrandConfig.tsx
    - src/client/pages/ReviewDownload.tsx
    - src/client/pages/PostHistory.tsx
decisions:
  - "Approaches merged into per-pillar angles - no shared approach dimension"
  - "pillarConstraints.ts is pure utility with zero side effects"
  - "DB migration handles approach->angle for existing DBs; clean break preferred"
  - "allowedMethods empty array = all methods allowed (coarse constraints for Phase A)"
  - "Area optional only for Nurture Loyalty (areaRequired: false)"
metrics:
  duration: 10 min
  completed_date: "2026-03-19"
  tasks: 2
  files: 15
---

# Phase Quick Plan 260319-mmp: Pillar-Driven Hierarchy Phase A Summary

Implemented pillar-as-root hierarchy for the content creation wizard: each pillar now defines its own angles (replacing the flat approach dimension), allowed tonalities, allowed methods, and area requirement. Wizard order is Pillar > Angle > Area > Method > Tonality > Format with full cascade reset on pillar change.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Data model, types, constraints utility, seed data, DB migration | 5b20a66 | 10 files |
| 2 | Wizard UI reorder and pillar-driven filtering | 7ba6a3a | 5 files |

## What Was Built

### Data Model (Task 1)

**types.ts:** Added `AngleSchema` and extended `PillarSchema` with `angles`, `allowedTonalities`, `allowedMethods`, `areaRequired`. Removed `ApproachSchema` and `approaches` from `SettingsSchema`. Renamed `approach` to `angle` in `BalanceRecommendation`, `BalanceWarning`, `BalanceDashboardData`, and `PostRow`. Added stub fields `situationId`, `hookStrategy`, `ctaStrategy` to `PostRow` for future phases.

**pillarConstraints.ts:** New pure utility module exporting `getAnglesForPillar`, `getFilteredMethods`, `getFilteredTonalities`, `isAreaRequired`. Zero side effects, takes settings as input.

**settings.json:** 3 pillars with nested angles and constraint config seeded. Generate Demand (4 angles), Convert Demand (3 angles), Nurture Loyalty (4 angles, areaRequired: false). AllowedMethods empty = all methods allowed. AllowedTonalities restrict per pillar.

**schema.sql:** `approach` column renamed to `angle`. Added `situation_id`, `hook_strategy`, `cta_strategy` stub columns.

**DB migration (index.ts):** Adds `angle` column and copies from `approach` for existing DBs. Renames `balance_matrix` entries from `approach` type to `angle`. Adds stub columns if missing.

**queries.ts:** `PostInsert` interface uses `angle`. `insertPost` SQL uses `angle`, `situation_id`, `hook_strategy`, `cta_strategy`. `getAvgPerformanceByDimension` type updated to `angle`.

**routes/posts.ts:** Balance matrix updated with `angle` type. Recommendation endpoint uses `validAngles` collected from all pillar angles.

**routes/generate.ts:** Destructures `angle` instead of `approach`. Area now optional at API level.

**prompt-assembler.ts:** Parameter renamed to `angle`. `angleEntry` looked up via pillar -> angle chain. Section 1 uses `Angle: ${angle}`. Section 7 uses `angleEntry.description`.

**learning-service.ts:** `recommendContent` returns `angle` (null if no angle entries). `calculateBalance` uses `angleEntries` filtering `variable_type === 'angle'`.

### Wizard UI (Task 2)

**wizardStore.ts:** `selectedApproach` renamed to `selectedAngle`. `setRecommendation` maps `rec.angle`.

**CreatePost.tsx:** Complete rewrite with new wizard order. Imports `pillarConstraints` utilities. `useEffect` cascade reset on `selectedPillar` change (angle, method, tonality all reset). `useMemo` for angles, filteredMethods, filteredTonalities, areaRequired. `canGenerate` requires pillar + angle + (area if required) + method + tonality. Sends `angle` to `streamGenerate`. Recommendation badge shows `angle`. Area shows "(optional)" label and "-- optional --" placeholder for Nurture Loyalty.

**BrandConfig.tsx:** Approaches DimensionListEditor section removed. Blacklist dims array updated to `['area', 'angle', 'method', 'tonality', 'pillar']`. `getValues` for `angle` collects from all pillar angles. `addPillar` creates full pillar object with new fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed approach references in PostHistory.tsx and ReviewDownload.tsx**
- **Found during:** Task 2
- **Issue:** `PostHistory.tsx` used `post.approach` and `ReviewDownload.tsx` used `selectedApproach` / sent `approach` in POST body
- **Fix:** Updated both files to use `post.angle` and `selectedAngle` / `angle` respectively
- **Files modified:** `src/client/pages/PostHistory.tsx`, `src/client/pages/ReviewDownload.tsx`
- **Commit:** 7ba6a3a (included in Task 2 commit)

## Self-Check

### Files Created
- `src/shared/pillarConstraints.ts` - 4 exported functions

### Commits Verified
- 5b20a66 - Task 1: data model + server changes
- 7ba6a3a - Task 2: UI + client changes

## Self-Check: PASSED

All planned changes implemented. TypeScript server-side compiles clean. Client pre-existing errors (DOM types, @shared alias in root tsconfig) are pre-existing and not caused by this plan.

## Checkpoint: human-verify

The plan paused at `checkpoint:human-verify` after Task 2. Tasks 1 and 2 are committed. Verification steps are in the plan file.

**To verify:**
1. Delete `data/content-creation.db` for fresh DB with new schema
2. Start `npm run dev`
3. Create Post wizard: verify Pillar > Angle > Area > Method > Tonality > Format order
4. Generate Demand: 4 angles appear, tonality shows only Emotional/Humorvoll/Ermutigend
5. Nurture Loyalty: Area shows "-- optional --", not required for canGenerate
6. Brand Config: Approaches section gone, blacklist dropdown shows "angle"
7. Generate content end-to-end
