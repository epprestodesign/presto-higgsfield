// NAVIGATION / Global Nav — the app's white top bar (logo + Manage Booking +
// cart icon) whose cart opens a right-side fly-out order summary, Uber Eats
// style. The fly-out has two data modes: a group/team room hold and a single
// hotel reservation. Accents use the DS primary (navy); the held timer
// counts down live and the cart badge tracks the live selection.
import GlobalNav from '../../components/GlobalNav.vue'

// "Hold Rooms for Group or Team" cart — collapsible hotels → rooms → day steppers.
export const holdCart = {
  heldSeconds: 372, // 06:12
  taxRate: 0.12,
  feePerNight: 30, // property fee per room-night
  hotels: [
    {
      name: 'Embassy Suites Chicago Downtown',
      imageCategories: ['suites', 'rooms'],
      seed: 0,
      rooms: [
        { type: 'Two-Room Suite King', summary: '1 King Bed · Sleeps 4', price: 269, nights: [
          { date: 'Tue, Jun 23', qty: 4, roomsLeft: 6 },
          { date: 'Wed, Jun 24', qty: 1, roomsLeft: 5 },
        ] },
        { type: 'Two-Room Suite Double', summary: '2 Queen Beds · Sleeps 4', price: 289, nights: [
          { date: 'Tue, Jun 23', qty: 1, roomsLeft: 5 },
          { date: 'Wed, Jun 24', qty: 1, roomsLeft: 4 },
        ] },
      ],
    },
    {
      name: 'The Concord Hotel',
      imageCategories: ['lobby', 'rooms'],
      seed: 2,
      rooms: [
        { type: 'King Studio', summary: '1 King Bed · Sleeps 2', price: 165, nights: [
          { date: 'Tue, Jun 23', qty: 1, roomsLeft: 6 },
        ] },
        { type: 'Double Queen', summary: '2 Queen Beds · Sleeps 4', price: 185, nights: [
          { date: 'Tue, Jun 23', qty: 1, roomsLeft: 3 },
        ] },
      ],
    },
  ],
}

// "Hotel Reservation" cart — held countdown, rich reservation summary.
export const reserveCart = {
  hotel: { name: 'The Concord Hotel', address: '750 Tremont St, Boston, MA 02118' },
  heldSeconds: 895, // 14:55
  imageCategories: ['suites', 'rooms', 'lobby', 'pool', 'dining'],
  seed: 1,
  checkIn: { date: '06/23/2026', time: '4:00pm' },
  checkOut: { date: '06/24/2026', time: '11:00am' },
  nights: 1,
  highlights: [
    { icon: 'kitchen', label: 'Kitchen' },
    { icon: 'ac_unit', label: 'Air conditioning' },
    { icon: 'microwave', label: 'Microwave' },
  ],
  roomType: 'Aparthotel',
  bedConfig: '1 King Bed and 1 Queen Sofa Bed',
  sleeps: 2,
  amenities: [{ icon: 'wifi', label: 'Free WiFi' }],
  priceDetails: {
    nights: 1,
    rooms: 1,
    rate: 164.78,
    subtotal: 164.78,
    taxes: 47.53,
    propertyFee: 110.0,
    total: 322.31,
  },
  roomsLeft: 1,
}

// "Multiple Room Reservations" cart — several booked hotels → rooms → per-night
// rows (date + nightly rate). Same hierarchy as hold, but each night is a fixed
// booking with no quantity selector.
export const reservationsCart = {
  heldSeconds: 895,
  taxRate: 0.12,
  feePerNight: 0,
  hotels: [
    {
      name: 'Hilton Orlando Lake Buena Vista',
      imageCategories: ['suites', 'rooms'], seed: 0,
      rooms: [
        { type: 'King Bedroom', summary: '1 King Bed · Sleeps 2', price: 301, nights: [
          { date: 'Tue, Jun 23', price: 301 },
          { date: 'Wed, Jun 24', price: 301 },
          { date: 'Thu, Jun 25', price: 319 },
        ] },
        { type: 'Double Queen Bedroom', summary: '2 Queen Beds · Sleeps 4', price: 363, nights: [
          { date: 'Tue, Jun 23', price: 363 },
          { date: 'Wed, Jun 24', price: 363 },
        ] },
      ],
    },
    {
      name: 'Omni Orlando Resort',
      imageCategories: ['lobby', 'rooms'], seed: 2,
      rooms: [
        { type: 'Studio Suite', summary: '1 King Bed + Sofa · Sleeps 3', price: 401, nights: [
          { date: 'Tue, Jun 23', price: 401 },
          { date: 'Wed, Jun 24', price: 401 },
          { date: 'Thu, Jun 25', price: 429 },
          { date: 'Fri, Jun 26', price: 459 },
        ] },
      ],
    },
    {
      name: 'Marriott Downtown',
      imageCategories: ['exterior', 'suites'], seed: 4,
      rooms: [
        { type: 'King Room', summary: '1 King Bed · Sleeps 2', price: 289, nights: [
          { date: 'Fri, Jun 26', price: 289 },
          { date: 'Sat, Jun 27', price: 309 },
        ] },
      ],
    },
  ],
}

export default {
  title: 'App Shell/Global Nav & Cart/Book Reservation',
  component: GlobalNav,
  // holdCart / reserveCart / reservationsCart are shared cart DATA (also imported
  // by the Group Block story), not stories.
  // 'Mobile' is relocated to the App Shell/Mobile folder (AppShellMobile.stories.js).
  excludeStories: ['holdCart', 'reserveCart', 'reservationsCart', 'Mobile'],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Overview
The **Global Nav** is the app's persistent white top bar — brand logo, a
**Manage Booking** pill, and a **cart icon** with a live count badge (DS danger
red). Brand text and icons use the DS primary (navy). Clicking
the cart opens the **Cart Fly-out** order summary (Uber Eats-style slide-over).

## Cart modes
- **\`hold\`** — "Hold Rooms for Group or Team": rooms grouped by type with live
  − / + steppers, Remove, "+ Add another hotel", and a "N Rooms Selected" /
  held-until panel + Proceed to Checkout. The badge tracks the live count.
- **\`reserve\`** — "Hotel Reservation": held countdown, photo carousel, dates,
  nightly breakdown, Total, Due Today / Balance Due, Edit / Start Over.
- **\`reservations\`** — "Multiple Room Reservations": several booked hotels →
  rooms → per-night rows (date + nightly rate), no quantity selector.

Built on DS tokens; primary actions use the brand Navy 900 (#01113E).
` } },
  },
}

/** Group / team room hold cart — shown open. */
export const HoldCart = {
  name: 'Hold Cart',
  render: () => ({
    components: { GlobalNav },
    setup: () => ({ cart: holdCart }),
    template: `<global-nav brand="Soccer League" cart-mode="hold" :cart="cart" :open-cart="true" />`,
  }),
}

/** Single hotel reservation cart — shown open. Kept as a component reference:
 *  the Book Reservation flow pages no longer surface a cart button, so this demo
 *  forces it on to document the cart fly-out itself. */
export const ReserveCart = {
  name: 'Reserve Cart',
  render: () => ({
    components: { GlobalNav },
    setup: () => ({ cart: reserveCart }),
    template: `<global-nav brand="Soccer League" cart-mode="reserve" :cart="cart" :show-cart="true" :open-cart="true" />`,
  }),
}

/** Multiple room reservations cart — shown open (forced on for the demo; the
 *  Multiple Reservations flow itself no longer shows a cart button). */
export const ReservationsCart = {
  name: 'Reservations Cart',
  render: () => ({
    components: { GlobalNav },
    setup: () => ({ cart: reservationsCart }),
    template: `<global-nav brand="Soccer League" cart-mode="reservations" :cart="cart" :show-cart="true" :open-cart="true" />`,
  }),
}

/** Mobile (390px) — Contact Us + Manage Booking collapse into the hamburger
 *  menu; only the brand and cart icon stay in the bar. Tap the ☰ to review the
 *  collapsed menu. */
export const Mobile = {
  name: 'Mobile (390)',
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => ({
    components: { GlobalNav },
    setup: () => ({ cart: holdCart }),
    template: `<global-nav brand="Soccer League" cart-mode="hold" :cart="cart" />`,
  }),
}
