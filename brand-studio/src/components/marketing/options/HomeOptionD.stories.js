import { expect, within } from 'storybook/test'
import HomeOptionD from './HomeOptionD.vue'

export default {
  title: 'Brand Studio/Marketing Site/Option D - For Organizers',
  component: HomeOptionD,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Alternate homepage **Option D — Presto for Organizers**: an airy white canvas with soft pastel glows, tilted poster collages flanking a centered hero (rotating event word), a product-facts strip, organizer voices, alternating feature rows (iPhone mockups showing real Presto UI — branded hero, hotel list with room-block progress, guest updates, a sponsor 300×250 — over scene photography), planning cards, organizer example cards (open in the Studio), a free-start CTA and a black wordmark footer. Static.\n\n' +
          '**Imagery generated with Higgsfield** (`scripts/hf-generate-option-d.mjs` → `assets/marketing/option-d`): event posters / org tiles with **Ideogram 4.0**, illustrated organizer portraits with **Recraft V4.1**, and scene backgrounds with **Marketing Studio Flare**; organizer cards reuse the Higgsfield vertical photos. All organizations, people, hotels and sponsors are fictional, and the quotes are illustrative — not real testimonials. Emits `start`, `sample(key)`, `signin`.',
      },
    },
  },
  argTypes: {
    onStart: { action: 'start' },
    onSample: { action: 'sample' },
    onSignin: { action: 'signin' },
  },
}

export const Desktop = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('heading', { level: 1, name: /best way to book rooms for your/i })).toBeInTheDocument()
    await expect(c.getByRole('button', { name: /try it out/i })).toBeInTheDocument()
  },
}

export const Mobile = {
  globals: { viewport: { value: 'mobile' } },
}
