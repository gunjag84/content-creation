---
phase: quick
plan: 260319-mmp
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/types.ts
  - src/shared/pillarConstraints.ts
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
  - data/settings.json
autonomous: true
must_haves:
  truths:
    - "Selecting a pillar populates angle dropdown with that pillar's angles only"
    - "Selecting a pillar filters method and tonality dropdowns to allowed values"
    - "Area is optional when Nurture Loyalty is selected, required for other pillars"
    - "Wizard order is Pillar > Angle > Area > Method > Tonality > Format"
    - "Generated content uses angle description in prompt instead of approach"
    - "Post saves with angle field (not approach) and persists to DB"
    - "Recommendation engine returns angle instead of approach"
    - "settings.json contains 3 pillars with nested angles, allowedTonalities, allowedMethods, areaRequired"
  artifacts:
    - path: "src/shared/pillarConstraints.ts"
      provides: "DRY filter utilities for pillar constraints"
      exports: ["getAnglesForPillar", "getFilteredMethods", "getFilteredTonalities", "isAreaRequired"]
    - path: "src/shared/types.ts"
      provides: "Updated PillarSchema with angles, allowedTonalities, allowedMethods, areaRequired; AngleSchema; PostRow.angle replaces approach"
    - path: "data/settings.json"
      provides: "Seed data with 3 pillars containing nested angles and constraint config"
  key_links:
    - from: "src/client/pages/CreatePost.tsx"
      to: "src/shared/pillarConstraints.ts"
      via: "import filter functions"
      pattern: "getAnglesForPillar|getFilteredMethods|getFilteredTonalities"
    - from: "src/server/services/prompt-assembler.ts"
      to: "pillar angle description"
      via: "angle lookup replaces approach lookup"
      pattern: "angleEntry"
    - from: "src/server/routes/posts.ts"
      to: "balance_matrix angle dimension"
      via: "updateBalanceMatrix('angle',...)"
      pattern: "updateBalanceMatrix.*angle"
---

<objective>
Implement Phase A of the pillar-driven hierarchy redesign: pillars become the root of the creation flow with per-pillar angles (replacing approaches), per-pillar method/tonality constraints, and optional area.

Purpose: Transform the flat dimension model into a hierarchy where each pillar defines its own angles, allowed methods, allowed tonalities, and area requirement. This is the foundation for all subsequent phases (situation DB, balance dashboard upgrade, constraint config UI).

Output: Working wizard with new flow, updated data model, seeded settings, functional generation and recommendation.
</objective>

<execution_context>
@C:/Users/tim/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/tim/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/shared/types.ts
@src/server/services/prompt-assembler.ts
@src/server/services/learning-service.ts
@src/server/routes/posts.ts
@src/server/routes/generate.ts
@src/server/db/schema.sql
@src/server/db/index.ts
@src/server/db/queries.ts
@src/client/stores/wizardStore.ts
@src/client/pages/CreatePost.tsx
@src/client/pages/BrandConfig.tsx
@data/settings.json
@C:/Users/tim/.gstack/projects/gunjag84-content-creation/ceo-plans/2026-03-19-pillar-driven-hierarchy.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Data model, types, constraints utility, seed data, and DB migration</name>
  <files>
    src/shared/types.ts,
    src/shared/pillarConstraints.ts,
    src/server/db/schema.sql,
    src/server/db/index.ts,
    src/server/db/queries.ts,
    src/server/services/prompt-assembler.ts,
    src/server/services/learning-service.ts,
    src/server/routes/posts.ts,
    src/server/routes/generate.ts,
    data/settings.json
  </files>
  <action>
    **A. Update `src/shared/types.ts`:**

    1. Add `AngleSchema`:
       ```ts
       const AngleSchema = z.object({
         id: z.string(),
         name: z.string(),
         description: z.string().default('')
       })
       ```

    2. Extend `PillarSchema` with new fields:
       ```ts
       const PillarSchema = z.object({
         id: z.string(),
         name: z.string(),
         targetPct: z.number().min(0).max(100),
         rules: z.string().default(''),
         angles: z.array(AngleSchema).default([]),
         allowedTonalities: z.array(z.string()).default([]),
         allowedMethods: z.array(z.string()).default([]),
         areaRequired: z.boolean().default(true)
       })
       ```

    3. Remove `ApproachSchema` entirely. Remove `approaches` from `SettingsSchema`.

    4. On `SettingsSchema`: remove the `approaches` field.

    5. Update `BalanceRecommendation`: rename `approach` to `angle` (keep it `string | null`).

    6. Update `BalanceDashboardData`: rename `approaches` array to `angles` array (same shape: `{ name, count, avg_performance }`).

    7. Update `BalanceWarning.variable_type`: replace `'approach'` with `'angle'` in the union.

    8. Update `PostRow`: rename `approach` field to `angle` (keep `string | null`). Add optional stub fields: `situationId?: string | null`, `hookStrategy?: string | null`, `ctaStrategy?: string | null`.

    **B. Create `src/shared/pillarConstraints.ts`:**

    A pure utility module with zero side effects. Takes settings/pillar data as input, returns filtered arrays.

    ```ts
    import type { Settings } from './types'

    export function getAnglesForPillar(settings: Settings, pillarName: string) {
      const pillar = settings.pillars.find(p => p.name === pillarName)
      return pillar?.angles ?? []
    }

    export function getFilteredMethods(settings: Settings, pillarName: string) {
      const pillar = settings.pillars.find(p => p.name === pillarName)
      if (!pillar || pillar.allowedMethods.length === 0) return settings.methods
      const allowed = new Set(pillar.allowedMethods)
      return settings.methods.filter(m => allowed.has(m.name))
    }

    export function getFilteredTonalities(settings: Settings, pillarName: string) {
      const pillar = settings.pillars.find(p => p.name === pillarName)
      if (!pillar || pillar.allowedTonalities.length === 0) return settings.tonalities
      const allowed = new Set(pillar.allowedTonalities)
      return settings.tonalities.filter(t => allowed.has(t.name))
    }

    export function isAreaRequired(settings: Settings, pillarName: string): boolean {
      const pillar = settings.pillars.find(p => p.name === pillarName)
      return pillar?.areaRequired ?? true
    }
    ```

    **C. Update `data/settings.json`:**

    Remove the `approaches` array entirely. Update `pillars` array to include nested angles, allowedTonalities, allowedMethods, and areaRequired:

    ```json
    "pillars": [
      {
        "id": "p1", "name": "Generate Demand", "targetPct": 65, "rules": "",
        "angles": [
          { "id": "gd-a1", "name": "Reality of Moms' Life", "description": "Validating lived experience, messy reality" },
          { "id": "gd-a2", "name": "Appreciation", "description": "Self-acceptance, you are enough, doing less" },
          { "id": "gd-a3", "name": "Science of Happiness", "description": "Science-backed gratitude truths, studies" },
          { "id": "gd-a4", "name": "Analog Ritual Aspiration", "description": "Showcase journaling as loving, tactile ritual" }
        ],
        "allowedTonalities": ["T1 Emotional", "T2 Humorvoll", "T5 Ermutigend"],
        "allowedMethods": [],
        "areaRequired": true
      },
      {
        "id": "p2", "name": "Convert Demand", "targetPct": 25, "rules": "",
        "angles": [
          { "id": "cd-a1", "name": "Product-Centric Storytelling", "description": "Showcase journal, gratitude ritual, tactile experience, unboxing" },
          { "id": "cd-a2", "name": "Benefit-Driven Education", "description": "WHY3 methodology, science-backed rationale, practical impact" },
          { "id": "cd-a3", "name": "Social Proof & Testimonials", "description": "User stories, reviews, personalized rituals, transformation" }
        ],
        "allowedTonalities": ["T1 Emotional", "T3 Sachlich", "T5 Ermutigend"],
        "allowedMethods": [],
        "areaRequired": true
      },
      {
        "id": "p3", "name": "Nurture Loyalty", "targetPct": 10, "rules": "",
        "angles": [
          { "id": "nl-a1", "name": "Founder Story & Vulnerability", "description": "Authentic founder stories and challenges" },
          { "id": "nl-a2", "name": "Exclusive BTS", "description": "Product development, brand evolution, behind-the-scenes" },
          { "id": "nl-a3", "name": "Mission Thought Leadership", "description": "Core values, sustainability, digital detox, mindful living" },
          { "id": "nl-a4", "name": "Community Building", "description": "Polls, Q&As, challenges, gratitude journaling highlights" }
        ],
        "allowedTonalities": ["T1 Emotional", "T5 Ermutigend"],
        "allowedMethods": [],
        "areaRequired": false
      }
    ]
    ```

    Note: `allowedMethods` is empty array for all pillars initially (meaning ALL methods allowed). This is intentional - constraints are coarse-grained for now, Phase D adds the config UI.

    **D. Update `src/server/db/schema.sql`:**

    Rename `approach` column to `angle` in posts table. Add nullable stub columns `situation_id TEXT`, `hook_strategy TEXT`, `cta_strategy TEXT`.

    **E. Update `src/server/db/index.ts`:**

    Add migration block in the `else` (existing DB) branch: if column `angle` doesn't exist, run `ALTER TABLE posts ADD COLUMN angle TEXT` then `UPDATE posts SET angle = approach` then drop the approach column via table rebuild (same pattern as existing MECE migration). Also rename `approach` entries in balance_matrix: `UPDATE balance_matrix SET variable_type = 'angle' WHERE variable_type = 'approach'`. Add situation_id, hook_strategy, cta_strategy columns if missing.

    Clean break is fine per decision - but the migration code handles the case where the DB already exists from dev/test usage. Since this is dev data, a simpler approach: just delete the DB file and let it recreate from schema.sql. Add a comment in the migration noting this.

    Actually, per CEO decision: "Clean break - no migration needed for old data." So: in db/index.ts, do NOT write migration code for approach->angle. Instead, just update schema.sql with the new column names and let users delete data/content-creation.db to get a fresh start. Add a comment near the top of initDatabase explaining this.

    For the migration block: still need to handle the case where DB exists but doesn't have `angle` column. Add a simple check: if `angle` column missing, log a warning and add it. Also add stub columns if missing.

    **F. Update `src/server/db/queries.ts`:**

    1. `PostInsert` interface: rename `approach` to `angle`. Add optional `situationId`, `hookStrategy`, `ctaStrategy`.
    2. `insertPost`: update SQL to use `angle` instead of `approach`. Add `situation_id`, `hook_strategy`, `cta_strategy` columns.
    3. `getAvgPerformanceByDimension`: update `approach` key to `angle` in columnMap.

    **G. Update `src/server/routes/posts.ts`:**

    1. In POST `/` handler: change `updateBalanceMatrix('approach', post.approach)` to `updateBalanceMatrix('angle', post.angle)`.
    2. In GET `/meta/recommendation`: replace `validApproaches` with `validAngles`. Collect all angles from all pillars: `settings.pillars.flatMap(p => p.angles.map(a => a.name))`. Filter `approach` entries as `angle` entries.
    3. In GET `/meta/balance`: update `calculateBalance` call - no changes needed since it reads from balance_matrix which will have `angle` type.

    **H. Update `src/server/routes/generate.ts`:**

    1. Destructure `angle` instead of `approach` from `req.body`.
    2. Pass `angle` to `assemblePrompt` (parameter name change).

    **I. Update `src/server/services/prompt-assembler.ts`:**

    1. Rename `approach` parameter to `angle` in `assemblePrompt` signature.
    2. Remove `approachEntry` lookup (was: `settings.approaches.find(a => a.name === approach)`).
    3. Instead, look up angle from the selected pillar's angles array: find pillar in `settings.pillars`, then find angle in `pillar.angles`.
    4. In Section 1 (Role & Creative Brief): replace `${approach ? ' durch ' + approach : ''}` with `${angle ? ', Angle: ' + angle : ''}`.
    5. In Section 7 (Content Focus): replace the approach block with angle description:
       ```ts
       if (angleEntry) {
         focusLines.push(`\nAngle: ${angle}\n${angleEntry.description ?? ''}`)
       }
       ```
    6. In `buildCtaSection`: replace `pillarLower.includes('generate')` / `pillarLower.includes('convert')` string matching with proper pillar lookup. Find the pillar in settings, check `areaRequired` and pillar name for CTA logic. Actually, the string matching on pillar name is fine for now since pillar names are "Generate Demand", "Convert Demand", "Nurture Loyalty". Keep the same pattern but add `settings` parameter to `buildCtaSection` for future extensibility. For now, keep the `pillarLower.includes()` logic - it works with these pillar names.

    **J. Update `src/server/services/learning-service.ts`:**

    1. `recommendContent`: replace `approach` references with `angle`. In `REQUIRED_DIMS`, keep the same set but replace `approach` handling: angle is optional in recommendation (like approach was).
    2. `calculateBalance`: rename `approachEntries` to `angleEntries`, filter by `variable_type === 'angle'`.
    3. `generateWarnings`: update the `variable_type` type to include `'angle'` instead of `'approach'`.
  </action>
  <verify>
    <automated>cd C:/webprojects/content-creation && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>TypeScript compiles with zero errors. settings.json contains 3 pillars with nested angles. pillarConstraints.ts exports 4 filter functions. All references to `approach` replaced with `angle` in types, DB, queries, routes, prompt-assembler, and learning-service.</done>
</task>

<task type="auto">
  <name>Task 2: Wizard UI reorder and pillar-driven filtering</name>
  <files>
    src/client/stores/wizardStore.ts,
    src/client/pages/CreatePost.tsx,
    src/client/pages/BrandConfig.tsx
  </files>
  <action>
    **A. Update `src/client/stores/wizardStore.ts`:**

    1. Rename `selectedApproach` to `selectedAngle` in interface and initialState.
    2. In `setRecommendation`: map `rec.angle` to `selectedAngle` (was `rec.approach` to `selectedApproach`).
    3. Keep everything else the same.

    **B. Rewrite wizard UI in `src/client/pages/CreatePost.tsx`:**

    1. Import `getAnglesForPillar`, `getFilteredMethods`, `getFilteredTonalities`, `isAreaRequired` from `@shared/pillarConstraints`.

    2. **New wizard order (top to bottom):**
       - CONTENT section:
         - Pillar (full width) - first dropdown, always visible
         - Angle (full width) - populated from selected pillar's angles
         - Area (full width) - shows "-- optional --" placeholder when `isAreaRequired()` returns false
       - EXECUTION section:
         - Method (left) + Tonality (right) - both filtered by pillar constraints
         - Format toggle (left) + Slide count (right, if carousel)
       - OPTIONAL section:
         - Real Life Situation textarea (unchanged)

    3. **Cascade reset logic:** When pillar changes:
       - Reset selectedAngle to first angle of new pillar (or '' if no angles)
       - Reset selectedMethod to first filtered method
       - Reset selectedTonality to first filtered tonality
       - Reset selectedArea to '' if area is now optional (and was previously set)
       Implement this with a `useEffect` watching `store.selectedPillar` that calls the constraint functions with current settings.

    4. **Filtered dropdowns using useMemo:**
       ```ts
       const angles = useMemo(() => settings ? getAnglesForPillar(settings, store.selectedPillar) : [], [settings, store.selectedPillar])
       const filteredMethods = useMemo(() => {
         if (!settings) return []
         const pillarFiltered = getFilteredMethods(settings, store.selectedPillar)
         return pillarFiltered.filter(m => {
           if (!m.formatConstraints || m.formatConstraints.length === 0) return true
           return m.formatConstraints.includes(store.contentType)
         })
       }, [settings, store.selectedPillar, store.contentType])
       const filteredTonalities = useMemo(() => settings ? getFilteredTonalities(settings, store.selectedPillar) : [], [settings, store.selectedPillar])
       const areaRequired = useMemo(() => settings ? isAreaRequired(settings, store.selectedPillar) : true, [settings, store.selectedPillar])
       ```

    5. **canGenerate logic update:**
       ```ts
       const canGenerate = store.selectedPillar
         && store.selectedAngle
         && (areaRequired ? store.selectedArea : true)
         && store.selectedMethod
         && store.selectedTonality
       ```

    6. **handleGenerate update:** Send `angle` instead of `approach` in the `streamGenerate` call.

    7. **Recommendation badges:** Replace `approach` badge with `angle` badge. Update badge colors mapping.

    8. **Blacklist check:** Update `checkBlacklist` function: replace `approach` key with `angle` in `dimValues`.

    9. Remove the old `approaches` variable (was `const approaches = settings?.approaches ?? []`).

    10. **Empty angles guard:** If selected pillar has 0 angles, show a small warning message below the Angle dropdown: "No angles configured for this pillar. Add angles in Brand Configuration."

    **C. Update `src/client/pages/BrandConfig.tsx`:**

    1. Remove the entire "Approaches" `DimensionListEditor` section.

    2. In the Blacklist section: update the `dims` array from `['area', 'approach', 'method', 'tonality', 'pillar']` to `['area', 'angle', 'method', 'tonality', 'pillar']`.

    3. Update `getValues` in blacklist: replace `approach` case with `angle` case that collects all angles from all pillars: `settings.pillars.flatMap(p => p.angles.map(a => a.name))`. Use `local` instead of `settings` since BrandConfig works with local state.

    4. Clean up any remaining references to `approaches` in BrandConfig (the `blacklist.filter` calls on approach removal are no longer needed).

    Note: NOT adding the per-pillar constraint config UI (that's Phase D). The angles are embedded in pillar config in settings.json and will be manageable via BrandConfig's Pillars section in the future.
  </action>
  <verify>
    <automated>cd C:/webprojects/content-creation && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>Wizard shows Pillar > Angle > Area > Method > Tonality > Format order. Selecting a pillar populates angle dropdown with pillar-specific angles. Method and tonality dropdowns filter by pillar constraints. Area shows optional indicator for Nurture Loyalty. Approach dimension fully removed from UI. TypeScript compiles clean.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete pillar-driven hierarchy redesign (Phase A): new wizard order, per-pillar angles replacing approaches, pillar-filtered methods/tonalities, optional area, updated prompt assembly, updated recommendation engine, seeded settings.json with 3 pillars and their angles.</what-built>
  <how-to-verify>
    1. Delete `data/content-creation.db` to get a fresh DB with new schema
    2. Start the app: `npm run dev`
    3. Go to Create Post wizard:
       - Verify order is: Pillar > Angle > Area > Method > Tonality > Format
       - Select "Generate Demand" - verify 4 angles appear (Reality of Moms' Life, Appreciation, Science of Happiness, Analog Ritual Aspiration)
       - Select "Convert Demand" - verify 3 angles appear, previous angle resets
       - Select "Nurture Loyalty" - verify Area shows "-- optional --" and is not required
       - Verify Method dropdown shows all methods (allowedMethods is empty = all allowed)
       - Verify Tonality filters: Generate Demand should show Emotional, Humorvoll, Ermutigend only
       - Try generating content - verify it works end-to-end
    4. Go to Brand Configuration:
       - Verify "Approaches" section is gone
       - Verify Blacklist dimension dropdown shows "angle" instead of "approach"
    5. Save a post, then check recommendation endpoint still works
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- App starts without crashes
- Wizard cascade: pillar change resets angle, method, tonality
- Generation produces content using angle context
- Post saves to DB with angle column
- Recommendation engine returns angle (not approach)
</verification>

<success_criteria>
- Flat approach dimension fully eliminated from codebase
- Pillar-driven hierarchy working: Pillar > Angle > Area > Method > Tonality > Format
- Per-pillar constraints filtering methods and tonalities in wizard
- Area optional for Nurture Loyalty pillar
- pillarConstraints.ts used by wizard, prompt-assembler (future: learning-service)
- settings.json seeded with 3 pillars, their angles, and constraint config
- Clean TypeScript compilation
</success_criteria>

<output>
After completion, create `.planning/quick/260319-mmp-implement-phase-a-of-the-pillar-driven-h/260319-mmp-SUMMARY.md`
</output>
