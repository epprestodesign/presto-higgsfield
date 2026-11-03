// Higgsfield image models for ads (mocked). Each ad size is generated on its
// own, as a whole ad with its text baked in. The agent picks a model per size
// and says why; people can switch ("Try another model"). Changes are asked for
// in plain words; the prompt stays hidden.
//
// The model IDs are the ones brand-studio's Higgsfield proxy allows
// (brand-studio/server/higgsfield.js ALLOWED_ENDPOINTS). Nothing is called:
// `mockGenerate` draws a stand-in on a canvas, styled per model so switching
// is visible.
import { AD_SIZES } from '@bs/models/ads.js'

export const MODELS = [
  { id: 'recraft/v4.1/text-to-image', label: 'Recraft 4.1', note: 'Clean, graphic layouts with crisp logos' },
  { id: 'recraft/v4.1-pro/text-to-image', label: 'Recraft 4.1 Pro', note: 'Recraft with more polish and detail' },
  { id: 'ideogram/v4.0', label: 'Ideogram 4', note: 'The most reliable lettering, even at small sizes' },
  { id: 'higgsfield-ai/soul/standard', label: 'Higgsfield Soul', note: 'Photo-real scenes from the event' },
  { id: 'marketing-studio/image/flare', label: 'Marketing Studio Flare', note: 'Bold, ad-style lighting and product shots' },
]
export const modelById = (id) => MODELS.find((m) => m.id === id) || MODELS[0]

const thin = (size) => { const { width: w, height: h } = AD_SIZES[size]; return h <= 100 || w / h > 3 || w / h < 0.4 }

/** The agent's pick for one size of an ad: `{ id, why }`. A model the person chose wins. */
export function pickModel(ad, size) {
  if (ad.model) return { id: ad.model, why: 'your pick' }
  if (thin(size)) return { id: 'ideogram/v4.0', why: 'its lettering stays readable in thin and small sizes' }
  const T = typeById(ad.type)
  if (T) return { id: T.model, why: `it suits the ${T.label} look` }
  if (ad.purpose === 'sponsor') return { id: 'recraft/v4.1/text-to-image', why: 'it keeps sponsor logos clean' }
  return { id: 'higgsfield-ai/soul/standard', why: 'it makes photo-real scenes from your event' }
}

// ---------- Stand-in generation (canvas) ----------
const cache = new Map()
function load(src) {
  if (!src) return Promise.resolve(null)
  if (!cache.has(src)) cache.set(src, new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src }))
  return cache.get(src)
}
function cover(ctx, img, x, y, w, h) {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  ctx.drawImage(img, x + (w - img.naturalWidth * k) / 2, y + (h - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k)
}
function contain(ctx, img, x, y, w, h) {
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight)
  ctx.drawImage(img, x + (w - img.naturalWidth * k) / 2, y + (h - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k)
}
// Wrap text into at most `max` lines that fit `width`.
function lines(ctx, text, width, max) {
  const out = []
  let line = ''
  for (const w of (text || '').split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= width || !line) line = next
    else { out.push(line); line = w }
    if (out.length === max) break
  }
  if (line && out.length < max) out.push(line)
  if (out.length === max && ctx.measureText(out[max - 1]).width > width) out[max - 1] = `${out[max - 1].slice(0, -2)}…`
  return out
}
function pill(ctx, x, y, text, { size, bg, fg, pad = 0.9 }) {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`
  const w = ctx.measureText(text).width + size * pad * 2
  const h = size * 2.1
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill()
  ctx.fillStyle = fg
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + size * pad, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
  return { w, h }
}

// What each model brings to the lettering and finish.
const STYLE = {
  'recraft/v4.1/text-to-image': { font: (s) => `700 ${s}px Inter, system-ui, sans-serif`, art: 'graphic', upper: false },
  'recraft/v4.1-pro/text-to-image': { font: (s) => `800 ${s}px Inter, system-ui, sans-serif`, art: 'graphic-pro', upper: false },
  'ideogram/v4.0': { font: (s) => `900 ${s}px Oswald, Impact, 'Arial Narrow', sans-serif`, art: 'type', upper: true },
  'higgsfield-ai/soul/standard': { font: (s) => `700 ${s}px Georgia, 'Playfair Display', serif`, art: 'photo', upper: false },
  'marketing-studio/image/flare': { font: (s) => `800 ${s}px Inter, system-ui, sans-serif`, art: 'flare', upper: false },
}
// "OVERLAND PARK, KS" → "Overland Park"
const town = (place) => (place ? place.split(',')[0].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '')
const SERIF = (s) => `700 ${s}px Georgia, 'Playfair Display', serif`

/**
 * Ad types: the inspiration people pick from (a few, spread across the
 * spots). Each sets the look (`art`), the copy (`copy`), extras (a price
 * badge, a map pin, a big logo) and the model the agent leans on.
 */
export const AD_TYPES = [
  { id: 'photo', label: 'Event photo', note: 'A real-feel scene of the venue', model: 'higgsfield-ai/soul/standard', art: 'photo' },
  { id: 'bold', label: 'Bold type', note: 'One huge headline, little else', model: 'ideogram/v4.0', art: 'type', noLine: true },
  { id: 'minimal', label: 'Clean & minimal', note: 'Flat colour and lots of space', model: 'recraft/v4.1/text-to-image', art: 'minimal' },
  { id: 'date', label: 'Date-led', note: 'The dates are the hero', model: 'ideogram/v4.0', art: 'type', copy: (a, i) => ({ name: i.dates || a.name, tagline: a.name }) },
  { id: 'countdown', label: 'Countdown', note: '“30 days to go”', model: 'ideogram/v4.0', art: 'type', copy: (a) => ({ name: '30 days to go', tagline: a.name }) },
  { id: 'deal', label: 'Hotel deal', note: 'Team rates, with a price badge', model: 'recraft/v4.1/text-to-image', art: 'graphic', badge: 'From $119/night', copy: (a, i) => (a.purpose === 'about' ? { name: 'Team hotel rates', tagline: `Book near ${town(i.place) || 'the event'} before they sell out.` } : {}) },
  { id: 'near', label: 'Near the venue', note: 'A map pin: hotels minutes away', model: 'recraft/v4.1/text-to-image', art: 'graphic', pin: true, copy: (a, i) => ({ name: a.name, tagline: `Hotels 5 minutes from ${town(i.place) || 'the venue'}` }) },
  { id: 'spotlight', label: 'Sponsor spotlight', note: 'The logo is the star', model: 'recraft/v4.1-pro/text-to-image', art: 'minimal', bigLogo: true, noLine: true },
  { id: 'product', label: 'Food & product', note: 'A hero shot of what they sell', model: 'marketing-studio/image/flare', art: 'flare' },
  { id: 'neon', label: 'Night & neon', note: 'Glow, lights, after-dark energy', model: 'marketing-studio/image/flare', art: 'neon' },
  { id: 'illustrated', label: 'Illustrated', note: 'A flat illustration of the event', model: 'recraft/v4.1/text-to-image', art: 'illustrated' },
  { id: 'retro', label: 'Retro poster', note: 'A vintage event-poster look', model: 'recraft/v4.1-pro/text-to-image', art: 'cream', font: SERIF, upper: true },
  { id: 'collage', label: 'Photo collage', note: 'A grid of moments from the event', model: 'higgsfield-ai/soul/standard', art: 'collage' },
  { id: 'elegant', label: 'Elegant', note: 'Serif type, gold and cream', model: 'recraft/v4.1-pro/text-to-image', art: 'cream', font: SERIF },
  { id: 'playful', label: 'Playful', note: 'Bright and rounded, for families', model: 'ideogram/v4.0', art: 'playful' },
]
export const typeById = (id) => AD_TYPES.find((t) => t.id === id) || null
/** Three looks to start from, for an event (ticked on the looks card). */
export function suggestTypes(brandId) {
  return ({
    heartland: ['photo', 'deal', 'near'], lakeshore: ['photo', 'date', 'near'], 'music-festival': ['neon', 'photo', 'deal'],
    golf: ['photo', 'elegant', 'deal'], wedding: ['elegant', 'photo', 'near'], esports: ['neon', 'bold', 'countdown'],
    fintech: ['minimal', 'date', 'near'], corporate: ['minimal', 'date', 'deal'],
  })[brandId] || ['photo', 'deal', 'near']
}

/**
 * A stand-in for one Higgsfield generation: the whole ad at `size`, text
 * included. The ad's type sets the look and copy; the model sets the
 * lettering (and the look, when there's no type). `v` varies the composition.
 * `info`: { photo, photos, dates, place } from the event. Returns a data URL.
 */
export async function mockGenerate({ ad, size, model, type = null, info = {}, v = 0 }) {
  const { width: W, height: H } = AD_SIZES[size]
  const k = 2
  const c = document.createElement('canvas')
  c.width = W * k
  c.height = H * k
  const ctx = c.getContext('2d')
  ctx.scale(k, k)
  const st = STYLE[model] || STYLE[MODELS[0].id]
  const T = typeById(type)
  const art = T?.art || st.art
  const font = T?.font || st.font
  const upper = T?.upper ?? st.upper
  let col = ad.colors || { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B' }
  if (art === 'cream') col = { background: '#F6EFDF', foreground: '#2B2418', accent: col.accent === '#FFFFFF' ? '#B08D3C' : col.accent }
  if (art === 'neon') col = { background: '#0A0A1F', foreground: '#FFFFFF', accent: col.accent }
  if (art === 'minimal' && T?.bigLogo) col = { ...col, background: '#FFFFFF', foreground: '#111827' }
  const copy = { name: ad.name, tagline: ad.tagline, ...(T?.copy ? T.copy(ad, info) : {}) }
  if (T?.noLine) copy.tagline = ''
  const usesPhoto = ['photo', 'flare', 'collage'].includes(art)
  const photos = art === 'collage' ? (info.photos || []).slice(0, 4) : []
  const [img, logo, ...grid] = await Promise.all([load(usesPhoto ? info.photo : null), load(ad.logo), ...photos.map(load)])
  const flip = v % 2 === 1

  // --- Background
  ctx.fillStyle = col.background
  ctx.fillRect(0, 0, W, H)
  if (art === 'collage' && grid.filter(Boolean).length) {
    const g = grid.filter(Boolean)
    const n = W > H ? Math.min(g.length, 4) : Math.min(g.length, 3)
    for (let i = 0; i < n; i++) {
      if (W > H) cover(ctx, g[i], (W / n) * i + 1, 0, W / n - 2, H)
      else cover(ctx, g[i], 0, (H / n) * i + 1, W, H / n - 2)
    }
    ctx.fillStyle = `${col.background}B3`
    ctx.fillRect(0, 0, W, H)
  } else if (img) {
    cover(ctx, img, 0, 0, W, H)
    const g = ctx.createLinearGradient(flip ? W : 0, 0, flip ? 0 : W * 0.9, H)
    g.addColorStop(0, `${col.background}F0`)
    g.addColorStop(0.55, `${col.background}99`)
    g.addColorStop(1, `${col.background}10`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  if (art === 'graphic' || art === 'graphic-pro') {
    ctx.fillStyle = `${col.accent}${art === 'graphic-pro' ? '55' : '40'}`
    ctx.beginPath(); ctx.arc(flip ? W * 0.12 : W * 0.88, H * 0.85, Math.max(W, H) * 0.42, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = `${col.foreground}14`
    ctx.beginPath(); ctx.moveTo(W * (flip ? 0.2 : 0.55), 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.6); ctx.closePath(); ctx.fill()
    if (art === 'graphic-pro') { ctx.strokeStyle = `${col.accent}AA`; ctx.lineWidth = 1.5; ctx.strokeRect(6, 6, W - 12, H - 12) }
  } else if (art === 'type') {
    ctx.fillStyle = col.accent
    ctx.fillRect(0, flip ? 0 : H * 0.82, W, H * 0.18)
  } else if (art === 'flare' || art === 'neon') {
    const g = ctx.createRadialGradient(W * (flip ? 0.25 : 0.75), H * 0.3, 2, W * (flip ? 0.25 : 0.75), H * 0.3, Math.max(W, H) * 0.7)
    g.addColorStop(0, `${col.accent}${art === 'neon' ? '99' : 'CC'}`)
    g.addColorStop(0.35, `${col.accent}33`)
    g.addColorStop(1, '#00000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    if (art === 'neon') { ctx.strokeStyle = col.accent; ctx.lineWidth = 2; ctx.shadowColor = col.accent; ctx.shadowBlur = 12; ctx.strokeRect(5, 5, W - 10, H - 10); ctx.shadowBlur = 0 }
  } else if (art === 'cream') {
    ctx.strokeStyle = col.accent; ctx.lineWidth = 1.5; ctx.strokeRect(5, 5, W - 10, H - 10); ctx.strokeRect(9, 9, W - 18, H - 18)
  } else if (art === 'illustrated') {
    ctx.fillStyle = `${col.accent}CC`
    ctx.beginPath(); ctx.arc(W * (flip ? 0.2 : 0.8), H * 0.32, Math.min(W, H) * 0.16, 0, Math.PI * 2); ctx.fill()
    for (const [y0, a] of [[0.72, '33'], [0.84, '55']]) {
      ctx.fillStyle = `${col.foreground}${a}`
      ctx.beginPath(); ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += W / 8) ctx.lineTo(x, H * y0 + Math.sin(x / W * Math.PI * 2 + y0 * 9) * H * 0.05)
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
    }
  } else if (art === 'playful') {
    for (let i = 0; i < 26; i++) {
      const x = (Math.sin(i * 12.9898 + v) * 43758.5453 % 1 + 1) % 1
      const y = (Math.sin(i * 78.233 + v) * 12345.678 % 1 + 1) % 1
      ctx.fillStyle = i % 3 ? `${col.accent}AA` : `${col.foreground}55`
      ctx.beginPath(); ctx.arc(x * W, y * H, 2 + (i % 4), 0, Math.PI * 2); ctx.fill()
    }
  }

  // --- Copy (on the type style the button sits on the accent band, so it takes the text colour)
  const button = art === 'type' ? { bg: col.foreground, fg: col.background } : { bg: col.accent, fg: art === 'cream' ? '#FFFFFF' : '#111827' }
  const glow = art === 'neon' ? () => { ctx.shadowColor = col.accent; ctx.shadowBlur = 10 } : () => {}
  const name = upper ? copy.name.toUpperCase() : copy.name
  const tall = W / H < 0.7
  const strip = H <= 110 || W / H > 3
  const pad = Math.max(8, Math.min(W, H) * 0.08)
  ctx.fillStyle = col.foreground
  if (T?.bigLogo && logo && !strip) {
    // Spotlight: the logo big in the middle, the name and button under it.
    const lh = H * (tall ? 0.3 : 0.42)
    contain(ctx, logo, pad, pad * 1.4, W - pad * 2, lh)
    const hs = Math.max(12, Math.min(22, H * 0.09))
    ctx.font = font(hs); ctx.textAlign = 'center'; ctx.fillStyle = col.foreground
    ctx.fillText(lines(ctx, name, W - pad * 2, 1)[0], W / 2, pad * 1.4 + lh + hs * 1.5)
    ctx.textAlign = 'left'
    const btn = Math.max(10, Math.min(14, hs * 0.6))
    ctx.font = `700 ${btn}px Inter, system-ui, sans-serif`
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    pill(ctx, (W - bw) / 2, H - pad - btn * 2.1, ad.cta, { size: btn, ...button })
  } else if (strip) {
    // One row: logo · headline (· line) · button
    let x = pad
    if (logo) { contain(ctx, logo, x, H * 0.18, H * 0.64, H * 0.64); x += H * 0.64 + pad * 0.8 }
    const btn = Math.max(9, Math.min(14, H * 0.16))
    ctx.font = `700 ${btn}px Inter, system-ui, sans-serif`
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    const textW = W - x - bw - pad * 2
    const hs = Math.max(11, Math.min(upper ? 30 : 24, H * (upper ? 0.32 : 0.26)))
    ctx.font = font(hs)
    ctx.fillStyle = col.foreground
    const hl = lines(ctx, name, textW, H > 80 ? 2 : 1)
    const showLine = W > 600 && copy.tagline
    const block = hl.length * hs * 1.1 + (showLine ? hs * 0.9 : 0)
    let y = (H - block) / 2 + hs * 0.85
    glow()
    for (const l of hl) { ctx.fillText(l, x, y); y += hs * 1.1 }
    ctx.shadowBlur = 0
    if (showLine) { ctx.font = `400 ${hs * 0.6}px Inter, system-ui, sans-serif`; ctx.globalAlpha = 0.85; ctx.fillText(lines(ctx, copy.tagline, textW, 1)[0], x, y - hs * 0.2); ctx.globalAlpha = 1 }
    pill(ctx, W - pad - bw, (H - btn * 2.1) / 2, ad.cta, { size: btn, ...button })
  } else {
    const w = W - pad * 2
    let y = pad
    if (logo) { const lh = Math.min(H * (tall ? 0.12 : 0.2), 56); contain(ctx, logo, pad, y, tall ? w : lh * 1.6, lh); y += lh + pad * 0.6 }
    const hs = Math.max(14, Math.min(upper ? 40 : 30, (tall ? W * 0.15 : H * 0.13)))
    ctx.font = font(hs)
    ctx.fillStyle = col.foreground
    if (tall) ctx.textAlign = 'center'
    const tx = tall ? W / 2 : pad
    glow()
    for (const l of lines(ctx, name, w, tall ? 4 : 2)) { y += hs; ctx.fillText(l, tx, y); y += hs * 0.12 }
    ctx.shadowBlur = 0
    if (copy.tagline) {
      const ts = Math.max(10, hs * 0.45)
      ctx.font = `400 ${ts}px Inter, system-ui, sans-serif`
      ctx.globalAlpha = 0.88
      y += ts * 0.6
      let tx2 = tx
      if (T?.pin && !tall) {
        // A map pin before the line.
        const r = ts * 0.55
        ctx.globalAlpha = 1; ctx.fillStyle = col.accent
        ctx.beginPath(); ctx.arc(tx + r, y + ts * 0.55, r, Math.PI, 0); ctx.lineTo(tx + r, y + ts * 1.5); ctx.closePath(); ctx.fill()
        ctx.fillStyle = col.foreground; ctx.globalAlpha = 0.88
        tx2 = tx + r * 2.6
      }
      for (const l of lines(ctx, copy.tagline, w - (tx2 - tx), tall ? 5 : 2)) { y += ts * 1.2; ctx.fillText(l, tx2, y) }
      ctx.globalAlpha = 1
    }
    ctx.textAlign = 'left'
    const btn = Math.max(10, Math.min(15, hs * 0.5))
    ctx.font = `700 ${btn}px Inter, system-ui, sans-serif`
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    pill(ctx, tall ? (W - bw) / 2 : pad, H - pad - btn * 2.1, ad.cta, { size: btn, ...button })
  }
  // A price badge (Hotel deal), top right.
  if (T?.badge && !strip) {
    const r = Math.min(W, H) * (tall ? 0.22 : 0.2)
    const cx = W - r - pad * 0.6
    const cy = r + pad * 0.6
    ctx.fillStyle = col.accent
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#111827'; ctx.textAlign = 'center'
    const [a, b] = T.badge.split('/')
    ctx.font = `600 ${r * 0.28}px Inter, system-ui, sans-serif`; ctx.fillText(a.split(' ')[0], cx, cy - r * 0.32)
    ctx.font = `900 ${r * 0.5}px Inter, system-ui, sans-serif`; ctx.fillText(a.split(' ')[1], cx, cy + r * 0.16)
    ctx.font = `600 ${r * 0.24}px Inter, system-ui, sans-serif`; ctx.fillText(`/${b}`, cx, cy + r * 0.5)
    ctx.textAlign = 'left'
  }
  return c.toDataURL('image/jpeg', 0.9)
}
