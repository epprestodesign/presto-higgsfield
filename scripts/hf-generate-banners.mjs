// Generate the sample-event hero banners with the Higgsfield API, following the
// Presto banner system (references/102226): minimal, system-safe BACKGROUNDS
// only. The logo and every word of copy are live layers in the hero, never in
// the artwork.
//
//   node scripts/hf-generate-banners.mjs --estimate   # free: prints the plan + cost
//   node scripts/hf-generate-banners.mjs              # generates + downloads
//   node scripts/hf-generate-banners.mjs --only heartland-photo,fintech-abstract
//
// Reads HIGGSFIELD_API_KEY_ID / HIGGSFIELD_API_KEY_SECRET from .env (never printed).
// Output: brand-studio/src/assets/imagery/generated/<id>.<ext> + manifest.json
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'brand-studio/src/assets/imagery/generated')
const LOGOS = path.join(ROOT, 'brand-studio/src/assets/logos')
const API = 'https://api.higgsfield.ai'
const args = process.argv.slice(2)
const ESTIMATE_ONLY = args.includes('--estimate')
const onlyArg = args.find((a) => a.startsWith('--only='))?.slice(7) ?? (args.includes('--only') ? args[args.indexOf('--only') + 1] : '')
const ONLY = (onlyArg || '').split(',').filter(Boolean)

// ── Credentials (same rules as the dev proxy) ────────────────────────────
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
const AUTH = { Authorization: `Key ${KEY_ID}:${SECRET}` }

async function api(method, p, body, headers = {}) {
  const r = await fetch(`${API}${p}`, { method, headers: { ...AUTH, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${json.detail ? JSON.stringify(json.detail) : ''}`)
  return json
}

// ── Presto banner system rules (appended to every prompt) ────────────────
const SYSTEM_SAFE = [
  'Ultra-wide website hero background.',
  'Minimal, system-safe and uncluttered: a simple background that lets a centered logo and white headline sit on top.',
  'Keep the central area calm, low-detail and evenly toned; put any texture or detail toward the outer edges.',
  'Muted and slightly dark overall so white text stays readable; no bright hot spots in the center.',
  'Important content stays within the middle horizontal band so the image also works cropped to a thin 6:1 strip.',
  'No people as a focal point, no faces in focus.',
  'No text, no letters, no numbers, no logos, no signage, no watermarks.',
].join(' ')

const EVENTS = {
  heartland: { logo: 'heartland-cup.svg', palette: ['#0E1B2C', '#19C6B8', '#F5B700'] },
  fintech: { logo: 'fintech-forward.svg', palette: ['#1B1F5E', '#FF6B4A', '#FFC857'] },
  wedding: { logo: 'alvarez-chen.svg', palette: ['#3E5245', '#C9A96E', '#E8D9C5'] },
  lakeshore: { logo: 'lakeshore-half.svg', palette: ['#0057B8', '#FF3D2E', '#FFD23F'] },
}

const TASKS = [
  // Photographic scenes — Marketing Studio 2.5 Flare, logo as a color/style reference only.
  { id: 'heartland-photo', event: 'heartland', model: 'marketing-studio/image/flare', alt: 'Floodlit youth soccer pitch at dusk in deep navy and teal',
    prompt: 'An empty youth soccer pitch at dusk under floodlights, seen low and wide across the grass toward softly out-of-focus stands; color graded in deep midnight navy with cool teal highlights and a faint warm gold rim light, like the reference logo palette.' },
  { id: 'fintech-photo', event: 'fintech', model: 'marketing-studio/image/flare', alt: 'Empty keynote hall with soft indigo light',
    prompt: 'An empty modern conference keynote hall with rows of seats dissolving into soft bokeh, a wide stage glow, color graded deep indigo with a subtle coral light wash along one edge, like the reference logo palette.' },
  { id: 'wedding-photo', event: 'wedding', model: 'marketing-studio/image/flare', alt: 'Softly blurred garden reception with string lights at golden hour',
    prompt: 'A softly blurred garden wedding reception at golden hour: long table and string lights melting into bokeh, airy and elegant, sage green foliage with warm champagne light, like the reference monogram palette.' },
  { id: 'lakeshore-photo', event: 'lakeshore', model: 'marketing-studio/image/flare', alt: 'Motion-blurred runners on a lakefront road at sunrise in blue duotone',
    prompt: 'Motion-blurred runners on a city lakefront road at sunrise, shot wide and low; blue duotone treatment with a fine halftone texture toward the edges and a hint of red accent light, like the reference logo palette.' },
  // Minimal abstracts — Recraft V4.1, exact brand palette (like Presto Abstract #1–5).
  { id: 'heartland-abstract', event: 'heartland', model: 'recraft/v4.1/text-to-image', alt: 'Dark navy abstract with teal halftone speed lines',
    prompt: 'Minimal abstract background: solid deep navy field with fine halftone dots and diagonal speed lines in slightly lighter navy and a touch of teal along the right edge, fading to plain navy toward the left and center. Flat, subtle, vector-clean.' },
  { id: 'fintech-abstract', event: 'fintech', model: 'recraft/v4.1/text-to-image', alt: 'Indigo abstract with flowing contour lines',
    prompt: 'Minimal abstract background: solid deep indigo field with thin flowing contour lines in slightly lighter indigo sweeping in from the left edge, one faint coral line, large plain area. Flat, subtle, vector-clean.' },
  { id: 'wedding-abstract', event: 'wedding', model: 'recraft/v4.1/text-to-image', alt: 'Sage green abstract with fine botanical line art',
    prompt: 'Minimal abstract background: soft deep sage green field with delicate champagne-gold botanical line art and fine leaves along the outer edges, large calm plain center. Flat, elegant, vector-clean.' },
  { id: 'lakeshore-abstract', event: 'lakeshore', model: 'recraft/v4.1/text-to-image', alt: 'Deep navy-blue abstract with fine wave lines',
    // v2: v1 came back saturated electric blue; anchor on a darker base and thin lines.
    palette: ['#0A2A5C', '#0057B8', '#FF3D2E'],
    prompt: 'Minimal abstract background: solid dark navy-blue field, muted and deep, with a few very thin flowing wave lines in a slightly lighter blue along the bottom right edge and one hairline red accent line; the rest is plain dark navy. Low contrast, calm, flat, vector-clean.' },
]

const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))

function inputFor(task, refs) {
  const ev = { ...EVENTS[task.event], ...(task.palette ? { palette: task.palette } : {}) }
  const prompt = `${task.prompt} ${SYSTEM_SAFE}`
  if (task.model.startsWith('recraft')) {
    return { prompt, aspect_ratio: '2:1', resolution: '1k', output_format: 'png', colors: ev.palette.map((h) => ({ rgb: rgb(h) })), background_color: { rgb: rgb(ev.palette[0]) } }
  }
  return {
    prompt: `${prompt} Use the reference logo only for its colors and mood; do not reproduce the logo.`,
    aspect_ratio: '21:9', resolution: '2k', quality: 'high', enhance_prompt: false,
    ...(refs.length ? { image_urls: refs } : {}),
  }
}

// ── Logo → PNG (Higgsfield takes PNG/JPEG/WebP, our logos are SVG) ────────
async function rasterizeLogos(names) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1 })
  const out = {}
  for (const name of names) {
    const svg = fs.readFileSync(path.join(LOGOS, name), 'utf8')
    await page.setContent(`<html><body style="margin:0;background:transparent"><img id="l" style="width:1024px;height:auto;display:block" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`)
    out[name] = await (await page.$('#l')).screenshot({ omitBackground: true, type: 'png' })
  }
  await browser.close()
  return out
}

async function upload(buf) {
  const pre = await api('POST', '/files/generate-upload-url', { content_type: 'image/png' })
  const put = await fetch(pre.upload_url, { method: 'PUT', headers: pre.upload_headers || { 'Content-Type': 'image/png' }, body: buf })
  if (!put.ok) throw new Error(`upload PUT ${put.status}`)
  return pre.public_url
}

async function waitFor(id) {
  let delay = 2000
  for (;;) {
    const s = await api('GET', `/requests/${id}/status`)
    if (['completed', 'failed', 'nsfw', 'canceled'].includes(s.status)) return s
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(6000, delay * 1.4)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────
const tasks = TASKS.filter((t) => !ONLY.length || ONLY.includes(t.id))
console.log(`${ESTIMATE_ONLY ? 'Estimating' : 'Generating'} ${tasks.length} banner backgrounds…`)

if (ESTIMATE_ONLY) {
  for (const t of tasks) {
    const e = await api('POST', `/estimate/${t.model}`, inputFor(t, []))
    console.log(`  ${t.id.padEnd(20)} ${t.model.padEnd(30)} ${e.credits ? `${e.credits} credits ($${e.usd})` : 'token-priced (settled on completion)'}`)
  }
  process.exit(0)
}

fs.mkdirSync(OUT, { recursive: true })
const manifestPath = path.join(OUT, 'manifest.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []

const logoNames = [...new Set(tasks.filter((t) => t.model.includes('flare')).map((t) => EVENTS[t.event].logo))]
const logoPngs = await rasterizeLogos(logoNames)
const logoUrls = {}
for (const n of logoNames) logoUrls[n] = await upload(logoPngs[n])

// Higgsfield allows 4 concurrent requests.
const queue = [...tasks]
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const t = queue.shift()
    try {
      const refs = t.model.includes('flare') ? [logoUrls[EVENTS[t.event].logo]] : []
      const sub = await api('POST', `/${t.model}`, inputFor(t, refs), { 'Idempotency-Key': crypto.randomUUID() })
      console.log(`  → ${t.id}: queued ${sub.request_id}`)
      const done = await waitFor(sub.request_id)
      if (done.status !== 'completed' || !done.images?.length) { console.log(`  ✗ ${t.id}: ${done.status} ${done.error || ''}`); continue }
      const img = await fetch(done.images[0].url)
      const ext = (img.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg'
      const file = `${t.id}.${ext}`
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await img.arrayBuffer()))
      const entry = { id: t.id, file, event: t.event, kind: t.id.split('-').pop(), model: t.model, alt: t.alt, prompt: inputFor(t, []).prompt, requestId: sub.request_id, createdAt: new Date().toISOString() }
      const i = manifest.findIndex((m) => m.id === t.id)
      i === -1 ? manifest.push(entry) : manifest.splice(i, 1, entry)
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
      console.log(`  ✓ ${t.id}: saved ${file}`)
    } catch (e) {
      console.log(`  ✗ ${t.id}: ${e.message}`)
    }
  }
}))
console.log('Done.')
