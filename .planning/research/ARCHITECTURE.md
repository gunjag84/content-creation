# Architecture Research

**Domain:** Electron Desktop App (AI-powered content creation system)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React + Tailwind UI                     │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │    │
│  │  │Settings │  │Workflow │  │Preview  │             │    │
│  │  │ Editor  │  │  Steps  │  │ Screen  │             │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘             │    │
│  └───────┼────────────┼────────────┼───────────────────┘    │
│          │            │            │                         │
│  ┌───────┴────────────┴────────────┴───────────────────┐    │
│  │              Preload Script                          │    │
│  │         (contextBridge + IPC Wrapper)                │    │
│  └──────────────────┬───────────────────────────────────┘    │
└─────────────────────┼────────────────────────────────────────┘
                      │ IPC (invoke/handle pattern)
┌─────────────────────┼────────────────────────────────────────┐
│                     ↓           Main Process                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 IPC Handlers                         │    │
│  │  (invoke/handle endpoints for each operation)        │    │
│  └────┬────────────────┬────────────────┬──────────────┘    │
│       │                │                │                    │
│  ┌────↓──────┐   ┌────↓──────┐   ┌────↓──────┐             │
│  │  Config   │   │ Database  │   │   AI      │             │
│  │  Service  │   │  Service  │   │ Service   │             │
│  └────┬──────┘   └────┬──────┘   └────┬──────┘             │
│       │               │               │                     │
│  ┌────↓────────────────↓───────────────↓──────┐             │
│  │          Puppeteer Renderer                 │             │
│  │         (HTML/CSS → PNG Pipeline)           │             │
│  └─────────────────────────────────────────────┘             │
├─────────────────────────────────────────────────────────────┤
│                      Data Storage                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  JSON    │  │  SQLite  │  │  Output  │                   │
│  │  Files   │  │   DB     │  │   PNGs   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Renderer Process** | UI, user interactions, visual feedback | React components with Tailwind CSS |
| **Preload Script** | Secure API exposure to renderer | contextBridge with whitelisted IPC functions |
| **IPC Handlers** | Request routing, validation, orchestration | ipcMain.handle() with async handlers |
| **Config Service** | JSON file read/write, versioning | Node.js fs operations with timestamp backups |
| **Database Service** | SQLite operations (learning data, performance) | better-sqlite3 with prepared statements |
| **AI Service** | Claude API communication, prompt assembly | HTTP client with API key management |
| **Puppeteer Renderer** | HTML/CSS template → PNG conversion | Puppeteer in main process, headless Chrome |

## Recommended Project Structure

```
content-creation/
├── src/
│   ├── main/                    # Main process (Node.js environment)
│   │   ├── index.ts             # Entry point, window management, app lifecycle
│   │   ├── ipc/                 # IPC handler definitions
│   │   │   ├── handlers.ts      # Central handler registration
│   │   │   ├── config.ts        # Settings CRUD operations
│   │   │   ├── database.ts      # Learning data queries
│   │   │   ├── ai.ts            # Claude API calls
│   │   │   └── render.ts        # Puppeteer rendering triggers
│   │   ├── services/            # Business logic layer
│   │   │   ├── ConfigService.ts # JSON file management
│   │   │   ├── DatabaseService.ts # SQLite operations (better-sqlite3)
│   │   │   ├── AIService.ts     # Claude API integration
│   │   │   └── RenderService.ts # Puppeteer HTML→PNG pipeline
│   │   └── utils/               # Shared utilities
│   │       ├── paths.ts         # File system path helpers
│   │       └── logger.ts        # Logging utility
│   ├── renderer/                # Renderer process (React app)
│   │   ├── src/
│   │   │   ├── main.tsx         # React entry point
│   │   │   ├── App.tsx          # Root component, routing
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── screens/         # Full-screen views
│   │   │   │   ├── SettingsScreen.tsx
│   │   │   │   ├── WorkflowScreen.tsx
│   │   │   │   └── PreviewScreen.tsx
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   └── types/           # TypeScript type definitions
│   │   ├── index.html           # HTML entry point
│   │   └── vite.config.ts       # Vite configuration
│   ├── preload/                 # Preload scripts (security boundary)
│   │   └── index.ts             # contextBridge API exposure
│   └── shared/                  # Shared code (main + renderer)
│       └── types.ts             # Shared TypeScript types
├── data/                        # Runtime data (generated at runtime)
│   ├── settings/                # JSON config files
│   ├── database/                # SQLite database file
│   └── output/                  # Generated PNG files
├── package.json
├── electron.vite.config.ts      # Electron Vite config
├── tsconfig.json                # TypeScript config
└── tailwind.config.js           # Tailwind CSS config
```

### Structure Rationale

- **main/**: Node.js-only code. Full API access for file system, database, Puppeteer, external APIs. Never directly exposed to renderer.
- **renderer/**: Standard React app with zero Node.js access. Communicates exclusively via preload API.
- **preload/**: Security boundary. Explicitly whitelists which operations renderer can invoke. Runs with Node.js access but injects APIs into renderer context via contextBridge.
- **shared/**: TypeScript types and constants used by both processes. No runtime code to avoid duplication.
- **services/**: Business logic isolated from IPC layer. Services can be tested independently, handlers orchestrate service calls.
- **data/**: Separate from src/ because it's runtime-generated. Not bundled with the app, created on first run.

## Architectural Patterns

### Pattern 1: IPC Invoke/Handle (Two-Way Communication)

**What:** Renderer invokes main process operations and awaits results. Main process handles requests and returns data or errors.

**When to use:** All renderer-initiated operations that need a response (database queries, file operations, API calls).

**Trade-offs:**
- **Pros**: Type-safe with TypeScript, automatic Promise handling, clear request/response flow
- **Cons**: Slightly more boilerplate than direct module access (but critical for security)

**Example:**
```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data) => ipcRenderer.invoke('settings:save', data)
  }
});

// main/ipc/config.ts
import { ipcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';

export function registerConfigHandlers(configService: ConfigService) {
  ipcMain.handle('settings:load', async () => {
    return await configService.load();
  });

  ipcMain.handle('settings:save', async (event, data) => {
    return await configService.save(data);
  });
}

// renderer/src/hooks/useSettings.ts
export function useSettings() {
  const loadSettings = async () => {
    return await window.api.settings.load();
  };
  // ...
}
```

### Pattern 2: Service Layer Isolation

**What:** All business logic lives in service classes in main/services/. IPC handlers are thin orchestration layers that call services.

**When to use:** Always. Separates concerns and makes services testable without Electron environment.

**Trade-offs:**
- **Pros**: Testable, reusable, clear boundaries, easier to refactor
- **Cons**: Additional abstraction layer adds files and indirection

**Example:**
```typescript
// main/services/DatabaseService.ts
import Database from 'better-sqlite3';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  getRecentPosts(brandId: string, limit: number) {
    const stmt = this.db.prepare(`
      SELECT * FROM posts
      WHERE brand_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(brandId, limit);
  }
}

// main/ipc/database.ts
import { ipcMain } from 'electron';
import { DatabaseService } from '../services/DatabaseService';

export function registerDatabaseHandlers(dbService: DatabaseService) {
  ipcMain.handle('db:getRecentPosts', async (event, brandId, limit) => {
    return dbService.getRecentPosts(brandId, limit);
  });
}
```

### Pattern 3: Puppeteer in Main Process

**What:** Puppeteer runs exclusively in the main process. Renderer sends rendering requests via IPC with template data, main process generates PNG and returns file path.

**When to use:** HTML-to-PNG conversion, screenshot generation, any headless Chrome operations.

**Trade-offs:**
- **Pros**: Full control over Chrome instance, avoids renderer process blocking, proper resource management
- **Cons**: Async overhead (IPC round-trip), more complex error handling

**Example:**
```typescript
// main/services/RenderService.ts
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

export class RenderService {
  async renderTemplate(htmlContent: string, outputPath: string, dimensions: { width: number, height: number }) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport(dimensions);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({ type: 'png' });
    writeFileSync(outputPath, screenshot);

    await browser.close();
    return outputPath;
  }
}

// main/ipc/render.ts
import { ipcMain } from 'electron';
import { RenderService } from '../services/RenderService';

export function registerRenderHandlers(renderService: RenderService) {
  ipcMain.handle('render:template', async (event, htmlContent, outputPath, dimensions) => {
    return await renderService.renderTemplate(htmlContent, outputPath, dimensions);
  });
}
```

### Pattern 4: Context Isolation with Preload Script

**What:** Renderer has zero Node.js access. Preload script uses contextBridge to expose only specific, whitelisted functions.

**When to use:** Always. Enabled by default in Electron 12+.

**Trade-offs:**
- **Pros**: Prevents arbitrary code execution, limits attack surface, enforces security boundaries
- **Cons**: Requires explicit API design upfront, can't dynamically expose new functionality

**Example:**
```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// Never expose ipcRenderer directly — wrap in specific functions
contextBridge.exposeInMainWorld('api', {
  // Settings API
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data) => ipcRenderer.invoke('settings:save', data)
  },

  // Database API
  database: {
    getRecentPosts: (brandId, limit) => ipcRenderer.invoke('db:getRecentPosts', brandId, limit)
  },

  // AI API
  ai: {
    generateText: (prompt) => ipcRenderer.invoke('ai:generate', prompt)
  },

  // Render API
  render: {
    templateToPng: (html, path, dims) => ipcRenderer.invoke('render:template', html, path, dims)
  }
});

// renderer/src/types/global.d.ts
export interface API {
  settings: {
    load: () => Promise<SettingsData>;
    save: (data: SettingsData) => Promise<void>;
  };
  database: {
    getRecentPosts: (brandId: string, limit: number) => Promise<Post[]>;
  };
  ai: {
    generateText: (prompt: string) => Promise<string>;
  };
  render: {
    templateToPng: (html: string, path: string, dims: { width: number, height: number }) => Promise<string>;
  };
}

declare global {
  interface Window {
    api: API;
  }
}
```

### Pattern 5: JSON Config with Versioning

**What:** Settings stored as JSON files with automatic timestamp versioning on every save.

**When to use:** Configuration data that's small, rarely changes, and benefits from human-readable format.

**Trade-offs:**
- **Pros**: Easy to inspect/edit manually, simple backup strategy, Git-friendly
- **Cons**: Not suitable for large datasets, no relational queries, manual schema migration

**Example:**
```typescript
// main/services/ConfigService.ts
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

export class ConfigService {
  private configPath: string;
  private backupDir: string;

  constructor(dataDir: string) {
    this.configPath = join(dataDir, 'settings', 'config.json');
    this.backupDir = join(dataDir, 'settings', 'backups');
  }

  load<T>(): T {
    if (!existsSync(this.configPath)) {
      return this.getDefaults<T>();
    }
    const raw = readFileSync(this.configPath, 'utf-8');
    return JSON.parse(raw);
  }

  save<T>(data: T): void {
    // Create timestamped backup
    if (existsSync(this.configPath)) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupPath = join(this.backupDir, `config-${timestamp}.json`);
      copyFileSync(this.configPath, backupPath);
    }

    // Write new config
    writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  private getDefaults<T>(): T {
    // Return default config structure
    return {} as T;
  }
}
```

## Data Flow

### Request Flow (Renderer → Main → Service → Data Store)

```
[User Action in React Component]
    ↓
[Click handler calls window.api.settings.save(data)]
    ↓
[Preload Script] → ipcRenderer.invoke('settings:save', data)
    ↓ (IPC boundary)
[Main Process IPC Handler] → receives event
    ↓
[Handler validates and calls] → configService.save(data)
    ↓
[ConfigService] → writes JSON file + creates backup
    ↓
[Response] ← Promise resolves
    ↓ (IPC boundary)
[React Component] ← receives success/error, updates UI
```

### AI Generation Flow

```
[User clicks "Generate Text"]
    ↓
[React Component] → window.api.ai.generateText(prompt)
    ↓ (IPC)
[Main Process Handler] → aiService.generate(prompt)
    ↓
[AIService] → assembles master prompt from config files
    ↓
[AIService] → HTTP request to Claude API
    ↓
[Claude API] → returns generated text
    ↓
[AIService] → validates response, extracts text
    ↓
[Main Process Handler] → returns text to renderer
    ↓ (IPC)
[React Component] → displays text in editor
```

### Puppeteer Rendering Flow

```
[User clicks "Export PNG"]
    ↓
[React Component] → assembles HTML from template + post data
    ↓
[React Component] → window.api.render.templateToPng(html, outputPath, dimensions)
    ↓ (IPC)
[Main Process Handler] → renderService.renderTemplate(...)
    ↓
[RenderService] → launches Puppeteer
    ↓
[Puppeteer] → loads HTML in headless Chrome
    ↓
[Puppeteer] → takes screenshot at specified dimensions
    ↓
[Puppeteer] → saves PNG to file system
    ↓
[RenderService] → closes browser, returns file path
    ↓ (IPC)
[React Component] → displays success message, opens preview
```

### Database Query Flow

```
[Component mounts]
    ↓
[useEffect hook] → window.api.database.getRecentPosts(brandId, 10)
    ↓ (IPC)
[Main Process Handler] → databaseService.getRecentPosts(brandId, 10)
    ↓
[DatabaseService] → executes prepared SQLite statement
    ↓
[SQLite] → returns rows
    ↓
[DatabaseService] → maps rows to Post objects
    ↓ (IPC)
[React Component] → renders post list
```

### State Management

For this project, local component state + React hooks should suffice. No Redux/Zustand needed unless complexity grows.

```
[React Component State]
    ↓ (user interaction)
[setState / useState]
    ↓ (triggers re-render)
[Component re-renders with new data]
    ↓ (if IPC call needed)
[window.api.* call] → main process → update local state with result
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Single user (MVP)** | Current architecture is perfect. No changes needed. SQLite handles thousands of posts easily. |
| **Multi-brand (Phase 2)** | UI changes + brand_id filtering in queries. Data model already supports it (brand_id columns exist). No architectural changes. |
| **Web deployment (Phase 3)** | Major refactor: Extract services from Electron main process → Node.js server. Replace IPC with HTTP API. SQLite → PostgreSQL. React renderer → standalone web app. |
| **Multiple simultaneous users (SaaS)** | Add authentication, multi-tenancy, horizontal scaling. Likely needs job queue for rendering (Puppeteer is CPU-heavy). Consider serverless for API, dedicated workers for rendering. |

### Scaling Priorities

1. **First bottleneck: Puppeteer rendering**
   - **What breaks**: Rendering 10+ posts simultaneously blocks the main process
   - **How to fix**: Move Puppeteer to a separate worker process or queue system (even in Electron, can use Node.js worker threads)

2. **Second bottleneck: SQLite write concurrency**
   - **What breaks**: Multiple simultaneous performance data updates cause locking
   - **How to fix**: Batch writes, use WAL mode (Write-Ahead Logging), or migrate to PostgreSQL if going web/SaaS

3. **Third bottleneck: Claude API rate limits**
   - **What breaks**: Generating many posts in quick succession hits rate limits
   - **How to fix**: Implement request queuing with exponential backoff, consider caching common generations

## Anti-Patterns

### Anti-Pattern 1: Exposing ipcRenderer Directly to Renderer

**What people do:**
```typescript
// preload/index.ts - WRONG
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer  // Never do this!
});
```

**Why it's wrong:** Gives renderer unrestricted access to send any IPC message, bypassing security boundaries. Malicious code (or even a bug) could invoke unintended operations.

**Do this instead:**
```typescript
// preload/index.ts - CORRECT
contextBridge.exposeInMainWorld('api', {
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (data) => ipcRenderer.invoke('settings:save', data)
  // Explicit, whitelisted functions only
});
```

### Anti-Pattern 2: Running SQLite in Renderer Process

**What people do:** Import better-sqlite3 directly in React components using webpack externals or other hacks.

**Why it's wrong:**
- SQLite is a native module that expects Node.js environment
- Renderer process should not have file system access
- Breaks security model (context isolation)
- Will fail when packaging the app

**Do this instead:** All database operations go through IPC. Services in main process handle SQLite, renderer only calls `window.api.database.*` functions.

### Anti-Pattern 3: Synchronous IPC Calls

**What people do:**
```typescript
const result = ipcRenderer.sendSync('get-data');  // Blocks entire renderer!
```

**Why it's wrong:** Blocks the renderer process until main process responds. If the operation takes time (database query, API call), the entire UI freezes.

**Do this instead:** Always use async `ipcRenderer.invoke()` which returns a Promise. UI stays responsive, handle loading states in React.

### Anti-Pattern 4: Storing API Keys in Renderer Code

**What people do:** Import Claude API key as environment variable directly in React components.

**Why it's wrong:** Renderer process code is inspectable in DevTools. API keys would be visible in bundled JavaScript.

**Do this instead:** Store API keys in main process only. Renderer calls `window.api.ai.generate(prompt)` without ever seeing the key. Main process injects the key when making the Claude API request.

### Anti-Pattern 5: Creating New Puppeteer Instance Per Render

**What people do:**
```typescript
async function render() {
  const browser = await puppeteer.launch();  // Slow startup every time
  // ... render
  await browser.close();
}
```

**Why it's wrong:** Launching a browser instance takes 1-2 seconds. Wasteful if rendering multiple posts in sequence.

**Do this instead:** Maintain a persistent browser instance in RenderService, reuse it across renders. Close only when app exits or after idle timeout.

```typescript
export class RenderService {
  private browser?: Browser;

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ headless: true });
    }
    return this.browser;
  }

  async render(html: string) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    // ... render logic
    await page.close();  // Close page, not browser
    return result;
  }
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Claude API** | HTTP client in AIService (main process) | Store API key in main process only. Rate limit handling with exponential backoff. |
| **Instagram Graph API** (future) | HTTP client in PerformanceService (main process) | Architecture ready but not implemented in v1. Manual input works standalone. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Renderer ↔ Main** | IPC (invoke/handle pattern) | All communication goes through preload script. Never expose raw IPC to renderer. |
| **Main IPC Handlers ↔ Services** | Direct function calls | Handlers are thin orchestration layers. Services contain business logic. |
| **Services ↔ Data Stores** | Direct access (fs, better-sqlite3) | Services own data access. No repository abstraction needed for this scale. |
| **React Components ↔ Window API** | window.api.* TypeScript interface | Preload exposes type-safe API. Components treat it as async API client. |

### Configuration Dependencies

```
AIService
  ↓ (reads)
ConfigService → brand-voice.json, persona.json, master-prompt.json
  ↓ (also reads)
DatabaseService → learning-data.db (for performance context)
  ↓ (assembles)
Final Prompt → sent to Claude API
```

## Build Order Implications

### Phase 1: Foundation (Week 1)
1. **Project scaffolding** (Electron + Vite + React + Tailwind)
2. **Preload script** with basic IPC structure
3. **Main process entry point** with window management
4. **Basic IPC pattern** (one dummy handler to validate the flow)

**Why this order**: Validates the IPC communication pattern works before building on it.

### Phase 2: Storage Layer (Week 1-2)
1. **ConfigService** (JSON read/write with versioning)
2. **DatabaseService** (SQLite connection, schema setup)
3. **IPC handlers** for config and database operations
4. **React hooks** (useSettings, useDatabase) to consume IPC

**Why this order**: Data layer must exist before UI can consume it. Services are independent, can be built in parallel.

### Phase 3: Settings UI (Week 2-3)
1. **Settings screen layout** (React components)
2. **Form components** for 11 configuration areas
3. **Integration** with ConfigService via IPC
4. **Visual template editor** (drag-and-drop zones on uploaded images)

**Why this order**: Settings must exist before workflow can use them. Template creation is self-contained.

### Phase 4: AI Integration (Week 3)
1. **AIService** (Claude API client, prompt assembly)
2. **IPC handler** for text generation
3. **Master prompt loader** (reads all config files, assembles context)
4. **React text editor** with generation trigger

**Why this order**: Depends on ConfigService for prompt assembly. UI is straightforward once service works.

### Phase 5: Rendering Pipeline (Week 4)
1. **RenderService** (Puppeteer setup, HTML → PNG)
2. **Template system** (HTML/CSS generation from config)
3. **IPC handler** for rendering
4. **React preview screen** with export functionality

**Why this order**: Depends on ConfigService for template configs. Rendering is independent of AI generation.

### Phase 6: Workflow Integration (Week 4-5)
1. **Workflow state machine** (recommendation → selection → generation → editing → rendering)
2. **Learning system** (balance matrix, recommendation logic)
3. **Performance tracking UI** (manual input forms)
4. **Story generation** (satellite content linked to feed posts)

**Why this order**: Integrates all previous components. Learning system needs DatabaseService and multiple workflows to learn from.

### Dependency Graph

```
Project Scaffolding
    ↓
IPC Foundation ← must exist first
    ↓
ConfigService + DatabaseService ← can build in parallel
    ↓                ↓
    ↓         Settings UI ← can start once ConfigService works
    ↓                ↓
AIService ← needs ConfigService for prompt assembly
    ↓                ↓
RenderService ← needs ConfigService for templates
    ↓                ↓
    └────────────────┴→ Workflow Integration ← needs everything
```

## Sources

**Official Documentation (HIGH confidence):**
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [contextBridge API Documentation](https://www.electronjs.org/docs/latest/api/context-bridge)

**Architecture Patterns (MEDIUM confidence):**
- [Advanced Electron.js Architecture - LogRocket Blog](https://blog.logrocket.com/advanced-electron-js-architecture/)
- [How To Organize React and ElectronJS Project Structure - Medium](https://edwardgunawan880.medium.com/how-to-organize-react-and-electronjs-project-structure-bd039819427f)
- [Electron.JS Files Structure and Best Practices](https://hassanagmir.com/blogs/electronjs-files-structure-and-best-practices)

**Integration Patterns (MEDIUM confidence):**
- [Desktop Apps with Electron, React and SQLite](https://tuliocalil.com/desktop-apps-with-electron-react-and-sqlite/)
- [A Step-by-Step Guide to Integrating Better-SQLite3 with Electron JS App - DEV Community](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16)
- [Handling Interprocess Communications in Electron Applications Like a Pro - LogRocket Blog](https://blog.logrocket.com/handling-interprocess-communications-in-electron-applications-like-a-pro/)

**Security Patterns (HIGH confidence):**
- [Penetration Testing of Electron-based Applications](https://deepstrike.io/blog/penetration-testing-of-electron-based-applications)
- [Electron Security Best Practices - Developers Heaven](https://developers-heaven.net/blog/electron-security-best-practices/)
- [Using Preload Scripts - Electron Docs](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)

**Configuration Management (MEDIUM confidence):**
- [electron-json-config - npm](https://www.npmjs.com/package/electron-json-config)
- [electron-json-settings-store - GitHub](https://github.com/samuelcarreira/electron-json-settings-store)

**Puppeteer Integration (LOW-MEDIUM confidence):**
- [puppeteer-in-electron - npm](https://www.npmjs.com/package/puppeteer-in-electron)
- [Puppeteer in Electron GitHub Issue](https://github.com/puppeteer/puppeteer/issues/4655)

**Build Tools (MEDIUM confidence):**
- [Electron Vite Quickstart](https://www.eveon.com/electron-vite-quickstart/)
- [Build a Cross-Platform Desktop App with Electron and React TypeScript, Tailwind CSS - DEV Community](https://dev.to/phamquyetthang/build-a-cross-platform-desktop-app-with-electron-and-react-typescript-tailwind-css-39k0)

---
*Architecture research for: AI-powered Instagram content creation system (Electron desktop app)*
*Researched: 2026-03-10*
