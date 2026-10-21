import { expect, userEvent, within, waitFor } from 'storybook/test'
import ConceptCompare from './ConceptCompare.vue'
import { withProject } from '../../stories/_helpers.js'
import { useProjectStore } from '../../stores/project.js'
import { useHeroCopy } from './useHeroCopy.js'

// Store-connected wrapper so picking a winner updates the project selection.
const Connected = {
  components: { ConceptCompare },
  setup() {
    const project = useProjectStore()
    const copy = useHeroCopy()
    return { project, copy }
  },
  template: `<div style="padding:24px;background:var(--bs-canvas);min-height:100vh">
    <concept-compare
      :concepts="project.project.concepts.compareIds.map((id) => project.project.concepts.items.find((c) => c.id === id)).filter(Boolean)"
      :brand-kit="project.brandKit"
      :copy="copy"
      :selected-id="project.project.concepts.selectedId"
      @pick="project.selectConcept($event.id)"
      @remove="project.toggleCompare($event.id)"
    />
  </div>`,
}

const compare = (indexes) => withProject({ concepts: true, mutate: (p) => indexes.forEach((i) => p.toggleCompare(p.project.concepts.items[i].id)) })

export default {
  title: 'Brand Studio/Creative Concepts/Compare',
  component: ConceptCompare,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Side-by-side comparison of 2–3 concepts, each shown as the landing hero and the compact Browse/Details band. Picking a winner selects it for the project (radio semantics). Swipeable on phones.',
      },
    },
  },
  render: () => Connected,
}

export const ThreeWay = {
  name: 'Three concepts',
  decorators: [compare([0, 2, 4])],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [, second] = canvas.getAllByRole('radio', { name: /pick this one/i })
    await userEvent.click(second)
    await waitFor(() => expect(canvas.getByRole('radio', { name: /winner selected/i })).toHaveAttribute('aria-checked', 'true'))
  },
}

export const TwoWay = { name: 'Two concepts', decorators: [compare([3, 5])] }

export const NotEnough = { name: 'Empty (fewer than two)', decorators: [compare([1])] }

export const Mobile = { decorators: [compare([0, 2, 4])], globals: { viewport: { value: 'mobile' } } }
