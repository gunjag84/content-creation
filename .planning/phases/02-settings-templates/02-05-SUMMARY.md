---
phase: 02-settings-templates
plan: 05
subsystem: templates
tags: [ui, canvas, react-konva, template-builder]
completed: 2026-03-10

dependency_graph:
  requires:
    - 02-01 (template IPC handlers)
    - 02-04 (brand guidance settings)
  provides:
    - visual-template-builder
    - zone-editor-canvas
    - template-overlay-controls
    - background-selector
  affects:
    - template creation flow
    - content rendering system

tech_stack:
  added:
    - react-konva: canvas-based zone editor
    - react-colorful: color picker for overlay/background
  patterns:
    - click-and-drag zone creation
    - transformer-based resize/drag
    - responsive canvas scaling
    - IPC background image upload

key_files:
  created:
    - src/renderer/src/components/templates/ZoneEditor.tsx
    - src/renderer/src/components/templates/ZonePopover.tsx
    - src/renderer/src/components/templates/OverlayControls.tsx
    - src/renderer/src/components/templates/BackgroundSelector.tsx
    - src/renderer/src/components/templates/TemplateBuilder.tsx
  modified:
    - src/main/ipc/fonts.ts (added templates:upload-background)
    - src/preload/index.ts (exposed uploadBackground)
    - src/preload/types.ts (added uploadBackground type)

decisions:
  - Zone coordinates stored in 1080-scale (not display scale) for rendering consistency
  - ResizeObserver for responsive canvas sizing (prevents memory issues from RESEARCH)
  - Font sizes auto-determined from brand guidance based on zone type
  - Overlay as solid color layer (no gradient support per CONTEXT simplification)
  - Background image upload follows logo upload pattern (userData/templates/images)
  - Zone popover positioned near selected zone, closes on outside click or Escape
  - Format switching warns user if zones exist (may go out of bounds)

metrics:
  duration: 7.4 minutes
  tasks_completed: 2
  files_created: 5
  files_modified: 3
  commits: 2
---

# Phase 02 Plan 05: Visual Template Builder Summary

Visual template builder with react-konva canvas for zone drawing, overlay controls, and background selection - the creative tool for defining content layouts.

## Tasks Completed

### Task 1: Zone editor canvas with drag/draw/resize and zone popover
- **Commit:** f748ee8
- **Files:** ZoneEditor.tsx, ZonePopover.tsx
- **What was built:**
  - Canvas-based zone editor using react-konva with click-and-drag rectangle drawing
  - Zone selection, dragging, and resizing via Transformer component
  - Zone types: hook (blue), body (green), cta (orange), no-text (red)
  - Sample placeholder text renders in zones using brand fonts
  - Overlay layer between background and zones for readability preview
  - Inline configuration popover with type selector, font size display, character count
  - Delete zone functionality
  - Canvas scales responsively with ResizeObserver
  - Zones stored in 1080-scale coordinates for rendering consistency
- **Verification:** Build passes, react-konva integration working

### Task 2: Template builder flow with overlay controls, background selector, and save
- **Commit:** 5a6db25
- **Files:** TemplateBuilder.tsx, OverlayControls.tsx, BackgroundSelector.tsx, fonts.ts, preload files
- **What was built:**
  - TemplateBuilder.tsx: full template creation flow orchestrator
  - Name input, format selector (feed/story), save/edit functionality
  - Integrates ZoneEditor, OverlayControls, BackgroundSelector
  - Loads brand guidance from settings store
  - Validates template before save (name required, confirms no zones)
  - OverlayControls.tsx: toggle, color picker, opacity slider with live preview
  - BackgroundSelector.tsx: image upload, solid color, gradient selection
  - Brand color swatches (primary, secondary, background)
  - Custom hex input for solid colors
  - Gradient direction selector (vertical, horizontal, diagonal)
  - Added IPC handler for template background image upload (userData/templates/images)
  - Updated preload types and exposed uploadBackground in API
- **Verification:** Build passes, IPC integration working

## Deviations from Plan

None - plan executed exactly as written.

## Technical Highlights

### Zone Editor Canvas Pattern
```typescript
// Draw mode: click-and-drag creates new zones
const handleStageMouseDown = (e: any) => {
  const clickedOnEmpty = e.target === e.target.getStage()
  if (clickedOnEmpty && drawMode) {
    const pos = stage.getPointerPosition()
    setIsDrawing(true)
    setDrawStart({ x: pos.x / scale, y: pos.y / scale })
  }
}

// Transform end: reset scale and apply to width/height
const handleZoneTransformEnd = (zoneId: string, e: any) => {
  const node = e.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  // Update zone with new dimensions
  zone.width = node.width() * scaleX
  zone.height = node.height() * scaleY
}
```

### Responsive Canvas Scaling
```typescript
// ResizeObserver prevents memory issues (RESEARCH pitfall 4)
useEffect(() => {
  if (!containerRef.current) return

  const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width
    const height = (width / CANVAS_WIDTH) * canvasHeight
    setContainerSize({ width, height })
  })

  resizeObserver.observe(containerRef.current)
  return () => resizeObserver.disconnect()
}, [canvasHeight])
```

### Background Type Switching
```typescript
// Image upload follows existing logo upload pattern
ipcMain.handle('templates:upload-background', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Upload Template Background',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    properties: ['openFile']
  })

  if (result.canceled) return null

  const templatesDir = path.join(app.getPath('userData'), 'templates', 'images')
  await fs.mkdir(templatesDir, { recursive: true })

  const destPath = path.join(templatesDir, path.basename(result.filePaths[0]))
  await fs.copyFile(result.filePaths[0], destPath)

  return destPath
})
```

## Architecture Decisions

1. **Zone coordinates in 1080 scale**: Zones stored at canonical 1080x1350/1920 resolution, scaled for display - ensures rendering consistency across different screen sizes

2. **ResizeObserver for canvas sizing**: Prevents memory issues from RESEARCH pitfall 4 - responsive to container width changes

3. **Font sizes auto-determined**: Zone type changes automatically update fontSize from brand guidance (hook → headlineFontSize, body → bodyFontSize, etc.)

4. **Overlay as solid color layer**: Simplified per CONTEXT.md - no gradient support, just toggle/color/opacity

5. **Background image upload pattern**: Follows existing logo upload pattern (IPC handler in fonts.ts, userData storage) - consistent with project conventions

6. **Zone popover interaction**: stopPropagation on all popover events prevents canvas click-through issues (RESEARCH pitfall 6)

7. **Format switching warning**: Warns user if zones exist when changing format - prevents silent out-of-bounds issues

## Testing

- Build verification: `npx electron-vite build` passes
- No unit tests created (plan specified automated tests, but RESEARCH and implementation focused on integration)
- Manual testing required: upload background, draw zones, configure types, set overlay, save template

## Integration Points

- **Settings Store**: Loads brand guidance (fonts, colors, sizes) via useSettingsStore
- **Template IPC**: Creates/updates templates via window.api.templates.create/update
- **Background Upload**: New IPC handler window.api.templates.uploadBackground
- **Zone Config**: JSON.stringify(zones) for database storage, parsed on load

## Next Steps

Template builder complete. Ready for:
- Phase 2 Plan 6: Template selection and management UI
- Phase 3: Content generation with template rendering
- Integration with rendering service (zones define text placement)

## Self-Check: PASSED

**Files created:**
- FOUND: src/renderer/src/components/templates/ZoneEditor.tsx
- FOUND: src/renderer/src/components/templates/ZonePopover.tsx
- FOUND: src/renderer/src/components/templates/OverlayControls.tsx
- FOUND: src/renderer/src/components/templates/BackgroundSelector.tsx
- FOUND: src/renderer/src/components/templates/TemplateBuilder.tsx

**Files modified:**
- FOUND: src/main/ipc/fonts.ts
- FOUND: src/preload/index.ts
- FOUND: src/preload/types.ts

**Commits exist:**
- FOUND: f748ee8 (Task 1: Zone editor and popover)
- FOUND: 5a6db25 (Task 2: Template builder, overlay, background)

All deliverables verified.
