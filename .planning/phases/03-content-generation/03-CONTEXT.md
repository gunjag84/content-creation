# Phase 3: Content Generation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end content workflow from recommendation to export-ready PNGs. Covers: system recommendation based on rotation balance, user selection/override, AI text generation via Claude API, inline slide and caption editing, PNG rendering, feed post export, story proposal generation and editing, story export, and the learning system (balance matrix tracking and soft-signal warnings). Performance tracking UI is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Workflow navigation
- Full-page wizard replaces the current content area when user is in create mode
- 5 steps: (1) Recommendation & Selection, (2) Generation, (3) Edit Text, (4) Render & Review, (5) Stories
- Step indicator at top showing current position
- Step 1: Recommendation displayed as a highlighted card ("Based on balance: Generate Demand → Coaching → Hook Mechanic") with override dropdowns below each dimension
- Trigger to advance from Step 1 to Step 2: explicit "Generate Content" button (intentional, fires API call)
- Impulse field (free-text to guide generation) lives on Step 1 below the theme/mechanic selections
- After export (end of Step 5 or Step 4 if no stories): return to dashboard + success toast

### AI generation UX
- Streaming token-by-token (text appears word-by-word as Claude generates, like Claude.ai)
- Collapsible "View prompt" section on the generation step - collapsed by default, power users can expand to see the full assembled prompt
- New draft request (POST-12): overwrites existing content, no version history
- Alternative hooks (POST-09): shows 3 options in a list, user picks one to replace the current hook (does not overwrite other content)

### Text editing model
- Two-panel layout: text fields on the left, live HTML preview on the right
- Left panel: each slide's fields (hook, body, CTA) as editable textareas
- Right panel: live HTML preview using the template HTML/CSS rendered directly in the browser - updates as user types, not pixel-perfect but instant feedback
- Final Puppeteer PNG render happens separately on Step 4 (not during editing)
- Carousel slide navigation: thumbnail strip above the preview showing all slides (numbered, with type label: Cover/Content/CTA) - clicking a thumbnail focuses that slide's fields and preview
- Caption editing: "Slides" tab and "Caption" tab below the text panel - separate tabs since caption has different rules (longer, storytelling, SEO, hashtags)

### Render & review (Step 4)
- User clicks "Render & Preview" button on Step 4 to trigger Puppeteer renders
- Progress indicator shows each slide completing during render
- User sees final PNG previews after render completes
- Per-slide overlay opacity adjustment (POST-15) available on this step - changing opacity triggers a re-render of that slide

### Export flow
- Native folder picker dialog (Electron's native file dialog) opens to pick export location
- All files land in the chosen folder as a flat list (no subfolders)
- File naming: date + theme slug pattern (e.g., 2026-03-11_coaching-transformation_slide-01.png, 2026-03-11_coaching-transformation_caption.txt, 2026-03-11_coaching-transformation_story-01.png)
- Feed post exported first; stories follow as Step 5

### Story workflow (Step 5)
- Story proposals appear after feed post export as Step 5 in the same wizard session
- System generates 2-4 story proposals linked to the feed post
- User reviews/edits/approves each story (type, tool recommendation, text, source slide)
- Story PNGs exported alongside feed PNGs (same naming convention, same flat folder)

### Learning system display
- Dashboard widget: compact balance overview showing distribution per dimension (pillar %, mechanic usage count, theme coverage) as horizontal bar charts
- Cold start state: "No posts yet - start creating to see balance insights" with a prompt to start
- Soft-signal warnings: subtle inline badge/tooltip on the affected dropdown field on Step 1 (e.g., amber indicator on mechanic dropdown, tooltip shows "Hook mechanic used 4x in 2 weeks - rotate?")
- Warnings are non-intrusive - suggestions, not blockers

### Manual mode (POST-07)
- Claude's Discretion on exact trigger mechanism (toggle, button, or link on Step 1)
- Manual mode provides empty text zones for each slide - user fills them directly
- Same editing UI as AI mode (two-panel, thumbnail navigation) but no generation step

### Draft / in-progress state
- Claude's Discretion - posts saved as 'draft' in DB as they're built through the wizard
- Schema already supports status ('draft' | 'approved' | 'exported')
- Whether unfinished drafts are resumable from dashboard is Claude's call

</decisions>

<specifics>
## Specific Ideas

- Streaming output should feel like Claude.ai - natural, not jumpy
- The recommendation card should make it clear this is a system suggestion based on balance data, not a mandate
- Thumbnail strip pattern inspired by PowerPoint/Keynote slide panel - familiar for carousel navigation
- "View prompt" collapsible is for transparency and trust - user can see their settings are being used
- Cold start empty state on dashboard should prompt action (not just show emptiness)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main/services/render-service.ts`: HTML-to-PNG via hidden BrowserWindow - already working, will be called for Step 4 Puppeteer renders and story renders
- `src/main/services/settings-service.ts`: Load/save with Zod validation - all brand config (voice, persona, mechanics, themes, etc.) accessible for prompt assembly
- `src/main/services/security-service.ts`: safeStorage for API key - decrypt call needed before Claude API requests
- `src/renderer/src/hooks/useAutoSave.ts`: Debounced save pattern - reusable for post draft auto-save
- `src/renderer/src/lib/utils.ts`: cn() utility (clsx + tailwind-merge) - established pattern
- shadcn/ui components already installed: button, card, input, label, popover, select, separator, slider, switch, tabs, textarea
- Zustand installed and used in settings - same pattern for post workflow state

### Established Patterns
- IPC via typed preload bridge: define channel in shared types, handler in `src/main/ipc/`, expose in `preload/index.ts`
- Page switching via `activeItem` state in App.tsx - add 'create' case to renderPage switch
- Dark mode as default, CSS variables in globals.css
- Settings store pattern with Zustand (established in Phase 2)

### Integration Points
- `App.tsx`: 'create' case in `renderPage()` switch - create the CreatePost page component here
- `src/main/db/queries.ts`: `insertPost()`, `PostInsert` interface, `StoryInsert` already defined - CRUD ready
- `src/main/db/schema.sql`: posts, slides, stories, balance_matrix tables all defined - no schema changes needed
- `Sidebar.tsx`: 'create' nav item exists - already wired, just needs the page
- New IPC handlers needed: `src/main/ipc/generation.ts` for Claude API calls, `src/main/ipc/posts.ts` for post CRUD, `src/main/ipc/balance.ts` for learning system queries
- Streaming via Claude API will require `@anthropic-ai/sdk` - likely not yet installed, needs to be added

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-content-generation*
*Context gathered: 2026-03-11*
