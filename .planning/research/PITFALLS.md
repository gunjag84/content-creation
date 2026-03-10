# Pitfalls Research

**Domain:** AI-powered Instagram Content Creation System (Electron Desktop App)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Puppeteer Executable Path Breaks After Packaging

**What goes wrong:**
After packaging the Electron app with electron-builder, Puppeteer cannot find Chromium and fails silently or with "browser executable not found" errors. The app works perfectly in development but renders nothing in production.

**Why it happens:**
Puppeteer bundles Chromium at npm install time with paths relative to node_modules. When electron-builder packages the app into an ASAR archive or redistributable, these paths break. Puppeteer's default executablePath no longer resolves to the bundled Chromium.

**How to avoid:**
- Use `puppeteer.executablePath()` to get the bundled Chromium path dynamically rather than hardcoding
- Configure electron-builder to unpack Puppeteer from ASAR: `"asarUnpack": ["**/node_modules/puppeteer/**"]`
- For Electron specifically, use `puppeteer-in-electron` library which handles path resolution correctly
- Test production builds early in development, not just before release

**Warning signs:**
- Puppeteer.launch() hangs indefinitely or times out in packaged app
- "Could not find browser" errors in production logs
- Development works but packaged .exe fails on first render attempt
- No error thrown, just silent failure with empty output

**Phase to address:**
Phase 1 (Core Rendering Pipeline) - Must be validated with production build test before considering rendering complete.

---

### Pitfall 2: better-sqlite3 Native Module ABI Mismatch

**What goes wrong:**
The app crashes on startup with "NODE_MODULE_VERSION mismatch" errors after packaging. SQLite queries work in development but fail in production with cryptic native module errors.

**Why it happens:**
better-sqlite3 is a native Node module compiled for a specific Node.js version. Electron uses a different Node.js version than your development environment. Without rebuilding, the compiled binary targets the wrong ABI, causing runtime crashes.

**How to avoid:**
- Add `@electron/rebuild` as dev dependency
- Configure postinstall script: `"postinstall": "electron-rebuild"`
- In electron-builder config, set `"npmRebuild": true`
- Unpack better-sqlite3 from ASAR: `"asarUnpack": ["**/node_modules/better-sqlite3/**"]`
- Run rebuild manually before packaging: `npx electron-rebuild`
- Test with `NODE_ENV=production` set before packaging

**Warning signs:**
- App starts in dev, crashes immediately in production
- Error mentions "was compiled against a different Node.js version"
- SQLite operations throw "module not found" or "invalid module" errors
- Missing .node binary files in packaged app

**Phase to address:**
Phase 2 (Data Layer) - Database integration must include production build testing as acceptance criteria.

---

### Pitfall 3: HTML-to-Image Rendering Differs Across Environments

**What goes wrong:**
Images rendered on your development machine look perfect, but when users run the app on different machines, fonts render differently, text overflows zones, or layout breaks. What was pixel-perfect in testing becomes unusable in production.

**Why it happens:**
Headless Chrome rendering uses system fonts and font rendering varies by OS. Font hinting, kerning, and subpixel positioning differ between Windows, macOS, and Linux. Missing fonts fall back to system defaults with different metrics, breaking carefully designed layouts.

**How to avoid:**
- Launch Puppeteer with `--font-render-hinting=none` flag to disable OS-specific font hinting
- Bundle custom fonts and use `@font-face` in templates rather than relying on system fonts
- For critical brand fonts, include font files with the app and reference them absolutely
- Test rendering on all target OS platforms (Windows primarily, but also macOS if supporting)
- Use web-safe fallback fonts in CSS font stacks
- Add generous padding in text zones to accommodate font metric variations
- Consider installing common Windows fonts in Docker if running CI tests

**Warning signs:**
- Text overflows or truncates in zones that worked in dev
- Font spacing looks different on other machines
- Layout shifts between development and production
- CI-generated images differ from local renders
- User reports of "text cut off" or "wrong font"

**Phase to address:**
Phase 1 (Core Rendering Pipeline) - Font handling must be tested on clean Windows VM before considering Phase 1 complete.

---

### Pitfall 4: Race Conditions in JSON Settings File Writes

**What goes wrong:**
User changes multiple settings rapidly or the app auto-saves while user is editing, resulting in corrupted settings.json files. Settings revert unexpectedly or the app fails to load settings on restart, showing default values or throwing parsing errors.

**Why it happens:**
No file locking mechanism. Multiple parts of the app (settings UI, auto-save, backup system) can write to settings.json simultaneously. Node.js fs.writeFile doesn't guarantee atomic writes. The last write wins, potentially overwriting concurrent changes. If writes collide, the file can end up with partial JSON.

**How to avoid:**
- Implement write queue - all settings updates go through single queue with one writer
- Use atomic writes: write to temp file, then fs.rename (atomic on most filesystems)
- Add file locking with `proper-lockfile` npm package
- Implement optimistic locking: version number in settings, increment on write, reject if version mismatch
- Debounce rapid changes in UI before writing to disk
- Consider using SQLite for settings instead of JSON to get transaction safety
- Add JSON validation before writing to catch corruption early

**Warning signs:**
- Settings randomly revert to older values
- JSON parse errors on app startup
- "Settings were reset" complaints from users
- Truncated or empty settings.json files
- Two settings changed simultaneously, only one persists

**Phase to address:**
Phase 3 (Settings Management) - Must implement write queue or locking before settings editor goes to production.

---

### Pitfall 5: Main Process Blocking from Synchronous Puppeteer Operations

**What goes wrong:**
The entire app freezes when rendering images. User can't click anything, UI becomes unresponsive, sometimes for 5-10 seconds. The app appears crashed but eventually recovers. Users think the app is broken.

**Why it happens:**
Puppeteer runs in Electron's main process. Rendering operations are CPU-intensive. Using synchronous IPC or blocking the main thread during render waits freezes all renderer processes. Every window becomes unresponsive because the main process can't handle events.

**How to avoid:**
- Never use `ipcRenderer.sendSync()` for render operations - always use `ipcRenderer.invoke()` with async handlers
- Run Puppeteer operations in main process but return immediately, send results via IPC when done
- Show loading UI in renderer immediately, don't wait for IPC response
- Consider Worker Threads for CPU-intensive operations (though Puppeteer doesn't fully support this yet)
- Implement operation queue with progress callbacks via IPC
- Use `page.waitForTimeout()` sparingly, prefer `page.waitForSelector()`
- Set reasonable timeouts on Puppeteer operations (don't let them hang forever)

**Warning signs:**
- App freezes during "Generating image..." state
- White screen or "Not Responding" in task manager
- IPC timeouts in logs
- User reports of "app hung" or "had to force quit"
- DevTools shows main process blocked during operations

**Phase to address:**
Phase 1 (Core Rendering Pipeline) - Async IPC patterns must be established as architectural standard from the start.

---

### Pitfall 6: Memory Leaks from Unclosed Puppeteer Instances

**What goes wrong:**
The app starts fine but memory usage climbs continuously. After generating 20-30 images, the app becomes sluggish. Eventually it crashes with out-of-memory errors. Task manager shows RAM usage growing from 200MB to 2GB+.

**Why it happens:**
Each `browser.launch()` spawns a Chromium process. If `browser.close()` isn't called (especially in error paths), these processes accumulate. Event listeners attached to browser/page instances aren't cleaned up. Detached DOM elements in rendered pages aren't garbage collected. Long-running Electron apps with Puppeteer are particularly susceptible because the process never restarts.

**How to avoid:**
- Always use try/finally blocks: ensure `browser.close()` runs even on errors
- Reuse browser instances across renders rather than launching new ones each time
- Limit page pool size (max 1-2 pages open, close and recreate for each render)
- Call `browser.close()` not `browser.disconnect()` - disconnect leaves process handlers attached
- Implement browser instance timeout - close and recreate if idle > 5 minutes
- Monitor memory with `process.memoryUsage()`, log warnings if growth exceeds thresholds
- Consider restarting Electron main process periodically in long sessions (e.g., after 100 renders)
- Use Chrome DevTools memory profiler to detect leaks during development

**Warning signs:**
- RAM usage grows linearly with number of renders
- Multiple chromium.exe processes in task manager after renders complete
- App becomes slower over time in same session
- Garbage collection pauses increase
- "Out of memory" errors after extended use

**Phase to address:**
Phase 1 (Core Rendering Pipeline) - Proper lifecycle management is non-negotiable for production readiness.

---

### Pitfall 7: SQLite Database Corruption from Improper Shutdown

**What goes wrong:**
User closes app or system crashes while performance data is being written. On next startup, the database is corrupted. Queries fail, learning system breaks, or the app refuses to start. User loses all performance tracking history.

**Why it happens:**
SQLite writes aren't immediately flushed to disk by default. If the process terminates during a transaction, the database file can be left in an inconsistent state. Electron's "app.quit()" doesn't guarantee database writes complete. Windows force-kills processes that don't exit within timeout.

**How to avoid:**
- Enable WAL (Write-Ahead Logging) mode: `PRAGMA journal_mode=WAL` - significantly more crash-resistant
- Set `PRAGMA synchronous=NORMAL` (WAL mode) or `=FULL` (without WAL) for durability
- Implement graceful shutdown: listen to `app.on('before-quit')`, await database.close()
- Use transactions properly: BEGIN, COMMIT, ROLLBACK - never leave transactions open
- Run `PRAGMA integrity_check` on startup, attempt recovery if corruption detected
- Implement automatic backup: copy database file daily to .backup location
- Consider using better-sqlite3's `backup()` API for safe online backups
- Test crash scenarios: kill process during write, ensure DB recovers

**Warning signs:**
- "database disk image is malformed" errors
- "SQLITE_CORRUPT" error codes
- Queries suddenly fail after app restart
- Database file size is 0 bytes or unexpectedly small
- Missing recent performance data after crash

**Phase to address:**
Phase 2 (Data Layer) - WAL mode and integrity checks must be part of database initialization.

---

### Pitfall 8: Claude API Token Stored Insecurely

**What goes wrong:**
User's Claude API token is stored in plain text in settings.json or localStorage. Anyone with file system access can steal the token. If user shares settings file for troubleshooting, they expose their API key. Malware can scrape tokens easily.

**Why it happens:**
Electron apps have full file system access. Storing secrets in JSON files seems convenient. Developers forget that desktop apps aren't like web apps - users can inspect all files. No server-side protection. Users may not realize settings files contain sensitive data.

**How to avoid:**
- Use Electron's `safeStorage` API to encrypt tokens at rest
- On Windows, uses DPAPI (protects from other users but not other apps in same userspace)
- On macOS, uses Keychain (better isolation)
- On Linux, uses secret stores (kwallet, gnome-libsecret)
- Never log API tokens, even in development
- Validate token format before storing (starts with "sk-")
- Implement token rotation prompt if stored token fails auth
- Consider time-limited tokens if Claude API supports them
- Warn users: "This token grants full API access - keep it secret"
- Mask token in UI: show "sk-ant-***...***xyz" not full token

**Warning signs:**
- API tokens visible in settings.json plaintext
- Tokens found in logs or error messages
- No encryption indicator when storing sensitive data
- User reports of "someone used my API quota"
- Settings files shared publicly with tokens

**Phase to address:**
Phase 3 (Settings Management) - Security implementation must happen before first user testing.

---

### Pitfall 9: Complex Form State Causes Re-render Storms

**What goes wrong:**
Settings editor with 11 configuration areas becomes sluggish. Typing in one field causes 500ms lag. Changing a theme setting triggers full re-render of unrelated sections. App feels janky and unusable for complex settings.

**Why it happens:**
All settings stored in single React state object. Every keystroke triggers re-render of entire form tree. Context API used for settings causes all consumers to re-render on any change. Uncontrolled inputs would help but form library assumes controlled. Deep object updates cause reference changes, triggering unnecessary renders.

**How to avoid:**
- Split settings into multiple state slices - one per configuration area
- Use form library with field-level subscriptions (React Hook Form watch specific fields)
- For large forms, use uncontrolled inputs with refs, only sync on blur or submit
- Debounce rapid changes before updating state (especially for text inputs)
- Memoize expensive sections with `React.memo()` and stable props
- Use `useReducer` for complex state updates instead of multiple `useState`
- Consider Zustand or Jotai for granular state subscriptions
- Validate settings with Zod schema at form submission, not on every keystroke
- Profile with React DevTools - identify which components re-render unnecessarily

**Warning signs:**
- Input lag when typing in settings fields
- Multiple sections flash/re-render when changing one field
- React DevTools Profiler shows cascading renders
- CPU usage spikes during form interaction
- "Why is this form so slow?" from users

**Phase to address:**
Phase 3 (Settings Management) - Performance optimization must be validated with full settings form before shipping.

---

### Pitfall 10: DevTools Disabled in Production, Debugging Impossible

**What goes wrong:**
User reports "image rendering broken" but you can't reproduce it. Production builds have DevTools disabled for security. No way to inspect rendered HTML, check console logs, or debug IPC messages. Issues become impossible to diagnose remotely.

**Why it happens:**
Production electron-builder configs often set `webPreferences.devTools: false` for security. Makes sense for commercial apps, but eliminates primary debugging tool. Electron's sandboxing further restricts access. Production logs aren't captured by default. Users can't send useful error reports.

**How to avoid:**
- Implement comprehensive file logging with winston or electron-log
- Log to app data directory (not console): `app.getPath('userData')/logs/`
- Include log level, timestamp, process (main/renderer), and context in every log
- Capture unhandled errors: `process.on('uncaughtException')` and `window.onerror`
- Log IPC messages at debug level for troubleshooting
- Add "Export Logs" button in app that zips logs for user to share
- Enable remote debugging in production with flag: `--remote-debugging-port=9222` (document for support)
- Use `ELECTRON_ENABLE_LOGGING=1` environment variable for Chromium logs
- Consider Sentry or similar for automatic error reporting
- For beta testers, ship with DevTools enabled via hidden shortcut (Ctrl+Shift+I override)

**Warning signs:**
- "Can't reproduce" becomes common response to bug reports
- Users say "it just doesn't work" with no details
- Production errors have no stack traces
- No visibility into what failed during render
- Support tickets lack diagnostic information

**Phase to address:**
Phase 4 (Production Readiness) - Logging infrastructure must exist before any external testing.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Puppeteer production build testing | Faster iteration in development | Critical render failures in production, emergency hotfixes | Never - production build test takes 10 minutes |
| Store all settings in single JSON object | Simple to implement | Concurrent write corruption, no migration path, race conditions | Only for MVP, must refactor before v1.0 |
| Use synchronous IPC for simplicity | Less async/await boilerplate | Entire app freezes during operations, terrible UX | Never in production code |
| Skip WAL mode for SQLite | Default works in dev | Database corruption on crash, user data loss | Never - one-line config change prevents disasters |
| Launch new browser for every render | No state management complexity | Memory leaks, performance degradation, eventually crashes | Only for prototype/demo, not scalable |
| Store API token in plaintext | Easy to implement | Security vulnerability, token theft, user trust loss | Never - use safeStorage from day one |
| Single React state for complex form | Quick to build | Performance issues, re-render storms, laggy UI | Only for simple forms (< 5 fields), not 11 config areas |
| Hardcode Chromium executable path | Works on dev machine | Breaks in production on all other machines | Never - use puppeteer.executablePath() |
| Skip font bundling, use system fonts | Smaller app size | Inconsistent rendering across machines, layout breaks | Only if pixel-perfect rendering isn't required |
| Ignore memory monitoring | No immediate problem | Gradual memory leaks go unnoticed until crash | Never for long-running apps |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude API | Storing token in renderer process localStorage | Store in main process using safeStorage, expose via IPC |
| Puppeteer + Electron | Launching with puppeteer.launch() defaults | Use puppeteer-in-electron or configure executablePath explicitly for Electron |
| SQLite in Electron | Using regular node-sqlite3 without rebuild | Use better-sqlite3 with @electron/rebuild and asarUnpack config |
| IPC for rendering | Using sendSync() because it's simpler | Always use invoke()/handle() pattern, never block main process |
| HTML templates | Referencing external URLs for fonts/images | Bundle all assets with app, use local file:// URLs or data URIs |
| Instagram export | Exporting as JPEG with default compression | Export PNG or high-quality JPEG (85-95%) at exact 1080px width to avoid double compression |
| Settings persistence | Writing JSON on every form field change | Debounce writes (500ms), queue writes, or write only on blur/save |
| Error handling | Assuming Puppeteer operations always succeed | Wrap all Puppeteer calls in try/catch, implement timeout, provide user feedback |
| Performance tracking | Storing all metrics in memory | Use SQLite with proper indexes, paginate queries, aggregate old data |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No browser instance pooling | Each render gets slower, memory grows | Reuse single browser instance across renders, recreate periodically | After 20-30 renders in single session |
| Logging everything to file without rotation | App directory grows to GB size, I/O slowdown | Implement log rotation (daily or size-based), keep last 7 days | After weeks of use with debug logging |
| Loading entire learning history on startup | Slow startup as data grows | Paginate queries, load recent data first, lazy load history | After 500+ performance records |
| No IPC message size limits | Large payloads freeze UI during serialization | Stream large data, chunk messages, or write to temp file and share path | When passing >10MB template images via IPC |
| Generating all recommendations at once | UI freezes while calculating | Generate on-demand, cache results, compute in background | With 20+ themes and 7 mechanics (140 combinations) |
| No indexes on SQLite performance table | Queries slow as data grows | Add indexes on brand_id, post_id, created_at columns | After 1000+ performance records |
| Keeping all Puppeteer pages open | Memory grows, browser becomes slow | Close pages after render, limit to 1-2 pages max | After 10 concurrent renders |
| Re-bundling fonts on every render | Slow render times | Cache font buffers, load once at startup | Not a breaking issue but wastes time |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing nodeIntegration in renderer | Remote code execution if XSS exists | Always use contextIsolation: true and nodeIntegration: false |
| Storing Claude API token in renderer | Token theft via XSS or file system access | Store in main process only, use safeStorage, expose via IPC with validation |
| Not validating IPC messages | Malicious renderer could corrupt database | Validate all IPC payloads with Zod schemas in main process handlers |
| Allowing arbitrary file paths from renderer | Renderer could read/write any file | Whitelist allowed directories, sanitize paths, use app.getPath() constants |
| Not sanitizing user input in SQL queries | SQL injection in performance tracking | Use parameterized queries exclusively, never string concatenation |
| Bundling secrets in source code | API keys exposed in distributed app | Never bundle secrets, require user to provide their own Claude API token |
| Allowing remote content in templates | XSS in Puppeteer renders | Sanitize HTML templates, use Content Security Policy in Puppeteer page |
| No rate limiting on Claude API calls | Token theft leads to huge bills | Implement rate limits, usage caps, warn user at thresholds |
| Storing unencrypted backups | Backup files contain plaintext tokens | Encrypt backups if they include settings with tokens |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indicator during render | User thinks app is frozen, force quits | Show spinner, progress percentage, "Generating image..." message |
| Failing silently on render errors | User sees nothing, assumes it worked, posts broken content | Show clear error message, suggest fixes, log details for support |
| No preview before finalizing | User generates, exports, uploads, then sees problem | Always show preview with "Looks good?" confirmation before export |
| Auto-saving settings immediately | User experiments, accidentally saves bad config | Manual "Save" button with "Unsaved changes" indicator |
| No undo/redo for visual editor | User accidentally drags zone wrong, starts over | Implement command history for template editing |
| Losing work on crash | App crashes, unsaved post content lost | Auto-save draft to SQLite every 30 seconds, recover on restart |
| No feedback during long operations | 10-second render feels like crash | Show "Rendering... 3s" timer or progress indication |
| Requiring exact dimensions for images | User's image is 1920x1080, app rejects it | Auto-scale/crop uploaded images to required dimensions |
| Cryptic error messages | "SQLITE_ERROR" means nothing to user | Translate technical errors to user-friendly language with fixes |
| No onboarding for first launch | User sees empty screen, doesn't know where to start | First-run wizard: set up brand voice, create first template, generate post |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Puppeteer rendering:** Often missing production build test - verify works in packaged .exe on clean Windows machine
- [ ] **SQLite integration:** Often missing WAL mode and integrity checks - verify PRAGMA settings and startup validation
- [ ] **Settings management:** Often missing write locking - verify concurrent writes don't corrupt JSON
- [ ] **IPC handlers:** Often missing error handling - verify try/catch blocks and timeout handling in all handlers
- [ ] **API integration:** Often missing rate limiting - verify requests per minute caps and usage warnings
- [ ] **Image export:** Often missing compression optimization - verify output PNGs are under 10MB and quality validated
- [ ] **Template editor:** Often missing undo/redo - verify command history works for all edit operations
- [ ] **Performance tracking:** Often missing database indexes - verify query performance with 1000+ records
- [ ] **Error states:** Often missing user-friendly messages - verify all error paths show actionable guidance
- [ ] **Memory management:** Often missing browser instance cleanup - verify no chromium.exe processes leak after 50 renders
- [ ] **Security:** Often missing token encryption - verify safeStorage used, not plaintext JSON
- [ ] **Logging:** Often missing log rotation - verify logs don't grow unbounded over weeks

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Puppeteer breaks in production | HIGH | 1. Add debug logging to identify missing executable path 2. Reconfigure electron-builder asarUnpack 3. Test with puppeteer-in-electron 4. Rebuild and redistribute |
| better-sqlite3 ABI mismatch | MEDIUM | 1. Add electron-rebuild to postinstall 2. Configure npmRebuild in builder 3. Rebuild app 4. Redistribute to users |
| Corrupted SQLite database | MEDIUM | 1. Run .recover command on backup 2. Export data to SQL 3. Create new database 4. Import recovered data 5. Restore to user or provide repair tool |
| Settings JSON corrupted | LOW | 1. Parse JSON, catch error 2. Load .backup copy if exists 3. If no backup, reset to defaults 4. Notify user of recovery action |
| Memory leak from browser instances | LOW | 1. Implement app restart mechanism 2. Prompt user to restart after N renders 3. Add browser instance timeout 4. Deploy update with proper cleanup |
| Token stored insecurely | MEDIUM | 1. Migrate to safeStorage on next launch 2. Delete old plaintext file 3. Warn users to rotate token if shared 4. Deploy update urgently |
| Form performance issues | MEDIUM | 1. Profile with React DevTools 2. Split state into sections 3. Add React.memo to heavy components 4. Implement field-level subscriptions 5. Deploy update |
| Cross-platform rendering inconsistency | HIGH | 1. Add font-render-hinting=none 2. Bundle fonts with app 3. Test on all platforms 4. Adjust zone padding 5. Redistribute app with fonts |
| No logs for debugging | LOW | 1. Add winston or electron-log 2. Capture uncaught errors 3. Add "Export Logs" feature 4. Deploy update with logging |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Puppeteer executable path breaks | Phase 1: Core Rendering | Test packaged .exe on clean Windows VM, renders PNG successfully |
| better-sqlite3 ABI mismatch | Phase 2: Data Layer | Run packaged app, perform SQLite operations, no crashes |
| HTML rendering inconsistency | Phase 1: Core Rendering | Render same template on Windows/Mac, compare pixel output, < 5% diff |
| JSON settings race conditions | Phase 3: Settings Management | Write settings concurrently (simulate), verify no corruption |
| Main process blocking | Phase 1: Core Rendering | Monitor main process during render, UI remains responsive |
| Puppeteer memory leaks | Phase 1: Core Rendering | Generate 50 images in session, memory stable (no unbounded growth) |
| SQLite corruption on crash | Phase 2: Data Layer | Kill process mid-write, restart, database integrity check passes |
| API token insecurity | Phase 3: Settings Management | Inspect settings file, token encrypted, not plaintext |
| Form re-render storms | Phase 3: Settings Management | Type in settings form, < 100ms lag, profile shows minimal re-renders |
| No production debugging | Phase 4: Production Readiness | Trigger error in packaged app, logs captured with stack trace |

## Sources

- [Integrating Puppeteer with Electron: Compatibility Issues](https://community.latenode.com/t/integrating-puppeteer-with-electron-compatibility-issues/13575)
- [Puppeteer in Node.js: Common Mistakes to Avoid](https://blog.appsignal.com/2023/02/08/puppeteer-in-nodejs-common-mistakes-to-avoid.html)
- [Electron Application Distribution](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [A Complete Guide to Packaging Your Electron App](https://medium.com/how-to-electron/a-complete-guide-to-packaging-your-electron-app-1bdc717d739f)
- [SQLite Database Corruption: Practical Examples and Prevention](https://runebook.dev/en/articles/sqlite/howtocorrupt)
- [Is anybody else seeing SQLITE_CORRUPT errors with Electron?](https://discuss.zetetic.net/t/is-anybody-else-seeing-sqlite-corrupt-errors-with-electron/3578)
- [Running Headless Chrome at Scale: Production Lessons](https://dev.to/max_kurz/running-headless-chrome-at-scale-production-lessons-from-millions-of-renders-djg)
- [How to Avoid Instagram Compression](https://instasize.com/learn/how-to-avoid-instagram-compression)
- [Electron safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage)
- [How to securely store sensitive information in Electron](https://cameronnokes.com/blog/how-to-securely-store-sensitive-information-in-electron-with-node-keytar/)
- [Form State Management in React: From Messy to Elegant](https://medium.com/@gecno/form-state-management-in-react-from-messy-to-elegant-e0bc6859c269)
- [State Management in React (2026): Best Practices](https://www.c-sharpcorner.com/article/state-management-in-react-2026-best-practices-tools-real-world-patterns/)
- [Electron Performance Guide](https://www.electronjs.org/docs/latest/tutorial/performance)
- [The Horror of Blocking Electron's Main Process](https://medium.com/actualbudget/the-horror-of-blocking-electrons-main-process-351bf11a763c)
- [A Step-by-Step Guide to Integrating Better-SQLite3 with Electron](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16)
- [Fixing 'node-gyp' Rebuild Errors with Better-SQLite3 in Electron](https://coldfusion-example.blogspot.com/2026/01/fixing-node-gyp-rebuild-errors-with.html)
- [Achieve consistent font rendering between different platforms](https://github.com/puppeteer/puppeteer/issues/661)
- [How to fix Puppeteer font issues](https://www.browserless.io/blog/puppeteer-print)
- [Handling JSON Merge Conflicts in Concurrent Updates](https://medium.com/@AlexanderObregon/handling-json-merge-conflicts-in-concurrent-updates-276d1bdc4a82)
- [How to Prevent Data Loss in Node.js Apps with Cron Jobs and API Calls](https://dev.to/yasir_rafique_27550feb631/when-code-collides-how-to-prevent-data-loss-in-nodejs-apps-with-cron-jobs-and-api-calls-2l3n)
- [Diagnosing and Fixing Memory Leaks in Electron Applications](https://www.mindfulchase.com/explore/troubleshooting-tips/frameworks-and-libraries/diagnosing-and-fixing-memory-leaks-in-electron-applications.html)
- [How to simply workaround RAM-leaking libraries like Puppeteer](https://devforth.io/blog/how-to-simply-workaround-ram-leaking-libraries-like-puppeteer-universal-way-to-fix-ram-leaks-once-and-forever/)
- [How to Debug Electron Production Binaries](https://www.codegenes.net/blog/how-to-debug-electron-production-binaries/)
- [Electron Application Debugging](https://www.electronjs.org/docs/latest/tutorial/application-debugging)

---
*Pitfalls research for: AI-powered Instagram Content Creation System*
*Researched: 2026-03-10*
