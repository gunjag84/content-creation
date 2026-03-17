# Content Creation System — Blueprint FINAL v3.0

## 1. Systemübersicht

Ein KI-gestütztes Content-Creation-System für **Instagram** (Single Brand, architektonisch Multi-Brand-ready), das Posts im **Einzelpost-Workflow** generiert. Das System kombiniert statische Marken-Vorgaben mit einem dynamischen Learning System, das aus Performance-Daten iteriert.

---

## 2. Settings & Content-Eingaben

Alle Eingaben werden über den **Settings-Editor in der App** gepflegt. Das System speichert als JSON. Alles ist jederzeit anpassbar. Jede Änderung wird automatisch versioniert.

Es gibt zwei Typen von Eingaben:

| Typ | Was ist das | Beispiel |
|-----|------------|---------|
| **📝 Content-Eingabe** | Substantielle Texte, die in den Prompt an Claude eingefügt werden. Du schreibst oder generierst sie. | Brand Voice, Target Persona, Competitor Analysis |
| **⚙️ Setting** | Werte, die du einstellst (Slider, Dropdowns, Toggles, Number Inputs, strukturierte Felder). Steuern das System-Verhalten. | Pillar-Verteilung, Carousel min/max, Mechanik-Katalog |

### Übersicht: Alle Bereiche

| # | Bereich | Typ | Required | Geht in Prompt? | Beschreibung |
|---|---------|-----|----------|----------------|-------------|
| 1 | Brand Voice | 📝 Content | **Required** | ✅ Ja | Tonalität, Sprachstil — bestimmt wie die AI textet |
| 2 | Brand Guidance | ⚙️ Setting | **Required** | ❌ Nein (steuert Rendering) | Farben, Fonts, Logo, Standard-CTA — steuert die Bildgenerierung |
| 3 | Target Persona | 📝 Content | **Required** | ✅ Ja | Zielgruppe — bestimmt für wen die AI textet |
| 4 | Competitor Analysis | 📝 Content | Optional | ✅ Ja (wenn vorhanden) | Differenzierung — wenn leer, wird der Prompt-Block übersprungen |
| 5 | Content Pillars | ⚙️ Setting | **Required** | ✅ Ja (als Anweisung) | Soll-Verteilung 50/30/20 |
| 6 | Themen-Hierarchie | 📝 Content | **Required** | ✅ Ja (gewähltes Thema) | Die Kernaussagen, über die gepostet wird |
| 7 | Post-Mechanik-Katalog | ⚙️ Setting | **Required** (vorbefüllt) | ✅ Ja (Leitplanken der gewählten Mechanik) | Hook-Regeln, Slide-Ranges — kommt vorbefüllt, User passt an |
| 8 | Story-Tools-Katalog | ⚙️ Setting | **Required** (vorbefüllt) | ❌ Nein (steuert Empfehlung) | Instagram Story Tools — kommt vorbefüllt |
| 9 | Viral Post Expertise | 📝 Content | Optional | ✅ Ja (wenn vorhanden) | Hook-Formeln, virale Muster — wenn leer, wird übersprungen |
| 10 | Content-Defaults | ⚙️ Setting | **Required** (hat Defaults) | ❌ Nein (steuert System) | Carousel min/max, Caption-Länge, Hashtag-Range |
| 11 | Master-Prompt | ⚙️ Setting | **Required** (vorbefüllt) | — (ist der Prompt selbst) | Für Fortgeschrittene, normalerweise nicht editiert |

**Minimalstart:** Mit Brand Voice + Target Persona + Themen-Hierarchie + den vorbefüllten Settings (Mechaniken, Story-Tools, Defaults, Master-Prompt) + mindestens einem Template kann der erste Post generiert werden. Alles andere ist optional und reichert die Qualität an.

---

### 📝 Content-Eingaben (Texte, die in den AI-Prompt fließen)

#### 2.1 Brand Voice — Required

| Feld | Editor-Typ | Beschreibung |
|------|-----------|-------------|
| Tonalität | Dropdown + Freitext | z.B. "provokativ-ironisch", "warm-persönlich", "sachlich-kompetent" |
| Sprachstil Do's | Freitext-Liste (Add/Remove) | z.B. "Kurze Sätze", "Direkte Ansprache", "Daten und Fakten einbauen" |
| Sprachstil Don'ts | Freitext-Liste (Add/Remove) | z.B. "Keine Floskeln", "Kein Corporate-Sprech", "Keine Emojis im Hook" |
| Beispiel-Posts | File-Upload + Freitext | Bestehende Posts einspeisen → System leitet Voice-Profil ab |
| Voice-Profil (generiert) | Read-Only + Override | Vom System generiertes Profil, manuell anpassbar |

**Initialisierung:** Hybrid — Posts einspeisen + geführter Fragebogen → System generiert Voice-Profil. Danach im Editor feinjustierbar.

---

#### 2.2 Target Persona — Required

| Feld | Editor-Typ | Beschreibung |
|------|-----------|-------------|
| Name / Label | Freitext | z.B. "Anna, 32, gesundheitsbewusste Mutter" |
| Alter / Geschlecht | Dropdown / Range | Demografische Kerndaten |
| Pain Points | Freitext-Liste (Add/Remove) | z.B. "Findet keine allergenfreien Snacks für die Kinder" |
| Wünsche / Ziele | Freitext-Liste (Add/Remove) | z.B. "Will sich gesund ernähren ohne Verzicht" |
| Sprache / Tonalität-Erwartung | Freitext | Wie spricht die Zielgruppe? Welche Begriffe nutzt sie? |
| Medienkonsum | Freitext | Wann auf Instagram? Was folgt sie? |
| Kaufverhalten | Freitext | Online/Offline, Preissensitivität, Impulskäufer? |

---

#### 2.3 Competitor Analysis — Optional

Ein Gesamttext zur Wettbewerbsdifferenzierung. Kein strukturiertes Pro-Wettbewerber-Format nötig — einfach beschreiben, was die Brand von anderen unterscheidet.

| Feld | Editor-Typ | Beschreibung |
|------|-----------|-------------|
| Wettbewerbsumfeld | Rich-Text-Editor | Freitext: Wer sind die Wettbewerber? Was machen sie? Wo sind wir anders/besser? Was machen wir bewusst nicht? |

Wenn leer, wird der Competitor-Block im Prompt an Claude übersprungen — kein Problem, System funktioniert auch ohne.

---

#### 2.4 Themen-Hierarchie — Required

**Baum-Editor** mit Drag & Drop. Jederzeit erweiterbar.

```
Oberthema 1
├── Unterthema 1.1
│   ├── Kernaussage A
│   ├── Kernaussage B  ← NEU hinzugefügt
│   └── Kernaussage C
├── Unterthema 1.2
│   └── Kernaussage D
Oberthema 2
├── ...
```

| Aktion | Beschreibung |
|--------|-------------|
| Oberthema hinzufügen | Neues Top-Level-Thema |
| Unterthema hinzufügen | Unter einem Oberthema |
| Kernaussage hinzufügen | Unter einem Unterthema — die Ebene, auf der Posts generiert werden |
| Drag & Drop | Themen umordnen, Kernaussagen zwischen Unterthemen verschieben |
| Archivieren | Thema/Kernaussage deaktivieren (nicht löschen — historische Daten bleiben) |

---

#### 2.5 Viral Post Expertise — Optional

| Feld | Editor-Typ | Beschreibung |
|------|-----------|-------------|
| Hook-Formeln | Rich-Text-Editor | Sammlung bewährter Hook-Patterns |
| Virale Mechaniken | Rich-Text-Editor | Was macht Posts teilbar? |
| Post-Strukturen | Rich-Text-Editor | Bewährte Aufbau-Muster |

Wenn leer, generiert die AI ohne diesen Kontext — funktioniert, aber weniger gezielt.

---

### ⚙️ Settings (steuern das System-Verhalten)

#### 2.6 Brand Guidance (Visuell) — Required

| Setting | Editor-Typ | Beschreibung |
|---------|-----------|-------------|
| Primärfarbe | Color Picker | Hauptfarbe der Brand |
| Sekundärfarbe(n) | Color Picker (Multi) | Akzent-/Ergänzungsfarben |
| Hintergrundfarbe(n) | Color Picker (Multi) | Default-Hintergrund für Templates |
| Headline-Font | Dropdown (+ Upload custom) | Font für Hooks / Überschriften |
| Body-Font | Dropdown (+ Upload custom) | Font für Fließtext |
| CTA-Font | Dropdown (+ Upload custom) | Font für Call-to-Actions |
| Logo | File-Upload | Brand-Logo (PNG/SVG) |
| Logo-Platzierung | Dropdown | z.B. "Unten rechts", "Unten links", "Kein Logo" |
| Letztes Carousel-Slide | Regel-Builder | Was kommt aufs letzte Slide? (z.B. Logo + Link + Tagline) |
| Standard-CTA | Freitext + Vorschau | CTA-Text + Brand-Handle + Logo + Tagline. Wird automatisch auf das letzte Carousel-Slide angewendet. |

---

#### 2.7 Content Pillars — Required (hat Defaults)

| Setting | Editor-Typ | Default | Beschreibung |
|---------|-----------|---------|-------------|
| Generate Demand (%) | Slider | 50% | Awareness, Reichweite, neue Zielgruppen |
| Convert Demand (%) | Slider | 30% | Kaufimpulse, Angebote, Social Proof, CTAs |
| Nurture Loyalty (%) | Slider | 20% | Community, Wiederkauf, Behind the Scenes |

Slider sind gekoppelt (Summe = 100%). System trackt Ist vs. Soll und warnt bei Abweichung.

---

#### 2.8 Post-Mechanik-Katalog — Required (vorbefüllt mit 7 Mechaniken)

Pro Mechanik ein Set von festen Feldern. Vorbefüllt, erweiterbar, einzelne Mechaniken deaktivierbar.

| Setting | Editor-Typ | Beschreibung |
|---------|-----------|-------------|
| Name | Freitext | z.B. "Provokative Frage" |
| Hook-Regel | Freitext | z.B. "Muss eine Frage sein, die eine Annahme in Frage stellt" |
| Slide-Range (min) | Number Input | z.B. 3 |
| Slide-Range (max) | Number Input | z.B. 7 |
| Aufbau-Leitplanke | Freitext | z.B. "Frage → Gegenposition → Auflösung → CTA" |
| Empfohlene Pillars | Multi-Select | z.B. [Generate Demand, Nurture Loyalty] |
| Aktiv | Toggle | Mechanik aktivieren/deaktivieren |

---

#### 2.9 Story-Tools-Katalog — Required (vorbefüllt mit 18 Tools)

Pro Tool ein Set von festen Feldern. Vorbefüllt, editierbar, einzelne Tools deaktivierbar.

| Setting | Editor-Typ | Beschreibung |
|---------|-----------|-------------|
| Tool-Name | Freitext (vorbefüllt) | z.B. "Poll", "Quiz", "Question" |
| Funktion | Freitext (vorbefüllt) | Kurzbeschreibung |
| Engagement-Typ | Dropdown | z.B. "Tap", "DM", "Story-Chain" |
| Empfohlene Pillars | Multi-Select | z.B. [Generate Demand] |
| Empfohlene Mechaniken | Multi-Select | z.B. [Myth-Busting, Provokative Frage] |
| Aktiv | Toggle | Tool aktivieren/deaktivieren |

---

#### 2.10 Content-Defaults — Required (hat Defaults)

| Setting | Editor-Typ | Default | Beschreibung |
|---------|-----------|---------|-------------|
| Carousel Slides min | Number Input | 3 | Globales Minimum (Mechanik kann höher setzen) |
| Carousel Slides max | Number Input | 10 | Globales Maximum (Mechanik kann niedriger setzen) |
| Caption max. Zeichen | Number Input | 2.200 | Instagram-Limit = 2.200 |
| Hashtags min | Number Input | 5 | Mindestanzahl Hashtags |
| Hashtags max | Number Input | 15 | Maximalanzahl Hashtags |
| Stories pro Feed-Post | Number Input (Range) | 2–4 | Wie viele komplementäre Stories pro Post |

---

#### 2.11 Master-Prompt — Required (vorbefüllt)

| Setting | Editor-Typ | Beschreibung |
|---------|-----------|-------------|
| Prompt-Template | Code-Editor (Markdown) | Das Master-Prompt mit Platzhaltern. Für Fortgeschrittene — normalerweise nicht editiert, aber zugänglich. |

---

### Versionierung
Jede Änderung an Settings und Content-Eingaben wird mit Timestamp gespeichert. Das System kann nachvollziehen, welche Version bei einem bestimmten Post aktiv war. Kein manuelles Backup nötig.

---

## 3. Post-Generierungs-Workflow

### Schritt 1: System-Empfehlung
Das System analysiert auf Basis des Learning Systems:
- Welcher **Content Pillar** ist unterrepräsentiert?
- Welches **Thema** (aus dem Themen-File) wurde lange nicht behandelt?
- Welcher **Post-Typ / Hook-Typ** hat zuletzt gut performt vs. wurde selten genutzt?

→ **Output:** Empfehlung für Pillar + Thema + Post-Mechanik (z.B. "Generate Demand / Oberthema X / Provokative Frage")

### Schritt 2: User-Entscheidung
Der User bestätigt oder übersteuert die Empfehlung:
- Pillar akzeptieren oder ändern
- Thema / Unterthema auswählen
- **Content Type wählen: Carousel oder Single Post**
- Post-Mechanik wählen (z.B. provokative Frage, polarisierende Aussage, Storytelling, Listicle, Myth-Busting, etc.)
- Image Template auswählen (passend zum gewählten Content Type)
- **Optional: Eigenes Hintergrundbild hochladen** — überschreibt das Template-Hintergrundbild für diesen Post. Ein Bild gilt für alle Slides.
- **Bei Carousel: Overlay pro Slide überschreiben** — Default kommt aus der Template-Config, aber der User kann pro Slide die Overlay-Stärke anpassen (z.B. Slide 1 = kein Overlay, Slides 2-4 = volles Overlay, Slide 5 = mittleres Overlay)

### Schritt 3: Text-Generierung & Editing

**Zwei Modi:**

**Modus A: AI-gestützt (mit optionalem Impuls)**
Das System generiert den Text-Entwurf über das Master-Prompt-Template mit allen Kontext-Files. Optional kann der User einen **Freitext-Impuls** mitgeben, der zusätzlich zum Standard-Context an Claude geht.

Beispiele für Impulse:
- "Das Bild zeigt eine Schokoladentafel auf Marmor — Hook soll provokant sein, Richtung 'Luxus muss nicht teuer sein'"
- "Fokus auf den Blindtest-Aspekt, die Zahl 73% soll im Hook vorkommen"
- "Tonalität etwas frecher als sonst"
- Oder: kein Impuls → System generiert voll-automatisch basierend auf Thema + Mechanik

Der Impuls überschreibt nicht den Standard-Context (Brand Voice, Persona, etc.), sondern ergänzt ihn als zusätzliche Anweisung an die AI.

**Modus B: Manuell**
Der User tippt direkt in die Slide-Text-Felder und die Caption — keine AI-Generierung. Das System stellt nur die leeren Zonen bereit (gemäß Template-Config), der User füllt sie selbst. Rendering funktioniert identisch.

**Beide Modi teilen denselben Screen:**

**Zwei separate Outputs mit eigenen Regeln:**

**A) Slide-Text** (Text auf den Bildern):
- Kurz, visuell, hook-getrieben
- Muss in die definierten Text-Zonen des Templates passen (max_lines aus config.json)
- Bei Carousel: Text pro Slide gemäß Mechanik-Leitplanken
- Letztes Slide = **Standard-CTA aus Brand Guidance** (Logo + CTA-Text + Handle), sofern nicht manuell überschrieben

**B) Caption** (Text unter dem Post):
- Längerer Fließtext, storytelling-fähig
- SEO-optimiert (Keywords der Zielgruppe)
- Hashtag-Strategie (Mix aus Nischen- und Reichweiten-Hashtags)
- CTA am Ende
- Eigene Tonalität-Regeln (darf persönlicher/länger sein als Slide-Text)

**Editing-Optionen (direkt im selben Screen):**
- Einzelne Formulierungen inline anpassen
- Hook umschreiben oder alternative Hooks anfordern
- CTA ändern
- Slide-Reihenfolge bei Carousel umstellen
- Caption unabhängig vom Slide-Text editieren
- Komplett neuen Vorschlag generieren lassen

**Wichtig:** In diesem Schritt wird nur am Text gearbeitet — noch kein Bild. Das ist der kreative Kern-Schritt.

→ **Output:** Freigegebener Slide-Text pro Slide + freigegebene Caption.

→ Nach Text-Freigabe rendert das System automatisch die Bilder (HTML/CSS → PNG via Puppeteer). Der User wartet wenige Sekunden, dann erscheint Schritt 4.

**Technischer Hintergrund: Bild-Rendering**

Instagram akzeptiert ausschließlich **JPG oder PNG** (kein PDF, kein PPTX — das geht nur bei LinkedIn).

| Format | Empfohlene Größe | Aspect Ratio |
|--------|-----------------|--------------|
| Single Post (Portrait) | 1080 × 1350 px | 4:5 |
| Carousel Slide (Portrait) | 1080 × 1350 px | 4:5 |
| Single Post (Square) | 1080 × 1080 px | 1:1 |
| Max. Slides pro Carousel | 20 | — |
| Max. Dateigröße pro Bild | 30 MB | — |

Pipeline: HTML-Template + freigegebener Text → Puppeteer (headless Chrome, Viewport 1080×1350) → PNG pro Slide. Bei Carousel wird pro Slide gerendert. Re-Rendering in Sekunden bei jeder Änderung.

### Schritt 4: Visuelle Kontrolle & Freigabe
User sieht die fertigen PNGs + Caption. Vier Optionen:

1. **Sieht gut aus → Freigeben** → weiter zu Schritt 5 (Stories)
2. **Text passt nicht in die Zone** (zu lang, ungünstig umbrochen) → Text anpassen (zurück zu Schritt 3) → re-rendert automatisch
3. **Layout/Overlay stimmt nicht** → Template-Config anpassen → re-rendert automatisch
4. **Overlay pro Slide nachjustieren** → Slider pro Slide für Overlay-Stärke → re-rendert nur betroffenes Slide

### Schritt 5: Story-Generierung (komplementär zum Feed-Post)
Stories sind **keine eigenständigen Content-Pieces**, sondern immer Satelliten eines Feed-Posts. Sie verweisen auf den Post, teasen das Thema an, oder vertiefen einen Aspekt. Stories werden häufiger gepostet als Feed-Posts (gemäß Content-Default: 2-4 Stories pro Feed-Post).

**Kernprinzip: Content-Vererbung vom Feed-Post**
Die Story-Generierung bekommt als Input den **konkreten Feed-Post-Content** — nicht die abstrakten Kontext-Files. Die AI formuliert Story-Texte *aus dem Post heraus*, nicht neu. Konkret wird übergeben:
- Die freigegebenen Slide-Texte
- Die freigegebene Caption
- Das gewählte Thema / Kernaussage
- Die gewählte Post-Mechanik

Die Story darf den Feed-Post-Content umformulieren, verkürzen, eine Frage daraus ableiten — aber sie erfindet keinen neuen Content. Kein künstlich generierter Kontext, der vom Post abweicht.

**5a) System generiert kompletten Story-Vorschlag:**
Basierend auf dem Feed-Post, der Post-Mechanik und den Performance-Daten generiert das System für jede Story einen fertigen Vorschlag:
- **Story-Typ:** Teaser vor dem Post, Verweis auf den Post, Vertiefung eines Aspekts, Behind-the-Scenes
- **Interactive Tool:** Welches Instagram Story Tool + der konkrete Text dafür (z.B. Poll-Frage + Optionen)
- **Timing:** Vor oder nach dem Feed-Post
- **Story-Bild:** fertig gerenderte PNG (1080×1920, 9:16)
- **Story-Text:** kurz, direkt, Story-optimiert

**5b) Zwei Bild-Quellen für Stories:**

| Quelle | Wann | Wie |
|--------|------|-----|
| **Feed-Slide reformatiert** | Teaser / Verweis auf den Post | System nimmt einen Feed-Slide (z.B. Hook-Slide), reformatiert auf 9:16 (Brand-Farbe oben/unten), legt Story-Text + Tool-Platzhalter drauf |
| **Eigenes Story-Template** | Vertiefung / Behind the Scenes | Eigene HTML/CSS-Templates im 9:16-Format, via Puppeteer gerendert |

Das System wählt die passende Quelle automatisch basierend auf dem Story-Typ. User kann übersteuern.

**5c) Vereinfachter Edit-Flow:**
Der User sieht den kompletten Story-Vorschlag (Bild + Text + Tool) und hat drei Optionen:

1. **✓ Freigeben** — Story ist fertig
2. **✗ Ablehnen** — diese Story wird nicht gepostet
3. **✎ Editieren** — Text anpassen, anderes Interactive Tool wählen, anderes Feed-Slide als Basis wählen → System re-rendert

Kein eigener Text-Generierungs-Schritt, kein separater Review — alles in einem Screen pro Story.

**Wichtig:** Das Interactive Tool selbst (Poll, Quiz, etc.) wird manuell in Instagram hinzugefügt. Das System liefert den fertigen Text dafür (z.B. "Glaubst du, dass laktosefrei nach Pappe schmeckt? → Ja / Auf keinen Fall").

### Schritt 6: Performance-Tracking
Nach Veröffentlichung:

**Feed-Post:**
- **Automatisch via API:** Reach, Impressions, Engagement (Likes, Comments, Shares, Saves)
- **Manuell:** Revenue-Attribution, qualitative Einschätzung, Sonderfaktoren

**Stories:**
- **Automatisch via API:** Impressions, Reach, Replies, Exits, Taps Forward/Back
- **Interactive Tool Performance:** Welches Tool, wie viele Interaktionen, Engagement-Rate pro Tool
- **Verknüpfung zum Feed-Post:** Wurde der Feed-Post durch die Story stärker performed?

→ Daten fließen ins Learning System zurück.

---

## 4. Prompt-Template-System (Master-Prompt)

Ein festes Master-Prompt-Template zieht bei jeder Text-Generierung alle Kontext-Files dynamisch zusammen. Der Prompt wird programmatisch aus den Bausteinen assembliert — der User sieht ihn nicht.

### Master-Prompt Aufbau

```
[SYSTEM]
Du bist ein Content-Stratege und Copywriter für Instagram.

[BRAND VOICE]
{brand-voice.md — vollständig eingefügt}

[TARGET PERSONA]
{target-persona.md — vollständig eingefügt}

[COMPETITOR ANALYSIS]
{competitor-analysis.md — Kernpunkte}

[VIRAL POST EXPERTISE]
{viral-post-expertise.md — vollständig eingefügt}

[LEARNING CONTEXT]
{Top-5-performende Posts der letzten 30 Tage mit Metriken}
{Soft-Signals aus der Balance-Matrix, z.B. "Hook-Typ X wurde 4x genutzt"}

[AUFGABE]
Erstelle einen Instagram-Post mit folgenden Vorgaben:
- Content Pillar: {user_auswahl}
- Thema: {oberthema} → {unterthema} → {kernaussage}
- Content Type: {single_post | carousel}
- Post-Mechanik: {mechanik_id} — Leitplanken: {aus post-mechanics-catalog}
- Image Template: {template_name} — Text-Zonen: {aus config.json}
- Ad-hoc: {ja/nein — wenn ja, freies Thema}

[OUTPUT-FORMAT]
Generiere zwei separate Outputs:

A) SLIDE-TEXT:
- Pro Slide: Zone-ID + Text
- Beachte max_lines pro Zone aus der Template-Config
- Hook auf Slide 1 gemäß gewählter Mechanik

B) CAPTION:
- Fließtext (max. 2200 Zeichen)
- CTA am Ende
- 5-15 Hashtags (Mix aus Nische + Reichweite)
```

### Dynamische Elemente
Der Master-Prompt bleibt strukturell fix. Folgende Teile werden pro Post dynamisch befüllt:
- Alle Config-Files (Brand Voice, Persona, etc.)
- Die User-Auswahl aus Schritt 2 (Pillar, Thema, Mechanik, Template)
- Learning-Kontext (letzte Performance-Daten, Balance-Warnungen)
- Template-Config (Text-Zonen mit max_lines, damit die AI die Textlänge einhält)

---

## 5. Post-Mechanik-Katalog

Jede Mechanik definiert **Leitplanken**, keine starren Strukturen. Die AI füllt frei innerhalb dieser Vorgaben.

### Beispiel-Mechaniken

**Provokative Frage**
- Hook: Muss eine Frage sein, die eine Annahme in Frage stellt
- Slides: min 3, max 7
- Aufbau-Leitplanke: Frage → Gegenposition → Auflösung/Antwort → CTA
- Gut für: Generate Demand

**Polarisierende Aussage**
- Hook: Starke These, die Widerspruch provoziert
- Slides: min 3, max 5
- Aufbau-Leitplanke: These → Begründung → Beweis/Beispiel → CTA
- Gut für: Generate Demand, Nurture Loyalty

**Storytelling**
- Hook: Persönlicher Einstieg oder Situation ("Letzte Woche ist mir etwas passiert...")
- Slides: min 5, max 10
- Aufbau-Leitplanke: Situation → Konflikt → Wendepunkt → Erkenntnis → CTA
- Gut für: Nurture Loyalty

**Listicle / How-To**
- Hook: Zahl + Versprechen ("5 Gründe warum..." / "3 Schritte zu...")
- Slides: min 4, max 8 (1 Punkt pro Slide)
- Aufbau-Leitplanke: Hook → Punkt 1...N → Zusammenfassung/CTA
- Gut für: Generate Demand, Convert Demand

**Myth-Busting**
- Hook: Weit verbreiteter Irrglaube als Aussage
- Slides: min 3, max 6
- Aufbau-Leitplanke: Mythos → Warum er falsch ist → Wahrheit → CTA
- Gut für: Generate Demand, Convert Demand

**Social Proof / Testimonial**
- Hook: Ergebnis oder Zitat des Kunden
- Slides: min 3, max 5
- Aufbau-Leitplanke: Ergebnis → Ausgangssituation → Lösung → CTA
- Gut für: Convert Demand

**Behind the Scenes**
- Hook: Exklusiver Einblick ("Was du nicht siehst...")
- Slides: min 3, max 7
- Aufbau-Leitplanke: Teaser → Prozess/Einblick → Erkenntnis → CTA
- Gut für: Nurture Loyalty

### Katalog-Erweiterung
Der Katalog ist offen — neue Mechaniken können jederzeit ergänzt werden. Jede Mechanik braucht mindestens: Hook-Regel, Slide-Range (min/max), Aufbau-Leitplanke, empfohlene Pillar-Zuordnung.

---

## 6. Instagram Story Tools Katalog

Zentral gepflegtes Input-File (`story-tools-catalog.json`), das alle verfügbaren Instagram Story Interactive Tools beschreibt. Wird vom System genutzt, um passende Tools für Stories zu empfehlen.

### Engagement-treibende Tools (Interaktion)

| Tool | Funktion | Empfohlen für | Engagement-Signal |
|------|----------|--------------|-------------------|
| **Poll** | 2-4 Antwortoptionen, User stimmt ab | Meinungen einholen, A/B-Tests, Aufmerksamkeit | Tap (Abstimmung) |
| **Quiz** | Multiple-Choice mit richtiger Antwort | Wissensvermittlung, Gamification, Myth-Busting | Tap (Antwort) |
| **Question** | Offenes Textfeld, User antwortet oder fragt | Community-Building, "Frag mich alles", Feedback | DM / Text-Reply |
| **Emoji Slider** | User schiebt Emoji auf Skala | Sentiment messen, spielerische Bewertung | Slide-Interaktion |
| **Add Yours** | Prompt, den andere User in ihrer Story beantworten | Viralität, UGC, Community-Challenges | Story-Chain (viral) |
| **Add Yours Music** | User teilen Songs zu einem Prompt | Community, Persönlichkeit zeigen | Story-Chain (viral) |
| **Reveal** | Bild blurred, nur sichtbar nach DM | DM-Boost, Exklusivität, Neugier | DM |
| **Countdown** | Timer zu Event, User setzt Reminder | Produkt-Launches, Events, Hype | Reminder-Subscription |
| **Challenge** | User nominieren und herausfordern | Viralität, Community-Aktivierung | Story-Weitergabe |

### Traffic- & Conversion-Tools

| Tool | Funktion | Empfohlen für | Engagement-Signal |
|------|----------|--------------|-------------------|
| **Link** | Klickbarer Link zu externer URL | Shop, Blog, Landing Page | Link-Tap |
| **Product** | Klickbar zum Instagram Shop | Direktverkauf, Produkt-Highlight | Product-Tap → Purchase |
| **Mention** | Andere Accounts taggen | Kollaboration, Shoutouts, Influencer | Profil-Visit |

### Discoverability-Tools

| Tool | Funktion | Empfohlen für | Engagement-Signal |
|------|----------|--------------|-------------------|
| **Location** | Ort taggen, erscheint in Location-Feed | Lokale Reichweite, Events, Stores | Location-Page-Visit |
| **Hashtag** | Hashtag klickbar, führt zur Hashtag-Seite | Themen-Discovery, Kampagnen | Hashtag-Page-Visit |

### Atmosphäre & Branding

| Tool | Funktion | Empfohlen für | Engagement-Signal |
|------|----------|--------------|-------------------|
| **Music** | Song mit Lyrics-Anzeige | Stimmung, Markenidentität | — (passiv) |
| **Cutout** | Eigene Sticker aus Fotos | Branding, Wiedererkennung | — (passiv) |
| **Frames** | Polaroid-Look, Handy schütteln zum Aufdecken | Spielerisch, Retro-Ästhetik | Shake-Interaktion |

### Empfehlungslogik
Das System empfiehlt Story-Tools basierend auf:
1. **Post-Mechanik:** z.B. Myth-Busting → Quiz ("Wusstest du, dass...?"), Provokative Frage → Poll
2. **Content Pillar:** z.B. Convert Demand → Link + Product, Generate Demand → Add Yours + Poll
3. **Performance-Daten:** Welche Tools hatten zuletzt die höchste Engagement-Rate?
4. **Rotation:** Soft-Signal wenn ein Tool zu häufig genutzt wird

---

## 7. Learning System & Performance Tracking

### Daten-Architektur: Dual-Source-Modell

Jede Metrik hat zwei mögliche Quellen: **Manueller Input** und **API**. Manuell ist immer verfügbar. Wenn die Instagram Graph API angebunden ist, überschreibt sie die manuellen Werte für die Felder, die sie liefern kann. Manuelle Felder, die die API nicht abdeckt, bleiben immer manuell.

### Feed-Post Tracking

**Metadaten (werden bei Post-Erstellung automatisch gespeichert):**

| Feld | Quelle | Beschreibung |
|------|--------|-------------|
| Post-ID | Auto | Interne ID + Instagram Media-ID (nach Veröffentlichung) |
| Post-Datum | Auto | Erstellungs- und Veröffentlichungsdatum |
| Content Pillar | User-Auswahl | Generate Demand / Convert Demand / Nurture Loyalty |
| Oberthema / Unterthema / Kernaussage | User-Auswahl | Aus Themen-File |
| Content Type | User-Auswahl | Single Post / Carousel |
| Anzahl Slides | Auto | Bei Carousel |
| Post-Mechanik | User-Auswahl | Aus Post-Mechanik-Katalog |
| Image Template | User-Auswahl | Template-Name + Version |
| Ad-hoc Flag | User-Auswahl | ja/nein |

**Performance-Metriken (einmalig nach 7 Tagen):**

| Metrik | Manuell | API | Hinweis |
|--------|---------|-----|---------|
| Reach | ✅ | ✅ (überschreibt) | API via `/media/insights` |
| Impressions | ✅ | ✅ (überschreibt) | API via `/media/insights` |
| Likes | ✅ | ✅ (überschreibt) | |
| Comments | ✅ | ✅ (überschreibt) | Anzahl, nicht Inhalt |
| Shares | ✅ | ✅ (überschreibt) | Seit 2025 via API verfügbar |
| Saves | ✅ | ✅ (überschreibt) | |
| Revenue-Attribution | ✅ | ❌ | Immer manuell (Link-Tracking, Gutscheincodes, etc.) |
| Qualitative Notizen | ✅ | ❌ | Freitext: Was war besonders? Warum hat es funktioniert/nicht? |

Performance wird **einmalig nach 7 Tagen** erhoben — das ist der stabilste Wert und reicht für alle Entscheidungen. Die Engagement-Rate wird nicht fest definiert, sondern ergibt sich aus den Daten. Welche Kombination (z.B. Saves/Reach vs. Gesamtengagement/Reach) am aussagekräftigsten ist, zeigt sich über Zeit.

### Story Tracking

**Wichtig:** Story-Insights sind über die API nur **24 Stunden** verfügbar. Lösung: Webhook auf `story_insights` einrichten, der Daten automatisch bei Ablauf speichert. Alternativ: manuell innerhalb von 24h eintragen.

**Metadaten (pro Story, verknüpft mit Feed-Post):**

| Feld | Quelle | Beschreibung |
|------|--------|-------------|
| Verknüpfter Feed-Post | Auto | Referenz zum zugehörigen Feed-Post |
| Story-Typ | User-Auswahl | Teaser / Verweis / Vertiefung / Behind the Scenes |
| Interactive Tool(s) | User-Auswahl | Aus Story-Tools-Katalog (z.B. Poll, Quiz, Question) |
| Timing | User-Auswahl | Vor / gleichzeitig / nach dem Feed-Post |

**Performance-Metriken (einmalig, innerhalb 24h):**

| Metrik | Manuell | API | Hinweis |
|--------|---------|-----|---------|
| Impressions | ✅ | ✅ (überschreibt) | Wie oft die Story angezeigt wurde |
| Reach | ✅ | ✅ (überschreibt) | Unique Viewer |
| Replies | ✅ | ✅ (überschreibt) | DMs als Reaktion auf die Story |
| Taps Forward | ✅ | ✅ (überschreibt) | User tippt zur nächsten Story |
| Taps Back | ✅ | ✅ (überschreibt) | User tippt zurück (= Interesse) |
| Exits | ✅ | ✅ (überschreibt) | User verlässt Stories |
| Sticker Taps | ✅ | ⚠️ (teilweise) | API liefert aggregierte Zahl, nicht Detail-Ergebnisse |

### Manueller Input: Workflow

Wenn keine API angebunden ist, zeigt das System **7 Tage nach Veröffentlichung** eine Erinnerung mit einem einfachen Eingabeformular:

```
┌─────────────────────────────────────┐
│  Post: "5 Gründe warum..." (10.03.) │
│  Messzeitpunkt: 7d                  │
│                                     │
│  Reach:        [________]           │
│  Impressions:  [________]           │
│  Likes:        [________]           │
│  Comments:     [________]           │
│  Shares:       [________]           │
│  Saves:        [________]           │
│  Revenue:      [________] (optional)│
│  Notizen:      [________________]   │
│                                     │
│  [Speichern]  [Später erinnern]     │
└─────────────────────────────────────┘
```

Für Stories: Gleiches Formular (ohne Shares/Saves, mit Taps/Exits), aber innerhalb von **24h**.

### API-Anbindung: Überschreibungslogik

Wenn die Instagram Graph API angebunden wird:
1. API-Werte überschreiben manuelle Werte für alle Felder, die die API liefern kann
2. Manuelle Felder (Revenue, Qualitative Notizen) bleiben immer manuell
3. Das Eingabeformular zeigt dann nur noch die manuellen Felder
4. API-Daten werden mit einem "API"-Badge markiert, manuelle Daten mit "Manuell"
5. Bei Diskrepanz gilt die API — der manuelle Wert wird als Override-Option erhalten

### Posting-Frequenz

Keine Soll-Vorgabe. Das System trackt nur, was tatsächlich gepostet wird. Die Pillar-Balance wird als **prozentualer Anteil der letzten N Posts** berechnet (z.B. letzte 20 Posts), nicht über einen festen Zeitraum.

### Ad-hoc Content

Spontane Posts (Events, Trends, Reaktionen auf Aktuelles) erhalten ein **Ad-hoc-Flag**:
- Werden im Post-Log normal getrackt (Performance, Template, Mechanik)
- Zählen **nicht** in die Themen-Balance-Berechnung
- Haben keine Themen-Zuordnung aus dem Themen-File (freies Thema)
- Zählen aber in die Pillar-Balance (jeder Post hat einen Pillar)

### Themen-Priorisierung

Keine manuelle Gewichtung. Das Learning System lernt selbst, welche Themen performen:
- Initial: Alle Themen sind gleich gewichtet
- Über Zeit: Das System erkennt Muster (z.B. "Thema X hat 2x höhere Engagement-Rate als Thema Y")
- Empfehlungen basieren auf Performance-Daten + Balance (kein Thema wird ignoriert, auch wenn es schlechter performt — Rotation bleibt erhalten)

### Output: Balance-Matrix
Eine Übersichtsmatrix, die alle steuerbaren Input-Faktoren trackt:

- **Content-Type-Verteilung:** Verhältnis Single Post vs. Carousel
- **Themen-Verteilung:** Wie oft wurde welches Oberthema / Unterthema behandelt?
- **Hook-Typ-Verteilung:** Wie oft welche Mechanik (Frage, Aussage, Story, etc.)?
- **Pillar-Verteilung:** Ist-Mix vs. Soll-Mix (Generate / Convert / Nurture)
- **Template-Verteilung:** Welche Templates wie häufig?
- **Story-Tool-Verteilung:** Welche Interactive Tools wie oft eingesetzt? Welche Engagement-Rate pro Tool?
- **Performance pro Variable:** Durchschnittliche Metriken pro Thema, pro Hook-Typ, pro Pillar, pro Template, pro Story-Tool

### Steuerungsmechanik
- **Soft-Signals:** Bei Übergewicht einer Variable warnt das System (z.B. "Thema X wurde 4x in 2 Wochen behandelt — rotieren?")
- **Datengetriebene Empfehlungen:** Das System priorisiert Post-Typen und Mechaniken, die nachweislich performen, unter Berücksichtigung der Balance

### Performance-KPIs (Was hat funktioniert?)
Drei Kern-Metriken:
1. **Revenue** — direkte und attribuierte Umsatzwirkung
2. **Social Interaction** — Engagement (Likes, Comments, Shares, Saves, Replies)
3. **Reach** — Impressions, Unique Reach

---

## 8. File-Architektur

```
/content-system/
├── config/
│   ├── brand-voice.json             # Tonalität & Sprachstil (via Settings-Editor)
│   ├── brand-guidance.json          # Fonts, Colors, Layout-Regeln (via Settings-Editor)
│   ├── target-persona.json          # Zielgruppe (via Settings-Editor)
│   ├── competitor-analysis.json     # Differenzierung (via Settings-Editor)
│   ├── content-pillars.json         # Soll-Verteilung (via Settings-Editor)
│   ├── themes.json                  # Hierarchisch: Oberthema → Unter → Aussagen (via Baum-Editor)
│   ├── post-mechanics-catalog.json  # Mechaniken mit Leitplanken (via Settings-Editor)
│   ├── story-tools-catalog.json     # Story Interactive Tools (via Settings-Editor)
│   ├── viral-post-expertise.json    # Hook-Formeln, virale Mechaniken (via Rich-Text-Editor)
│   └── settings-history/            # Automatische Versionierung aller Änderungen
│       ├── 2026-03-10T14:22:00_brand-voice.json
│       └── ...
│
├── prompts/
│   └── master-prompt.md            # Master-Prompt-Template (via Code-Editor, selten editiert)
│
├── templates/
│   ├── single-post/
│   │   ├── bold-quote/                    # Beispiel: Farb-Template (kein Hintergrundbild)
│   │   │   ├── template.html              # HTML/CSS: Brand-Farbe als Hintergrund + Text-Zonen
│   │   │   └── config.json                # Text-Zonen, Overlay (disabled), Schutzzonen
│   │   ├── image-text-overlay/            # Beispiel: Bild-Template (festes Hintergrundbild)
│   │   │   ├── background.png             # Das Design/Foto als Hintergrund
│   │   │   ├── template.html              # HTML/CSS: referenziert background.png + Text-Overlay
│   │   │   └── config.json                # Text-Zonen, Overlay-Stärke, Schutzzonen
│   │   └── assets/                        # Shared Assets (Logos, Icons, Fonts)
│   ├── carousel/
│   │   ├── standard/
│   │   │   ├── slide-cover.html           # Erstes Slide (Hook)
│   │   │   ├── slide-cover-bg.png         # Optional: Hintergrundbild für Cover
│   │   │   ├── slide-content.html         # Content Slides
│   │   │   ├── slide-cta.html             # Letztes Slide (Brand + Link)
│   │   │   ├── slide-cta-bg.png           # Optional: Hintergrundbild für CTA-Slide
│   │   │   └── config.json                # Config gilt für alle Slides des Sets
│   │   └── assets/
│   └── story/                             # Story-Templates (1080×1920, 9:16)
│       ├── teaser/
│       │   ├── template.html              # Teaser-Story
│       │   └── config.json                # Text-Zonen + Tool-Platzhalter
│       ├── reference/
│       │   ├── template.html              # Verweis-Story
│       │   └── config.json
│       └── assets/
│
├── data/
│   └── learning.db                 # SQLite-Datenbank (alle Learning-Daten)
│                                    # Tabellen: posts, stories, story_tools,
│                                    # performance_feed, performance_story,
│                                    # balance_matrix_cache
│
└── output/
    └── drafts/                     # Generierte Post-Entwürfe
        ├── 2026-03-10_post/
        │   ├── slide-1.png         # Feed-PNG (1080×1350) — upload-ready
        │   ├── slide-2.png
        │   ├── caption.txt         # Caption + Hashtags — zum Kopieren beim Posten
        │   ├── story-1.png         # Story-PNG (1080×1920) — falls Stories generiert
        │   └── story-2.png
        │
        # Metadaten (Pillar, Thema, Mechanik, etc.) → direkt in SQLite
        # Slide-Texte → leben in der App, kein separates File
```

---

## 9. Template Config Spezifikation (config.json)

Jedes Template bekommt eine `config.json`, die dem Rendering-System sagt, wo Text hin darf, wo nicht, und wie der Overlay aussieht. Diese Config wird beim Bild-Rendering (Schritt 4) automatisch ausgelesen.

### Beispiel config.json

```json
{
  "name": "Image + Text Overlay",
  "type": "single-post",
  "dimensions": { "width": 1080, "height": 1350 },

  "text_zones": [
    {
      "id": "hook",
      "label": "Hook / Headline",
      "position": { "top": "8%", "left": "8%", "width": "84%", "height": "25%" },
      "font_role": "headline",
      "alignment": "left",
      "max_lines": 3
    },
    {
      "id": "body",
      "label": "Body Text",
      "position": { "top": "38%", "left": "8%", "width": "84%", "height": "40%" },
      "font_role": "body",
      "alignment": "left",
      "max_lines": 8
    },
    {
      "id": "cta",
      "label": "Call to Action",
      "position": { "bottom": "8%", "left": "8%", "width": "84%", "height": "10%" },
      "font_role": "cta",
      "alignment": "center",
      "max_lines": 1
    }
  ],

  "no_text_zones": [
    {
      "label": "Produktbild-Bereich",
      "position": { "top": "35%", "left": "55%", "width": "40%", "height": "45%" },
      "reason": "Produktfoto sichtbar halten"
    }
  ],

  "overlay": {
    "enabled": true,
    "color": "#000000",
    "opacity": 0.55,
    "gradient": {
      "enabled": true,
      "direction": "to bottom",
      "stops": [
        { "color": "rgba(0,0,0,0.7)", "position": "0%" },
        { "color": "rgba(0,0,0,0.1)", "position": "50%" },
        { "color": "rgba(0,0,0,0.6)", "position": "100%" }
      ]
    }
  },

  "background": {
    "type": "image",
    "file": "background.png"
  }
}
```

### Erklärung der Felder

**text_zones** — Definiert, wo Text platziert werden darf:
- `font_role` verweist auf die Brand Guidance (headline → Font A, body → Font B, cta → Font C)
- `max_lines` begrenzt die Textlänge pro Zone — das System kürzt oder warnt
- Position in Prozent, damit es bei verschiedenen Aspect Ratios skaliert

**no_text_zones** — Schutzzonen, in denen kein Text liegen darf:
- Typisch für Templates mit Produktfotos, Portraits oder visuellen Elementen
- Das Rendering-System prüft automatisch, dass kein Text in diese Bereiche fällt

**overlay** — Steuert den Overlay-Layer zwischen Hintergrundbild und Text:
- `opacity`: 0.0 (kein Overlay) bis 1.0 (komplett abgedeckt)
- Optional als Gradient (z.B. oben und unten dunkel für Lesbarkeit, Mitte transparent für Bild)
- Wird nur angewendet, wenn `background.type` = "image"

**background** — Definiert, was hinter dem Text liegt:

| type | file | Beschreibung |
|------|------|-------------|
| `"image"` | `"background.png"` | Festes Hintergrundbild (Foto, Design, AI-generiert). Datei liegt im Template-Ordner. |
| `"color"` | — | Einfarbiger Hintergrund. Farbe kommt aus Brand Guidance (oder Override in config). |
| `"gradient"` | — | Farbverlauf als Hintergrund. Farben aus Brand Guidance. |

Bei `"image"` wird das Overlay angewendet, bei `"color"` und `"gradient"` ist Overlay deaktiviert (Text steht direkt auf der Farbe).

---

## 10. Tech Stack

### Phase 1: Lokale Desktop-App (Electron)

| Layer | Technologie | Zweck |
|-------|------------|-------|
| **UI** | React + Tailwind CSS | Frontend (Settings-Editor, Workflow-UI, Dashboard) |
| **Desktop Shell** | Electron | .exe starten, kein Dev-Server nötig, verteilbar an Beta-Tester |
| **Bild-Rendering** | Puppeteer (im Electron main process) | HTML/CSS Templates → PNG (1080×1350 / 1080×1920) |
| **Settings/Config** | Lokales Dateisystem (JSON) | Alle Settings-Files, Templates |
| **Learning-Daten** | SQLite (eine Datei: learning.db) | Post-Log, Performance-Daten, Story-Tools, Balance-Matrix |
| **AI Text-Generierung** | Claude API | Post-Texte + Story-Texte generieren mit Settings als Input |

**Warum SQLite für Learning-Daten?**
- Eine Datei, kein Server — passt zu Electron
- Volle SQL-Query-Power ("alle Myth-Busting Posts sortiert nach Saves")
- Performant bei wachsenden Datenmengen (Tausende Posts kein Problem)
- Migrationspfad zu PostgreSQL ist trivial (gleiche Queries, anderer Treiber)

**Warum JSON für Settings?**
- Selten geändert, kleine Dateien
- Einfach versionierbar (Timestamp-Snapshots)
- Leicht lesbar und debuggbar

**Warum Electron?**
- Doppelklick auf .exe → App läuft, kein Terminal nötig
- Puppeteer läuft nativ im Node.js-Backend (Bild-Rendering lokal)
- Lokaler Dateisystem-Zugriff für Templates, Configs, generierte PNGs
- Beta-Tester bekommen eine .exe, installieren nichts
- React-Code ist 1:1 wiederverwendbar für spätere Web-App

### Phase 2: Web-App (späterer Verkauf)

| Änderung | Von → Nach |
|----------|-----------|
| Desktop Shell | Electron → entfällt |
| Backend | Electron main process → Node.js Server (Express/Fastify) |
| Bild-Rendering | Lokaler Puppeteer → Cloud-Puppeteer (z.B. Browserless, AWS Lambda) |
| Settings | Lokales JSON → Datenbank (PostgreSQL / Supabase) |
| Learning-Daten | SQLite → PostgreSQL (gleiche Queries, anderer Treiber) |
| Auth | Keine → User-Auth + Multi-Tenant |
| Hosting | Lokal → Vercel (Frontend) + Cloud-Server (Backend) |

**Migrationspfad:** Der gesamte React-Code und die Business-Logik bleiben identisch. Nur die I/O-Schicht (Dateisystem → DB, lokaler Puppeteer → Cloud) wird getauscht.

---

## 11. Offene Punkte / Nächste Schritte

### A) Settings-Editor bauen (Electron)
- [ ] Settings-Editor UI: Alle 10 Bereiche als Tabs/Sections
- [ ] Brand Voice: Fragebogen-Flow + Post-Upload für automatische Voice-Ableitung
- [ ] Themen-Hierarchie: Baum-Editor (Add/Edit/Remove/Drag & Drop)
- [ ] Competitor Analysis: Listen-Editor (pro Wettbewerber)
- [ ] Content Pillars: Slider für Prozent-Verteilung
- [ ] Brand Guidance: Color Picker, Font Dropdowns, Layout-Regel-Builder
- [ ] Target Persona: Strukturiertes Formular
- [ ] Post-Mechanik-Katalog: Formular pro Mechanik (Hook-Regel, Slide-Range, etc.)
- [ ] Story-Tools-Katalog: Vorbefüllte Liste, editierbar
- [ ] Viral Post Expertise: Rich-Text-Editor
- [ ] Settings-Versionierung implementieren (automatisches Backup bei jeder Änderung)

### B) Templates & Rendering
- [ ] HTML/CSS Templates für Single Posts + Carousel Slides entwickeln
- [ ] Story-Templates (1080×1920) entwickeln (Teaser, Verweis, Vertiefung)
- [ ] Template Config Editor integrieren (Drag & Drop Zonen-Editor)
- [ ] Puppeteer-Rendering-Pipeline aufsetzen

### C) Post-Generierungs-Workflow
- [ ] Master-Prompt-Template schreiben und testen
- [ ] Claude API-Anbindung (Text-Generierung)
- [ ] Caption-Regeln definieren (Länge, Hashtag-Strategie, CTA-Formeln)
- [ ] Story-Empfehlungslogik (Mechanik → Tool-Mapping)

### D) Performance-Tracking
- [ ] Manuelles Eingabeformular (7d-Erinnerung)
- [ ] Instagram Graph API-Anbindung (Feed-Post Metriken)
- [ ] Instagram Stories API / Webhook (24h-Fenster)
- [ ] Learning System: Balance-Matrix-Berechnung

### E) Infrastruktur
- [ ] Electron-Projekt aufsetzen (React + Tailwind + Puppeteer)
- [ ] Lokale JSON-Speicherschicht für Settings (Read/Write + Versionierung)
- [ ] SQLite-Datenbank aufsetzen (Schema: posts, stories, story_tools, performance_feed, performance_story)
- [ ] Template Config Editor als erste Electron-Komponente integrieren
