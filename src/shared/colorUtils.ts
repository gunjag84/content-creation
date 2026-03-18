/** Convert any CSS color (named, hex, rgb) to #rrggbb hex format.
 *  Uses a canvas 2d context for browser-native parsing. */
export function toHex(color: string): string {
  if (!color) return '#000000'
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return '#000000'
  ctx.fillStyle = color
  return ctx.fillStyle // browser normalizes to #rrggbb
}
