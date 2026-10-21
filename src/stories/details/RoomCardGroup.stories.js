// HOTEL DETAILS / Room Card / Group Block — vertical room card for the group-
// block flow, with availability edge cases.
import RoomCardGroup from '../../components/details/RoomCardGroup.vue'

const features = [
  { label: 'Entertainment', value: '55" Smart TV, Netflix, Apple TV' },
  { label: 'Food & Drink', value: 'Coffee Maker, Mini Fridge' },
  { label: 'Need to know', value: 'Pet-friendly ($50/stay fee)' },
  { label: 'Non-smoking', value: 'Yes' },
]

export default {
  title: 'Hotel Details/Components/Group Block/Room Card',
  component: RoomCardGroup,
  // 'Mobile' is relocated to Hotel Details/Mobile (DetailsMobile.stories.js).
  excludeStories: ['Mobile'],
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Group Block room card
Vertical room card for the **Select Your Room** section (group-block flow): room
type · bed · occupancy · a **Rooms per Night** list with per-night **quantity
steppers** · starting price · an **Add to Cart / Update** CTA.

### Behavior (DES-416)
The steppers show the **full quantity currently in the cart** for this room type,
and persist across submits:

1. **Staging** — stepping a night changes the on-screen selection only; nothing is
   in the cart yet.
2. **Add to Cart** — while nothing's in the cart the CTA reads *Add to Cart*,
   disabled until a night is > 0. Clicking commits the selection.
3. **Numbers stay** — after committing, the steppers keep the chosen quantities.
4. **Update** — once anything's in the cart the CTA becomes *Update*.
5. **Update gating** — right after a commit the numbers match the cart, so *Update*
   is disabled until a quantity changes.
6. **Adjusting** — any change re-enables *Update*; committing pushes the new
   quantities (up = add more, down = reduce).
7. **Zero-out** — zeroing every night and clicking *Update* removes the room type
   from the cart; the CTA reverts to *Add to Cart*.

**Availability edge cases:** available (green) · only-N-left (orange) · sold out
(dimmed card, disabled CTA, zeroed steppers).
` } } },
}

const base = {
  roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, features,
}
const render = (args) => ({ components: { RoomCardGroup }, setup: () => ({ args }), template: `<room-card-group v-bind="args" />` })

/** Available — pick rooms per night with the steppers to activate Add to Cart. */
export const Available = {
  render,
  args: { ...base, availability: 'available', nights: [
    { date: 'Thu, 7/9/2026', roomsLeft: 6, price: 179 }, { date: 'Fri, 7/10/2026', roomsLeft: 8, price: 179 }, { date: 'Sat, 7/11/2026', roomsLeft: 5, price: 179 },
  ] },
}

/** Mobile (390px) — the card fills the phone width (no fixed 360px). On the
 *  Details page the room grid collapses to a single column at ≤600px. */
export const Mobile = {
  name: 'Mobile (390)',
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render,
  args: { ...base, availability: 'available', nights: [
    { date: 'Thu, 7/9/2026', roomsLeft: 6, price: 179 }, { date: 'Fri, 7/10/2026', roomsLeft: 8, price: 179 }, { date: 'Sat, 7/11/2026', roomsLeft: 5, price: 179 },
  ] },
}

/** In cart — rooms already committed, so the CTA reads "Update" and is disabled
 * until you change a stepper. Decreasing reduces the cart; zeroing every night +
 * Update removes the room. */
export const InCart = {
  name: 'In Cart (Update state)',
  render,
  args: { ...base, availability: 'available', inCart: [2, 2, 0], nights: [
    { date: 'Thu, 7/9/2026', roomsLeft: 6, price: 179 }, { date: 'Fri, 7/10/2026', roomsLeft: 8, price: 179 }, { date: 'Sat, 7/11/2026', roomsLeft: 5, price: 179 },
  ] },
}

/** Only a few rooms left — orange urgency, steppers capped at the remaining count. */
export const OnlyAFewLeft = {
  name: 'Only a Few Left',
  render,
  args: { ...base, availability: 'limited', nights: [
    { date: 'Thu, 7/9/2026', roomsLeft: 2, price: 189 }, { date: 'Fri, 7/10/2026', roomsLeft: 1, price: 189 }, { date: 'Sat, 7/11/2026', roomsLeft: 3, price: 189 },
  ] },
}

/** Sold out — dimmed card, disabled CTA, zeroed steppers. */
export const SoldOut = {
  name: 'Sold Out',
  render,
  args: { ...base, availability: 'soldout', nights: [
    { date: 'Thu, 7/9/2026', roomsLeft: 0, price: 179 }, { date: 'Fri, 7/10/2026', roomsLeft: 0, price: 179 }, { date: 'Sat, 7/11/2026', roomsLeft: 0, price: 179 },
  ] },
}
