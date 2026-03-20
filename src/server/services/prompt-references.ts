/**
 * Reference data for prompt assembly.
 * Ported from the create-content skill's reference files:
 * - method-structures.md -> methodStructures
 * - hook-formulas.md -> hookFormulas
 * - anti-patterns.md -> antiPatterns
 *
 * Source of truth: ~/.claude/skills/.on-demand/create-content/references/
 * After editing skill files, re-port changes here.
 */

/** Structural template per method - defines the content arc across slides */
export const methodStructures: Record<string, { core: string; carousel: string; single: string; arc: string; keyRule?: string }> = {
  'M1 Provokante These': {
    core: 'Bold claim that provokes agreement or disagreement. Evidence builds credibility. Twist reframes.',
    carousel: `- [S1] Hook: The provocative claim. Short, direct, no softening. Max 10 words.
- [S2] Why most people believe the opposite (the conventional wisdom)
- [S3] Evidence/scene that challenges the assumption (personal story or data)
- [S4] The twist - what's actually true (the reframe)
- [S5+] Practical implication for the reader's life
- [Last] CTA matching pillar`,
    single: `- Hook: The provocative claim
- Body: Quick evidence + twist + implication
- CTA: Pillar-matched`,
    arc: 'Provocation -> "Wait, really?" -> Recognition -> New perspective'
  },
  'M2 Frage & Antwort': {
    core: 'A question the reader asks herself but never says out loud. The answer delivers real value.',
    carousel: `- [S1] Hook: The question. Must hit a nerve.
- [S2] Why this question matters (validate the reader's experience)
- [S3-4] The answer, built up with scene or evidence
- [S5+] What changes when you know this
- [Last] CTA`,
    single: `- Hook: The question
- Body: Short validation + answer + shift
- CTA: Pillar-matched`,
    arc: 'Recognition -> Validation -> Insight -> Relief or motivation'
  },
  'M3 Persoenliche Geschichte': {
    core: 'Storytelling. A specific scene that the reader can see, feel, and recognize from her own life.',
    carousel: `- [S1] Hook: Drop into the scene. Who, where, what - first line. No setup.
- [S2] The scene continues - sensory details, emotion, what happened
- [S3] The moment of recognition or tension (the turn)
- [S4] The insight - what Jule realized
- [S5] Bridge to reader - shared experience without generic phrases
- [Last] CTA`,
    single: `- Hook: Scene start (time, place, one vivid detail)
- Body: Scene -> turn -> insight -> bridge
- CTA: Pillar-matched`,
    arc: '"I\'m there" -> Tension -> Recognition -> "That\'s me too"',
    keyRule: 'Start IN the scene, not before it. "Letzte Woche stand ich um 6:30 in der Kueche" not "Ich moechte euch eine Geschichte erzaehlen."'
  },
  'M4 Vorher / Nachher': {
    core: 'Transformation. Show the contrast between before and after. The reader must see herself in "before."',
    carousel: `- [S1] Hook: The "before" state in one sharp image. Relatable, specific.
- [S2] Deepen the "before" - what it felt like, what the daily reality was
- [S3] The turning point (what changed - ritual, realization, product)
- [S4] The "after" - same daily reality, different experience
- [S5] What made the difference (specific, not vague)
- [Last] CTA`,
    single: `- Hook: The "before" state
- Body: Before -> turning point -> after -> what made the difference
- CTA: Pillar-matched`,
    arc: '"That\'s my life" -> Pain/exhaustion -> Hope -> "I want that too"'
  },
  'M5 Testimonial': {
    core: 'Real user stories. Social proof through authentic experience, not marketing claims.',
    carousel: `- [S1] Hook: One powerful sentence from the testimonial. In quotes.
- [S2] Who this person is (relatable details - not name/age, but situation)
- [S3] Her "before" story
- [S4] What she did / what changed
- [S5] Her own words about the result
- [Last] CTA (invitation, not sell)`,
    single: `- Hook: The most powerful quote
- Body: Brief context + her story + result in her words
- CTA: Soft invitation`,
    arc: '"Someone like me" -> Her story -> Her words -> Trust',
    keyRule: "Use the person's actual language. No polishing. Imperfect quotes are more credible."
  },
  'M6 Zitat & Kommentar': {
    core: "A powerful quote as a hook, Jule's personal commentary as the value.",
    carousel: '',
    single: `- Hook: The quote. Attributed. Short and punchy.
- Body: Jule's personal reaction - what this means to her, a specific moment it applied
- CTA: Pillar-matched`,
    arc: 'Quote impact -> Personal meaning -> Reader connection',
    keyRule: 'The commentary must be personal, not generic. "Dieser Satz hat mich letzte Woche getroffen, als..." not "Dieses Zitat zeigt uns, dass..."'
  },
  'M7 Faktencheck': {
    core: 'Scientific fact with a surprising twist. Credibility through data, engagement through unexpectedness.',
    carousel: `- [S1] Hook: The surprising number or claim.
- [S2] Source/context for the fact (keep it brief, name the study)
- [S3] What this means in everyday life (translate the data into a scene)
- [S4] The surprising implication (the twist most people don't expect)
- [S5+] Practical application - what the reader can do with this
- [Last] CTA`,
    single: `- Hook: The fact
- Body: Source + everyday translation + surprise twist + application
- CTA: Pillar-matched`,
    arc: '"Wait, really?" -> Credibility -> "Oh, that changes things" -> Empowerment',
    keyRule: 'Science is mentioned casually, never lecturing. "Forscherinnen haben herausgefunden..." not "Studien belegen eindeutig, dass..."'
  },
  'M8 Liste': {
    core: 'Listicle format. High save value. Each item must deliver standalone value.',
    carousel: `- [S1] Hook: Curiosity-Gap Hook bevorzugt. Der Hook soll Neugier wecken, nicht die Liste ankuendigen.
- [S2-N] One item per slide. Each with: headline + short explanation + emotional punch. Wiederkehrender Phrasen-Anker: Jeder Content-Slide beginnt mit dem gleichen Satzanfang, der die Slides rhythmisch verbindet (z.B. "Seitdem mein Handy in der Kueche schlaeft:").
- [Last] Summary CTA or "Welcher Punkt trifft Dich am meisten?"`,
    single: `- Hook: The list promise
- Body: Items with brief explanations. Breathing room between items.
- CTA: "Speicher Dir das" (lists have high save rates)`,
    arc: 'Curiosity -> Surprise on each item -> Save value',
    keyRule: 'Each item must hit differently. Not 5 variations of the same point. Surprise on at least 2 of 5. Der wiederkehrende Phrasen-Anker auf jedem Slide erzeugt Rhythmus und macht die Slides als Serie erkennbar.'
  },
  'M9 Mythos vs. Realitaet': {
    core: 'Debunk a common belief. The surprise creates engagement, the truth creates value.',
    carousel: `- [S1] Hook: The myth, stated as if true.
- [S2] Why people believe this (validate the skepticism)
- [S3] The reality - data, experience, or logic that debunks it
- [S4] What this means for the reader
- [S5+] Practical reframe
- [Last] CTA`,
    single: `- Hook: The myth
- Body: Validation of skepticism -> reality -> what it means -> reframe
- CTA: Pillar-matched`,
    arc: '"Yeah, I thought so too" -> "Hmm, really?" -> "Oh, I was wrong" -> "Good to know"'
  },
  'M10 Anleitung': {
    core: 'Step-by-step how-to. Practical, immediately actionable. High save value.',
    carousel: `- [S1] Hook: Problem statement + promise of solution.
- [S2] Step 1 - with concrete instruction
- [S3] Step 2
- [S4] Step 3
- [S5] What changes when you do this (the result promise)
- [Last] CTA - "Speicher Dir das und probier es heute Abend aus"`,
    single: '',
    arc: 'Problem -> Steps -> Result promise',
    keyRule: 'Steps must be specific enough to follow immediately. "Schreib auf, wofuer Du heute dankbar bist" not "Praktiziere Dankbarkeit."'
  },
  'M11 Call to Action': {
    core: 'Direct conversion post. Product visible, benefit clear, invitation warm.',
    carousel: '',
    single: `- Hook: The need/desire the product fulfills. NOT the product name.
- Body: What the product does for you (benefit, not feature). One concrete scene of use.
- CTA: Warm invitation. "Wenn Du magst, findest Du es im Shop. Link in Bio."`,
    arc: 'Need -> Benefit -> Scene -> Invitation',
    keyRule: 'Even conversion posts lead with emotion, not product. The product is the answer, not the opening.'
  },
  'M12 Behind the Scenes': {
    core: 'Peek behind the curtain. Founder authenticity. Process, decisions, real moments.',
    carousel: `- [S1] Hook: A specific behind-the-scenes moment.
- [S2] What happened / what the decision was
- [S3] Why it matters (connect to brand values or product quality)
- [S4] What Jule learned or decided
- [S5+] Bridge to the reader - why this matters for them
- [Last] CTA (engagement-focused: "Was haettet ihr entschieden?")`,
    single: `- Hook: The moment
- Body: Context + decision + learning + bridge
- CTA: Engagement question`,
    arc: 'Peek -> Decision -> Learning -> Connection'
  },
  'M13 Beobachtung': {
    core: 'Everyday observation that leads to a bigger insight. Small moment, big meaning.',
    carousel: `- [S1] Hook: The observation - concrete, visual, specific.
- [S2] What Jule noticed (the detail others would miss)
- [S3] What it made her think about
- [S4] The bigger insight this connects to
- [S5+] Why it matters
- [Last] CTA`,
    single: `- Hook: The scene
- Body: What she noticed -> what she thought -> the insight
- CTA: Pillar-matched`,
    arc: 'Observation -> Notice -> Think -> Insight',
    keyRule: 'The observation must be something anyone could see but few would notice. The insight must feel earned, not forced.'
  }
}

/** Hook formula per method */
export const hookFormulas: Record<string, string> = {
  'M1 Provokante These': 'Strong claim that challenges a common assumption.\nBeispiele: "Dein Handy ist der Grund, warum Du Deine Kinder nicht mehr richtig siehst." / "Die gluecklichsten Muetter machen am wenigsten." / "3 Minuten Papier schlagen 3 Stunden Netflix."',
  'M2 Frage & Antwort': 'Direct question that hits a nerve - never "Kennst du das auch?"\nBeispiele: "Wann hast Du das letzte Mal etwas nur fuer Dich getan?" / "Warum fuehlt sich ein voller Tag trotzdem leer an?"',
  'M3 Persoenliche Geschichte': 'Drop into a scene - who, where, what. First line. No intro.\nBeispiele: "Letzte Woche stand ich um 6:30 in der Kueche. Baby auf dem Arm." / "22:14 Uhr. Handy weglegen. Im Dunkeln liegen."',
  'M4 Vorher / Nachher': 'The "before" state in one sharp, relatable image.\nBeispiele: "Frueh aufstehen. Funktionieren. Ins Bett fallen. Repeat." / "Jeden Abend das gleiche Gefuehl: heute wieder nichts richtig gemacht."',
  'M5 Testimonial': 'One powerful sentence from the testimonial in quotes.\nBeispiele: "\'Seit 3 Wochen schlafe ich anders ein. Besser.\'" / "\'Ich dachte, Dankbarkeit ist was fuer Esoteriker. Dann hab ich es ausprobiert.\'"',
  'M6 Zitat & Kommentar': 'The quote. Attributed. Punchy.\nBeispiele: "\'40% deines Gluecks kannst Du selbst beeinflussen.\' - Sonja Lyubomirsky"',
  'M7 Faktencheck': 'Number + surprising claim.\nBeispiele: "40% Deines Gluecks haengen von einer einzigen Sache ab." / "25% gluecklicher in 3 Wochen. So geht\'s."',
  'M8 Liste': 'Curiosity Gap bevorzugt - die Liste als Nebeneffekt, nicht als Versprechen.\nBeispiele: "Wir haben jetzt getrennte Schlafzimmer. Und es tut mir so gut!" (Bait-and-Switch) / "5 Dinge, die berufstaetige Muetter nicht mehr tun sollten." (klassisch)',
  'M9 Mythos vs. Realitaet': 'The myth stated as if true.\nBeispiele: "\'Dankbarkeitstagebuecher sind was fuer Esoteriker.\'" / "\'Wenn die Kinder groesser sind, wird es einfacher.\'"',
  'M10 Anleitung': 'Problem + promise of solution.\nBeispiele: "Du willst abends abschalten, aber Dein Kopf hoert nicht auf?" / "3 Schritte, die Deinen Abend veraendern."',
  'M11 Call to Action': 'The need/desire the product fulfills - NOT the product name.\nBeispiele: "Der letzte Gedanke am Tag sollte etwas Schoenes sein." / "3 Minuten. Ein Buch. Eine Frage."',
  'M12 Behind the Scenes': 'A specific BTS moment.\nBeispiele: "Heute habe ich 3 Stunden ueber eine einzige Seite nachgedacht." / "Das hier war Plan B. Plan A war furchtbar."',
  'M13 Beobachtung': 'Concrete, visual, specific scene.\nBeispiele: "Meine Tochter hat heute eine Schnecke beobachtet. 11 Minuten lang." / "Im Wartezimmer: 8 Menschen, 8 Handys, 0 Blicke nach oben."'
}

/** Anti-patterns - hardcoded because they're structural rules, not user data */
export const antiPatterns = `## Verboten - NIEMALS verwenden

### Blacklisted AI-Phrasen
"In der heutigen Zeit...", "In einer Welt, in der...", "Immer mehr Menschen...", "Hast du dich jemals gefragt...", "Du kennst es...", "Wir alle kennen das...", "Kennst du das auch...", "Lass uns eintauchen...", "Die unbequeme Wahrheit", "Ein Game-Changer", "Auf ein neues Level heben", "Die Magie liegt in...", "Das Geheimnis ist...", "Der Schluessel liegt in...", "Es ist an der Zeit...", "Lass das mal sacken", "Und das Beste daran?", "Aber hier kommt der Clou...", "Zusammenfassend laesst sich sagen...", "Am Ende des Tages...", "Stell dir vor..." (generisch), "Hand aufs Herz..."

### Formatierung
- Keine Gedankenstriche (em dashes). Komma, Doppelpunkt oder neuer Satz stattdessen.
- Keine Satzfragmente ohne Subjekt und Verb. Jeder Satz braucht beides. Ausnahme: Aufzaehlungen.
- Satzlaengen mischen - fliessende Erzaehlung mit kurzen emotionalen Punkten. Kein Staccato.
- Keine parallelen Strukturen wiederholen. Nicht "Es ist nicht nur X, es ist auch Y" mehrfach.
- Keine Drei-Adjektiv-Ketten. Nicht "intuitiv, kraftvoll und transformativ."

### Strukturell
- Hook startet mit Punch, nicht mit Kontext. Falsch: "Als berufstaetige Mutter weiss ich..." Richtig: "6:30. Kueche. Baby schreit."
- Slide-Laengen variieren. Nicht jeder Slide gleich lang.
- CTA muss zum Pillar passen. Generate Demand Post mit "Link in Bio" = Fehler.
- Kein Produktbezug in Generate Demand und Nurture Loyalty Posts. Null. Nicht mal subtil. Kein Journal, kein Buch, kein Shop. Nur Convert Demand fuehrt zum Produkt hin.
- Body und Hook muessen unterschiedlich klingen. Hook ist scharf/viral. Body ist warm/Brand Voice.
- Body darf den Hook-Text NICHT wiederholen. Der Body setzt dort an, wo der Hook aufhoert. Falsch: Hook "Du hast 1.440 Minuten am Tag." Body "Du hast 1.440 Minuten am Tag. Wie viele davon gehoeren wirklich Dir?" Richtig: Hook "Du hast 1.440 Minuten am Tag." Body "Wie viele davon gehoeren wirklich Dir?"
- Caption darf Slide-Inhalt NICHT wiederholen. Caption ist eigenstaendig.

### Verbotene Woerter
"Experte/Expertin", "Hack", "Manifestieren", "Einfach" (als Fueller), "Universum", "du musst" / "du solltest" (belehrend), "Wir" wenn "Ich" gemeint ist, "Selbstoptimierung" (positiv), "Beste Version deiner selbst"

### Stimme
- Nicht belehrend. Jule teilt, sie unterrichtet nicht. "Ich habe gemerkt..." nicht "Du musst verstehen..."
- Nicht therapeutisch. Jule ist Freundin, kein Coach. Kein "Erlaube dir zu fuehlen..."
- Nicht Instagram-Guru. Kein "Ich zeige dir, wie du..." Kein "Hier sind meine Top-Tipps..."
- Nicht Corporate-warm. Kein "Wir bei LEBEN.LIEBEN glauben..."
- Kein perfektes Leben. Jules Leben ist chaotisch. Kein "Seit ich das Journal nutze, ist alles perfekt."
- Maximal 1 Ausrufezeichen pro Post.
- Keine abstrakten Emotionswoerter wenn konkrete Alltagssprache moeglich ist. "Erschoepfung" -> "Dauer-Stress". "Zu leer sein" -> "Nur noch funktionieren". Immer die Version waehlen, die man beim Kaffee sagen wuerde.
- Keine karrierefokussierten Details. "Meetings, Projekte, Praesentationen" -> "Kita, Schule, Brotdose, Waesche". Die Zielgruppe denkt in Kinderalltag, nicht Bueroalltag.
- Keine Opfer-Sprache. "Ich habe wegen einer Brotdose geweint" -> "Ich bin an die Decke gegangen". Jule ist stark, nicht hilflos.
- Keine Hedging-CTAs bei Convert Demand. "Falls das etwas fuer Dich sein koennte" -> "Wann legst Du Dir deins auf deinen Nachttisch?"`
