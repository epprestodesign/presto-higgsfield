import { expect, within } from 'storybook/test'
import HomeOptionC from './HomeOptionC.vue'

export default {
  title: 'Brand Studio/Marketing Site/Option C - Templates',
  component: HomeOptionC,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Alternate homepage, **Option C · Templates**: a soft, pastel template-gallery page. Floating pill nav; hero with two phones showing real branded booking pages; a highlights band; a 3×3 grid of **booking page templates** (each poster is a live Presto banner rendered from the industry examples, over a blurred copy of its Higgsfield photo); browse-by-industry circles; three steps; a comparison with a generic hotel link and a spreadsheet; a tilted photo collage; FAQ and closing CTA. Static. Emits `start`, `sample(key)`, `signin`.',
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
    await expect(c.getByRole('heading', { level: 1, name: /branded hotel booking pages/i })).toBeInTheDocument()
    await expect(c.getAllByRole('button', { name: /create free booking page/i }).length).toBeGreaterThan(0)
    await expect(c.getAllByRole('button', { name: /theme$/i })).toHaveLength(9)
  },
}

export const Mobile = {
  globals: { viewport: { value: 'mobile' } },
}
