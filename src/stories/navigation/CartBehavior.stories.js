// APP SHELL / Cart Behavior — DES-413 interaction study. The Browse Hotels
// screen with the group-block cart opening two different ways: as an OVERLAY
// (slides over a scrim) or as a PUSH (shoves the page content to the left,
// Amazon-style). Use the "Cart behavior" toolbar at the top to flip between them
// and open/close the cart, or switch the `behavior` control.
import CartBehavior from '../../components/CartBehavior.vue'

// A representative group-block hold: two hotels, one with a single night, one
// with two nights at different rates.
const holdCart = {
  hotels: [
    { name: 'Courtyard by Marriott Downtown', imageCategories: ['rooms', 'suites'], seed: 1, rooms: [
      { type: 'Urban King', summary: '1 King Bed · Sleeps 2', nights: [{ date: 'Wed, 6/16/2027', qty: 2, roomsLeft: 8, price: 99 }] },
    ] },
    { name: 'The Concord Hotel Convention Center', imageCategories: ['lobby', 'rooms'], seed: 2, rooms: [
      { type: 'Urban King', summary: '1 King Bed · Sleeps 2', nights: [
        { date: 'Thu, 6/17/2027', qty: 1, roomsLeft: 5, price: 364 },
        { date: 'Fri, 6/18/2027', qty: 1, roomsLeft: 5, price: 374 },
      ] },
    ] },
  ],
}

export default {
  title: 'App Shell/Cart Behavior',
  component: CartBehavior,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
**Cart Behavior (DES-413)** — a side-by-side study of how the group-block cart
should present on the **Browse Hotels** screen. Two candidate behaviors:

- **Overlay** — the cart slides in over a dimming scrim (today's flyout). The page
  underneath does not move and is inert while the cart is open.
- **Push** — the cart slides in and pushes the page content to the left, like a
  persistent Amazon-style side panel. No scrim; the page keeps its place and stays
  interactive.

The "Cart behavior" strip at the top is a demo control (not part of the real UI):
flip **Overlay / Push** and **Open / Close** to feel each one. You can also drive it
from the \`behavior\` control.
` } } },
  argTypes: {
    behavior: { control: 'inline-radio', options: ['overlay', 'push'], description: 'Overlay (scrim) vs Push (shifts page left).' },
    open: { control: 'boolean', description: 'Start with the cart open.' },
  },
  args: { behavior: 'push', open: true, cart: holdCart },
  render: (args) => ({
    components: { CartBehavior },
    setup: () => ({ args }),
    template: `<cart-behavior v-bind="args" />`,
  }),
}

/** Push — the cart shoves the Browse Hotels content to the left (recommended). */
export const Push = { name: 'Push (shifts page left)', args: { behavior: 'push' } }

/** Overlay — the cart floats over a scrim; the page underneath stays put. */
export const Overlay = { name: 'Overlay (scrim)', args: { behavior: 'overlay' } }
