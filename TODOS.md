# TODOS

1. Implement Landing Page link
2. Implement Hook System (hook strategy as first-class dimension in wizard)
3. Implement CTA Strategy system (CTA strategy as first-class dimension in wizard)

(check vs initial requirements.md in planning)
(#4 Pillar hierarchy and #5 Real Life Situations - addressed by hierarchy branch)


## P2 - Hook-First Creation Flow
**What:** Restructure CreatePost wizard to lead with hook selection before dimension selection.
**Why:** Hooks are the highest-leverage scroll-stopping element - they should drive creative direction, not be an afterthought after area/method/tonality.
**Pros:** Better creative workflow, hooks get the attention they deserve, aligns UX with actual content strategy priorities.
**Cons:** Changes the mental model users have built with the current dimension-first flow.
**Context:** Currently dimensions come first and hooks are selected after format selection. This would invert the flow so the user picks/generates a hook first, then selects supporting dimensions. Requires the hook system to ship and accumulate performance data first - the value of leading with hooks depends on having data about which patterns work.
**Effort:** M (human) -> S (CC)
**Depends on:** Hook system with performance analytics shipping and accumulating data (20+ posts with hook patterns).

## P3 - Competitor Hook Scraping
**What:** Paste an Instagram post URL, system extracts the hook (first line/sentence), auto-classifies against patterns, stores in library with source='competitor' and creator name.
**Why:** Turns the hook library into a competitive intelligence tool. Automates the manual process of collecting hooks from other creators.
**Pros:** Faster library growth, competitive awareness, builds a searchable swipe file automatically.
**Cons:** Fragile Instagram API/embed dependency - platform changes can break scraping. oEmbed endpoint may not return full caption text.
**Context:** The hook concept doc mentions source tracking (original/competitor/inspiration). This automates the competitor flow. Manual entry still works as fallback.
**Effort:** M (human) -> S (CC)
**Depends on:** Hook library in DB table (decided in CEO review 2026-03-19).
