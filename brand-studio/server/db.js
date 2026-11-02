// Service-role Supabase client for the Vercel functions (never the browser).
import { createClient } from '@supabase/supabase-js'

let client
export function adminDb(env = process.env) {
  if (!(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY)) return null
  client ||= createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}
