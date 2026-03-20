# Requirements: Content Creation System

**Defined:** 2026-03-10 (v1.0), updated 2026-03-20 (v2.0)
**Core Value:** The core loop must work end-to-end: pick a topic and mechanic, generate text via Claude, render branded images from HTML/CSS templates, and export upload-ready PNGs - all guided by brand settings and performance insights.

## v2.0 Requirements

Requirements for dynamic zone model milestone. Each maps to roadmap phases.

### Data Model

- [ ] **DATA-01**: Slide uses zones[] array instead of fixed hook_text/body_text/cta_text fields
- [ ] **DATA-02**: Zone entity stores id, styleType, content (HTML), position (top/left/width/height), and style overrides
- [ ] **DATA-03**: DB schema updated - slides table uses JSON zones column, old 3-field columns removed
- [ ] **DATA-04**: Shared Zod schemas for Zone, StyleType, and LayoutTemplate with full validation

### Style System

- [ ] **STYLE-01**: User can create, edit, and delete style types in settings (name, fontSize, fontWeight, fontFamily, color, textAlign, lineHeight, letterSpacing)
- [ ] **STYLE-02**: Default style types (Hook, Body, CTA) ship pre-configured and are editable
- [ ] **STYLE-03**: User can create layout templates that define zone count, positions, and style type assignments
- [ ] **STYLE-04**: Zone-level formatting applies style type defaults to entire zone
- [ ] **STYLE-05**: User can override individual words within a zone (font, size, color) via inline TipTap selection

### Editor UI

- [ ] **EDIT-01**: User can add a zone to any slide via plus button with style type picker
- [ ] **EDIT-02**: User can delete any zone from a slide
- [ ] **EDIT-03**: User can add a carousel slide and choose from available layout templates
- [ ] **EDIT-04**: SlidePreview renders N zones dynamically with drag and resize support
- [ ] **EDIT-05**: SlideEditor renders zone editor panels dynamically from zones array

### Generation

- [ ] **GEN-01**: AI generates zones[] array per slide with styleType and content fields
- [ ] **GEN-02**: Prompt assembler outputs zone array structure instead of 3 named text fields
- [ ] **GEN-03**: buildSlideHTML renders N zones from array with dynamic positioning

### Drafts

- [ ] **DRAFT-01**: User can save draft to SQLite with full slide state (zones, styling, backgrounds)
- [ ] **DRAFT-02**: User can resume editing any saved draft
- [ ] **DRAFT-03**: User can export draft as JSON file for backup
- [ ] **DRAFT-04**: User can import draft from JSON file

## v1.0 Requirements (Completed)

### Settings & Configuration

- [x] **SET-01**: User can configure brand voice
- [x] **SET-02**: User can configure target persona
- [x] **SET-03**: User can configure content pillars with coupled percentage sliders
- [x] **SET-04**: User can manage theme hierarchy via tree editor
- [x] **SET-05**: User can manage post mechanic catalog
- [x] **SET-06**: User can configure content defaults
- [x] **SET-07**: User can configure brand guidance visuals
- [x] **SET-08**: User can write competitor analysis
- [x] **SET-09**: User can manage story tools catalog
- [x] **SET-10**: User can write viral post expertise
- [x] **SET-11**: User can view and edit master prompt template
- [x] **SET-12**: Every settings change is automatically versioned

### Template System

- [x] **TPL-01** through **TPL-09**: Template creation, zone editor, overlay, backgrounds, management, rendering, carousel variants

### Post Generation Workflow

- [x] **POST-01** through **POST-17**: Full generation workflow (recommendation, selection, generation, editing, rendering, review, export)

### Visual Slide Editor

- [x] **VSED-01** through **VSED-08**: Zone overrides, undo/redo, presets, buildSlideHTML integration

### Story Generation

- [x] **STORY-01** through **STORY-10**: Story proposals, content inheritance, tools, rendering, export

### Learning System

- [x] **LEARN-01** through **LEARN-06**: Balance matrix, performance tracking, soft-signal warnings, rotation

### Infrastructure

- [x] **INFRA-01** through **INFRA-07**: Electron app, React/Tailwind, SQLite, JSON storage, API key, brand-aware model

## Future Requirements

### Performance Tracking (deferred from v1.0)

- **PERF-01**: System auto-captures post metadata on creation
- **PERF-02**: Manual performance input form 7 days after publication
- **PERF-03**: Manual story performance input within 24h
- **PERF-04**: Revenue attribution and qualitative notes per post
- **PERF-05**: API override per metric field
- **PERF-06**: Story performance linked to parent feed post

### API Integration

- **API-01**: Instagram Graph API integration for automated metrics
- **API-02**: Stories API for automated story metrics
- **API-03**: Automated posting via Content Publishing API

### Multi-Brand & Web

- **MULTI-01**: Multi-brand UI
- **WEB-01**: Web app deployment
- **WEB-02**: User authentication

### Prompt Quality Feedback Loop

- **PQFL-01**: Store correction diffs
- **PQFL-02**: Analysis command for pattern clustering
- **PQFL-03**: Eval-verified skill file updates

## Out of Scope

| Feature | Reason |
|---------|--------|
| Story format (1080x1920) updates | Focus on feed/carousel first for v2.0, story update later |
| Backward compatibility with v1.0 data | Clean break confirmed - no migration needed |
| Canva-like free-form design editor | Assessed and rejected - domain-specific zone model is the right approach |
| Pre-built template library | Users create custom templates via guided flow |
| Provider-agnostic LLM layer | Abstraction dilutes prompt optimization - Claude API only |
| Video/Reel content | Image-based posts only |
| Mobile app | Desktop-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | - | Pending |
| DATA-02 | - | Pending |
| DATA-03 | - | Pending |
| DATA-04 | - | Pending |
| STYLE-01 | - | Pending |
| STYLE-02 | - | Pending |
| STYLE-03 | - | Pending |
| STYLE-04 | - | Pending |
| STYLE-05 | - | Pending |
| EDIT-01 | - | Pending |
| EDIT-02 | - | Pending |
| EDIT-03 | - | Pending |
| EDIT-04 | - | Pending |
| EDIT-05 | - | Pending |
| GEN-01 | - | Pending |
| GEN-02 | - | Pending |
| GEN-03 | - | Pending |
| DRAFT-01 | - | Pending |
| DRAFT-02 | - | Pending |
| DRAFT-03 | - | Pending |
| DRAFT-04 | - | Pending |

**Coverage:**
- v2.0 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-20 after v2.0 milestone definition*
