import { expect, within } from 'storybook/test'
import HomeOptionE from './HomeOptionE.vue'

export default {
  title: 'Brand Studio/Marketing Site/Option E - Group Booking',
  component: HomeOptionE,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Alternate homepage **Option E — Group Booking**. Structure follows a group-travel marketplace landing page (airy tile mosaic hero with one action, trust strip, social proof, three steps, big-number grid, industry cards, closing band, FAQ), pitched as Presto’s differentiator: **your brand, your booking page**. The hero action is **paste your website** → “Brand my page” (emits `start({ websiteUrl })`; “or start from scratch” emits `start({})`). Static.\n\n' +
          '**Imagery generated with Higgsfield** (`scripts/hf-generate-option-e.mjs` → `assets/marketing/option-e`): 11 bright, sunlit lifestyle tiles of fictional groups at hotels with **Marketing Studio Flare** (faces soft, no text or logos). Example result cards, industry photos and organizer logos reuse the Higgsfield vertical examples.\n\n' +
          '**Placeholders:** the rating pill, “12,000 booking pages branded” and the stat grid are illustrative placeholder figures (badged on the page) to be replaced with real EventPipe numbers; the organizer quotes are illustrative, attributed to fictional example organizers; no real partner logos are used. Emits `start`, `sample(key)`, `signin`.',
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
    await expect(c.getByRole('heading', { level: 1, name: /hotel booking page.*in your brand/i })).toBeInTheDocument()
    await expect(c.getByRole('textbox', { name: /your event website/i })).toBeInTheDocument()
    await expect(c.getAllByRole('button', { name: /brand my page/i }).length).toBeGreaterThan(0)
  },
}

export const Mobile = {
  globals: { viewport: { value: 'mobile' } },
}
