// Preset fonts (all Google Fonts, all available at fonts.google.com)
export const PRESET_FONTS = [
  // Sans-serif
  'Josefin Sans',
  'Nunito',
  'Comfortaa',
  'Quicksand',
  // Serif
  'Playfair Display',
  'Cormorant Garamond',
  // Display
  'Bebas Neue',
  'Abril Fatface',
  'Lobster',
  // Handwriting / Script
  'Dancing Script',
  'Pacifico',
  'Satisfy',
  'Sacramento',
  'Caveat',
  'Kaushan Script',
]

// All presets are Google Fonts
export const GOOGLE_FONT_NAMES = new Set(PRESET_FONTS)

export function googleFontImport(family: string): string {
  const encoded = family.split(' ').join('+')
  return `@import url('https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;1,400&display=swap');`
}
