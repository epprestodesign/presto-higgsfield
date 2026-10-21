// Higgsfield dev proxy — a Vite dev-server plugin (Storybook + prototype).
//
// Lets the Brand Studio UI call the real Higgsfield API during LOCAL development
// without the API key ever reaching the browser:
//   • credentials are read from the repo's gitignored .env on every request
//     (HIGGSFIELD_API_KEY_ID + HIGGSFIELD_API_KEY_SECRET — no VITE_ prefix, so
//     Vite never bundles them), and added server-side as the Authorization header;
//   • only loopback clients are served (the prototype dev server listens on the
//     LAN — nobody else on the network can spend your credits);
//   • only an allowlist of image endpoints can be called.
// Static builds (GitHub Pages) don't include this, so live generation is local-only.
// Production uses a real backend with auth + quotas (docs/BRAND_STUDIO_AUDIT.md).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const API = 'https://api.higgsfield.ai'
const PREFIX = '/hf-api'

// Image workflows Brand Studio is allowed to call (endpoint IDs from docs.higgsfield.ai).
export const ALLOWED_ENDPOINTS = new Set([
  'marketing-studio/image/flare',
  'recraft/v4.1/text-to-image',
  'recraft/v4.1-pro/text-to-image',
  'ideogram/v4.0',
  'higgsfield-ai/soul/standard',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BODY = 12 * 1024 * 1024 // logo uploads arrive base64-encoded

// Shell env as it was when the dev server started (a key exported in the shell
// still works). Everything else comes from re-reading .env / .env.local on each
// request, so editing the file takes effect without a restart. Deliberately
// NOT live process.env: tooling can copy .env values into it and then a
// removed key would linger.
const START_ENV = { ...process.env }

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!m || line.trim().startsWith('#')) continue
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

function credentials(root) {
  const pick = ({ HIGGSFIELD_API_KEY_ID, HIGGSFIELD_API_KEY_SECRET, HIGGSFIELD_CREDENTIALS, HF_API_KEY_ID, HF_API_KEY_SECRET, HF_CREDENTIALS }) =>
    ({ HIGGSFIELD_API_KEY_ID, HIGGSFIELD_API_KEY_SECRET, HIGGSFIELD_CREDENTIALS, HF_API_KEY_ID, HF_API_KEY_SECRET, HF_CREDENTIALS })
  const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v))
  const env = { ...strip(pick(START_ENV)), ...strip(pick(readEnvFile(path.join(root, '.env')))), ...strip(pick(readEnvFile(path.join(root, '.env.local')))) }
  // A combined "keyId:secret" credential pasted into the SECRET field also works
  // (that's how some key screens present it); it then wins over the ID field.
  const pastedSecret = (env.HIGGSFIELD_API_KEY_SECRET || env.HF_API_KEY_SECRET || '').trim()
  if (pastedSecret.includes(':')) {
    const [id, ...rest] = pastedSecret.split(':')
    if (id && rest.join(':')) return { id: id.trim(), secret: rest.join(':').trim() }
  }
  const combined = env.HIGGSFIELD_CREDENTIALS || env.HF_CREDENTIALS || ''
  const [cid, csecret] = combined.includes(':') ? combined.split(':') : []
  const id = (env.HIGGSFIELD_API_KEY_ID || env.HF_API_KEY_ID || cid || '').trim()
  const secret = (env.HIGGSFIELD_API_KEY_SECRET || env.HF_API_KEY_SECRET || csecret || '').trim()
  return id && secret ? { id, secret } : null
}

const mask = (id) => (id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : '••••')

function isLoopback(req) {
  const a = req.socket?.remoteAddress || ''
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy() }
      else chunks.push(c)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })) }
    })
    req.on('error', reject)
  })
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function upstream(creds, method, apiPath, body, extraHeaders = {}) {
  const r = await fetch(`${API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Key ${creds.id}:${creds.secret}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  let json
  try { json = text ? JSON.parse(text) : {} } catch { json = { detail: text.slice(0, 500) } }
  return { status: r.status, json }
}

/** Download a generated image into the repo so it outlives Higgsfield's 7-day retention. */
async function saveToRepo(root, { url, name, meta }) {
  const u = new URL(url)
  if (u.protocol !== 'https:' || /^(localhost|\d+\.\d+\.\d+\.\d+|\[)/.test(u.hostname)) throw Object.assign(new Error('Only public https image URLs can be saved'), { status: 400 })
  const r = await fetch(u)
  if (!r.ok) throw Object.assign(new Error(`Download failed (${r.status})`), { status: 502 })
  const type = r.headers.get('content-type') || ''
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const safe = String(name || 'banner').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'banner'
  const dir = path.join(root, 'brand-studio/src/assets/generated')
  fs.mkdirSync(dir, { recursive: true })
  const file = `${safe}-${Date.now().toString(36)}.${ext}`
  fs.writeFileSync(path.join(dir, file), Buffer.from(await r.arrayBuffer()))
  const manifestPath = path.join(dir, 'manifest.json')
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []
  manifest.push({ file, savedAt: new Date().toISOString(), sourceUrl: url, ...meta })
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  return { file, path: `brand-studio/src/assets/generated/${file}` }
}

export function higgsfieldDevProxy({ root = process.cwd() } = {}) {
  return {
    name: 'brand-studio:higgsfield-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) return next()
        if (!isLoopback(req)) return send(res, 403, { detail: 'The Higgsfield dev proxy only serves this machine.' })
        const url = new URL(req.url, 'http://local')
        const route = url.pathname.slice(PREFIX.length)
        const creds = credentials(root)
        try {
          if (route === '/_health' && req.method === 'GET') {
            return send(res, 200, { proxy: true, configured: !!creds, keyId: creds ? mask(creds.id) : null })
          }
          if (!creds) return send(res, 412, { detail: 'No Higgsfield API key found. Add HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET to .env.', code: 'not_configured' })

          // Verify credentials without spending credits: look up a request that can't exist.
          if (route === '/_verify' && req.method === 'POST') {
            const r = await upstream(creds, 'GET', '/requests/00000000-0000-4000-8000-000000000000/status')
            if (r.status === 401 || r.status === 403) return send(res, 200, { ok: false, status: r.status, detail: r.json.detail || 'Key rejected' })
            return send(res, 200, { ok: true, status: r.status })
          }

          if (route === '/_save' && req.method === 'POST') {
            return send(res, 200, await saveToRepo(root, await readJson(req)))
          }

          // Logo / reference upload: presign, then PUT the bytes (server-side, so no CORS).
          if (route === '/upload' && req.method === 'POST') {
            const { content_type: contentType, data_base64: data } = await readJson(req)
            if (!/^image\/(jpeg|jpg|png|webp)$/.test(contentType || '')) return send(res, 400, { detail: 'Upload a JPEG, PNG or WebP image.' })
            const pre = await upstream(creds, 'POST', '/files/generate-upload-url', { content_type: contentType })
            if (pre.status >= 300) return send(res, pre.status, pre.json)
            const put = await fetch(pre.json.upload_url, { method: 'PUT', headers: pre.json.upload_headers || { 'Content-Type': contentType }, body: Buffer.from(data, 'base64') })
            if (!put.ok) return send(res, 502, { detail: `Upload failed (${put.status})` })
            return send(res, 200, { public_url: pre.json.public_url })
          }

          const gen = route.match(/^\/(generate|estimate)\/(.+)$/)
          if (gen && req.method === 'POST') {
            const [, kind, endpoint] = gen
            if (!ALLOWED_ENDPOINTS.has(endpoint)) return send(res, 400, { detail: `Endpoint not allowed: ${endpoint}` })
            const body = await readJson(req)
            const apiPath = kind === 'estimate' ? `/estimate/${endpoint}` : `/${endpoint}`
            const idem = kind === 'generate' ? { 'Idempotency-Key': String(req.headers['x-idempotency-key'] || crypto.randomUUID()) } : {}
            const r = await upstream(creds, 'POST', apiPath, body, idem)
            return send(res, r.status, r.json)
          }

          const reqm = route.match(/^\/requests\/([^/]+)\/(status|cancel)$/)
          if (reqm && UUID_RE.test(reqm[1])) {
            const r = await upstream(creds, reqm[2] === 'cancel' ? 'POST' : 'GET', `/requests/${reqm[1]}/${reqm[2]}`, reqm[2] === 'cancel' ? {} : undefined)
            return send(res, r.status, r.json)
          }

          return send(res, 404, { detail: 'Unknown Higgsfield proxy route' })
        } catch (e) {
          return send(res, e.status || 500, { detail: e.message })
        }
      })
    },
  }
}
