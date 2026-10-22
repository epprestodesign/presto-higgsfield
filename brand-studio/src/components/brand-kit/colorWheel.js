// Color-wheel math for ColorWheelPicker: HSV ⇄ hex, wheel geometry, and the
// harmony rules that move Secondary/Accent relative to the Primary (base) color.
import { hexToRgb, rgbToHex, normalizeHex } from '../../theme/color.js'

const wrap = (h) => ((h % 360) + 360) % 360
const clamp01 = (n) => Math.min(1, Math.max(0, n))

export function hexToHsv(hex) {
  const c = hexToRgb(normalizeHex(hex) || '#000000')
  const r = c.r / 255, g = c.g / 255, b = c.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h: wrap(h), s: max ? d / max : 0, v: max }
}

export function hsvToHex({ h, s, v }) {
  const f = (n) => {
    const k = (n + wrap(h) / 60) % 6
    return v - v * clamp01(s) * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return rgbToHex({ r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 })
}

/** Hue at 12 o'clock increasing clockwise; saturation grows from the center. */
export function hsvToPoint({ h, s }, radius) {
  const a = (wrap(h) * Math.PI) / 180
  return { x: radius + Math.sin(a) * s * radius, y: radius - Math.cos(a) * s * radius }
}

export function pointToHs(x, y, radius) {
  const dx = x - radius, dy = y - radius
  return { h: wrap((Math.atan2(dx, -dy) * 180) / Math.PI), s: clamp01(Math.hypot(dx, dy) / radius) }
}

// Harmony rules. `offsets` are hue offsets for [secondary, accent] from the base;
// `sat` scales each one's saturation from the base (null = keep its own).
export const HARMONIES = [
  { id: 'custom', label: 'Custom', offsets: null, sat: null, icon: [[0.7, 0.3], [0.25, 0.6], [0.6, 0.75]] },
  { id: 'analogous', label: 'Analogous', offsets: [30, -30], sat: [1, 1] },
  { id: 'monochromatic', label: 'Monochrome', offsets: [0, 0], sat: [0.45, 0.75] },
  { id: 'complementary', label: 'Complementary', offsets: [180, 180], sat: [1, 0.5] },
  { id: 'split', label: 'Split', offsets: [150, 210], sat: [1, 1] },
  { id: 'triad', label: 'Triad', offsets: [120, 240], sat: [1, 1] },
  { id: 'square', label: 'Square', offsets: [90, 180], sat: [1, 1] },
]
export const getHarmony = (id) => HARMONIES.find((r) => r.id === id) || HARMONIES[0]
export const WHEEL_ROLES = ['primary', 'secondary', 'accent']

/**
 * Apply a rule from the base color. Secondary/Accent keep their own brightness
 * (v) — the slider per swatch — while hue (and saturation, per rule) follow.
 */
export function applyHarmony(ruleId, hsv) {
  const rule = getHarmony(ruleId)
  if (!rule.offsets) return hsv
  const base = hsv.primary
  const out = { ...hsv, primary: { ...base } }
  ;['secondary', 'accent'].forEach((role, i) => {
    out[role] = { h: wrap(base.h + rule.offsets[i]), s: clamp01(base.s * rule.sat[i]), v: hsv[role].v }
  })
  return out
}

/** When a non-base handle is dragged under a rule, solve for the base it implies. */
export function baseFromHandle(ruleId, role, hs) {
  const rule = getHarmony(ruleId)
  const i = role === 'secondary' ? 0 : 1
  const sat = rule.sat[i] || 1
  return { h: wrap(hs.h - rule.offsets[i]), s: clamp01(hs.s / sat) }
}

/** Something on-brand but surprising: dark-ish primary, livelier supporting colors. */
export function shufflePalette(ruleId, current) {
  const rnd = (a, b) => a + Math.random() * (b - a)
  const primary = { h: rnd(0, 360), s: rnd(0.45, 0.85), v: rnd(0.22, 0.5) }
  const next = {
    primary,
    secondary: { h: wrap(primary.h + rnd(25, 160)), s: rnd(0.4, 0.8), v: rnd(0.65, 0.92) },
    accent: { h: wrap(primary.h + rnd(160, 300)), s: rnd(0.55, 0.9), v: rnd(0.85, 1) },
    ink: current.ink,
  }
  return ruleId === 'custom' ? next : applyHarmony(ruleId, next)
}
