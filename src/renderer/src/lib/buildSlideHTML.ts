import type { Slide } from '../../../shared/types/generation'
import type { Zone } from '../components/templates/ZoneEditor'
import type { Settings } from '../../../shared/types/settings'

export interface BuildSlideHTMLParams {
  slide: Slide
  allSlides: Slide[]        // needed for CTA last-slide check
  zones: Zone[]             // parsed zones from template.zones_config
  settings: Settings | null
  templateBackground: { type: string; value: string } | null
  overlayColor: string
  overlayEnabled: boolean
  customBackgroundPath: string | null
  opacityOverride?: number
  /** Pre-resolved data URL for custom background (use in renderer iframe where file:// is blocked) */
  customBackgroundDataUrl?: string
}

function getLogoPositionStyle(
  position: string
): string {
  switch (position) {
    case 'top-left': return 'top: 40px; left: 40px;'
    case 'top-center': return 'top: 40px; left: 50%; transform: translateX(-50%);'
    case 'top-right': return 'top: 40px; right: 40px;'
    case 'bottom-left': return 'bottom: 40px; left: 40px;'
    case 'bottom-center': return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
    case 'bottom-right': return 'bottom: 40px; right: 40px;'
    default: return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
  }
}

export function buildSlideHTML(params: BuildSlideHTMLParams): string {
  const {
    slide,
    allSlides,
    zones,
    settings,
    templateBackground,
    overlayColor,
    overlayEnabled,
    customBackgroundPath,
    opacityOverride,
    customBackgroundDataUrl
  } = params

  const guidance = settings?.visualGuidance

  // Font face declarations
  const fontStyles = [
    guidance?.headlineFont?.path ? `@font-face { font-family: 'CustomHeadline'; src: url('file://${guidance.headlineFont.path}'); }` : '',
    guidance?.bodyFont?.path ? `@font-face { font-family: 'CustomBody'; src: url('file://${guidance.bodyFont.path}'); }` : '',
    guidance?.ctaFont?.path ? `@font-face { font-family: 'CustomCTA'; src: url('file://${guidance.ctaFont.path}'); }` : ''
  ].filter(Boolean).join('\n')

  // Background CSS: custom upload > template > settings fallback
  let backgroundCSS = `background-color: ${guidance?.backgroundColor || '#1a1a2e'};`
  if (customBackgroundDataUrl) {
    backgroundCSS = `background-image: url('${customBackgroundDataUrl}'); background-size: cover; background-position: center;`
  } else if (customBackgroundPath) {
    const bgUrl = customBackgroundPath.replace(/\\/g, '/')
    backgroundCSS = `background-image: url('file:///${bgUrl}'); background-size: cover; background-position: center;`
  } else if (templateBackground) {
    if (templateBackground.type === 'solid_color') {
      backgroundCSS = `background-color: ${templateBackground.value};`
    } else if (templateBackground.type === 'image') {
      backgroundCSS = `background-image: url('file://${templateBackground.value}'); background-size: cover; background-position: center;`
    } else if (templateBackground.type === 'gradient') {
      backgroundCSS = `background: ${templateBackground.value};`
    }
  }

  const overlayOpacity = opacityOverride ?? slide.overlay_opacity ?? 0.5
  const primaryColor = guidance?.primaryColor || '#ffffff'
  const secondaryColor = guidance?.secondaryColor || '#cccccc'

  // CTA text: last slide uses standardCTA if available (POST-17)
  const slideIndex = allSlides.findIndex(s => s.uid === slide.uid)
  const isLastSlide = slideIndex === allSlides.length - 1
  const ctaText = (isLastSlide && slide.slide_type === 'cta' && guidance?.standardCTA)
    ? guidance.standardCTA
    : (slide.cta_text || '')

  // Build zone divs from zones_config with override merge
  const zoneElements = zones.map(zone => {
    if (zone.type === 'no-text') return ''
    const override = slide.zone_overrides?.[zone.id] ?? {}
    const effectiveX = override.x ?? zone.x
    const effectiveY = override.y ?? zone.y
    const effectiveWidth = override.width ?? zone.width
    const effectiveHeight = override.height ?? zone.height
    const effectiveFontSize = override.fontSize ?? zone.fontSize ?? 40
    const effectiveFontWeight = override.fontWeight ?? 'normal'
    const effectiveTextAlign = override.textAlign ?? 'center'
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }

    let text = ''
    let fontFamily = 'sans-serif'
    let color = primaryColor

    if (zone.type === 'hook') {
      text = slide.hook_text || ''
      fontFamily = guidance?.headlineFont ? "'CustomHeadline'" : 'sans-serif'
      color = override.color ?? primaryColor
    } else if (zone.type === 'body') {
      text = slide.body_text || ''
      fontFamily = guidance?.bodyFont ? "'CustomBody'" : 'sans-serif'
      color = override.color ?? secondaryColor
    } else if (zone.type === 'cta') {
      text = ctaText
      fontFamily = guidance?.ctaFont ? "'CustomCTA'" : 'sans-serif'
      color = override.color ?? primaryColor
    }

    // fontFamily override takes precedence
    if (override.fontFamily) {
      fontFamily = `'${override.fontFamily}'`
    }

    return `<div style="position:absolute;left:${effectiveX}px;top:${effectiveY}px;width:${effectiveWidth}px;height:${effectiveHeight}px;font-family:${fontFamily};font-size:${effectiveFontSize}px;font-weight:${effectiveFontWeight};color:${color};overflow:hidden;display:flex;align-items:${effectiveTextAlign === 'center' ? 'center' : 'flex-start'};justify-content:${justifyMap[effectiveTextAlign]};text-align:${effectiveTextAlign};line-height:1.3;padding:8px;word-wrap:break-word;white-space:pre-wrap;">${text}</div>`
  }).filter(Boolean).join('\n')

  // Fallback layout when no zones defined: hook at top, body in middle, CTA at bottom
  const headlineFamily = guidance?.headlineFont ? "'CustomHeadline', sans-serif" : 'sans-serif'
  const bodyFamily = guidance?.bodyFont ? "'CustomBody', sans-serif" : 'sans-serif'
  const ctaFamily = guidance?.ctaFont ? "'CustomCTA', sans-serif" : 'sans-serif'
  const fallback = zones.length === 0 ? `
    <div style="position:absolute;top:0;left:0;right:0;height:340px;display:flex;align-items:center;justify-content:center;padding:60px 80px 30px;">
      ${slide.hook_text ? `<div style="font-family:${headlineFamily};font-size:56px;color:${primaryColor};text-align:center;line-height:1.25;font-weight:bold;">${slide.hook_text}</div>` : ''}
    </div>
    <div style="position:absolute;top:340px;left:0;right:0;bottom:240px;display:flex;align-items:center;justify-content:center;padding:0 80px;">
      ${slide.body_text ? `<div style="font-family:${bodyFamily};font-size:38px;color:${secondaryColor};text-align:center;line-height:1.6;">${slide.body_text}</div>` : ''}
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:240px;display:flex;align-items:center;justify-content:center;padding:30px 80px 60px;">
      ${ctaText ? `<div style="font-family:${ctaFamily};font-size:48px;color:${primaryColor};text-align:center;font-weight:bold;">${ctaText}</div>` : ''}
    </div>` : ''

  const logoSize = { small: 80, medium: 120, large: 160 }[(guidance?.logo?.size || 'medium') as 'small' | 'medium' | 'large'] || 120
  const logoHtml = guidance?.logo?.path ? `<img src="file://${guidance.logo.path}" style="position:absolute;${getLogoPositionStyle(guidance.logo.position || 'bottom-center')};width:${logoSize}px;height:auto;object-fit:contain;" alt="" />` : ''
  const handleHtml = guidance?.instagramHandle ? `<div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-family:${guidance?.bodyFont ? "'CustomBody'" : 'sans-serif'};font-size:20px;color:${secondaryColor};">${guidance.instagramHandle}</div>` : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } ${fontStyles} body { width: 1080px; height: 1350px; position: relative; overflow: hidden; ${backgroundCSS} } .overlay { position: absolute; inset: 0; background-color: ${overlayColor}; opacity: ${overlayOpacity}; }</style></head><body>${overlayEnabled ? '<div class="overlay"></div>' : ''}${zoneElements}${fallback}${logoHtml}${handleHtml}</body></html>`
}
