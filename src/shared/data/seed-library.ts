import type { LibraryItem, SituationItem, ScienceItem, SituationImageItem } from '../types'

// Default scenario IDs - new items get all scenarios so the user can curate manually
// These will be populated with actual scenario IDs during migration
const ALL_SCENARIOS: string[] = []

let counter = 0
function makeId(prefix: string): string {
  counter++
  return `${prefix}-${String(counter).padStart(3, '0')}`
}

function hookItem(text: string): LibraryItem {
  return { id: makeId('hook'), text, scenarioIds: [...ALL_SCENARIOS] }
}

function ctaItem(text: string): LibraryItem {
  return { id: makeId('cta'), text, scenarioIds: [...ALL_SCENARIOS] }
}

export const seedHooks: LibraryItem[] = [
  hookItem('Wie Du abends besser einschläfst'),
  hookItem('Wie Du allgemein zufriedener wirst'),
  hookItem('Höre auf, auf andere zu schauen'),
  hookItem('Bist Du Mutter und arbeitest?'),
  hookItem('Wenn ich ab sofort glücklicher sein müsste...'),
  hookItem('Ich habe ein Versprechen gemacht'),
  hookItem('Du versuchst es noch nicht mal'),
  hookItem('Konzentrier Dich auf die "langweiligen" Dinge'),
  hookItem('Wenn ich nur 3 Dinge in meinem Leben ändern dürfte um...'),
  hookItem('Hör auf, die Lösung bei jemand anderem zu suchen'),
  hookItem('Ich brauche Deine Hilfe'),
  hookItem('Es gibt nur 2 Typen von Müttern am Abend.'),
  hookItem('22:14 Uhr. Kinder schlafen. Du scrollst.'),
  hookItem('3 Minuten. Mehr brauchst Du nicht.'),
  hookItem('Dein Handy ist Dein letzter Gedanke. Jeden Abend.'),
  hookItem('40% Deines Glücks liegen in Deiner Hand.'),
  hookItem('3 Minuten Papier schlagen 3 Stunden Netflix.'),
  hookItem('"Wie war Dein Tag?" – "Gut." War er aber nicht.'),
  hookItem('Warum fühlt sich ein voller Tag leer an?'),
  hookItem('Dankbarkeit ist keine Esoterik. Es ist Neurowissenschaft.'),
  hookItem('Wann hast Du zuletzt etwas nur für Dich getan?'),
  hookItem('"Noch ein Journal." Nein. Oder, doch!'),
  hookItem('Was würden Deine Kinder lesen, wenn sie Dein Tagebuch finden?'),
  hookItem('Ich lag wach. Zu müde zum Schlafen. Zu wach zum Aufhören.'),
  hookItem('Du hast 1.440 Minuten am Tag. Ich will davon 3.'),
  hookItem('Das Beste an Deinem Leben ist schon da. Du siehst es nur nicht.'),
  hookItem('Schluss mit Scrollen. Fang an zu schreiben.'),
]

counter = 0 // reset for CTA IDs

export const seedCtas: LibraryItem[] = [
  ctaItem('Kommentiere TAGEBUCH, ich schick Dir den Link.'),
  ctaItem('Speicher Dir das für heute Abend.'),
  ctaItem('Schick das einer Freundin, die es braucht.'),
  ctaItem('Link in Bio.'),
  ctaItem('Markiere eine Mama, die das verdient hat.'),
  ctaItem('Welcher Grund fällt Dir zuerst ein? Schreib ihn.'),
  ctaItem('Swipe für die Methode.'),
  ctaItem('Speichern. Heute Abend nochmal lesen.'),
  ctaItem('Teile das mit jemandem, der einen harten Tag hat.'),
  ctaItem('Schau es Dir an. Link in Bio.'),
  ctaItem('Wenn Du magst: Link in Bio.'),
  ctaItem('Probier es heute Abend aus.'),
  ctaItem('Double tap, wenn Du Dich wiedererkennst.'),
  ctaItem('Was war heute Dein schönster Moment?'),
  ctaItem('Für die Freundin, die sich selbst vergisst.'),
  ctaItem('Kennst Du jemanden, der das braucht?'),
  ctaItem('Das perfekte Geschenk für jemanden, der alles gibt.'),
  ctaItem('Hättest Du Lust, das auszuprobieren?'),
  ctaItem('Fang heute an.'),
]

export const seedSituations: SituationItem[] = []
export const seedScience: ScienceItem[] = []
export const seedImages: SituationImageItem[] = []
