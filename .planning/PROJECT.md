# Content Creation System

## What This Is

An AI-powered Instagram content creation system that generates feed posts and stories through a guided single-post workflow. The system combines static brand settings (voice, persona, visual guidance) with a dynamic learning system that iterates recommendations from performance data. Built as an Electron desktop app for a single brand, with architecture ready for multi-brand and web deployment.

## Core Value

The core loop must work end-to-end: pick a topic and mechanic, generate text via Claude, render branded images from HTML/CSS templates, and export upload-ready PNGs - all guided by brand settings and performance insights.

## Current Milestone: v2.0 Dynamic Zone Model

**Goal:** Replace fixed 3-zone slide architecture with dynamic N-zone model - configurable style types, layout templates, and PowerPoint-style text formatting.

**Target features:**
- Dynamic zone model: N zones per slide, add/remove freely
- Configurable style type registry (Hook, Body, CTA defaults + user-defined types)
- Layout templates for quick slide/carousel setup
- PowerPoint-style formatting (zone-level baseline, word-level overrides)
- AI generation outputs dynamic zone arrays per slide

## Requirements

### Validated

- Settings editor with configuration areas (brand voice, persona, themes, mechanics, etc.)
- AI text generation via Claude API using assembled master prompt with all context
- HTML/CSS template rendering to PNG via Puppeteer (1080x1350 feed, 1080x1920 story)
- Full post generation workflow (recommendation -> selection -> text generation -> editing -> rendering -> visual review)
- Performance tracking with manual input (API-ready architecture)
- Learning system with balance matrix and soft-signal recommendations
- Brand-aware data model (brand_id in all tables) with single-brand UI

### Active

- [ ] Dynamic zone model replacing fixed hook/body/CTA structure
- [ ] Configurable style type registry in settings
- [ ] Layout templates for slide setup
- [ ] PowerPoint-style text formatting (zone-level + word-level)
- [ ] AI generation with dynamic zone output

### Out of Scope

- Instagram Graph API integration - manual input for v1, architecture supports plug-in later
- Multi-brand UI - data model supports it, UI shows one brand
- Web app deployment - Electron desktop first, web migration is Phase 2 of the product
- Mobile app - web-first later, no native mobile
- Video content - image-based posts only for v1
- OAuth/SSO login - desktop app, no auth needed
- Provider-agnostic LLM layer - Claude API only
- Backward compatibility with v1.0 3-zone data - clean break confirmed

## Context

**Blueprint:** The system is defined in `content-creation-system-blueprint-final.md` which covers all specifications in detail - settings structure, workflow steps, prompt template system, post mechanic catalog (7 mechanics), story tools catalog (18 Instagram tools), learning system architecture, file structure, and template config spec.

**Cold Start Strategy:** Equal rotation through all themes and mechanics until performance data exists. No manual seeding, no opinionated defaults - pure rotation until the learning system has enough data to differentiate.

**Template System:** No starter templates ship with the app. Users create templates through a guided flow: upload background image -> visually drag rectangles to define text zones and no-text zones -> configure overlay settings -> system generates config.json. Templates are managed in Settings. The manual post flow offers "save as template?" after image upload.

**Rendering Pipeline:** HTML/CSS templates rendered via Puppeteer in the Electron main process. Feed posts at 1080x1350 (4:5), stories at 1080x1920 (9:16). Per-slide overlay adjustment supported for carousels.

**Content Architecture:** Three content pillars (Generate Demand 50%, Convert Demand 30%, Nurture Loyalty 20%) with configurable slider. Hierarchical theme tree (Oberthema -> Unterthema -> Kernaussage). Seven post mechanics with hook rules, slide ranges, and structure guidelines. 18 Instagram story tools with engagement type mapping.

**Dual-Source Performance:** Every metric has manual input as default. Architecture supports API override per field when Instagram Graph API is connected later. Stories have 24h data window constraint.

**Master Prompt:** A fixed template that dynamically assembles all context (brand voice, persona, competitor analysis, viral expertise, learning context, template config) per generation. User-accessible but rarely edited.

## Constraints

- **Platform**: Electron desktop app (Windows .exe) - React + Tailwind CSS frontend, Node.js backend
- **Rendering**: Puppeteer in Electron main process - headless Chrome for HTML-to-PNG
- **Database**: SQLite for learning data (single file, full SQL, migration path to PostgreSQL)
- **Config Storage**: Local JSON files with automatic timestamp versioning
- **AI Provider**: Claude API exclusively - no abstraction layer
- **Image Formats**: PNG output only (Instagram accepts JPG/PNG, not PDF/PPTX)
- **Language**: System UI and code in English. Content generation supports any language (German primary use case)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Electron over web app | Desktop-first for beta testing, no server needed, Puppeteer runs natively | - Pending |
| SQLite over PostgreSQL | Single file, no server, full SQL power, trivial migration path later | - Pending |
| JSON for settings, SQLite for learning | Settings are small/rarely changed, learning data needs query power | - Pending |
| No starter templates | Visual template builder instead - users create custom templates | - Pending |
| Brand-aware data model | brand_id columns now prevent painful migration when multi-brand is needed | - Pending |
| Equal rotation cold start | No opinionated defaults - system learns purely from actual performance data | - Pending |
| Manual-first performance tracking | API-ready architecture, but manual input works completely standalone | - Pending |
| Claude API only | No LLM abstraction layer needed - single provider simplifies integration | - Pending |
| Dynamic zone model over fixed 3-zone | Flexibility for varying slide layouts, user wants 1-3+ zones per slide with configurable styling | - Pending |
| No backward compatibility for v2.0 | Clean break - existing v1.0 data not migrated, simplifies implementation | - Pending |
| Style type registry over hardcoded types | User needs to add custom types (e.g., "Hook 2") without code changes | - Pending |

---
*Last updated: 2026-03-20 after milestone v2.0 start*
