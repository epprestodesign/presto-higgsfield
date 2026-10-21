// HOTEL DETAILS / Group Block / Rooms — the "Select Your Room" section for the
// group-block flow. Lays out RoomCardGroup cards (per-night steppers) in a grid
// of up to three per row (wrapping). Sold-out rooms stay in the list (disabled).
import RoomsCarousel from '../../components/details/RoomsCarousel.vue'

const features = [
  { label: 'Entertainment', value: '55" Smart TV, Netflix, Apple TV' },
  { label: 'Food & Drink', value: 'Coffee Maker, Mini Fridge' },
  { label: 'Non-smoking', value: 'Yes' },
]
// Varying feature lengths, so the Rooms-per-Night sections stay aligned.
const featuresLong = [...features, { label: 'Need to know', value: 'Complimentary breakfast' }]
const featuresShort = [{ label: 'Food & Drink', value: 'Coffee Maker' }, { label: 'Non-smoking', value: 'Yes' }]
const gnights = (a, b, c, price) => [
  { date: 'Thu, 7/9/2026', roomsLeft: a, price }, { date: 'Fri, 7/10/2026', roomsLeft: b, price }, { date: 'Sat, 7/11/2026', roomsLeft: c, price },
]

// Five room types by default — wraps to a row of 3 + a row of 2.
const groupRooms = [
  { roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, features, availability: 'available', nights: gnights(6, 8, 5, 179) },
  { roomType: 'Two-Room Suite King', bedConfig: '1 King Bed, Separate Living Room', maxOccupancy: 4, features: featuresLong, availability: 'available', nights: gnights(4, 5, 6, 269) },
  { roomType: 'Double Queen', bedConfig: '2 Queen Beds', maxOccupancy: 4, features: featuresShort, availability: 'limited', nights: gnights(2, 1, 3, 229) },
  { roomType: 'Deluxe King', bedConfig: '1 King Bed', maxOccupancy: 3, features, availability: 'available', nights: gnights(5, 4, 5, 209) },
  { roomType: 'Accessible Queen', bedConfig: '1 Queen Bed', maxOccupancy: 2, features: featuresShort, availability: 'soldout', nights: gnights(0, 0, 0, 199) },
]

const wrap = (rooms, extra = {}) => ({
  components: { RoomsCarousel },
  setup: () => ({ args: { rooms, flow: 'group', ...extra } }),
  template: `<div style="max-width:1180px"><rooms-carousel v-bind="args" /></div>`,
})

export default {
  title: 'Hotel Details/Components/Group Block/Rooms',
  component: RoomsCarousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Rooms — Group Block
The "Select Your Room" section for the group-block flow: **RoomCardGroup** cards
(with per-night quantity steppers) in a grid of up to three per row (wrapping onto
additional rows). Sold-out rooms stay in the list (disabled), not removed.
` } } },
}

/** Five room types (the default) — available, limited, and sold out; wraps to a
 *  row of 3 + a row of 2. */
export const Default = {
  render: () => wrap(groupRooms, { title: 'Hold Rooms for Your Group', subtitle: 'Choose how many rooms to hold each night.' }),
}

/** Fewer than three room types — a single partial row. */
export const FewRooms = {
  render: () => wrap(groupRooms.slice(0, 2), { title: 'Hold Rooms for Your Group' }),
}
