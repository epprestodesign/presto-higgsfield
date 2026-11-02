// POST /api/workspace — the signed-in user's workspace, created on first use.
// Everyone joins the one EventPipe team workspace (brand-studio/server/
// teamWorkspace.js), which also covers people who signed up before the Clerk
// webhook existed. Writes with the service-role key, server-side only.
import { createClient } from '@supabase/supabase-js'
import { send } from '../brand-studio/server/http.js'
import { requireAuth } from '../brand-studio/server/auth.js'
import { ensureTeamMember } from '../brand-studio/server/teamWorkspace.js'

let client
function supabase(env) {
  client ||= createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}

export async function handleWorkspace(req, res, auth, { env = process.env, db } = {}) {
  if (req.method !== 'POST') return send(res, 405, { detail: 'POST only' })
  if (!db && !(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY)) return send(res, 503, { detail: 'Database not configured', code: 'db_not_configured' })
  try {
    return send(res, 200, await ensureTeamMember(db || supabase(env), auth.userId))
  } catch (e) {
    console.error('[workspace]', e.message)
    return send(res, e.status || 500, { detail: e.message })
  }
}

export default requireAuth((req, res, auth) => handleWorkspace(req, res, auth))
