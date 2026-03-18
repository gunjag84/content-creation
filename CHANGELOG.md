# Changelog

All notable changes to this project will be documented in this file.

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
