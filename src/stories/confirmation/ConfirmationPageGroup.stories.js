// CONFIRMATION / Confirmation Page / Group Block — the post-checkout success
// screen for the group-block flow: one card per hotel with rooms held by night.
import ConfirmationPage from '../../components/confirmation/ConfirmationPage.vue'
import PageFrame from '../../components/PageFrame.vue'
import { holdData } from './ConfirmationPage.stories.js'

export default {
  title: 'Confirmation/Group Block',
  component: ConfirmationPage,
  // 'Mobile' is relocated to Confirmation/Mobile (ConfirmationMobile.stories.js).
  excludeStories: ['Mobile'],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Confirmation Page — Group Block
The post-checkout success screen for the group-block flow: the group block name +
teams, then one card per hotel with rooms held by night. Accents use the DS
primary (Navy).
` } },
  },
}

/** Group / team room block hold — full page (Global Nav + footer). */
export const Page = {
  name: 'Group Block',
  render: () => ({
    components: { PageFrame, ConfirmationPage },
    setup: () => ({ data: holdData }),
    template: `<page-frame cart-mode="hold" :show-cart="false"><confirmation-page mode="hold" :data="data" /></page-frame>`,
  }),
}

/** Mobile (390px) — tighter gutters; the summary header stacks and actions
 *  left-align. */
export const Mobile = {
  name: 'Mobile (390)',
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => ({
    components: { PageFrame, ConfirmationPage },
    setup: () => ({ data: holdData }),
    template: `<page-frame cart-mode="hold" :show-cart="false"><confirmation-page mode="hold" :data="data" /></page-frame>`,
  }),
}
