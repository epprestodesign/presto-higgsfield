// WCAG contrast helpers — shared by the Color Contrast audit story.
// Implements the WCAG 2.x relative-luminance contrast ratio (unchanged in 2.2).

// #rrggbb / #rgb / #rrggbbaa → { r, g, b, a } in 0–255 (a in 0–1).
export function parseHex(hex) {
  let h = String(hex).trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 8) {
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: parseInt(h.slice(6, 8), 16) / 255 }
  }
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }
}

// Flatten a (possibly translucent) foreground over an opaque background.
export function flatten(fg, bg) {
  const f = parseHex(fg)
  const b = parseHex(bg)
  const a = f.a
  return {
    r: Math.round(f.r * a + b.r * (1 - a)),
    g: Math.round(f.g * a + b.g * (1 - a)),
    b: Math.round(f.b * a + b.b * (1 - a)),
  }
}

// WCAG relative luminance of an { r, g, b } (0–255) color.
export function luminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Contrast ratio between a foreground (may be translucent) and an opaque bg.
export function contrast(fg, bg) {
  const f = luminance(flatten(fg, bg))
  const b = luminance(parseHex(bg))
  const [hi, lo] = f > b ? [f, b] : [b, f]
  return (hi + 0.05) / (lo + 0.05)
}

// WCAG 2.2 pass/fail for a ratio. Normal text: AA 4.5, AAA 7. Large text
// (≥18.66px bold or ≥24px) and UI components/graphics: 3.0 (1.4.11).
export function grade(ratio) {
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormal: ratio >= 4.5,
    aaaNormal: ratio >= 7,
    aaLarge: ratio >= 3, // also the non-text UI/graphics threshold (1.4.11)
  }
}
