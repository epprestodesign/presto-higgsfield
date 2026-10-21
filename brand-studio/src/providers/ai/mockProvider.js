// Mock AI provider — simulates an async generation job (queued → running with
// staged progress → succeeded/failed) entirely in the browser. No network, no
// API key, no cost. Lets every loading / error / success state be designed and
// tested before the real backend exists.
import { uid } from '../../models/ids.js'
import { buildConcept, templatesFor } from './conceptFactory.js'
import { JOB_TERMINAL } from './types.js'

const STAGES = ['Reading your brand kit', 'Choosing photography', 'Composing layouts', 'Balancing color and contrast', 'Finishing concepts']

export function createMockProvider({ latencyMs = 2400, failNext = false } = {}) {
  const jobs = new Map()
  const listeners = new Map()
  const timers = new Map()
  let shouldFail = failNext

  const emit = (job) => (listeners.get(job.id) || []).forEach((cb) => cb({ ...job, results: [...job.results] }))

  const results = (req) => {
    const { brandKit, event } = req
    if (req.kind === 'concepts') {
      const dirs = req.directions?.length ? req.directions : ['signature', 'energy', 'premium']
      const per = req.perDirection || 2
      return dirs.flatMap((direction) => Array.from({ length: per }, (_, i) => buildConcept({ direction, templateIndex: i, brandKit, event })))
    }
    if (req.kind === 'variations') {
      const c = req.concept
      return Array.from({ length: req.count || 3 }, (_, i) => buildConcept({ direction: c.direction, templateIndex: c.templateIndex ?? 0, brandKit, event, variant: i + 1, parent: c }))
    }
    if (req.kind === 'regenerate') {
      const c = req.concept
      const next = ((c.templateIndex ?? 0) + 1) % templatesFor(c.direction).length
      return [buildConcept({ direction: c.direction, templateIndex: next, brandKit, event, variant: (c.version || 1) % 3, retake: true })]
    }
    return []
  }

  function run(job, req) {
    const steps = STAGES.length
    const stepMs = Math.max(60, latencyMs / (steps + 1))
    let i = 0
    job.status = 'running'
    const tick = () => {
      if (job.status === 'canceled') return
      if (i < steps) {
        job.stage = STAGES[i]
        job.progress = Math.min(0.95, (i + 1) / (steps + 1))
        i++
        emit(job)
        timers.set(job.id, setTimeout(tick, stepMs))
        return
      }
      if (shouldFail) {
        shouldFail = false
        job.status = 'failed'
        job.error = { code: 'generation_failed', message: 'The generator timed out before finishing. Nothing was charged — try again.' }
      } else {
        job.status = 'succeeded'
        job.results = results(req)
      }
      job.progress = 1
      job.stage = job.status === 'succeeded' ? 'Done' : 'Failed'
      emit(job)
    }
    timers.set(job.id, setTimeout(tick, stepMs))
  }

  return {
    id: 'mock',
    label: 'Demo generator',
    available: true,
    /** Test/story hook: make the next job fail. */
    failNextJob() { shouldFail = true },
    async createJob(req) {
      const job = { id: uid('job'), provider: 'mock', kind: req.kind, status: 'queued', progress: 0, stage: 'Queued', results: [], error: null, cost: 0, createdAt: new Date().toISOString() }
      jobs.set(job.id, job)
      run(job, req)
      return { ...job }
    },
    async getJob(id) {
      const job = jobs.get(id)
      if (!job) throw new Error(`Unknown job ${id}`)
      return { ...job, results: [...job.results] }
    },
    subscribe(id, cb) {
      const list = listeners.get(id) || []
      listeners.set(id, [...list, cb])
      const job = jobs.get(id)
      if (job && JOB_TERMINAL.includes(job.status)) cb({ ...job })
      return () => listeners.set(id, (listeners.get(id) || []).filter((f) => f !== cb))
    },
    async cancelJob(id) {
      const job = jobs.get(id)
      if (!job || JOB_TERMINAL.includes(job.status)) return
      clearTimeout(timers.get(id))
      job.status = 'canceled'
      job.stage = 'Canceled'
      emit(job)
    },
  }
}
