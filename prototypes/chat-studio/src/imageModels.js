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

const STYLE = {
  'recraft/v4.1/text-to-image': { font: (s) => `700 ${s}px Inter, system-ui, sans-serif`, art: 'graphic', upper: false },
  'recraft/v4.1-pro/text-to-image': { font: (s) => `800 ${s}px Inter, system-ui, sans-serif`, art: 'graphic-pro', upper: false },
  'ideogram/v4.0': { font: (s) => `900 ${s}px Oswald, Impact, 'Arial Narrow', sans-serif`, art: 'type', upper: true },
  'higgsfield-ai/soul/standard': { font: (s) => `700 ${s}px Georgia, 'Playfair Display', serif`, art: 'photo', upper: false },
  'marketing-studio/image/flare': { font: (s) => `800 ${s}px Inter, system-ui, sans-serif`, art: 'flare', upper: false },
}

/**
 * A stand-in for one Higgsfield generation: the whole ad at `size`, text
 * included, in the model's style. `v` varies the composition (regenerate).
 * Returns a JPEG data URL.
 */
export async function mockGenerate({ ad, size, model, photo, v = 0 }) {
  const { width: W, height: H } = AD_SIZES[size]
  const k = 2
  const c = document.createElement('canvas')
  c.width = W * k
  c.height = H * k
  const ctx = c.getContext('2d')
  ctx.scale(k, k)
  const st = STYLE[model] || STYLE[MODELS[0].id]
  const col = ad.colors || { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B' }
  const [img, logo] = await Promise.all([load(st.art === 'photo' || st.art === 'flare' ? photo : null), load(ad.logo)])
  const flip = v % 2 === 1

  // --- Background, per model
  ctx.fillStyle = col.background
  ctx.fillRect(0, 0, W, H)
  if (img) {
    cover(ctx, img, 0, 0, W, H)
    const g = ctx.createLinearGradient(flip ? W : 0, 0, flip ? 0 : W * 0.9, H)
    g.addColorStop(0, `${col.background}F0`)
    g.addColorStop(0.55, `${col.background}99`)
    g.addColorStop(1, `${col.background}10`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  if (st.art === 'graphic' || st.art === 'graphic-pro') {
    ctx.fillStyle = `${col.accent}${st.art === 'graphic-pro' ? '55' : '40'}`
    ctx.beginPath(); ctx.arc(flip ? W * 0.12 : W * 0.88, H * 0.85, Math.max(W, H) * 0.42, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = `${col.foreground}14`
    ctx.beginPath(); ctx.moveTo(W * (flip ? 0.2 : 0.55), 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.6); ctx.closePath(); ctx.fill()
    if (st.art === 'graphic-pro') { ctx.strokeStyle = `${col.accent}AA`; ctx.lineWidth = 1.5; ctx.strokeRect(6, 6, W - 12, H - 12) }
  } else if (st.art === 'type') {
    ctx.fillStyle = col.accent
    ctx.fillRect(0, flip ? 0 : H * 0.82, W, H * 0.18)
  } else if (st.art === 'flare') {
    const g = ctx.createRadialGradient(W * (flip ? 0.25 : 0.75), H * 0.3, 2, W * (flip ? 0.25 : 0.75), H * 0.3, Math.max(W, H) * 0.7)
    g.addColorStop(0, `${col.accent}CC`)
    g.addColorStop(0.35, `${col.accent}33`)
    g.addColorStop(1, '#00000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  // --- Copy (on the type style the button sits on the accent band, so it takes the text colour)
  const button = st.art === 'type' ? { bg: col.foreground, fg: col.background } : { bg: col.accent, fg: '#111827' }
  const name = st.upper ? ad.name.toUpperCase() : ad.name
  const tall = W / H < 0.7
  const strip = H <= 110 || W / H > 3
  const pad = Math.max(8, Math.min(W, H) * 0.08)
  ctx.fillStyle = col.foreground
  if (strip) {
    // One row: logo · headline (· line) · button
    let x = pad
    if (logo) { contain(ctx, logo, x, H * 0.18, H * 0.64, H * 0.64); x += H * 0.64 + pad * 0.8 }
    const btn = Math.max(9, Math.min(14, H * 0.16))
    ctx.font = `700 ${btn}px Inter, system-ui, sans-serif`
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    const textW = W - x - bw - pad * 2
    const hs = Math.max(11, Math.min(st.upper ? 30 : 24, H * (st.upper ? 0.32 : 0.26)))
    ctx.font = st.font(hs)
    ctx.fillStyle = col.foreground
    const hl = lines(ctx, name, textW, H > 80 ? 2 : 1)
    const showLine = W > 600 && ad.tagline
    const block = hl.length * hs * 1.1 + (showLine ? hs * 0.9 : 0)
    let y = (H - block) / 2 + hs * 0.85
    for (const l of hl) { ctx.fillText(l, x, y); y += hs * 1.1 }
    if (showLine) { ctx.font = `400 ${hs * 0.6}px Inter, system-ui, sans-serif`; ctx.globalAlpha = 0.85; ctx.fillText(lines(ctx, ad.tagline, textW, 1)[0], x, y - hs * 0.2); ctx.globalAlpha = 1 }
    pill(ctx, W - pad - bw, (H - btn * 2.1) / 2, ad.cta, { size: btn, ...button })
  } else {
    const w = W - pad * 2
    let y = pad
    if (logo) { const lh = Math.min(H * (tall ? 0.12 : 0.2), 56); contain(ctx, logo, tall ? pad : pad, y, tall ? w : lh * 1.6, lh); y += lh + pad * 0.6 }
    const hs = Math.max(14, Math.min(st.upper ? 40 : 30, (tall ? W * 0.15 : H * 0.13)))
    ctx.font = st.font(hs)
    ctx.fillStyle = col.foreground
    if (tall) ctx.textAlign = 'center'
    const tx = tall ? W / 2 : pad
    for (const l of lines(ctx, name, w, tall ? 4 : 2)) { y += hs; ctx.fillText(l, tx, y); y += hs * 0.12 }
    if (ad.tagline) {
      const ts = Math.max(10, hs * 0.45)
      ctx.font = `400 ${ts}px Inter, system-ui, sans-serif`
      ctx.globalAlpha = 0.88
      y += ts * 0.6
      for (const l of lines(ctx, ad.tagline, w, tall ? 5 : 2)) { y += ts * 1.2; ctx.fillText(l, tx, y) }
      ctx.globalAlpha = 1
    }
    ctx.textAlign = 'left'
    const btn = Math.max(10, Math.min(15, hs * 0.5))
    ctx.font = `700 ${btn}px Inter, system-ui, sans-serif`
    const bw = ctx.measureText(ad.cta).width + btn * 1.8
    pill(ctx, tall ? (W - bw) / 2 : pad, H - pad - btn * 2.1, ad.cta, { size: btn, ...button })
  }
  return c.toDataURL('image/jpeg', 0.9)
}
