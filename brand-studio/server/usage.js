// Usage log: one generation_jobs row per paid request (a Higgsfield
// generation, a Firecrawl logo lookup), written with the service-role key on
// the server. Rows belong to the EventPipe team workspace and, when the
// browser says which, to a project. Logging never gets in the way of the
// request itself: failures are logged and swallowed.
import { TEAM } from './teamWorkspace.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DONE = { completed: 'completed', failed: 'failed', nsfw: 'failed', canceled: 'cancelled', cancelled: 'cancelled' }

/** Higgsfield / Firecrawl status → generation_jobs.status. */
export const jobStatus = (s) => DONE[s] || (s === 'in_progress' ? 'in_progress' : 'queued')

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} db  service-role client
 */
export function usageLog(db) {
  let team = null
  const workspaceId = async () => {
    if (team) return team
    const r = await db.from('workspaces').select('id').eq('clerk_org_id', TEAM.clerkOrgId).maybeSingle()
    team = r.data?.id || null
    return team
  }
  const quiet = (what) => (e) => console.warn(`[usage] ${what}:`, e?.message || e)

  return {
    /** A request was made. `projectId` is optional (a saved project's id). */
    async started({ userId, projectId, provider, model, requestId = null, credits = 0, prompt = null, status = 'queued' }) {
      try {
        const row = {
          workspace_id: await workspaceId(),
          project_id: UUID.test(projectId || '') ? projectId : null,
          provider, model, request_id: requestId, credits: Number(credits) || 0,
          prompt: prompt ? String(prompt).slice(0, 4000) : null,
          status: jobStatus(status), created_by: userId,
          ...(DONE[status] ? { completed_at: new Date().toISOString() } : {}),
        }
        let r = await db.from('generation_jobs').insert(row)
        // The project may not be saved yet (it's saved a moment after it's
        // made): keep the record without the link.
        if (r.error && row.project_id && /foreign key/i.test(r.error.message)) r = await db.from('generation_jobs').insert({ ...row, project_id: null })
        if (r.error) throw r.error
      } catch (e) { quiet('record')(e) }
    },
    /** A Higgsfield request reached a final status. */
    async finished(requestId, status, error = null) {
      if (!requestId || !DONE[status]) return
      try {
        const r = await db.from('generation_jobs')
          .update({ status: jobStatus(status), completed_at: new Date().toISOString(), ...(error ? { error: String(error).slice(0, 500) } : {}) })
          .eq('request_id', requestId).in('status', ['queued', 'in_progress'])
        if (r.error) throw r.error
      } catch (e) { quiet('finish')(e) }
    },
  }
}
