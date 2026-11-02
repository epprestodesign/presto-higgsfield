import { describe, it, expect } from 'vitest'
import { Webhook } from 'svix'
import { planClerkEvent, applyPlan, verifyClerkWebhook, memberRole } from '../clerkWebhook.js'
import { handleClerkWebhook } from '../../../api/clerk-webhook.js'
import { handleHiggsfield } from '../higgsfield.js'
import { fakeReq, fakeRes } from './helpers.js'

// In-memory stand-in for the bits of supabase-js the webhook uses, with the
// schema's unique keys (workspaces.clerk_org_id / personal_owner,
// workspace_members (workspace_id, user_id)).
function memoryDb() {
  const tables = { workspaces: [], workspace_members: [] }
  let n = 0
  const keyOf = (cols, row) => cols.map((c) => row[c]).join('|')
  function from(table) {
    const rows = tables[table]
    const filters = []
    const match = (r) => filters.every(([c, v]) => r[c] === v)
    const q = {
      _op: null,
      upsert(row, { onConflict, ignoreDuplicates } = {}) {
        const cols = onConflict.split(',')
        const hit = rows.find((r) => keyOf(cols, r) === keyOf(cols, row))
        if (hit) { if (!ignoreDuplicates) Object.assign(hit, row) } else rows.push({ ...(table === 'workspaces' ? { id: `ws_${++n}`, clerk_org_id: null, personal_owner: null } : {}), ...row })
        return Promise.resolve({ error: null })
      },
      select() { q._op = 'select'; return q },
      delete() { q._op = 'delete'; return q },
      eq(c, v) { filters.push([c, v]); return q },
      maybeSingle() { return Promise.resolve({ data: rows.find(match) || null, error: null }) },
      then(resolve, reject) {
        if (q._op === 'delete') tables[table] = tables[table].filter((r) => !match(r))
        if (table === 'workspaces' && q._op === 'delete') {
          const ids = new Set(tables.workspaces.map((w) => w.id))
          tables.workspace_members = tables.workspace_members.filter((m) => ids.has(m.workspace_id)) // on delete cascade
        }
        return Promise.resolve({ error: null }).then(resolve, reject)
      },
    }
    return q
  }
  return { from, tables }
}

const org = { id: 'org_1', name: 'Heartland Events', object: 'organization' }
const membership = (role = 'org:member', userId = 'user_2') => ({ organization: org, public_user_data: { user_id: userId }, role })

describe('Clerk event → plan', () => {
  it('maps organization events to workspaces', () => {
    expect(planClerkEvent({ type: 'organization.created', data: org })).toEqual([{ op: 'upsert_org', clerkOrgId: 'org_1', name: 'Heartland Events' }])
    expect(planClerkEvent({ type: 'organization.updated', data: { ...org, name: 'New' } })[0]).toMatchObject({ op: 'upsert_org', name: 'New' })
    expect(planClerkEvent({ type: 'organization.deleted', data: { id: 'org_1', deleted: true } })).toEqual([{ op: 'delete_org', clerkOrgId: 'org_1' }])
  })

  it('maps memberships, with Clerk org:admin → admin and anything else → member', () => {
    expect(memberRole('org:admin')).toBe('admin')
    expect(memberRole('org:member')).toBe('member')
    expect(memberRole('org:billing_manager')).toBe('member')
    expect(planClerkEvent({ type: 'organizationMembership.created', data: membership('org:admin') })).toEqual([
      { op: 'ensure_org', clerkOrgId: 'org_1', name: 'Heartland Events' },
      { op: 'upsert_member', workspace: { clerkOrgId: 'org_1' }, userId: 'user_2', role: 'admin' },
    ])
    expect(planClerkEvent({ type: 'organizationMembership.deleted', data: membership() })).toEqual([
      { op: 'delete_member', workspace: { clerkOrgId: 'org_1' }, userId: 'user_2' },
    ])
  })

  it('gives every new user a personal workspace they admin', () => {
    expect(planClerkEvent({ type: 'user.created', data: { id: 'user_9', first_name: 'Ana' } })).toEqual([
      { op: 'ensure_personal', userId: 'user_9', name: 'Ana’s workspace' },
      { op: 'upsert_member', workspace: { personalOwner: 'user_9' }, userId: 'user_9', role: 'admin' },
    ])
  })

  it('ignores other events', () => {
    expect(planClerkEvent({ type: 'session.created', data: { id: 'sess_1' } })).toEqual([])
    expect(planClerkEvent({})).toEqual([])
  })
})

describe('applyPlan (idempotent)', () => {
  it('replays safely and handles out-of-order membership events', async () => {
    const db = memoryDb()
    const events = [
      { type: 'organizationMembership.created', data: membership('org:member') }, // before the org event
      { type: 'organization.created', data: org },
      { type: 'organization.updated', data: { ...org, name: 'Heartland' } },
      { type: 'organizationMembership.updated', data: membership('org:admin') },
      { type: 'organizationMembership.created', data: membership('org:member', 'user_3') },
      { type: 'user.created', data: { id: 'user_2', first_name: 'Bo' } },
    ]
    for (let pass = 0; pass < 2; pass++) for (const e of events) await applyPlan(db, planClerkEvent(e))
    expect(db.tables.workspaces).toHaveLength(2)
    expect(db.tables.workspaces.find((w) => w.clerk_org_id === 'org_1').name).toBe('Heartland')
    const personal = db.tables.workspaces.find((w) => w.personal_owner === 'user_2')
    expect(personal.name).toBe('Bo’s workspace')
    expect(db.tables.workspace_members).toHaveLength(3)
    expect(db.tables.workspace_members.find((m) => m.user_id === 'user_2' && m.workspace_id !== personal.id).role).toBe('admin')

    await applyPlan(db, planClerkEvent({ type: 'organizationMembership.deleted', data: membership('org:member', 'user_3') }))
    await applyPlan(db, planClerkEvent({ type: 'organizationMembership.deleted', data: membership('org:member', 'user_3') }))
    expect(db.tables.workspace_members).toHaveLength(2)

    await applyPlan(db, planClerkEvent({ type: 'organization.deleted', data: { id: 'org_1', deleted: true } }))
    expect(db.tables.workspaces).toHaveLength(1)
    expect(db.tables.workspace_members).toEqual([expect.objectContaining({ workspace_id: personal.id, user_id: 'user_2', role: 'admin' })])
  })
})

describe('webhook endpoint', () => {
  const secret = `whsec_${Buffer.from('test-signing-secret-0123456789').toString('base64')}`
  const signed = (evt, s = secret) => {
    const body = JSON.stringify(evt)
    const id = 'msg_1'
    const ts = new Date()
    const signature = new Webhook(s).sign(id, ts, body)
    return { body, headers: { 'svix-id': id, 'svix-timestamp': String(Math.floor(ts.getTime() / 1000)), 'svix-signature': signature } }
  }

  it('verifies the Svix signature', () => {
    const { body, headers } = signed({ type: 'user.created', data: { id: 'user_1' } })
    expect(verifyClerkWebhook(body, headers, secret).type).toBe('user.created')
    expect(() => verifyClerkWebhook(body.replace('user_1', 'user_X'), headers, secret)).toThrow('Invalid webhook signature')
    expect(() => verifyClerkWebhook(body, {}, secret)).toThrow('Missing Svix headers')
  })

  it('rejects unsigned requests and applies signed ones', async () => {
    const db = memoryDb()
    const env = { CLERK_WEBHOOK_SIGNING_SECRET: secret }
    const bad = fakeRes()
    await handleClerkWebhook(fakeReq({ method: 'POST', body: '{"type":"user.created","data":{"id":"u"}}' }), bad, { env, db })
    expect(bad.statusCode).toBe(400)
    expect(db.tables.workspaces).toHaveLength(0)

    const { body, headers } = signed({ type: 'user.created', data: { id: 'user_1' } })
    const ok = fakeRes()
    await handleClerkWebhook(fakeReq({ method: 'POST', headers, body }), ok, { env, db })
    expect(ok.statusCode).toBe(200)
    expect(ok.json).toEqual({ ok: true, type: 'user.created', applied: 2 })
    expect(db.tables.workspace_members).toEqual([expect.objectContaining({ user_id: 'user_1', role: 'admin' })])
  })

  it('is 503 when not configured', async () => {
    const res = fakeRes()
    await handleClerkWebhook(fakeReq({ method: 'POST', body: '{}' }), res, { env: {} })
    expect(res.statusCode).toBe(503)
  })
})

describe('shared Higgsfield handler', () => {
  it('returns 404 for _save when there is no repo to write to (Vercel)', async () => {
    const res = fakeRes()
    await handleHiggsfield(fakeReq({ method: 'POST', body: {} }), res, { route: '/_save', query: new URLSearchParams(), creds: { id: 'a', secret: 'b' }, save: null })
    expect(res.statusCode).toBe(404)
  })

  it('keeps _image limited to Higgsfield hosts, or public https hosts when pasted', async () => {
    const run = async (url, any) => {
      const res = fakeRes()
      const query = new URLSearchParams({ url, ...(any ? { any: '1' } : {}) })
      await handleHiggsfield(fakeReq(), res, { route: '/_image', query, creds: null })
      return res
    }
    expect((await run('https://evil.example/a.png')).statusCode).toBe(400)
    expect((await run('http://d1.cloudfront.net/a.png')).statusCode).toBe(400)
    expect((await run('https://localhost/a.png', true)).statusCode).toBe(400)
    expect((await run('https://10.0.0.1/a.png', true)).statusCode).toBe(400)
  })
})
