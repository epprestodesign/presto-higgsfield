import { expect, userEvent, within, waitFor } from 'storybook/test'
import ConceptStudio from './ConceptStudio.vue'
import { withProject } from '../../stories/_helpers.js'
import { useProjectStore } from '../../stores/project.js'
import { buildConcept } from '../../providers/ai/conceptFactory.js'

export default {
  title: 'Brand Studio/Creative Concepts/Concept Gallery',
  component: ConceptStudio,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The **Creative concepts** step (spec 4D). Pick directions, generate six concepts through the AI provider abstraction (demo generator — no API key, no cost), then favorite, compare, regenerate, branch variations and preview on desktop/mobile before selecting one. Emits `next` once a concept is selected, plus `back` and `signup`. Artwork is background only — logos, headlines and buttons stay editable DOM.',
      },
    },
  },
  argTypes: { onNext: { action: 'next' }, onBack: { action: 'back' }, onSignup: { action: 'signup' } },
  render: (args) => ({ components: { ConceptStudio }, setup: () => ({ args }), template: '<concept-studio v-bind="args" />' }),
}

export const Empty = {
  name: 'Empty (before first generation)',
  decorators: [withProject({ latencyMs: 600 })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('Generate six concepts', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /generate 6 concepts/i }))
      await waitFor(() => expect(canvas.getAllByRole('radio', { name: /use this concept/i })).toHaveLength(6), { timeout: 5000 })
    })
    await step('Select the first concept', async () => {
      const [first] = canvas.getAllByRole('radio', { name: /use this concept/i })
      await userEvent.click(first)
      await waitFor(() => expect(canvas.getAllByRole('radio', { name: /selected/i })[0]).toHaveAttribute('aria-checked', 'true'))
      expect(useProjectStore().project.concepts.selectedId).toBeTruthy()
      await expect(canvas.getByRole('button', { name: /customize my page/i })).toBeEnabled()
    })
  },
}

export const Generating = {
  name: 'Generating (progress + skeletons)',
  decorators: [withProject({ latencyMs: 30000 })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /generate 6 concepts/i }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/reading your brand kit/i), { timeout: 8000 })
  },
}

export const Results = {
  decorators: [withProject({ concepts: true })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [fav] = canvas.getAllByRole('button', { name: /add .* to favorites/i })
    await expect(fav).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(fav)
    await waitFor(() => expect(canvas.getAllByRole('button', { name: /remove .* from favorites/i })[0]).toHaveAttribute('aria-pressed', 'true'))
  },
}

export const SelectedWithFavorites = {
  name: 'Results with selection + favorites',
  decorators: [
    withProject({
      select: 2,
      mutate: (p) => {
        const items = p.project.concepts.items
        p.toggleFavorite(items[2].id)
        p.toggleFavorite(items[4].id)
        p.toggleCompare(items[2].id)
        p.toggleCompare(items[4].id)
      },
    }),
  ],
}

export const WithVariations = {
  name: 'Results with variations',
  decorators: [
    withProject({
      select: 2,
      mutate: (p) => {
        // Pre-build three variations of the Energy band concept, as the generator would.
        const parent = p.project.concepts.items[2]
        p.addConcepts([1, 2, 3].map((variant) => buildConcept({ direction: parent.direction, templateIndex: parent.templateIndex, brandKit: p.brandKit, event: p.event, variant, parent })))
      },
    }),
  ],
}

export const GenerationError = {
  name: 'Error (with retry)',
  decorators: [withProject({ latencyMs: 400, failNext: true })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /generate 6 concepts/i }))
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent(/didn’t finish/i), { timeout: 4000 })
    await expect(canvas.getByRole('button', { name: /try again/i })).toBeVisible()
  },
}

export const PreviewDesktop = {
  name: 'Preview dialog · desktop',
  decorators: [withProject({ select: 2 })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getAllByRole('button', { name: /preview .* on desktop and mobile/i })[2])
    const body = within(canvasElement.ownerDocument.body)
    await waitFor(() => expect(body.getByRole('button', { name: /close preview/i })).toBeVisible())
  },
}

export const PreviewMobile = {
  name: 'Preview dialog · mobile',
  decorators: [withProject({ select: 3 })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getAllByRole('button', { name: /preview .* on desktop and mobile/i })[3])
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByRole('button', { name: /^mobile$/i }))
  },
}

export const UsageLimitReached = {
  name: 'Usage limit reached',
  decorators: [withProject({ concepts: true, mutate: (_p, gen) => { gen.used = gen.limit } })],
}

export const OtherBrand = {
  name: 'Results · wedding brand kit',
  decorators: [withProject({ sample: 'wedding', select: 4 })],
}

export const Mobile = {
  decorators: [withProject({ select: 0 })],
  globals: { viewport: { value: 'mobile' } },
}
