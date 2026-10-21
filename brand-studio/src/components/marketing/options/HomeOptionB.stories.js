import { expect, within } from 'storybook/test'
import HomeOptionB from './HomeOptionB.vue'

export default {
  title: 'Brand Studio/Marketing Site/Option B - Reasons to Travel',
  component: HomeOptionB,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Alternative homepage, **Option B**: a bold, poster-led direction. Black hero with condensed display type and a floating pill nav; a value strip; “One link. Every guest booked.” walkthrough on three iPhones; the centerpiece, a static **receding 3D stack** of industry examples (Higgsfield banners + logos, click to open one; a snap-scroll row on phones); a big-type industry list; a dark sponsorships band; and a closing CTA. Static, with CSS hover only (respects reduced motion). Emits `start`, `sample(key)`, `signin`, the same contract as Option A.',
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
    await expect(c.getByRole('heading', { level: 1 })).toBeInTheDocument()
    await expect(c.getAllByRole('button', { name: /create your booking page/i }).length).toBeGreaterThan(0)
    await expect(c.getAllByRole('button', { name: /open the .* example/i }).length).toBeGreaterThanOrEqual(20)
  },
}

export const Mobile = {
  globals: { viewport: { value: 'mobile' } },
}
