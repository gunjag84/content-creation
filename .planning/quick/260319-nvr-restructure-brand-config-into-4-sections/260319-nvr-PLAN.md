---
phase: quick
plan: 260319-nvr
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/pages/BrandConfig.tsx
  - src/client/components/Layout.tsx
  - src/client/App.tsx
  - src/shared/types.ts
  - src/client/pages/CreatePost.tsx
autonomous: true
requirements: [NVR-01]
must_haves:
  truths:
    - "Brand Config sidebar shows 4 sub-sections: Brand Identity, Creative Library, Design Settings, Content Strategy"
    - "Clicking each sub-section renders the correct group of fields"
    - "Blacklist section is completely removed from UI, types, and wizard validation"
    - "All existing fields remain functional in their new sections"
    - "Creative Library shows placeholder sections with Coming soon indicators"
  artifacts:
    - path: "src/client/pages/BrandConfig.tsx"
      provides: "4-section Brand Config with sub-navigation"
    - path: "src/shared/types.ts"
      provides: "Settings schema without BlacklistEntrySchema"
    - path: "src/client/pages/CreatePost.tsx"
      provides: "Wizard without blacklist validation"
  key_links:
    - from: "src/client/components/Layout.tsx"
      to: "src/client/pages/BrandConfig.tsx"
      via: "brand nav item with sub-sections"
    - from: "src/client/pages/BrandConfig.tsx"
      to: "src/shared/types.ts"
      via: "Settings type without blacklist field"
---

<objective>
Restructure the BrandConfig page from a single flat scroll into 4 navigable sections: Brand Identity, Creative Library, Design Settings, and Content Strategy. Remove the blacklist feature entirely (types, UI, wizard validation). Creative Library gets placeholder sections with "Coming soon" indicators.

Purpose: Better information architecture for brand configuration as the feature set grows. Blacklist is replaced by pillar constraints (allowedMethods, allowedTonalities) already implemented.
Output: Restructured BrandConfig with sub-navigation, blacklist fully removed.
</objective>

<context>
@.planning/quick/260319-nvr-restructure-brand-config-into-4-sections/260319-nvr-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove blacklist from types and wizard</name>
  <files>src/shared/types.ts, src/client/pages/CreatePost.tsx</files>
  <action>
1. In `src/shared/types.ts`:
   - Delete the `BlacklistEntrySchema` z.object definition (lines 140-144)
   - Remove `blacklist: z.array(BlacklistEntrySchema).default([])` from SettingsSchema (line 159)

2. In `src/client/pages/CreatePost.tsx`:
   - Delete the `checkBlacklist` function entirely (lines 12-24)
   - Remove the `blacklistViolations` useMemo (around line 118-121)
   - Remove the blacklist warning JSX block that renders violations (around lines 189-196, the div with `blacklistViolations.length > 0`)
   - Remove any unused imports that resulted from these deletions

These are safe removals - the blacklist functionality is fully replaced by pillar constraints (allowedMethods, allowedTonalities) which are already implemented and enforced via `getFilteredMethods` and `getFilteredTonalities` from `@shared/pillarConstraints`.
  </action>
  <verify>
    <automated>cd /c/webprojects/content-creation && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>BlacklistEntrySchema removed from types, blacklist field removed from Settings schema, checkBlacklist function and all its UI references removed from CreatePost. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Restructure BrandConfig into 4 sub-sections with navigation</name>
  <files>src/client/pages/BrandConfig.tsx, src/client/components/Layout.tsx</files>
  <action>
1. In `src/client/pages/BrandConfig.tsx`:

   Add a local state for active section: `const [section, setSection] = useState<'identity' | 'library' | 'design' | 'strategy'>('identity')`

   Add a horizontal tab bar (or vertical sub-nav on the left) below the page header with 4 tabs:
   - Brand Identity (icon suggestion: user/megaphone)
   - Creative Library (icon suggestion: book/folder)
   - Design Settings (icon suggestion: palette/paintbrush)
   - Content Strategy (icon suggestion: target/chart)

   Use simple styled buttons/tabs - no router needed, just conditional rendering based on `section` state.

   **Brand Identity section** (`section === 'identity'`):
   - Render the existing Context Documents section BUT only these fields from `contextDocLabels`:
     - brandVoice -> "Brand Voice"
     - targetPersona -> "Target Persona"
     - productUVP -> "Product & UVP"
     - pov -> "Point of View"
     - competitive -> "Competitive Landscape"
   - Remove "hooks" from contextDocLabels (it belongs in Creative Library, but per decision: move deferred to follow-up)

   **Creative Library section** (`section === 'library'`):
   - Three placeholder cards/subsections:
     - "Real Life Situations" with a brief description and "Coming soon" badge
     - "Hooks" with "Coming soon" badge (note: existing hooks textarea stays in Brand Identity for now, will be moved in follow-up)
     - "CTAs" with "Coming soon" badge (existing CTA text field stays in Design Settings for now)
   - Style each as a bordered card with title, description text, and a muted "Coming soon" pill/badge

   **Design Settings section** (`section === 'design'`):
   - Colors subsection (existing color pickers, unchanged)
   - Fonts subsection (existing font selectors + upload, unchanged)
   - Logo & Handle subsection (existing logo upload + handle input, unchanged)
   - Content Defaults subsection (existing char limit inputs, unchanged)
   - CTA field stays here for now (existing `visual.cta` input)

   **Content Strategy section** (`section === 'strategy'`):
   - Pillars subsection (existing pillar editor, unchanged)
   - Areas subsection (existing DimensionListEditor for areas, unchanged)
   - Methods subsection (existing DimensionListEditor for methods, unchanged)
   - Tonalities subsection (existing DimensionListEditor for tonalities, unchanged)
   - NO blacklist section (removed in Task 1)

   Remove ALL blacklist references from event handlers:
   - In `onRemove` for areas DimensionListEditor: remove the `blacklist: local.blacklist.filter(...)` from the setLocal call
   - In `onRemove` for methods DimensionListEditor: same removal
   - In `onRemove` for tonalities DimensionListEditor: same removal
   - These handlers should just filter the respective array, no blacklist cleanup needed

   Keep the existing auto-save, loading, and save button logic exactly as-is at the top level.

2. In `src/client/components/Layout.tsx`:
   - No structural changes needed. The "Brand Config" nav item already exists and routes to the BrandConfig page.
   - The sub-navigation lives inside BrandConfig itself (tab bar), not in the sidebar.
  </action>
  <verify>
    <automated>cd /c/webprojects/content-creation && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>BrandConfig page renders 4 tabbed sections. Brand Identity shows voice/persona/UVP/POV/competitive fields. Creative Library shows 3 placeholder cards with "Coming soon" badges. Design Settings shows colors/fonts/logo/handle/CTA/content-defaults. Content Strategy shows pillars/areas/methods/tonalities. No blacklist references remain anywhere. All existing field editing and auto-save still works.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `grep -r "blacklist\|Blacklist\|BlacklistEntry" src/` returns zero matches
- App loads BrandConfig page, 4 section tabs are visible and clickable
- Each section shows the correct group of fields
- Auto-save still triggers on field changes
</verification>

<success_criteria>
- Brand Config page has 4 navigable sections replacing the flat scroll
- Blacklist completely removed from types, UI, and wizard
- Creative Library shows 3 placeholder items with "Coming soon"
- All existing form fields remain editable and auto-save works
- TypeScript compiles clean with zero blacklist references in src/
</success_criteria>

<output>
After completion, create `.planning/quick/260319-nvr-restructure-brand-config-into-4-sections/260319-nvr-SUMMARY.md`
</output>
