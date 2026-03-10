---
phase: 1
slug: foundation-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x+ |
| **Config file** | vitest.config.ts (create in Wave 0) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-xx-xx | TBD | 1 | INFRA-01 | manual | N/A - verify via `npm run build:win` and double-click .exe | N/A | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-02 | manual | N/A - verify via `npm run dev` | N/A | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-03 | unit | `npm run test -- src/main/db/index.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-04 | unit | `npm run test -- src/main/services/settings-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-05 | unit | `npm run test -- src/main/services/security-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-06 | unit | `npm run test -- src/main/db/schema.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-xx-xx | TBD | 1 | INFRA-07 | unit | `npm run test -- src/main/index.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-xx-xx | TBD | 1 | TPL-07 | unit | `npm run test -- src/main/services/render-service.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` - Vitest config with main process environment
- [ ] `tests/setup.ts` - Mock electron module for tests
- [ ] Package install: `npm install -D vitest @vitest/ui`
- [ ] `tests/main/db/index.test.ts` - stubs for INFRA-03 (init, WAL, integrity check)
- [ ] `tests/main/services/settings-service.test.ts` - stubs for INFRA-04 (load, save, version)
- [ ] `tests/main/services/security-service.test.ts` - stubs for INFRA-05 (encrypt, decrypt, availability)
- [ ] `tests/main/db/schema.test.ts` - stubs for INFRA-06 (brand_id columns present)
- [ ] `tests/main/index.test.ts` - stubs for INFRA-07 (mocked before-quit handler)
- [ ] `tests/main/services/render-service.test.ts` - stubs for TPL-07 (mock BrowserWindow, capturePage)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App launches via double-click .exe | INFRA-01 | Requires packaged binary and OS interaction | Run `npm run build:win`, navigate to output dir, double-click .exe, verify window appears |
| React renders with HMR | INFRA-02 | Requires running dev server and browser interaction | Run `npm run dev`, verify app loads in Electron window, modify a component, verify HMR updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
