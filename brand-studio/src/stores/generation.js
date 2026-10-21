// Generation store — runs AI jobs through the provider abstraction and keeps a
// per-session history + usage meter. Results land in the project store.
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { getProvider } from '../providers/ai/index.js'
import { JOB_TERMINAL } from '../providers/ai/types.js'
import { useProjectStore } from './project.js'

// Visitor allowance before sign-up is required (Phase 3 enforces server-side).
export const VISITOR_GENERATION_LIMIT = 12

export const useGenerationStore = defineStore('bs-generation', {
  state: () => ({
    provider: markRaw(getProvider()),
    active: null, // current GenerationJob snapshot
    history: [], // finished jobs, newest first
    used: 0,
    limit: VISITOR_GENERATION_LIMIT,
  }),

  getters: {
    busy: (s) => !!s.active && !JOB_TERMINAL.includes(s.active.status),
    remaining: (s) => Math.max(0, s.limit - s.used),
    lastError: (s) => (s.active?.status === 'failed' ? s.active.error : null),
  },

  actions: {
    useProvider(provider) { this.provider = markRaw(provider) },

    async run(request) {
      if (this.busy) throw new Error('A generation is already running.')
      if (this.remaining <= 0) {
        this.active = { id: 'limit', status: 'failed', progress: 1, results: [], error: { code: 'usage_limit', message: 'You have used all free generations. Create a free account to keep generating.' } }
        return this.active
      }
      const project = useProjectStore()
      const req = { projectId: project.project.id, brandKit: project.brandKit, event: project.event, ...request }
      const job = await this.provider.createJob(JSON.parse(JSON.stringify(req)))
      this.active = job
      return new Promise((resolve) => {
        const stop = this.provider.subscribe(job.id, (snap) => {
          this.active = snap
          if (!JOB_TERMINAL.includes(snap.status)) return
          stop?.()
          this.history.unshift({ ...snap, request: { kind: request.kind } })
          if (snap.status === 'succeeded') {
            this.used += 1
            this.apply(request, snap.results)
          }
          resolve(snap)
        })
      })
    },

    apply(request, results) {
      const project = useProjectStore()
      if (request.kind === 'concepts') project.setConcepts(results)
      else if (request.kind === 'variations') project.addConcepts(results)
      else if (request.kind === 'regenerate') project.replaceConcept(request.concept.id, results[0])
    },

    generateConcepts(directions) { return this.run({ kind: 'concepts', directions, perDirection: 2 }) },
    generateVariations(concept, count = 3) { return this.run({ kind: 'variations', concept, count }) },
    regenerate(concept) { return this.run({ kind: 'regenerate', concept }) },
    async cancel() { if (this.busy) await this.provider.cancelJob(this.active.id) },
    dismissError() { if (this.active && this.active.status !== 'running') this.active = null },
  },
})
