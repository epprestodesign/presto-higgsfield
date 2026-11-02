// Clerk → Supabase sync for workspaces (= Clerk Organizations, plus one
// personal workspace per user) and their members.
//
// 1. verifyClerkWebhook: Svix signature check on the raw body
//    (CLERK_WEBHOOK_SIGNING_SECRET, "whsec_…").
// 2. planClerkEvent: pure event → list of idempotent operations (unit-tested).
// 3. applyPlan: runs them against Supabase with the service-role key.
//
// Svix may deliver events more than once and out of order, so every write is
// an upsert / delete keyed on Clerk ids, and membership events create their
// organization's workspace if it isn't there yet (without overwriting a
// newer name).
import { Webhook } from 'svix'

export const HANDLED_EVENTS = [
  'organization.created', 'organization.updated', 'organization.deleted',
  'organizationMembership.created', 'organizationMembership.updated', 'organizationMembership.deleted',
  'user.created',
]

/** Verify a Svix-signed payload. Throws on a bad / missing signature; returns the parsed event. */
export function verifyClerkWebhook(rawBody, headers, secret) {
  const get = (k) => { const v = headers[k]; return Array.isArray(v) ? v[0] : v }
  const svixHeaders = {
    'svix-id': get('svix-id'),
    'svix-timestamp': get('svix-timestamp'),
    'svix-signature': get('svix-signature'),
  }
  if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
    throw Object.assign(new Error('Missing Svix headers'), { status: 400 })
  }
  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)
  try {
    // svix ≥2 only verifies (returns undefined); older versions returned the event.
    new Webhook(secret).verify(payload, svixHeaders)
  } catch {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 400 })
  }
  try { return JSON.parse(payload) } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }) }
}

/** Clerk org role → workspace_members.role. */
export const memberRole = (role) => (role === 'org:admin' || role === 'admin' ? 'admin' : 'member')

function personalName(u) {
  const first = (u.first_name || '').trim()
  if (first) return `${first}’s workspace`
  const handle = (u.username || '').trim()
  return handle ? `${handle}’s workspace` : 'Personal workspace'
}

/**
 * Event → operations. Unknown events → [] (acknowledged, ignored).
 * Operation types:
 *   upsert_org        { clerkOrgId, name }            insert or rename
 *   ensure_org        { clerkOrgId, name }            insert if missing (never renames)
 *   delete_org        { clerkOrgId }                  members cascade
 *   ensure_personal   { userId, name }                insert if missing
 *   upsert_member     { workspace: {clerkOrgId}|{personalOwner}, userId, role }
 *   delete_member     { workspace: {clerkOrgId}, userId }
 */
export function planClerkEvent(evt) {
  const { type, data } = evt || {}
  if (!data) return []
  switch (type) {
    case 'organization.created':
    case 'organization.updated':
      return [{ op: 'upsert_org', clerkOrgId: data.id, name: data.name || 'Untitled workspace' }]
    case 'organization.deleted':
      return data.id ? [{ op: 'delete_org', clerkOrgId: data.id }] : []
    case 'organizationMembership.created':
    case 'organizationMembership.updated': {
      const org = data.organization || {}
      const userId = data.public_user_data?.user_id
      if (!org.id || !userId) return []
      return [
        { op: 'ensure_org', clerkOrgId: org.id, name: org.name || 'Untitled workspace' },
        { op: 'upsert_member', workspace: { clerkOrgId: org.id }, userId, role: memberRole(data.role) },
      ]
    }
    case 'organizationMembership.deleted': {
      const orgId = data.organization?.id
      const userId = data.public_user_data?.user_id
      if (!orgId || !userId) return []
      return [{ op: 'delete_member', workspace: { clerkOrgId: orgId }, userId }]
    }
    case 'user.created':
      if (!data.id) return []
      return [
        { op: 'ensure_personal', userId: data.id, name: personalName(data) },
        { op: 'upsert_member', workspace: { personalOwner: data.id }, userId: data.id, role: 'admin' },
      ]
    default:
      return []
  }
}

function check({ error }, what) {
  if (error) throw Object.assign(new Error(`${what}: ${error.message || error.code || 'Supabase error'}`), { status: 500 })
}

async function workspaceId(db, ref) {
  const q = db.from('workspaces').select('id')
  const r = await (ref.clerkOrgId ? q.eq('clerk_org_id', ref.clerkOrgId) : q.eq('personal_owner', ref.personalOwner)).maybeSingle()
  check(r, 'Look up workspace')
  return r.data?.id || null
}

/** Run a plan against a Supabase client (service role). */
export async function applyPlan(db, plan) {
  for (const step of plan) {
    switch (step.op) {
      case 'upsert_org':
        check(await db.from('workspaces').upsert({ clerk_org_id: step.clerkOrgId, name: step.name }, { onConflict: 'clerk_org_id' }), 'Upsert workspace')
        break
      case 'ensure_org':
        check(await db.from('workspaces').upsert({ clerk_org_id: step.clerkOrgId, name: step.name }, { onConflict: 'clerk_org_id', ignoreDuplicates: true }), 'Ensure workspace')
        break
      case 'delete_org':
        check(await db.from('workspaces').delete().eq('clerk_org_id', step.clerkOrgId), 'Delete workspace')
        break
      case 'ensure_personal':
        check(await db.from('workspaces').upsert({ personal_owner: step.userId, name: step.name }, { onConflict: 'personal_owner', ignoreDuplicates: true }), 'Ensure personal workspace')
        break
      case 'upsert_member': {
        const id = await workspaceId(db, step.workspace)
        if (!id) throw Object.assign(new Error('Workspace missing for membership'), { status: 500 })
        check(await db.from('workspace_members').upsert({ workspace_id: id, user_id: step.userId, role: step.role }, { onConflict: 'workspace_id,user_id' }), 'Upsert member')
        break
      }
      case 'delete_member': {
        const id = await workspaceId(db, step.workspace)
        if (id) check(await db.from('workspace_members').delete().eq('workspace_id', id).eq('user_id', step.userId), 'Delete member')
        break
      }
      default:
        throw new Error(`Unknown op ${step.op}`)
    }
  }
}
