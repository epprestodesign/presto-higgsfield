// GET /api/health — public liveness check. Reports which server pieces are
// configured (booleans only, never values).
import { send } from '../brand-studio/server/http.js'
import { clerkConfig, clerkKeysMatch } from '../brand-studio/server/auth.js'
import { credentialsFrom } from '../brand-studio/server/higgsfield.js'

export default async function handler(req, res) {
  const env = process.env
  return send(res, 200, {
    ok: true,
    env: env.VERCEL_ENV || 'unknown',
    commit: (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
    auth: clerkConfig(env).configured,
    higgsfield: !!credentialsFrom(env),
    supabase: !!(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY),
    clerkWebhook: !!env.CLERK_WEBHOOK_SIGNING_SECRET,
    firecrawl: !!env.FIRECRAWL_API_KEY,
    photoroom: !!env.PHOTOROOM_API_KEY,
    // Same Clerk instance on both sides? (null = couldn't check)
    clerkKeysMatch: await clerkKeysMatch(env),
  })
}
