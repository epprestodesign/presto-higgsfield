// Logo clean-up for the Studio (browser, canvas). Two stages:
//   1. cleanupMethods(): the same upload cleaned several ways (edge fill,
//      colour key, soft edges, SVG trace), each with what it's good and bad at.
//   2. darkLooks(): the cleaned logo in looks that read on dark Presto banners
//      (white, outline, glow, white box, brand colour, shadow), each drawn on
//      the system navy and on a photo banner at its real landing-overlay size,
//      and scored on how well its edge separates from what's around it.
import { loadImage, canvasOf, pixelsOf, canvasFromPixels, vectorizeCanvas, svgDataUrl } from './canvas.js'
import {
  detectBackground, removeBackground, keyOut, alphaBounds, extractPalette, reverseKnockout, knockout,
  edgeContrast, haloShare, luminance, contrastRatio, hexToRgb,
} from './pixels.js'
import { SYSTEM_DARK, PLACEMENTS, fitInBox } from './standards.js'

const WORK_EDGE = 900 // analyse uploads at this long edge
const LOOK_EDGE = 600 // build looks at this long edge
// The landing banner (1440×400) at 2/3 scale; tiles show its center 560px so
// the logo is big enough to judge, still at its true size against the banner height.
const BANNER = { w: 960, h: 267 }
const TILE = { w: 560, h: 267 }

function scaled(src, longEdge) {
  const r = Math.min(1, longEdge / Math.max(src.width, src.height))
  const c = canvasOf(Math.max(1, Math.round(src.width * r)), Math.max(1, Math.round(src.height * r)))
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, c.width, c.height)
  return c
}

function trimmed(img) {
  const b = alphaBounds(img)
  const full = canvasFromPixels(img)
  if (!b) return full
  const c = canvasOf(b.w, b.h)
  c.getContext('2d').drawImage(full, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h)
  return c
}

const png = (c) => c.toDataURL('image/png')
const share = (n) => `${Math.round(n * 100)}%`

/** Pixels the colour key cleared that the edge fill kept (holes inside shapes). */
function holesCleared(flood, key) {
  let n = 0, total = 0
  for (let i = 3; i < flood.data.length; i += 4) {
    if (flood.data[i] > 128) total++
    if (flood.data[i] > 128 && key.data[i] < 64) n++
  }
  return total ? n / total : 0
}

const edgeLabel = (h) => (h < 0.04 ? 'Clean edge' : h < 0.15 ? 'Slight light edge' : 'Light halo on dark')

// ── 1 · Clean-up methods ──────────────────────────────────────────────────

/**
 * @returns {{ before, background, methods: [{ id, label, hint, url, canvas, stats: [], tone }], recommended }}
 */
export async function cleanupMethods(src) {
  const img = await loadImage(src)
  const base = scaled(img, WORK_EDGE)
  const raw = pixelsOf(base)
  const background = detectBackground(raw)
  const methods = []

  if (background.kind === 'transparent') {
    const c = trimmed(raw)
    methods.push({ id: 'trim', label: 'Already transparent', hint: 'Nothing to remove. Trimmed to the artwork.', canvas: c, stats: [{ label: 'Clean edge', tone: 'ok' }] })
  } else if (background.kind === 'solid') {
    const color = background.color
    const flood = removeBackground(raw, color)
    const key = keyOut(raw, color)
    const soft = removeBackground(raw, color, { tolerance: 54, feather: 46 })
    const holes = holesCleared(flood, key)
    const add = (id, label, hint, px, extra = []) => {
      const halo = haloShare(px, color)
      methods.push({
        id, label, hint, canvas: trimmed(px), halo,
        stats: [{ label: edgeLabel(halo), tone: halo < 0.04 ? 'ok' : halo < 0.15 ? 'warn' : 'bad' }, ...extra],
      })
    }
    add('flood', 'Edge fill', 'Takes the box away from the outside in. White shapes inside the logo stay.', flood, [{ label: 'Inner whites kept', tone: 'ok' }])
    add('key', 'Colour key', 'Removes the background colour everywhere, inside letters too. Can also eat logo parts in that colour.', key, [
      holes > 0.005 ? { label: `${share(holes)} of the logo cleared`, tone: holes > 0.03 ? 'bad' : 'warn' } : { label: 'Nothing extra cleared', tone: 'ok' },
    ])
    add('soft', 'Soft edges', 'A wider blend at the edge: best for JPEGs and soft shadows, can thin very fine lines.', soft)
  } else {
    methods.push({
      id: 'asis', label: 'Keep the background', hint: 'There’s a photo or gradient behind the logo, which can’t come out cleanly. Use the white box look, or upload a PNG or SVG.',
      canvas: base, stats: [{ label: 'Busy background', tone: 'warn' }],
    })
  }
  methods.forEach((m) => { m.url = png(m.canvas) })

  const pick = methods.find((m) => m.id === 'trim' || m.id === 'asis')
    || (() => {
      const flood = methods.find((m) => m.id === 'flood')
      const soft = methods.find((m) => m.id === 'soft')
      return flood.halo >= 0.04 && soft.halo < flood.halo * 0.6 ? soft : flood
    })()

  return { before: png(scaled(base, 600)), background, methods, recommended: pick.id }
}

/** The SVG-trace method, built from another method's result (slower, so separate). */
export async function vectorMethod(from) {
  const palette = extractPalette(pixelsOf(from.canvas), 8)
  const traced = vectorizeCanvas(from.canvas, { colors: Math.min(8, Math.max(2, palette.length + 1)), detail: 'balanced' })
  const svgImg = await loadImage(svgDataUrl(traced.svg))
  const c = canvasOf(from.canvas.width, from.canvas.height)
  c.getContext('2d').drawImage(svgImg, 0, 0, c.width, c.height)
  return {
    id: 'vector', label: 'SVG trace', hint: 'Redrawn as vector shapes: sharp at any size and a small file. Fine detail gets simplified.',
    canvas: c, url: svgDataUrl(traced.svg), svg: traced.svg,
    stats: [{ label: `${traced.paths} shapes · ${Math.max(1, Math.round(traced.bytes / 1024))} KB`, tone: 'ok' }, { label: 'Sharp at any size', tone: 'ok' }],
  }
}

// ── 2 · Looks on dark banners ─────────────────────────────────────────────

// Order = preference when several pass: keep the brand's colours if it reads.
export const LOOKS = [
  { id: 'original', label: 'Original colours', hint: 'As cleaned up', keeps: true },
  { id: 'white', label: 'White', hint: 'One colour; light details become cut-outs so the banner shows through', keeps: false },
  { id: 'outline', label: 'White outline', hint: 'Brand colours with a thin white edge', keeps: true },
  { id: 'glow', label: 'Soft glow', hint: 'A soft white halo lifts it off dark art', keeps: true },
  { id: 'box', label: 'White box', hint: 'The logo as-is on a rounded white plate', keeps: true },
  { id: 'brand', label: 'Brand colour', hint: 'One brand colour that reads on navy', keeps: false },
  { id: 'shadow', label: 'Drop shadow', hint: 'A soft dark shadow; helps on bright, busy photos', keeps: true },
]

/** A white silhouette's halo (via canvas shadows, which every browser draws). */
function halo(silhouette, { color, blur, passes = 2, dx = 0, dy = 0 }) {
  const pad = Math.ceil(blur * 2 + Math.max(Math.abs(dx), Math.abs(dy)))
  const out = canvasOf(silhouette.width + pad * 2, silhouette.height + pad * 2)
  const ctx = out.getContext('2d')
  const far = out.width + silhouette.width + 10
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = far + dx
  ctx.shadowOffsetY = dy
  for (let k = 0; k < passes; k++) ctx.drawImage(silhouette, pad - far, pad)
  return { canvas: out, pad }
}

function buildLook(id, logo, { brandHex }) {
  const edge = Math.max(logo.width, logo.height)
  const px = pixelsOf(logo)
  if (id === 'white' || id === 'brand') {
    const { img, cutouts } = reverseKnockout(px, id === 'white' ? '#FFFFFF' : brandHex)
    return { canvas: canvasFromPixels(img), ox: 0, oy: 0, cutouts }
  }
  if (id === 'outline') {
    const r = Math.max(3, edge * 0.03)
    const pad = Math.ceil(r) + 2
    const white = canvasFromPixels(knockout(px, '#FFFFFF'))
    const out = canvasOf(logo.width + pad * 2, logo.height + pad * 2)
    const ctx = out.getContext('2d')
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      ctx.drawImage(white, pad + Math.cos(a) * r, pad + Math.sin(a) * r)
    }
    ctx.drawImage(logo, pad, pad)
    return { canvas: out, ox: pad, oy: pad }
  }
  if (id === 'glow' || id === 'shadow') {
    const sil = canvasFromPixels(knockout(px, '#FFFFFF'))
    const h = id === 'glow'
      ? halo(sil, { color: 'rgba(255,255,255,1)', blur: edge * 0.035, passes: 5 })
      : halo(sil, { color: 'rgba(0,0,0,0.75)', blur: edge * 0.045, passes: 2, dx: 0, dy: edge * 0.02 })
    h.canvas.getContext('2d').drawImage(logo, h.pad, h.pad)
    return { canvas: h.canvas, ox: h.pad, oy: h.pad }
  }
  if (id === 'box') {
    const pad = Math.round(edge * 0.1)
    const out = canvasOf(logo.width + pad * 2, logo.height + pad * 2)
    const ctx = out.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(0, 0, out.width, out.height, Math.min(out.width, out.height) * 0.12)
    ctx.fill()
    ctx.drawImage(logo, pad, pad)
    return { canvas: out, ox: pad, oy: pad }
  }
  return { canvas: logo, ox: 0, oy: 0 }
}

/** The lightest-reading brand colour that isn't white, if one works on navy. */
function brandColour(palette) {
  const navyL = luminance(...hexToRgb(SYSTEM_DARK))
  return palette
    .map((c) => ({ hex: c.hex, l: luminance(...hexToRgb(c.hex)) }))
    .filter((c) => c.l < 0.85 && contrastRatio(c.l, navyL) >= 4)
    .sort((a, b) => contrastRatio(b.l, navyL) - contrastRatio(a.l, navyL))[0]?.hex || null
}

/** Draw a look centered on a banner tile at the landing-overlay size; score it. */
function scene(look, logo, bg) {
  const box = PLACEMENTS.find((p) => p.id === 'hero')?.box || { w: 708, h: 120 }
  const k = BANNER.w / 1440
  const fit = fitInBox(logo.width / logo.height, { w: box.w * k, h: box.h * k })
  const s = fit.h / logo.height
  const c = canvasOf(TILE.w, TILE.h)
  const ctx = c.getContext('2d')
  if (bg.image) {
    const r = Math.max(BANNER.w / bg.image.width, BANNER.h / bg.image.height)
    const w = bg.image.width * r, h = bg.image.height * r
    ctx.drawImage(bg.image, (TILE.w - w) / 2, (TILE.h - h) / 2, w, h)
  } else {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, TILE.w, TILE.h)
  }
  const lx = TILE.w / 2 - (logo.width * s) / 2
  const ly = TILE.h / 2 - (logo.height * s) / 2
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(look.canvas, lx - look.ox * s, ly - look.oy * s, look.canvas.width * s, look.canvas.height * s)

  // Score on the region around the logo only.
  const r = 3
  const m = r * 3
  const rx = Math.max(0, Math.floor(lx) - m), ry = Math.max(0, Math.floor(ly) - m)
  const rw = Math.min(TILE.w - rx, Math.ceil(logo.width * s) + m * 2), rh = Math.min(TILE.h - ry, Math.ceil(logo.height * s) + m * 2)
  const maskC = canvasOf(rw, rh)
  maskC.getContext('2d').drawImage(logo, lx - rx, ly - ry, logo.width * s, logo.height * s)
  const ma = maskC.getContext('2d').getImageData(0, 0, rw, rh).data
  const mask = new Uint8Array(rw * rh)
  for (let p = 0; p < mask.length; p++) mask[p] = ma[p * 4 + 3] >= 128 ? 1 : 0
  const region = ctx.getImageData(rx, ry, rw, rh)
  return { url: c.toDataURL('image/jpeg', 0.86), score: edgeContrast(region, mask, r) }
}

const passes = (l) => l.navy.verdict === 'good' && (!l.photo || l.photo.verdict === 'good')
const worst = (l) => Math.min(l.navy.ratio, l.photo?.ratio ?? Infinity)

/**
 * @param logoCanvas  the cleaned, trimmed logo (from a clean-up method)
 * @param photoSrc    a photo banner to try it on (optional)
 * @returns {{ looks: [{ id, label, hint, keeps, navy, photo, navyUrl, photoUrl, assetUrl }], recommended }}
 */
export async function darkLooks(logoCanvas, { photoSrc = '' } = {}) {
  const logo = scaled(logoCanvas, LOOK_EDGE)
  const palette = extractPalette(pixelsOf(logo), 6)
  const brandHex = brandColour(palette)
  let photo = null
  if (photoSrc) { try { photo = await loadImage(photoSrc) } catch { photo = null } }

  const looks = []
  for (const def of LOOKS) {
    if (def.id === 'brand' && !brandHex) continue
    const look = buildLook(def.id, logo, { brandHex })
    const navy = scene(look, logo, { color: SYSTEM_DARK })
    const onPhoto = photo ? scene(look, logo, { image: photo }) : null
    looks.push({
      ...def,
      label: def.id === 'white' ? (look.cutouts ? 'White, with cut-outs' : 'All white') : def.id === 'brand' ? `Brand colour ${brandHex}` : def.label,
      swatch: def.id === 'brand' ? brandHex : null,
      navy: navy.score, navyUrl: navy.url,
      photo: onPhoto?.score || null, photoUrl: onPhoto?.url || '',
      assetUrl: def.id === 'original' ? '' : png(look.canvas),
    })
    await new Promise((r) => setTimeout(r)) // let the page breathe between looks
  }
  const recommended = (looks.find(passes) || [...looks].sort((a, b) => worst(b) - worst(a))[0]).id
  return { looks, recommended, palette }
}
