# Phase 2: Settings & Templates - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete brand configuration system covering all 11 settings areas and a visual template creation tool. Users can configure every aspect of their brand identity (voice, persona, themes, mechanics, visuals, prompts) and create image templates by uploading backgrounds and dragging rectangles to define text zones and no-text zones. Templates and settings persist across sessions with automatic versioning.

</domain>

<decisions>
## Implementation Decisions

### Settings editor layout
- Vertical tabs (left sidebar sub-nav within Settings page) for the 11 sections
- Each section gets its own panel - clean separation, scales well, no scrolling past unrelated settings
- Similar to VS Code settings or Figma preferences
- Templates managed inside Settings as one of the sections (not a separate top-level nav item)

### Save behavior
- Auto-save on change - every field change saves immediately, no save button
- Debounced for text fields (save after 500ms pause to avoid excessive writes)
- Version history captures each change via the existing settings service versioning
- User never has to remember to save

### Master prompt editor (SET-11)
- Simple monospace textarea, full-width, tall
- Pre-filled with working default, rarely edited
- "Reset to default" button for safety
- No code editor library needed - textarea sufficient for rare edits

### Template zone editor
- Click-and-drag freeform rectangle drawing on uploaded image preview
- Resize handles shown on selection
- Most flexible - no grid constraints
- Zone types: hook, body, CTA, no-text (protected areas)

### Zone configuration (simplified)
- Zone type (hook/body/CTA) automatically determines font role: hook -> headline font, body -> body font, CTA -> CTA font (all from brand guidance)
- Standard font size per zone type (configured in brand guidance)
- Minimum font size as fallback - text renders at standard size, auto-shrinks only if it overflows the zone
- No manual text alignment or max lines settings - text fills the space with standard font, auto-shrinks if needed
- Approximate character limit shown in editor based on zone dimensions and font size

### Zone configuration UI
- Inline popover appears when clicking a zone
- Shows dropdowns for type assignment, font size settings
- Quick, contextual, stays close to the visual
- Like annotation tools in design apps

### Template live preview
- Sample placeholder text renders inside zones as user draws/resizes them
- Uses actual brand fonts and standard font sizes
- Real-time feedback on zone sizing and text fit
- Helps judge if zones are sized correctly before saving

### Overlay controls (simplified)
- Toggle on/off, color picker, opacity slider
- No gradient support - just solid color overlay
- Controls visible below image preview in template editor
- Changes apply live so user sees readability impact immediately

### Brand colors (SET-07)
- Hex input + visual color picker for primary, secondary, and background colors
- Color swatch opens standard color picker (hue wheel/spectrum + hex input)
- All 3 colors shown as swatches side-by-side for visual harmony check

### Font management (SET-07)
- File upload per font slot (headline/body/CTA)
- Supports .ttf, .otf, .woff2 files
- Font files stored in app data directory
- Preview sentence shown in uploaded font immediately after upload
- Fonts registered in Electron for rendering
- Fallback to system fonts if none uploaded

### Brand preview
- Live preview card in the visual guidance section
- Mini post preview (scaled-down template) on the right side
- Updates as user changes colors, fonts, logo
- Immediate visual feedback on brand coherence
- Uses existing render service

### Logo placement (SET-07)
- Upload logo file
- Position picker (center, bottom-center, bottom-right, etc.)
- Size selector (small/medium/large)
- Standard CTA text and Instagram handle as text fields
- Preview shows the final carousel last-slide layout

### Theme hierarchy (SET-04)
- Themes pre-loaded from existing structure (Input files/lebenlieben-themen.md)
- 5 Oberthemen with Unterthemen and Kernaussagen already defined
- No visual tree editor needed for now - static structure is sufficient
- Themes linked to content pillars via existing mapping

### Post mechanics catalog (SET-05)
- Card list showing each of 7 mechanics with name, description, activate/deactivate toggle
- Click to expand and view full details (hook rules, slide ranges, pillar mapping, structure guidelines)
- Editing pre-filled content allowed but not encouraged
- Pre-filled from blueprint defaults

### Story tools catalog (SET-09)
- Same pattern as mechanics: card list with name, description, toggle, expandable details
- 18 pre-filled Instagram tools with engagement type, pillar mapping, mechanic recommendations
- Activate/deactivate toggle per tool
- View full details on expand

### Content pillar sliders (SET-03)
- Three coupled sliders that sum to 100%
- Auto-adjust proportionally when one slider moves
- E.g., increase Generate Demand from 50% to 60%, other two decrease proportionally
- Display percentage value next to each slider

### Claude's Discretion
- Exact component library choices (which shadcn/ui components to use)
- Loading states and error handling within settings sections
- Exact spacing, typography, and section padding
- How to handle first-launch experience (empty vs pre-filled sections)
- Template list view design (card grid vs list)
- Carousel variant support details (TPL-09: cover/content/CTA slide HTML)
- "Save as template" flow during manual post creation (TPL-08)
- API key input field design within settings (secure storage layer exists from Phase 1)

</decisions>

<specifics>
## Specific Ideas

- Theme structure already exists in `Input files/lebenlieben-themen.md` with 5 Oberthemen, subtopics, and content pillar mappings - load this as initial data
- Zone editor should feel like a cropping/annotation tool (familiar UX pattern)
- Font auto-shrink behavior: standard font size fills zone, only shrink to minimum font size if text overflows - no manual max_lines configuration
- Brand preview card should use the actual render service for fidelity
- Blueprint document (`content-creation-system-blueprint-final.md`) contains full specs for all 7 post mechanics and 18 story tools - use as source for pre-filled catalog data

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Settings service (src/main/services/settings-service.ts): Load/save/versioning already working with Zod validation
- IPC channels for settings: `settings:load` and `settings:save` with typed preload bridge
- Render service (src/main/services/render-service.ts): HTML-to-PNG via hidden BrowserWindow - reusable for template preview and brand preview card
- Security service (src/main/services/security-service.ts): safeStorage for API key - layer ready, needs UI input field
- shadcn/ui configured (components.json, New York style) - ready to add components
- cn() utility (src/renderer/src/lib/utils.ts): clsx + tailwind-merge for conditional classes
- Zustand installed but not used yet - available for settings state management

### Established Patterns
- Typed IPC via preload bridge: define channel in shared types, handler in main/ipc/, expose in preload/index.ts
- Settings stored as single JSON file with Zod schema validation on read AND write
- Dark mode as default theme with CSS variables in globals.css
- Page switching via activeItem state in App.tsx (switch statement in renderPage)

### Integration Points
- App.tsx: Settings case currently returns placeholder div - replace with Settings page component
- Sidebar.tsx: Settings nav item already exists with icon
- SQLite schema: templates table defined (id, brand_id, name, background_type/value, overlay settings, format, zones_config JSON)
- No template queries exist yet in queries.ts - need CRUD operations
- No template IPC handlers - need new file at src/main/ipc/templates.ts
- Preload types need extension for template operations

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 02-settings-templates*
*Context gathered: 2026-03-10*
