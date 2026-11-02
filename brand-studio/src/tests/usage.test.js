import { describe, it, expect } from 'vitest'
import { usageLog, jobStatus } from '../../server/usage.js'

// A tiny stand-in for the service-role Supabase client.
function fakeDb({ failFk = false } = {}) {
  const calls = { inserts: [], updates: [] }
  const db = {
    from(table) {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'workspaces' ? { id: 'ws-team' } : null }) }) }),
        insert: async (row) => {
          calls.inserts.push(row)
          return failFk && row.project_id ? { error: { message: 'insert violates foreign key constraint' } } : { error: null }
        },
        update: (row) => ({ eq: (_c, v) => ({ in: async () => (calls.updates.push({ row, requestId: v }), { error: null }) }) }),
      }
    },
  }
  return { db, calls }
}
const PID = '11111111-2222-4333-8444-555555555555'

describe('usage log', () => {
  it('records a generation against the team workspace and the project', async () => {
    const { db, calls } = fakeDb()
    await usageLog(db).started({ userId: 'user_1', projectId: PID, provider: 'higgsfield', model: 'flare', requestId: 'r1', credits: '2', prompt: 'Scene: …' })
    expect(calls.inserts[0]).toMatchObject({ workspace_id: 'ws-team', project_id: PID, provider: 'higgsfield', model: 'flare', request_id: 'r1', credits: 2, status: 'queued', created_by: 'user_1' })
  })
  it('keeps the record without the project when it isn’t saved yet', async () => {
    const { db, calls } = fakeDb({ failFk: true })
    await usageLog(db).started({ userId: 'u', projectId: PID, provider: 'higgsfield', model: 'flare' })
    expect(calls.inserts.map((r) => r.project_id)).toEqual([PID, null])
  })
  it('logs a finished lookup as completed, and ignores junk project ids', async () => {
    const { db, calls } = fakeDb()
    await usageLog(db).started({ userId: 'u', projectId: 'lab-123', provider: 'firecrawl', model: 'branding', credits: 1, status: 'completed' })
    expect(calls.inserts[0]).toMatchObject({ project_id: null, status: 'completed', credits: 1 })
    expect(calls.inserts[0].completed_at).toBeTruthy()
  })
  it('closes a job only on a final status', async () => {
    const { db, calls } = fakeDb()
    const log = usageLog(db)
    await log.finished('r1', 'in_progress')
    await log.finished('r1', 'nsfw', 'blocked')
    expect(calls.updates).toHaveLength(1)
    expect(calls.updates[0]).toMatchObject({ requestId: 'r1', row: { status: 'failed', error: 'blocked' } })
    expect(jobStatus('canceled')).toBe('cancelled')
  })
})
