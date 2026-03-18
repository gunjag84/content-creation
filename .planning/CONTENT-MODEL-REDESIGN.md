# MECE Content Model Redesign

## Context

The app currently has 3 content dimensions: **Pillar** (3 values), **Theme** (hierarchical oberthemen/unterthemen), **Mechanic** (7 values). Through brainstorming, we designed a 7-dimension MECE content model that is topic-agnostic in structure but applied to LEBEN.LIEBEN as first project. The new model enables high-volume content production (2-3 posts/day), systematic A/B testing across dimensions, and a future learning algorithm that recommends optimal combinations.

**Current state:** The app works end-to-end (create -> edit -> render -> review -> history). Settings stored in `data/settings.json`, posts in SQLite. Balance matrix tracks pillar/theme/mechanic usage and performance.

**Goal:** Replace the 3-dimension model with the 7-dimension model. Every dimension becomes selectable in Step 1, stored on the post record, tracked in the balance matrix, and fed into the LLM prompt.

---

## The New Content Model

### Dimensions

| # | Dimension | DB column | Type | Cardinality | Selection |
|---|-----------|-----------|------|-------------|-----------|
| 1 | Lebensbereich | `area` | topic-specific | 9 (LEBEN.LIEBEN) | Exactly 1 |
| 2 | Loesungsansatz | `approach` | topic-specific | 8 (LEBEN.LIEBEN) | 0 or 1 |
| 3 | Format | `content_type` | topic-agnostic | 4 | Exactly 1 |
| 4 | Methode | `method` | topic-agnostic | 18 | Exactly 1 |
| 5 | Tonalitaet | `tonality` | topic-agnostic | 4 | Exactly 1 |
| 6 | Absicht (Pillar) | `pillar` | topic-agnostic | 3 (existing) | Exactly 1 |
| 7 | Variation | `variation_of` | reference | - | Optional, FK to posts.id |

Plus tracking fields (not selectable):
- `caption_style`: 'kurz' | 'erzaehlend' | 'cta' - auto-assigned by LLM, stored for analysis
- `source`: 'eigen' | 'ugc' | 'repost' - attribute on post record

### Dimension Values (LEBEN.LIEBEN)

**Lebensbereiche (L1-L9):**

| ID | Name | Beschreibung |
|----|------|-------------|
| L1 | Familienleben | Familie als Quelle von Freude, Verbindung, Momente |
| L2 | Rollenvielfalt | Mutter, Partnerin, Beruf, Tochter, Freundin, sie selbst |
| L3 | Alltagschaos | Ueberforderung, Mental Load, Zeitdruck (unabhaengig von Familie) |
| L4 | Partnerschaft | Beziehung pflegen trotz Alltag, Kommunikation |
| L5 | Selbstbild | Eigene Identitaet, Selbstwert, Veraenderung |
| L6 | Jahreszeiten & Phasen | Saisonale Themen, Lebensphasen, Uebergaenge |
| L7 | Freundschaft | Freundschaften pflegen, verlieren, neue finden |
| L8 | Frau in der Gesellschaft | Erwartungen an Muetter/Frauen, Doppelstandards |
| L9 | Hinter den Kulissen / Marke | Wer steckt hinter LEBEN.LIEBEN, Produktion, Werte |

**Loesungsansaetze (A1-A8):**

| ID | Name | Beschreibung |
|----|------|-------------|
| A1 | Dankbarkeit | Perspektivwechsel, das Gute sehen |
| A2 | Journaling | Schreiben als Werkzeug, Reflexion |
| A3 | Achtsamkeit & Routinen | Morgenroutine, Abendritual, bewusste Pausen |
| A4 | Bewegung & Koerper | Sport, Spaziergang, Energie |
| A5 | Quality Time | Bewusste Zeit mit Familie, Freunden, sich selbst |
| A6 | Loslassen | Perfektionismus ablegen, Nein sagen, Prioritaeten |
| A7 | Digital Detox | Bewusst offline, Bildschirmzeit reduzieren |
| A8 | Handynutzung | Umgang mit Smartphone, Jugendliche & Screens, Suchtverhalten |

**Methoden (M1-M18):**

| ID | Name | Beschreibung | Format-Einschraenkung |
|----|------|-------------|----------------------|
| M1 | Provokante These | These + Erklaerung/Aufloesung | Alle |
| M2 | Frage-Antwort | Frage aufwerfen + beantworten | Alle |
| M3 | Persoenliche Geschichte | Echtes Erlebnis aus dem Alltag | Alle |
| M4 | Wissenschaft | Fakten, Studien, Einordnung | Alle |
| M5 | Testimonial | Nutzerstimmen, Erfahrungsberichte | Alle |
| M6 | Zitat | Quote + Autor | Nur Single |
| M7 | Vergleich | Vorher/Nachher, Mit/Ohne | Alle |
| M8 | Liste | X Gruende, X Dinge, X Tipps | Single, Carousel |
| M9 | Mythos vs. Realitaet | "Man denkt X, aber eigentlich Y" | Alle |
| M10 | Kontroverse Meinung | Unpopular Opinion | Alle |
| M11 | Analogie/Metapher | Komplexes ueber ein Bild erklaeren | Alle |
| M12 | Dialog/Innerer Monolog | Zwei Stimmen, innerer Konflikt | Carousel, Reel |
| M13 | Countdown/Ranking | Vom unwichtigsten zum wichtigsten | Carousel |
| M14 | Handlungsaufforderung | Challenge an den Leser ("Probier heute...") | Alle |
| M15 | Beobachtung | Wiedererkennung ohne Loesung ("Kennst du das...") | Alle |
| M16 | How-to/Anleitung | Schritt-fuer-Schritt | Carousel, Reel |
| M17 | Empfehlung/Produkttipp | Buch, Tool, App, Produkt das geholfen hat | Alle (nur manueller Trigger) |
| M18 | Vorher-Nachher Transformation | Persoenliche Veraenderung ueber Zeit | Alle |

**Tonalitaet (T1-T4):**

| ID | Name | Beschreibung |
|----|------|-------------|
| T1 | Emotional | Beruehrend, verletzlich, nah |
| T2 | Humorvoll | Witzig, selbstironisch, leicht |
| T3 | Sachlich-klar | Faktenbasiert, direkt, nuechtern |
| T4 | Provokant | Unbequem, gegen den Strom, aufruettelnd |

**Format:**

| ID | Name |
|----|------|
| F1 | Single Post (1 Slide) |
| F2 | Carousel (2-10 Slides) |
| F3 | Reel (Video) |
| F4 | Story |

### MECE Auswahllogik

- Jeder Post hat genau 1 Lebensbereich + 0-1 Loesungsansatz
- Trennlinie Lebensbereich vs. Loesungsansatz: Lebensbereich = worüber, Loesungsansatz = was wird angeboten
- Ein Post kann rein einen Lebensbereich beleuchten, einen Lebensbereich + Loesungsansatz verbinden, oder einen Loesungsansatz allein behandeln (0 Lebensbereich ist theoretisch moeglich aber selten)
- Die dominante Methode wird gewaehlt (der Kern des Posts), nicht der Hook-Typ
- Trennlinien innerhalb Dimensionen:
  - L1 Familienleben vs. L3 Alltagschaos: L1 = positiv/Verbindung, L3 = Stress/Last
  - L2 Rollenvielfalt vs. L8 Frau in der Gesellschaft: L2 = Ich-Perspektive, L8 = Wir/Man-Perspektive
  - M1 Provokante These vs. M10 Kontroverse Meinung: M1 = nach Erklaerung einleuchtend, M10 = bleibt kontrovers
  - M8 Liste vs. M13 Countdown: M8 = flach/gleichwertig, M13 = gerankt mit Spannungsbogen
  - A1 Dankbarkeit vs. A2 Journaling: A1 = Mindset/Haltung, A2 = Werkzeug/Methode

### Blacklist (discouraged combinations - warning, not blocking)

**Hard warnings:**
- M5 Testimonial + T2 Humorvoll
- M5 Testimonial + T4 Provokant
- M6 Zitat + T2 Humorvoll
- M18 Vorher-Nachher + T2 Humorvoll
- M3 Persoenliche Geschichte + T3 Sachlich
- M4 Wissenschaft + T1 Emotional
- M10 Kontroverse Meinung + A1 Dankbarkeit
- M14 Handlungsaufforderung + T3 Sachlich

**Soft warnings (test later):**
- M4 Wissenschaft + T2 Humorvoll
- L5 Selbstbild + T2 Humorvoll
- M13 Countdown + T1 Emotional
- L8 Frau in der Gesellschaft + T1 Emotional
- M17 Empfehlung + T4 Provokant

### Variation (Recycling-Strategie)

- Post referenziert optional einen Ursprungspost via `variation_of`
- Variationsachsen: Format, Methode, Angle, Visuell, Wording
- Bei Variation bekommt der LLM den Originaltext als Input
- Mindestabstand zwischen Variationen: 5 Tage (konfigurierbar)
- App trackt welche Variationen eines Themas schon produziert wurden
- 3 Empfehlungen fuer naechsten Post (spaeter via Learning-Algorithmus)

---

## Implementation Plan

### Step 1: Types & Schema Migration

**Files:** `src/shared/types.ts`, `src/shared/types/settings.ts`, `src/server/db/schema.sql`, `src/server/db/index.ts`

- Add new types: `Area`, `Approach`, `Method`, `Tonality`, `CaptionStyle`, `Source`
- Add `content_type` values `'reel'` and `'story'` to CHECK constraint
- Extend `posts` table: add columns `area TEXT`, `approach TEXT`, `method TEXT`, `tonality TEXT`, `caption_style TEXT`, `source TEXT DEFAULT 'eigen'`, `variation_of INTEGER REFERENCES posts(id)`
- Keep existing `pillar`, `theme`, `mechanic`, `content_type` columns during migration (mark deprecated)
- Extend `balance_matrix.variable_type` CHECK to include: `'area'`, `'approach'`, `'method'`, `'tonality'`
- Update `SettingsSchema`: add `areas` (array of {id, name, description}), `approaches` (same), `methods` (array of {id, name, description, formatConstraints?}), `tonalities` (array of {id, name, description})
- Add `blacklist` to settings: array of {dimension1, value1, dimension2, value2, severity} pairs
- Add DB migration in `src/server/db/index.ts` for new columns

### Step 2: Settings UI - New Dimension Configuration

**Files:** `src/client/pages/BrandConfig.tsx`

- Add sections for: Lebensbereiche, Loesungsansaetze, Methoden, Tonalitaet
- Each section: list with add/edit/delete, name + description fields
- Methoden section: additional `formatConstraints` multi-select
- Seed default values for LEBEN.LIEBEN on first load (all L1-L9, A1-A8, M1-M18, T1-T4)
- Blacklist editor: table of discouraged combinations with severity toggle

### Step 3: Wizard Step 1 - New Selection UI

**Files:** `src/client/stores/wizardStore.ts`, Step 1 component

- Replace `selectedTheme`/`selectedMechanic` with: `selectedArea`, `selectedApproach`, `selectedMethod`, `selectedTonality`
- Keep `selectedPillar` (Absicht) and `contentType` (Format) - add 'reel' and 'story' options
- Add `variationOf: number | null` and `source: 'eigen' | 'ugc' | 'repost'`
- UI: 6 dropdowns (Area, Approach [optional], Format, Method, Tonality, Pillar) + optional Variation selector
- Method dropdown filters based on selected Format (format constraints)
- Blacklist warnings inline (yellow banner, not blocking)

### Step 4: Prompt Assembler - New Dimensions

**File:** `src/server/services/prompt-assembler.ts`

- Update `assemblePrompt()` signature: replace `theme`/`mechanic` with `area`, `approach`, `method`, `tonality`
- Build prompt sections for each dimension with name + description from settings
- If `variationOf` is set: load original post's slides/caption, include as "Originaltext" with variation instruction
- Caption style instruction: LLM indicates kurz/erzaehlend/cta in response

### Step 5: Balance Matrix & Learning Service

**Files:** `src/server/services/learning-service.ts`, `src/server/db/queries.ts`, `src/server/routes/posts.ts`

- On post creation: update balance_matrix for all new dimensions (area, approach, method, tonality) + pillar
- Remove theme/mechanic tracking (replaced by new dimensions)
- `recommendContent()`: recommend across all 5 selectable dimensions, return 3 recommendations
- `calculateBalance()` (renamed): return dashboard data for all dimensions
- `generateWarnings()`: extend to all dimensions
- Variation tracking queries: `getVariationsOf(postId)`, `getVariationCoverage(postId)`

### Step 6: Recommendation Endpoint

**File:** `src/server/routes/posts.ts`

- `GET /posts/meta/recommendation` returns 3 recommendations with reasoning
- Each recommendation: `{ area, approach, method, tonality, pillar, reasoning }`
- Include variation suggestions for high-performing posts (top 20%)
- Minimum variation interval: 5 days (configurable)

### Step 7: Post History & Variation Tracking

**Files:** Post history/detail components

- Show all new dimensions in post detail view
- "Variationen" section: list all posts linked to same original
- "Variation erstellen" button: pre-fills wizard with same area/approach/pillar, prompts for new format/method/tonality
- Caption style and source shown as tags

### Step 8: Data Migration

- Map old `theme` -> best-fit `area` + `approach`, old `mechanic` -> best-fit `method`
- Set `tonality`, `caption_style` to null for existing posts
- Set `source` to 'eigen' for all existing posts
- Keep old columns for rollback safety

---

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/types.ts` | New dimension types, extended post type |
| `src/shared/types/settings.ts` | New settings sections for dimensions |
| `src/server/db/schema.sql` | New columns, extended CHECKs |
| `src/server/db/index.ts` | Migration for new columns |
| `src/server/db/queries.ts` | Variation tracking, extended balance queries |
| `src/server/services/prompt-assembler.ts` | New prompt structure |
| `src/server/services/learning-service.ts` | Extended recommendation, balance, warnings |
| `src/server/routes/posts.ts` | 3 recommendations, variation endpoints |
| `src/server/routes/settings.ts` | Persist new dimension configs |
| `src/client/stores/wizardStore.ts` | New selection fields |
| Step 1 component | New dropdowns, blacklist warnings |
| `src/client/pages/BrandConfig.tsx` | New settings sections |
| Post history/detail components | Dimension display, variation UI |
| `src/shared/data/themes.json` | Replace with areas.json + approaches.json |
| `src/shared/data/mechanics.json` | Replace with methods.json |

---

## Offene Punkte (spaetere Features)

1. **Formate im Detail** - Slide-Limits, visuelle Vorgaben pro Format
2. **Stories** - eigene Dimension, Abstimmungen, interaktive Elemente
3. **Reel-Produktion** - App generiert Script, Juliane spricht ein
4. **Learning-Algorithmus** - automatische Variationsvorschlaege basierend auf Performance-Daten
5. **Werbebudget-Tracking** - Boosted vs. organisch differenzieren
6. **Hashtag-Strategie** - Festes Set pro Themenfeld, 3-5 pro Post, best practice recherchieren
7. **Caption-Optimierung** - Kurz/Erzaehlend/CTA testen, Learnings ableiten

---

## Verification

1. **Settings**: Seed LEBEN.LIEBEN defaults, verify all dimensions in BrandConfig with CRUD
2. **Wizard**: Create post selecting all 6 dimensions, verify blacklist warning for discouraged combo
3. **Prompt**: Inspect assembled prompt - all dimensions present, variation includes original text
4. **Render**: Full flow create -> edit -> render -> review with new dimensions
5. **Balance**: After 5+ posts, verify dashboard shows all dimensions with usage counts
6. **Recommendation**: Verify 3 recommendations returned, filtered to valid settings
7. **History**: Verify post detail shows all dimensions, variation chain visible
8. **Migration**: Existing posts have mapped values, no data loss
