# Phase 3: Content Generation - Research

**Researched:** 2026-03-13
**Domain:** AI content generation, React state management, Electron IPC streaming
**Confidence:** HIGH

## Summary

Phase 3 implements an end-to-end content workflow from AI recommendation to PNG export. The phase has clear user decisions from CONTEXT.md that constrain the research scope: full-page wizard with 5 steps, streaming token-by-token generation, two-panel editing UI, and native folder picker for export. The technical stack is well-established: Anthropic Claude API with `@anthropic-ai/sdk`, Zustand for wizard state, React patterns for multi-step forms, and Electron's native dialog for file operations.

Research confirms that the chosen patterns are current best practices for 2026. The Anthropic SDK provides robust streaming with automatic message accumulation, Electron's IPC supports real-time updates from main to renderer, and Zustand is the recommended solution for client state management in modern React apps. The learning system requires a custom rotation algorithm (round-robin for cold start, performance-weighted after data accumulates).

**Primary recommendation:** Install `@anthropic-ai/sdk`, create IPC streaming bridge from main to renderer using `win.webContents.send()`, implement wizard state with Zustand, use standard `<textarea>` for text editing (avoid contenteditable complexity), and build recommendation engine as SQLite query + JavaScript weighting logic.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Workflow navigation:**
- Full-page wizard replaces content area when in create mode
- 5 steps: (1) Recommendation & Selection, (2) Generation, (3) Edit Text, (4) Render & Review, (5) Stories
- Step indicator at top showing current position
- Step 1: Recommendation displayed as highlighted card with override dropdowns
- Explicit "Generate Content" button to advance from Step 1 to Step 2
- Impulse field (free-text) on Step 1 below theme/mechanic selections
- After export: return to dashboard + success toast

**AI generation UX:**
- Streaming token-by-token (text appears word-by-word like Claude.ai)
- Collapsible "View prompt" section on generation step (collapsed by default)
- New draft request overwrites existing content (no version history)
- Alternative hooks: shows 3 options in list, user picks one to replace current hook

**Text editing model:**
- Two-panel layout: text fields (left), live HTML preview (right)
- Left panel: each slide's fields (hook, body, CTA) as editable textareas
- Right panel: live HTML preview using template HTML/CSS rendered in browser
- Final Puppeteer PNG render happens separately on Step 4
- Carousel slide navigation: thumbnail strip above preview (numbered, with type label)
- Caption editing: "Slides" tab and "Caption" tab below text panel

**Render & review (Step 4):**
- User clicks "Render & Preview" button to trigger Puppeteer renders
- Progress indicator shows each slide completing
- Per-slide overlay opacity adjustment triggers re-render of that slide

**Export flow:**
- Native folder picker dialog (Electron's native file dialog)
- All files land in chosen folder as flat list (no subfolders)
- File naming: date + theme slug pattern (e.g., `2026-03-11_coaching-transformation_slide-01.png`)

**Story workflow (Step 5):**
- Story proposals appear after feed post export as Step 5 in same wizard session
- System generates 2-4 story proposals linked to feed post
- User reviews/edits/approves each story
- Story PNGs exported alongside feed PNGs (same naming, same folder)

**Learning system display:**
- Dashboard widget: compact balance overview (pillar %, mechanic usage count, theme coverage) as horizontal bar charts
- Cold start state: "No posts yet - start creating to see balance insights"
- Soft-signal warnings: subtle inline badge/tooltip on affected dropdown field on Step 1
- Warnings are suggestions, not blockers

### Claude's Discretion

**Manual mode trigger mechanism:** Toggle, button, or link on Step 1 - choose what feels most natural

**Draft/in-progress state:**
- Posts saved as 'draft' in DB as they're built through wizard
- Schema supports status ('draft' | 'approved' | 'exported')
- Whether unfinished drafts are resumable from dashboard is your call

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POST-01 | System recommends pillar/theme/mechanic based on rotation balance | Round-robin algorithm (cold start) + SQLite balance_matrix queries |
| POST-02 | User can accept or override recommendation | React state + Zustand for dropdown selections |
| POST-03 | User can choose single post or carousel | State variable + conditional rendering |
| POST-04 | User can upload custom background image | Electron dialog.showOpenDialog + file path storage |
| POST-05 | User can provide free-text impulse | Controlled textarea component |
| POST-06 | System generates via Claude API with master prompt | @anthropic-ai/sdk streaming API + prompt assembly from settings |
| POST-07 | Manual mode without AI generation | Conditional rendering + empty text zones |
| POST-08 | User can edit slide texts inline | Controlled textarea components with auto-save |
| POST-09 | User can request alternative hooks | Claude API streaming (same as POST-06, different prompt) |
| POST-10 | User can edit caption independently | Separate tab + textarea with different max chars |
| POST-11 | User can reorder carousel slides | React drag-and-drop library (react-dnd or dnd-kit) |
| POST-12 | User can request completely new draft | Reset state + trigger new Claude API call |
| POST-13 | System renders PNGs after text approval | RenderService IPC call (already exists from Phase 1) |
| POST-14 | User sees PNG preview with caption | Display base64 data URLs from RenderService |
| POST-15 | User can adjust per-slide overlay opacity | Slider component + re-render trigger |
| POST-16 | User can approve and export PNGs + caption | Electron dialog.showSaveDialog + fs.writeFile |
| POST-17 | Last carousel slide applies standard CTA | Template logic in render service |
| STORY-01 | System generates 2-4 story proposals | Claude API call with feed post context |
| STORY-02 | Story content inherits from feed post | Pass feed post data to story generation prompt |
| STORY-03 | System assigns story type per story | Claude API returns structured data (story_type field) |
| STORY-04 | System recommends interactive tool | Claude API + story_tools catalog from settings |
| STORY-05 | System generates concrete tool text | Claude API generates poll/quiz content |
| STORY-06 | System generates story image | RenderService with story template or reformatted feed slide |
| STORY-07 | System recommends timing | Claude API returns 'before' or 'after' |
| STORY-08 | User can approve/reject/edit stories | React state + conditional rendering |
| STORY-09 | System renders story PNGs at 1080x1920 | RenderService with story dimensions |
| STORY-10 | User can export story PNGs | Same export flow as POST-16 |
| LEARN-01 | System tracks balance matrix across variables | SQLite balance_matrix table + updateBalanceMatrix() |
| LEARN-02 | System calculates performance-per-variable | Aggregate queries on post_performance table |
| LEARN-03 | System generates soft-signal warnings | JavaScript logic: if usage_count > threshold in timeframe |
| LEARN-04 | Recommendations use equal rotation (cold start) then data-driven | Round-robin when avg_performance is null, weighted when populated |
| LEARN-05 | Ad-hoc posts flagged and excluded from theme balance | Filter WHERE ad_hoc = 0 in theme queries |
| LEARN-06 | Pillar balance tracks actual vs. target percentage | Compare pillar distribution to content_pillars.percentages from settings |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | Latest (install) | Claude API client with streaming | Official SDK from Anthropic, TypeScript support, automatic retries, streaming helpers |
| `zustand` | 5.0.11 (installed) | Wizard state management | Recommended for client state in 2026, simpler than Redux, already used in settings |
| `react-hook-form` | Not yet installed | Form state + validation | Industry standard for React forms, integrates with Zod (already installed) |
| `better-sqlite3` | 12.6.2 (installed) | Balance matrix queries | Already used for database, synchronous queries for recommendation algorithm |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Latest (install) | Drag-and-drop for slide reordering | POST-11 requirement, modern alternative to react-dnd, better touch support |
| `lucide-react` | 0.577.0 (installed) | Icons for wizard steps, warnings | Already installed, consistent icon set |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` | Direct fetch() to API | SDK provides automatic retries, streaming helpers, TypeScript types - no reason to avoid |
| `zustand` | Redux Toolkit | Redux is overkill for wizard state, Zustand already established in project |
| Standard `<textarea>` | `contenteditable` div | contenteditable offers rich text but conflicts with React's virtual DOM, adds complexity |
| `@dnd-kit` | `react-dnd` | dnd-kit has better touch support, smaller bundle, more modern API |

**Installation:**
```bash
npm install @anthropic-ai/sdk @dnd-kit/core @dnd-kit/sortable react-hook-form
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── main/
│   ├── ipc/
│   │   ├── generation.ts       # Claude API streaming handlers
│   │   ├── posts.ts            # Post CRUD operations
│   │   ├── balance.ts          # Learning system queries
│   │   └── export.ts           # File export operations
│   └── services/
│       ├── prompt-assembler.ts # Builds master prompt from settings
│       └── recommendation.ts   # Balance-based recommendation engine
├── renderer/src/
│   ├── pages/
│   │   └── CreatePost.tsx      # Main wizard container
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── Step1Recommendation.tsx
│   │   │   ├── Step2Generation.tsx
│   │   │   ├── Step3EditText.tsx
│   │   │   ├── Step4RenderReview.tsx
│   │   │   └── Step5Stories.tsx
│   │   ├── SlideEditor.tsx      # Two-panel text + preview
│   │   ├── LivePreview.tsx      # HTML preview using template
│   │   └── BalanceWidget.tsx    # Dashboard balance overview
│   └── stores/
│       └── useCreatePostStore.ts # Zustand wizard state
└── shared/
    └── types/
        └── generation.ts        # Shared types for API responses
```

### Pattern 1: Claude API Streaming in Main Process

**What:** Call Claude API from main process, stream tokens to renderer via IPC
**When to use:** All AI generation (POST-06, POST-09, POST-12, STORY-01)

**Example:**
```typescript
// src/main/ipc/generation.ts
import Anthropic from '@anthropic-ai/sdk';
import { ipcMain, BrowserWindow } from 'electron';

ipcMain.handle('generate:stream-content', async (event, prompt: string) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY // From security-service
  });

  const win = BrowserWindow.fromWebContents(event.sender);

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  stream.on('text', (text) => {
    win?.webContents.send('generate:token', text);
  });

  try {
    const message = await stream.finalMessage();
    win?.webContents.send('generate:complete', message);
    return { success: true };
  } catch (err) {
    win?.webContents.send('generate:error', err.message);
    return { success: false, error: err.message };
  }
});
```

**Renderer side:**
```typescript
// src/renderer/src/pages/CreatePost.tsx
useEffect(() => {
  window.api.generation.onToken((token: string) => {
    setGeneratedText(prev => prev + token);
  });

  window.api.generation.onComplete((message) => {
    // Save to state, advance to next step
  });

  window.api.generation.onError((error) => {
    // Show error toast
  });
}, []);
```

**Source:** [Anthropic TypeScript SDK streaming documentation](https://platform.claude.com/docs/en/api/messages-streaming)

### Pattern 2: Multi-Step Wizard State with Zustand

**What:** Single store tracks current step, form data, draft status
**When to use:** Wizard navigation, draft persistence

**Example:**
```typescript
// src/renderer/src/stores/useCreatePostStore.ts
import { create } from 'zustand';

interface CreatePostState {
  // Wizard state
  currentStep: 1 | 2 | 3 | 4 | 5;

  // Step 1 data
  recommendedPillar: string;
  recommendedTheme: string;
  recommendedMechanic: string;
  selectedPillar: string;
  selectedTheme: string;
  selectedMechanic: string;
  contentType: 'single' | 'carousel';
  impulse: string;

  // Step 2/3 data
  generatedSlides: Slide[];
  caption: string;

  // Step 4 data
  renderedPNGs: string[]; // base64 data URLs

  // Step 5 data
  storyProposals: Story[];

  // Actions
  setStep: (step: number) => void;
  updateSlide: (index: number, field: string, value: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
  currentStep: 1,
  // ... initial state

  setStep: (step) => set({ currentStep: step as 1 | 2 | 3 | 4 | 5 }),

  updateSlide: (index, field, value) => set((state) => ({
    generatedSlides: state.generatedSlides.map((slide, i) =>
      i === index ? { ...slide, [field]: value } : slide
    )
  })),

  reorderSlides: (fromIndex, toIndex) => set((state) => {
    const slides = [...state.generatedSlides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    return { generatedSlides: slides };
  }),

  reset: () => set({
    currentStep: 1,
    generatedSlides: [],
    caption: '',
    // ... reset all fields
  })
}));
```

**Source:** [The State of React State Management in 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026) - Zustand recommended for client state

### Pattern 3: Recommendation Algorithm (Round-Robin → Weighted)

**What:** Cold start uses round-robin rotation, then shifts to performance-weighted selection
**When to use:** POST-01, LEARN-04

**Example:**
```typescript
// src/main/services/recommendation.ts
import { getDatabase } from '../db';
import { getBalanceMatrix } from '../db/queries';

export function recommendContent(brandId: number) {
  const db = getDatabase();
  const balanceData = getBalanceMatrix(brandId);

  // Check if we have performance data
  const hasPerformanceData = balanceData.some(entry => entry.avg_performance !== null);

  if (!hasPerformanceData) {
    // Cold start: equal rotation (round-robin)
    return roundRobinRecommendation(brandId, balanceData);
  } else {
    // Warm start: weighted by performance
    return weightedRecommendation(brandId, balanceData);
  }
}

function roundRobinRecommendation(brandId: number, balanceData) {
  // Find least-used options per variable type
  const pillarCounts = balanceData.filter(e => e.variable_type === 'pillar');
  const themeCounts = balanceData.filter(e => e.variable_type === 'theme');
  const mechanicCounts = balanceData.filter(e => e.variable_type === 'mechanic');

  const leastUsedPillar = pillarCounts.sort((a, b) => a.usage_count - b.usage_count)[0];
  const leastUsedTheme = themeCounts.sort((a, b) => a.usage_count - b.usage_count)[0];
  const leastUsedMechanic = mechanicCounts.sort((a, b) => a.usage_count - b.usage_count)[0];

  return {
    pillar: leastUsedPillar?.variable_value || 'Generate Demand',
    theme: leastUsedTheme?.variable_value || 'Default Theme',
    mechanic: leastUsedMechanic?.variable_value || 'Hook Mechanic'
  };
}

function weightedRecommendation(brandId: number, balanceData) {
  // Weight by avg_performance, normalize to probabilities
  const pillarData = balanceData.filter(e => e.variable_type === 'pillar' && e.avg_performance);
  const themeData = balanceData.filter(e => e.variable_type === 'theme' && e.avg_performance);
  const mechanicData = balanceData.filter(e => e.variable_type === 'mechanic' && e.avg_performance);

  const selectWeighted = (items) => {
    const totalScore = items.reduce((sum, item) => sum + item.avg_performance, 0);
    const random = Math.random() * totalScore;
    let accumulated = 0;
    for (const item of items) {
      accumulated += item.avg_performance;
      if (random <= accumulated) return item.variable_value;
    }
    return items[0]?.variable_value;
  };

  return {
    pillar: selectWeighted(pillarData),
    theme: selectWeighted(themeData),
    mechanic: selectWeighted(mechanicData)
  };
}
```

**Source:** Round-robin pattern from [Load Balancing Algorithms](https://kemptechnologies.com/load-balancer/load-balancing-algorithms-techniques), weighted selection is standard probabilistic sampling

### Pattern 4: Prompt Assembly from Settings

**What:** Build master prompt by concatenating all active config areas
**When to use:** POST-06 (main generation), STORY-01 (story generation)

**Example:**
```typescript
// src/main/services/prompt-assembler.ts
import { loadSettings } from './settings-service';

export function assembleMasterPrompt(
  pillar: string,
  theme: string,
  mechanic: string,
  impulse?: string
): string {
  const settings = loadSettings();

  const sections = [
    '# Instagram Carousel Content Generation',
    '',
    '## Brand Voice',
    settings.brand_voice.tonality,
    `Do: ${settings.brand_voice.dos.join(', ')}`,
    `Don't: ${settings.brand_voice.donts.join(', ')}`,
    settings.brand_voice.voice_profile,
    '',
    '## Target Persona',
    `Demographics: ${settings.target_persona.demographics}`,
    `Pain points: ${settings.target_persona.pain_points.join(', ')}`,
    `Goals: ${settings.target_persona.goals.join(', ')}`,
    '',
    '## Content Pillar',
    `Pillar: ${pillar}`,
    `Theme: ${theme}`,
    '',
    '## Mechanic',
    getMechanicRules(settings.post_mechanics, mechanic),
    '',
    '## Content Defaults',
    `Slides: ${settings.content_defaults.carousel_slides_min}-${settings.content_defaults.carousel_slides_max}`,
    `Caption max: ${settings.content_defaults.caption_max_chars} characters`,
    `Hashtags: ${settings.content_defaults.hashtags_min}-${settings.content_defaults.hashtags_max}`,
    ''
  ];

  // Optional sections
  if (settings.competitor_analysis?.trim()) {
    sections.push('## Differentiation', settings.competitor_analysis, '');
  }

  if (settings.viral_post_expertise?.trim()) {
    sections.push('## Viral Mechanics', settings.viral_post_expertise, '');
  }

  if (impulse?.trim()) {
    sections.push('## Additional Guidance', impulse, '');
  }

  // User-editable master template (SET-11)
  sections.push(settings.master_prompt_template);

  return sections.join('\n');
}

function getMechanicRules(mechanics, mechanicName) {
  const mechanic = mechanics.find(m => m.name === mechanicName && m.active);
  if (!mechanic) return '';

  return `
Mechanic: ${mechanic.name}
Hook rules: ${mechanic.hook_rules}
Slide range: ${mechanic.slide_range_min}-${mechanic.slide_range_max}
Structure: ${mechanic.structure_guidelines}
  `.trim();
}
```

**Source:** Settings structure from existing `settings-service.ts` (Phase 2)

### Pattern 5: Electron Native File Export

**What:** Use `dialog.showSaveDialog` for folder picker, `fs.writeFile` for PNGs and caption
**When to use:** POST-16, STORY-10

**Example:**
```typescript
// src/main/ipc/export.ts
import { dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

ipcMain.handle('export:select-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled) return { canceled: true };
  return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle('export:save-files', async (event, data: {
  folderPath: string,
  files: { name: string, content: string }[] // base64 PNGs or text
}) => {
  try {
    for (const file of data.files) {
      const filePath = path.join(data.folderPath, file.name);

      if (file.name.endsWith('.png')) {
        // Decode base64 to buffer
        const base64Data = file.content.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filePath, buffer);
      } else if (file.name.endsWith('.txt')) {
        await fs.writeFile(filePath, file.content, 'utf-8');
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
```

**Source:** [Electron dialog API documentation](https://www.electronjs.org/docs/latest/api/dialog)

### Anti-Patterns to Avoid

- **Don't use contenteditable for text editing:** React and contenteditable conflict because contenteditable mutates DOM directly. Use standard `<textarea>` with controlled components instead. [Source](https://www.taniarascia.com/content-editable-elements-in-javascript-react/)

- **Don't call Claude API from renderer process:** API keys must stay in main process (security). Always use IPC bridge. [Source](https://github.com/anthropics/anthropic-sdk-typescript#electron-mainrenderer-process-considerations)

- **Don't block main thread with long Claude API calls:** Use streaming to prevent UI freezes. The SDK supports `stream: true` parameter. [Source](https://platform.claude.com/docs/en/api/messages-streaming)

- **Don't store API key in settings JSON:** Use Electron's `safeStorage` API (already implemented in `security-service.ts`). [Source](https://www.electronjs.org/docs/latest/api/safe-storage)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Claude API client | Custom fetch() wrapper | `@anthropic-ai/sdk` | SDK handles retries, streaming, error types, TypeScript definitions, timeout scaling |
| Drag-and-drop | Custom mouse event handlers | `@dnd-kit/sortable` | Touch support, accessibility, keyboard navigation, mobile gestures are complex |
| Form validation | Manual error state | `react-hook-form` + Zod | Already using Zod for settings, RHF integrates seamlessly, handles edge cases |
| Round-robin algorithm | Custom queue implementation | Array sort by `usage_count` | Simpler, SQLite-backed, no in-memory state to corrupt |
| IPC streaming | Custom WebSocket or polling | Electron's `webContents.send()` | Native, no extra dependencies, event-driven, bidirectional |

**Key insight:** AI generation has many edge cases (rate limits, token limits, streaming errors, partial responses). The official SDK has battle-tested error handling that would take weeks to replicate correctly.

## Common Pitfalls

### Pitfall 1: Streaming Interruption Without Recovery

**What goes wrong:** Network hiccup or rate limit mid-stream causes partial response, user loses progress

**Why it happens:** Stream events are fire-and-forget. If connection drops, no automatic resume exists in current Claude models (4.5 and earlier support partial recovery, 4.6 requires restart with continuation prompt)

**How to avoid:**
- Store partial response in Zustand state as tokens arrive
- On error, show "Resume generation" button that includes partial response in prompt: "Your previous response was interrupted and ended with [partial]. Continue from where you left off."
- For Claude 4.6, always include continuation instruction in retry prompt

**Warning signs:**
- User reports "generation stopped halfway"
- Error logs show `overloaded_error` or timeout in stream events

**Source:** [Claude API streaming error recovery](https://platform.claude.com/docs/en/api/messages-streaming#error-recovery)

### Pitfall 2: React State Update Conflicts During Token Streaming

**What goes wrong:** Hundreds of tokens per second cause React re-renders to queue up, UI becomes laggy or unresponsive

**Why it happens:** Each `setState` call triggers re-render. Token-by-token updates can fire 50-100 times per second during fast generation

**How to avoid:**
- Batch state updates using `unstable_batchedUpdates` from React
- OR accumulate tokens in a ref, debounce state updates to 100ms intervals
- OR use Zustand's `shallow` equality check to prevent unnecessary re-renders

**Warning signs:**
- Generation UI stutters or lags during streaming
- Console warnings about too many state updates
- CPU usage spikes during generation

**Example solution:**
```typescript
// Debounced approach
const textRef = useRef('');
const [displayText, setDisplayText] = useState('');

useEffect(() => {
  const interval = setInterval(() => {
    setDisplayText(textRef.current);
  }, 100); // Update display every 100ms

  return () => clearInterval(interval);
}, []);

window.api.generation.onToken((token) => {
  textRef.current += token; // Fast accumulation
});
```

### Pitfall 3: Balance Matrix Not Updated Until Export

**What goes wrong:** User creates multiple posts in one session, each recommendation ignores the posts created earlier because balance matrix only updates on final export

**Why it happens:** `updateBalanceMatrix()` called only at end of wizard, not when draft is saved

**How to avoid:**
- Update balance matrix when post status changes to 'approved' (Step 4 completion), not 'exported'
- OR track "pending" usage in Zustand state and factor into recommendation algorithm
- Always increment `usage_count` before next recommendation, not after export

**Warning signs:**
- User complains "system recommended the same theme 3 times in a row"
- Balance widget doesn't update after completing a post

### Pitfall 4: Prompt Too Large for Token Limit

**What goes wrong:** Assembled master prompt + user impulse + conversation history exceeds model's input token limit (200k for Opus 4.5, 100k for Haiku), API returns 400 error

**Why it happens:** All settings concatenated without length checking, user's viral_post_expertise or master_prompt_template can be thousands of tokens

**How to avoid:**
- Estimate token count before API call (rough: 1 token ≈ 4 characters)
- Truncate optional sections (competitor_analysis, viral_post_expertise) if prompt exceeds 8000 tokens (leaves room for response)
- Show warning in settings UI if individual sections exceed 2000 characters

**Warning signs:**
- API error: "max_tokens: max must be at most 200000"
- Generation fails immediately with "prompt too long"

**Example check:**
```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const promptTokens = estimateTokens(assembleMasterPrompt(...));
if (promptTokens > 8000) {
  // Truncate or warn user
}
```

### Pitfall 5: File Export Race Condition

**What goes wrong:** User clicks "Export" multiple times rapidly, files written multiple times or mixed content

**Why it happens:** Async file writes don't prevent duplicate calls, no UI lock during export

**How to avoid:**
- Disable export button immediately on click
- Show loading spinner during export
- Use IPC `invoke` (request-response) instead of `send` (fire-and-forget) to ensure completion before re-enabling button

**Warning signs:**
- Duplicate files in export folder with identical names
- Corrupted PNGs (partial writes)

### Pitfall 6: Template HTML Doesn't Match Final PNG

**What goes wrong:** Live preview on Step 3 looks correct, but final PNG render on Step 4 has different fonts, colors, or layout

**Why it happens:** Live preview uses renderer process CSS, final PNG uses Puppeteer's headless browser with different font loading or CSS interpretation

**How to avoid:**
- Use identical HTML/CSS for preview and render (shared template source)
- Inject custom fonts as base64 data URLs in both preview and render HTML
- Test PNG render early in wizard (not just at Step 4) to catch discrepancies

**Warning signs:**
- User reports "preview looked different from final image"
- Fonts fallback to system default in PNG but not in preview

## Code Examples

Verified patterns from official sources:

### Streaming Claude API with Token-by-Token Updates

```typescript
// Source: https://platform.claude.com/docs/en/api/messages-streaming
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const stream = client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  messages: [{ role: 'user', content: prompt }]
});

// Event-based streaming
stream.on('text', (text) => {
  console.log('Token:', text);
  // Send to renderer via IPC
  win.webContents.send('generate:token', text);
});

stream.on('message', (message) => {
  console.log('Complete message:', message);
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
});

// OR: Get final message without handling events
const message = await stream.finalMessage();
```

### Electron IPC Streaming from Main to Renderer

```typescript
// Source: https://www.electronjs.org/docs/latest/api/ipc-main
// Main process
ipcMain.handle('generate:start', async (event, prompt) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  // Long-running operation
  for (let i = 0; i < 100; i++) {
    win.webContents.send('generate:progress', { step: i, total: 100 });
    await someAsyncWork();
  }

  win.webContents.send('generate:complete', finalResult);
  return { started: true };
});

// Renderer preload
contextBridge.exposeInMainWorld('api', {
  generation: {
    start: (prompt) => ipcRenderer.invoke('generate:start', prompt),
    onProgress: (callback) => ipcRenderer.on('generate:progress', (_, data) => callback(data)),
    onComplete: (callback) => ipcRenderer.on('generate:complete', (_, data) => callback(data))
  }
});

// Renderer component
useEffect(() => {
  window.api.generation.onProgress((data) => {
    setProgress((data.step / data.total) * 100);
  });

  window.api.generation.onComplete((result) => {
    setFinalResult(result);
  });
}, []);
```

### Zustand Store with Auto-Save (Reuse Existing Pattern)

```typescript
// Source: Existing useAutoSave.ts hook from Phase 2
import { create } from 'zustand';
import { useAutoSave } from '../hooks/useAutoSave';

export const useCreatePostStore = create((set, get) => ({
  slides: [],
  caption: '',

  updateSlide: (index, field, value) => set((state) => ({
    slides: state.slides.map((slide, i) =>
      i === index ? { ...slide, [field]: value } : slide
    )
  })),

  // ... other actions
}));

// In component
function Step3EditText() {
  const { slides, updateSlide } = useCreatePostStore();

  // Auto-save to database as draft
  useAutoSave(
    slides,
    async (data) => {
      await window.api.posts.saveDraft({ slides: data });
    },
    500 // 500ms debounce
  );

  return (
    <div>
      {slides.map((slide, i) => (
        <textarea
          value={slide.hook_text}
          onChange={(e) => updateSlide(i, 'hook_text', e.target.value)}
        />
      ))}
    </div>
  );
}
```

### Drag-and-Drop Slide Reordering

```typescript
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSlide({ slide, index }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span>Slide {index + 1}: {slide.slide_type}</span>
      <img src={slide.previewUrl} alt={`Slide ${index + 1}`} />
    </div>
  );
}

function SlideReorder() {
  const { slides, reorderSlides } = useCreatePostStore();

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = slides.findIndex(s => s.id === active.id);
      const newIndex = slides.findIndex(s => s.id === over.id);
      reorderSlides(oldIndex, newIndex);
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {slides.map((slide, i) => (
          <SortableSlide key={slide.id} slide={slide} index={i} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | Zustand for client state, TanStack Query for server state | 2024-2025 | Simpler API, less boilerplate, better TypeScript inference |
| react-dnd | @dnd-kit | 2023+ | Better touch support, smaller bundle (16KB vs 45KB), modular architecture |
| contenteditable for rich text | Controlled textarea + preview | Ongoing | Avoid React/DOM conflicts, more predictable behavior |
| Manual fetch() to APIs | Official SDKs | Always preferred | Automatic retries, error handling, streaming, TypeScript types |
| Polling for updates | Server-Sent Events (SSE) | 2020+ | Lower latency, less bandwidth, native browser support |

**Deprecated/outdated:**
- `react-beautiful-dnd`: No longer maintained, replaced by `@dnd-kit`
- Claude API direct REST calls without SDK: SDK launched 2023, adds significant value
- Separate state management libs for async data: TanStack Query (formerly React Query) is now standard

**Source:** [The State of React State Management in 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026)

## Open Questions

1. **Story image generation: reformatted feed slide vs. dedicated story template?**
   - What we know: STORY-06 allows either approach
   - What's unclear: Which is better UX? Reformatted is simpler (no new template creation), dedicated is more flexible
   - Recommendation: Start with reformatted (use existing feed slide, add 9:16 crop + padding), add dedicated story templates in Wave 2 if users request it

2. **Claude API rate limits: how to handle gracefully?**
   - What we know: Anthropic has rate limits (requests/minute, tokens/minute), SDK throws `RateLimitError`
   - What's unclear: Should we retry automatically, show queue to user, or fail fast?
   - Recommendation: SDK auto-retries 2x by default. On persistent failure, show user-friendly error: "Claude API is busy, please try again in 60 seconds" with countdown timer

3. **Draft resumption: should wizard auto-resume incomplete drafts?**
   - What we know: Schema supports draft status, Context.md says "Claude's discretion"
   - What's unclear: Auto-resume on app restart? Show draft list on dashboard? Single draft per session?
   - Recommendation: Single draft per session (overwrite on new creation), show "Resume draft" button on dashboard if draft exists, auto-resume on click

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POST-01 | Round-robin recommendation in cold start | unit | `npm test tests/main/services/recommendation.test.ts` | ❌ Wave 0 |
| POST-01 | Weighted recommendation with performance data | unit | `npm test tests/main/services/recommendation.test.ts` | ❌ Wave 0 |
| POST-06 | Prompt assembly from settings | unit | `npm test tests/main/services/prompt-assembler.test.ts` | ❌ Wave 0 |
| POST-06 | Claude API streaming handler | integration | Manual - requires API key, test in dev | ❌ Manual only |
| POST-08 | Slide text update in Zustand store | unit | `npm test tests/renderer/stores/createPostStore.test.ts` | ❌ Wave 0 |
| POST-11 | Slide reordering in Zustand store | unit | `npm test tests/renderer/stores/createPostStore.test.ts` | ❌ Wave 0 |
| POST-13 | PNG render via RenderService | integration | `npm test tests/main/services/render-service.test.ts` | ✅ (from Phase 1) |
| POST-16 | File export to selected folder | integration | `npm test tests/main/ipc/export.test.ts` | ❌ Wave 0 |
| STORY-01 | Story generation from feed post context | integration | Manual - requires API key, test in dev | ❌ Manual only |
| LEARN-01 | Balance matrix update on post creation | unit | `npm test tests/main/db/queries.test.ts` | ❌ Wave 0 |
| LEARN-03 | Soft-signal warning logic | unit | `npm test tests/main/services/learning-warnings.test.ts` | ❌ Wave 0 |
| LEARN-04 | Equal rotation when no performance data | unit | `npm test tests/main/services/recommendation.test.ts` | ❌ Wave 0 |
| LEARN-06 | Pillar balance vs. target percentage | unit | `npm test tests/main/services/pillar-balance.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` (runs all unit tests, < 30 seconds)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + manual Claude API smoke test before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/main/services/recommendation.test.ts` - covers POST-01, LEARN-04
- [ ] `tests/main/services/prompt-assembler.test.ts` - covers POST-06 prompt assembly
- [ ] `tests/renderer/stores/createPostStore.test.ts` - covers POST-08, POST-11
- [ ] `tests/main/ipc/export.test.ts` - covers POST-16
- [ ] `tests/main/db/queries.test.ts` - extend existing for LEARN-01
- [ ] `tests/main/services/learning-warnings.test.ts` - covers LEARN-03
- [ ] `tests/main/services/pillar-balance.test.ts` - covers LEARN-06
- [ ] Manual test script for Claude API integration (POST-06, STORY-01) - cannot automate without API key exposure

## Sources

### Primary (HIGH confidence)

- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Installation, streaming examples, Node.js usage
- [Streaming Messages - Claude API Docs](https://platform.claude.com/docs/en/api/messages-streaming) - Event types, error recovery, token-by-token streaming
- [Electron dialog API](https://www.electronjs.org/docs/latest/api/dialog) - showOpenDialog, showSaveDialog usage
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc) - Main-to-renderer streaming patterns

### Secondary (MEDIUM confidence)

- [The State of React State Management in 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026) - Zustand + TanStack Query recommendation
- [Load Balancing Algorithms](https://kemptechnologies.com/load-balancer/load-balancing-algorithms-techniques) - Round-robin algorithm pattern
- [@dnd-kit documentation](https://docs.dndkit.com/presets/sortable) - Sortable list implementation
- [Using Content Editable Elements in React](https://www.taniarascia.com/content-editable-elements-in-javascript-react/) - Why to avoid contenteditable

### Tertiary (LOW confidence)

- [Building AI-Powered Apps in 2026: Integrating Claude APIs with React](https://www.nucamp.co/blog/building-ai-powered-apps-in-2026-integrating-openai-and-claude-apis-with-react-and-node) - General patterns, not project-specific
- [Electron IPC Stream](https://github.com/jprichardson/electron-ipc-stream) - Duplex stream library (not needed, built-in IPC sufficient)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, npm package versions confirmed
- Architecture: HIGH - Patterns sourced from official documentation and existing project code (Phase 1, Phase 2)
- Pitfalls: MEDIUM-HIGH - Streaming interruption and React state conflicts sourced from official docs, others from project experience
- Learning algorithm: MEDIUM - Round-robin is standard, weighted selection is custom implementation (no library exists for this specific use case)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days - stable technologies, Claude API is mature)
