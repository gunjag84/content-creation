# Requirements: Content Creation System

**Defined:** 2026-03-10
**Core Value:** The core loop must work end-to-end: pick a topic and mechanic, generate text via Claude, render branded images from HTML/CSS templates, and export upload-ready PNGs - all guided by brand settings and performance insights.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Settings & Configuration

- [x] **SET-01**: User can configure brand voice (tonality, do's/don'ts, example posts upload, auto-generated voice profile with manual override)
- [x] **SET-02**: User can configure target persona (demographics, pain points, goals, language expectations, media consumption, buying behavior)
- [x] **SET-03**: User can configure content pillars with coupled percentage sliders (Generate Demand / Convert Demand / Nurture Loyalty, sum = 100%)
- [x] **SET-04**: User can manage theme hierarchy via tree editor (add/edit/archive Oberthema -> Unterthema -> Kernaussage, drag & drop reorder)
- [x] **SET-05**: User can manage post mechanic catalog (7 pre-filled mechanics with hook rules, slide ranges, structure guidelines, pillar mapping, activate/deactivate)
- [x] **SET-06**: User can configure content defaults (carousel slide min/max, caption max chars, hashtag min/max, stories per feed post)
- [x] **SET-07**: User can configure brand guidance visuals (primary/secondary/background colors, headline/body/CTA fonts with custom upload, logo upload + placement, last carousel slide rules, standard CTA)
- [x] **SET-08**: User can write competitor analysis as free-text differentiation (optional, prompt block skipped when empty)
- [x] **SET-09**: User can manage story tools catalog (18 pre-filled Instagram tools with engagement type, pillar mapping, mechanic recommendations, activate/deactivate)
- [x] **SET-10**: User can write viral post expertise (hook formulas, viral mechanics, post structures - optional, prompt block skipped when empty)
- [x] **SET-11**: User can view and edit master prompt template (code editor, rarely used, pre-filled with working default)
- [x] **SET-12**: Every settings change is automatically versioned with timestamp (system can show which version was active for any post)

### Template System

- [x] **TPL-01**: User can create a template by uploading a background image and being guided through zone definition
- [x] **TPL-02**: User can visually drag rectangles on image preview to define text zones (hook, body, CTA) with font role, alignment, and max_lines per zone
- [x] **TPL-03**: User can visually define no-text zones (protected areas where text must not appear)
- [x] **TPL-04**: User can configure overlay settings per template (color, opacity, gradient with stops, enabled/disabled)
- [x] **TPL-05**: User can set background type per template (image, solid color from brand guidance, gradient from brand guidance)
- [x] **TPL-06**: User can manage templates in settings (list, edit zones, delete, duplicate)
- [x] **TPL-07**: System renders HTML/CSS templates to PNG at Instagram dimensions (1080x1350 feed, 1080x1920 story)
- [x] **TPL-08**: User is offered "save as template?" when uploading a custom background image during manual post flow
- [x] **TPL-09**: Templates support carousel variants (separate cover slide, content slide, CTA slide HTML with shared config)

### Post Generation Workflow

- [x] **POST-01**: System recommends a content pillar, theme, and mechanic based on rotation balance (equal rotation until learning data exists)
- [x] **POST-02**: User can accept or override the system recommendation (choose pillar, theme/subtopic/key message, content type, mechanic, template)
- [ ] **POST-03**: User can choose content type: single post or carousel
- [ ] **POST-04**: User can optionally upload a custom background image that overrides the template background for this post
- [ ] **POST-05**: User can optionally provide a free-text impulse to guide AI generation (supplements standard context, does not replace it)
- [x] **POST-06**: System generates slide text and caption via Claude API using master prompt assembled from all active config areas
- [x] **POST-07**: User can enter text manually without AI generation (manual mode - system provides empty zones, user fills them)
- [ ] **POST-08**: User can edit individual slide texts, hooks, and CTAs inline after generation
- [x] **POST-09**: User can request alternative hook suggestions from AI
- [ ] **POST-10**: User can edit caption independently from slide text (different rules: longer, storytelling, SEO, hashtags, CTA)
- [ ] **POST-11**: User can reorder carousel slides via drag and drop
- [x] **POST-12**: User can request a completely new AI-generated draft
- [ ] **POST-13**: System automatically renders PNGs after text is approved (seconds, not minutes)
- [ ] **POST-14**: User sees rendered PNG preview with caption for visual review before export
- [ ] **POST-15**: User can adjust per-slide overlay opacity for carousels and trigger re-render
- [x] **POST-16**: User can approve and export upload-ready PNGs + caption text file
- [x] **POST-17**: Last carousel slide automatically applies standard CTA from brand guidance (logo + CTA text + handle) unless manually overridden

### Story Generation

- [x] **STORY-01**: System generates story proposals linked to the feed post (2-4 stories per post, configurable)
- [x] **STORY-02**: Story content inherits from feed post (slide texts, caption, theme, mechanic) - no new content invented
- [x] **STORY-03**: System assigns story type per story (teaser before post, reference to post, deepening of aspect, behind-the-scenes)
- [x] **STORY-04**: System recommends interactive tool per story based on post mechanic and pillar (from story tools catalog)
- [x] **STORY-05**: System generates concrete text for interactive tools (poll question + options, quiz question + answers, etc.)
- [x] **STORY-06**: System generates story image - either reformatted feed slide (9:16 with brand color padding) or dedicated story template
- [x] **STORY-07**: System recommends timing per story (before or after feed post)
- [x] **STORY-08**: User can approve, reject, or edit each story (text, tool choice, source slide, image)
- [x] **STORY-09**: System renders story PNGs at 1080x1920 (9:16)
- [x] **STORY-10**: User can export story PNGs alongside feed post PNGs

### Performance Tracking

- [ ] **PERF-01**: System auto-captures post metadata on creation (pillar, theme, subtopic, key message, mechanic, template, content type, slide count, ad-hoc flag)
- [ ] **PERF-02**: System shows manual performance input form 7 days after feed post publication (reach, impressions, likes, comments, shares, saves, revenue, qualitative notes)
- [ ] **PERF-03**: System shows manual story performance input form within 24 hours of story publication (impressions, reach, replies, taps forward/back, exits, sticker taps)
- [ ] **PERF-04**: User can add revenue attribution and qualitative notes per post (always manual, never API-replaced)
- [ ] **PERF-05**: Data model supports API override per metric field (manual value + API value columns, API wins when present, manual shown as override option)
- [ ] **PERF-06**: Story performance is linked to parent feed post in database

### Learning System

- [x] **LEARN-01**: System tracks balance matrix across all steerable variables (pillar distribution, theme distribution, mechanic distribution, content type distribution, template distribution, story tool distribution)
- [x] **LEARN-02**: System calculates performance-per-variable (avg metrics per theme, per mechanic, per pillar, per template, per story tool)
- [x] **LEARN-03**: System generates soft-signal warnings when a variable is overused (e.g., "Mechanic X used 4x in 2 weeks - rotate?")
- [x] **LEARN-04**: Recommendations use equal rotation in cold start (no data yet), then shift to data-driven weighting as performance accumulates
- [x] **LEARN-05**: Ad-hoc posts are flagged and excluded from theme balance calculation but included in pillar balance
- [x] **LEARN-06**: Pillar balance tracks actual vs. target percentage (from content pillar sliders) and warns on deviation

### Infrastructure

- [x] **INFRA-01**: Electron desktop app starts with double-click on .exe (no terminal, no dev server)
- [x] **INFRA-02**: React + Tailwind CSS frontend with electron-vite build tooling
- [x] **INFRA-03**: SQLite database for learning data (posts, stories, performance, balance matrix cache) with WAL mode and integrity checks
- [x] **INFRA-04**: JSON file storage for settings with automatic timestamp versioning
- [x] **INFRA-05**: Secure Claude API key storage via Electron safeStorage API
- [x] **INFRA-06**: Brand-aware data model (brand_id in all database tables) with single-brand UI
- [x] **INFRA-07**: Graceful shutdown handler to prevent SQLite corruption

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### API Integration

- **API-01**: Instagram Graph API integration for automated feed post metrics (replaces manual input)
- **API-02**: Instagram Stories API / webhook for automated story metrics within 24h window
- **API-03**: Automated posting via Instagram Content Publishing API

### Multi-Brand & Web

- **MULTI-01**: Multi-brand UI (brand switcher, per-brand settings and data)
- **WEB-01**: Web app deployment (React code reuse, PostgreSQL migration, cloud Puppeteer)
- **WEB-02**: User authentication and multi-tenant architecture

### Content Types

- **CONTENT-01**: Video/Reel generation support
- **CONTENT-02**: LinkedIn post format support

### UX Enhancements

- **UX-01**: First-run onboarding wizard (guided brand setup, template creation, first post)
- **UX-02**: Content calendar/scheduling view
- **UX-03**: Draft auto-save and crash recovery
- **UX-04**: Comprehensive logging with electron-log for production debugging

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pre-built template library | Creates generic content, no brand differentiation - users create custom templates |
| Provider-agnostic LLM layer | Abstraction dilutes prompt optimization - Claude API only |
| Real-time Instagram preview | Perfect match impossible across devices/OS - high-fidelity preview sufficient |
| Mobile app | Desktop-first, web migration path exists for later |
| Real-time chat | Not core to content creation workflow |
| Direct Instagram posting | Manual export validates core loop without API complexity |
| Infinite customization | Decision fatigue - opinionated defaults with strategic flexibility |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SET-01 | Phase 2 | Complete |
| SET-02 | Phase 2 | Complete |
| SET-03 | Phase 2 | Complete |
| SET-04 | Phase 2 | Complete |
| SET-05 | Phase 2 | Complete |
| SET-06 | Phase 2 | Complete |
| SET-07 | Phase 2 | Complete |
| SET-08 | Phase 2 | Complete |
| SET-09 | Phase 2 | Complete |
| SET-10 | Phase 2 | Complete |
| SET-11 | Phase 2 | Complete |
| SET-12 | Phase 2 | Complete |
| TPL-01 | Phase 2 | Complete |
| TPL-02 | Phase 2 | Complete |
| TPL-03 | Phase 2 | Complete |
| TPL-04 | Phase 2 | Complete |
| TPL-05 | Phase 2 | Complete |
| TPL-06 | Phase 2 | Complete |
| TPL-07 | Phase 1 | Complete |
| TPL-08 | Phase 2 | Complete |
| TPL-09 | Phase 2 | Complete |
| POST-01 | Phase 3 | Complete |
| POST-02 | Phase 3 | Complete |
| POST-03 | Phase 3 | Pending |
| POST-04 | Phase 3 | Pending |
| POST-05 | Phase 3 | Pending |
| POST-06 | Phase 3 | Complete |
| POST-07 | Phase 3 | Complete |
| POST-08 | Phase 3 | Pending |
| POST-09 | Phase 3 | Complete |
| POST-10 | Phase 3 | Pending |
| POST-11 | Phase 3 | Pending |
| POST-12 | Phase 3 | Complete |
| POST-13 | Phase 3 | Pending |
| POST-14 | Phase 3 | Pending |
| POST-15 | Phase 3 | Pending |
| POST-16 | Phase 3 | Complete |
| POST-17 | Phase 3 | Complete |
| STORY-01 | Phase 3 | Complete |
| STORY-02 | Phase 3 | Complete |
| STORY-03 | Phase 3 | Complete |
| STORY-04 | Phase 3 | Complete |
| STORY-05 | Phase 3 | Complete |
| STORY-06 | Phase 3 | Complete |
| STORY-07 | Phase 3 | Complete |
| STORY-08 | Phase 3 | Complete |
| STORY-09 | Phase 3 | Complete |
| STORY-10 | Phase 3 | Complete |
| PERF-01 | Phase 4 | Pending |
| PERF-02 | Phase 4 | Pending |
| PERF-03 | Phase 4 | Pending |
| PERF-04 | Phase 4 | Pending |
| PERF-05 | Phase 4 | Pending |
| PERF-06 | Phase 4 | Pending |
| LEARN-01 | Phase 3 | Complete |
| LEARN-02 | Phase 3 | Complete |
| LEARN-03 | Phase 3 | Complete |
| LEARN-04 | Phase 3 | Complete |
| LEARN-05 | Phase 3 | Complete |
| LEARN-06 | Phase 3 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
