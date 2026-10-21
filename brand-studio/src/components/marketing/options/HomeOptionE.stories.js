import { expect, within, userEvent } from 'storybook/test'
import HomeOptionE from './HomeOptionE.vue'
import OptionEFooter from './OptionEFooter.vue'
import OptionESteps from './OptionESteps.vue'

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
          '**Three steps** is an accordion: pick a step (click or ↑/↓) and the media card swaps to that step’s static mock — a blurred Higgsfield scene (Flare: `step-1` atrium, `step-2` stadium concourse, `step-3` hotel front desk) with crisp UI and a pointer on top.\n\n' +
          '**Footer concepts** (`footer` prop): `classic` (wordmark), `brands` (wordmark filled with customer banners), `cascade` (same page, five brands), `skyline` (Higgsfield Flare dusk skyline with live-feeling chips), `spectrum` (wordmark in each industry’s brand color over Higgsfield Recraft silk textures). Compare them in **Footer concepts**.\n\n' +
          '**Placeholders:** the rating pill, “12,000 booking pages branded” and the stat grid are illustrative placeholder figures (badged on the page) to be replaced with real EventPipe numbers; the organizer quotes are illustrative, attributed to fictional example organizers; no real partner logos are used. Emits `start`, `sample(key)`, `signin`.',
      },
    },
  },
  argTypes: {
    footer: { control: 'inline-radio', options: ['classic', 'brands', 'cascade', 'skyline', 'spectrum'] },
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

export const Steps = {
  name: 'Steps (click to switch)',
  render: () => ({ components: { OptionESteps }, template: '<div class="oe" style="background:#fff;padding-top:24px"><option-e-steps /></div>' }),
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)
    const tabs = c.getAllByRole('button', { expanded: undefined }).filter((b) => b.hasAttribute('aria-expanded'))
    await expect(tabs).toHaveLength(3)
    await expect(tabs[0]).toHaveAttribute('aria-expanded', 'true')
    await step('Click step 2', async () => {
      await userEvent.click(tabs[1])
      await expect(tabs[1]).toHaveAttribute('aria-expanded', 'true')
      await expect(tabs[0]).toHaveAttribute('aria-expanded', 'false')
      await expect(c.getByRole('img', { name: /we brand every page/i })).toBeInTheDocument()
    })
    await step('Arrow down to step 3', async () => {
      tabs[1].focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(tabs[2]).toHaveAttribute('aria-expanded', 'true')
      await expect(tabs[2]).toHaveFocus()
    })
  },
}

const VARIANTS = [
  { id: 'classic', label: 'Classic — link columns + wordmark (current)' },
  { id: 'brands', label: 'A · Wordmark of brands — the word is made of customer banners' },
  { id: 'cascade', label: 'B · Same page, five brands — one booking page re-skinned five ways' },
  { id: 'skyline', label: 'C · Night skyline — every hotel in town, one link' },
  { id: 'spectrum', label: 'D · Brand-color spectrum — 20+ industries, 20+ palettes' },
]

export const FooterConcepts = {
  name: 'Footer concepts',
  render: () => ({
    components: { OptionEFooter },
    setup: () => ({ VARIANTS }),
    template: `<div class="oe" style="background:#F4F5F8">
      <section v-for="v in VARIANTS" :key="v.id" style="padding:28px 0 0">
        <p style="margin:0 24px 12px;font:700 13px Inter, sans-serif;color:#0B1220">{{ v.label }}</p>
        <option-e-footer :variant="v.id" />
      </section>
    </div>`,
  }),
}

export const FooterBrands = { name: 'Page · footer A (brands)', args: { footer: 'brands' } }
export const FooterCascade = { name: 'Page · footer B (cascade)', args: { footer: 'cascade' } }
export const FooterSkyline = { name: 'Page · footer C (skyline)', args: { footer: 'skyline' } }
export const FooterSpectrum = { name: 'Page · footer D (spectrum)', args: { footer: 'spectrum' } }
