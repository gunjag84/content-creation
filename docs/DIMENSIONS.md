# Content Dimensions - LEBEN.LIEBEN

MECE taxonomy for Instagram content creation. Every post is tagged with one value per required dimension. The combination engine uses these to ensure variety across the feed.

## Overview

| Dimension | Code | Required | Count | Purpose |
|-----------|------|----------|-------|---------|
| Area | L1-L9 | Yes | 9 | What life area does this post cover? |
| Approach | A1-A5 | No | 5 | What solution angle does it offer? |
| Method | M1-M15 | Yes | 15 | How is the post structured? |
| Tonality | T1-T5 | Yes | 5 | What emotional register? |
| Pillar | - | Yes | 3 | What business goal does it serve? |

---

## Areas (Lebensbereiche)

The "what" of each post. Which slice of the audience's life are we entering?

| ID | Name | Description | Primary Pillar |
|----|------|-------------|----------------|
| L1 | Familienleben | Partnerschaft, Kinder, das Miteinander als Familie. Verbindung, Distanz, gemeinsame Momente. | Generate Demand |
| L2 | Mentale Überlastung | Mental Load, Schuldgefühle, der Kopf der nie aufhört. Zwischen Job und Kindern zerrieben. | Generate Demand |
| L3 | Alltagschaos | Zeitknappheit, Multitasking, Pendelzeit, unsichtbare Arbeit. Der Wettlauf gegen die Uhr. | Generate Demand |
| L4 | Digitale Dauerbeschallung | Smartphone-Sucht, Scrollen statt Schlafen, Messenger-Chaos. Immer erreichbar, nie abgeschaltet. | Generate Demand |
| L5 | Selbstbild & Identität | Selbstwert, Rollenkonflikte, verschüttete Leidenschaften. Wer bin ich jenseits meiner Rollen? | Generate Demand |
| L6 | Jahreszeiten & Phasen | Saisonale Themen, Lebensphasen (Kleinkind/Schulkind/Teenager), Übergänge, Neuanfänge. | Generate Demand |
| L7 | Wissenschaft & Fakten | Glücksforschung, Studien, Dankbarkeitsforschung. Faktenbasierte Erkenntnisse. | Generate / Convert |
| L8 | Produkt & Ritual | Das Journal, die WEIL3-Methode, Unboxing, Anwendung, Integration in den Alltag. | Convert Demand |
| L9 | Marke & Gründerin | Jules Geschichte, Behind the Scenes, Produktentwicklung, Community, Nachhaltigkeit. | Nurture Loyalty |

**Derived from:** 5 Oberthemen in `Input files/lebenlieben-themen.md`, split into 9 MECE areas for finer balance tracking.

**Mapping from old themes:**
- Alltag berufstätiger Mütter -> L2, L3 (split by subtopic)
- Wissenschaft des Glücks -> L7
- Analoge Rituale als Gegenbewegung -> covered via Approaches (A2-A4)
- Produkt und Erlebnis -> L8
- Marke und Community -> L9

---

## Approaches (Lösungsansätze)

The "how to solve it" angle. Optional per post - not every post offers a solution (awareness posts may just validate the pain).

| ID | Name | Description |
|----|------|-------------|
| A1 | Dankbarkeit | Dankbarkeit als Hebel für Wohlbefinden. WEIL3-Methode, die Frage hinter der Frage. |
| A2 | Journaling & Schreiben | Stift auf Papier, haptisches Erleben, Gedanken sortieren. Das Journal als Ritual, nicht als To-do. |
| A3 | Achtsamkeit & Routinen | Morgen- und Abendrituale, kleine kraftvolle Pausen, bewusst langsamer machen. |
| A4 | Digital Detox | Handy weglegen als radikaler Akt der Selbstfürsorge. Analog als bewusste Rebellion. |
| A5 | Selbstakzeptanz | Du bist genug. Kein Optimierungsdruck, keine Perfektion. Wertschätzung für das was ist. |

**When to use:** Posts that go beyond describing a problem and point toward a way forward. A post about L2 (Mentale Überlastung) might pair with A3 (Achtsamkeit) or A5 (Selbstakzeptanz). A pure awareness post about L4 (Digitale Dauerbeschallung) might have no approach at all.

---

## Methods (Methoden)

The storytelling structure. How is the post built? Some methods have format constraints (single-image only or carousel only).

| ID | Name | Description | Format |
|----|------|-------------|--------|
| M1 | Provokante These | Direkte, zugespitzte Behauptung als Hook. Polarisiert, stoppt den Scroll. | Both |
| M2 | Frage & Antwort | Frage als Hook die zum Nachdenken zwingt, Antwort liefert den Mehrwert. | Both |
| M3 | Persönliche Geschichte | Jule erzählt aus ihrem Alltag. Szene zuerst, Erkenntnis danach. | Both |
| M4 | Vorher / Nachher | Transformation zeigen. Kontrast zwischen Problem und Lösung. | Both |
| M5 | Testimonial | Echte Geschichten von Nutzerinnen. Social Proof, UGC, Rezensionen. | Both |
| M6 | Zitat & Kommentar | Starkes Zitat als Aufhänger, persönlicher Kommentar als Einordnung. | Single only |
| M7 | Faktencheck | Wissenschaftlicher Fakt + überraschender Twist. Daten schaffen Glaubwürdigkeit. | Both |
| M8 | Liste | Listicle: 3/5/7 Dinge die... Leicht konsumierbar, hoher Save-Wert. | Both |
| M9 | Mythos vs. Realität | Verbreitete Annahme widerlegen. Überraschungseffekt. | Both |
| M10 | Kontroverse Meinung | Meinung die nicht jeder teilt. Kommentare provozieren, Diskussion anregen. | Both |
| M11 | Anleitung | Schritt-für-Schritt How-to. Praktischer Mehrwert, sofort umsetzbar. | Carousel only |
| M12 | Karussell-Story | Mehrteiliger narrativer Bogen über mehrere Slides. Spannung aufbauen. | Carousel only |
| M13 | Call to Action | Direkter Conversion-Post. Produkt zeigen, Nutzen erklären, einladen. | Single only |
| M14 | Behind the Scenes | Blick hinter die Kulissen. Produktentwicklung, Material, Entscheidungen. | Both |
| M15 | Beobachtung | Alltagsbeobachtung als Aufhänger. Etwas Kleines gesehen, größere Erkenntnis. | Both |

**Format constraints** are enforced in the wizard: when you pick "Single", carousel-only methods disappear from the dropdown and vice versa.

---

## Tonalities (Tonalität)

The emotional register of the post. Tracked for variety - a feed that is only T1 (emotional) gets monotonous.

| ID | Name | Description | When to use |
|----|------|-------------|-------------|
| T1 | Emotional | Warm, berührend, verletzlich. Herz über Kopf. | Family moments, personal breakthroughs, vulnerability |
| T2 | Humorvoll | Leicht, witzig, augenzwinkernd. Alltag mit Humor. | Relatable chaos, everyday absurdity, scroll-stoppers |
| T3 | Sachlich | Faktenbasiert, ruhig, informativ. Daten sprechen lassen. | Science posts, statistics, method explanations |
| T4 | Provokant | Kantig, herausfordernd, unbequem. Reibung erzeugen. | Myth-busting, hot takes, challenging assumptions |
| T5 | Ermutigend | Aufbauend, stärkend, du schaffst das. Energie geben. | Motivation, self-worth, community building |

**Note:** Tonality applies to the body text and caption. Hooks follow their own rules and may be sharper than the post's overall tonality (per content strategy: "Hook-Regeln folgen NICHT der Brand Voice - dürfen schärfer sein").

---

## Blacklist Rules

Forbidden or discouraged dimension combinations. Hard = blocked in the wizard. Soft = warning shown but user can proceed.

| Rule | Severity | Reason |
|------|----------|--------|
| M13 (Call to Action) + T4 (Provokant) | Hard | Never sell with aggression. Product posts must invite, not push. |
| M5 (Testimonial) + T4 (Provokant) | Hard | Testimonials need warmth and trust, not edge. |
| L8 (Produkt & Ritual) + T4 (Provokant) | Hard | Product content must feel like an invitation, per brand voice. |
| M7 (Faktencheck) + T1 (Emotional) | Soft | Facts can carry emotion, but watch the balance. Data needs credibility. |

---

## Pillars (unchanged)

Business goal the post serves. Predates the MECE migration.

| Name | Target % | Purpose |
|------|----------|---------|
| Generate Demand | 65% | Awareness, reach, new followers. Pain + aspiration content. |
| Convert Demand | 25% | Drive purchases. Product, proof, ritual content. |
| Nurture Loyalty | 10% | Retain buyers. Community, behind-the-scenes, brand affinity. |

---

## Combination Examples

| Post idea | Area | Approach | Method | Tonality | Pillar |
|-----------|------|----------|--------|----------|--------|
| "Der Kopf der nie aufhört" - Mental Load Story | L2 | A5 | M3 | T1 | Generate |
| "3 Dinge die ich um 21 Uhr nicht mehr tue" | L4 | A4 | M8 | T2 | Generate |
| "40% deines Glücks hängen von einer Sache ab" | L7 | A1 | M7 | T3 | Convert |
| Jule's Kitchen Scene - WEIL3 Method | L1 | A1 | M3 | T1 | Convert |
| "Dankbarkeit ist kein Hashtag" - Myth-Busting | L7 | A1 | M9 | T4 | Generate |
| Unboxing + first entry ritual | L8 | A2 | M14 | T5 | Convert |
| Customer story: "Was sich nach 4 Wochen verändert hat" | L8 | A1 | M5 | T1 | Convert |
| "Dein Kalender ist voll. Dein Herz ist leer." | L5 | - | M1 | T4 | Generate |
