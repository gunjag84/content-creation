# Phase 2: Settings & Templates - Research

**Researched:** 2026-03-10
**Domain:** Electron + React settings UI, canvas-based zone editor, custom font handling
**Confidence:** HIGH

## Summary

Phase 2 builds a comprehensive brand configuration system with 11 settings areas and a visual template creation tool. The technical stack is already established: React 19 + shadcn/ui + Electron 40 + Zustand for state management. The core challenge is building a settings UI that auto-saves changes (debounced), a canvas-based zone editor for template creation (drag/resize rectangles on images), and custom font file handling for brand guidance.

The research confirms that shadcn/ui provides all necessary form components (tabs, inputs, textareas, sliders, switches), react-konva is the standard for canvas drag/resize operations, and react-colorful is the lightweight choice for color picking. Font files can be uploaded and registered via Electron file dialogs and CSS @font-face declarations. The existing settings service (Zod validation + auto-versioning) is reusable. The templates table schema already exists in SQLite.

Auto-save with debounce is a well-established pattern (500ms delay for text fields, immediate save for toggles/sliders). Coupled percentage sliders require proportional redistribution logic when one slider changes. The phase will load pre-filled catalog data from the blueprint document for mechanics and story tools.

**Primary recommendation:** Use shadcn/ui vertical tabs for settings navigation, react-konva for the zone editor, react-colorful for color pickers, and Zustand for client-side state management. Implement debounced auto-save with visual feedback. Build the zone editor as a separate component that outputs zone configuration JSON matching the templates table schema.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Settings editor layout**
- Vertical tabs (left sidebar sub-nav within Settings page) for the 11 sections
- Each section gets its own panel - clean separation, scales well, no scrolling past unrelated settings
- Similar to VS Code settings or Figma preferences
- Templates managed inside Settings as one of the sections (not a separate top-level nav item)

**Save behavior**
- Auto-save on change - every field change saves immediately, no save button
- Debounced for text fields (save after 500ms pause to avoid excessive writes)
- Version history captures each change via the existing settings service versioning
- User never has to remember to save

**Master prompt editor (SET-11)**
- Simple monospace textarea, full-width, tall
- Pre-filled with working default, rarely edited
- "Reset to default" button for safety
- No code editor library needed - textarea sufficient for rare edits

**Template zone editor**
- Click-and-drag freeform rectangle drawing on uploaded image preview
- Resize handles shown on selection
- Most flexible - no grid constraints
- Zone types: hook, body, CTA, no-text (protected areas)

**Zone configuration (simplified)**
- Zone type (hook/body/CTA) automatically determines font role: hook -> headline font, body -> body font, CTA -> CTA font (all from brand guidance)
- Standard font size per zone type (configured in brand guidance)
- Minimum font size as fallback - text renders at standard size, auto-shrinks only if it overflows the zone
- No manual text alignment or max lines settings - text fills the space with standard font, auto-shrinks if needed
- Approximate character limit shown in editor based on zone dimensions and font size

**Zone configuration UI**
- Inline popover appears when clicking a zone
- Shows dropdowns for type assignment, font size settings
- Quick, contextual, stays close to the visual
- Like annotation tools in design apps

**Template live preview**
- Sample placeholder text renders inside zones as user draws/resizes them
- Uses actual brand fonts and standard font sizes
- Real-time feedback on zone sizing and text fit
- Helps judge if zones are sized correctly before saving

**Overlay controls (simplified)**
- Toggle on/off, color picker, opacity slider
- No gradient support - just solid color overlay
- Controls visible below image preview in template editor
- Changes apply live so user sees readability impact immediately

**Brand colors (SET-07)**
- Hex input + visual color picker for primary, secondary, and background colors
- Color swatch opens standard color picker (hue wheel/spectrum + hex input)
- All 3 colors shown as swatches side-by-side for visual harmony check

**Font management (SET-07)**
- File upload per font slot (headline/body/CTA)
- Supports .ttf, .otf, .woff2 files
- Font files stored in app data directory
- Preview sentence shown in uploaded font immediately after upload
- Fonts registered in Electron for rendering
- Fallback to system fonts if none uploaded

**Brand preview**
- Live preview card in the visual guidance section
- Mini post preview (scaled-down template) on the right side
- Updates as user changes colors, fonts, logo
- Immediate visual feedback on brand coherence
- Uses existing render service

**Logo placement (SET-07)**
- Upload logo file
- Position picker (center, bottom-center, bottom-right, etc.)
- Size selector (small/medium/large)
- Standard CTA text and Instagram handle as text fields
- Preview shows the final carousel last-slide layout

**Theme hierarchy (SET-04)**
- Themes pre-loaded from existing structure (Input files/lebenlieben-themen.md)
- 5 Oberthemen with Unterthemen and Kernaussagen already defined
- No visual tree editor needed for now - static structure is sufficient
- Themes linked to content pillars via existing mapping

**Post mechanics catalog (SET-05)**
- Card list showing each of 7 mechanics with name, description, activate/deactivate toggle
- Click to expand and view full details (hook rules, slide ranges, pillar mapping, structure guidelines)
- Editing pre-filled content allowed but not encouraged
- Pre-filled from blueprint defaults

**Story tools catalog (SET-09)**
- Same pattern as mechanics: card list with name, description, toggle, expandable details
- 18 pre-filled Instagram tools with engagement type, pillar mapping, mechanic recommendations
- Activate/deactivate toggle per tool
- View full details on expand

**Content pillar sliders (SET-03)**
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

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SET-01 | User can configure brand voice (tonality, do's/don'ts, example posts upload, auto-generated voice profile with manual override) | Form patterns with file upload + text lists + auto-save research |
| SET-02 | User can configure target persona (demographics, pain points, goals, language expectations, media consumption, buying behavior) | Standard form patterns with text fields + lists |
| SET-03 | User can configure content pillars with coupled percentage sliders (Generate Demand / Convert Demand / Nurture Loyalty, sum = 100%) | Coupled slider patterns with proportional redistribution logic |
| SET-04 | User can manage theme hierarchy via tree editor (add/edit/archive Oberthema -> Unterthema -> Kernaussage, drag & drop reorder) | Pre-loaded from lebenlieben-themen.md, static structure sufficient (locked decision) |
| SET-05 | User can manage post mechanic catalog (7 pre-filled mechanics with hook rules, slide ranges, structure guidelines, pillar mapping, activate/deactivate) | Card list pattern with expand/collapse + toggle states |
| SET-06 | User can configure content defaults (carousel slide min/max, caption max chars, hashtag min/max, stories per feed post) | Number inputs with validation |
| SET-07 | User can configure brand guidance visuals (primary/secondary/background colors, headline/body/CTA fonts with custom upload, logo upload + placement, last carousel slide rules, standard CTA) | Color picker (react-colorful), file upload (Electron dialog), font registration (@font-face), live preview (render service) |
| SET-08 | User can write competitor analysis as free-text differentiation (optional, prompt block skipped when empty) | Rich textarea with optional flag |
| SET-09 | User can manage story tools catalog (18 pre-filled Instagram tools with engagement type, pillar mapping, mechanic recommendations, activate/deactivate) | Same pattern as SET-05, pre-filled from blueprint |
| SET-10 | User can write viral post expertise (hook formulas, viral mechanics, post structures - optional, prompt block skipped when empty) | Rich textarea with optional flag |
| SET-11 | User can view and edit master prompt template (code editor, rarely used, pre-filled with working default) | Monospace textarea with reset button (locked decision) |
| SET-12 | Every settings change is automatically versioned with timestamp (system can show which version was active for any post) | Existing settings service already implements this |
| TPL-01 | User can create a template by uploading a background image and being guided through zone definition | File upload + canvas zone editor |
| TPL-02 | User can visually drag rectangles on image preview to define text zones (hook, body, CTA) with font role, alignment, and max_lines per zone | react-konva for drag/resize, zone config simplified (locked decision) |
| TPL-03 | User can visually define no-text zones (protected areas where text must not appear) | Same canvas editor, different zone type |
| TPL-04 | User can configure overlay settings per template (color, opacity, gradient with stops, enabled/disabled) | Simplified: solid color only, no gradient (locked decision) |
| TPL-05 | User can set background type per template (image, solid color from brand guidance, gradient from brand guidance) | Radio selection + conditional inputs |
| TPL-06 | User can manage templates in settings (list, edit zones, delete, duplicate) | CRUD operations via IPC + SQLite queries |
| TPL-08 | User is offered "save as template?" when uploading a custom background image during manual post flow | Modal/dialog pattern with template name input |
| TPL-09 | Templates support carousel variants (separate cover slide, content slide, CTA slide HTML with shared config) | Schema extension for variant support |

</phase_requirements>

## Standard Stack

### Core UI Framework
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | Latest (2026) | Component library (Radix UI base) | Official recommendation for React + Tailwind, accessible, customizable, copy-paste not npm install |
| Tabs | - | Vertical navigation for 11 settings sections | Part of shadcn/ui, supports vertical orientation |
| Input | - | Text fields for all settings | Part of shadcn/ui, accessible |
| Textarea | - | Multi-line text (competitor analysis, viral expertise, master prompt) | Part of shadcn/ui |
| Slider | - | Numeric inputs (opacity, font sizes, coupled pillars) | Part of shadcn/ui |
| Switch | - | Boolean toggles (enable/disable mechanics/tools) | Part of shadcn/ui |
| Button | - | Actions (save, reset, upload) | Part of shadcn/ui |
| Card | - | Mechanics/tools catalog layout | Part of shadcn/ui |
| Label | - | Form field labels | Part of shadcn/ui |

### Canvas & Visual Tools
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-konva | Latest | Canvas-based zone editor (drag/resize rectangles) | Industry standard for React canvas manipulation, official Konva docs have React examples |
| konva | Latest | Canvas library (peer dependency) | Required by react-konva |

### Color Picker
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-colorful | Latest | Color picker with hex input | Tiny (2.8 KB), zero dependencies, HexColorInput component, widely used |

### State Management
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | Client-side settings state before IPC save | Already installed, zero boilerplate, perfect for form state |

### Already Installed
- React 19.2.4
- Electron 40.8.0
- Zod 4.3.6 (validation)
- better-sqlite3 12.6.2 (database)
- clsx + tailwind-merge (cn() utility)

### Installation Commands

```bash
# shadcn/ui components (via CLI)
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add separator

# Canvas and color picker
npm install react-konva konva react-colorful
```

## Architecture Patterns

### Settings Page Structure
```
src/renderer/src/pages/Settings.tsx
├── <Tabs orientation="vertical">
│   ├── <TabsList> (left sidebar)
│   │   ├── Brand Voice
│   │   ├── Target Persona
│   │   ├── Content Pillars
│   │   ├── Themes
│   │   ├── Post Mechanics
│   │   ├── Content Defaults
│   │   ├── Brand Guidance
│   │   ├── Competitor Analysis
│   │   ├── Story Tools
│   │   ├── Viral Expertise
│   │   ├── Master Prompt
│   │   └── Templates
│   └── <TabsContent> (right panel per section)
```

### Auto-Save Pattern

**Debounce Strategy:**
```typescript
import { useCallback, useEffect } from 'react'
import { debounce } from 'lodash-es' // or custom implementation

// For text fields: 500ms debounce
const debouncedSave = useCallback(
  debounce((value: string) => {
    window.api.settings.save({ fieldName: value })
  }, 500),
  []
)

// For toggles/sliders: immediate save
const handleToggle = (value: boolean) => {
  window.api.settings.save({ fieldName: value })
}
```

**Best Practices (from research):**
- Text inputs: 500ms debounce to avoid excessive writes
- Toggles/sliders/dropdowns: immediate save (no typing delay)
- Visual feedback: "Saving..." → "Saved" indicator
- Error handling: retry failed saves, alert on persistent failure
- Cleanup: cancel debounced functions on unmount

### Coupled Sliders Pattern (Content Pillars)

**Proportional Redistribution Logic:**
```typescript
interface Pillars {
  generateDemand: number
  convertDemand: number
  nurtureLoyalty: number
}

function redistributePillars(
  current: Pillars,
  changedKey: keyof Pillars,
  newValue: number
): Pillars {
  const delta = newValue - current[changedKey]
  const otherKeys = Object.keys(current).filter(k => k !== changedKey) as (keyof Pillars)[]

  // Calculate total of other sliders
  const otherTotal = otherKeys.reduce((sum, key) => sum + current[key], 0)

  // Distribute delta proportionally
  const result = { ...current, [changedKey]: newValue }
  otherKeys.forEach(key => {
    const proportion = current[key] / otherTotal
    result[key] = Math.round(current[key] - (delta * proportion))
  })

  // Ensure sum is exactly 100 (rounding adjustment)
  const sum = Object.values(result).reduce((a, b) => a + b, 0)
  if (sum !== 100) {
    result[otherKeys[0]] += (100 - sum)
  }

  return result
}
```

**Source:** [React coupled sliders pattern](https://www.npmjs.com/package/react-percentages-slider)

### Zone Editor Component Pattern

**Structure:**
```
src/renderer/src/components/templates/ZoneEditor.tsx
├── File Upload (background image)
├── <Stage> (react-konva)
│   ├── <Layer> (background image)
│   ├── <Layer> (zones)
│   │   ├── <Rect> per zone (draggable, transformable)
│   │   └── <Transformer> (resize handles)
│   └── ZonePopover (config on click)
└── Controls (overlay color, opacity, save)
```

**Key react-konva Patterns (from official docs):**
```typescript
import { Stage, Layer, Rect, Transformer } from 'react-konva'

// Draggable rectangle
<Rect
  x={zone.x}
  y={zone.y}
  width={zone.width}
  height={zone.height}
  fill="rgba(0,0,0,0.3)"
  draggable
  onDragEnd={(e) => handleDragEnd(zone.id, e)}
  onTransformEnd={(e) => handleTransformEnd(zone.id, e)}
/>

// Transformer for resize handles
<Transformer
  ref={transformerRef}
  nodes={selectedNodes}
  boundBoxFunc={(oldBox, newBox) => {
    // Limit resize within canvas bounds
    if (newBox.width < 50 || newBox.height < 50) {
      return oldBox
    }
    return newBox
  }}
/>
```

**Zone Data Model (matches templates table):**
```typescript
interface Zone {
  id: string
  type: 'hook' | 'body' | 'cta' | 'no-text'
  x: number // pixels from left
  y: number // pixels from top
  width: number // pixels
  height: number // pixels
  fontSize: number // standard size for zone type
  minFontSize: number // auto-shrink fallback
}

// Stored as JSON in templates.zones_config column
```

**Source:** [Konva Transformer docs](https://konvajs.org/docs/react/Transformer.html)

### Font File Upload & Registration

**Upload Flow (Electron Main Process):**
```typescript
// IPC handler
ipcMain.handle('fonts:upload', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Fonts', extensions: ['ttf', 'otf', 'woff2'] }
    ]
  })

  if (result.canceled) return null

  const sourcePath = result.filePaths[0]
  const filename = path.basename(sourcePath)
  const destPath = path.join(app.getPath('userData'), 'fonts', filename)

  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.copyFile(sourcePath, destPath)

  return {
    filename,
    path: destPath
  }
})
```

**Font Registration (Renderer CSS):**
```css
@font-face {
  font-family: 'CustomHeadline';
  src: url('file:///path/to/userData/fonts/headline.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

/* For Electron, woff2 is sufficient (latest Chrome) */
@font-face {
  font-family: 'CustomBody';
  src: url('file:///path/to/userData/fonts/body.woff2') format('woff2');
}
```

**Dynamic Font Loading:**
```typescript
// Create style element with @font-face when font is uploaded
const loadFont = (fontName: string, filePath: string) => {
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${filePath}') format('truetype');
    }
  `
  document.head.appendChild(style)
}
```

**Source:** [Electron custom fonts](https://img.ly/docs/cesdk/electron/text/custom-fonts-9565b3/)

### Color Picker Pattern

```typescript
import { HexColorPicker, HexColorInput } from 'react-colorful'

<div className="color-picker">
  <HexColorPicker color={color} onChange={setColor} />
  <HexColorInput
    color={color}
    onChange={setColor}
    placeholder="#AABBCC"
    prefixed
  />
</div>
```

**Source:** [react-colorful docs](https://github.com/omgovich/react-colorful)

### IPC Channels (New for Phase 2)

**Templates:**
```typescript
// src/main/ipc/templates.ts
ipcMain.handle('templates:list', async () => {
  return db.prepare('SELECT * FROM templates WHERE brand_id = ?').all(1)
})

ipcMain.handle('templates:create', async (_, template) => {
  // Insert with zones_config as JSON string
  return db.prepare(`
    INSERT INTO templates (brand_id, name, background_type, background_value,
                          overlay_color, overlay_opacity, overlay_enabled,
                          format, zones_config)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, template.name, template.backgroundType, template.backgroundValue,
         template.overlayColor, template.overlayOpacity, template.overlayEnabled,
         template.format, JSON.stringify(template.zones))
})

ipcMain.handle('templates:update', async (_, id, template) => {
  // Update zones_config
})

ipcMain.handle('templates:delete', async (_, id) => {
  return db.prepare('DELETE FROM templates WHERE id = ?').run(id)
})
```

**Fonts:**
```typescript
// src/main/ipc/fonts.ts
ipcMain.handle('fonts:upload', async () => { /* see pattern above */ })
ipcMain.handle('fonts:list', async () => {
  // List uploaded fonts from userData/fonts/
})
```

**Preload Bridge Extension:**
```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('api', {
  // ... existing
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    create: (template) => ipcRenderer.invoke('templates:create', template),
    update: (id, template) => ipcRenderer.invoke('templates:update', id, template),
    delete: (id) => ipcRenderer.invoke('templates:delete', id)
  },
  fonts: {
    upload: () => ipcRenderer.invoke('fonts:upload'),
    list: () => ipcRenderer.invoke('fonts:list')
  }
})
```

### Settings Schema Extension (Zod)

**Extend existing schema:**
```typescript
// src/shared/types/settings.ts
import { z } from 'zod'

const BrandVoiceSchema = z.object({
  tonality: z.string().optional(),
  dos: z.array(z.string()).optional(),
  donts: z.array(z.string()).optional(),
  examplePosts: z.array(z.string()).optional(),
  voiceProfile: z.string().optional()
})

const TargetPersonaSchema = z.object({
  name: z.string().optional(),
  demographics: z.string().optional(),
  painPoints: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  languageExpectations: z.string().optional(),
  mediaConsumption: z.string().optional(),
  buyingBehavior: z.string().optional()
})

const ContentPillarsSchema = z.object({
  generateDemand: z.number().min(0).max(100),
  convertDemand: z.number().min(0).max(100),
  nurtureLoyalty: z.number().min(0).max(100)
}).refine(data => data.generateDemand + data.convertDemand + data.nurtureLoyalty === 100, {
  message: 'Pillars must sum to 100%'
})

// ... extend for all 11 sections
```

### Pre-Filled Catalog Data Loading

**Load from blueprint on first launch:**
```typescript
// src/main/services/settings-service.ts
import blueprintMechanics from '../../data/mechanics.json'
import blueprintStoryTools from '../../data/story-tools.json'
import themesHierarchy from '../../data/lebenlieben-themen.json'

const DEFAULT_SETTINGS: Settings = {
  // ... other defaults
  mechanics: blueprintMechanics, // 7 pre-filled mechanics
  storyTools: blueprintStoryTools, // 18 pre-filled tools
  themes: themesHierarchy, // 5 Oberthemen structure
  contentDefaults: {
    carouselSlideMin: 3,
    carouselSlideMax: 10,
    captionMaxChars: 2200,
    hashtagMin: 5,
    hashtagMax: 15,
    storiesPerPost: 3
  }
}
```

**Extract from blueprint markdown:**
- Parse `content-creation-system-blueprint-final.md` sections 5 (mechanics) and 6 (story tools)
- Convert to JSON during build or Phase 2 Wave 0
- Store in `src/main/data/` as importable JSON

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas drag/resize | Custom mouse event handlers, bounding box math, transform logic | react-konva + Transformer | Edge cases: multi-select, rotation, aspect ratio lock, boundary constraints, touch support - Konva handles all of this |
| Color picker | Custom HSV/RGB conversion, hue wheel rendering, hex validation | react-colorful | 2.8 KB, zero dependencies, HexColorInput built-in, accessibility handled |
| Debounced auto-save | Manual setTimeout/clearTimeout tracking, race conditions | lodash.debounce or custom useDebounce hook | Race conditions when user types fast, cleanup on unmount, leading/trailing edge options |
| Slider coupling logic | Manual redistribution math, rounding errors, constraint validation | Existing pattern (react-percentages-slider concept) | Off-by-one errors from rounding, negative values, sum !== 100 edge cases |
| Font format conversion | Manual TTF/OTF to WOFF2 conversion | Accept all formats, let browser handle | Browser font rendering supports all formats, no conversion needed |
| Settings form state | Redux or complex form libraries | Zustand + local state | Settings are simple key-value pairs, no complex validation chains, auto-save makes controlled inputs sufficient |

**Key insight:** Canvas manipulation and color science have deep complexity (coordinate transforms, color space conversions, accessibility). Use battle-tested libraries. Focus custom code on business logic (zone configuration, settings structure, IPC channels).

## Common Pitfalls

### Pitfall 1: Font Files Not Loading in Production Build
**What goes wrong:** Custom fonts load fine in dev mode but fail to render in production Electron build. Text reverts to system fonts.
**Why it happens:** File paths differ between dev (Vite dev server) and production (asar archive). Using relative paths like `url('./fonts/custom.ttf')` breaks when app is packaged.
**How to avoid:** Store font files in `app.getPath('userData')` directory (outside asar), use absolute file:// paths, or embed fonts as base64 data URLs in CSS.
**Warning signs:** Font renders in `npm run dev` but not in `npm run build` + `npm run start`.

**Source:** [Electron font loading issues](https://github.com/electron-userland/electron-webpack/issues/163)

### Pitfall 2: Debounce Function Recreated on Every Render
**What goes wrong:** Auto-save fires on every keystroke despite debounce, or multiple saves queue up when typing fast.
**Why it happens:** Creating new debounce function on every render resets the timer. Each keystroke gets a fresh debounce instance.
**How to avoid:** Wrap debounce in `useCallback` with empty dependency array, or use `useMemo`. Cleanup debounced function on unmount with `debounce.cancel()`.
**Warning signs:** Save indicator flickers, database writes spike, version history has entry per keystroke.

**Source:** [Debouncing in React](https://www.developerway.com/posts/debouncing-in-react)

### Pitfall 3: Coupled Sliders Sum Doesn't Equal 100
**What goes wrong:** After adjusting sliders, pillars sum to 99 or 101 due to rounding errors. Zod validation fails on save.
**Why it happens:** Proportional redistribution uses floating point math, `Math.round()` can create off-by-one errors across three values.
**How to avoid:** After redistribution, calculate actual sum and adjust one slider by the difference (100 - sum). Always validate sum === 100 before save.
**Warning signs:** "Pillars must sum to 100%" validation error appears randomly when adjusting sliders.

**Source:** [Coupled sliders pattern](https://www.bennadel.com/blog/3739-creating-linked-slider-inputs-constrained-to-a-given-total-in-angular-9-0-0-rc-5.htm)

### Pitfall 4: Konva Stage Size Not Responsive
**What goes wrong:** Zone editor canvas doesn't resize when window changes, zones appear clipped or positioned incorrectly.
**Why it happens:** Konva Stage width/height are static props, not reactive to container size changes.
**How to avoid:** Use `useEffect` with ResizeObserver to detect container size changes and update Stage dimensions. Store image aspect ratio and scale zones proportionally.
**Warning signs:** Zones positioned correctly at first, but disappear or overlap when window is resized.

**Source:** [Responsive Canvas Stage](https://konvajs.org/docs/sandbox/Responsive_Canvas.html)

### Pitfall 5: Settings Versioning Creates Too Many Files
**What goes wrong:** Versions directory grows to thousands of files after weeks of use (every keystroke in debounced field creates a version).
**Why it happens:** Current settings service versions on every save. Debounced auto-save still triggers save every 500ms when typing continuously.
**How to avoid:** Add minimum time threshold between versions (e.g., only version if >60 seconds since last version), or implement version pruning (keep last N versions per day).
**Warning signs:** Versions directory has hundreds of files with timestamps seconds apart.

**Note:** This is an architectural consideration for Phase 2. May defer versioning optimization to Phase 3 if not critical.

### Pitfall 6: Zone Configuration Popover Closes on Slider Drag
**What goes wrong:** When adjusting font size or opacity sliders in the zone config popover, the popover closes unexpectedly.
**Why it happens:** Click/drag events on slider bubble up and trigger popover close logic.
**How to avoid:** Use `event.stopPropagation()` on slider mousedown/touchstart events, or configure Popover with `modal={false}` to prevent auto-close.
**Warning signs:** User can't adjust slider values, popover flickers or closes mid-drag.

**Source:** shadcn/ui Popover component behavior

## Code Examples

Verified patterns from official sources and research.

### Vertical Tabs Layout (shadcn/ui)
```typescript
// Source: https://ui.shadcn.com/docs/components/radix/tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsPage() {
  return (
    <Tabs defaultValue="brandVoice" orientation="vertical" className="flex">
      <TabsList className="flex flex-col w-64 h-full">
        <TabsTrigger value="brandVoice">Brand Voice</TabsTrigger>
        <TabsTrigger value="targetPersona">Target Persona</TabsTrigger>
        <TabsTrigger value="contentPillars">Content Pillars</TabsTrigger>
        {/* ... 11 sections total */}
      </TabsList>

      <TabsContent value="brandVoice" className="flex-1 p-6">
        {/* Brand Voice form fields */}
      </TabsContent>

      {/* ... other TabsContent sections */}
    </Tabs>
  )
}
```

### Debounced Auto-Save Hook
```typescript
// Source: https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e
import { useCallback, useEffect, useRef } from 'react'

function useAutoSave<T>(
  value: T,
  onSave: (value: T) => void,
  delay = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSave(value)
    }, delay)
  }, [value, onSave, delay])

  useEffect(() => {
    debouncedSave()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [debouncedSave])
}

// Usage
const [brandVoice, setBrandVoice] = useState('')

useAutoSave(brandVoice, async (value) => {
  await window.api.settings.save({ brandVoice: value })
}, 500)
```

### Konva Zone Editor with Transformer
```typescript
// Source: https://konvajs.org/docs/react/Transformer.html
import { Stage, Layer, Rect, Transformer, Image as KonvaImage } from 'react-konva'
import { useRef, useEffect, useState } from 'react'

interface Zone {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'hook' | 'body' | 'cta' | 'no-text'
}

export function ZoneEditor({ backgroundImage }: { backgroundImage: HTMLImageElement }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const transformerRef = useRef<any>(null)
  const selectedShapeRef = useRef<any>(null)

  useEffect(() => {
    if (selectedId && transformerRef.current && selectedShapeRef.current) {
      transformerRef.current.nodes([selectedShapeRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [selectedId])

  const handleDragEnd = (id: string, e: any) => {
    const node = e.target
    setZones(zones.map(zone =>
      zone.id === id
        ? { ...zone, x: node.x(), y: node.y() }
        : zone
    ))
  }

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    setZones(zones.map(zone =>
      zone.id === id
        ? {
            ...zone,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY)
          }
        : zone
    ))
  }

  return (
    <Stage width={1080} height={1350}>
      <Layer>
        <KonvaImage image={backgroundImage} width={1080} height={1350} />
      </Layer>

      <Layer>
        {zones.map(zone => (
          <Rect
            key={zone.id}
            ref={zone.id === selectedId ? selectedShapeRef : null}
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onClick={() => setSelectedId(zone.id)}
            onTap={() => setSelectedId(zone.id)}
            onDragEnd={(e) => handleDragEnd(zone.id, e)}
            onTransformEnd={(e) => handleTransformEnd(zone.id, e)}
          />
        ))}

        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox
            }
            return newBox
          }}
        />
      </Layer>
    </Stage>
  )
}
```

### Color Picker with Hex Input
```typescript
// Source: https://github.com/omgovich/react-colorful
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { useState } from 'react'

export function BrandColorPicker({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>

      <div className="flex gap-2 items-center">
        <button
          className="w-12 h-12 rounded border-2 border-gray-300"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />

        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          placeholder="#AABBCC"
          className="flex-1 px-3 py-2 border rounded"
        />
      </div>

      {showPicker && (
        <div className="mt-2">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
```

### Coupled Pillars Slider Logic
```typescript
// Source: https://www.bennadel.com/blog/3739-creating-linked-slider-inputs-constrained-to-a-given-total-in-angular-9-0-0-rc-5.htm
import { Slider } from '@/components/ui/slider'

interface Pillars {
  generateDemand: number
  convertDemand: number
  nurtureLoyalty: number
}

export function PillarSliders({
  pillars,
  onChange
}: {
  pillars: Pillars
  onChange: (pillars: Pillars) => void
}) {
  const handleSliderChange = (key: keyof Pillars, newValue: number) => {
    const delta = newValue - pillars[key]
    const otherKeys = Object.keys(pillars).filter(k => k !== key) as (keyof Pillars)[]

    // Calculate total of other sliders
    const otherTotal = otherKeys.reduce((sum, k) => sum + pillars[k], 0)

    if (otherTotal === 0) return // Prevent division by zero

    // Distribute delta proportionally
    const updated = { ...pillars, [key]: newValue }
    otherKeys.forEach(k => {
      const proportion = pillars[k] / otherTotal
      updated[k] = pillars[k] - Math.round(delta * proportion)
    })

    // Ensure sum is exactly 100
    const sum = Object.values(updated).reduce((a, b) => a + b, 0)
    if (sum !== 100) {
      updated[otherKeys[0]] += (100 - sum)
    }

    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div>
        <label>Generate Demand: {pillars.generateDemand}%</label>
        <Slider
          value={[pillars.generateDemand]}
          onValueChange={([v]) => handleSliderChange('generateDemand', v)}
          max={100}
          step={1}
        />
      </div>

      <div>
        <label>Convert Demand: {pillars.convertDemand}%</label>
        <Slider
          value={[pillars.convertDemand]}
          onValueChange={([v]) => handleSliderChange('convertDemand', v)}
          max={100}
          step={1}
        />
      </div>

      <div>
        <label>Nurture Loyalty: {pillars.nurtureLoyalty}%</label>
        <Slider
          value={[pillars.nurtureLoyalty]}
          onValueChange={([v]) => handleSliderChange('nurtureLoyalty', v)}
          max={100}
          step={1}
        />
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for settings state | Zustand or local state + auto-save | 2023-2024 | Less boilerplate, simpler mental model, auto-save eliminates need for action creators |
| Custom canvas libraries | Konva (react-konva wrapper) | Stable since 2020 | Industry standard, handles all edge cases, active maintenance |
| Manual color pickers | react-colorful | 2021+ | Tiny bundle size (2.8 KB), HexColorInput built-in, replaced heavier libraries |
| Monaco Editor for code | Monospace textarea for rarely-edited prompts | Design decision | Avoid 3 MB+ bundle for infrequent use case |
| Grid-based zone editors | Freeform drag/resize | Design decision | More flexible for creative layouts, no artificial constraints |
| Manual save buttons | Auto-save with debounce | Modern UX standard | User never forgets to save, better experience |

**Deprecated/outdated:**
- react-color (7.3 KB, last updated 2018) → use react-colorful instead
- Custom debounce implementations → lodash.debounce or built-in hooks pattern
- Font conversion tools (TTF → WOFF2) → browsers support all formats natively

## Open Questions

1. **Should we implement version pruning in Phase 2 or defer to Phase 3?**
   - What we know: Current settings service versions on every save, debounced auto-save creates version every 500ms during typing
   - What's unclear: Is 1000+ version files acceptable for v1, or does it need cleanup logic now?
   - Recommendation: Defer to Phase 3. Versions directory in userData won't impact performance until thousands of files. Add pruning when we implement settings history UI.

2. **How should we handle theme hierarchy editing if user wants to add new themes later?**
   - What we know: CONTEXT.md says "static structure is sufficient" for Phase 2, pre-loaded from lebenlieben-themen.md
   - What's unclear: If user wants to add a new Unterthema or Kernaussage, do we need tree editor UI in Phase 2?
   - Recommendation: Read-only display in Phase 2. User can edit lebenlieben-themen.md file manually if needed. Full tree editor can be Phase 3 enhancement if requested.

3. **Should template preview render in real-time or on-demand?**
   - What we know: CONTEXT.md says "live preview" updates as user changes colors/fonts/logo
   - What's unclear: Does "live" mean every keystroke (expensive) or debounced/on-blur?
   - Recommendation: Debounced preview (500ms) for text changes, immediate for color/font selection (one-time operations). Use existing render service, same pattern as post rendering.

4. **Do we need drag & drop for font file upload, or is click-to-browse sufficient?**
   - What we know: Font upload uses Electron dialog, stores in userData directory
   - What's unclear: User expectation for modern file uploads (drag & drop is common)
   - Recommendation: Phase 2 can use dialog only (simpler). Add drag & drop in Phase 3 if user requests it. Focus on functionality over polish for v1.

## Validation Architecture

> Nyquist validation is enabled (workflow.nyquist_validation = true in config.json)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts (exists from Phase 1) |
| Quick run command | `npm test -- src/renderer/src/components/settings` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

Settings UI components (renderer process):

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-01 | Brand voice form saves on change | unit | `npm test -- tests/components/BrandVoiceSection.test.tsx -x` | ❌ Wave 0 |
| SET-02 | Target persona form saves on change | unit | `npm test -- tests/components/TargetPersonaSection.test.tsx -x` | ❌ Wave 0 |
| SET-03 | Coupled sliders sum to 100% | unit | `npm test -- tests/components/PillarSliders.test.tsx -x` | ❌ Wave 0 |
| SET-07 | Color picker updates brand colors | unit | `npm test -- tests/components/BrandColorPicker.test.tsx -x` | ❌ Wave 0 |
| SET-11 | Master prompt textarea has reset button | unit | `npm test -- tests/components/MasterPromptSection.test.tsx -x` | ❌ Wave 0 |
| SET-12 | Settings service creates version on save | unit | `npm test -- tests/main/services/settings-service.test.ts -x` | ✅ (exists from Phase 1) |
| TPL-01 | Template background upload triggers file dialog | unit | `npm test -- tests/components/TemplateEditor.test.tsx -x` | ❌ Wave 0 |
| TPL-02 | Zone editor creates draggable rectangles | unit | `npm test -- tests/components/ZoneEditor.test.tsx -x` | ❌ Wave 0 |
| TPL-06 | Template CRUD operations via IPC | integration | `npm test -- tests/main/ipc/templates.test.ts -x` | ❌ Wave 0 |

IPC handlers (main process):

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TPL-06 | templates:list returns all templates | unit | `npm test -- tests/main/ipc/templates.test.ts::list -x` | ❌ Wave 0 |
| TPL-06 | templates:create inserts with zones_config JSON | unit | `npm test -- tests/main/ipc/templates.test.ts::create -x` | ❌ Wave 0 |
| TPL-06 | templates:update modifies existing template | unit | `npm test -- tests/main/ipc/templates.test.ts::update -x` | ❌ Wave 0 |
| TPL-06 | templates:delete removes template | unit | `npm test -- tests/main/ipc/templates.test.ts::delete -x` | ❌ Wave 0 |

Font handling (main process):

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-07 | fonts:upload copies file to userData/fonts | unit | `npm test -- tests/main/ipc/fonts.test.ts::upload -x` | ❌ Wave 0 |
| SET-07 | fonts:list returns uploaded fonts | unit | `npm test -- tests/main/ipc/fonts.test.ts::list -x` | ❌ Wave 0 |

Auto-save behavior:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| Multiple | useAutoSave hook debounces text changes | unit | `npm test -- tests/hooks/useAutoSave.test.tsx -x` | ❌ Wave 0 |
| Multiple | Toggle/slider changes save immediately | unit | `npm test -- tests/hooks/useAutoSave.test.tsx::immediate -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- tests/[changed-file].test.tsx -x` (fail fast on first error)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + manual smoke test of settings UI before `/gsd:verify-work`

### Wave 0 Gaps

Component tests (renderer):
- [ ] `tests/components/BrandVoiceSection.test.tsx` — covers SET-01
- [ ] `tests/components/TargetPersonaSection.test.tsx` — covers SET-02
- [ ] `tests/components/PillarSliders.test.tsx` — covers SET-03 (coupled slider logic)
- [ ] `tests/components/BrandColorPicker.test.tsx` — covers SET-07 (color selection)
- [ ] `tests/components/MasterPromptSection.test.tsx` — covers SET-11 (reset button)
- [ ] `tests/components/TemplateEditor.test.tsx` — covers TPL-01 (file upload)
- [ ] `tests/components/ZoneEditor.test.tsx` — covers TPL-02 (drag/resize zones)

IPC handler tests (main):
- [ ] `tests/main/ipc/templates.test.ts` — covers TPL-06 (CRUD operations)
- [ ] `tests/main/ipc/fonts.test.ts` — covers SET-07 (font upload/list)

Hook tests:
- [ ] `tests/hooks/useAutoSave.test.tsx` — covers debounce + immediate save logic

Shared test utilities:
- [ ] `tests/test-utils.tsx` — React Testing Library setup with Vitest
- [ ] `tests/mocks/electron.ts` — Mock window.api IPC bridge for renderer tests

Framework setup:
- [ ] Install @testing-library/react and @testing-library/user-event: `npm install -D @testing-library/react @testing-library/user-event`
- [ ] Install canvas mock for Konva tests: `npm install -D canvas` (needed for react-konva in Node environment)

## Sources

### Primary (HIGH confidence)

- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Component library documentation
- [shadcn/ui Tabs](https://ui.shadcn.com/docs/components/radix/tabs) - Vertical tabs pattern
- [shadcn/ui Slider](https://ui.shadcn.com/docs/components/radix/slider) - Slider component
- [Konva Transformer Tutorial](https://konvajs.org/docs/react/Transformer.html) - Drag/resize rectangles
- [Konva Drag and Drop](https://konvajs.org/docs/react/Drag_And_Drop.html) - Canvas drag patterns
- [react-colorful GitHub](https://github.com/omgovich/react-colorful) - Color picker library
- [Zustand Docs](https://zustand.docs.pmnd.rs/) - State management (attempted fetch, redirect)
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing) - Testing framework

### Secondary (MEDIUM confidence)

- [React Auto-Save Hook](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e) - Debounce pattern
- [Debouncing in React](https://www.developerway.com/posts/debouncing-in-react) - Best practices
- [Coupled Sliders Pattern](https://www.bennadel.com/blog/3739-creating-linked-slider-inputs-constrained-to-a-given-total-in-angular-9-0-0-rc-5.htm) - Proportional redistribution
- [react-percentages-slider npm](https://www.npmjs.com/package/react-percentages-slider) - React implementation
- [Electron Custom Fonts](https://img.ly/docs/cesdk/electron/text/custom-fonts-9565b3/) - Font registration
- [Electron Dialog API](https://www.electronjs.org/docs/latest/api/dialog) - File upload dialogs
- [Type-Safe IPC](https://heckmann.app/en/blog/electron-ipc-architecture/) - TypeScript patterns
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) - Security best practices

### Tertiary (LOW confidence)

- [WebSearch: shadcn/ui 2026](https://ui.shadcn.com/docs/changelog/2026-01-base-ui) - 2026 updates
- [WebSearch: Vitest React Testing 2026](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view) - Testing guide
- [WebSearch: Zustand 2026](https://medium.com/@ravi.hole/modern-state-management-in-react-why-zustand-is-the-go-to-choice-in-2026-a764cecdcdc4) - State management trends
- [WebSearch: React Konva 2026](https://blog.logrocket.com/canvas-manipulation-react-konva/) - LogRocket tutorial

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - shadcn/ui, react-konva, react-colorful are official/standard choices, confirmed via official docs
- Architecture: HIGH - Patterns verified via official Konva docs, shadcn/ui examples, established React patterns
- Pitfalls: MEDIUM - Based on GitHub issues and blog posts, not official warnings, but commonly reported
- Auto-save: HIGH - Well-documented pattern with multiple authoritative sources
- Font handling: MEDIUM - Electron font loading has known issues, solutions verified across multiple sources
- Testing: HIGH - Vitest official docs, React Testing Library is standard

**Research date:** 2026-03-10
**Valid until:** 30 days (stable stack, no fast-moving dependencies)
