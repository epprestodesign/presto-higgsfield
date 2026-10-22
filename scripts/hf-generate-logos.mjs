// Generate the fictional sample-event logos with the Higgsfield API (Ideogram 4.0,
// strongest at lettering), then key out the flat background to a transparent,
// trimmed PNG.
//
//   node scripts/hf-generate-logos.mjs --estimate          # free
//   node scripts/hf-generate-logos.mjs [--only heartland]  # generates
//
// Output: brand-studio/src/assets/logos/generated/<event>.png + manifest.json
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'brand-studio/src/assets/logos/generated')
const API = 'https://api.higgsfield.ai'
const MODEL = 'ideogram/v4.0'
const args = process.argv.slice(2)
const ESTIMATE_ONLY = args.includes('--estimate')
const ONLY = (args.includes('--only') ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean)

function readEnv() {
  const out = {}
  for (const f of ['.env', '.env.local']) {
    const p = path.join(ROOT, f)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
      if (m && !line.trim().startsWith('#') && m[2]) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  return out
}
const env = readEnv()
let KEY_ID = env.HIGGSFIELD_API_KEY_ID
let SECRET = env.HIGGSFIELD_API_KEY_SECRET
if (SECRET?.includes(':')) [KEY_ID, SECRET] = [SECRET.split(':')[0], SECRET.split(':').slice(1).join(':')]
if (!KEY_ID || !SECRET) { console.error('Missing Higgsfield key in .env'); process.exit(1) }

async function api(method, p, body, headers = {}) {
  const r = await fetch(`${API}${p}`, { method, headers: { Authorization: `Key ${KEY_ID}:${SECRET}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${json.detail ? JSON.stringify(json.detail) : ''}`)
  return json
}

const RULES = 'Professional event logo, flat vector style, crisp clean edges, bold simple shapes, high contrast, perfectly spelled lettering, centered with generous margin on a perfectly flat plain pure white background. The emblem is self-contained with its own solid filled shape so it reads on both light and dark backgrounds. No mockup, no paper texture, no shadows, no gradients in the background, no extra text.'

const LOGOS = [
  { id: 'heartland', alt: 'Heartland Invitational Soccer Cup 2027 crest',
    prompt: 'Youth soccer tournament crest: a bold shield badge filled deep navy (#0E1B2C) with a thick teal (#19C6B8) outline, a white soccer ball at the top center, a small gold (#F5B700) star, the word "HEARTLAND" in heavy white athletic block letters across the middle and "CUP 2027" in teal on a ribbon banner below.' },
  { id: 'fintech', alt: 'Fintech Forward Summit 2027 logo',
    prompt: 'Technology conference logo: a solid deep indigo (#1B1F5E) rounded-rectangle badge containing two bold forward-pointing chevrons, one white and one coral (#FF6B4A), next to the wordmark "fintech forward" in a modern geometric lowercase sans-serif in white, with "SUMMIT 2027" in small coral letter-spaced capitals underneath.' },
  { id: 'wedding', alt: 'Alvarez and Chen wedding monogram',
    prompt: 'Elegant wedding monogram seal: a solid round medallion filled deep sage green (#3E5245) with a fine champagne gold (#C9A96E) double ring border and a delicate laurel wreath, the initials "A & C" in a refined high-contrast serif in champagne gold at the center, the date "09 · 25 · 2027" in tiny gold capitals below.' },
  { id: 'lakeshore', alt: 'Lakeshore Half Marathon 2027 emblem',
    prompt: 'City half marathon emblem: a bold rounded-square badge filled deep blue (#0057B8) with a white wave pattern across the lower half, a red (#FF3D2E) rising sun, a dynamic white runner silhouette, the word "LAKESHORE" in heavy white italic condensed capitals and "HALF MARATHON" in small red letter-spaced capitals beneath.' },
]

const input = (l) => ({ prompt: `${l.prompt} ${RULES}`, aspect_ratio: '1:1', rendering_speed: 'QUALITY' })

const logos = LOGOS.filter((l) => !ONLY.length || ONLY.includes(l.id))
if (ESTIMATE_ONLY) {
  for (const l of logos) {
    const e = await api('POST', `/estimate/${MODEL}`, input(l))
    console.log(`  ${l.id.padEnd(10)} ${e.credits ? `${e.credits} credits ($${e.usd})` : JSON.stringify(e)}`)
  }
  process.exit(0)
}

async function waitFor(id) {
  let d = 2000
  for (;;) {
    const s = await api('GET', `/requests/${id}/status`)
    if (['completed', 'failed', 'nsfw', 'canceled'].includes(s.status)) return s
    await new Promise((r) => setTimeout(r, d))
    d = Math.min(6000, d * 1.4)
  }
}

// Key out the flat background (flood fill from the edges) and trim, in Chromium.
async function cutout(page, buf) {
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
  const out = await page.evaluate(async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const w = img.naturalWidth, h = img.naturalHeight
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, w, h); const px = d.data
    const bg = [px[0], px[1], px[2]]
    const dist = (i) => Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2]))
    const seen = new Uint8Array(w * h); const stack = []
    for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x) }
    for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1) }
    while (stack.length) {
      const p = stack.pop()
      if (seen[p]) continue
      seen[p] = 1
      const i = p * 4, dd = dist(i)
      if (dd > 60) continue
      px[i + 3] = dd < 24 ? 0 : Math.round(255 * (dd - 24) / 36) // soft edge
      const x = p % w, y = (p / w) | 0
      if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1)
      if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w)
    }
    ctx.putImageData(d, 0, 0)
    // Trim to opaque bounds + 3% padding.
    let x0 = w, y0 = h, x1 = 0, y1 = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03)
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad)
    const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1
    t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height)
    // Cap at 800px on the long edge.
    const s = Math.min(1, 800 / Math.max(t.width, t.height))
    const f = document.createElement('canvas'); f.width = Math.round(t.width * s); f.height = Math.round(t.height * s)
    f.getContext('2d').drawImage(t, 0, 0, f.width, f.height)
    return f.toDataURL('image/png')
  }, dataUrl)
  return Buffer.from(out.split(',')[1], 'base64')
}

fs.mkdirSync(OUT, { recursive: true })
const manifestPath = path.join(OUT, 'manifest.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []
const browser = await chromium.launch()
const page = await browser.newPage()
await Promise.all(logos.map(async (l) => {
  try {
    const sub = await api('POST', `/${MODEL}`, input(l), { 'Idempotency-Key': crypto.randomUUID() })
    console.log(`  → ${l.id}: queued ${sub.request_id}`)
    const done = await waitFor(sub.request_id)
    if (done.status !== 'completed' || !done.images?.length) return console.log(`  ✗ ${l.id}: ${done.status} ${done.error || ''}`)
    const raw = Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer())
    fs.writeFileSync(path.join(OUT, `${l.id}-raw.png`), raw)
    fs.writeFileSync(path.join(OUT, `${l.id}.png`), await cutout(page, raw))
    const entry = { id: l.id, file: `${l.id}.png`, raw: `${l.id}-raw.png`, alt: l.alt, model: MODEL, prompt: input(l).prompt, requestId: sub.request_id, createdAt: new Date().toISOString() }
    const i = manifest.findIndex((m) => m.id === l.id)
    i === -1 ? manifest.push(entry) : manifest.splice(i, 1, entry)
    console.log(`  ✓ ${l.id}: saved ${l.id}.png`)
  } catch (e) {
    console.log(`  ✗ ${l.id}: ${e.message}`)
  }
}))
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
await browser.close()
console.log('Done.')
