// Browser client for the local Higgsfield dev proxy (brand-studio/dev/higgsfieldDevProxy.js).
// It never sees the API key; the dev server adds it. On static builds
// (GitHub Pages) the proxy doesn't exist and health() reports that.
const BASE = '/hf-api'

// On Vercel the API needs a signed-in user. The Clerk session cookie already
// rides along on same-origin requests; the Bearer header is belt and braces.
// (Mock auth and the dev proxy return no token, so no header is sent.)
async function authHeader(opts) {
  try {
    const { getSessionToken } = await import('../../auth/index.js')
    const token = await getSessionToken(opts)
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}

async function call(method, path, body, headers = {}) {
  const send = async (auth) => fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...auth, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  let res
  try {
    res = await send(await authHeader())
    // A cached session token can be stale (laptop asleep, clock drift): mint
    // a fresh one and try once more before calling it a sign-in problem.
    if (res.status === 401) {
      const fresh = await authHeader({ fresh: true })
      if (fresh.Authorization) res = await send(fresh)
    }
  } catch {
    throw Object.assign(new Error('Could not reach the local dev server.'), { code: 'offline' })
  }
  const text = await res.text()
  let json = {}
  try { json = text ? JSON.parse(text) : {} } catch { json = {} }
  if (!res.ok) {
    const detail = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail || json).slice(0, 300)
    const err = new Error(detail || `Higgsfield error (${res.status})`)
    err.status = res.status
    err.reason = json.reason || ''
    err.code = json.code || (res.status === 401 ? 'unauthorized' : /concurrent/i.test(detail) ? 'concurrency' : 'api_error')
    throw err
  }
  return json
}

export const TERMINAL = ['completed', 'failed', 'nsfw', 'canceled']

export const hf = {
  /** { proxy, configured, keyId } — or { proxy:false } on static hosting. */
  async health() {
    try {
      const res = await fetch(`${BASE}/_health`, { headers: { Accept: 'application/json', ...(await authHeader()) } })
      if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return { proxy: false, configured: false }
      return await res.json()
    } catch {
      return { proxy: false, configured: false }
    }
  },
  verify: () => call('POST', '/_verify', {}),
  estimate: (endpoint, input) => call('POST', `/estimate/${endpoint}`, input),
  /** `projectId` (a saved project) ties the request to it in the usage log. */
  submit: (endpoint, input, idempotencyKey = crypto.randomUUID(), { projectId } = {}) => call('POST', `/generate/${endpoint}`, input, { 'x-idempotency-key': idempotencyKey, ...(projectId ? { 'x-project-id': projectId } : {}) }),
  status: (requestId) => call('GET', `/requests/${requestId}/status`),
  cancel: (requestId) => call('POST', `/requests/${requestId}/cancel`, {}),
  save: (url, name, meta) => call('POST', '/_save', { url, name, meta }),
  /** A website's logo (as a data: URL), colours and fonts, via Firecrawl on the server. */
  brand: (url) => call('POST', '/_brand', { url }),
  /** AI background removal (Photoroom, on the server): a PNG data: URL. */
  cutout: (dataUrl, { projectId } = {}) => call('POST', '/_cutout', { data_url: dataUrl }, projectId ? { 'x-project-id': projectId } : {}),

  /** Upload a data: URL (logo / photo) and get a public URL Higgsfield can read. */
  async uploadDataUrl(dataUrl) {
    const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl || '')
    if (!m) throw new Error('Reference images must be PNG, JPEG or WebP.')
    const { public_url: url } = await call('POST', '/upload', { content_type: m[1], data_base64: m[2] })
    return url
  },

  /** Poll until terminal, with backoff (1s → 4s). onUpdate gets every status snapshot. */
  async waitFor(requestId, { onUpdate, signal, timeoutMs = 5 * 60 * 1000 } = {}) {
    const started = Date.now()
    let delay = 1000
    for (;;) {
      if (signal?.aborted) throw Object.assign(new Error('Stopped watching'), { code: 'aborted' })
      const snap = await call('GET', `/requests/${requestId}/status`)
      onUpdate?.(snap)
      if (TERMINAL.includes(snap.status)) return snap
      if (Date.now() - started > timeoutMs) throw Object.assign(new Error('Timed out waiting for Higgsfield'), { code: 'timeout' })
      await new Promise((r) => setTimeout(r, delay))
      delay = Math.min(4000, Math.round(delay * 1.5))
    }
  },
}

/**
 * Rasterize any image URL (including SVG logos, which Higgsfield doesn't accept)
 * to a PNG data URL on a transparent canvas, max `size` px on the long edge.
 */
export function rasterizeToPng(src, size = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth || size
      const h = img.naturalHeight || size
      const scale = size / Math.max(w, h)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = src
  })
}
