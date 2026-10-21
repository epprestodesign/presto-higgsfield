// NAVIGATION / Global Nav / Group Block — the nav with the group-block (hold)
// cart fly-out: rooms grouped by type with per-night − / + steppers.
import GlobalNav from '../../components/GlobalNav.vue'
import { holdCart } from './GlobalNav.stories.js'

export default {
  title: 'App Shell/Global Nav & Cart/Group Block',
  component: GlobalNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Global Nav — Group Block
The Global Nav with the **Group Block** (hold) cart fly-out: rooms grouped by
type with live − / + steppers, "+ Add another hotel", and a "N Rooms Selected" /
held-until panel + Proceed to Checkout. The badge tracks the live count.
` } },
  },
}

/** Group / team room hold — click the cart icon to open the hold fly-out. */
export const Cart = {
  render: () => ({
    components: { GlobalNav },
    setup: () => ({ cart: holdCart }),
    template: `<global-nav brand="Soccer League" cart-mode="hold" :cart="cart" :open-cart="true" />`,
  }),
}
