// BROWSE HOTELS / Hotel Listing Card / Vertical / Group Block — the vertical
// reflow (image top, content, full-width CTA) with the same three availability
// edge cases as the horizontal card.
import HotelCardGroup from '../../components/browse/HotelCardGroup.vue'
import { sampleRooms } from './_rooms-sample.js'

export default {
  title: 'Browse Hotels/Components/Results/Hotel Listing Card/Vertical/Group Block',
  component: HotelCardGroup,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
Vertical **Group Block** card — same content and states as the horizontal card,
reflowed to a column (image on top, full-width CTA). Set via
\`orientation="vertical"\`.
` } } },
}

const base = {
  orientation: 'vertical',
  name: 'Embassy Suites Chicago Downtown', stars: 4, distance: '0.3 mi from Main Arena',
  preferred: true, startingPrice: 269,
  rooms: sampleRooms,
  imageCategories: ['exterior', 'lobby', 'rooms'], seed: 2,
}
const render = (args) => ({
  components: { HotelCardGroup },
  setup: () => ({ args }),
  template: `<hotel-card-group v-bind="args" />`,
})

export const MatchesRequest = {
  name: 'Matches Request', render,
  args: { ...base, availability: 'matches', roomsAvailable: 3 },
}
export const NotEnoughRooms = {
  name: 'Not Enough Rooms', render,
  args: { ...base, name: 'Kimpton Gray Hotel', stars: null, availability: 'partial', roomsMax: 4, roomsRequested: 1, startingPrice: 249, seed: 3 },
}
export const NoAvailability = {
  name: 'No Availability', render,
  args: { ...base, name: 'Holiday Inn Express Chicago', stars: 2, availability: 'unavailable', startingPrice: 109, seed: 5 },
}
