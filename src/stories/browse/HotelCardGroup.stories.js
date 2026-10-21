// BROWSE HOTELS / Hotel Card — Group Block — the group-block result card, with
// its three availability edge cases.
import HotelCardGroup from '../../components/browse/HotelCardGroup.vue'
import { sampleRooms } from './_rooms-sample.js'

export default {
  title: 'Browse Hotels/Components/Results/Hotel Listing Card/Horizontal/Group Block',
  component: HotelCardGroup,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Group Block card
Group-block result card: photo carousel · name + stars + **rooms-availability**
status + distance · **starting price / night** · **Select Rooms** CTA ·
expandable **Availability** panel.

**Availability edge cases**
- **Matches request** — green "N rooms available — matches request".
- **Not enough rooms** — orange "N rooms max — N requested"; has rooms, but
  fewer than the block needs.
- **No availability** — grey; the card dims and the CTA is muted.
` } } },
}

const base = {
  name: 'Embassy Suites Chicago Downtown', city: 'Chicago', stars: 4, distance: '0.3 mi from Main Arena',
  preferred: true, refundable: true, startingPrice: 269,
  rooms: sampleRooms,
  imageCategories: ['exterior', 'lobby', 'rooms'], seed: 2,
}
const render = (args) => ({
  components: { HotelCardGroup },
  setup: () => ({ args }),
  template: `<div style="max-width:1040px"><hotel-card-group v-bind="args" /></div>`,
})

/** Enough rooms available to match the block request. */
export const MatchesRequest = {
  name: 'Matches Request',
  render,
  args: { ...base, availability: 'matches', roomsAvailable: 3 },
}

/** Availability panel expanded — the room-type carousel (2 cards + a peek, dots). */
export const AvailabilityOpen = {
  name: 'Availability Open',
  render,
  args: { ...base, availability: 'matches', roomsAvailable: 8, openAvailability: true },
}

/** Has rooms, but fewer than the block requested. */
export const NotEnoughRooms = {
  name: 'Not Enough Rooms',
  render,
  args: { ...base, name: 'Kimpton Gray Hotel', stars: null, availability: 'partial', roomsMax: 4, roomsRequested: 1, startingPrice: 249, seed: 3 },
}

/** No availability for the selected dates — dimmed card, muted CTA. */
export const NoAvailability = {
  name: 'No Availability',
  render,
  args: { ...base, name: 'Holiday Inn Express Chicago', stars: 2, availability: 'unavailable', startingPrice: 109, seed: 5 },
}
