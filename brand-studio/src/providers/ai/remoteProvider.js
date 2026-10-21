// Remote providers (Higgsfield Marketing Studio, Recraft, Ideogram).
//
// The browser NEVER calls these vendors directly and NEVER holds their keys.
// It talks to an EventPipe backend (Phase 3: Netlify Function or Supabase Edge
// Function) at VITE_AI_API_BASE, which:
//   1. authenticates the user (Supabase JWT) and checks usage limits,
//   2. calls the vendor with a server-side secret,
//   3. stores the job + results in `generation_jobs`, assets in Storage,
//   4. exposes GET /jobs/:id for polling (or Supabase Realtime).
// Until that backend exists `available` is false and the UI offers the demo
// generator instead.
import { ProviderNotConfiguredError, JOB_TERMINAL } from './types.js'

const API_BASE = (import.meta.env?.VITE_AI_API_BASE || '').replace(/\/$/, '')

export function createRemoteProvider({ id, label, model, pollMs = 2000, getAuthToken = async () => null }) {
  const available = !!API_BASE

  async function call(path, init = {}) {
    if (!available) throw new ProviderNotConfiguredError(label)
    const token = await getAuthToken()
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(body.message || `Generation service error (${res.status})`)
      err.code = body.code || (res.status === 429 ? 'usage_limit' : 'service_error')
      throw err
    }
    return res.json()
  }

  const provider = {
    id,
    label,
    model,
    available,
    createJob: (req) => call('/generation-jobs', { method: 'POST', body: JSON.stringify({ provider: id, model, request: req }) }),
    getJob: (jobId) => call(`/generation-jobs/${encodeURIComponent(jobId)}`),
    cancelJob: (jobId) => call(`/generation-jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' }),
    subscribe(jobId, cb) {
      let stopped = false
      const poll = async () => {
        if (stopped) return
        try {
          const job = await provider.getJob(jobId)
          cb(job)
          if (!JOB_TERMINAL.includes(job.status)) setTimeout(poll, pollMs)
        } catch (e) {
          cb({ id: jobId, status: 'failed', progress: 1, results: [], error: { code: e.code || 'service_error', message: e.message } })
        }
      }
      poll()
      return () => { stopped = true }
    },
  }
  return provider
}
