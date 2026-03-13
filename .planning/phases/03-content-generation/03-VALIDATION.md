---
phase: 3
slug: content-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green + manual Claude API smoke test
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-W0-01 | 01 | 0 | POST-01, LEARN-04 | unit | `npm test tests/main/services/recommendation.test.ts` | ❌ W0 | ⬜ pending |
| 3-W0-02 | 01 | 0 | POST-06 | unit | `npm test tests/main/services/prompt-assembler.test.ts` | ❌ W0 | ⬜ pending |
| 3-W0-03 | 01 | 0 | POST-08, POST-11 | unit | `npm test tests/renderer/stores/createPostStore.test.ts` | ❌ W0 | ⬜ pending |
| 3-W0-04 | 01 | 0 | POST-16 | integration | `npm test tests/main/ipc/export.test.ts` | ❌ W0 | ⬜ pending |
| 3-W0-05 | 01 | 0 | LEARN-01 | unit | `npm test tests/main/db/queries.test.ts` | ✅ extend | ⬜ pending |
| 3-W0-06 | 01 | 0 | LEARN-03 | unit | `npm test tests/main/services/learning-warnings.test.ts` | ❌ W0 | ⬜ pending |
| 3-W0-07 | 01 | 0 | LEARN-06 | unit | `npm test tests/main/services/pillar-balance.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-01 | 01 | 1 | POST-01, LEARN-04 | unit | `npm test tests/main/services/recommendation.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | POST-06 | unit | `npm test tests/main/services/prompt-assembler.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | LEARN-01, LEARN-03, LEARN-06 | unit | `npm test tests/main/services/` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | POST-06, POST-09, POST-12, STORY-01 | integration | Manual - requires API key | ❌ Manual | ⬜ pending |
| 3-02-02 | 02 | 1 | POST-08, POST-10, POST-11 | unit | `npm test tests/renderer/stores/createPostStore.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | POST-13, POST-14, POST-15 | integration | `npm test tests/main/services/render-service.test.ts` | ✅ Phase 1 | ⬜ pending |
| 3-03-02 | 03 | 2 | POST-16, STORY-10 | integration | `npm test tests/main/ipc/export.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | STORY-01 to STORY-10 | integration | Manual - requires API key | ❌ Manual | ⬜ pending |
| 3-04-02 | 04 | 2 | STORY-06, STORY-09 | integration | `npm test tests/main/services/render-service.test.ts` | ✅ Phase 1 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/main/services/recommendation.test.ts` — stubs for POST-01, LEARN-04 (round-robin and weighted selection)
- [ ] `tests/main/services/prompt-assembler.test.ts` — stubs for POST-06 (prompt assembly from settings)
- [ ] `tests/renderer/stores/createPostStore.test.ts` — stubs for POST-08, POST-11 (slide update, reorder)
- [ ] `tests/main/ipc/export.test.ts` — stubs for POST-16, STORY-10 (file export handler)
- [ ] `tests/main/db/queries.test.ts` — extend existing for LEARN-01 (balance matrix update)
- [ ] `tests/main/services/learning-warnings.test.ts` — stubs for LEARN-03 (soft-signal warning threshold logic)
- [ ] `tests/main/services/pillar-balance.test.ts` — stubs for LEARN-06 (pillar actual vs. target percentage)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude API streaming (content generation) | POST-06 | Requires live API key - cannot expose in CI | Run dev app, trigger generation, verify tokens stream token-by-token in UI |
| Alternative hooks via Claude API | POST-09 | Requires live API key | Run dev app, click "Alternative hooks", verify 3 options returned |
| Complete new draft via Claude API | POST-12 | Requires live API key | Run dev app, request new draft, verify previous content overwritten |
| Story proposals generation | STORY-01 | Requires live API key | Complete feed post, enter Step 5, verify 2-4 story proposals generated |
| End-to-end wizard flow | POST-01 through POST-17 | Multi-step UI interaction | Walk through all 5 wizard steps, verify correct data flows between steps |
| Story PNG dimensions | STORY-09 | Visual verification required | Export story PNGs, verify 1080x1920 dimensions in file properties |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
