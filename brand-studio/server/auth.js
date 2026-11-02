// Clerk session check for the Vercel functions.
//
// The browser proves who it is with its Clerk session token, either as
// `Authorization: Bearer <token>` (fetch calls) or the `__session` cookie
// Clerk sets on the app's own domain (which is what `<img src="/hf-api/_image">`
// sends, since images can't carry headers). Verified with @clerk/backend's
// verifyToken using CLERK_JWT_KEY (networkless) or CLERK_SECRET_KEY (JWKS).
//
// No Clerk config → 503 "Auth not configured". The Higgsfield proxy spends
// paid credits, so it is never left open.
import { verifyToken } from '@clerk/backend'
import { send, header } from './http.js'

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean)

/** Clerk settings from the environment (PEM newlines may arrive escaped). */
export function clerkConfig(env = process.env) {
  const jwtKey = env.CLERK_JWT_KEY ? env.CLERK_JWT_KEY.replace(/\\n/g, '\n') : undefined
  const secretKey = env.CLERK_SECRET_KEY || undefined
  const authorizedParties = list(env.CLERK_AUTHORIZED_PARTIES)
  return { jwtKey, secretKey, authorizedParties, configured: !!(jwtKey || secretKey) }
}

function cookies(req) {
  const out = {}
  for (const part of String(header(req, 'cookie') || '').split(';')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    const k = part.slice(0, i).trim()
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()) } catch { out[k] = part.slice(i + 1).trim() }
  }
  return out
}

/** Candidate session tokens, best first: Bearer header, then `__session` / `__session_<suffix>` cookies. */
export function sessionTokens(req) {
  const out = []
  const auth = header(req, 'authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  if (m) out.push(m[1].trim())
  const jar = cookies(req)
  if (jar.__session) out.push(jar.__session)
  for (const [k, v] of Object.entries(jar)) if (k.startsWith('__session_') && v) out.push(v)
  return [...new Set(out)]
}

/**
 * Authenticate a request.
 * @returns {Promise<{ok:true, userId:string, orgId:string|null, orgRole:string|null, claims:object} | {ok:false, status:number, detail:string, code:string}>}
 */
export async function authenticate(req, { env = process.env, verify = verifyToken } = {}) {
  const cfg = clerkConfig(env)
  if (!cfg.configured) return { ok: false, status: 503, detail: 'Auth not configured', code: 'auth_not_configured' }
  const tokens = sessionTokens(req)
  if (!tokens.length) {
    console.warn('[auth] 401: no session token on the request')
    return { ok: false, status: 401, detail: 'Sign in to continue.', code: 'unauthorized', reason: 'no-token' }
  }
  const opts = {
    ...(cfg.jwtKey ? { jwtKey: cfg.jwtKey } : {}),
    ...(cfg.secretKey ? { secretKey: cfg.secretKey } : {}),
    ...(cfg.authorizedParties.length ? { authorizedParties: cfg.authorizedParties } : {}),
  }
  let reason = ''
  for (const token of tokens) {
    try {
      const r = await verify(token, opts)
      // verifyToken throws on failure; tolerate the { data, errors } shape too.
      const claims = r && 'errors' in r ? (r.errors ? null : r.data) : r
      if (claims?.sub) {
        // Session token v2 nests the active org under `o`; v1 used org_id / org_role.
        const orgId = claims.o?.id || claims.org_id || null
        const orgRole = claims.o?.rol ? `org:${claims.o.rol}` : claims.org_role || null
        return { ok: true, userId: claims.sub, orgId, orgRole, claims }
      }
      reason ||= 'no-subject'
    } catch (e) {
      // Try the next candidate, but keep why this one failed: Clerk's
      // TokenVerificationError reasons (token-expired, jwk-kid-mismatch, …)
      // aren't secret and are the only clue when a signed-in user gets a 401.
      reason ||= e?.reason || e?.code || String(e?.message || e).slice(0, 120)
    }
  }
  console.warn(`[auth] 401 after ${tokens.length} token(s): ${reason}`)
  return { ok: false, status: 401, detail: 'Your session has expired. Sign in again.', code: 'unauthorized', reason }
}

/**
 * Wrap a Node handler so it only runs for a signed-in Clerk user.
 * The handler gets (req, res, auth).
 */
export function requireAuth(handler, opts = {}) {
  return async (req, res) => {
    const auth = await authenticate(req, opts)
    if (!auth.ok) return send(res, auth.status, { detail: auth.detail, code: auth.code, reason: auth.reason })
    return handler(req, res, auth)
  }
}

/** The Clerk Frontend API host a publishable key points at (pk_test_<base64 "host$">). */
export function frontendApiOf(publishableKey = '') {
  const m = /^pk_(?:test|live)_(.+)$/.exec(publishableKey)
  if (!m) return ''
  try { return Buffer.from(m[1], 'base64').toString('utf8').replace(/\$$/, '') } catch { return '' }
}

/**
 * Do the server's secret key and the browser's publishable key belong to the
 * same Clerk instance? Compares the key ids each side publishes. A mismatch
 * makes every signed-in request fail with jwk-kid-mismatch.
 * @returns {Promise<boolean|null>} null when it can't tell.
 */
export async function clerkKeysMatch(env = process.env, fetchFn = fetch) {
  const host = frontendApiOf(env.VITE_CLERK_PUBLISHABLE_KEY)
  if (!host || !env.CLERK_SECRET_KEY) return null
  try {
    const kids = async (url, headers) => {
      const r = await fetchFn(url, { headers })
      if (!r.ok) return null
      return new Set(((await r.json()).keys || []).map((k) => k.kid))
    }
    const [server, browser] = await Promise.all([
      kids('https://api.clerk.com/v1/jwks', { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` }),
      kids(`https://${host}/.well-known/jwks.json`),
    ])
    if (!server) return false // the secret key itself was rejected
    if (!browser) return null
    return [...browser].some((k) => server.has(k))
  } catch { return null }
}
