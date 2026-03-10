---
phase: 2
slug: settings-templates
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `npm test -- src/renderer/src/components/settings` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/[changed-file].test.tsx -x`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SET-01 | unit | `npm test -- tests/components/BrandVoiceSection.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SET-02 | unit | `npm test -- tests/components/TargetPersonaSection.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SET-03 | unit | `npm test -- tests/components/PillarSliders.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SET-07 | unit | `npm test -- tests/components/BrandColorPicker.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | SET-11 | unit | `npm test -- tests/components/MasterPromptSection.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | SET-12 | unit | `npm test -- tests/main/services/settings-service.test.ts -x` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | TPL-01 | unit | `npm test -- tests/components/TemplateEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | TPL-02 | unit | `npm test -- tests/components/ZoneEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | TPL-06 | integration | `npm test -- tests/main/ipc/templates.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | SET-07 | unit | `npm test -- tests/main/ipc/fonts.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-XX-XX | XX | X | Multiple | unit | `npm test -- tests/hooks/useAutoSave.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

Component tests (renderer):
- [ ] `tests/components/BrandVoiceSection.test.tsx` - stubs for SET-01
- [ ] `tests/components/TargetPersonaSection.test.tsx` - stubs for SET-02
- [ ] `tests/components/PillarSliders.test.tsx` - stubs for SET-03 (coupled slider logic)
- [ ] `tests/components/BrandColorPicker.test.tsx` - stubs for SET-07 (color selection)
- [ ] `tests/components/MasterPromptSection.test.tsx` - stubs for SET-11 (reset button)
- [ ] `tests/components/TemplateEditor.test.tsx` - stubs for TPL-01 (file upload)
- [ ] `tests/components/ZoneEditor.test.tsx` - stubs for TPL-02 (drag/resize zones)

IPC handler tests (main):
- [ ] `tests/main/ipc/templates.test.ts` - stubs for TPL-06 (CRUD operations)
- [ ] `tests/main/ipc/fonts.test.ts` - stubs for SET-07 (font upload/list)

Hook tests:
- [ ] `tests/hooks/useAutoSave.test.tsx` - debounce + immediate save logic

Shared test utilities:
- [ ] `tests/test-utils.tsx` - React Testing Library setup with Vitest
- [ ] `tests/mocks/electron.ts` - Mock window.api IPC bridge for renderer tests

Framework setup:
- [ ] Install @testing-library/react and @testing-library/user-event
- [ ] Install canvas mock for Konva tests (npm install -D canvas)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Zone drag/resize visual feedback | TPL-02 | Canvas rendering requires visual verification | Draw zone on template, verify handles appear, resize and confirm bounds |
| Font preview renders correctly | SET-07 | Font rendering is visual | Upload .ttf file, verify preview sentence displays in uploaded font |
| Brand preview card accuracy | SET-07 | Visual fidelity check | Change colors/fonts, verify preview card updates with correct styling |
| Template live preview with sample text | TPL-05 | Visual text fitting | Draw zones, verify placeholder text renders at correct font size |
| Color picker visual accuracy | SET-07 | Color rendering is visual | Select color via picker, verify hex matches and swatch displays correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
