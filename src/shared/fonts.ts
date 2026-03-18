// 10 preset fonts (all Google Fonts, all available at fonts.google.com)
export const PRESET_FONTS = [
  'Josefin Sans',
  'Playfair Display',
  'Montserrat',
  'Raleway',
  'Lato',
  'Open Sans',
  'Oswald',
  'Merriweather',
  'Dancing Script',
  'Bebas Neue'
]

// All presets are Google Fonts
export const GOOGLE_FONT_NAMES = new Set(PRESET_FONTS)

export function googleFontImport(family: string): string {
  const encoded = family.split(' ').join('+')
  return `@import url('https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;1,400&display=swap');`
}
