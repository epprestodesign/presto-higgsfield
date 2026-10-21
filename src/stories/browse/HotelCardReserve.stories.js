// BROWSE HOTELS / Hotel Card — Book Reservations — the single-reservation result
// card, with its three availability edge cases.
import HotelCardReserve from '../../components/browse/HotelCardReserve.vue'
import { sampleRooms } from './_rooms-sample.js'

export default {
  title: 'Browse Hotels/Components/Results/Hotel Listing Card/Horizontal/Book Reservations',
  component: HotelCardReserve,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Book Reservations card
Single-reservation result card: photo carousel · name + stars + availability
status + distance · **From nightly / total** price · **Choose Your Room** CTA ·
expandable **Availability** panel (per-night rooms-left).

**Availability edge cases**
- **Fully Available** — green; ready to book.
- **Doesn't match filters** — orange "Adjust your search parameters"; has
  availability but is outside the selected filters.
- **No availability** — grey; the card dims and the CTA is muted.
` } } },
}

const base = {
  name: 'The Minuteman Inn', city: 'Acton', stars: 2.5, distance: '3.48 miles from Acton Boxborough',
  preferred: true, refundable: true, fromNightly: 100, total: 400,
  rooms: sampleRooms,
  imageCategories: ['exterior', 'lobby', 'rooms'], seed: 1,
}
const render = (args) => ({
  components: { HotelCardReserve },
  setup: () => ({ args }),
  template: `<div style="max-width:1040px"><hotel-card-reserve v-bind="args" /></div>`,
})

/** Fully available — green status, active CTA. */
export const FullyAvailable = { render, args: { ...base, availability: 'available' } }

/** Availability panel expanded — the room-type carousel (2 cards + a peek, dots). */
export const AvailabilityOpen = {
  name: 'Availability Open',
  render,
  args: { ...base, availability: 'available', openAvailability: true },
}

/** Has availability but does not match the selected filters. */
export const DoesntMatchFilters = {
  name: "Doesn't Match Filters",
  render,
  args: { ...base, name: 'Kimpton Gray Hotel', stars: null, availability: 'unmatched', fromNightly: 249, total: 5378.76, seed: 3 },
}

/** No availability for the selected dates — dimmed card, muted CTA. */
export const NoAvailability = {
  name: 'No Availability',
  render,
  args: { ...base, name: 'Holiday Inn Express Chicago', stars: 2, availability: 'unavailable', fromNightly: 109, total: 2399.16, seed: 5 },
}
