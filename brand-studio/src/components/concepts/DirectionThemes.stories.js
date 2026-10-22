import { ref } from 'vue'
import { expect, within } from 'storybook/test'
import DirectionPicker from './DirectionPicker.vue'
import { DIRECTION_THEMES, DEFAULT_DIRECTION_THEME } from '../../assets/directions/index.js'
import { CREATIVE_DIRECTIONS } from '../../models/brandKit.js'

// Review board for the creative-direction card art: three Higgsfield passes
// (scripts/hf-generate-directions.mjs). Approve one → set DEFAULT_DIRECTION_THEME.
const NOTES = {
  a: 'Recraft V4.1 · smooth mesh gradients — cleanest, most "product UI"; reads as color, not place.',
  b: 'Marketing Studio Flare · photographic hotel + event scenes — ties directly to the Higgsfield banners the concepts actually produce. Proposed.',
  c: 'Recraft V4.1 · sculpted paper, glass ribbons, travertine + brass — most distinctive, but furthest from real event imagery.',
}

export default {
  title: 'Brand Studio/Creative Concepts/Direction Themes',
  component: DirectionPicker,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three Higgsfield passes for the **Creative directions** card art on the Concepts step (replacing the flat CSS swatches, including the yellow stripe). Each pass is shown in the real picker plus a wide strip of every image. The proposed pass is the current default (`DEFAULT_DIRECTION_THEME` in `assets/directions/index.js`).',
      },
    },
  },
}

const passBlock = (id) => ({
  components: { DirectionPicker },
  setup() {
    const value = ref(CREATIVE_DIRECTIONS.map((d) => d.id))
    return { value, theme: DIRECTION_THEMES[id], note: NOTES[id], proposed: id === DEFAULT_DIRECTION_THEME, directions: CREATIVE_DIRECTIONS }
  },
  template: `<section style="padding:24px;background:var(--bs-canvas);display:grid;gap:14px;max-width:1180px">
    <header style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <h2 class="bs-title" style="margin:0">Pass {{ theme.id.toUpperCase() }} · {{ theme.name }}</h2>
      <span v-if="proposed" class="bs-pill bs-pill--ai">Proposed</span>
    </header>
    <p class="bs-caption" style="margin:0;max-width:80ch">{{ note }}</p>
    <direction-picker v-model="value" suggested="signature" :theme="theme.id" />
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
      <figure v-for="d in directions" :key="d.id" style="margin:0;display:grid;gap:4px">
        <img :src="theme.art[d.id]" :alt="theme.name + ' — ' + d.name" style="width:100%;aspect-ratio:2/1;object-fit:cover;border-radius:8px;display:block" />
        <figcaption class="bs-caption">{{ d.name }}</figcaption>
      </figure>
    </div>
  </section>`,
})

export const PassA = { name: 'Pass A · Soft gradients', render: () => passBlock('a') }
export const PassB = {
  name: 'Pass B · Light & place (proposed)',
  render: () => passBlock('b'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(3)
    await expect(canvas.getByText('Proposed')).toBeInTheDocument()
  },
}
export const PassC = { name: 'Pass C · Sculpted materials', render: () => passBlock('c') }

export const SideBySide = {
  name: 'All three passes',
  render: () => ({
    components: { A: passBlock('a'), B: passBlock('b'), C: passBlock('c') },
    template: '<div><B /><A /><C /></div>',
  }),
}
