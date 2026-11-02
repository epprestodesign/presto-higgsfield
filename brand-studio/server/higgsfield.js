// Higgsfield proxy — the request logic behind /hf-api/*, shared by
//   • the Vite dev plugin (brand-studio/dev/higgsfieldDevProxy.js): loopback
//     only, key from the repo's .env, `_save` writes into the repo;
//   • the Vercel function (api/hf.js): Clerk-authenticated, key from the
//     project's environment variables, no `_save` (no repo writes).
//
// Routes (relative to /hf-api):
//   GET  /_health                 { proxy, configured, keyId }
//   GET  /_image?url=…[&any=1]    same-origin copy of an image (canvases need CORS)
//   POST /_verify                 check the key without spending credits
//   POST /_save                   download a generation into the repo (dev only)
//   POST /upload                  presign + PUT a logo / reference image
//   POST /generate/<endpoint>     submit (allowlisted endpoints only)
//   POST /estimate/<endpoint>     credit estimate
//   GET  /requests/<id>/status    poll
//   POST /requests/<id>/cancel
import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { send, readJson } from './http.js'
import { lookupBrand } from './brand.js'

export const API = 'https://api.higgsfield.ai'

// Image workflows Brand Studio is allowed to call (endpoint IDs from docs.higgsfield.ai).
export const ALLOWED_ENDPOINTS = new Set([
  'marketing-studio/image/flare',
  'recraft/v4.1/text-to-image',
  'recraft/v4.1-pro/text-to-image',
  'ideogram/v4.0',
  'higgsfield-ai/soul/standard',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MAX_IMAGE = 30 * 1024 * 1024

/**
 * Higgsfield credentials from an env-like object. Accepts
 * HIGGSFIELD_API_KEY_ID + HIGGSFIELD_API_KEY_SECRET (or HF_* aliases), a
 * combined "keyId:secret" in HIGGSFIELD_CREDENTIALS, or that combined value
 * pasted into the SECRET field (it then wins over the ID field).
 */
export function credentialsFrom(env) {
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

export const CREDENTIAL_KEYS = ['HIGGSFIELD_API_KEY_ID', 'HIGGSFIELD_API_KEY_SECRET', 'HIGGSFIELD_CREDENTIALS', 'HF_API_KEY_ID', 'HF_API_KEY_SECRET', 'HF_CREDENTIALS']

export const mask = (id) => (id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : '••••')

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

/** Is this an image URL the proxy may fetch? `pasted` = a URL the user pasted (any public https host). */
export function imageUrlAllowed(u, pasted) {
  const publicHost = !/^(localhost|.*\.local|.*\.internal|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname)
  const allowed = pasted ? publicHost : /(^|\.)(cloudfront\.net|higgsfield\.ai)$/.test(u.hostname)
  return u.protocol === 'https:' && allowed
}

/**
 * Handle one /hf-api request.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {object} o
 * @param {string} o.route        path after /hf-api, e.g. "/generate/ideogram/v4.0"
 * @param {URLSearchParams} o.query
 * @param {{id:string,secret:string}|null} o.creds
 * @param {((body:object) => Promise<object>)|null} [o.save]  `_save` implementation; null → 404
 * @param {object} [o.health]     overrides merged into the `_health` answer
 * @param {boolean} [o.streamImages] pipe `_image` bytes instead of buffering (Vercel's response cap)
 * @param {string} [o.firecrawlKey] FIRECRAWL_API_KEY, for `_brand` (a website's logo + colours)
 * @param {ReturnType<import('./usage.js').usageLog>|null} [o.usage] usage log (Vercel only)
 * @param {string} [o.userId]     the signed-in Clerk user, for the usage log
 */
export async function handleHiggsfield(req, res, { route, query, creds, save = null, health = {}, streamImages = false, firecrawlKey = '', usage = null, userId = '' }) {
  const projectId = String(req.headers?.['x-project-id'] || '')
  try {
    if (route === '/_health' && req.method === 'GET') {
      return send(res, 200, { proxy: true, configured: !!creds, keyId: creds ? mask(creds.id) : null, ...health })
    }
    // Same-origin copy of a generated image, so the browser can crop and
    // export it from a canvas (Higgsfield's CDN sends no CORS headers).
    // No credentials involved; only Higgsfield/CloudFront image URLs.
    if (route === '/_image' && req.method === 'GET') {
      let u
      try { u = new URL(query.get('url') || '') } catch { return send(res, 400, { detail: 'Bad image URL' }) }
      // ?any=1: an image URL the user pasted (Banner Lab). Public https hosts only.
      const pasted = query.get('any') === '1'
      if (!imageUrlAllowed(u, pasted)) return send(res, 400, { detail: pasted ? 'Paste a public https image URL' : 'Only Higgsfield image URLs can be fetched' })
      const r = await fetch(u)
      const type = r.headers.get('content-type') || ''
      if (!r.ok || !type.startsWith('image/')) return send(res, 502, { detail: `Image fetch failed (${r.status})` })
      if (streamImages && r.body) {
        const len = Number(r.headers.get('content-length') || 0)
        if (len > MAX_IMAGE) return send(res, 413, { detail: 'Image too large' })
        res.statusCode = 200
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'private, max-age=86400')
        let seen = 0
        const body = Readable.fromWeb(r.body)
        body.on('data', (c) => { seen += c.length; if (seen > MAX_IMAGE) body.destroy(new Error('Image too large')) })
        body.on('error', () => res.destroy())
        return body.pipe(res)
      }
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > MAX_IMAGE) return send(res, 413, { detail: 'Image too large' })
      res.statusCode = 200
      res.setHeader('Content-Type', type)
      res.setHeader('Cache-Control', 'private, max-age=86400')
      return res.end(buf)
    }

    // A website's logo, colours and fonts (Firecrawl). Not a Higgsfield call,
    // so it doesn't need the Higgsfield key.
    if (route === '/_brand' && req.method === 'POST') {
      const { url } = await readJson(req)
      const brand = await lookupBrand(url, { apiKey: firecrawlKey })
      await usage?.started({ userId, projectId, provider: 'firecrawl', model: 'branding', credits: brand.credits, prompt: url, status: 'completed' })
      return send(res, 200, brand)
    }

    if (route === '/_save' && !save) return send(res, 404, { detail: 'Saving into the repo is only available on the local dev server.' })

    if (!creds) return send(res, 412, { detail: 'No Higgsfield API key found. Add HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET to .env.', code: 'not_configured' })

    // Verify credentials without spending credits: look up a request that can't exist.
    if (route === '/_verify' && req.method === 'POST') {
      const r = await upstream(creds, 'GET', '/requests/00000000-0000-4000-8000-000000000000/status')
      if (r.status === 401 || r.status === 403) return send(res, 200, { ok: false, status: r.status, detail: r.json.detail || 'Key rejected' })
      return send(res, 200, { ok: true, status: r.status })
    }

    if (route === '/_save' && req.method === 'POST') {
      return send(res, 200, await save(await readJson(req)))
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
      // With a usage log, ask for the credit cost alongside (free, in parallel).
      const [r, est] = await Promise.all([
        upstream(creds, 'POST', apiPath, body, idem),
        usage && kind === 'generate' ? upstream(creds, 'POST', `/estimate/${endpoint}`, body).catch(() => null) : null,
      ])
      if (usage && kind === 'generate' && r.status < 300 && r.json?.request_id) {
        await usage.started({ userId, projectId, provider: 'higgsfield', model: endpoint, requestId: r.json.request_id, credits: est?.status < 300 ? est.json?.credits : 0, prompt: body.prompt, status: r.json.status })
      }
      return send(res, r.status, r.json)
    }

    const reqm = route.match(/^\/requests\/([^/]+)\/(status|cancel)$/)
    if (reqm && UUID_RE.test(reqm[1])) {
      const r = await upstream(creds, reqm[2] === 'cancel' ? 'POST' : 'GET', `/requests/${reqm[1]}/${reqm[2]}`, reqm[2] === 'cancel' ? {} : undefined)
      if (usage && r.status < 300) await usage.finished(reqm[1], reqm[2] === 'cancel' ? 'canceled' : r.json?.status, r.json?.error)
      return send(res, r.status, r.json)
    }

    return send(res, 404, { detail: 'Unknown Higgsfield proxy route' })
  } catch (e) {
    return send(res, e.status || 500, { detail: e.message, ...(e.code ? { code: e.code } : {}) })
  }
}
