// Shared Storybook helpers for Brand Studio stories.
import { useProjectStore } from '../stores/project.js'
import { useGenerationStore } from '../stores/generation.js'
import { buildConcept } from '../providers/ai/conceptFactory.js'
import { createMockProvider } from '../providers/ai/mockProvider.js'
import { memoryAdapter } from '../stores/persistence.js'

/** Six concepts (2 per direction) for a project, generated synchronously. */
export function conceptsFor(project) {
  return ['signature', 'energy', 'premium'].flatMap((direction) =>
    [0, 1].map((templateIndex) => buildConcept({ direction, templateIndex, brandKit: project.brandKit, event: project.event })),
  )
}

/**
 * Decorator: seed the (fresh, per-story) Pinia project store with a sample
 * event. Options:
 *   sample        — 'heartland' | 'fintech' | 'wedding' | 'lakeshore' | null (blank project)
 *   concepts      — also generate the six concepts
 *   select        — index of the concept to select (implies concepts)
 *   latencyMs     — mock generator latency
 *   failNext      — make the next generation fail (error-state stories)
 *   mutate        — (store) => void, for one-off state
 */
export const withProject = ({ sample = 'heartland', concepts = false, select = null, latencyMs = 1800, failNext = false, mutate } = {}) =>
  (story) => ({
    components: { story },
    setup() {
      const project = useProjectStore()
      project.persistence = memoryAdapter()
      if (sample) project.loadSample(sample)
      else project.reset()
      if (concepts || select !== null) {
        const items = conceptsFor(project.project)
        project.setConcepts(items)
        if (select !== null) project.selectConcept(items[select].id)
      }
      const gen = useGenerationStore()
      gen.useProvider(createMockProvider({ latencyMs, failNext }))
      mutate?.(project, gen)
    },
    template: '<story />',
  })

/** Full-bleed canvas used by page-level stories. */
export const fullscreen = { layout: 'fullscreen' }
