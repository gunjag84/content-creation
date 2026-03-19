# Changelog

All notable changes to this project will be documented in this file.

## [2.1.4] - 2026-03-19

### Added
- **MECE Dimension System**: Replaced theme/mechanic with a 5-dimension MECE framework: Area (life topic), Approach (solution angle), Method (storytelling structure), Tonality (tone of voice), and Pillar (business goal). Full DB migration, UI, and prompt integration.
- **Prompt Assembler v2**: Ported create-content skill prompt template into the codebase with brand context docs, dimension descriptions, and format-aware instructions
- **Prompt References**: New module for inline reference blocks (context docs, pillars, dimension descriptions) used by the assembler
- **DimensionListEditor**: Reusable component for managing dimension lists in Brand Config with add/remove/edit and info popovers
- **Blacklist System**: Configurable forbidden/discouraged dimension combinations with hard (blocked) and soft (warning) severity levels
- **Generation Modal**: Full-screen modal overlay with real-time token streaming during AI generation, replacing the previous inline indicator
- **Balance Recommendations**: API endpoint suggests underrepresented dimension combinations; wizard shows recommendation badges
- **Hook System Design**: Architecture docs for future hook-first creation flow

### Changed
- **Brand Config**: Areas, Approaches, Methods, and Tonalities replace Themes and Mechanics with richer fields (description, format constraints)
- **CreatePost Wizard**: New dimension dropdowns with format-aware method filtering, blacklist warnings, and recommendation display
- **Post History**: Dimension badges show area/method/tonality instead of theme/mechanic; null values display "--"
- **Learning Service**: Tracks all 5 MECE dimensions in balance matrix for usage analytics

### Fixed
- **Generation loading state**: `setGenerationError(null)` was resetting `isGenerating` to false immediately after `setIsGenerating(true)`, preventing any loading indicator from appearing
- **Empty dimension badges**: Null dimension values in Post History no longer render as empty colored badges

## [2.2.0] - 2026-03-19

### Added
- **Instagram Stats Integration**: Full Meta Graph API v25 integration - OAuth connect, IG post discovery, insights sync (reach, likes, comments, shares, saves), standalone IG posts table
- **Ad Stats Sync**: Fetches boosted ad data from Meta Ads API, matches to both Content Studio posts and standalone IG posts by caption prefix, stores spend/CPR/link clicks
- **Instagram Posts View**: New page listing all standalone IG posts with sortable columns (date, reach, likes, comments, ad spend, performance score)
- **Post History Enhancements**: Inline stats form with performance fields, auto-sync button, score display
- **Settings: Instagram Connection**: Token management UI with connect/disconnect, status display, token health indicator
- **Performance Score**: Weighted scoring formula (reach 40%, engagement 40%, ad efficiency 20%) applied to all synced posts

### Fixed
- **Ad matching scope**: Ads now match against both Content Studio posts AND IG API posts (previously only matched Content Studio posts, silently dropping unmatched ad data)

## [2.1.3] - 2026-03-18

### Added
- **Content Defaults**: New settings section with configurable caption min/max chars and body max chars per slide (defaults: 50/400/400). Limits are injected into the AI prompt and shown in the caption editor with red indicator when out of range.
- **Pillar Rules**: Each content pillar now has a rules textarea for content guardrails (e.g., "never mention the product"). Rules are injected into the AI prompt as mandatory constraints.
- **Carousel Cover Layout**: Carousel first slides now render hook-only, centered in the body zone with headline styling. Single slides unchanged (hook/body/CTA layout). Logo and handle remain on carousel covers.
- **Generate Spinner**: Loading spinner in the "Generate with Claude" button during AI generation.

### Changed
- **Prompt Assembler**: Carousel cover instructions tell the LLM to leave body_text and cta_text empty on cover slides. Character limits from content defaults included in every prompt.

## [2.1.2] - 2026-03-18

### Fixed
- **RichTextEditor**: Floating toolbar color picker now stays open while dragging - toolbar is pinned and selection preserved so color changes apply correctly
- **EditPreview**: "Reset to brand defaults" now strips inline TipTap marks (color, font-family, font-size) from zone HTML in addition to clearing zone overrides

## [2.1.1] - 2026-03-18

### Added
- **RichTextEditor**: TipTap-based rich text editor with inline bold/italic, font family, font size, color, and text alignment controls per zone
- **ZoneToolbar**: Per-zone formatting toolbar in EditPreview with font family dropdown, font size, bold/italic/alignment buttons, color picker, and apply-to-all action
- **fontResolver**: Shared `resolveFont()` utility that resolves brand fonts to either Google Fonts `@import` or `@font-face` CSS blocks
- **fontOptions**: Shared font options list used across zone toolbar and editor components
- **zoneDefaults**: Shared zone position defaults extracted to shared module

### Changed
- **SlidePreview**: Reworked font loading to split `@import` and `@font-face` rules into separate `<style>` elements (imports first) — fixes Chrome silently ignoring Google Fonts after custom `@font-face` rules
- **SlideEditor**: Replaced plain textarea inputs with RichTextEditor; integrated ZoneToolbar for per-zone style overrides; drag-and-resize zone handles on canvas
- **EditPreview**: Wired zone drag/commit handlers, undo/redo keyboard shortcuts (Ctrl+Z/Y), image library save/select/delete, background pan mode
- **BrandConfig**: Auto-save on change, font size sliders, slide layout controls; added `toHex()` helper for color picker compatibility with CSS named colors
- **wizardStore**: Added `updateZoneOverrideLive` (no history push for drag), `resetZonePosition`, `applyZoneOverrideToAll`, `undo`/`redo` with 50-entry cap
- **buildSlideHTML**: Updated to support zone override font family, font size, font weight, font style, text alignment, line height, letter spacing, and color
- Removed entire Electron layer (`src/main/`, `src/preload/`, `src/renderer/`) — app is now a pure web app (Vite + Express)

### Fixed
- **ISSUE-001**: Zone font family changes after the first switch did not render — CSS `@import` rules following `@font-face` rules in the same `<style>` block are silently ignored by Chrome; fixed by splitting into two style elements
- **ISSUE-002**: Primary color picker showed black swatch when settings stored a CSS named color (e.g., `"white"`) — `<input type="color">` requires `#rrggbb` format; fixed with canvas-based `toHex()` conversion

### Removed
- Electron build infrastructure (`electron-builder.yml`, `electron.vite.config.ts`, `tsconfig.node.json`)
- All Electron main/preload/renderer source files and associated tests
