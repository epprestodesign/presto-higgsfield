// The EventPipe team workspace. Everyone who can sign in (Clerk's allowlist
// limits that to EventPipe people) works in one shared workspace, so every
// project is visible to the whole team. It isn't a Clerk Organization: the row
// uses a reserved clerk_org_id that no real org can have.
import { applyPlan } from './clerkWebhook.js'

export const TEAM = { clerkOrgId: 'team:eventpipe', name: 'EventPipe' }

/**
 * Make sure the team workspace exists and the user is a member (idempotent).
 * @param {import('@supabase/supabase-js').SupabaseClient} db  service-role client
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function ensureTeamMember(db, userId) {
  await applyPlan(db, [
    { op: 'ensure_org', clerkOrgId: TEAM.clerkOrgId, name: TEAM.name },
    { op: 'upsert_member', workspace: { clerkOrgId: TEAM.clerkOrgId }, userId, role: 'member' },
  ])
  const r = await db.from('workspaces').select('id, name').eq('clerk_org_id', TEAM.clerkOrgId).single()
  if (r.error) throw Object.assign(new Error(`Look up team workspace: ${r.error.message}`), { status: 500 })
  return r.data
}
