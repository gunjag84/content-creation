---
phase: 02-settings-templates
plan: 11
subsystem: settings-ui
tags: [ui-fix, dark-theme, ux-improvement]
requires: []
provides:
  - dark-themed-brand-guidance
  - always-visible-font-selector
  - simplified-font-upload-ui
affects:
  - BrandGuidanceSection.tsx
  - FontUpload.tsx
tech_stack:
  added: []
  patterns:
    - "useEffect for state synchronization across UI slots"
key_files:
  created: []
  modified:
    - src/renderer/src/components/settings/BrandGuidanceSection.tsx
    - src/renderer/src/components/settings/FontUpload.tsx
decisions:
  - "Apply consistent dark theme (slate-*) to Brand Guidance section for readability"
  - "Standard fonts dropdown visible in all states - simplifies UX, eliminates hidden functionality"
  - "Remove large font preview block - redundant with right-side live preview panel"
metrics:
  duration_minutes: 3.9
  completed_date: "2026-03-11"
  task_count: 2
  file_count: 2
  commits:
    - c4cc9ee
    - 57eb343
---

# Phase 02 Plan 11: Dark Theme Brand Guidance and Always-Visible Font Selector Summary

**One-liner:** Dark-themed Brand Guidance section with standard fonts dropdown visible across all font slots regardless of configuration state.

## What Was Built

Fixed three UX issues in the Brand Guidance settings panel:

1. **Dark Theme Applied** - Both left controls column and right preview column now use `bg-slate-800` and `border-slate-700` with readable text colors (`text-slate-100/300/400`)

2. **Standard Fonts Always Visible** - The standard fonts dropdown now appears in both configured and unconfigured states for all three font slots (Headline, Body, CTA), making it easy to switch between system fonts

3. **Large Preview Removed** - Eliminated the redundant "quick brown fox" preview block from FontUpload component since the right-side preview panel already provides live font feedback

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### BrandGuidanceSection.tsx Changes

**Dark theme color replacements:**
- Column backgrounds: `bg-white` → `bg-slate-800`
- Borders: `border-gray-200` → `border-slate-700`
- Headings: `text-gray-900` → `text-slate-100`
- Labels: `text-gray-700` → `text-slate-300`
- Number inputs: Added `bg-slate-700 border-slate-600 text-slate-100`

### FontUpload.tsx Changes

**State synchronization:**
```tsx
useEffect(() => {
  if (fontConfig && !fontConfig.path) {
    setSelectedStandardFont(fontConfig.family)
  } else {
    setSelectedStandardFont('')
  }
}, [fontConfig?.family, fontConfig?.path])
```

**UI restructure for configured state:**
- Added standard fonts dropdown (was empty-state-only)
- Added divider ("or")
- Kept font info row (filename + Change + Remove buttons)
- Removed large preview block (lines 125-135 from original)

**Dark theme applied:**
- Labels: `text-gray-600/700` → `text-slate-300/400`
- Dropdown: Added `bg-slate-700 border-slate-600 text-slate-100`
- Dividers: `border-gray-300` → `border-slate-600`, `text-gray-500` → `text-slate-500`
- Button hover states: `text-blue-600 hover:bg-blue-50` → `text-blue-400 hover:bg-blue-900/20`

## Files Modified

| File | Lines Changed | Purpose |
|------|--------------|---------|
| BrandGuidanceSection.tsx | 15 | Apply dark theme to both columns, headings, labels, inputs |
| FontUpload.tsx | 43 insertions, 22 deletions | Add always-visible dropdown, remove large preview, apply dark theme |

## Verification

Build successful. TypeScript compilation passed.

**Manual verification needed:**
1. Start dev app: `npm run dev`
2. Navigate to Settings > Brand Guidance
3. Confirm dark background on both columns (no white cards)
4. Confirm all three font slots show standard fonts dropdown
5. Select a standard font, confirm dropdown stays visible
6. Upload custom font, confirm dropdown stays visible
7. Confirm no large "quick brown fox" preview block appears

## Self-Check

Verifying created/modified files and commits:

```bash
# Check files exist
$ ls -la src/renderer/src/components/settings/BrandGuidanceSection.tsx
$ ls -la src/renderer/src/components/settings/FontUpload.tsx

# Check commits exist
$ git log --oneline | grep c4cc9ee
$ git log --oneline | grep 57eb343
```

**Result:** PASSED - Both files modified, both commits exist in git history.

## Next Steps

Plan 02-11 complete. Ready to advance to plan 02-12 (if exists) or complete Phase 02.
