import { describe, it, expect, vi, afterEach } from 'vitest'
import { authenticate, sessionTokens, clerkConfig, requireAuth } from '../auth.js'
import handler, { routeOf } from '../../../api/hf.js'
import { fakeReq, fakeRes } from './helpers.js'

const ENV = { CLERK_SECRET_KEY: 'sk_test_x' }
const okVerify = vi.fn(async (token) => {
  if (token === 'good') return { sub: 'user_1', o: { id: 'org_1', rol: 'admin' } }
  throw new Error('bad token')
})

describe('Clerk auth guard', () => {
  it('is 503 "Auth not configured" without CLERK_SECRET_KEY / CLERK_JWT_KEY', async () => {
    const r = await authenticate(fakeReq({ headers: { authorization: 'Bearer good' } }), { env: {}, verify: okVerify })
    expect(r).toMatchObject({ ok: false, status: 503, detail: 'Auth not configured' })
  })

  it('is 401 with no token or a bad token', async () => {
    expect(await authenticate(fakeReq(), { env: ENV, verify: okVerify })).toMatchObject({ ok: false, status: 401 })
    expect(await authenticate(fakeReq({ headers: { authorization: 'Bearer nope' } }), { env: ENV, verify: okVerify })).toMatchObject({ ok: false, status: 401 })
  })

  it('accepts a Bearer token and reads the active org', async () => {
    const r = await authenticate(fakeReq({ headers: { authorization: 'Bearer good' } }), { env: ENV, verify: okVerify })
    expect(r).toMatchObject({ ok: true, userId: 'user_1', orgId: 'org_1', orgRole: 'org:admin' })
  })

  it('falls back to the __session cookie (what <img> requests carry)', async () => {
    const req = fakeReq({ headers: { cookie: 'a=1; __session=good; __session_Ab12=other' } })
    expect(sessionTokens(req)).toEqual(['good', 'other'])
    expect(await authenticate(req, { env: ENV, verify: okVerify })).toMatchObject({ ok: true, userId: 'user_1' })
  })

  it('passes jwtKey (unescaped) and authorizedParties to verifyToken', async () => {
    const verify = vi.fn(async () => ({ sub: 'user_2' }))
    const env = { CLERK_JWT_KEY: '-----BEGIN PUBLIC KEY-----\\nabc\\n-----END PUBLIC KEY-----', CLERK_AUTHORIZED_PARTIES: 'https://a.example, https://b.example' }
    await authenticate(fakeReq({ headers: { authorization: 'Bearer t' } }), { env, verify })
    expect(verify).toHaveBeenCalledWith('t', { jwtKey: '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----', authorizedParties: ['https://a.example', 'https://b.example'] })
    expect(clerkConfig({}).configured).toBe(false)
  })

  it('requireAuth only runs the handler for a signed-in user', async () => {
    const inner = vi.fn((req, res, auth) => { res.statusCode = 200; res.end(auth.userId) })
    const guarded = requireAuth(inner, { env: ENV, verify: okVerify })
    const denied = fakeRes()
    await guarded(fakeReq(), denied)
    expect(denied.statusCode).toBe(401)
    expect(inner).not.toHaveBeenCalled()
    const allowed = fakeRes()
    await guarded(fakeReq({ headers: { authorization: 'Bearer good' } }), allowed)
    expect(allowed.body).toBe('user_1')
  })
})

describe('Vercel Higgsfield function (api/hf.js)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('maps the rewritten path back to a proxy route', () => {
    const a = routeOf({ url: '/api/hf?__hfpath=generate%2Frecraft%2Fv4.1%2Ftext-to-image' })
    expect(a.route).toBe('/generate/recraft/v4.1/text-to-image')
    const b = routeOf({ url: '/api/hf?url=https%3A%2F%2Fx.cloudfront.net%2Fa.png&__hfpath=_image' })
    expect(b.route).toBe('/_image')
    expect(b.query.get('url')).toBe('https://x.cloudfront.net/a.png')
    expect(b.query.has('__hfpath')).toBe(false)
    expect(routeOf({ url: '/hf-api/requests/abc/status' }).route).toBe('/requests/abc/status')
  })

  it('never serves paid routes when Clerk is not configured', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '')
    vi.stubEnv('CLERK_JWT_KEY', '')
    vi.stubEnv('HIGGSFIELD_API_KEY_ID', 'id_123456789')
    vi.stubEnv('HIGGSFIELD_API_KEY_SECRET', 'secret')
    for (const [method, path] of [['POST', 'generate/ideogram/v4.0'], ['POST', 'upload'], ['GET', '_image'], ['POST', '_verify']]) {
      const res = fakeRes()
      await handler(fakeReq({ method, url: `/api/hf?__hfpath=${encodeURIComponent(path)}`, body: {} }), res)
      expect(res.statusCode).toBe(503)
      expect(res.json.detail).toBe('Auth not configured')
    }
  })

  it('keeps _health public and reports not-live without auth', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '')
    vi.stubEnv('CLERK_JWT_KEY', '')
    vi.stubEnv('HIGGSFIELD_API_KEY_ID', 'id_123456789')
    vi.stubEnv('HIGGSFIELD_API_KEY_SECRET', 'secret')
    const res = fakeRes()
    await handler(fakeReq({ url: '/api/hf?__hfpath=_health' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.json).toMatchObject({ proxy: true, configured: false, auth: 'not_configured', signedIn: false, keyId: null })
  })
})
