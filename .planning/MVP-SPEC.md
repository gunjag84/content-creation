# MVP Spec: Content Creation System v2 (Web App Rebuild)

**Date:** 2026-03-17
**Decision:** Rebuild as lean web app. Current Electron app is too inflated (16 feature areas, ~4300 LOC). Target: 5 features, ~25 files, ~1500-2000 LOC.

## Core Loop

```
Configure brand context  ->  Select topic  ->  Generate via Claude  ->  Edit text  ->  Render PNGs  ->  Download  ->  Log performance
       ^                                                                                                              |
       +----------------------- Learning system feeds recommendations <-----------------------------------------------+
```

## Architecture

```
+----------------------------+          +----------------------------+
|     React SPA (Vite)       |          |    Express API Server      |
|                            |  HTTP    |                            |
|  Pages:                    |<-------->|  Routes:                   |
|  - Brand Config            |  + SSE   |  - /api/settings           |
|  - Create Post             |          |  - /api/generate (SSE)     |
|  - Edit & Preview          |          |  - /api/render             |
|  - Review & Download       |          |  - /api/posts              |
|  - Post History + Stats    |          |  - /api/files              |
|                            |          |                            |
|  Stores:                   |          |  Services:                 |
|  - settingsStore           |          |  - PromptAssembler         |
|  - wizardStore             |          |  - RenderService           |
|                            |          |    (Playwright)            |
|  Lib:                      |          |  - PostService             |
|  - buildSlideHTML          |          |  - LearningService         |
|  - apiClient               |          |                            |
+----------------------------+          |  Data:                     |
                                        |  - SQLite (better-sqlite3) |
                                        |  - data/ (fonts, logos,    |
                                        |    backgrounds)            |
                                        +----------------------------+
```

## 5 Feature Areas

### 1. Brand Config (replaces 14 settings sections)
- API key input (stored server-side, env var or encrypted file)
- 6 named context documents (textareas): Brand Voice, Target Persona, Product/UVP, Competitive Landscape, Content Strategy, POV
- Visual identity: 3 brand colors (hex pickers), 3 font uploads (headline/body/CTA), logo upload, standard CTA text, Instagram handle
- All stored in single JSON file on server

### 2. Create Post (simplified Step 1+2)
- Topic input: pillar dropdown, theme text, mechanic dropdown (simple lists from JSON config)
- Content type: single/carousel toggle
- Optional background image upload
- Optional impulse textarea
- "Generate" button - streams from Claude via SSE
- Recommendation badge from learning system (if data exists)

### 3. Edit & Preview (simplified Step 3)
- Left: slide text editors (hook, body, CTA per slide)
- Right: live HTML preview in iframe (buildSlideHTML output)
- Caption editor with char count
- Per-slide overlay opacity slider
- No Konva canvas, no drag zones, no presets, no undo/redo

### 4. Review & Download (simplified Step 4)
- Rendered PNG previews (server-side Playwright)
- "Download All" button (ZIP with PNGs + caption.txt)
- No folder picker (browser download)
- Post saved to DB on approval

### 5. Post History + Stats (new - replaces Dashboard + Phase 4)
- List of past posts with thumbnails, date, pillar/theme/mechanic
- Click to expand: enter/edit performance stats
- Stats: reach, likes, comments, shares, saves, ad spend, cost per result, link clicks
- Stats summary: avg performance by pillar, by theme, by mechanic
- Feeds into recommendation system in Create Post

## Tech Stack
- Frontend: React 19, Vite, Tailwind CSS, Zustand, Zod
- Backend: Express, better-sqlite3, Playwright (rendering)
- Deploy: Single VPS with Node.js, or local npm start
- Auth: Simple password in env var + session cookie

## DB Schema (simplified)

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  pillar TEXT NOT NULL,
  theme TEXT NOT NULL,
  mechanic TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'carousel',
  caption TEXT,
  slide_count INTEGER DEFAULT 1,
  impulse TEXT,
  background_path TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slides (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  slide_number INTEGER NOT NULL,
  slide_type TEXT NOT NULL,
  hook_text TEXT,
  body_text TEXT,
  cta_text TEXT,
  overlay_opacity REAL DEFAULT 0.6
);

CREATE TABLE post_performance (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL UNIQUE REFERENCES posts(id),
  reach INTEGER,
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  ad_spend REAL,
  cost_per_result REAL,
  link_clicks INTEGER,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure (~25 files)

```
src/
  client/
    pages/
      BrandConfig.tsx
      CreatePost.tsx
      EditPreview.tsx
      ReviewDownload.tsx
      PostHistory.tsx
    components/
      Layout.tsx
      SlideEditor.tsx
      SlidePreview.tsx
      StatsForm.tsx
      ContextEditor.tsx
    stores/
      settingsStore.ts
      wizardStore.ts
    lib/
      apiClient.ts
      buildSlideHTML.ts
    main.tsx
  server/
    index.ts
    routes/
      settings.ts
      generate.ts
      render.ts
      posts.ts
      files.ts
    services/
      prompt-assembler.ts
      render-service.ts
      learning-service.ts
    db/
      index.ts
      schema.sql
      queries.ts
  shared/
    types.ts
```

## What's CUT

| Cut Feature | Rationale |
|---|---|
| Dashboard with status cards | No value for single-user |
| Balance widget with rotation alerts | Learning system covers lighter |
| Story generation (Step 5) | Secondary content type |
| Template builder (Konva canvas) | Code-defined layouts |
| Zone editor | Fixed layouts |
| Carousel variant editor | One layout covers all types |
| Visual slide editor (Konva interactive) | Iframe preview enough |
| Presets system | No zone overrides needed |
| Undo/redo history | Browser handles textarea undo |
| Settings versioning | Single-user, no audit trail |
| 10 specialized settings sections | Replaced by 6 context docs |
| Recommendation engine (cold+warm) | Simple: top 3 by avg performance |
| DnD slide reorder | Arrow buttons or slide_type order |
| Alternative hooks generation | Regenerate entire post instead |

## Key Decisions

1. **Named context documents** over structured form fields (maps to existing LEBEN.LIEBEN .claude/Context/ files)
2. **Code-defined layouts** over template builder (2-3 hardcoded slide layouts)
3. **Manual stats + ad metrics** for learning system (reach, engagement, ad spend, cost per result)
4. **Express backend** (IPC handlers map 1:1 to routes)
5. **Direct window.api replacement** (one-way door, no Electron fallback)
6. **SQLite kept** (no PostgreSQL migration for single-user)
7. **Playwright** for server-side HTML-to-PNG rendering
8. **SSE** for streaming generation (replaces Electron webContents.send)
