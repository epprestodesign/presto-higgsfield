// APP SHELL / Cart Flyout — the right-side slide-over cart. Shows the empty state
// (no rooms held yet) and a populated group-block hold.
import { ref } from 'vue'
import CartFlyout from '../../components/CartFlyout.vue'

export default {
  title: 'App Shell/Cart Flyout',
  component: CartFlyout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
The **Cart Flyout** is the right-side slide-over that wraps the shared \`CartReview\`
body. When the cart has no rooms it shows an **empty state** (illustration +
"Add rooms to start a cart" + a **Browse hotels** button, which emits \`browse\`);
otherwise it shows the held rooms, the "Time left to book" countdown, and the
"Go to checkout" CTA.
` } } },
}

const holdCart = {
  heldSeconds: 372,
  hotels: [
    { name: 'Embassy Suites Chicago Downtown', imageCategories: ['suites', 'rooms'], seed: 0, rooms: [
      { type: 'Two-Room Suite King', summary: '1 King Bed · Sleeps 4', nights: [{ date: 'Tue, Jun 23', qty: 4, roomsLeft: 6, price: 269 }, { date: 'Wed, Jun 24', qty: 1, roomsLeft: 5, price: 299 }] },
    ] },
    { name: 'The Concord Hotel', imageCategories: ['lobby', 'rooms'], seed: 2, rooms: [
      { type: 'King Studio', summary: '1 King Bed · Sleeps 2', price: 165, nights: [{ date: 'Tue, Jun 23', qty: 1, roomsLeft: 6 }] },
    ] },
  ],
}

/** Empty cart — the group-block empty state. "Browse hotels" emits `browse`. */
export const Empty = {
  name: 'Empty',
  render: () => ({
    components: { CartFlyout },
    setup: () => ({ open: ref(true), cart: {} }),
    template: `<cart-flyout v-model="open" mode="hold" :cart="cart" @browse="open = false" />`,
  }),
}

/** Populated group-block hold — rooms held, countdown + checkout CTA. */
export const WithRooms = {
  name: 'With Rooms',
  render: () => ({
    components: { CartFlyout },
    setup: () => ({ open: ref(true), cart: holdCart }),
    template: `<cart-flyout v-model="open" mode="hold" :cart="cart" />`,
  }),
}
