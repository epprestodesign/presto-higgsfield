// BROWSE HOTELS / Hotel Listing Card / Vertical / Book Reservations — the
// vertical reflow (image top, content, full-width CTA) with the same three
// availability edge cases as the horizontal card.
import HotelCardReserve from '../../components/browse/HotelCardReserve.vue'
import { sampleRooms } from './_rooms-sample.js'

export default {
  title: 'Browse Hotels/Components/Results/Hotel Listing Card/Vertical/Book Reservations',
  component: HotelCardReserve,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
Vertical **Book Reservations** card — same content and states as the horizontal
card, reflowed to a column (image on top, full-width CTA). Set via
\`orientation="vertical"\`.
` } } },
}

const base = {
  orientation: 'vertical',
  name: 'The Minuteman Inn', stars: 2.5, distance: '3.48 mi from Acton Boxborough',
  preferred: true, fromNightly: 100, total: 400,
  rooms: sampleRooms,
  imageCategories: ['exterior', 'lobby', 'rooms'], seed: 1,
}
const render = (args) => ({
  components: { HotelCardReserve },
  setup: () => ({ args }),
  template: `<hotel-card-reserve v-bind="args" />`,
})

export const FullyAvailable = { render, args: { ...base, availability: 'available' } }
export const DoesntMatchFilters = {
  name: "Doesn't Match Filters", render,
  args: { ...base, name: 'Kimpton Gray Hotel', stars: null, availability: 'unmatched', fromNightly: 249, total: 5378.76, seed: 3 },
}
export const NoAvailability = {
  name: 'No Availability', render,
  args: { ...base, name: 'Holiday Inn Express Chicago', stars: 2, availability: 'unavailable', fromNightly: 109, total: 2399.16, seed: 5 },
}
