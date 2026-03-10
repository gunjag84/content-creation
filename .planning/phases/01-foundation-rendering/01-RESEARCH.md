# Phase 1: Foundation & Rendering - Research

**Researched:** 2026-03-10
**Domain:** Electron desktop app development with React, SQLite, and HTML-to-PNG rendering
**Confidence:** HIGH

## Summary

Phase 1 builds a working Electron desktop app with HTML-to-PNG rendering at Instagram dimensions (1080x1350 feed, 1080x1920 story) and persistent data storage (SQLite + JSON config). The user has already made clear technology choices documented in CONTEXT.md, eliminating stack exploration work. This research validates those decisions against current best practices and identifies implementation patterns, pitfalls, and testing strategies.

The decided stack (electron-vite, React, TypeScript, Tailwind, shadcn/ui, Zustand, better-sqlite3, electron-builder) represents the current standard for production Electron apps in 2026. Each piece has official support, active maintenance, and proven integration patterns with the others. The key technical risks are native module rebuilding (better-sqlite3), BrowserWindow.capturePage rendering timing on Windows, and graceful SQLite shutdown with WAL mode.

**Primary recommendation:** Follow electron-vite's official scaffolding with React-TS template, mark better-sqlite3 as external in Vite config, use `show: false` (not `hide()`) for the persistent hidden rendering window, enable SQLite WAL mode only once at database creation, run PRAGMA quick_check on startup, and implement before-quit handler with explicit db.close() and checkpoint before app shutdown.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Rendering approach:**
- Use BrowserWindow.capturePage (Electron built-in) instead of Puppeteer - no extra dependencies, lighter app
- Dedicated persistent hidden BrowserWindow for rendering - stays loaded, fast captures, main window stays clean
- Carousel slides rendered sequentially in the same hidden window - simple, predictable, fast enough for 3-10 slides
- Rendered PNGs saved to temp directory first, then user picks export location via native file dialog on explicit export

**Database schema design:**
- Full schema created upfront in Phase 1 - all tables (posts, stories, performance, balance_matrix, settings_versions) defined now, avoiding migration headaches later
- Single schema SQL file (not a migration system) - one file defines all tables, version check + ALTER for updates
- better-sqlite3 as the SQLite library - synchronous API, fastest Node binding, native rebuild handled by electron-vite
- Thin wrapper over raw SQL - small helper layer for common operations, no ORM, full control over queries

**Project structure:**
- electron-vite as build/scaffolding tool - Vite-based, fast HMR, handles main/preload/renderer split, TypeScript out of the box
- Typed IPC with preload bridge - shared types file defining channels, preload exposes typed API object (window.api), type-safe and secure
- Zustand for frontend state management - lightweight, no providers, simple store pattern
- TypeScript strict mode enabled - catches more bugs at compile time

**App shell & initial UI:**
- Left sidebar navigation - collapsible, icons + labels, scales well as features are added
- Nav shell + test page for Phase 1 - sidebar with placeholder sections (Dashboard, Create Post, Settings), one working test page demonstrating HTML-to-PNG rendering
- Dark mode as default theme - professional content-tool feel, easier on eyes for long sessions
- shadcn/ui component library - copy-paste components built on Radix + Tailwind, accessible, customizable, dark-mode ready

**JSON settings storage:**
- Single settings.json file with all 11 config areas as top-level keys
- Copy-on-write versioning - on every save, copy current to versions/settings_TIMESTAMP.json, then write new settings.json
- Zod schema validation on read and write - catches corruption, provides TypeScript types automatically
- Generate defaults on first launch - sensible defaults for system settings, empty content areas for user to fill later

**Secure API key storage:**
- API key entered via Settings page field (implemented in Phase 2 UI, storage layer built in Phase 1)
- Full safeStorage implementation in Phase 1 - encrypt/decrypt ready, test with dummy key
- API key stored in separate encrypted file - never appears in settings.json, clean separation for backup safety

**Testing strategy:**
- Claude's discretion on test framework (likely Vitest given electron-vite stack)
- Core paths only - test DB operations (CRUD, WAL, integrity), settings read/write/versioning, rendering pipeline (HTML->PNG)
- Skip E2E tests for Phase 1 - manual verification of app launch and rendering, E2E added later

**Build & packaging:**
- electron-builder for packaging
- Portable .exe format (no installer) - simple double-click to run, NSIS installer deferred to later
- Phase 1 delivers dev mode + working build script - npm run dev for development, build/package pipeline configured and tested but polished .exe is Phase 4

### Claude's Discretion

- Test framework selection (Vitest vs Jest - likely Vitest given electron-vite)
- Loading skeleton and error state handling
- Exact spacing, typography, and UI polish
- Progress indicator implementation details
- Compression and temp file handling for rendering

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Electron desktop app starts with double-click on .exe (no terminal, no dev server) | electron-builder portable target configuration, electron-vite build pipeline |
| INFRA-02 | React + Tailwind CSS frontend with electron-vite build tooling | electron-vite official scaffolding, shadcn/ui integration patterns, HMR setup |
| INFRA-03 | SQLite database for learning data (posts, stories, performance, balance matrix cache) with WAL mode and integrity checks | better-sqlite3 integration, WAL mode setup, PRAGMA quick_check validation |
| INFRA-04 | JSON file storage for settings with automatic timestamp versioning | app.getPath('userData') best practices, file system operations, Zod validation |
| INFRA-05 | Secure Claude API key storage via Electron safeStorage API | safeStorage API methods, platform-specific security, encryption availability checks |
| INFRA-06 | Brand-aware data model (brand_id in all database tables) with single-brand UI | Database schema design patterns, foreign key constraints |
| INFRA-07 | Graceful shutdown handler to prevent SQLite corruption | before-quit event handling, WAL checkpoint on close, db.close() patterns |
| TPL-07 | System renders HTML/CSS templates to PNG at Instagram dimensions (1080x1350 feed, 1080x1920 story) | BrowserWindow.capturePage API, hidden window rendering, show: false vs hide() |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| electron-vite | Latest (5.x+) | Build tooling and dev server | Official Vite-based tooling for Electron, fast HMR, handles main/preload/renderer split, TypeScript out of the box, replaces Webpack-based alternatives |
| Electron | 20.19+ or 22.12+ | Desktop app framework | Cross-platform desktop apps with web tech, BrowserWindow.capturePage for rendering, safeStorage API for credentials |
| React | 18.x | UI framework | Industry standard for component-based UIs, excellent TypeScript support, large ecosystem |
| TypeScript | 5.5+ | Type safety | Catches errors at compile time, required for type-safe IPC, Zod schema inference, better DX |
| Tailwind CSS | 4.x | Utility-first CSS | Rapid styling, built-in dark mode, atomic CSS, perfect for Electron apps, shadcn/ui dependency |
| better-sqlite3 | Latest | SQLite driver | Fastest Node.js SQLite binding, synchronous API (no async overhead), native performance, works in Electron main process |
| Zustand | 4.x+ | State management | Lightweight (1kb), no providers, simple store pattern, works great in Electron renderer |
| shadcn/ui | Latest | Component library | Copy-paste components (not npm dependency), built on Radix + Tailwind, accessible, dark mode ready, highly customizable |
| Zod | 3.23+ | Schema validation | TypeScript-first validation, static type inference with z.infer<>, catches JSON corruption, v4 adds JSON Schema support |
| electron-builder | Latest | Packaging tool | Industry standard for Electron app packaging, portable exe support, auto-update infrastructure ready |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-* | Latest | Headless UI primitives | Automatically installed with shadcn/ui components - provides accessible foundation |
| electron-rebuild | Latest | Native module rebuilding | Rebuild better-sqlite3 for Electron's Node version, usually via postinstall script |
| class-variance-authority | Latest | Component variants | Installed with shadcn/ui for variant management in components |
| clsx / tailwind-merge | Latest | Conditional classes | Installed with shadcn/ui for conditional Tailwind class application |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| electron-vite | electron-forge (Vite plugin) | Forge is more batteries-included but heavier, electron-vite is faster and more flexible |
| better-sqlite3 | sql.js (WASM) | sql.js works in renderer but slower, no native performance, bigger bundle |
| Zustand | Redux Toolkit | Redux is overkill for this app's state complexity, more boilerplate |
| shadcn/ui | MUI or Ant Design | Those are npm dependencies with full component sets, harder to customize, light mode bias |
| BrowserWindow.capturePage | Puppeteer | Puppeteer adds 300MB+ dependency, separate Chromium instance, more memory |

**Installation:**

```bash
# Scaffold project with electron-vite
npm create @quick-start/electron@latest content-creation-system -- --template react-ts

# Navigate into project
cd content-creation-system

# Install core dependencies
npm install better-sqlite3 zod zustand

# Install shadcn/ui (manual setup - see Architecture Patterns)
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# Install dev dependencies
npm install -D electron-rebuild
```

## Architecture Patterns

### Recommended Project Structure

```
content-creation-system/
├── src/
│   ├── main/              # Main process (Node.js environment)
│   │   ├── index.ts       # App entry point, window creation
│   │   ├── ipc/           # IPC handlers (grouped by domain)
│   │   │   ├── settings.ts    # Settings read/write/versioning
│   │   │   ├── database.ts    # DB operations
│   │   │   ├── rendering.ts   # HTML-to-PNG pipeline
│   │   │   └── security.ts    # API key encrypt/decrypt
│   │   ├── db/            # Database layer
│   │   │   ├── schema.sql     # Single schema file (all tables)
│   │   │   ├── index.ts       # DB initialization, connection
│   │   │   └── queries.ts     # Thin wrapper for common queries
│   │   ├── services/      # Business logic
│   │   │   ├── settings-service.ts  # Settings versioning logic
│   │   │   ├── render-service.ts    # Rendering window management
│   │   │   └── storage-service.ts   # File system operations
│   │   └── utils/         # Main process utilities
│   ├── preload/           # Preload scripts (bridge)
│   │   ├── index.ts       # Main preload, contextBridge setup
│   │   └── types.ts       # Shared IPC type definitions
│   └── renderer/          # Renderer process (React app)
│       ├── src/
│       │   ├── App.tsx              # Root component
│       │   ├── main.tsx             # React entry point
│       │   ├── components/
│       │   │   ├── ui/              # shadcn/ui components
│       │   │   ├── layout/          # Layout components (Sidebar, etc.)
│       │   │   └── features/        # Feature-specific components
│       │   ├── pages/               # Page components
│       │   │   ├── Dashboard.tsx
│       │   │   ├── TestRender.tsx   # Phase 1 test page
│       │   │   └── Settings.tsx     # Phase 2
│       │   ├── stores/              # Zustand stores
│       │   │   └── settings-store.ts
│       │   ├── lib/                 # Utils, API wrapper
│       │   │   └── utils.ts         # shadcn/ui utils (cn helper)
│       │   └── styles/
│       │       └── globals.css      # Tailwind directives, CSS vars
│       ├── index.html     # HTML entry point
│       └── vite.config.ts # Renderer Vite config (if needed)
├── electron.vite.config.ts  # Main electron-vite config
├── electron-builder.yml     # Packaging config
├── components.json          # shadcn/ui config
├── tailwind.config.js       # Tailwind config
├── tsconfig.json            # Root TypeScript config
├── tsconfig.node.json       # Main/preload TypeScript config
└── package.json
```

### Pattern 1: Typed IPC with Preload Bridge

**What:** Expose a type-safe API from main process to renderer via contextBridge, with shared type definitions ensuring compile-time safety across the IPC boundary.

**When to use:** Every IPC communication between renderer and main. Never expose raw ipcRenderer to avoid arbitrary IPC messages.

**Example:**

```typescript
// src/preload/types.ts
export interface IElectronAPI {
  // Settings
  loadSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>

  // Database
  createPost: (post: PostData) => Promise<number>

  // Rendering
  renderToPNG: (html: string, dimensions: { width: number; height: number }) => Promise<string>

  // Security
  saveAPIKey: (key: string) => Promise<void>
  loadAPIKey: () => Promise<string | null>
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}

// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from './types'

const api: IElectronAPI = {
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  createPost: (post) => ipcRenderer.invoke('db:create-post', post),
  renderToPNG: (html, dimensions) => ipcRenderer.invoke('render:to-png', html, dimensions),
  saveAPIKey: (key) => ipcRenderer.invoke('security:save-key', key),
  loadAPIKey: () => ipcRenderer.invoke('security:load-key'),
}

contextBridge.exposeInMainWorld('api', api)

// src/main/ipc/settings.ts
import { ipcMain, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

ipcMain.handle('settings:load', async () => {
  const userDataPath = app.getPath('userData')
  const settingsPath = path.join(userDataPath, 'settings.json')
  const data = await fs.readFile(settingsPath, 'utf-8')
  return JSON.parse(data)
})

ipcMain.handle('settings:save', async (event, settings) => {
  const userDataPath = app.getPath('userData')
  const settingsPath = path.join(userDataPath, 'settings.json')

  // Version the existing file first
  const timestamp = Date.now()
  const versionsDir = path.join(userDataPath, 'versions')
  await fs.mkdir(versionsDir, { recursive: true })

  try {
    await fs.copyFile(
      settingsPath,
      path.join(versionsDir, `settings_${timestamp}.json`)
    )
  } catch (err) {
    // File might not exist on first save
  }

  // Write new settings
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
})

// src/renderer/src/pages/TestRender.tsx
export function TestRender() {
  const [imageUrl, setImageUrl] = useState<string>('')

  const handleRender = async () => {
    const html = '<div>Test content</div>'
    const pngPath = await window.api.renderToPNG(html, { width: 1080, height: 1350 })
    setImageUrl(`file://${pngPath}`)
  }

  return <button onClick={handleRender}>Render Test</button>
}
```

**Why this pattern:** Type safety prevents runtime errors, security is enforced (no arbitrary IPC), single source of truth for API shape, excellent autocomplete in renderer.

### Pattern 2: Persistent Hidden BrowserWindow for Rendering

**What:** Create a dedicated hidden BrowserWindow at app startup that stays loaded throughout the session. Use this window for all HTML-to-PNG rendering operations via capturePage.

**When to use:** When you need fast, repeated HTML-to-PNG rendering without the overhead of creating/destroying windows.

**Example:**

```typescript
// src/main/services/render-service.ts
import { BrowserWindow, app } from 'electron'
import path from 'path'

export class RenderService {
  private renderWindow: BrowserWindow | null = null

  async initialize() {
    this.renderWindow = new BrowserWindow({
      width: 1080,
      height: 1920, // Max dimension we need (story size)
      show: false, // CRITICAL: Use show: false, NOT hide()
      frame: false,
      webPreferences: {
        offscreen: false, // Regular rendering, not offscreen mode
        nodeIntegration: false,
        contextIsolation: true,
      }
    })

    // Load a blank HTML page to start
    await this.renderWindow.loadURL('data:text/html,<html><body></body></html>')
  }

  async renderToPNG(html: string, dimensions: { width: number; height: number }): Promise<string> {
    if (!this.renderWindow) {
      throw new Error('Render window not initialized')
    }

    // Set window size to match desired output
    this.renderWindow.setSize(dimensions.width, dimensions.height)

    // Load the HTML content
    await this.renderWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`)

    // Wait for rendering to complete
    // CRITICAL: Wait for 'did-finish-load' event, then add small delay for CSS rendering
    await new Promise(resolve => {
      this.renderWindow!.webContents.once('did-finish-load', () => {
        setTimeout(resolve, 100) // Small delay ensures CSS is fully applied
      })
    })

    // Capture the page
    const image = await this.renderWindow.webContents.capturePage()

    // Save to temp directory
    const tmpDir = app.getPath('temp')
    const filename = `render_${Date.now()}.png`
    const outputPath = path.join(tmpDir, filename)

    await fs.writeFile(outputPath, image.toPNG())

    return outputPath
  }

  cleanup() {
    if (this.renderWindow) {
      this.renderWindow.close()
      this.renderWindow = null
    }
  }
}

// src/main/index.ts
const renderService = new RenderService()

app.whenReady().then(async () => {
  await renderService.initialize()
  createWindow()
})

app.on('before-quit', () => {
  renderService.cleanup()
})
```

**Why this pattern:** Much faster than creating/destroying windows for each render (no window creation overhead), avoids Windows-specific bugs with hide(), window stays ready for immediate use, memory efficient (reuses single window).

**Warning signs:** If capturePage returns empty images on Windows, check that you're using `show: false` in constructor (not calling `hide()` after creation). If renders are incomplete, increase the post-load delay or use `webContents.executeJavaScript()` to check if fonts/images loaded.

### Pattern 3: SQLite with WAL Mode and Graceful Shutdown

**What:** Initialize SQLite database with WAL mode, run integrity check on startup, implement graceful shutdown with explicit checkpoint and close.

**When to use:** All SQLite usage in Electron main process. WAL mode enables better concurrency, but requires proper shutdown handling.

**Example:**

```typescript
// src/main/db/index.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'content-creation.db')

  const isNewDb = !fs.existsSync(dbPath)

  db = new Database(dbPath)

  // Enable WAL mode (only needed once, but idempotent)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL') // Faster, safe with WAL
  db.pragma('foreign_keys = ON')

  // Run integrity check on existing database
  if (!isNewDb) {
    const result = db.pragma('quick_check', { simple: true })
    if (result !== 'ok') {
      console.error('Database integrity check failed:', result)
      // Handle corruption (backup and recreate, or fail startup)
      throw new Error('Database corruption detected')
    }
  }

  // Initialize schema if new database
  if (isNewDb) {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    )
    db.exec(schemaSQL)
  }

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function closeDatabase() {
  if (db) {
    // Checkpoint WAL to main database file
    db.pragma('wal_checkpoint(TRUNCATE)')

    // Close connection
    db.close()
    db = null
  }
}

// src/main/index.ts
app.whenReady().then(() => {
  initDatabase()
  createWindow()
})

app.on('before-quit', (event) => {
  // Ensure database is closed properly before app quits
  try {
    closeDatabase()
  } catch (err) {
    console.error('Error closing database:', err)
  }
})
```

**Why this pattern:** WAL mode allows reads during writes (better concurrency), PRAGMA quick_check is fast enough for startup (O(N) vs O(N log N) for full integrity_check), explicit checkpoint on shutdown ensures data is flushed to main file, prevents corruption from abrupt termination.

**Warning signs:** If database is locked on startup, check for orphaned processes. If data is lost after crash, WAL checkpoint might not be running (check before-quit handler). If quick_check fails, database is corrupted (restore from backup or recreate).

### Pattern 4: Settings Storage with Zod Validation and Versioning

**What:** Store all app settings in a single JSON file with Zod schema validation on read/write, automatically version the file on every save.

**When to use:** All configuration that users modify through the settings UI.

**Example:**

```typescript
// src/shared/types/settings.ts
import { z } from 'zod'

export const SettingsSchema = z.object({
  brandVoice: z.object({
    tonality: z.string(),
    dos: z.array(z.string()),
    donts: z.array(z.string()),
    examplePosts: z.array(z.string()),
  }).optional(),

  targetPersona: z.object({
    demographics: z.string(),
    painPoints: z.array(z.string()),
    goals: z.array(z.string()),
  }).optional(),

  contentPillars: z.object({
    generateDemand: z.number().min(0).max(100),
    convertDemand: z.number().min(0).max(100),
    nurtureLoyalty: z.number().min(0).max(100),
  }).refine(
    data => data.generateDemand + data.convertDemand + data.nurtureLoyalty === 100,
    { message: 'Pillar percentages must sum to 100' }
  ),

  systemSettings: z.object({
    carouselSlideMin: z.number().min(1),
    carouselSlideMax: z.number().min(1),
    captionMaxChars: z.number(),
  }),

  // ... other 11 config areas
})

export type Settings = z.infer<typeof SettingsSchema>

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  systemSettings: {
    carouselSlideMin: 3,
    carouselSlideMax: 10,
    captionMaxChars: 2200,
  },
  contentPillars: {
    generateDemand: 33,
    convertDemand: 34,
    nurtureLoyalty: 33,
  },
  // ... other defaults
}

// src/main/services/settings-service.ts
import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { SettingsSchema, Settings, DEFAULT_SETTINGS } from '../../shared/types/settings'

export class SettingsService {
  private userDataPath = app.getPath('userData')
  private settingsPath = path.join(this.userDataPath, 'settings.json')
  private versionsDir = path.join(this.userDataPath, 'versions')

  async load(): Promise<Settings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8')
      const parsed = JSON.parse(data)

      // Validate with Zod
      return SettingsSchema.parse(parsed)
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        // File doesn't exist, create with defaults
        await this.save(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
      }

      // Validation error or corrupt JSON
      console.error('Settings validation failed:', err)
      throw new Error('Invalid settings file')
    }
  }

  async save(settings: Settings): Promise<void> {
    // Validate before saving
    const validated = SettingsSchema.parse(settings)

    // Ensure versions directory exists
    await fs.mkdir(this.versionsDir, { recursive: true })

    // Copy current file to versions (if exists)
    const timestamp = Date.now()
    const versionPath = path.join(this.versionsDir, `settings_${timestamp}.json`)

    try {
      await fs.copyFile(this.settingsPath, versionPath)
    } catch (err) {
      // File might not exist on first save
    }

    // Write new settings
    await fs.writeFile(
      this.settingsPath,
      JSON.stringify(validated, null, 2),
      'utf-8'
    )
  }
}
```

**Why this pattern:** Zod catches corruption and schema violations at runtime, TypeScript types are automatically inferred (no manual sync), versioning provides audit trail and rollback capability, defaults ensure app works on first launch.

### Pattern 5: Secure API Key Storage with safeStorage

**What:** Use Electron's safeStorage API to encrypt sensitive credentials, store encrypted data in a separate file from settings.json.

**When to use:** Storing API keys, tokens, or other secrets that should never appear in plaintext.

**Example:**

```typescript
// src/main/services/security-service.ts
import { safeStorage, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export class SecurityService {
  private encryptedKeyPath = path.join(app.getPath('userData'), '.api-key.enc')

  async saveAPIKey(plainTextKey: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this platform')
    }

    const encrypted = safeStorage.encryptString(plainTextKey)
    await fs.writeFile(this.encryptedKeyPath, encrypted)
  }

  async loadAPIKey(): Promise<string | null> {
    try {
      const encrypted = await fs.readFile(this.encryptedKeyPath)

      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this platform')
      }

      return safeStorage.decryptString(encrypted)
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        return null // No key stored yet
      }
      throw err
    }
  }

  async deleteAPIKey(): Promise<void> {
    try {
      await fs.unlink(this.encryptedKeyPath)
    } catch (err) {
      // File might not exist
    }
  }
}
```

**Why this pattern:** Platform-specific encryption (DPAPI on Windows, Keychain on macOS, libsecret on Linux), encrypted file is separate from settings.json (safe to backup settings without exposing key), API surface is simple (encrypt, decrypt, delete).

**Warning signs:** If isEncryptionAvailable() returns false on Linux, user's system doesn't have a password manager configured (app should warn user or fall back to manual entry per-session). On macOS, calls may block thread to collect user input (Keychain unlock).

### Anti-Patterns to Avoid

- **Exposing ipcRenderer.send directly in preload:** Security risk, allows arbitrary IPC messages from renderer. Always wrap in specific methods.
- **Using hide() instead of show: false for hidden windows:** On Windows, capturePage() returns empty images when window is hidden via hide(). Use show: false in constructor.
- **Bundling better-sqlite3 with Vite:** Native modules must be external. Mark as external in vite.config.ts rollupOptions.
- **Storing API keys in settings.json:** Never store secrets in plaintext JSON. Use safeStorage API.
- **Not checkpointing WAL on shutdown:** Can lose data if app crashes. Always call PRAGMA wal_checkpoint before db.close().
- **Using full integrity_check on every startup:** Too slow (O(N log N)). Use quick_check (O(N)) for routine validation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Settings storage with versioning | Custom file versioning system | Simple copy-on-write with timestamp | File versioning is simple (copy before write), no need for git-like diff system or complex rollback UI |
| JSON schema validation | Manual validation with if/else checks | Zod with z.infer<> | Schema drift between validator and TypeScript types, Zod keeps them in sync, excellent error messages |
| State management across renderer windows | Custom event bus or Redux | Zustand | Zustand handles async updates, subscriptions, middleware out of the box, 1KB vs 20KB+ for Redux |
| Electron IPC type safety | Manual type definitions duplicated across files | Shared types file with contextBridge wrapper | Single source of truth, compiler enforces both sides of IPC boundary |
| SQLite migration system | Custom migration runner | Single schema.sql file with version check | Overkill for v1, single file is simple, ALTER TABLE for updates, full migration system deferred to multi-brand phase |
| Electron app packaging | Custom build scripts with node-gyp | electron-builder | Handles native module rebuilding, code signing, auto-update infrastructure, multi-platform builds |
| Component library | Custom components from scratch | shadcn/ui | Accessibility is hard (ARIA, keyboard nav, screen readers), Radix handles it, you customize styling |

**Key insight:** Electron apps have well-established patterns for IPC, native modules, and packaging. Custom solutions introduce bugs (especially around native module rebuilding, IPC type safety, and graceful shutdown). Use the standard tooling.

## Common Pitfalls

### Pitfall 1: Native Module Rebuild Mismatch (better-sqlite3)

**What goes wrong:** App works in dev mode but crashes in production with "NODE_MODULE_VERSION mismatch" error.

**Why it happens:** better-sqlite3 is a native C++ addon compiled for specific Node.js version. Electron uses a different Node version than your system. If you install dependencies with system Node, the compiled module won't work in Electron.

**How to avoid:**
1. Mark better-sqlite3 as external in electron.vite.config.ts:
   ```typescript
   export default defineConfig({
     main: {
       build: {
         rollupOptions: {
           external: ['better-sqlite3']
         }
       }
     }
   })
   ```

2. Add postinstall script to package.json:
   ```json
   {
     "scripts": {
       "postinstall": "electron-builder install-app-deps"
     }
   }
   ```

3. For development, you may need electron-rebuild:
   ```bash
   npm install -D electron-rebuild
   ```

**Warning signs:** Error message contains "NODE_MODULE_VERSION", app works in dev but crashes in build, SQLite operations throw "not a valid Win32 application" (Windows).

### Pitfall 2: BrowserWindow.capturePage Empty Images on Windows

**What goes wrong:** capturePage() returns empty or blank PNG files on Windows, works fine on macOS.

**Why it happens:** When you call hide() on a BrowserWindow, Windows suspends the renderer process. capturePage() can't capture a suspended renderer.

**How to avoid:** Use `show: false` when creating BrowserWindow (don't call hide() after creation). Also wait for did-finish-load event plus small delay for CSS rendering:

```typescript
const renderWindow = new BrowserWindow({
  show: false, // ✅ Correct
  // ... other options
})

// ❌ Wrong:
// renderWindow.hide()

// Wait for rendering
await new Promise(resolve => {
  renderWindow.webContents.once('did-finish-load', () => {
    setTimeout(resolve, 100) // Small delay for CSS
  })
})
```

**Warning signs:** PNG files are 0 bytes or solid color, Windows-only issue (works on Mac), renderer console shows errors about suspended context.

### Pitfall 3: SQLite Database Corruption After App Crash

**What goes wrong:** App crashes or is force-closed, database is corrupted on next startup (quick_check fails).

**Why it happens:** WAL mode keeps recent writes in a separate .wal file. If app terminates without checkpointing WAL to main database, and the .wal file is corrupted, database is unrecoverable.

**How to avoid:** Implement before-quit handler that checkpoints and closes database:

```typescript
app.on('before-quit', () => {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)') // Flush WAL to main db
    db.close()
  } catch (err) {
    console.error('Error closing database:', err)
  }
})
```

Also run quick_check on startup to detect corruption early.

**Warning signs:** Users report "database is locked" errors, quick_check returns errors instead of 'ok', .wal file is large (checkpoint not running), data loss after crashes.

### Pitfall 4: Zustand State Not Persisting Across Renderer Windows

**What goes wrong:** If you later add multiple renderer windows, Zustand stores don't share state between windows.

**Why it happens:** Each renderer process has its own JavaScript context and memory. Zustand stores are local to each renderer.

**How to avoid:** For Phase 1 (single window), this is not an issue. When adding multi-window support later, use IPC to sync state or libraries like Zutron (@zubridge/electron).

**Warning signs:** Settings changes in one window don't appear in another window, state resets when opening new windows.

### Pitfall 5: safeStorage Not Available on Linux Without Password Manager

**What goes wrong:** safeStorage.isEncryptionAvailable() returns false on some Linux systems, API key can't be stored securely.

**Why it happens:** Linux safeStorage requires kwallet, kwallet5, kwallet6, or gnome-libsecret. If user's system doesn't have any of these, encryption falls back to hardcoded plaintext password (not secure).

**How to avoid:** Check isEncryptionAvailable() before encrypting. If false, warn user that secure storage is unavailable and prompt for API key on each session (don't store it), or use a fallback like in-memory storage with session persistence.

```typescript
if (!safeStorage.isEncryptionAvailable()) {
  console.warn('Secure storage not available on this system')
  // Fallback: prompt for API key each session
  // OR: show warning dialog to user
}
```

**Warning signs:** safeStorage.isEncryptionAvailable() returns false on Linux, decryptString throws errors, API key is lost between sessions.

### Pitfall 6: Tailwind CSS Not Purging Unused Styles

**What goes wrong:** Production bundle includes all Tailwind CSS (3MB+), slow app startup.

**Why it happens:** Tailwind config doesn't specify content paths, so Tailwind can't purge unused classes.

**How to avoid:** Configure content paths in tailwind.config.js:

```javascript
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html',
  ],
  // ... rest of config
}
```

**Warning signs:** Large renderer bundle (10MB+), slow initial load, browser devtools show large CSS file.

### Pitfall 7: IPC Handlers Not Cleaned Up

**What goes wrong:** Memory leaks, duplicate handlers firing, errors about "handler already registered".

**Why it happens:** ipcMain.handle() registers handlers globally. If you reload code in dev mode or re-register handlers, duplicates accumulate.

**How to avoid:** Use ipcMain.handle() only once at app startup (not in hot-reloaded code). If you need to update handlers, use ipcMain.removeHandler() first.

```typescript
// ✅ Good: Register once at startup
app.whenReady().then(() => {
  registerIPCHandlers()
})

// ❌ Bad: Registering in hot-reloaded code
// This runs multiple times in dev mode
```

**Warning signs:** Error "Attempted to register a second handler", IPC responses come back multiple times, memory grows over time in dev mode.

## Code Examples

Verified patterns from official sources and research:

### Electron-Vite Project Scaffolding

```bash
# Create new project with React + TypeScript template
npm create @quick-start/electron@latest content-creation-system -- --template react-ts

cd content-creation-system

# Project structure created:
# src/
#   main/         - Main process
#   preload/      - Preload scripts
#   renderer/     - React app
# electron.vite.config.ts
```

Source: [electron-vite official docs](https://electron-vite.org/guide/)

### Setting Up shadcn/ui Manually in Electron-Vite Project

```bash
# Install Tailwind and dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui dependencies
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# Create components.json
npx shadcn@latest init
```

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/renderer/src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
}
```

```css
/* src/renderer/src/styles/globals.css */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

/* shadcn/ui CSS variables */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other light mode vars */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other dark mode vars */
  }
}
```

Sources: [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual), [Electron-Vite + shadcn/ui guide](https://blog.mohitnagaraj.in/blog/202505/Electron_Shadcn_Guide)

### Adding shadcn/ui Components

```bash
# Add button component
npx shadcn@latest add button

# Add sidebar and other components
npx shadcn@latest add sidebar
npx shadcn@latest add dropdown-menu
```

This copies component source to `src/renderer/src/components/ui/` where you can customize.

### SQLite Database Initialization with WAL Mode

```typescript
// src/main/db/index.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'content-creation.db')

  const isNewDb = !fs.existsSync(dbPath)

  db = new Database(dbPath)

  // Enable WAL mode (persistent property, but idempotent)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL') // Faster, safe with WAL
  db.pragma('foreign_keys = ON')

  // Integrity check on existing database
  if (!isNewDb) {
    const result = db.pragma('quick_check', { simple: true })
    if (result !== 'ok') {
      console.error('Database integrity check failed:', result)
      throw new Error('Database corruption detected')
    }
  }

  // Initialize schema
  if (isNewDb) {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    )
    db.exec(schemaSQL)
  }

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
  }
}
```

```sql
-- src/main/db/schema.sql
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  pillar TEXT NOT NULL,
  theme TEXT NOT NULL,
  subtopic TEXT,
  key_message TEXT,
  mechanic TEXT NOT NULL,
  template_id INTEGER,
  content_type TEXT NOT NULL CHECK(content_type IN ('single', 'carousel')),
  slide_count INTEGER,
  ad_hoc INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  post_id INTEGER NOT NULL,
  story_type TEXT NOT NULL,
  tool_type TEXT,
  timing TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  story_id INTEGER,
  reach INTEGER,
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  revenue REAL,
  notes TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS balance_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  variable_type TEXT NOT NULL,
  variable_value TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER,
  avg_performance REAL
);

CREATE TABLE IF NOT EXISTS settings_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
```

Sources: [better-sqlite3 Electron integration guide](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16), [SQLite WAL mode best practices](https://phiresky.github.io/blog/2020/sqlite-performance-tuning/)

### electron-builder Configuration for Portable EXE

```yaml
# electron-builder.yml
appId: com.contentcreation.system
productName: Content Creation System
directories:
  output: dist
  buildResources: build

win:
  target:
    - target: portable
      arch:
        - x64
  artifactName: ${productName}-${version}-portable.exe

# Auto-rebuild native modules
beforeBuild: npm run postinstall
```

```json
// package.json additions
{
  "scripts": {
    "build": "electron-vite build",
    "build:win": "npm run build && electron-builder --win --config electron-builder.yml",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

Source: [electron-builder Windows configuration](https://www.electron.build/win.html)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Webpack for Electron | Vite via electron-vite | 2022-2023 | 10x faster dev server startup, instant HMR, simpler config |
| electron-forge with Webpack template | electron-vite scaffolding | 2023+ | Vite ecosystem, better TypeScript support, faster builds |
| electron-builder install-app-deps | Automatic native rebuild | 2024+ | electron-builder handles native modules automatically, less manual setup |
| Separate IPC type definitions | Shared types with contextBridge | Ongoing best practice | Type safety across IPC boundary, single source of truth |
| node-keytar for credential storage | safeStorage API (built-in) | Electron 15+ (2021) | No external dependency, platform-native encryption |
| Manual JSON validation | Zod schema validation | 2022+ (Zod maturity) | Type inference, better error messages, no schema drift |
| Redux for Electron state | Zustand | 2023+ (simplicity trend) | 95% less boilerplate, same functionality, 1KB vs 20KB |
| Component libraries as npm deps (MUI, Ant) | Copy-paste shadcn/ui | 2023+ | Full customization, no framework lock-in, tree-shakeable |
| Offscreen rendering for screenshots | BrowserWindow.capturePage with show: false | Ongoing | Simpler, no special offscreen mode, works with regular rendering |

**Deprecated/outdated:**
- **electron-rebuild as primary native module tool**: electron-builder install-app-deps handles this automatically now (use electron-rebuild only if issues arise)
- **node-keytar**: Replaced by built-in safeStorage API (Electron 15+), no need for external native dependency
- **Webpack-based Electron tooling**: Vite is now the standard, Webpack configs are 10x more complex for same result
- **Redux for simple Electron apps**: Overkill for apps without complex async state management, Zustand is modern standard for simple cases

## Open Questions

### 1. Test Framework for Electron Main Process

**What we know:** Vitest is natural fit for Vite-based projects, but native Electron main process testing support is limited. Playwright can launch Electron apps and test E2E, but unit testing main process code requires mocking electron module.

**What's unclear:** Best approach for unit testing main process services (database layer, settings service, render service) in isolation.

**Recommendation:** Use Vitest for unit tests with mocked electron APIs (vi.mock('electron')). Test IPC handlers by calling them directly (they're just async functions). Use manual verification for Phase 1 (launch app, test rendering, check database). Defer E2E with Playwright to later phase when complexity justifies it.

### 2. Render Timing Reliability

**What we know:** capturePage should wait for did-finish-load event, plus small delay for CSS rendering. Some sources suggest checking for specific elements via executeJavaScript.

**What's unclear:** Whether 100ms delay is sufficient for all cases, or if we need dynamic detection (wait for fonts, images).

**Recommendation:** Start with 100ms delay. If renders are incomplete in testing, increase to 200ms or add font/image loading detection via webContents.executeJavaScript(). Since templates are controlled (no external resources), fixed delay should work.

### 3. Multi-Brand Migration Path

**What we know:** All tables have brand_id column with DEFAULT 1, enabling multi-brand later. Single-brand UI for Phase 1.

**What's unclear:** Whether indexes on brand_id are needed now for future performance.

**Recommendation:** Skip brand_id indexes in Phase 1. Single brand = no query performance issues. Add indexes when implementing multi-brand (Phase 5+), trivial ALTER TABLE at that time.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.x+ |
| Config file | vitest.config.ts (create in root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | App launches and creates window | manual | N/A - verify via `npm run build:win` and double-click .exe | ❌ Manual verification |
| INFRA-02 | React renders, HMR works | manual | N/A - verify via `npm run dev` | ❌ Manual verification |
| INFRA-03 | SQLite init, WAL mode, integrity check | unit | `npm run test -- src/main/db/index.test.ts -x` | ❌ Wave 0 |
| INFRA-04 | Settings load/save/version correctly | unit | `npm run test -- src/main/services/settings-service.test.ts -x` | ❌ Wave 0 |
| INFRA-05 | safeStorage encrypt/decrypt | unit | `npm run test -- src/main/services/security-service.test.ts -x` | ❌ Wave 0 |
| INFRA-06 | Database schema has brand_id columns | unit | `npm run test -- src/main/db/schema.test.ts -x` | ❌ Wave 0 |
| INFRA-07 | before-quit closes DB cleanly | unit | `npm run test -- src/main/index.test.ts -x` (mock app events) | ❌ Wave 0 |
| TPL-07 | HTML renders to PNG at correct dimensions | unit | `npm run test -- src/main/services/render-service.test.ts -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test` (runs all unit tests, < 30 seconds)
- **Per wave merge:** `npm run test:coverage` (full suite with coverage report)
- **Phase gate:** Full suite green + manual verification (launch app, test render page, check DB file) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/main/db/index.test.ts` — covers INFRA-03 (init, WAL, integrity check)
- [ ] `tests/main/services/settings-service.test.ts` — covers INFRA-04 (load, save, version)
- [ ] `tests/main/services/security-service.test.ts` — covers INFRA-05 (encrypt, decrypt, availability check)
- [ ] `tests/main/db/schema.test.ts` — covers INFRA-06 (brand_id columns present)
- [ ] `tests/main/index.test.ts` — covers INFRA-07 (mocked before-quit handler)
- [ ] `tests/main/services/render-service.test.ts` — covers TPL-07 (mock BrowserWindow, verify capturePage called)
- [ ] `vitest.config.ts` — Vitest config with main process environment
- [ ] `tests/setup.ts` — Mock electron module for tests
- [ ] Package install: `npm install -D vitest @vitest/ui`

## Sources

### Primary (HIGH confidence)

- [electron-vite official documentation](https://electron-vite.org/guide/) - Project structure, HMR setup, build configuration
- [Electron safeStorage API docs](https://www.electronjs.org/docs/latest/api/safe-storage) - Encryption methods, platform differences, availability checks
- [SQLite PRAGMA documentation](https://sqlite.org/pragma.html) - WAL mode, quick_check, integrity validation
- [electron-builder Windows targets](https://www.electron.build/win.html) - Portable exe configuration, build options
- [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual) - Setup steps, components.json config
- [Zod official documentation](https://zod.dev/) - Schema validation, type inference

### Secondary (MEDIUM confidence)

- [better-sqlite3 Electron integration guide](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16) - Native module rebuild, WAL setup patterns
- [Electron-Vite + shadcn/ui setup guide (2025)](https://blog.mohitnagaraj.in/blog/202505/Electron_Shadcn_Guide) - Vite config workaround, dark mode setup
- [Electron IPC type safety patterns](https://www.electronjs.org/docs/latest/tutorial/ipc) - contextBridge best practices, security patterns
- [SQLite performance tuning](https://phiresky.github.io/blog/2020/sqlite-performance-tuning/) - WAL mode benefits, pragma settings
- [BrowserWindow capturePage issues on Windows](https://github.com/electron/electron/issues/35953) - show: false vs hide() workaround

### Tertiary (LOW confidence)

- [Vitest Electron support discussion](https://github.com/vitest-dev/vitest/issues/5883) - Current state of Electron testing, workarounds
- [Zutron library for Zustand + Electron](https://github.com/goosewobbler/zutron) - Multi-window state sync patterns (deferred to later phase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are current standards with official Electron support (2026)
- Architecture: HIGH - Patterns verified from official docs and production templates
- Pitfalls: HIGH - Directly from GitHub issues and documented bugs (especially Windows rendering, native modules)
- Testing: MEDIUM - Vitest Electron support is evolving, manual verification needed for some tests

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days - stack is stable, Electron/Vite releases are incremental)

---

*Research complete. Ready for planner to create PLAN.md files.*
