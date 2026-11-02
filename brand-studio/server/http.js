// Small Node http helpers shared by the Vite dev proxy and the Vercel
// functions (both hand us a Node IncomingMessage / ServerResponse).

export const MAX_BODY = 12 * 1024 * 1024 // logo uploads arrive base64-encoded

export function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

/** The raw request body as a Buffer (webhook signatures need the exact bytes). */
export function readRaw(req, { limit = MAX_BODY } = {}) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy() }
      else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function readJson(req, opts) {
  const buf = await readRaw(req, opts)
  if (!buf.length) return {}
  try { return JSON.parse(buf.toString('utf8')) } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }) }
}

/** Header lookup that works for Node's lower-cased header object. */
export const header = (req, name) => {
  const v = req.headers?.[name.toLowerCase()]
  return Array.isArray(v) ? v[0] : v
}
