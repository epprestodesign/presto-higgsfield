// POST /api/clerk-webhook — Clerk (Svix) → Supabase workspace sync.
// Public URL, but every request must carry a valid Svix signature made with
// CLERK_WEBHOOK_SIGNING_SECRET. Writes with the Supabase service-role key
// (SUPABASE_SECRET_KEY), which never leaves the server.
import { createClient } from '@supabase/supabase-js'
import { send, readRaw } from '../brand-studio/server/http.js'
import { verifyClerkWebhook, planClerkEvent, applyPlan } from '../brand-studio/server/clerkWebhook.js'

let client
function supabase(env) {
  client ||= createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}

export async function handleClerkWebhook(req, res, { env = process.env, db } = {}) {
  if (req.method !== 'POST') return send(res, 405, { detail: 'POST only' })
  const secret = env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) return send(res, 503, { detail: 'Webhook not configured' })
  if (!db && !(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY)) return send(res, 503, { detail: 'Database not configured' })
  try {
    const evt = verifyClerkWebhook(await readRaw(req, { limit: 1024 * 1024 }), req.headers, secret)
    const plan = planClerkEvent(evt)
    if (plan.length) await applyPlan(db || supabase(env), plan)
    return send(res, 200, { ok: true, type: evt.type, applied: plan.length })
  } catch (e) {
    // Svix retries any non-2xx; only log server-side failures.
    if ((e.status || 500) >= 500) console.error('[clerk-webhook]', e.message)
    return send(res, e.status || 500, { detail: e.message })
  }
}

export default function handler(req, res) {
  return handleClerkWebhook(req, res)
}
