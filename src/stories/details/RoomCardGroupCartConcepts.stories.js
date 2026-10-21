// HOTEL DETAILS / Group Block / Room Card — CART-AWARE CONCEPTS (exploration).
// Not wired into the app — these are display concepts for how the group room card
// should reflect inventory already in the cart while still adding more. Review the
// four, then we'll wire the chosen one into the prototype Details screen.
import RoomCardGroupCartConcept from '../../components/details/concepts/RoomCardGroupCartConcept.vue'

const nights = [
  { date: 'Wed, 6/16/2027', roomsLeft: 8, price: 179 },
  { date: 'Thu, 6/17/2027', roomsLeft: 8, price: 179 },
  { date: 'Fri, 6/18/2027', roomsLeft: 6, price: 189 },
]
const base = { roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, nights, initialInCart: [1, 1, 1] }

export default {
  title: 'Hotel Details/Components/Group Block/Room Card Cart Concepts',
  component: RoomCardGroupCartConcept,
  tags: ['autodocs'],
  parameters: { layout: 'centered', docs: { description: { component: `
## Cart-aware Group Block room card — concepts

Exploring how a room card shows inventory **already in the cart** (e.g. \`1, 1, 1\`)
while still letting the organizer **add more**. Agreed behavior across all four:
**"Add N more to cart"** adds the selected rooms then **resets the steppers to 0**;
**deleting removes the entire block** for that room type.

Each card starts with **1 room already in the cart on every night** — try adding
more (steppers → "Add N more") and removing the block. Four display treatments:

- **A · Summary banner** — a strip at the top summarizes what's held; steppers below add more.
- **B · Per-night inline** — a small "N in cart" note under each night.
- **C · Editable steppers** — steppers pre-filled with the cart total; edit in place, 🗑 to drop a night.
- **D · Two panels** — a separate "In your cart" panel above an "Add more" panel.
` } } },
}

const one = (variant) => ({
  components: { RoomCardGroupCartConcept },
  setup: () => ({ base, variant }),
  template: `<room-card-group-cart-concept v-bind="base" :variant="variant" />`,
})

export const A_SummaryBanner = { name: 'A · Summary banner', render: () => one('banner') }
export const B_PerNightInline = { name: 'B · Per-night inline', render: () => one('inline') }
export const C_EditableSteppers = { name: 'C · Editable steppers', render: () => one('editable') }
export const D_TwoPanels = { name: 'D · Two panels', render: () => one('panels') }

/** All four side by side for quick comparison. */
export const AllConcepts = {
  name: 'All Concepts (compare)',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    components: { RoomCardGroupCartConcept },
    setup: () => ({ base, variants: [
      { v: 'banner', label: 'A · Summary banner' },
      { v: 'inline', label: 'B · Per-night inline' },
      { v: 'editable', label: 'C · Editable steppers' },
      { v: 'panels', label: 'D · Two panels' },
    ] }),
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;padding:32px;background:var(--ds-palette-slate-100)">
        <div v-for="c in variants" :key="c.v" style="display:flex;flex-direction:column;gap:12px">
          <div style="font-weight:700;color:var(--ds-color-text)">{{ c.label }}</div>
          <room-card-group-cart-concept v-bind="base" :variant="c.v" />
        </div>
      </div>`,
  }),
}
