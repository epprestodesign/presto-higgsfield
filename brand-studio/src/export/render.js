// Canvas renderers for the asset export. They mirror BrandHero (Presto banner:
// one centered layout) and AdCreative (sponsor units) at exact pixel sizes, so
// the preview sheet shows the very files that go into the ZIP.
//
// Fonts: the brand fonts are already loaded from Google Fonts by the app; we
// `document.fonts.load()` each face before drawing. Images are same-origin
// (bundled or data: URLs), so canvases stay exportable.
import { getFont } from '../theme/fonts.js'
import { resolvePalette } from '../theme/brandTheme.js'
import { AD_SIZES } from '../models/ads.js'

const clamp = (min, v, max) => Math.min(max, Math.max(min, v))

const imageCache = new Map()
export function loadImage(src) {
  if (!src) return Promise.resolve(null)
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    }))
  }
  return imageCache.get(src)
}

async function ensureFont(font) {
  try { await document.fonts?.load(font) } catch { /* fall back to whatever is available */ }
}

function canvasOf(w, h, scale = 1) {
  const c = document.createElement('canvas')
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  const ctx = c.getContext('2d')
  ctx.scale(scale, scale)
  return { canvas: c, ctx }
}

function drawCover(ctx, img, x, y, w, h, { filter = 'none', zoom = 1 } = {}) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom
  const dw = img.naturalWidth * r
  const dh = img.naturalHeight * r
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.filter = filter
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

function drawContain(ctx, img, x, y, maxW, maxH, align = 'center') {
  const r = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
  const w = img.naturalWidth * r
  const h = img.naturalHeight * r
  const dx = align === 'left' ? x : x + (maxW - w) / 2
  ctx.drawImage(img, dx, y + (maxH - h) / 2, w, h)
  return { w, h }
}

/** Greedy word wrap; the last allowed line is ellipsized. */
function wrap(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last.trimEnd()}…`
  return kept
}

function setLetterSpacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

// ── Presto banner ─────────────────────────────────────────────────────────

/**
 * @param {object} hero    previewModel.heroProps() shape, with `concept` already
 *                         resolved by resolveHeroConcept()
 * @param {object} o
 *   width, height         output pixels (1440×400 hero, 1440×240 listing band)
 *   size                  'landing' | 'compact' (BrandHero size)
 *   withCopy              false → background only (upload-ready for Presto)
 *   scale                 pixel density (1 = exact size)
 *   logoSrc               draw this logo instead of the kit's (contrast checks)
 * The returned canvas carries `logoRect` ({ x, y, w, h }) when a logo was drawn.
 */
export async function renderBanner(hero, { width = 1440, height = 400, size = 'landing', withCopy = true, scale = 1, logoSrc: logoOverride } = {}) {
  const { canvas, ctx } = canvasOf(width, height, scale)
  const concept = hero.concept || {}
  const t = concept.treatment || {}
  const palette = resolvePalette(hero.brandKit?.colors)
  const bg = t.background || palette.primary
  const fg = t.foreground || '#FFFFFF'
  const W = width
  const H = height
  const cqi = W / 100

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const img = await loadImage(t.imageSrc)
  if (img) {
    const overlay = t.overlay || 'none'
    if (overlay === 'soft') drawCover(ctx, img, 0, 0, W, H, { filter: 'blur(3px) saturate(0.9)', zoom: 1.04 })
    else if (overlay === 'tint') drawCover(ctx, img, 0, 0, W, H, { filter: 'grayscale(0.4) contrast(1.05)' })
    else if (overlay === 'duotone') drawCover(ctx, img, 0, 0, W, H, { filter: 'grayscale(1) contrast(1.1) brightness(0.72)' })
    else drawCover(ctx, img, 0, 0, W, H)

    ctx.save()
    if (overlay === 'dim') {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0.42)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    } else if (overlay === 'scrim') {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2)
      g.addColorStop(0, 'rgba(0,0,0,0.58)'); g.addColorStop(0.7, 'rgba(0,0,0,0.34)'); g.addColorStop(1, 'rgba(0,0,0,0.22)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    } else if (overlay === 'soft') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H)
    } else if (overlay === 'tint') {
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    } else if (overlay === 'duotone') {
      ctx.globalCompositeOperation = 'color'
      const g = ctx.createLinearGradient(0, 0, W, H)
      g.addColorStop(0, bg); g.addColorStop(1, t.accent || palette.secondary)
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()
  }
  if (t.pattern === 'dots' && !img) {
    // Dot texture at the edges, clear behind the copy (BrandHero radial mask).
    ctx.save()
    ctx.fillStyle = fg
    const rx = W / 2
    const ry = H / 2
    for (let y = 9; y < H; y += 18) {
      for (let x = 9; x < W; x += 18) {
        const d = Math.hypot((x - rx) / rx, (y - ry) / ry) / Math.SQRT2
        const a = clamp(0, (d - 0.35) / 0.6, 1) * 0.22
        if (a <= 0.01) continue
        ctx.globalAlpha = a
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.restore()
  }
  if (!withCopy) return canvas

  // Copy — logo, headline, dates · location, tagline; stacked and centered.
  const compact = size === 'compact'
  const headFamily = getFont(concept.headingFont || hero.brandKit?.typography?.heading).family
  const bodyFamily = getFont(hero.brandKit?.typography?.body).family
  const logoH = compact ? clamp(32, 4.4 * cqi, 56) : concept.layout === 'presto' ? clamp(48, 11 * cqi, 120) : clamp(40, 9 * cqi, 96)
  const headPx = compact ? clamp(18, 2.6 * cqi, 30) : clamp(22, 5.4 * cqi, 56)
  const metaPx = clamp(12, 1.5 * cqi, 15)
  const tagPx = clamp(14, 2 * cqi, 20)
  const gap = compact ? 8 : clamp(8, 1.6 * cqi, 16)
  const textGap = compact ? 4 : clamp(4, 1 * cqi, 10)
  const textMax = Math.min(760, W - 2 * clamp(16, 4 * cqi, 40))

  const headFont = `700 ${headPx}px ${headFamily}`
  const metaFont = `700 ${metaPx}px ${bodyFamily}`
  const tagFont = `400 ${tagPx}px ${bodyFamily}`
  await Promise.all([ensureFont(headFont), ensureFont(metaFont), ensureFont(tagFont)])

  const logoSrc = hero.showLogo === false ? '' : logoOverride || hero.brandKit?.logoOnDark?.src || hero.brandKit?.logo?.src || ''
  const logo = await loadImage(logoSrc)
  const meta = [hero.showDates !== false && hero.dates, hero.location].filter(Boolean).join('  ·  ').toUpperCase()
  const tagline = compact ? '' : hero.tagline || ''

  ctx.font = headFont
  const headLines = wrap(ctx, hero.headline || '', textMax, 2)
  ctx.font = tagFont
  const tagLines = tagline ? wrap(ctx, tagline, textMax, 2) : []

  const blocks = []
  if (logo) {
    const boxW = Math.min(W * 0.6, compact ? 180 : W * 0.6)
    const boxX = (W - boxW) / 2
    blocks.push({
      h: logoH,
      gapAfter: gap,
      draw: (y) => {
        const r = drawContain(ctx, logo, boxX, y, boxW, logoH)
        canvas.logoRect = { x: boxX + (boxW - r.w) / 2, y: y + (logoH - r.h) / 2, w: r.w, h: r.h }
      },
    })
  }
  const lh = headPx * 1.05
  blocks.push({ h: lh * headLines.length, font: headFont, lines: headLines, lineH: lh, spacing: -0.01 * headPx, gapAfter: textGap })
  if (meta) blocks.push({ h: metaPx * 1.2, font: metaFont, lines: [meta], lineH: metaPx * 1.2, spacing: 0.06 * metaPx, alpha: 0.9, gapAfter: textGap })
  if (tagLines.length) blocks.push({ h: tagPx * 1.35 * tagLines.length, font: tagFont, lines: tagLines, lineH: tagPx * 1.35, alpha: 0.92, gapAfter: 0 })
  const total = blocks.reduce((n, b, i) => n + b.h + (i < blocks.length - 1 ? b.gapAfter : 0), 0)

  let y = (H - total) / 2
  ctx.save()
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (concept.layout === 'presto' || img) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 2
  }
  for (const b of blocks) {
    if (b.draw) {
      ctx.save(); ctx.shadowColor = 'transparent'; b.draw(y); ctx.restore()
    } else {
      ctx.font = b.font
      ctx.globalAlpha = b.alpha || 1
      setLetterSpacing(ctx, b.spacing || 0)
      b.lines.forEach((line, i) => ctx.fillText(line, W / 2, y + b.lineH * (i + 0.5)))
      ctx.globalAlpha = 1
    }
    y += b.h + b.gapAfter
  }
  ctx.restore()
  return canvas
}

// ── Sponsor display ads ───────────────────────────────────────────────────

const AD_FONT = "'PT Sans', sans-serif"

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function drawLabel(ctx, W, strip) {
  const px = strip ? 8 : 9
  ctx.save()
  ctx.font = `700 ${px}px ${AD_FONT}`
  setLetterSpacing(ctx, px * 0.06)
  const text = 'SPONSORED'
  const tw = ctx.measureText(text).width
  const padX = strip ? 4 : 6
  const h = px * 1.2 + (strip ? 2 : 4)
  const x = W - (strip ? 3 : 4) - tw - padX * 2
  const y = strip ? 3 : 4
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  roundRect(ctx, x, y, tw + padX * 2, h, 3); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2)
  ctx.restore()
}

function drawCta(ctx, label, x, y, w, h, colors, px, { round = false } = {}) {
  ctx.save()
  ctx.fillStyle = colors.accent
  roundRect(ctx, x, y, w, h, round ? h / 2 : 4); ctx.fill()
  ctx.fillStyle = colors.background
  ctx.font = `700 ${px}px ${AD_FONT}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(label, x + w / 2, y + h / 2 + 0.5)
  ctx.restore()
}

/** Ad shape family by aspect ratio (same rules as AdCreative). */
export function adShape(sizeKey) {
  const d = AD_SIZES[sizeKey] || AD_SIZES['300x250']
  const r = d.width / d.height
  if (r <= 0.5) return 'tower'
  if (r < 1.6) return 'box'
  if (r < 5) return d.height <= 100 ? 'strip' : 'billboard'
  return 'strip'
}

export async function renderAd(sponsor, sizeKey, { scale = 1 } = {}) {
  const d = AD_SIZES[sizeKey] || AD_SIZES['300x250']
  const W = d.width
  const H = d.height
  const cqi = W / 100
  const { canvas, ctx } = canvasOf(W, H, scale)
  const colors = { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B', ...(sponsor?.colors || {}) }
  const shape = adShape(sizeKey)
  const tiny = H <= 60

  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, W, H)

  const art = await loadImage(sponsor?.artwork?.[sizeKey]?.src)
  if (art) {
    drawCover(ctx, art, 0, 0, W, H)
    drawLabel(ctx, W, shape === 'strip')
    return canvas
  }

  await Promise.all([ensureFont(`700 20px ${AD_FONT}`), ensureFont(`400 14px ${AD_FONT}`)])
  const logo = await loadImage(sponsor?.logo?.src)
  const name = sponsor?.name || 'Sponsor'
  const tagline = tiny ? '' : sponsor?.tagline || ''
  const cta = sponsor?.cta || 'Learn more'

  // Decorative accent shape
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = colors.accent
  if (shape === 'box') {
    ctx.beginPath(); ctx.ellipse(W * 0.85, H * 0.95, W * 0.35, H * 0.4, 0, 0, Math.PI * 2); ctx.fill()
  } else if (shape === 'tower') {
    ctx.translate(W / 2, H * 0.69); ctx.rotate((-18 * Math.PI) / 180); ctx.fillRect(-W, -H * 0.11, W * 2, H * 0.22)
  } else {
    const bw = W * (shape === 'billboard' ? 0.22 : 0.14)
    const x = W * (shape === 'billboard' ? 0.6 : 0.64)
    const skew = Math.tan((18 * Math.PI) / 180) * H
    ctx.beginPath(); ctx.moveTo(x + skew, 0); ctx.lineTo(x + skew + bw, 0); ctx.lineTo(x + bw, H); ctx.lineTo(x, H); ctx.closePath(); ctx.fill()
  }
  ctx.restore()

  ctx.fillStyle = colors.foreground
  ctx.textBaseline = 'alphabetic'

  if (shape === 'tower') {
    const pad = 10
    let y = 30
    if (logo) { const { h } = drawContain(ctx, logo, W * 0.14, y + 8, W * 0.72, 120); y += 8 + h + 14 }
    const namePx = clamp(16, 13 * cqi, 22)
    ctx.font = `700 ${namePx}px ${AD_FONT}`; ctx.textAlign = 'center'
    for (const line of wrap(ctx, name, W - pad * 2, 3)) { y += namePx * 1.1; ctx.fillText(line, W / 2, y) }
    if (tagline) {
      const tPx = clamp(12, 9 * cqi, 15)
      ctx.font = `400 ${tPx}px ${AD_FONT}`; ctx.globalAlpha = 0.9; y += 10
      for (const line of wrap(ctx, tagline, W - pad * 2, 7)) { y += tPx * 1.3; ctx.fillText(line, W / 2, y) }
      ctx.globalAlpha = 1
    }
    const cPx = clamp(12, 9 * cqi, 14)
    ctx.font = `700 ${cPx}px ${AD_FONT}`
    const lines = wrap(ctx, cta, W - pad * 2 - 12, 2)
    const ch = Math.max(40, lines.length * cPx * 1.2 + 16)
    drawCta(ctx, lines.join(' '), pad, H - 14 - ch, W - pad * 2, ch, colors, cPx)
  } else if (shape === 'box') {
    const x = 20
    let y = 22
    const blockW = W - 40
    if (logo) { const { h } = drawContain(ctx, logo, x, y, W * 0.5, 56, 'left'); y += h + 10 }
    ctx.textAlign = 'left'
    ctx.font = `700 22px ${AD_FONT}`
    for (const line of wrap(ctx, name, blockW, 2)) { y += 22 * 1.1; ctx.fillText(line, x, y) }
    if (tagline) {
      ctx.font = `400 14px ${AD_FONT}`; ctx.globalAlpha = 0.9; y += 6
      for (const line of wrap(ctx, tagline, blockW, 3)) { y += 14 * 1.3; ctx.fillText(line, x, y) }
      ctx.globalAlpha = 1
    }
    ctx.font = `700 14px ${AD_FONT}`
    const cw = ctx.measureText(cta).width + 32
    drawCta(ctx, cta, x, H - 18 - 38, cw, 38, colors, 14)
  } else {
    // billboard + strip: one row — logo · copy · CTA
    const billboard = shape === 'billboard'
    const narrow = W <= 480
    const padX = billboard ? clamp(16, 5 * cqi, 56) : clamp(10, 2.4 * cqi, 24)
    const gap = billboard ? clamp(14, 4 * cqi, 40) : clamp(8, 2 * cqi, 18)
    let x = padX
    if (logo) {
      const { w } = drawContain(ctx, logo, x, H * (billboard ? 0.18 : 0.15), W * (billboard ? 0.24 : 0.18), H * (billboard ? 0.64 : 0.7), 'left')
      x += w + gap
    }
    // CTA (right)
    let cPx = billboard ? clamp(12, 1.8 * cqi, 17) : narrow ? 12 : clamp(12, 1.5 * cqi, 15)
    ctx.font = `700 ${cPx}px ${AD_FONT}`
    let cw
    let chh
    if (tiny) { cw = 28; chh = 28 } else {
      cw = Math.min(ctx.measureText(cta).width + 2 * (billboard ? clamp(12, 2.6 * cqi, 26) : narrow ? 10 : clamp(10, 2 * cqi, 20)), narrow ? W * 0.38 : W)
      chh = billboard ? clamp(34, 5.4 * cqi, 52) : clamp(28, 4.2 * cqi, 40)
    }
    const cx = W - padX - cw
    drawCta(ctx, tiny ? '›' : cta, cx, (H - chh) / 2, cw, chh, colors, tiny ? 18 : cPx, { round: tiny })
    // Copy (middle)
    const copyW = cx - gap - x
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    if (billboard) {
      const nPx = clamp(18, 3.8 * cqi, 38)
      const tPx = clamp(12, 1.9 * cqi, 19)
      ctx.font = `700 ${nPx}px ${AD_FONT}`
      const nLines = wrap(ctx, name, copyW, 2)
      ctx.font = `400 ${tPx}px ${AD_FONT}`
      const tLines = tagline ? wrap(ctx, tagline, copyW, 2) : []
      const total = nLines.length * nPx * 1.1 + (tLines.length ? clamp(4, cqi, 10) + tLines.length * tPx * 1.3 : 0)
      let y = (H - total) / 2
      ctx.font = `700 ${nPx}px ${AD_FONT}`
      nLines.forEach((l) => { ctx.fillText(l, x, y + nPx * 0.55); y += nPx * 1.1 })
      if (tLines.length) {
        y += clamp(4, cqi, 10)
        ctx.font = `400 ${tPx}px ${AD_FONT}`; ctx.globalAlpha = 0.9
        tLines.forEach((l) => { ctx.fillText(l, x, y + tPx * 0.65); y += tPx * 1.3 })
        ctx.globalAlpha = 1
      }
    } else if (narrow) {
      const nPx = tiny ? 14 : 15
      ctx.font = `700 ${nPx}px ${AD_FONT}`
      const nLines = wrap(ctx, name, copyW, tiny ? 1 : 2)
      ctx.font = `400 12px ${AD_FONT}`
      const tLines = tagline ? wrap(ctx, tagline, copyW, nLines.length > 1 ? 1 : 2) : []
      const total = nLines.length * nPx * 1.15 + (tLines.length ? 2 + tLines.length * 12 * 1.3 : 0)
      let y = (H - total) / 2
      ctx.font = `700 ${nPx}px ${AD_FONT}`
      nLines.forEach((l) => { ctx.fillText(l, x, y + nPx * 0.58); y += nPx * 1.15 })
      if (tLines.length) {
        y += 2
        ctx.font = `400 12px ${AD_FONT}`; ctx.globalAlpha = 0.9
        tLines.forEach((l) => { ctx.fillText(l, x, y + 12 * 0.65); y += 12 * 1.3 })
        ctx.globalAlpha = 1
      }
    } else {
      const nPx = clamp(14, 2.6 * cqi, 24)
      const tPx = clamp(12, 1.6 * cqi, 15)
      ctx.font = `700 ${nPx}px ${AD_FONT}`
      const nameText = wrap(ctx, name, copyW, 1)[0] || ''
      const nw = ctx.measureText(nameText).width
      ctx.fillText(nameText, x, H / 2)
      if (tagline && copyW - nw > 60) {
        ctx.font = `400 ${tPx}px ${AD_FONT}`; ctx.globalAlpha = 0.9
        ctx.fillText(wrap(ctx, tagline, copyW - nw - clamp(6, 1.6 * cqi, 16), 1)[0] || '', x + nw + clamp(6, 1.6 * cqi, 16), H / 2 + 1)
        ctx.globalAlpha = 1
      }
    }
  }
  drawLabel(ctx, W, shape === 'strip')
  return canvas
}

/** canvas → Blob */
export const canvasBlob = (canvas, type = 'image/png', quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), type, quality))
