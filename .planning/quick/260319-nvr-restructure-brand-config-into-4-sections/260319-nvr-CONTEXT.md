# Quick Task 260319-nvr: Restructure Brand Config into 4 sections - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Task Boundary

Restructure Brand Config into 4 sections: (1) Brand Identity (voice, persona, UVP, POV, competitive), (2) Creative Library (situations, hooks, CTAs), (3) Design Settings (colors, fonts, logo, handle, content defaults), (4) Content Strategy (pillars with nested angles+constraints, areas, methods, tonalities). Remove blacklist entirely - pillar constraints replace it. Instagram stays separate as app settings.

</domain>

<decisions>
## Implementation Decisions

### Navigation Style
- Sidebar sub-nav: nested items under a "Brand Config" parent in the main sidebar
- Each section (Brand Identity, Creative Library, Design Settings, Content Strategy) is its own sub-route
- Mirrors the existing Settings sidebar pattern if one exists

### Creative Library Scope
- Placeholder sections with "Coming soon" indicators
- Restructure navigation and grouping now, build CRUD for situations/hooks/CTAs in a follow-up task
- Move existing hooks textarea and CTA text field into this section (they exist today in contextDocs and visual)

### Pillar Angle Editor
- Defer to a follow-up task
- Keep current pillar editor as-is for this task
- Angle editing (nested accordion with add/edit/delete, allowedMethods, allowedTonalities, areaRequired) is a separate task

### Blacklist Removal
- Remove blacklist from types, settings.json seed data, and UI entirely
- Pillar constraints (allowedMethods, allowedTonalities) replace blacklist functionality
- No migration needed - blacklist data in settings.json is simply dropped on next save

</decisions>

<specifics>
## Specific Ideas

### Section Mapping (current field -> new section)

**Brand Identity:**
- contextDocs.brandVoice -> Brand Voice textarea
- contextDocs.targetPersona -> Target Persona textarea
- contextDocs.productUVP -> Product & UVP textarea
- contextDocs.pov -> Point of View textarea
- contextDocs.competitive -> Competitive Landscape textarea

**Creative Library (placeholders):**
- Real Life Situations -> placeholder (new entity, no current data)
- Hooks -> placeholder (move contextDocs.hooks here in follow-up)
- CTAs -> placeholder (move visual.cta here in follow-up)

**Design Settings:**
- visual.colors -> Colors
- visual.fonts, visual.fontSizes, visual.fontLibrary -> Fonts
- visual.logo, visual.handle -> Logo & Handle
- visual.imageLibrary -> Image Library (if used)
- contentDefaults -> Content Defaults (char limits)

**Content Strategy:**
- pillars -> Pillars (current editor, no angle changes)
- areas -> Lebensbereiche
- methods -> Methods
- tonalities -> Tonalities
- blacklist -> REMOVED

</specifics>
