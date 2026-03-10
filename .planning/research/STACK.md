# Stack Research

**Domain:** Electron desktop app - AI-powered Instagram content creation system
**Researched:** 2026-03-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Electron** | 40.8.0+ | Desktop app framework | Industry standard for cross-platform desktop apps. Latest version includes Chromium 144, V8 14.4, Node 24.11. Ships with built-in BrowserWindow.capturePage for HTML-to-PNG rendering without Puppeteer dependencies. |
| **React** | 19.2.4 | UI framework | Latest stable version. React 19 brings performance improvements, cleaner code patterns, and better state handling. 78% adoption in TypeScript projects. No longer requires React imports in every file. |
| **TypeScript** | 6.0 RC | Type safety | Latest release candidate (6.0 RC released March 6, 2026). Provides type safety across IPC boundaries and better DX. TypeScript 7.0 (Go-based, 10x faster) coming soon but 6.0 is the bridge version. |
| **electron-vite** | Latest | Build tooling | Next generation Electron build tool. Vite-powered with instant HMR for renderer, hot reloading for main process and preload scripts. Pre-configured for Electron, optimizes asset handling, compiles to V8 bytecode. Superior DX over webpack-based alternatives. |
| **better-sqlite3** | 12.6.2 | SQLite database | Fastest and simplest SQLite library for Node.js. Synchronous API (faster than async), full SQL power, trivial migration to PostgreSQL later. 4,292 projects use it. Works seamlessly with Electron. |
| **Tailwind CSS** | 4.2.1 | UI styling | Latest v4 with CSS-first configuration via @theme directive. 5x faster new engine, OKLCH colors by default, dedicated Vite plugin. Industry standard for utility-first CSS. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@anthropic-ai/sdk** | Latest | Claude API integration | Official TypeScript SDK with idiomatic interfaces, automatic retries, streaming support, tool use helpers, and MCP support. Single dependency for all Claude API needs. |
| **electron-store** | Latest | Settings persistence | Simple JSON-based config storage in app.getPath('userData'). ESM-only (Electron 30+). Use for brand settings, visual templates, master prompt. Better than electron-settings for modern projects. |
| **dnd-kit** | Latest | Drag-and-drop zones | Modern, lightweight (~10kb), accessible drag-and-drop for React. Hooks API (useDraggable, useDroppable). Perfect for visual template zone editor. React 19 compatible. More flexible than react-beautiful-dnd. |
| **react-konva** | Latest | Canvas rendering for zone editor | HTML5 Canvas library for React. Handles draggable shapes, visual zone drawing on uploaded images. Better than raw canvas for interactive editors. |
| **zustand** | Latest | Client state management | Minimal (~1KB) state library. Simple co-located logic, no boilerplate. Perfect for UI state (current post, editor state, wizard progress). Much simpler than Redux for small-to-medium apps. |
| **react-router** | 7.13.1 | Client-side routing | Settings screens, post generation wizard, performance tracking views. v7 simplifies imports (everything from "react-router"). Owned by Shopify, actively maintained. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **electron-builder** | App packaging and distribution | More popular than electron-forge (1.2M weekly downloads vs 1,775). Complete solution for Windows .exe builds. Works seamlessly with electron-vite. |
| **ESLint** | Code linting | Use flat config format (eslint.config.js). Extend eslint:recommended, @typescript-eslint/recommended, react-hooks/recommended-latest. |
| **Prettier** | Code formatting | Integrate via eslint-plugin-prettier/recommended. Keep config minimal (.prettierrc.json can be empty for defaults). Prevents formatting conflicts. |
| **@typescript-eslint/parser** | TypeScript parsing for ESLint | Required for ESLint to understand TypeScript. Pair with @typescript-eslint/eslint-plugin. |

## Installation

```bash
# Core dependencies
npm install react react-dom @anthropic-ai/sdk better-sqlite3 zustand react-router electron-store dnd-kit react-konva

# Electron
npm install electron

# Dev dependencies
npm install -D electron-vite electron-builder typescript @types/react @types/react-dom @types/node tailwindcss postcss autoprefixer eslint prettier eslint-plugin-prettier eslint-config-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks

# Initialize Tailwind
npx tailwindcss init -p
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **electron-vite** | electron-forge + webpack | If you need webpack-specific plugins or have existing webpack config. Forge has tighter integration with official Electron tooling but slower DX. |
| **better-sqlite3** | Native Node.js SQLite module | Node.js 22.5.0+ has experimental built-in SQLite. Avoid for production (experimental status, limited features vs better-sqlite3). |
| **BrowserWindow.capturePage** | Puppeteer | If you need cross-window screenshots or desktop file dragging. Puppeteer has HTML5 drag-drop backend but doesn't integrate well with Electron (Protocol.Target.getBrowserContexts() issue since v1.5.0). |
| **zustand** | Redux Toolkit | If you have a large team needing strict architecture, powerful DevTools, and RTK Query. Redux is 15KB vs zustand's 1KB. For this single-brand desktop app, zustand's simplicity wins. |
| **dnd-kit** | react-dnd | If you need HTML5 native drag-and-drop (dragging files from desktop, cross-window dragging). dnd-kit is lighter and more modern for in-app dragging. |
| **electron-store** | electron-settings | If you need Electron v10 support with remote module. electron-store is ESM-native and more actively maintained for modern Electron. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Puppeteer in Electron** | Protocol compatibility issues since Puppeteer v1.5.0. Target.getBrowserContexts() not implemented by Electron. Adds 300MB+ Chromium download when Electron already bundles Chromium. | **BrowserWindow.capturePage** - Built-in, no extra dependencies, same rendering engine. Create offscreen BrowserWindow, load HTML, call capturePage(), get PNG buffer. |
| **Drizzle ORM** | Type safety illusion - only validates query results, not queries themselves. Adds ORM complexity when you need simple SQL for learning data queries. | **better-sqlite3 directly** - Prepared statements, simple API, real type safety via TypeScript types you control. SQLite schema is straightforward. |
| **localStorage for settings** | 5-10MB limit, no structure, loses type safety. Not suitable for brand settings object with 11 configuration areas. | **electron-store** - JSON with schema validation, unlimited size, type-safe TypeScript interfaces. |
| **React Beautiful DnD** | Deprecated, no longer maintained. No React 19 support. | **dnd-kit** - Modern, actively maintained, React 19 compatible, better accessibility. |
| **Webpack + Electron** | Slow HMR, requires manual restart for main process changes. Complex configuration. | **electron-vite** - Instant HMR, hot reload for main process, pre-configured for Electron. |

## Stack Patterns by Variant

**For HTML-to-PNG Rendering:**
- Use **Electron's built-in BrowserWindow.capturePage**, NOT Puppeteer
- Create offscreen BrowserWindow with show: false
- Set dimensions to target size (1080x1350 for feed, 1080x1920 for story)
- Load HTML content via loadURL or loadFile
- Wait for 'did-finish-load' event
- Call webContents.capturePage() -> returns Promise<NativeImage>
- Convert to PNG with image.toPNG()
- Save to file or return buffer
- This avoids 300MB+ Puppeteer/Chromium download and protocol compatibility issues

**For Settings Storage:**
- Use **electron-store** for JSON config (brand settings, templates, master prompt)
- Use **better-sqlite3** for performance data (posts, metrics, learning system)
- JSON for rarely-changed config, SQLite for queryable time-series data
- Separate concerns: config vs operational data

**For IPC Security (2026 Standards):**
- ALWAYS set nodeIntegration: false, contextIsolation: true, sandbox: true in BrowserWindow
- NEVER expose ipcRenderer directly via contextBridge (security vulnerability)
- Use preload script to expose whitelisted IPC functions via contextBridge
- Use ipcRenderer.invoke + ipcMain.handle for request-response patterns
- Validate and sanitize all IPC data
- This is mandatory for Electron apps in 2026

**For State Management:**
- Use **zustand** for UI state (wizard steps, current post, editor state)
- Use **React Query (TanStack Query)** if you add Instagram Graph API later (server state)
- Keep client state (zustand) and server state (React Query) separate
- Don't put API responses in zustand - that's server state

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Electron 40.8.0 | Node 24.11.1 | Electron bundles specific Node version. Use Node 24 for development to match. |
| better-sqlite3 12.6.2 | Node 14.21.1+ | Prebuilt binaries for Electron v121+. Works with Electron 40. |
| React 19.2.4 | TypeScript 6.0 | Fully compatible. React 19 hooks (useActionState, useOptimistic) work with TS 6.0. |
| electron-vite | Vite 5.x | Electron-vite uses Vite 5 internally. Don't install vite separately. |
| dnd-kit | React 19 | Fully compatible as of 2025. |
| electron-store | Electron 30+ | Requires ESM support. Electron 40 is ESM-ready. |
| Tailwind CSS 4.2.1 | PostCSS 8+ | Use Vite plugin (@vitejs/plugin-react). Tailwind v4 has built-in Vite support. |

## Database Schema Management

Since you're using better-sqlite3 directly (no ORM):

**Schema Versioning:**
- Create `migrations/` folder with numbered SQL files (001_initial.sql, 002_add_story_metrics.sql)
- Store schema_version in a `meta` table
- Run migrations on app startup if schema_version < latest
- Use prepared statements for all queries
- Example: `db.prepare('INSERT INTO posts (brand_id, ...) VALUES (?, ...)').run(brandId, ...)`

**Why no ORM:**
- Learning system queries are simple (time-series aggregations, balance calculations)
- Prepared statements provide type safety via TypeScript interfaces
- No complex relations (single brand, denormalized for performance)
- Migration to PostgreSQL later is copy-paste SQL with minor syntax changes

## Security Considerations

**SQLite Encryption:**
- SQLCipher provides AES-256 encryption at rest
- **NOT recommended for v1** - Windows support is problematic, adds complexity
- Use OS-level encryption (BitLocker, FileVault) instead
- If needed later, use `@journeyapps/sqlcipher` (macOS only) or fork for Windows

**API Keys:**
- Store Claude API key using Electron's safeStorage module
- safeStorage.encryptString() uses OS keychain (Keychain on macOS, Credential Manager on Windows)
- NEVER store API keys in electron-store JSON (plain text)
- Load from safeStorage on startup, keep in memory

**IPC Security:**
- Follow 2026 standards: contextIsolation: true, nodeIntegration: false, sandbox: true
- Whitelist IPC channels in preload script
- Validate all data crossing IPC boundary
- See "Stack Patterns by Variant" section for details

## Sources

### HIGH Confidence (Official Docs + Recent Releases)
- [Electron Releases](https://releases.electronjs.org/) - Electron 40.8.0 version verification (March 5, 2026)
- [React Versions](https://react.dev/versions) - React 19.2.4 latest version
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3) - Version 12.6.2, compatibility notes
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) - Official SDK features
- [Puppeteer Releases](https://github.com/puppeteer/puppeteer/releases) - Version 24.38.0
- [Tailwind CSS Releases](https://github.com/tailwindlabs/tailwindcss/releases) - v4.2.1 verification
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/) - TypeScript 6.0 RC announcement
- [React Router Changelog](https://reactrouter.com/changelog) - v7.13.1 features

### MEDIUM Confidence (Verified Web Search)
- [electron-vite Official Docs](https://electron-vite.org/) - Build tool features
- [Electron IPC Best Practices](https://www.electronjs.org/docs/latest/tutorial/ipc) - Security patterns
- [electron-store GitHub](https://github.com/sindresorhus/electron-store) - Configuration persistence
- [dnd-kit Docs](https://docs.dndkit.com/) - Modern drag-and-drop for React
- [Zustand vs Redux 2026](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/) - State management comparison
- [BrowserWindow.capturePage Examples](https://www.geeksforgeeks.org/how-to-take-screenshots-in-electronjs/) - Native screenshot approach
- [SQLCipher Windows Issues](https://discuss.zetetic.net/t/unable-to-get-sqlcipher-working-with-electron-on-windows/3869) - Encryption limitations

### Context
This stack is optimized for single-brand Electron desktop app with AI text generation, HTML-to-PNG rendering, and local SQLite database. All versions verified as of March 10, 2026. Focus on simplicity, developer experience, and avoiding over-engineering for v1 scope.

---
*Stack research for: AI-powered Instagram content creation system (Electron desktop app)*
*Researched: 2026-03-10*
