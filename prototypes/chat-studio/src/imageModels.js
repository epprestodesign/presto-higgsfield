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
// Fill the box with the image (cropped to the box).
function cover(ctx, img, x, y, w, h) {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.drawImage(img, x + (w - img.naturalWidth * k) / 2, y + (h - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k)
  ctx.restore()
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
const SANS = (w) => (s) => `${w} ${s}px Inter, system-ui, sans-serif`
const SERIF = (s) => `600 ${s}px Georgia, 'Playfair Display', serif`
const CONDENSED = (s) => `900 ${s}px Oswald, Impact, 'Arial Narrow', sans-serif`
const HAND = (s) => `700 ${s}px 'Marker Felt', 'Comic Sans MS', 'Chalkboard SE', cursive`
const SCRIPT = (s) => `italic 700 ${s}px 'Snell Roundhand', 'Brush Script MT', Georgia, cursive`

// Reference images for the looks card: real Higgsfield generations (Ideogram
// 4.5 / Recraft 4.1, Nov 2026) made for a youth soccer event, deliberately far
// apart, so people pick from looks that really differ.
const refs = import.meta.glob('./assets/looks/*.webp', { eager: true, query: '?url', import: 'default' })
const ref = (name) => refs[`./assets/looks/${name}.webp`]

/**
 * Ad looks: the inspiration people pick a few of (spread across the spots).
 * Each has a reference image, whether it carries the logo, the model the
 * agent leans on, its own colours / lettering (`look`) and its own copy for
 * a house ad (`copy`), written for getting guests booked near the event.
 */
export const AD_TYPES = [
  { id: 'split', label: 'Photo split', note: 'Match photo beside a brand panel', logo: true, model: 'ideogram/v4.0', ref: ref('photo-split'),
    copy: () => ({ name: 'Team hotels near the venue' }) },
  { id: 'map', label: 'Map & pins', note: 'Hotels plotted around the venue', logo: false, model: 'recraft/v4.1/text-to-image', ref: ref('map'),
    copy: () => ({ name: '12 hotels within 10 minutes' }) },
  { id: 'brutal', label: 'Brutalist', note: 'Loud acid type on black', logo: false, model: 'ideogram/v4.0', ref: ref('brutalist'),
    copy: () => ({ name: 'Stay 5 min from the venue' }) },
  { id: 'swiss', label: 'Swiss type', note: 'A giant headline on white, strict grid', logo: false, model: 'ideogram/v4.0', ref: ref('swiss'),
    copy: (a, i) => ({ name: i.short || a.name }) },
  { id: 'cinematic', label: 'Cinematic photo', note: 'Just the scene and a tiny caption', logo: false, model: 'higgsfield-ai/soul/standard', ref: ref('cinematic') },
  { id: 'retro', label: 'Retro badge', note: '’70s sunburst and script', logo: false, model: 'recraft/v4.1-pro/text-to-image', ref: ref('retro-badge'),
    copy: (a, i) => ({ name: `${i.short || a.name} ’${(i.dates || '').match(/20(\d\d)/)?.[1] || '27'}` }) },
  { id: 'riso', label: 'Risograph', note: 'Hand-drawn, two-ink print', logo: false, model: 'recraft/v4.1/text-to-image', ref: ref('risograph'),
    copy: () => ({ name: 'Team hotels near the venue!' }) },
  { id: 'ticket', label: 'Ticket stub', note: 'An admission ticket, gold foil', logo: false, model: 'ideogram/v4.0', ref: ref('ticket'),
    copy: (a, i) => ({ name: 'Admit one team', tagline: i.name || a.name }) },
  { id: 'editorial', label: 'Editorial', note: 'Serif headline, a portrait, white space', logo: true, model: 'ideogram/v4.0', ref: ref('editorial'),
    copy: () => ({ name: 'The weekend of the year' }) },
  { id: 'clay', label: '3D clay', note: 'A toy-like 3D scene, pastel', logo: false, model: 'recraft/v4.1-pro/text-to-image', ref: ref('clay'),
    copy: () => ({ name: 'Kick off. Check in.' }) },
  { id: 'bauhaus', label: 'Bauhaus', note: 'Geometric colour blocks, the dates', logo: false, model: 'recraft/v4.1/text-to-image', ref: ref('bauhaus'),
    copy: (a, i) => ({ name: (i.dates || a.name).replace(/,? ?20\d\d/, ''), tagline: `${i.short || a.name} · book your hotel` }) },
  { id: 'chalk', label: 'Chalkboard', note: 'A coach’s game plan', logo: false, model: 'ideogram/v4.0', ref: ref('chalkboard'),
    copy: () => ({ name: 'Your game plan: book early' }) },
  { id: 'luxe', label: 'Black & gold', note: 'Quiet luxury, lots of space', logo: true, model: 'recraft/v4.1-pro/text-to-image', ref: ref('black-gold'),
    copy: (a, i) => ({ name: i.name || a.name, tagline: `Official hotels · ${i.dates || ''}`.replace(/ · $/, '') }) },
  { id: 'scrapbook', label: 'Scrapbook', note: 'Polaroids, tape and stickers', logo: false, model: 'higgsfield-ai/soul/standard', ref: ref('scrapbook'),
    copy: () => ({ name: 'Memories start at check-in' }) },
  { id: 'neon', label: 'Neon sign', note: 'Glowing tube lettering at night', logo: false, model: 'marketing-studio/image/flare', ref: ref('neon'),
    copy: () => ({ name: '30 days to kickoff', tagline: 'Book your hotel' }) },
]
export const typeById = (id) => AD_TYPES.find((t) => t.id === id) || null
/** Three looks to start from, for an event (ticked on the looks card): one safe, one useful, one bold. */
export function suggestTypes(brandId) {
  return ({
    heartland: ['split', 'map', 'chalk'], lakeshore: ['cinematic', 'map', 'swiss'], 'music-festival': ['neon', 'riso', 'scrapbook'],
    golf: ['luxe', 'editorial', 'map'], wedding: ['editorial', 'luxe', 'scrapbook'], esports: ['neon', 'brutal', 'bauhaus'],
    fintech: ['swiss', 'bauhaus', 'map'], corporate: ['swiss', 'editorial', 'map'],
  })[brandId] || ['split', 'map', 'swiss']
}

// Each look's palette and lettering (brand colours where the look allows).
function lookOf(id, brand) {
  const b = { bg: brand.background, fg: brand.foreground, ac: brand.accent }
  return ({
    split: { bg: b.bg, fg: '#FFFFFF', ac: b.ac, font: SANS(700) },
    map: { bg: '#A9C2B6', fg: b.bg, ac: b.ac, font: SANS(600) },
    brutal: { bg: '#050505', fg: '#C8FF1E', ac: '#C8FF1E', font: CONDENSED, upper: true },
    swiss: { bg: '#FFFFFF', fg: '#0A0A0A', ac: b.ac, font: SANS(900) },
    cinematic: { bg: '#0B1220', fg: '#FFFFFF', ac: '#FFFFFF', font: SANS(500) },
    retro: { bg: '#F3E6C8', fg: '#6B3E26', ac: '#D9622B', font: SCRIPT },
    riso: { bg: '#FFF6E9', fg: '#FF5FA2', ac: '#00A6A6', font: HAND },
    ticket: { bg: b.bg, fg: '#D9B45A', ac: '#D9B45A', font: SERIF, upper: true },
    editorial: { bg: '#F7F4EE', fg: '#111111', ac: b.bg, font: SERIF },
    clay: { bg: '#CFEBDD', fg: '#FFFFFF', ac: '#F6D77A', font: SANS(900) },
    bauhaus: { bg: b.bg, fg: '#F5F0E6', ac: b.ac, font: SANS(800), upper: true },
    chalk: { bg: '#24432F', fg: '#F4F1E8', ac: '#F4F1E8', font: HAND },
    luxe: { bg: '#111111', fg: '#C9A44C', ac: '#C9A44C', font: SERIF },
    scrapbook: { bg: '#D9BE95', fg: '#1F1A14', ac: '#E9564B', font: SCRIPT },
    neon: { bg: '#121212', fg: '#4BFF6E', ac: '#F2C744', font: HAND, glow: true, upper: true },
  })[id]
}

/**
 * A stand-in for one Higgsfield generation: the whole ad at `size`, text
 * included. With a look (`type`) it follows that look's composition; without
 * one, the model's own style. `v` varies the composition. `info`: { photo,
 * photos, dates, place, name, short } from the event. Returns a data URL.
 */
export async function mockGenerate({ ad, size, model, type = null, info = {}, v = 0 }) {
  const { width: W, height: H } = AD_SIZES[size]
  const k = 2
  const c = document.createElement('canvas')
  c.width = W * k
  c.height = H * k
  const ctx = c.getContext('2d')
  ctx.scale(k, k)
  const brand = ad.colors || { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B' }
  const T = typeById(type)
  const st = STYLE[model] || STYLE[MODELS[0].id]
  const L = T ? lookOf(T.id, brand) : { bg: brand.background, fg: brand.foreground, ac: brand.accent, font: st.font, upper: st.upper }
  const copy = { name: ad.name, tagline: ad.tagline, ...(T?.copy && ad.purpose === 'about' ? T.copy(ad, info) : {}) }
  if (T?.copy && ad.purpose !== 'about' && ['luxe', 'ticket'].includes(T.id)) Object.assign(copy, T.copy(ad, { ...info, name: ad.name }))
  const showLogo = T ? T.logo : true
  const photo = T ? ['split', 'cinematic', 'editorial', 'scrapbook'].includes(T.id) : ['photo', 'flare'].includes(st.art)
  const [img, logo, ...grid] = await Promise.all([load(photo ? info.photo : null), load(showLogo ? ad.logo : null), ...(T?.id === 'scrapbook' ? (info.photos || []).slice(0, 4).map(load) : [])])
  const flip = v % 2 === 1
  const tall = W / H < 0.7
  const strip = H <= 110 || W / H > 3
  const pad = Math.max(8, Math.min(W, H) * 0.08)
  const name = L.upper ? copy.name.toUpperCase() : copy.name
  const button = { bg: L.ac, fg: ['#FFFFFF', '#F4F1E8', '#C8FF1E', '#F2C744', '#F6D77A', '#C9A44C', '#D9B45A'].includes(L.ac) ? '#111111' : '#FFFFFF' }

  // ---------- Background and decoration, per look ----------
  ctx.fillStyle = L.bg
  ctx.fillRect(0, 0, W, H)
  let textX = pad
  let textW = W - pad * 2
  const id = T?.id || `model:${st.art}`
  if (id === 'split' && img && !strip) {
    if (tall) { cover(ctx, img, 0, 0, W, H * 0.45); textX = pad } else { const half = W * 0.5; cover(ctx, img, flip ? half : 0, 0, half, H); textX = flip ? pad : half + pad; textW = half - pad * 2 }
  } else if (id === 'cinematic' && img) {
    cover(ctx, img, 0, 0, W, H)
    const g = ctx.createLinearGradient(0, H * 0.5, 0, H); g.addColorStop(0, '#00000000'); g.addColorStop(1, '#000000B0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  } else if (id === 'editorial' && img && !strip) {
    const pw = tall ? W : W * 0.38
    if (tall) cover(ctx, img, 0, H * 0.55, W, H * 0.45)
    else { cover(ctx, img, W - pw, 0, pw, H); textW = W - pw - pad * 2 }
  } else if (id === 'map') {
    ctx.fillStyle = `${L.fg}`
    const cx = W * (flip ? 0.3 : 0.66), cy = H * 0.58, R = Math.min(W, H) * (strip ? 0.5 : 0.38)
    ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.5, R, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(cx - R * 1.5, cy - R + i * R / 3); ctx.lineTo(cx + R * 1.5, cy - R * 0.6 + i * R / 3.4); ctx.stroke() }
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + v, r = R * (0.35 + (i % 3) * 0.18); const x = cx + Math.cos(a) * r * 1.3, y = cy + Math.sin(a) * r * 0.8; const pr = Math.max(3, R * 0.07); ctx.fillStyle = L.ac; ctx.beginPath(); ctx.arc(x, y - pr, pr, Math.PI, 0); ctx.lineTo(x, y + pr * 0.6); ctx.closePath(); ctx.fill() }
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * 0.1), 0, Math.PI * 2); ctx.fill()
    if (!strip && !tall) textW = W * 0.5
  } else if (id === 'brutal') {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(pad * 0.6, pad * 0.6, W - pad * 1.2, H - pad * 1.2)
  } else if (id === 'swiss') {
    ctx.fillStyle = L.ac; ctx.fillRect(0, H * 0.55, W, 2)
  } else if (id === 'retro') {
    const cx = W / 2, cy = H * (tall ? 0.4 : 0.5)
    for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 2 ? '#D9622B' : '#F2B705'; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Math.max(W, H), (i / 18) * Math.PI * 2, ((i + 1) / 18) * Math.PI * 2); ctx.closePath(); ctx.fill() }
    ctx.globalAlpha = 1; ctx.fillStyle = L.bg; ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.36, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#D9622B'; ctx.lineWidth = 3; ctx.stroke()
  } else if (id === 'riso') {
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 2 ? '#FF5FA233' : '#00A6A633'; ctx.fillRect(((i * 97) % W), ((i * 53) % H), 2, 2) }
    ctx.strokeStyle = '#00A6A6'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const x = W * (0.55 + i * 0.13), y = H * 0.78; ctx.beginPath(); ctx.arc(x, y - H * 0.12, H * 0.05, 0, Math.PI * 2); ctx.moveTo(x, y - H * 0.07); ctx.lineTo(x, y + H * 0.05); ctx.moveTo(x - H * 0.06, y); ctx.lineTo(x + H * 0.06, y - H * 0.02); ctx.stroke() }
  } else if (id === 'ticket') {
    const stub = W * (strip ? 0.82 : 0.74)
    ctx.setLineDash([3, 4]); ctx.strokeStyle = L.ac; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(stub, 6); ctx.lineTo(stub, H - 6); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeRect(6, 6, W - 12, H - 12)
    ctx.fillStyle = '#F2EEE4'; for (let i = 0; i < 26; i++) ctx.fillRect(pad + i * 3.2, H - pad - H * 0.14, i % 3 ? 1.4 : 2.4, H * 0.12)
    textW = stub - pad * 2
  } else if (id === 'clay') {
    ctx.fillStyle = '#F6D77A'; ctx.fillRect(0, H * 0.72, W, H * 0.28)
    const r = Math.min(W, H) * 0.24; const bx = W * (flip ? 0.28 : 0.7), by = H * 0.5
    const g = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E4574B'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#F3B7C5'; ctx.beginPath(); ctx.roundRect(bx + r * 0.7, by - r * 0.6, r * 1.2, r * 1.4, r * 0.15); ctx.fill()
  } else if (id === 'bauhaus') {
    const u = Math.min(W, H) * 0.32
    ctx.fillStyle = L.ac; ctx.beginPath(); ctx.arc(0, 0, u, 0, Math.PI / 2); ctx.lineTo(0, 0); ctx.fill()
    ctx.fillStyle = '#F5F0E6'; ctx.beginPath(); ctx.arc(W, H, u, Math.PI, Math.PI * 1.5); ctx.lineTo(W, H); ctx.fill()
    ctx.fillStyle = '#1C1C1C'; ctx.beginPath(); ctx.arc(W * 0.82, u * 0.5, u * 0.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = L.ac; ctx.fillRect(W * 0.86, H * 0.4, u * 0.4, u * 0.4)
  } else if (id === 'chalk') {
    ctx.strokeStyle = '#F4F1E8AA'; ctx.lineWidth = 1.5
    for (let i = 0; i < 5; i++) { const x = W * (0.6 + (i % 3) * 0.12), y = H * (0.25 + Math.floor(i / 2) * 0.22); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke() }
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(W * 0.6, H * 0.75); ctx.quadraticCurveTo(W * 0.75, H * 0.4, W * 0.9, H * 0.2); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = '#8A6B3D'; ctx.lineWidth = 5; ctx.strokeRect(2.5, 2.5, W - 5, H - 5)
    if (!strip && !tall) textW = W * 0.55
  } else if (id === 'luxe') {
    ctx.fillStyle = L.ac; ctx.fillRect(W * 0.3, H * 0.5, W * 0.4, 0.8)
  } else if (id === 'scrapbook') {
    const g = grid.filter(Boolean)
    g.forEach((im, i) => {
      if (strip && i > 2) return
      const pw = strip ? H * 0.8 : Math.min(W, H) * (tall ? 0.6 : 0.36), ph = pw * 0.9
      const x = strip ? W * 0.45 + i * pw * 0.9 : tall ? (W - pw) / 2 + (i % 2 ? 6 : -6) : W * 0.42 + (i % 2) * pw * 0.85, y = strip ? (H - ph) / 2 : tall ? H * 0.35 + i * ph * 0.45 : H * 0.18 + Math.floor(i / 2) * ph * 0.75
      ctx.save(); ctx.translate(x + pw / 2, y + ph / 2); ctx.rotate(((i % 2 ? 1 : -1) * (4 + i * 2) * Math.PI) / 180)
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph); cover(ctx, im, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph * 0.78)
      ctx.fillStyle = '#F2C74499'; ctx.fillRect(-pw * 0.15, -ph / 2 - 4, pw * 0.3, 8); ctx.restore()
    })
    if (!strip && !tall) textW = W * 0.4
  } else if (id === 'neon') {
    ctx.fillStyle = '#1C1C1C'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : 10; x < W; x += 20) ctx.fillRect(x, y, 18, 6)
  } else if (!T) {
    // No look: the model's own simple style (older ads).
    if (img) { cover(ctx, img, 0, 0, W, H); const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, `${L.bg}F0`); g.addColorStop(1, `${L.bg}20`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H) }
  }

  // ---------- Copy ----------
  const glow = () => { if (L.glow) { ctx.shadowColor = L.fg; ctx.shadowBlur = 12 } }
  const noGlow = () => { ctx.shadowBlur = 0 }
  ctx.fillStyle = L.fg
  if (id === 'cinematic') {
    // Almost no text: a small caption, bottom right.
    const cs = Math.max(9, Math.min(13, H * 0.06))
    ctx.font = SANS(600)(cs); ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF'
    ctx.fillText(`${copy.name} · ${ad.cta}`, W - pad, H - pad * 0.8); ctx.textAlign = 'left'
    return c.toDataURL('image/jpeg', 0.9)
  }
  if (id === 'luxe' && !strip) {
    // Centred, small and quiet.
    ctx.textAlign = 'center'
    let y = H * 0.32
    if (logo) { const lh = Math.min(H * 0.14, 30); contain(ctx, logo, W / 2 - lh, y - lh, lh * 2, lh); y += 6 }
    const hs = Math.max(12, Math.min(24, H * 0.1)); ctx.font = L.font(hs); ctx.fillStyle = L.fg
    ctx.fillText(lines(ctx, name, W * 0.8, 1)[0], W / 2, H * 0.46)
    ctx.font = SANS(600)(Math.max(8, hs * 0.42)); ctx.fillText((copy.tagline || '').toUpperCase(), W / 2, H * 0.6)
    ctx.font = SANS(500)(Math.max(8, hs * 0.42)); ctx.fillText(`${ad.cta} →`, W / 2, H * 0.74)
    ctx.textAlign = 'left'
    return c.toDataURL('image/jpeg', 0.9)
  }
  if (strip) {
    // One row: (logo ·) headline (· line) · button
    let x = textX
    if (logo) { contain(ctx, logo, x, H * 0.18, H * 0.64, H * 0.64); x += H * 0.64 + pad * 0.8 }
    const btn = Math.max(9, Math.min(14, H * 0.16))
    ctx.font = SANS(700)(btn)
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    const tw = (id === 'map' || id === 'scrapbook' ? W * 0.42 : W) - x - bw - pad * 2
    const hs = Math.max(11, Math.min(L.upper ? 30 : 26, H * (L.upper ? 0.34 : 0.3)))
    ctx.font = L.font(hs); ctx.fillStyle = L.fg
    const hl = lines(ctx, name, tw, H > 80 ? 2 : 1)
    let y = (H - hl.length * hs * 1.1) / 2 + hs * 0.85
    glow(); for (const l of hl) { ctx.fillText(l, x, y); y += hs * 1.1 } noGlow()
    pill(ctx, W - pad - bw, (H - btn * 2.1) / 2, ad.cta, { size: btn, ...button })
    return c.toDataURL('image/jpeg', 0.9)
  }
  // Box and tall sizes.
  const big = ['brutal', 'swiss', 'bauhaus', 'neon', 'retro', 'riso'].includes(id)
  let y = tall && id === 'split' ? H * 0.45 + pad : pad
  if (logo) { const lh = Math.min(H * (tall ? 0.1 : 0.18), 48); contain(ctx, logo, textX, y, Math.min(textW, lh * 1.6), lh); y += lh + pad * 0.5 }
  const center = tall || id === 'retro' || id === 'neon' || id === 'bauhaus'
  const hs = Math.max(14, Math.min(big ? (tall ? W * 0.2 : H * 0.24) : 30, big ? 64 : (tall ? W * 0.14 : H * 0.14)))
  ctx.font = L.font(hs); ctx.fillStyle = L.fg
  ctx.textAlign = center ? 'center' : 'left'
  const tx = center ? (id === 'retro' ? W / 2 : textX + textW / 2) : textX
  const hl = lines(ctx, name, center && id === 'retro' ? Math.min(W, H) * 0.66 : textW, tall ? 5 : big ? 3 : 2)
  if (id === 'retro' || id === 'neon' || id === 'bauhaus') y = (H - hl.length * hs * 1.05) / 2 - (copy.tagline ? hs * 0.3 : 0)
  if (id === 'swiss') y = Math.max(pad * 0.4, H * 0.55 - hl.length * hs * 1.03 - 6)
  glow()
  for (const l of hl) { y += hs * (big ? 0.95 : 1); ctx.fillText(l, tx, y); y += hs * 0.08 }
  noGlow()
  if (copy.tagline && !['brutal'].includes(id)) {
    const ts = Math.max(9, Math.min(16, hs * (big ? 0.28 : 0.45)))
    ctx.font = id === 'neon' ? L.font(ts * 1.4) : SANS(500)(ts)
    ctx.fillStyle = id === 'neon' ? L.ac : L.fg
    ctx.globalAlpha = id === 'neon' ? 1 : 0.85
    y += ts * (id === 'swiss' ? 1.6 : 0.8)
    for (const l of lines(ctx, copy.tagline, center ? W * 0.8 : textW, tall ? 4 : 2)) { y += ts * 1.25; ctx.fillText(l, tx, y) }
    ctx.globalAlpha = 1
  }
  ctx.textAlign = 'left'
  const btn = Math.max(10, Math.min(15, H * 0.06))
  ctx.font = SANS(700)(btn)
  const bw = ctx.measureText(ad.cta).width + btn * 1.8
  const bx = center ? (W - bw) / 2 : id === 'swiss' ? W - pad - bw : textX
  if (!['ticket', 'retro'].includes(id)) pill(ctx, bx, H - pad - btn * 2.1, ad.cta, { size: btn, ...button })
  else { ctx.font = SANS(700)(btn); ctx.fillStyle = L.ac; ctx.textAlign = id === 'retro' ? 'center' : 'left'; ctx.fillText(`${ad.cta} →`, id === 'retro' ? W / 2 : textX + (id === 'ticket' ? 26 * 3.2 + 10 : 0), H - pad * (id === 'ticket' ? 1.3 : 1)); ctx.textAlign = 'left' }
  return c.toDataURL('image/jpeg', 0.9)
}
