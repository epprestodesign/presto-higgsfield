// HOTEL DETAILS / Book Reservation / Rooms — the "Select Your Room" section for
// the single-reservation flow. Lays out RoomCardReserve cards in a grid of up to
// three per row (wrapping onto more rows). Sold-out rooms stay in the list
// (disabled), not removed.
import RoomsCarousel from '../../components/details/RoomsCarousel.vue'

const features = [
  { label: 'Entertainment', value: '55" Smart TV, Netflix, Apple TV' },
  { label: 'Food & Drink', value: 'Coffee Maker, Mini Fridge' },
  { label: 'Non-smoking', value: 'Yes' },
]
// Feature sets of different lengths, so the Nights/availability sections stay
// aligned across cards even when the details above them vary in height.
const featuresLong = [...features, { label: 'Need to know', value: 'Complimentary breakfast' }]
const featuresShort = [{ label: 'Food & Drink', value: 'Coffee Maker' }, { label: 'Non-smoking', value: 'Yes' }]
const nights = (a, b, c) => [
  { date: 'Thu, 7/9/2026', roomsLeft: a }, { date: 'Fri, 7/10/2026', roomsLeft: b }, { date: 'Sat, 7/11/2026', roomsLeft: c },
]

// Five room types by default — wraps to a row of 3 + a row of 2.
const reserveRooms = [
  { roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, features, pricePerNight: 179, total: 573.0, roomCount: 1, availability: 'available', nights: nights(5, 6, 5) },
  { roomType: 'Two-Room Suite King', bedConfig: '1 King Bed, Separate Living Room', maxOccupancy: 4, features: featuresLong, pricePerNight: 269, total: 5821.56, roomCount: 6, availability: 'available', nights: nights(2, 4, 5) },
  { roomType: 'Two-Room Suite Double', bedConfig: '2 Double Beds, Separate Living Room', maxOccupancy: 6, features: featuresShort, pricePerNight: 289, total: 6252.36, roomCount: 6, availability: 'limited', nights: nights(1, 2, 1) },
  { roomType: 'Deluxe Queen', bedConfig: '2 Queen Beds', maxOccupancy: 4, features, pricePerNight: 199, total: 637.0, roomCount: 1, availability: 'available', nights: nights(4, 3, 4) },
  { roomType: 'Accessible King', bedConfig: '1 King Bed', maxOccupancy: 2, features: featuresShort, pricePerNight: 189, total: 610.0, roomCount: 1, availability: 'soldout', nights: nights(0, 0, 0) },
]

const wrap = (rooms, extra = {}) => ({
  components: { RoomsCarousel },
  setup: () => ({ args: { rooms, flow: 'reserve', ...extra } }),
  template: `<div style="max-width:1180px"><rooms-carousel v-bind="args" /></div>`,
})

export default {
  title: 'Hotel Details/Components/Book Reservation/Rooms',
  component: RoomsCarousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Rooms — Book Reservation
The "Select Your Room" section for the single-reservation flow: **RoomCardReserve**
cards in a grid of up to three per row. More than three room types wrap onto
additional rows (no carousel). Sold-out rooms stay in the list (disabled), not removed.
` } } },
}

/** Five room types (the default) — available, limited, and sold out; wraps to a
 *  row of 3 + a row of 2. */
export const Default = { render: () => wrap(reserveRooms, { subtitle: 'Prices shown are per room per night for your selected dates.' }) }

/** Fewer than three room types — a single partial row. */
export const FewRooms = { render: () => wrap(reserveRooms.slice(0, 2)) }
