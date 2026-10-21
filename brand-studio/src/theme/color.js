// Small, dependency-free color helpers used by the brand theme engine.
// All inputs/outputs are 6-digit hex strings ('#RRGGBB').

const clamp = (n, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, n))

export function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toUpperCase()}` : null
}

export const isHex = (hex) => normalizeHex(hex) !== null

export function hexToRgb(hex) {
  const h = normalizeHex(hex)
  if (!h) return null
  const n = parseInt(h.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export const rgbToHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('').toUpperCase()

/** Mix `hex` toward `other` by `amount` (0 → hex, 1 → other). */
export function mix(hex, other, amount) {
  const a = hexToRgb(hex)
  const b = hexToRgb(other)
  if (!a || !b) return normalizeHex(hex)
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  })
}

export const tint = (hex, amount) => mix(hex, '#FFFFFF', amount)
export const shade = (hex, amount) => mix(hex, '#000000', amount)

/** WCAG relative luminance. */
export function luminance(hex) {
  const c = hexToRgb(hex)
  if (!c) return 0
  const ch = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b)
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export const isDark = (hex) => luminance(hex) < 0.2

/** Readable text color (near-black or white) for a background. */
export const onColor = (bg, dark = '#0B0F19', light = '#FFFFFF') =>
  contrast(bg, light) >= contrast(bg, dark) ? light : dark

/**
 * Darken (or lighten, on dark backgrounds) `hex` in small steps until it meets
 * `ratio` against `against`. Used to keep brand-colored text/links legible
 * (WCAG AA = 4.5) even when an organizer picks a light brand color.
 */
export function ensureContrast(hex, against = '#FFFFFF', ratio = 4.5) {
  let out = normalizeHex(hex)
  if (!out) return out
  const towards = isDark(against) ? '#FFFFFF' : '#000000'
  for (let i = 0; i < 20 && contrast(out, against) < ratio; i++) out = mix(out, towards, 0.08)
  return out
}
