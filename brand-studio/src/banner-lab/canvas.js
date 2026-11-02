// Banner Lab — browser side: load images onto canvases, optimize a logo for the
// Presto system, and render the two banner crops at their exact sizes.
import { resizeCanvas, logoContrast } from '../export/logo.js'
import { LOGO_SPEC, BANNER_SPECS, SYSTEM_DARK, CENTER_ZONE, THRESHOLDS, PLACEMENTS, fitInBox } from './standards.js'
import {
  detectBackground, removeBackground, alphaBounds, extractPalette, logoContrastOn, knockout,
  coverCrop, centerZone, zoneStats, gradeZone, scrimNeeded, makeImage, contentBounds,
} from './pixels.js'
import { vectorize } from './vectorize.js'
import { analyzeReference } from './optimizePrompt.js'

/** Remote generated images go through the dev proxy so canvases stay exportable. */
export const sameOrigin = (src) => (/^https:\/\//.test(src) ? `/hf-api/_image?url=${encodeURIComponent(src)}` : src)

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = sameOrigin(src)
  })
}

export const readFile = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new Error('Could not read that file.'))
  r.readAsDataURL(file)
})

export function canvasOf(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

export const pixelsOf = (canvas) => canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height)

export function canvasFromPixels(img) {
  const c = canvasOf(img.width, img.height)
  c.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0)
  return c
}

/** Logo centered in a transparent square; scales up as well as down (smoothly). */
export function squareLogo(src, size, pad = LOGO_SPEC.padding) {
  const box = size * (1 - 2 * pad)
  const r = box / Math.max(src.width, src.height)
  const inner = r < 1 ? resizeCanvas(src, src.width * r, src.height * r) : src
  const out = canvasOf(size, size)
  const ctx = out.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  const w = src.width * r
  const h = src.height * r
  ctx.drawImage(inner, (size - w) / 2, (size - h) / 2, w, h)
  return out
}

// ── On-dark treatments ────────────────────────────────────────────────────

/** White stroke around the logo's silhouette (stamped in 24 directions). */
function outlined(src, radius) {
  const pad = Math.ceil(radius) + 2
  const white = canvasFromPixels(knockout(pixelsOf(src), '#FFFFFF'))
  const out = canvasOf(src.width + pad * 2, src.height + pad * 2)
  const ctx = out.getContext('2d')
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2
    ctx.drawImage(white, pad + Math.cos(a) * radius, pad + Math.sin(a) * radius)
  }
  ctx.drawImage(src, pad, pad)
  return out
}

/** Rounded white plate behind the logo, like a badge. */
function plated(src) {
  const pad = Math.round(Math.max(src.width, src.height) * 0.12)
  const out = canvasOf(src.width + pad * 2, src.height + pad * 2)
  const ctx = out.getContext('2d')
  const r = Math.min(out.width, out.height) * 0.22
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(0, 0, out.width, out.height, r)
  ctx.fill()
  ctx.drawImage(src, pad, pad)
  return out
}

export const TREATMENTS = [
  { id: 'original', label: 'Original colours', hint: 'As uploaded' },
  { id: 'outline', label: 'White outline', hint: 'Keeps the colours, adds an edge that reads on dark' },
  { id: 'white', label: 'All white', hint: 'One-colour knockout, the most legible on dark art' },
  { id: 'plate', label: 'White badge', hint: 'Logo on a rounded white plate' },
]

function treat(trimmed, id) {
  if (id === 'white') return canvasFromPixels(knockout(pixelsOf(trimmed), '#FFFFFF'))
  if (id === 'outline') return outlined(trimmed, Math.max(2, Math.max(trimmed.width, trimmed.height) * 0.018))
  if (id === 'plate') return plated(trimmed)
  return trimmed
}

// ── Logo optimization ─────────────────────────────────────────────────────

const WORK_EDGE = 1600 // long edge we analyse at (vectors rasterize to this)

/**
 * Step one, like WhatTheFont: read the upload and find the logo in it, so the
 * selection box can start around it.
 * @returns { src, name, type, isVector, nw, nh, scale, base, background, region }
 */
export async function prepareUpload(src, { name = 'logo', type = '' } = {}) {
  const img = await loadImage(src)
  const isVector = /svg/.test(type) || /^data:image\/svg/.test(src) || /\.svg(\?|$)/.test(src)
  const nw = img.naturalWidth || 1024
  const nh = img.naturalHeight || 1024
  const scale = isVector ? WORK_EDGE / Math.max(nw, nh) : Math.min(1, WORK_EDGE / Math.max(nw, nh))
  const base = canvasOf(nw * scale, nh * scale)
  base.getContext('2d').drawImage(img, 0, 0, base.width, base.height)
  const background = detectBackground(pixelsOf(base))
  const region = contentBounds(pixelsOf(base), background)
  // A little air around the detected logo so the box doesn't sit on the edge.
  const pad = Math.round(Math.max(region.w, region.h) * 0.03)
  const padded = {
    x: Math.max(0, region.x - pad), y: Math.max(0, region.y - pad),
    w: Math.min(base.width, region.x + region.w + pad) - Math.max(0, region.x - pad),
    h: Math.min(base.height, region.y + region.h + pad) - Math.max(0, region.y - pad),
  }
  return { src, name, type, isVector, nw, nh, scale, base, background, region: padded }
}

/**
 * Optimize the selected part of an upload for the Presto system.
 * @param prep  prepareUpload() result
 * @param opts  { crop (base px; defaults to the detected region), removeBg }
 */
export async function optimizeLogo(prep, { crop = prep.region, removeBg = true } = {}) {
  const { name, type, isVector, nw, nh, scale } = prep
  const c = { x: Math.round(crop.x), y: Math.round(crop.y), w: Math.max(1, Math.round(crop.w)), h: Math.max(1, Math.round(crop.h)) }
  const base = canvasOf(c.w, c.h)
  base.getContext('2d').drawImage(prep.base, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)

  const raw = pixelsOf(base)
  // Judge the background on the crop; fall back to the whole upload's verdict
  // when the crop is tight (its border is mostly logo).
  const own = detectBackground(raw)
  const background = own.kind === 'complex' && prep.background.kind !== 'complex' ? prep.background : own
  const cleaned = background.kind === 'solid' && removeBg ? removeBackground(raw, background.color) : raw
  const bounds = alphaBounds(cleaned) || { x: 0, y: 0, w: cleaned.width, h: cleaned.height }
  const cleanedCanvas = canvasFromPixels(cleaned)
  const trimmed = canvasOf(bounds.w, bounds.h)
  trimmed.getContext('2d').drawImage(cleanedCanvas, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h)
  const trimmedPx = pixelsOf(trimmed)

  // Effective source resolution of the artwork (vectors are always sharp).
  const longEdge = isVector ? Infinity : Math.max(bounds.w, bounds.h) / scale
  const aspect = bounds.w / bounds.h
  const palette = extractPalette(trimmedPx)
  const onDark = logoContrastOn(trimmedPx, SYSTEM_DARK)
  const recommended = onDark.verdict === 'good' ? 'original' : onDark.verdict === 'partial' ? 'outline' : 'white'
  const trimmedShare = 1 - (bounds.w * bounds.h) / (cleaned.width * cleaned.height)

  const checks = [
    background.kind === 'transparent'
      ? { id: 'bg', status: 'pass', title: 'Transparent background', detail: 'Ready to sit on any banner.' }
      : background.kind === 'solid' && removeBg
        ? { id: 'bg', status: 'fixed', title: 'Background removed', detail: `Took out the flat ${rgbLabel(background.color)} box around the logo; inner shapes are kept.` }
        : background.kind === 'solid'
          ? { id: 'bg', status: 'warn', title: 'Solid background kept', detail: 'The logo will show as a box on the banner.' }
          : { id: 'bg', status: 'warn', title: 'Busy background', detail: 'This looks like a photo or gradient behind the logo, which can’t be removed cleanly. Upload a transparent PNG or SVG, or use the white badge.' },
    trimmedShare > 0.02
      ? { id: 'trim', status: 'fixed', title: 'Empty space trimmed', detail: `Removed ${Math.round(trimmedShare * 100)}% empty margin so the logo fills its slot.` }
      : { id: 'trim', status: 'pass', title: 'Tight to the artwork', detail: 'No extra margin to trim.' },
    { id: 'size', status: 'fixed', title: `Sized to ${LOGO_SPEC.size}×${LOGO_SPEC.size}`, detail: `Centered in the ${LOGO_SPEC.size}px brand-logo slot with ${Math.round(LOGO_SPEC.padding * 100)}% padding, plus a ${LOGO_SPEC.retina}px copy for retina screens.` },
    isVector
      ? { id: 'res', status: 'pass', title: 'Vector logo', detail: 'Sharp at every size.' }
      : longEdge >= LOGO_SPEC.crispLongEdge
        ? { id: 'res', status: 'pass', title: 'High resolution', detail: `${Math.round(longEdge)}px artwork: sharp at 1x and 2x.` }
        : longEdge >= LOGO_SPEC.minLongEdge
          ? { id: 'res', status: 'warn', title: 'Fine at 1x, soft on retina', detail: `${Math.round(longEdge)}px artwork. ${LOGO_SPEC.crispLongEdge}px or an SVG would be crisp on high-density screens.` }
          : { id: 'res', status: 'fail', title: 'Low resolution', detail: `${Math.round(longEdge)}px artwork will look blurry. Upload at least ${LOGO_SPEC.crispLongEdge}px on the long edge, or an SVG.` },
    aspect > LOGO_SPEC.wideRatio
      ? { id: 'shape', status: 'warn', title: 'Wide wordmark', detail: `It’s ${aspect.toFixed(1)}:1, so it reads small in the square slot. On the banners it sits at full width.` }
      : { id: 'shape', status: 'pass', title: 'Fits the square slot', detail: `${aspect.toFixed(1)}:1 proportions.` },
    onDark.verdict === 'good'
      ? { id: 'contrast', status: 'pass', title: 'Reads on dark banners', detail: `${onDark.ratio}:1 against the system navy.` }
      : { id: 'contrast', status: 'fixed', title: onDark.verdict === 'partial' ? 'Partly blends into dark banners' : 'Disappears on dark banners', detail: `${onDark.ratio}:1 against the system navy (graphics need 3:1). Recommended: ${TREATMENTS.find((t) => t.id === recommended).label.toLowerCase()}.` },
  ]

  const treatments = Object.fromEntries(TREATMENTS.map((t) => {
    const canvas = treat(trimmed, t.id)
    return [t.id, { canvas, square: squareLogo(canvas, LOGO_SPEC.size), squareRetina: squareLogo(canvas, LOGO_SPEC.retina) }]
  }))

  return {
    name,
    source: { src: prep.src, width: nw, height: nh, isVector, type },
    background, bounds, aspect, palette, onDark, recommended, checks, treatments,
    preview: { before: base, after: trimmed },
  }
}

// ── Vector + Presto sizes ─────────────────────────────────────────────────

const TRACE_EDGE = 720 // trace at this size: plenty of detail for a logo, fast

/** SVG of a logo canvas (traced). For an uploaded SVG, `original` is kept as-is. */
export function vectorizeCanvas(canvas, opts) {
  const r = Math.min(1, TRACE_EDGE / Math.max(canvas.width, canvas.height))
  const small = r < 1 ? resizeCanvas(canvas, canvas.width * r, canvas.height * r) : canvas
  return vectorize(pixelsOf(small), opts)
}

export const svgDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/**
 * The logo at its exact Presto size for each placement, as transparent PNGs
 * (1x and 2x). The brand-logo slot is the padded 200×200 square; the others
 * are tight to the artwork at the width × height the placement gives it.
 */
export function placementAssets(logo) {
  const aspect = logo.width / logo.height
  return PLACEMENTS.map((p) => {
    if (p.square) {
      return { ...p, size: { w: p.box.w, h: p.box.h, limit: 'square' }, png1x: squareLogo(logo, p.box.w), png2x: squareLogo(logo, p.box.w * 2) }
    }
    const size = fitInBox(aspect, p.box)
    return { ...p, size, png1x: resizeCanvas(logo, size.w, size.h), png2x: resizeCanvas(logo, size.w * 2, size.h * 2) }
  })
}

/** Analysis of a reference image (colours, light, temperature, photo vs graphic). */
export async function analyzeReferenceSrc(src) {
  const img = await loadImage(src)
  const r = 160 / Math.max(img.naturalWidth || 160, img.naturalHeight || 160)
  const c = canvasOf((img.naturalWidth || 160) * r, (img.naturalHeight || 160) * r)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return analyzeReference(pixelsOf(c))
}

const rgbLabel = ([r, g, b]) => (r + g + b > 700 ? 'white' : r + g + b < 60 ? 'black' : 'solid-colour')

// ── Banners ───────────────────────────────────────────────────────────────

/**
 * One banner at its exact size. Background art is cover-cropped around the
 * shared focal point, then softened (blur) and darkened (scrim) as set.
 * Returns { canvas, background, logoRect }.
 */
export function renderBanner(art, spec, { fx = 0.5, fy = 0.5, zoom = 1, scrim = 0, blur = 0 } = {}, logo = null) {
  const background = canvasOf(spec.width, spec.height)
  const ctx = background.getContext('2d')
  const crop = coverCrop(art.naturalWidth || art.width, art.naturalHeight || art.height, spec.width, spec.height, { fx, fy, zoom })
  ctx.imageSmoothingQuality = 'high'
  if (blur) {
    // Blur bleeds transparent edges in; overdraw a little and clip.
    const m = blur * 3
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(art, crop.x, crop.y, crop.w, crop.h, -m, -m, spec.width + m * 2, spec.height + m * 2)
    ctx.filter = 'none'
  } else {
    ctx.drawImage(art, crop.x, crop.y, crop.w, crop.h, 0, 0, spec.width, spec.height)
  }
  if (scrim) {
    ctx.fillStyle = `rgba(0,0,0,${scrim})`
    ctx.fillRect(0, 0, spec.width, spec.height)
  }
  const canvas = canvasOf(spec.width, spec.height)
  const cctx = canvas.getContext('2d')
  cctx.drawImage(background, 0, 0)
  let logoRect = null
  if (logo) {
    const r = Math.min(spec.logoHeight / logo.height, spec.logoMaxWidth / logo.width)
    const w = logo.width * r
    const h = logo.height * r
    logoRect = { x: (spec.width - w) / 2, y: (spec.height - h) / 2, w, h }
    cctx.imageSmoothingQuality = 'high'
    cctx.drawImage(r < 1 ? resizeCanvas(logo, w, h) : logo, logoRect.x, logoRect.y, w, h)
  }
  return { canvas, background, logoRect, crop }
}

/** Standards report for one rendered banner. */
export function checkBanner(rendered, spec, logo) {
  const px = pixelsOf(rendered.background)
  const zone = centerZone(spec.width, spec.height, CENTER_ZONE)
  const stats = zoneStats(px, zone)
  const grade = gradeZone(stats, THRESHOLDS)
  const logoCheck = logo && rendered.logoRect ? logoContrast(rendered.background, logo, rendered.logoRect) : null
  return { stats, grade, logo: logoCheck, zone }
}

/** Auto-fit: the scrim the landing crop needs (it is the stricter of the two). */
export function autoScrim(art, view) {
  const spec = BANNER_SPECS[0]
  const { background } = renderBanner(art, spec, { ...view, scrim: 0 })
  return scrimNeeded(pixelsOf(background), centerZone(spec.width, spec.height, CENTER_ZONE), THRESHOLDS)
}

export const canvasBlob = (canvas, type = 'image/png', quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export { makeImage }
