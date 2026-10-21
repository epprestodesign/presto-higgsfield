// HOTEL DETAILS / Hotel Summary Header — the top block of the detail screen:
// name + star class, address/distance, guest score, popular amenities, mini-map.
import HotelSummaryHeader from '../../components/details/HotelSummaryHeader.vue'
import { popularAmenities, getAmenities } from '../../lib/amenities.js'

const amenities = popularAmenities()

const base = {
  name: 'Hilton Orlando Lake Buena Vista',
  stars: 4,
  address: 'Lake Buena Vista, Orlando, FL',
  distance: '2.4 mi from venue',
  score: 4.5,
  reviews: 1284,
  ratingLabel: 'Excellent',
  amenities,
  lat: 28.5383,
  lng: -81.3792,
}

const wrap = (extra = {}) => ({
  components: { HotelSummaryHeader },
  setup: () => ({ args: { ...base, ...extra } }),
  template: `<div style="max-width:1180px"><hotel-summary-header v-bind="args" /></div>`,
})

export default {
  title: 'Hotel Details/Components/Hotel Summary Header',
  component: HotelSummaryHeader,
  tags: ['autodocs'],
  argTypes: {
    stars: { control: { type: 'range', min: 0, max: 5, step: 1 } },
    score: { control: 'number' },
  },
  parameters: { docs: { description: { component: `
## Overview
The **Hotel Summary Header** is the top block of the hotel detail screen. It
composes existing DS components — **DsRating** for the guest score and
**HotelMap** for the property mini-map — alongside the name + star class,
address/distance, and a "Popular Amenities" row.

> The mini-map needs a Google Maps API key at runtime (paste one into the map's
> key prompt, same as the **Browse Hotels / Hotel Map** story). Without a key it
> shows the key-prompt fallback.
` } } },
}

/** Reference header — 4-star, guest score, six popular amenities, mini-map. */
export const Default = { render: () => wrap() }

/** A brand-new property — no guest score yet. */
export const NoScore = { render: () => wrap({ name: 'The Bellwether Orlando', score: null, reviews: null, ratingLabel: '' }) }

/** Budget property — fewer stars and amenities. */
export const BudgetHotel = {
  render: () => wrap({ name: 'Hampton Inn Orlando Airport', stars: 2, score: 3.8, reviews: 412, ratingLabel: 'Good', amenities: getAmenities(['wifi', 'parking', 'breakfast']) }),
}

/** Without the mini-map (e.g. embedded in a narrow column). */
export const NoMap = { render: () => wrap({ showMap: false }) }
