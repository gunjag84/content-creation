# Feature Map: Content Creation System

**Analysis Date:** 2026-03-17

## Overview

Desktop application (Electron + React) for AI-powered Instagram content creation. Users configure their brand identity, content strategy, and visual templates, then use a 5-step wizard to generate branded feed posts (single or carousel) and linked Instagram stories via the Claude API. The system tracks content pillar/theme/mechanic usage over time and recommends what to create next based on balance and performance data.

---

## Feature Areas

### 1. Dashboard

**Location:** `src/renderer/src/pages/Dashboard.tsx`, `src/renderer/src/components/BalanceWidget.tsx`

**What it does:**
- Displays system health status cards: database connection, settings load status, app version
- Shows the Balance Widget with content strategy analytics
- Provides navigation to create a new post

**User-facing behavior:**
- Three status cards at top: Database (connected/not), Settings (loaded/error), App Version
- Balance Widget below showing pillar distribution, mechanic usage, theme usage, and rotation alerts
- "Start Creating" button navigates to the wizard when no posts exist yet

**Data involved:**
- Reads: app info (version, userData path), database status (table count), settings, balance matrix entries, balance warnings
- IPC calls: `getAppInfo()`, `getDbStatus()`, `loadSettings()`, `posts.getRecommendationData()`

---

### 2. Balance & Recommendation Engine

**Location:** `src/renderer/src/components/BalanceWidget.tsx`, `src/main/services/recommendation.ts`, `src/main/services/pillar-balance.ts`, `src/main/services/learning-warnings.ts`, `src/main/ipc/posts.ts`

**What it does:**
- Tracks how often each content pillar, theme, and mechanic has been used
- Recommends the next pillar/theme/mechanic combination based on usage patterns
- Two modes: cold start (round-robin by lowest usage, alphabetical tiebreaker) and warm start (performance-weighted random selection)
- Generates overuse warnings when any variable is used >3 times within 14 days
- Calculates actual vs target pillar percentages from settings

**User-facing behavior:**
- Balance Widget on Dashboard shows:
  - Content Pillars: actual % vs target % bar charts (amber when >15% deviation)
  - Mechanics: usage frequency bars, sorted by count, with avg performance scores
  - Themes: top 8 by usage frequency, with avg performance scores
  - Rotation Alerts: collapsible warning list with amber indicators for overused variables
- In Step 1, recommendation auto-populates pillar/theme/mechanic selectors
- Warnings appear inline next to each dimension selector in Step 1

**Data involved:**
- Reads: `balance_matrix` table (brand_id, variable_type, variable_value, usage_count, last_used, avg_performance)
- Writes: balance matrix updated on export (usage_count incremented, last_used timestamped)
- Ad-hoc posts only update pillar balance, not theme/mechanic

---

### 3. Content Creation Wizard - Step 1: Recommendation & Selection

**Location:** `src/renderer/src/components/wizard/Step1Recommendation.tsx`, `src/renderer/src/pages/CreatePost.tsx`, `src/renderer/src/stores/useCreatePostStore.ts`

**What it does:**
- Loads AI recommendation for pillar/theme/mechanic
- Allows user to accept or override each dimension
- Selects content type (single post or carousel)
- Selects a template from saved templates
- Accepts an optional "impulse" - free-text guidance for AI
- Allows custom background image upload
- Supports ad-hoc post toggle (excludes from rotation balance)
- Supports AI mode or manual mode toggle

**User-facing behavior:**
- Recommendation card shows suggested pillar/theme/mechanic with reasoning (cold start rotation vs performance-weighted)
- Three dropdowns (pillar, theme, mechanic) populated from settings, with inline amber warnings
- Content type toggle: Single Post vs Carousel
- Template grid showing feed templates with background previews and selection state
- Impulse textarea for additional AI guidance
- Upload background button with image preview (4:5 aspect ratio)
- Ad-hoc toggle with description of balance impact
- AI/Manual mode switch
- "Generate Content" button (AI mode) or "Fill In Manually" button (manual mode)

**Data involved:**
- Reads: settings (pillars, themes, mechanics), templates list, recommendation data
- Writes to store: selectedPillar, selectedTheme, selectedMechanic, contentType, impulse, customBackgroundPath, selectedTemplateId, adHoc, mode

---

### 4. Content Creation Wizard - Step 2: AI Generation

**Location:** `src/renderer/src/components/wizard/Step2Generation.tsx`, `src/main/ipc/generation.ts`, `src/main/services/prompt-assembler.ts`

**What it does:**
- Streams content generation from Claude API (claude-sonnet-4-5-20250929)
- Assembles a master prompt from 10+ settings sections (brand voice, persona, pillar/theme, mechanic rules, content defaults, competitor analysis, viral expertise, impulse, master prompt template)
- Token estimation and auto-truncation of optional sections when prompt exceeds ~8000 tokens
- Template variable replacement ({{pillar}}, {{oberthema}}, {{mechanic_name}}, etc.)
- Enforces JSON output format for structured slide data
- Manual mode skips generation entirely, creates empty slides, and jumps to Step 3

**User-facing behavior:**
- Streaming text display with anti-flicker buffering (100ms interval)
- Auto-scroll as tokens arrive
- Custom background banner preview
- Collapsible "View prompt" section showing the assembled prompt
- Error state with retry button
- "New Draft" button to regenerate while preserving Step 1 selections
- "Continue to Edit" button when generation completes
- Manual mode shows loading spinner then auto-advances to Step 3

**Data involved:**
- Reads: settings (all sections), API key from OS keychain
- Output: GenerationResult with slides array (slide_type, hook_text, body_text, cta_text) and caption
- IPC events: `generate:token`, `generate:complete`, `generate:error`

---

### 5. Content Creation Wizard - Step 3: Edit Text & Visual Overrides

**Location:** `src/renderer/src/components/wizard/Step3EditText.tsx`, `src/renderer/src/components/wizard/SlideEditor.tsx`, `src/renderer/src/components/wizard/SlideZoneOverrides.tsx`, `src/renderer/src/components/wizard/SlidePresetManager.tsx`, `src/renderer/src/components/wizard/InteractiveSlideCanvas.tsx`

**What it does:**
- Two-panel layout: left 40% text editor, right 60% interactive canvas
- Slide text editing (hook, body, CTA fields per slide)
- Drag-and-drop slide reordering with dnd-kit
- Per-zone visual overrides: font family, font size (12-120px), font weight (normal/bold), text alignment (left/center/right), text color (hex color picker)
- Overlay opacity slider per slide
- Interactive Konva canvas for real-time visual preview with zone dragging and resizing
- AI-powered alternative hook generation (3 options per request)
- Save/load/delete visual presets
- Undo/redo with keyboard shortcuts (Ctrl+Z / Ctrl+Y) and 50-state history
- Caption editor with character counter (max 2200)
- "New Draft" with confirmation dialog
- "Approve & Render" saves post + slides to DB and advances to Step 4

**User-facing behavior:**
- Tabbed interface: Slides tab and Caption tab
- Sortable thumbnail strip showing slide number and type (cover/content/cta)
- Slide editor with hook_text, body_text, cta_text textareas
- "Alternative Hooks" button opens modal overlay with 3 AI-generated options
- Zone Overrides collapsible panel with per-zone controls
- Presets dropdown to apply saved configurations, save current as new preset, delete presets
- Interactive canvas shows actual slide content with template background, overlay, and text zones
- Zones are draggable and resizable on the canvas via Konva Transformer
- Undo/Redo buttons in toolbar

**Data involved:**
- Reads: template (zones_config, background), settings (visual guidance, fonts), custom background
- Writes: post record to `posts` table, slides to `slides` table
- Store: generatedSlides with zone_overrides, slideHistory (undo/redo stacks)

---

### 6. Content Creation Wizard - Step 4: Render & Review

**Location:** `src/renderer/src/components/wizard/Step4RenderReview.tsx`, `src/main/services/render-service.ts`, `src/renderer/src/lib/buildSlideHTML.ts`

**What it does:**
- Auto-renders all slides to PNG (1080x1350 for feed) using a hidden Electron BrowserWindow
- Builds complete HTML/CSS per slide incorporating: background (custom/template/settings), overlay with configurable opacity and color, zone-based text positioning with override merge, custom fonts via @font-face, logo placement (6 positions, 3 sizes), Instagram handle, standard CTA on last slide
- Progressive rendering with progress bar
- Per-slide overlay opacity adjustment with live re-render
- Click-to-zoom on any rendered slide
- Export to folder: selects output directory, writes PNGs + caption.txt
- Updates post status and balance matrix on export

**User-facing behavior:**
- Auto-render on load with progress bar showing "Rendering slide X of Y"
- Preview grid (2-3 columns) with 4:5 aspect ratio thumbnails
- Per-slide overlay opacity slider with instant re-render
- Click any slide to see full-size in zoom modal
- "Export Feed Post" button opens folder picker then writes files
- File naming: `{date}_{theme-slug}_slide-{nn}.png` and `{date}_{theme-slug}_caption.txt`

**Data involved:**
- Reads: generatedSlides, template, settings (visual guidance, fonts, logo), custom background
- Writes: PNG files to user-selected folder, caption.txt, post status update, balance matrix update
- Rendering: HTML written to temp file, loaded in hidden BrowserWindow, capturePage() to PNG buffer

---

### 7. Content Creation Wizard - Step 5: Story Generation & Export

**Location:** `src/renderer/src/components/wizard/Step5Stories.tsx`, `src/main/services/story-generator.ts`, `src/main/ipc/generation.ts`

**What it does:**
- Auto-generates 2-4 story proposals via Claude API based on feed post context
- Four story types: teaser (before post), reference (after), deepening (after), behind-the-scenes (after)
- Uses configured story tools (poll, quiz, question, countdown, link) from settings
- Per-story approve/reject/edit/restore workflow
- Edit mode allows changing story type, timing, and text content
- Renders approved stories to PNG at 1080x1920 (9:16 story format)
- Exports to same folder as feed post or prompts for new folder

**User-facing behavior:**
- Loading spinner while generating story proposals
- Story cards showing: timing badge (Before/After Post), type badge, tool badge
- Story text content, source slide reference, AI rationale
- Approve (green), Reject (dimmed), Edit (inline form), Restore buttons per story
- "Render & Export N Stories" button for approved stories
- "Skip Stories" to finish without stories
- "Create Another Post" resets wizard to Step 1

**Data involved:**
- Reads: generatedSlides, caption, settings (storyTools, brand voice, visual guidance)
- Writes: story PNG files to export folder with naming `{date}_{theme-slug}_story-{nn}.png`
- StoryProposal: story_type, tool_type, tool_content (JSON), timing, source_slide_index, text_content, rationale

---

### 8. Template System

**Location:** `src/renderer/src/components/templates/TemplateBuilder.tsx`, `src/renderer/src/components/templates/ZoneEditor.tsx`, `src/renderer/src/components/templates/ZonePopover.tsx`, `src/renderer/src/components/templates/BackgroundSelector.tsx`, `src/renderer/src/components/templates/OverlayControls.tsx`, `src/renderer/src/components/templates/TemplateList.tsx`, `src/renderer/src/components/templates/TemplateCard.tsx`, `src/renderer/src/components/templates/CarouselVariantEditor.tsx`, `src/renderer/src/components/settings/TemplateSection.tsx`, `src/main/ipc/templates.ts`

**What it does:**
- Full visual template builder with Konva canvas for zone placement
- Supports two formats: Feed (4:5, 1080x1350) and Story (9:16, 1080x1920)
- Three background types: uploaded image (draggable for panning), solid color (brand color swatches + custom hex), gradient (vertical/horizontal/diagonal with brand colors)
- Overlay system: enable/disable toggle, color picker (HexColorPicker), opacity slider (0-100%)
- Zone editor: draw zones on canvas by dragging, four zone types (hook, body, cta, no-text), each with configurable fontSize and minFontSize
- Zones are draggable and resizable via Konva Transformer with minimum size enforcement (50px)
- Carousel mode: separate zone configurations for cover, content, and CTA slide variants
- Zone configuration popover for type, font size, label customization
- Template CRUD: create, edit, delete, duplicate
- Default template auto-created on first use (ensureDefault)
- Templates linked to posts at creation time

**User-facing behavior:**
- Template Builder: side-by-side layout with controls panel (320px) and canvas area
- Header with name input, format toggle (Feed/Story), carousel checkbox
- Background selector with image upload, brand color swatches, gradient direction buttons
- Overlay controls with enable/disable, color picker, opacity slider
- Canvas with draw mode (crosshair cursor), zone selection (click), zone dragging, zone resizing
- Carousel variant tabs (Cover, Content, CTA) above canvas with zone counts
- Zone configuration panel showing selected zone's properties
- Template list in Settings with edit/delete/duplicate per template

**Data involved:**
- DB table: `templates` (id, brand_id, name, background_type, background_value, overlay_color, overlay_opacity, overlay_enabled, format, zones_config JSON)
- Zone schema: `{ id, type, label, x, y, width, height, fontSize, minFontSize }`
- Carousel zones_config: `{ type: "carousel", cover: Zone[], content: Zone[], cta: Zone[] }`
- Background images stored in `{userData}/templates/images/`

---

### 9. Settings System

**Location:** `src/renderer/src/pages/Settings.tsx`, `src/renderer/src/stores/settingsStore.ts`, `src/main/services/settings-service.ts`, `src/main/ipc/settings.ts`, `src/shared/types/settings.ts`

14 settings sections accessible via sidebar sub-navigation:

#### 9.1 API Keys
**File:** `src/renderer/src/components/settings/APIKeySection.tsx`
- Save/load/delete Anthropic API key
- Encrypted storage via Electron `safeStorage` (OS keychain)
- Show/hide toggle for key visibility
- Status indicators (saved badge, error messages)

#### 9.2 Brand Voice
**File:** `src/renderer/src/components/settings/BrandVoiceSection.tsx`
- Tonality (text field)
- Do's list (editable list)
- Don'ts list (editable list)
- Example posts (editable list)
- Voice profile (textarea)

#### 9.3 Target Persona
**File:** `src/renderer/src/components/settings/PersonaSection.tsx`
- Name, demographics (text fields)
- Pain points (editable list)
- Goals (editable list)
- Language expectations, media consumption, buying behavior (text fields)

#### 9.4 Content Pillars
**File:** `src/renderer/src/components/settings/PillarSlidersSection.tsx`
- Three linked sliders (Generate Demand, Convert Demand, Nurture Loyalty)
- Must sum to 100%
- Controls target distribution shown in Balance Widget

#### 9.5 Themes
**File:** `src/renderer/src/components/settings/ThemeSection.tsx`
- Hierarchical theme structure: Oberthemen > Unterthemen > Kernaussagen
- Each level has name, active toggle
- Oberthemen have optional description and pillar mapping

#### 9.6 Post Mechanics
**File:** `src/renderer/src/components/settings/MechanicsSection.tsx`
- List of content mechanics (e.g., listicle, how-to, myth-buster)
- Per mechanic: name, description, hook rules, structure guidelines, slide range (min/max), pillar mapping, active toggle

#### 9.7 Content Defaults
**File:** `src/renderer/src/components/settings/ContentDefaultsSection.tsx`
- Carousel slide range (min/max)
- Caption max characters (default 2200)
- Hashtag range (min/max)
- Stories per post count

#### 9.8 Brand Guidance (Visual)
**File:** `src/renderer/src/components/settings/BrandGuidanceSection.tsx`
- Brand colors: primary, secondary, background (color pickers)
- Font uploads: headline, body, CTA fonts (TTF/OTF/WOFF2)
- Font sizes: headline, body, CTA, minimum font size (number inputs)
- Logo upload (PNG/JPG/SVG) with position selector (7 positions) and size (small/medium/large)
- Standard CTA text for last slides
- Instagram handle
- Last slide rules (textarea)

#### 9.9 Competitor Analysis
**File:** `src/renderer/src/components/settings/CompetitorAnalysisSection.tsx`
- Free-text area for competitor insights
- Injected into AI generation prompt when non-empty

#### 9.10 Story Tools
**File:** `src/renderer/src/components/settings/StoryToolsSection.tsx`
- List of Instagram story tools (poll, quiz, question, countdown, link, etc.)
- Per tool: name, description, engagement type, pillar mapping, mechanic recommendations, active toggle

#### 9.11 Viral Expertise
**File:** `src/renderer/src/components/settings/ViralExpertiseSection.tsx`
- Free-text area for viral content patterns
- Injected into AI generation prompt when non-empty

#### 9.12 Master Prompt
**File:** `src/renderer/src/components/settings/MasterPromptSection.tsx`
- Editable prompt template with variable placeholders
- Variables: {{pillar}}, {{oberthema}}, {{content_type}}, {{mechanic_name}}, {{mechanic_guidelines}}
- Default provided, user-customizable
- Appended at end of assembled prompt

#### 9.13 Templates
**File:** `src/renderer/src/components/settings/TemplateSection.tsx`
- Full template management (list, create, edit, delete, duplicate)
- Embeds the TemplateBuilder component
- Supports receiving pending background image from create flow

#### 9.14 Settings History
**File:** `src/renderer/src/components/settings/SettingsHistorySection.tsx`
- Version history table showing all settings changes
- Each version has: version number, timestamp (relative + absolute), backup filename
- Current version highlighted with green indicator
- Auto-versioned on every settings save

**Data involved:**
- Settings stored as JSON file via `SettingsService`
- Settings versions tracked in `settings_versions` DB table
- Validated with Zod schemas (`src/shared/types/settings.ts`)
- Default settings include pre-loaded themes, mechanics, and story tools from JSON data files

---

### 10. Rendering Pipeline

**Location:** `src/main/services/render-service.ts`, `src/renderer/src/lib/buildSlideHTML.ts`, `src/main/ipc/rendering.ts`

**What it does:**
- Hidden BrowserWindow-based HTML-to-PNG rendering
- Persistent render window initialized once, reused for all renders
- HTML written to temp files to avoid data: URI size limits (~2MB Chromium cap)
- Waits for all images (both `<img>` tags and CSS `background-image`) to load before capture
- Double requestAnimationFrame paint guarantee
- 5-second safety timeout for image loading
- Feed posts rendered at 1080x1350, stories at 1080x1920
- buildSlideHTML assembles complete slide HTML with:
  - Background cascade: custom upload > template > settings fallback
  - Overlay with configurable color and opacity
  - Zone-based text positioning with override merge (position, size, font, color, alignment)
  - Custom font loading via @font-face declarations
  - Logo placement with 6 positions and 3 sizes
  - Instagram handle
  - Standard CTA text substitution on last CTA slide
  - Fallback layout when no zones defined (hook top, body middle, CTA bottom)

**Data involved:**
- Input: Slide data, zone definitions, settings (visual guidance), template background
- Output: PNG buffer (base64 data URL + temp file path)
- Temp files cleaned up after each render

---

### 11. Export System

**Location:** `src/main/ipc/export.ts`, `src/renderer/src/components/wizard/Step4RenderReview.tsx`, `src/renderer/src/components/wizard/Step5Stories.tsx`

**What it does:**
- Folder selection via native OS dialog (openDirectory with createDirectory)
- Concurrent file writing with path traversal prevention
- Exports PNG slides as base64-decoded buffers
- Exports caption as plain text file
- Race condition prevention (isExporting flag)
- File naming convention: `{YYYY-MM-DD}_{theme-slug}_slide-{NN}.png` and `{YYYY-MM-DD}_{theme-slug}_caption.txt`
- Story export: `{YYYY-MM-DD}_{theme-slug}_story-{NN}.png`

**User-facing behavior:**
- "Export Feed Post" button in Step 4
- "Render & Export N Stories" button in Step 5
- Native folder picker dialog
- Loading spinner during export
- Auto-advances to Step 5 after feed post export
- Auto-resets wizard after story export

**Data involved:**
- Reads: renderedPNGs (base64 data URLs), caption text
- Writes: PNG files and caption.txt to user-selected folder
- Updates: post status to 'approved', balance matrix (pillar always, theme+mechanic unless ad-hoc)

---

### 12. File Management

**Location:** `src/main/ipc/fonts.ts`

**What it does:**
- Font upload: TTF, OTF, WOFF2 files copied to `{userData}/fonts/`
- Font listing: scans fonts directory for installed fonts
- Logo upload: PNG, JPG, SVG files copied to `{userData}/logo/`
- Background image upload: PNG, JPG files copied to `{userData}/templates/images/`
- Secure file reading: `readFileAsDataUrl` with allowlist of extensions and userData path check
- Font family derivation from filename (hyphens/underscores to spaces)

**User-facing behavior:**
- Font upload dialogs in Brand Guidance settings
- Logo upload dialog in Brand Guidance settings
- Background upload dialog in Template Builder and Step 1

**Data involved:**
- Files stored in Electron userData directory structure:
  - `{userData}/fonts/` - custom fonts
  - `{userData}/logo/` - brand logos
  - `{userData}/templates/images/` - template background images

---

### 13. Security

**Location:** `src/main/services/security-service.ts`, `src/main/ipc/security.ts`, `src/renderer/src/components/settings/APIKeySection.tsx`

**What it does:**
- API key encryption using Electron `safeStorage` (OS keychain / DPAPI on Windows)
- Encrypted key stored as `.api-key.enc` in userData directory
- Save, load, delete operations
- Platform encryption availability check
- File read access control: allowlisted extensions only, path must be in userData for non-standard types

**User-facing behavior:**
- API Key section in Settings with save/delete/show-hide
- "Keys are stored securely using the OS keychain and never written to disk" messaging
- Error messaging if keychain permissions fail

**Data involved:**
- Reads/writes: `{userData}/.api-key.enc` (encrypted binary file)
- Never stores plaintext key to disk

---

### 14. Database & Persistence

**Location:** `src/main/db/index.ts`, `src/main/db/queries.ts`, `src/main/db/schema.sql`

**What it does:**
- SQLite database via better-sqlite3 with WAL mode
- Auto-creates on first launch with schema.sql
- Integrity check on existing databases
- Tables: posts, slides, stories, templates, balance_matrix, settings_versions
- Transaction support for batch slide inserts and balance updates

**Data schema (key tables):**
- `posts`: id, brand_id, pillar, theme, mechanic, template_id, content_type, caption, slide_count, ad_hoc, status, impulse, settings_version_id
- `slides`: id, post_id, slide_number, slide_type, hook_text, body_text, cta_text, overlay_opacity, custom_background_path
- `stories`: id, brand_id, post_id, story_type, tool_type, tool_content, timing, source_slide_id, status
- `templates`: id, brand_id, name, background_type, background_value, overlay settings, format, zones_config
- `balance_matrix`: id, brand_id, variable_type, variable_value, usage_count, last_used, avg_performance
- `settings_versions`: id, brand_id, filename, timestamp

---

### 15. Navigation & Layout

**Location:** `src/renderer/src/App.tsx`, `src/renderer/src/components/layout/AppLayout.tsx`, `src/renderer/src/components/layout/Sidebar.tsx`

**What it does:**
- Three main navigation items: Dashboard, Create Post, Settings
- Collapsible sidebar (64px collapsed, 256px expanded)
- Settings has 14 sub-navigation items in a scrollable list
- Template Builder can be opened from both Settings and from Step 1 of the wizard (with pending background image handoff)

**User-facing behavior:**
- Left sidebar with icons and labels
- Settings sub-items expand when Settings is active
- Collapse toggle at bottom of sidebar
- Dark theme throughout (slate color palette)

---

### 16. Prompt Assembly System

**Location:** `src/main/services/prompt-assembler.ts`, `src/main/data/master-prompt-default.ts`, `src/main/data/mechanics.json`, `src/main/data/themes.json`, `src/main/data/story-tools.json`

**What it does:**
- Assembles master prompt from 10 sections in priority order
- Required sections always included: brand voice, target persona, content focus, mechanic rules, content defaults, master prompt template, JSON output format
- Optional sections conditionally included: competitor analysis, viral expertise, impulse
- Token estimation (chars/4) with 8000 token limit - optional sections truncated if over
- Template variable replacement for {{pillar}}, {{oberthema}}, {{mechanic_name}}, {{mechanic_guidelines}}, {{content_type}}
- Separate story prompt assembly for Step 5 generation
- Single post vs carousel format-aware JSON output instructions

**Data involved:**
- Reads: all settings sections
- Output: complete prompt string sent to Claude API
- Default data files provide initial mechanics, themes, story tools, and master prompt template
