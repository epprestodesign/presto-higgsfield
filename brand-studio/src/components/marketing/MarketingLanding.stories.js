import { expect, within } from 'storybook/test'
import MarketingLanding from './MarketingLanding.vue'

export default {
  title: 'Brand Studio/Marketing Site/Option A - Landing Page',
  component: MarketingLanding,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The conversion-oriented Brand Studio marketing site (spec §4A): hero with a live branded Presto preview, event-type showcase, how it works, a working customization demo, sponsorship placements + estimator, desktop/mobile showcase, lead capture and FAQ. Emits `start`, `sample(key)`, `lead(payload)`, `signin`.',
      },
    },
  },
  argTypes: {
    onStart: { action: 'start' },
    onSample: { action: 'sample' },
    onLead: { action: 'lead' },
    onSignin: { action: 'signin' },
  },
}

export const Desktop = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('heading', { level: 1, name: /booking page, branded in seconds/i })).toBeInTheDocument()
    await expect(c.getAllByRole('button', { name: /create your booking page/i }).length).toBeGreaterThan(0)
  },
}

export const Mobile = {
  globals: { viewport: { value: 'mobile' } },
}
