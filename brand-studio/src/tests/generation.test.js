import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createMockProvider } from '../providers/ai/mockProvider.js'
import { getProvider } from '../providers/ai/index.js'
import { createRemoteProvider } from '../providers/ai/remoteProvider.js'
import { useProjectStore } from '../stores/project.js'
import { useGenerationStore } from '../stores/generation.js'
import { useSessionStore } from '../stores/session.js'
import { memoryAdapter } from '../stores/persistence.js'
import { sampleProject } from '../data/sampleEvents.js'

const waitFor = (provider, id) =>
  new Promise((resolve) => {
    const stop = provider.subscribe(id, (job) => {
      if (['succeeded', 'failed', 'canceled'].includes(job.status)) { stop?.(); resolve(job) }
    })
  })

describe('mock AI provider', () => {
  const ctx = () => { const p = sampleProject('heartland'); return { brandKit: p.brandKit, event: p.event, projectId: p.id } }

  it('generates two concepts per creative direction', async () => {
    const provider = createMockProvider({ latencyMs: 30 })
    const job = await provider.createJob({ kind: 'concepts', ...ctx() })
    const done = await waitFor(provider, job.id)
    expect(done.status).toBe('succeeded')
    expect(done.results).toHaveLength(6)
    expect(new Set(done.results.map((c) => c.direction))).toEqual(new Set(['signature', 'energy', 'premium']))
  })

  it('never asks the image model for text or logos', async () => {
    const provider = createMockProvider({ latencyMs: 10 })
    const done = await waitFor(provider, (await provider.createJob({ kind: 'concepts', ...ctx() })).id)
    done.results.forEach((c) => expect(c.prompt).toMatch(/No text, no letters, no logos/))
  })

  it('links variations to their parent', async () => {
    const provider = createMockProvider({ latencyMs: 10 })
    const first = await waitFor(provider, (await provider.createJob({ kind: 'concepts', ...ctx() })).id)
    const parent = first.results[2]
    const vars = await waitFor(provider, (await provider.createJob({ kind: 'variations', concept: parent, count: 3, ...ctx() })).id)
    expect(vars.results).toHaveLength(3)
    vars.results.forEach((v) => { expect(v.parentId).toBe(parent.id); expect(v.direction).toBe(parent.direction) })
  })

  it('reports failures and cancellations', async () => {
    const provider = createMockProvider({ latencyMs: 30, failNext: true })
    const failed = await waitFor(provider, (await provider.createJob({ kind: 'concepts', ...ctx() })).id)
    expect(failed.status).toBe('failed')
    expect(failed.error.message).toMatch(/Nothing was charged/)
    const job = await provider.createJob({ kind: 'concepts', ...ctx() })
    const pending = waitFor(provider, job.id)
    await provider.cancelJob(job.id)
    expect((await pending).status).toBe('canceled')
  })

  it('falls back to the mock when no backend is configured', () => {
    expect(getProvider('higgsfield').id).toBe('mock')
    expect(createRemoteProvider({ id: 'higgsfield', label: 'Higgsfield' }).available).toBe(false)
  })
})

describe('stores', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('runs a generation into the project and meters usage', async () => {
    const project = useProjectStore()
    project.loadSample('heartland')
    const gen = useGenerationStore()
    gen.useProvider(createMockProvider({ latencyMs: 20 }))
    await gen.generateConcepts()
    expect(project.project.concepts.items).toHaveLength(6)
    expect(gen.used).toBe(1)

    const target = project.project.concepts.items[1]
    project.selectConcept(target.id)
    project.toggleFavorite(target.id)
    await gen.regenerate(target)
    const replaced = project.project.concepts.items[1]
    expect(replaced.id).not.toBe(target.id)
    expect(project.project.concepts.selectedId).toBe(replaced.id)
    expect(project.project.concepts.favoriteIds).toContain(replaced.id)
  })

  it('stops at the visitor usage limit', async () => {
    const project = useProjectStore()
    project.loadSample('heartland')
    const gen = useGenerationStore()
    gen.limit = 0
    const job = await gen.generateConcepts()
    expect(job.error.code).toBe('usage_limit')
  })

  it('keeps the slug in sync with the name until edited by hand', () => {
    const project = useProjectStore()
    project.reset()
    project.updateEvent({ name: 'Summer Classic 2027' })
    expect(project.project.publishing.slug).toBe('summer-classic-2027')
    project.setSlug('my-classic')
    project.updateEvent({ name: 'Summer Classic 2028' })
    expect(project.project.publishing.slug).toBe('my-classic')
  })

  it('refuses to publish until the checklist passes, then publishes a demo URL', () => {
    const project = useProjectStore()
    project.loadSample('heartland')
    expect(() => project.publish()).toThrow(/checklist/)
    project.setConcepts([{ id: 'cpt_x', direction: 'energy', treatment: {} }])
    project.selectConcept('cpt_x')
    project.markReviewed('desktop')
    project.markReviewed('mobile')
    project.acceptDisclaimer()
    expect(project.status).toBe('ready')
    project.publish()
    expect(project.status).toBe('published')
    expect(project.project.publishing.publishedUrl).toBe('https://demo.eventpipe.com/heartland-invitational-soccer-cup-2027')
  })

  it('applying an ad preset rotates the existing sponsors', () => {
    const project = useProjectStore()
    project.loadSample('heartland')
    project.applyAdPreset('browse', 'billboards-rail')
    const browse = project.project.ads.placements.browse
    expect(browse.map((p) => p.slot)).toEqual(['browse.top', 'browse.rail', 'browse.bottom'])
    expect(browse[0].sponsorIds).toHaveLength(3)
  })

  it('saves and restores the visitor draft', async () => {
    const project = useProjectStore()
    project.persistence = memoryAdapter()
    project.loadSample('wedding')
    await project.saveDraft()
    project.reset()
    expect(await project.restoreDraft()).toBe(true)
    expect(project.project.event.name).toBe('The Alvarez & Chen Wedding')
  })

  it('claims the anonymous draft on sign-up', async () => {
    const project = useProjectStore()
    project.loadSample('heartland')
    const session = useSessionStore()
    await session.signUp({ email: 'dana@example.com', password: 'longenough' }, { delayMs: 0 })
    expect(project.project.ownerId).toBe(session.user.id)
    expect(session.projects[0].id).toBe(project.project.id)
  })
})
