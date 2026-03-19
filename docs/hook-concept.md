# Hook System - Feature Concept

## Problem

Hooks are the single highest-leverage variable in Instagram content. Everything else is
irrelevant if nobody stops scrolling. Currently:

- `hook_text` exists on slides but is unstructured free text
- No hook patterns are tracked (which formula was used?)
- No performance feedback loop for hooks (balance_matrix tracks area/approach/method/tonality but not hooks)
- Collected hooks from other creators have no structured home
- Method dimension partially overlaps (M1 Provokante These) but methods describe post structure, not the attention mechanism

## Concept

Two layers:

### 1. Hook Patterns (strategic - like methods/tonalities)

Reusable formulas stored in settings, managed in BrandConfig:

| ID | Pattern | Example |
|----|---------|---------|
| H1 | Shocking Statistic | "40% deines Glücks hängen von einer einzigen Sache ab." |
| H2 | Provokative Behauptung | "Dein Handy ist der Grund, warum du deine Kinder nicht mehr richtig siehst." |
| H3 | Kontrast | "Dein Kalender ist voll. Dein Herz ist leer." |
| H4 | Szene (Storytelling-Einstieg) | "Letzte Woche stand ich um 6:30 in der Küche, das Baby auf dem Arm..." |
| H5 | Direkte Frage | "Wann hast du das letzte Mal etwas nur für dich getan?" |
| H6 | Zitat + Twist | Strong quote followed by unexpected reframe |
| H7 | Mythos-Opener | "Alle sagen: Schreib 5 Dinge auf. Falsch." |

Schema: `{ id, name, description, example }`
Managed like other MECE dimensions (DimensionListEditor).

### 2. Hook Library (specific instances)

A collection of concrete hooks, tagged with:
- Pattern reference (H1, H2, etc.)
- Source: "original" | "competitor" | "inspiration"
- Source detail (creator name, post link)
- The actual hook text
- Optional: used_count, avg_performance (computed from posts)

Schema: `{ id, text, patternId, source, sourceDetail }`
New UI section in BrandConfig or a dedicated page.

## Integration Points

### Post Creation (CreatePost)
- Add hook pattern selector (like method/tonality selection today)
- Optionally pick a specific hook from library or let AI generate one following the selected pattern
- Hook pattern feeds into prompt assembler as context

### Prompt Assembler
- New section: `## Hook Pattern: {name}\n{description}\n\nExample: {example}`
- If specific hook selected: `## Use This Hook:\n{hook_text}`

### Database
- `posts` table: add `hook_pattern TEXT` column
- `balance_matrix`: add `hook_pattern` as a tracked `variable_type`
- New table `hook_library` for stored hooks

### Performance Tracking
- balance_matrix already supports avg_performance per variable_type/value
- Adding hook_pattern as variable_type gives us: "Kontrast hooks average 2.3x reach vs. Frage hooks"
- Post history shows which hook pattern was used

### BrandConfig
- New section "Hooks" between Context Documents and MECE Dimensions
- Sub-sections: Hook Patterns (dimension editor) + Hook Library (collection manager)
- Hook rules (strategic guidance) stored in context doc or as section intro text

## Scope Estimate

- Types: HookPattern + HookLibraryEntry in shared/types.ts
- Settings: hookPatterns[] + hookLibrary[] arrays
- DB: posts.hook_pattern column + hook_library table
- UI: BrandConfig hook section + CreatePost hook selector
- Prompt assembler: hook context injection
- Balance matrix: hook_pattern tracking

Not trivial but well-contained. Follows existing patterns (dimensions, balance tracking).

## Decision

Separate phase after MECE context doc cleanup. The context docs now include a "hooks"
field as a placeholder that collects all hook-related strategic content. The structured
hook system replaces this free-text field when implemented.
