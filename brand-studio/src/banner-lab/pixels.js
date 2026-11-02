// Pure pixel helpers for Banner Lab. Everything here works on ImageData-shaped
// objects ({ data: Uint8ClampedArray RGBA, width, height }) so it runs in Node
// tests as well as in the browser.

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
/** WCAG relative luminance of an sRGB colour (0–255 channels). */
export const luminance = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export const contrastRatio = (la, lb) => (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)

export const hexToRgb = (hex) => {
  const h = String(hex).replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
export const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

export const makeImage = (width, height, data = new Uint8ClampedArray(width * height * 4)) => ({ width, height, data })
export const cloneImage = (img) => makeImage(img.width, img.height, new Uint8ClampedArray(img.data))

const dist = (data, i, [r, g, b]) => Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - b)

// ── Logo background ───────────────────────────────────────────────────────

/** Indices (pixel numbers) along the image border. */
function borderPixels(w, h) {
  const out = []
  for (let x = 0; x < w; x++) out.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) out.push(y * w, y * w + w - 1)
  return out
}

/**
 * What's behind the logo?
 *  'transparent' — the border is mostly see-through already
 *  'solid'       — one flat colour (white box, coloured box) we can remove
 *  'complex'     — a photo or gradient: removing it would damage the logo
 */
export function detectBackground(img) {
  const { width: w, height: h, data } = img
  const border = borderPixels(w, h)
  let clear = 0
  const opaque = []
  for (const p of border) {
    if (data[p * 4 + 3] < 16) clear++
    else opaque.push(p)
  }
  if (clear / border.length > 0.5) return { kind: 'transparent', color: null }
  const mean = [0, 1, 2].map((c) => opaque.reduce((s, p) => s + data[p * 4 + c], 0) / opaque.length)
  const spread = Math.sqrt(opaque.reduce((s, p) => s + dist(data, p * 4, mean) ** 2, 0) / opaque.length)
  // Share of the border within 30 of the mean: a solid box scores ~1.
  const share = opaque.filter((p) => dist(data, p * 4, mean) < 30).length / opaque.length
  if (spread < 20 && share > 0.9) return { kind: 'solid', color: mean.map(Math.round) }
  return { kind: 'complex', color: mean.map(Math.round) }
}

/**
 * Remove a flat background by flood-filling from the border. Only pixels
 * connected to the edge go, so white shapes inside the logo stay. Edge pixels
 * within the feather band get partial alpha, and their colour is un-mixed from
 * the background so there's no white fringe on a dark banner.
 */
export function removeBackground(img, color, { tolerance = 36, feather = 28 } = {}) {
  const out = cloneImage(img)
  const { width: w, height: h, data } = out
  const limit = tolerance + feather
  const seen = new Uint8Array(w * h)
  const stack = borderPixels(w, h)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    const i = p * 4
    const d = dist(data, i, color)
    if (d >= limit) continue
    if (d <= tolerance) {
      data[i + 3] = 0
    } else {
      const a = (d - tolerance) / feather // 0 → background, 1 → logo
      const prev = data[i + 3] / 255
      for (let c = 0; c < 3; c++) data[i + c] = clamp((data[i + c] - (1 - a) * color[c]) / a, 0, 255)
      data[i + 3] = Math.round(255 * a * prev)
      continue // a partly-background pixel is the edge: don't flood past it
    }
    const x = p % w
    const y = (p - x) / w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  return out
}

/** Bounding box of pixels with alpha above `min`, or null if the image is empty. */
export function alphaBounds(img, min = 12) {
  const { width: w, height: h, data } = img
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > min) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/**
 * Where the logo is in an upload, before anything is removed: pixels that are
 * visible and differ from the background colour. Seeds the selection box.
 */
export function contentBounds(img, bg, { tolerance = 40 } = {}) {
  const { width: w, height: h, data } = img
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const ink = data[i + 3] > 12 && (bg.kind !== 'solid' || dist(data, i, bg.color) > tolerance)
      if (!ink) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (x1 < 0 || bg.kind === 'complex') return { x: 0, y: 0, w, h }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/** Main colours of the visible logo, most used first, near-duplicates merged. */
export function extractPalette(img, max = 5) {
  const { data } = img
  const bins = new Map()
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue
    const key = (data[i] >> 4) << 8 | (data[i + 1] >> 4) << 4 | (data[i + 2] >> 4)
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 }
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]
    bins.set(key, b)
    total++
  }
  if (!total) return []
  const sorted = [...bins.values()].sort((a, b) => b.n - a.n).map((b) => ({ rgb: [b.r / b.n, b.g / b.n, b.b / b.n], n: b.n }))
  const picked = []
  for (const c of sorted) {
    const twin = picked.find((p) => Math.hypot(...p.rgb.map((v, k) => v - c.rgb[k])) < 48)
    if (twin) { twin.n += c.n; continue }
    picked.push({ ...c })
  }
  return picked
    .sort((a, b) => b.n - a.n)
    .filter((c) => c.n / total >= 0.02)
    .slice(0, max)
    .map((c) => ({ hex: rgbToHex(c.rgb), share: Math.round((c.n / total) * 100) }))
}

/**
 * How well the logo reads on a background colour: median contrast of its
 * visible pixels (the overall shape) and the share of pixels at ≥ 3:1
 * (WCAG 1.4.11 for graphics).
 */
export function logoContrastOn(img, bgHex) {
  const bgL = luminance(...hexToRgb(bgHex))
  const { data } = img
  const vals = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    vals.push(contrastRatio(luminance(data[i], data[i + 1], data[i + 2]), bgL))
  }
  if (!vals.length) return { ratio: 0, coverage: 0, verdict: 'none' }
  vals.sort((a, b) => a - b)
  const ratio = vals[Math.floor(vals.length / 2)]
  const coverage = vals.filter((v) => v >= 3).length / vals.length
  const verdict = ratio >= 3 && coverage >= 0.6 ? 'good' : coverage >= 0.25 ? 'partial' : 'low'
  return { ratio: Math.round(ratio * 10) / 10, coverage: Math.round(coverage * 100), verdict }
}

/** Every visible pixel turned one colour (a white knockout for dark banners). */
export function knockout(img, hex = '#FFFFFF') {
  const out = cloneImage(img)
  const [r, g, b] = hexToRgb(hex)
  for (let i = 0; i < out.data.length; i += 4) {
    if (!out.data[i + 3]) continue
    out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b
  }
  return out
}

/**
 * Colour key: remove the background colour everywhere, not just from the
 * outside in, so holes inside letters (the middle of an O) clear too. The
 * catch: logo parts close to the background colour go with it.
 */
export function keyOut(img, color, { tolerance = 36, feather = 28 } = {}) {
  const out = cloneImage(img)
  const { data } = out
  for (let i = 0; i < data.length; i += 4) {
    const d = dist(data, i, color)
    if (d <= tolerance) { data[i + 3] = 0; continue }
    if (d >= tolerance + feather) continue
    const a = (d - tolerance) / feather
    for (let c = 0; c < 3; c++) data[i + c] = clamp((data[i + c] - (1 - a) * color[c]) / a, 0, 255)
    data[i + 3] = Math.round(data[i + 3] * a)
  }
  return out
}

/**
 * One-colour version for dark banners that keeps the logo's inner detail: the
 * dark parts become `hex` and light details (white lettering on a dark badge)
 * become cut-outs the banner shows through. A logo that's mostly light, or
 * has no light detail, is a plain knockout instead.
 * @returns {{ img, cutouts: boolean }}
 */
export function reverseKnockout(img, hex = '#FFFFFF') {
  const { data } = img
  const lums = []
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) lums.push(luminance(data[i], data[i + 1], data[i + 2]))
  if (!lums.length) return { img: knockout(img, hex), cutouts: false }
  const t = otsu(lums)
  const dark = lums.filter((l) => l < t)
  const light = lums.length - dark.length
  const darkMean = dark.reduce((s, l) => s + l, 0) / (dark.length || 1)
  const lightMean = (lums.reduce((s, l) => s + l, 0) - darkMean * dark.length) / (light || 1)
  // Cut-outs only when there's a real dark body with clearly lighter detail on it.
  const cutouts = dark.length / lums.length >= 0.45 && light / lums.length >= 0.04 && contrastRatio(lightMean, darkMean) >= 2.5
  if (!cutouts) return { img: knockout(img, hex), cutouts: false }
  const out = cloneImage(img)
  const [r, g, b] = hexToRgb(hex)
  // Split midway between the two tones, with a soft edge for anti-aliasing.
  const mid = (darkMean + lightMean) / 2
  const band = Math.max(0.02, (lightMean - darkMean) * 0.15)
  for (let i = 0; i < out.data.length; i += 4) {
    if (!out.data[i + 3]) continue
    const l = luminance(out.data[i], out.data[i + 1], out.data[i + 2])
    const keep = clamp((mid + band - l) / (2 * band), 0, 1) // 1 = ink, 0 = cut out
    out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b
    out.data[i + 3] = Math.round(out.data[i + 3] * keep)
  }
  return { img: out, cutouts: true }
}

/** Otsu threshold of values in 0–1 (64 bins). */
function otsu(values) {
  const bins = new Array(64).fill(0)
  for (const v of values) bins[Math.min(63, Math.floor(v * 64))]++
  const total = values.length
  let sum = 0
  for (let k = 0; k < 64; k++) sum += k * bins[k]
  let sumB = 0, wB = 0, best = 0, at = 32
  for (let k = 0; k < 64; k++) {
    wB += bins[k]
    if (!wB) continue
    const wF = total - wB
    if (!wF) break
    sumB += k * bins[k]
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2
    if (between > best) { best = between; at = k }
  }
  return (at + 1) / 64
}

/** Mask (1 = set) grown by `r` pixels in every direction (square, separable). */
export function dilate(mask, w, h, r) {
  const tmp = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    let run = -1 // last set x within reach
    for (let x = 0; x < w + r; x++) {
      if (x < w && mask[y * w + x]) run = x
      const at = x - r
      if (at >= 0 && at < w && run >= 0 && x - run <= 2 * r) tmp[y * w + at] = 1
    }
  }
  for (let x = 0; x < w; x++) {
    let run = -1
    for (let y = 0; y < h + r; y++) {
      if (y < h && tmp[y * w + x]) run = y
      const at = y - r
      if (at >= 0 && at < h && run >= 0 && y - run <= 2 * r) out[at * w + x] = 1
    }
  }
  return out
}

/**
 * How well a logo's silhouette separates from what's right around it, as
 * composited: median contrast of the logo's edge pixels (just inside its
 * outline) against the median of a ring just outside. A plate, outline or
 * glow raises the ring; a white version raises the edge.
 * @param scene  composited image (opaque)
 * @param mask   Uint8Array, 1 where the logo's own artwork is
 * @returns {{ ratio, coverage, verdict }}
 */
export function edgeContrast(scene, mask, r = 3) {
  const { width: w, height: h, data } = scene
  const inv = new Uint8Array(w * h)
  for (let p = 0; p < inv.length; p++) inv[p] = mask[p] ? 0 : 1
  const grown = dilate(mask, w, h, r)
  const nearOutside = dilate(inv, w, h, Math.max(1, Math.round(r / 2)))
  const L = (p) => luminance(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])
  const ring = []
  const edge = []
  for (let p = 0; p < mask.length; p++) {
    if (grown[p] && !mask[p]) ring.push(L(p))
    else if (mask[p] && nearOutside[p]) edge.push(L(p))
  }
  if (!ring.length || !edge.length) return { ratio: 0, coverage: 0, verdict: 'none' }
  ring.sort((a, b) => a - b)
  const lo = ring[Math.floor(ring.length / 2)]
  const vals = edge.map((l) => contrastRatio(l, lo)).sort((a, b) => a - b)
  const ratio = vals[Math.floor(vals.length / 2)]
  const coverage = vals.filter((v) => v >= 3).length / vals.length
  const verdict = ratio >= 3 && coverage >= 0.6 ? 'good' : coverage >= 0.3 ? 'partial' : 'low'
  return { ratio: Math.round(ratio * 10) / 10, coverage: Math.round(coverage * 100), verdict }
}

/**
 * Share of a cleaned logo's outer edge pixels that still carry the old
 * background colour (a light fringe that shows on dark banners).
 */
export function haloShare(img, color, { near = 70 } = {}) {
  if (!color) return 0
  const { width: w, height: h, data } = img
  let edge = 0, halo = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      if (data[i + 3] < 24) continue
      const open = data[i - 4 + 3] < 24 || data[i + 4 + 3] < 24 || data[i - w * 4 + 3] < 24 || data[i + w * 4 + 3] < 24
      if (!open) continue
      edge++
      if (dist(data, i, color) < near) halo++
    }
  }
  return edge ? halo / edge : 0
}

// ── Banner analysis ───────────────────────────────────────────────────────

/** Cover-crop rectangle (source pixels) for a target size, around a focal point (0–1). */
export function coverCrop(srcW, srcH, dstW, dstH, { fx = 0.5, fy = 0.5, zoom = 1 } = {}) {
  const target = dstW / dstH
  let w = srcW
  let h = srcW / target
  if (h > srcH) { h = srcH; w = srcH * target }
  w /= zoom; h /= zoom
  const x = clamp(fx * srcW - w / 2, 0, srcW - w)
  const y = clamp(fy * srcH - h / 2, 0, srcH - h)
  return { x, y, w, h }
}

/** The center zone of a w×h banner, in its pixels. */
export const centerZone = (w, h, zone) => ({ x: (w * (1 - zone.w)) / 2, y: (h * (1 - zone.h)) / 2, w: w * zone.w, h: h * zone.h })

/**
 * Luminance stats and "busyness" (mean luma gradient) inside a rect.
 * `scrim` (0–1) previews a black overlay without rendering it.
 */
export function zoneStats(img, rect, { scrim = 0, step = 2 } = {}) {
  const { width: w, data } = img
  const x0 = Math.max(0, Math.round(rect.x))
  const y0 = Math.max(0, Math.round(rect.y))
  const x1 = Math.min(img.width - 1, Math.round(rect.x + rect.w))
  const y1 = Math.min(img.height - 1, Math.round(rect.y + rect.h))
  const keep = 1 - scrim
  const lums = []
  let grad = 0
  let gn = 0
  const luma = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * w + x) * 4
      lums.push(luminance(data[i] * keep, data[i + 1] * keep, data[i + 2] * keep))
      const right = i + step * 4
      const down = i + step * w * 4
      if (x + step < x1 && y + step < y1) {
        grad += (Math.abs(luma(i) - luma(right)) + Math.abs(luma(i) - luma(down))) / 2 * keep
        gn++
      }
    }
  }
  lums.sort((a, b) => a - b)
  const mean = lums.reduce((s, v) => s + v, 0) / (lums.length || 1)
  const p90 = lums[Math.floor(lums.length * 0.9)] || 0
  return { mean, p90, busyness: gn ? grad / gn : 0 }
}

/** Grade zone stats against the standard. */
export function gradeZone(stats, t) {
  const dark = stats.mean <= t.centerLuminance && stats.p90 <= t.centerHighlight
  const calm = stats.busyness <= t.calm ? 'calm' : stats.busyness <= t.busy ? 'some' : 'busy'
  const whiteContrast = contrastRatio(1, stats.mean)
  return { dark, calm, whiteContrast: Math.round(whiteContrast * 10) / 10, pass: dark && calm !== 'busy' }
}

/** Smallest black scrim (in 0.05 steps) that makes the center dark enough, capped. */
export function scrimNeeded(img, rect, t) {
  for (let s = 0; s <= t.maxScrim + 1e-9; s += 0.05) {
    const st = zoneStats(img, rect, { scrim: s, step: 4 })
    if (st.mean <= t.centerLuminance && st.p90 <= t.centerHighlight) return Math.round(s * 100) / 100
  }
  return t.maxScrim
}
