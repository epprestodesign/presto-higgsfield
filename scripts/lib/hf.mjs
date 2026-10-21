// Shared Higgsfield API helpers for the generation scripts (Node, server-side).
// Credentials come from the repo's .env and are never printed.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const API = 'https://api.higgsfield.ai'

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

function credentials() {
  const env = readEnv()
  let id = env.HIGGSFIELD_API_KEY_ID
  let secret = env.HIGGSFIELD_API_KEY_SECRET
  if (secret?.includes(':')) [id, secret] = [secret.split(':')[0], secret.split(':').slice(1).join(':')]
  if (!id || !secret) throw new Error('Missing Higgsfield key in .env (HIGGSFIELD_API_KEY_ID / HIGGSFIELD_API_KEY_SECRET)')
  return { id, secret }
}

export async function api(method, p, body, headers = {}) {
  const { id, secret } = credentials()
  const r = await fetch(`${API}${p}`, { method, headers: { Authorization: `Key ${id}:${secret}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${json.detail ? JSON.stringify(json.detail) : ''}`)
  return json
}

export const submit = (endpoint, input) => api('POST', `/${endpoint}`, input, { 'Idempotency-Key': crypto.randomUUID() })
export const estimate = (endpoint, input) => api('POST', `/estimate/${endpoint}`, input)

export async function waitFor(requestId) {
  let delay = 2000
  for (;;) {
    const s = await api('GET', `/requests/${requestId}/status`)
    if (['completed', 'failed', 'nsfw', 'canceled'].includes(s.status)) return s
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(6000, delay * 1.4)
  }
}

/** Run async jobs with Higgsfield's concurrency limit (4 queued/processing at once). */
export async function pool(items, worker, size = 4) {
  const queue = [...items]
  await Promise.all(Array.from({ length: size }, async () => { while (queue.length) await worker(queue.shift()) }))
}

export const MODELS = {
  flare: 'marketing-studio/image/flare',
  recraft: 'recraft/v4.1/text-to-image',
  ideogram: 'ideogram/v4.0',
}

// Presto banner system (references/102226) — appended to every banner prompt.
export const BANNER_RULES = [
  'Ultra-wide website hero background.',
  'Minimal, system-safe and uncluttered: a simple background that lets a centered logo and white headline sit on top.',
  'Keep the central area calm, low-detail and evenly toned; put any texture or detail toward the outer edges.',
  'Muted and slightly dark overall so white text stays readable; no bright hot spots in the center.',
  'Important content stays within the middle horizontal band so the image also works cropped to a thin 6:1 strip.',
  'No people as a focal point, no faces in focus.',
  'No text, no letters, no numbers, no logos, no signage, no watermarks.',
].join(' ')

export const LOGO_RULES = 'Professional event logo, flat vector style, crisp clean edges, bold simple shapes, high contrast, perfectly spelled lettering, centered with generous margin on a perfectly flat plain pure white background. The emblem is self-contained with its own solid filled shape so it reads on both light and dark backgrounds. No mockup, no paper texture, no shadows, no gradients in the background, no extra text.'

const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))
const shade = (hex, amt) => '#' + rgb(hex).map((v) => Math.round(v * (1 - amt)).toString(16).padStart(2, '0')).join('')

export function bannerInput(model, prompt, { palette = [], refs = [] } = {}) {
  const full = `${prompt} ${BANNER_RULES}`
  if (model === MODELS.recraft) {
    return { prompt: full, aspect_ratio: '2:1', resolution: '1k', output_format: 'png', colors: palette.map((h) => ({ rgb: rgb(h) })), ...(palette[0] ? { background_color: { rgb: rgb(shade(palette[0], 0.15)) } } : {}) }
  }
  return { prompt: full, aspect_ratio: '21:9', resolution: '2k', quality: 'high', enhance_prompt: false, ...(refs.length ? { image_urls: refs } : {}) }
}

export const logoInput = (prompt) => ({ prompt: `${prompt} ${LOGO_RULES}`, aspect_ratio: '1:1', rendering_speed: 'QUALITY' })

/** Read/merge a manifest.json next to generated files. */
export function manifestAt(dir) {
  const p = path.join(dir, 'manifest.json')
  const list = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []
  return {
    list,
    upsert(entry) { const i = list.findIndex((m) => m.id === entry.id); i === -1 ? list.push(entry) : list.splice(i, 1, entry) },
    save() { fs.writeFileSync(p, JSON.stringify(list, null, 2) + '\n') },
  }
}
