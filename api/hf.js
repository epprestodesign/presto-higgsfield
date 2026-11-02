// Vercel function behind /hf-api/* (vercel.json rewrites it here with the
// sub-path in ?__hfpath=). Same request logic as the local dev proxy
// (brand-studio/server/higgsfield.js), plus:
//   • every route except `_health` needs a signed-in Clerk user (it spends
//     paid credits); no Clerk config → 503 "Auth not configured";
//   • the Higgsfield key comes from the project's environment variables;
//   • `_save` is 404 (no repo to write into);
//   • `_image` streams, so big generations don't hit the response-size cap;
//   • `_brand` (a website's logo via Firecrawl) uses FIRECRAWL_API_KEY.
import { send } from '../brand-studio/server/http.js'
import { authenticate, clerkConfig } from '../brand-studio/server/auth.js'
import { handleHiggsfield, credentialsFrom, mask } from '../brand-studio/server/higgsfield.js'

export function routeOf(req) {
  const url = new URL(req.url || '/', 'http://vercel.local')
  const query = url.searchParams
  let sub = query.get('__hfpath')
  if (sub == null) sub = url.pathname.replace(/^\/(hf-api|api\/hf)/, '').replace(/^\//, '')
  query.delete('__hfpath')
  return { route: `/${sub}`, query }
}

export default async function handler(req, res) {
  const { route, query } = routeOf(req)
  const creds = credentialsFrom(process.env)
  const authReady = clerkConfig().configured

  if (route === '/_health' && req.method === 'GET') {
    // Public: the UI uses it to choose live vs sample mode. The masked key id
    // is only shown to a signed-in user.
    const auth = authReady ? await authenticate(req) : { ok: false }
    return handleHiggsfield(req, res, {
      route, query, creds,
      health: {
        configured: !!creds && authReady,
        auth: authReady ? 'clerk' : 'not_configured',
        signedIn: auth.ok,
        keyId: auth.ok && creds ? mask(creds.id) : null,
      },
    })
  }

  const auth = await authenticate(req)
  if (!auth.ok) return send(res, auth.status, { detail: auth.detail, code: auth.code, reason: auth.reason })
  return handleHiggsfield(req, res, { route, query, creds, save: null, streamImages: true, firecrawlKey: process.env.FIRECRAWL_API_KEY || '' })
}
