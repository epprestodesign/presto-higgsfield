// Logo processing for the asset export: trim, resize (stepped downscaling for
// clean edges) and a contrast check of each logo version against the banner
// pixels it actually sits on.
import { loadImage } from './render.js'

/** Draw an image to a canvas trimmed to its visible (alpha > 8) bounds. */
export async function trimmedLogo(src) {
  const img = await loadImage(src)
  if (!img) return null
  const w = img.naturalWidth
  const h = img.naturalHeight
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const px = ctx.getImageData(0, 0, w, h).data
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
  }
  if (x1 < 0) return c
  const t = document.createElement('canvas')
  t.width = x1 - x0 + 1; t.height = y1 - y0 + 1
  t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height)
  return t
}

/** High-quality resize: halve repeatedly, then a final smooth pass. */
export function resizeCanvas(src, width, height) {
  let cur = src
  while (cur.width / 2 >= width && cur.height / 2 >= height) {
    const half = document.createElement('canvas')
    half.width = Math.round(cur.width / 2); half.height = Math.round(cur.height / 2)
    const hctx = half.getContext('2d'); hctx.imageSmoothingQuality = 'high'
    hctx.drawImage(cur, 0, 0, half.width, half.height)
    cur = half
  }
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(width)); out.height = Math.max(1, Math.round(height))
  const octx = out.getContext('2d'); octx.imageSmoothingQuality = 'high'
  octx.drawImage(cur, 0, 0, out.width, out.height)
  return out
}

/** Fit inside maxW × maxH (never upscale). */
export function fitCanvas(src, maxW, maxH) {
  const r = Math.min(1, maxW / src.width, maxH / src.height)
  return r === 1 ? src : resizeCanvas(src, src.width * r, src.height * r)
}

/** Exact height (width follows the aspect, capped at maxW). */
export function heightCanvas(src, h, maxW = Infinity) {
  let w = (src.width * h) / src.height
  if (w > maxW) { h = (h * maxW) / w; w = maxW }
  return resizeCanvas(src, w, h)
}

/** Logo centered in a transparent square with padding (favicons, social). */
export function squareCanvas(src, size = 512, pad = 0.08) {
  const inner = fitCanvas(src, size * (1 - 2 * pad), size * (1 - 2 * pad))
  const out = document.createElement('canvas')
  out.width = size; out.height = size
  out.getContext('2d').drawImage(inner, (size - inner.width) / 2, (size - inner.height) / 2)
  return out
}

// ── Contrast ──────────────────────────────────────────────────────────────
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/**
 * Contrast of a logo against the banner region it covers.
 * @param bg    banner background canvas (no copy)
 * @param logo  logo canvas
 * @param rect  { x, y, w, h } where the logo is drawn on the banner
 * @returns { ratio, detail, coverage, verdict }
 *   ratio    median logo-pixel contrast vs the region's mean luminance — the
 *            logo's overall shape (a dark badge on a dark banner scores low)
 *   detail   90th-percentile contrast — the logo's most distinct parts (e.g. a
 *            white wordmark inside that badge)
 *   coverage share of logo pixels ≥ 3:1 (WCAG 1.4.11 asks 3:1 for graphics)
 *   verdict  'good' (shape ≥ 3:1) · 'detail' (shape blends, details ≥ 4.5:1)
 *            · 'borderline' (shape ≥ 2:1) · 'low'
 */
export function logoContrast(bg, logo, rect) {
  const W = Math.max(1, Math.round(rect.w))
  const H = Math.max(1, Math.round(rect.h))
  const bctx = bg.getContext('2d', { willReadFrequently: true })
  const bp = bctx.getImageData(Math.round(rect.x), Math.round(rect.y), W, H).data
  let bgL = 0
  for (let i = 0; i < bp.length; i += 4) bgL += lum(bp[i], bp[i + 1], bp[i + 2])
  bgL /= bp.length / 4

  const lc = resizeCanvas(logo, W, H)
  const lp = lc.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data
  const vals = []
  let weight = 0
  let good = 0
  for (let i = 0; i < lp.length; i += 4) {
    const a = lp[i + 3] / 255
    if (a < 0.5) continue
    const r = ratio(lum(lp[i], lp[i + 1], lp[i + 2]), bgL)
    vals.push(r)
    weight++
    if (r >= 3) good++
  }
  if (!vals.length) return { ratio: 0, detail: 0, coverage: 0, verdict: 'none' }
  vals.sort((a, b) => a - b)
  const med = vals[Math.floor(vals.length / 2)]
  const p90 = vals[Math.floor(vals.length * 0.9)]
  const coverage = good / weight
  const verdict = med >= 3 && coverage >= 0.6 ? 'good' : p90 >= 4.5 && coverage >= 0.12 ? 'detail' : med >= 2 ? 'borderline' : 'low'
  const r1 = (v) => Math.round(v * 10) / 10
  return { ratio: r1(med), detail: r1(p90), coverage: Math.round(coverage * 100), verdict }
}

/** Crop of the composed banner around the logo, for the sheet's swatch. */
export function cropAround(canvas, rect, padX = 120, padY = 36) {
  const x = Math.max(0, rect.x - padX)
  const y = Math.max(0, rect.y - padY)
  const w = Math.min(canvas.width - x, rect.w + padX * 2)
  const h = Math.min(canvas.height - y, rect.h + padY * 2)
  const out = document.createElement('canvas')
  out.width = w; out.height = h
  out.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h)
  return out
}
