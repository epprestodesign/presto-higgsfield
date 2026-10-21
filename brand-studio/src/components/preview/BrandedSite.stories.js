import { expect, userEvent, within, waitFor } from 'storybook/test'
import BrandedSite from './BrandedSite.vue'
import { previewProject } from './previewFixtures.js'

export default {
  title: 'Brand Studio/Branded Preview/Full Site',
  component: BrandedSite,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The whole branded booking site as a clickable demo: **landing → browse → details → simulated checkout → sample confirmation**. Contract: `props { project, page }`, `emits navigate(page)`. Checkout/confirmation only open when enabled on the project; otherwise an inline toast explains they are not part of the demo.',
      },
    },
  },
  argTypes: {
    page: { control: 'select', options: ['landing', 'browse', 'details', 'checkout', 'confirmation'] },
    onNavigate: { action: 'navigate' },
  },
}

export const ClickThrough = {
  name: 'Click-through (landing → checkout)',
  args: { project: previewProject('heartland'), page: 'landing' },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)
    const site = () => canvasElement.querySelector('.bsite')

    // Heroes carry no CTA (Presto rule) — the booking search is the way in.
    await step('Hotel search opens Browse', async () => {
      await userEvent.click(await c.findByRole('button', { name: /^search$/i }))
      await waitFor(() => expect(site().dataset.page).toBe('browse'))
    })
    await step('Hotel card CTA opens Details', async () => {
      const cta = await waitFor(() => {
        const el = canvasElement.querySelector('.hc__cta')
        expect(el).toBeTruthy()
        return el
      })
      const name = cta.closest('.hc').querySelector('.hc__name').textContent.trim()
      await userEvent.click(cta)
      await waitFor(() => expect(site().dataset.page).toBe('details'))
      await waitFor(() => expect(c.getAllByText(name).length).toBeGreaterThan(0))
    })
    await step('Reserve Room opens the simulated checkout', async () => {
      const reserve = await waitFor(() => {
        const el = canvasElement.querySelector('.rcr__cta:not([disabled])')
        expect(el).toBeTruthy()
        return el
      })
      await userEvent.click(reserve)
      await waitFor(() => expect(site().dataset.page).toBe('checkout'))
      await expect(c.getByText(/no payment is taken/i)).toBeInTheDocument()
    })
  },
}

export const CheckoutDisabled = {
  name: 'Checkout not enabled → inline notice',
  args: {
    project: previewProject('fintech', { mutate: (p) => { p.pages.checkout.enabled = false } }),
    page: 'details',
  },
  play: async ({ canvasElement }) => {
    const reserve = await waitFor(() => {
      const el = canvasElement.querySelector('.rcr__cta:not([disabled])')
      expect(el).toBeTruthy()
      return el
    })
    await userEvent.click(reserve)
    await waitFor(() => expect(within(canvasElement).getByRole('status')).toHaveTextContent(/isn’t part of this demo/i))
    await expect(canvasElement.querySelector('.bsite').dataset.page).toBe('details')
  },
}

export const Mobile = {
  args: { project: previewProject('lakeshore'), page: 'landing' },
  globals: { viewport: { value: 'mobile' } },
}
