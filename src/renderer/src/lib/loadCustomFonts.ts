import type { Settings } from '../../../shared/types/settings'

let fontsLoaded = false

/**
 * Load custom fonts into the main document for Konva text rendering.
 * Uses data URLs since file:// is blocked in Electron renderer.
 */
export async function loadCustomFonts(settings: Settings | null): Promise<void> {
  if (fontsLoaded || !settings?.visualGuidance) return

  const guidance = settings.visualGuidance
  const fonts: { name: string; path?: string }[] = [
    { name: 'CustomHeadline', path: guidance.headlineFont?.path },
    { name: 'CustomBody', path: guidance.bodyFont?.path },
    { name: 'CustomCTA', path: guidance.ctaFont?.path },
  ]

  for (const font of fonts) {
    if (!font.path) continue
    try {
      const dataUrl = await window.api.readFileAsDataUrl(font.path)
      const face = new FontFace(font.name, `url(${dataUrl})`)
      const loaded = await face.load()
      document.fonts.add(loaded)
    } catch (err) {
      console.error(`Failed to load font ${font.name}:`, err)
    }
  }

  fontsLoaded = true
}

/** Reset the loaded flag (e.g. if settings change) */
export function resetFontsLoaded(): void {
  fontsLoaded = false
}
