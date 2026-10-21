import BrandedCheckout from './BrandedCheckout.vue'
import BrandedConfirmation from './BrandedConfirmation.vue'
import { previewProject } from './previewFixtures.js'
import { HOTELS } from '../../data/upstream/hotels.js'

export default {
  title: 'Brand Studio/Branded Preview/Checkout & Confirmation',
  component: BrandedCheckout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Simulated** checkout and **sample** confirmation, opt-in per project (`pages.checkout.enabled`). A prominent notice states that no payment is taken; the final “Book Now” is intercepted so it never shows a “reservation confirmed” message — it only advances the demo.',
      },
    },
  },
}

export const Checkout = { args: { project: previewProject('heartland'), hotel: HOTELS[3] } }

export const Confirmation = {
  render: (args) => ({ components: { BrandedConfirmation }, setup: () => ({ args }), template: '<branded-confirmation v-bind="args" />' }),
  args: { project: previewProject('heartland'), hotel: HOTELS[3] },
}

export const WeddingCheckout = { name: 'Checkout · Wedding brand', args: { project: previewProject('wedding'), hotel: HOTELS[12] } }

export const MobileCheckout = {
  name: 'Mobile · Checkout',
  args: { project: previewProject('heartland'), hotel: HOTELS[3] },
  globals: { viewport: { value: 'mobile' } },
}
