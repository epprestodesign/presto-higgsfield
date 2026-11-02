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
// Static builds (GitHub Pages) don't include this, so live generation there is
// off. On Vercel the same routes are served by api/hf.js behind Clerk auth.
import fs from 'node:fs'
import path from 'node:path'
import { send } from '../server/http.js'
import { handleHiggsfield, credentialsFrom, CREDENTIAL_KEYS, ALLOWED_ENDPOINTS } from '../server/higgsfield.js'

// The request logic lives in ../server/higgsfield.js (shared with the Vercel
// function in api/hf.js); this file adds the dev-only parts: loopback check,
// .env re-reading and `_save` into the repo.
export { ALLOWED_ENDPOINTS }

const PREFIX = '/hf-api'

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
  const pick = (o) => Object.fromEntries(CREDENTIAL_KEYS.filter((k) => o[k]).map((k) => [k, o[k]]))
  return credentialsFrom({ ...pick(START_ENV), ...pick(readEnvFile(path.join(root, '.env'))), ...pick(readEnvFile(path.join(root, '.env.local'))) })
}

function isLoopback(req) {
  const a = req.socket?.remoteAddress || ''
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
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

/** A server-only key (FIRECRAWL_API_KEY, PHOTOROOM_API_KEY) from the shell or .env / .env.local (re-read each request). */
function envKey(root, k) {
  return readEnvFile(path.join(root, '.env.local'))[k] || readEnvFile(path.join(root, '.env'))[k] || START_ENV[k] || ''
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
        return handleHiggsfield(req, res, {
          route: url.pathname.slice(PREFIX.length),
          query: url.searchParams,
          creds: credentials(root),
          save: (body) => saveToRepo(root, body),
          firecrawlKey: envKey(root, 'FIRECRAWL_API_KEY'),
          photoroomKey: envKey(root, 'PHOTOROOM_API_KEY'),
        })
      })
    },
  }
}
