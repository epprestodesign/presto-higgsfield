// CONFIRMATION / Confirmation Page — the post-checkout success screen.
// Structured to match the production confirmation: a success banner, a Summary
// section (contact + booking ID + Book-in-Block / Copy-Link / Print, a meta grid,
// and per-hotel rooms held by night), and a per-hotel Policies section.
// Two variants live here (single Reservation + Multiple Reservations); the Group
// Block variant lives in ConfirmationPageGroup.stories.js and reuses holdData.
import ConfirmationPage from '../../components/confirmation/ConfirmationPage.vue'
import PageFrame from '../../components/PageFrame.vue'
import { THREE_FEES, THREE_FEES_TOTAL } from '../secondaryFeesFixture'

const AMENITIES_NOTICE = 'Kindly note that amenities like laundry, pools, parking rates, breakfast and restaurants are not guaranteed. For the latest updates on available amenities, please visit the hotel website.'

// Single hotel stay.
const reserveData = {
  contactName: 'Alex Smith',
  confirmationId: '72055771948934',
  reservedOn: 'Mon, 06/14/2027 02:14 PM EST',
  guest: 'Alex Smith — (555) 018-2245',
  email: 'youraccount@eventpipe.com',
  hotels: [
    {
      name: 'Days Inn by Wyndham Carson City',
      stars: 3, address: '4100 N Carson St, Carson City, NV, US, 89706', seed: 1,
      checkIn: 'Mon, 07/01/2027 03:00 PM', checkOut: 'Wed, 07/03/2027 11:00 AM',
      rooms: [
        { type: 'Room, 1 Queen Bed, Non Smoking', note: '1 Queen Bed · Sleeps 2 · Breakfast included', nights: [
          { date: 'Mon, 07/01/2027', qty: 1, price: 128 },
          { date: 'Tue, 07/02/2027', qty: 1, price: 128 },
        ] },
      ],
      // DES-455: totals — taxes, the three secondary custom fees, then what was
      // charged at booking vs. owed at the property. Fees are collected now, so
      // they make up Amount Paid; the room cost stays as Balance due.
      totals: {
        taxes: 0,
        rooms: 1,
        secondaryFees: THREE_FEES,
        roomCost: 256,
        amountPaid: THREE_FEES_TOTAL,
        balanceDue: 256,
      },
    },
  ],
  policies: [
    { hotel: 'Days Inn by Wyndham Carson City', items: [
      { title: 'Cancellation Policy', body: 'A cancellation fee will not be charged if you cancel before Thu, 06/24/2027 at 4:00 PM. If you cancel after that, you agree to be charged a fee of $128.00.' },
      { title: 'Deposit', body: 'The full stay is charged to the card on file at booking. No additional deposit is collected at check-in.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
      { title: 'Refund Policy', body: 'Eligible refunds are returned to the original payment method within 5–7 business days of cancellation.' },
    ] },
  ],
}

// Group/team room block — one block per hotel, rooms held by night.
export const holdData = {
  contactName: 'Coach Lee',
  groupId: 'G-00584977',
  reservedOn: 'Thu, 06/11/2026 03:31 PM EST',
  releaseDate: 'Thu, 06/18/2026 11:59 PM PT',
  organizationName: 'Eagles SC',
  groupContact: 'Coach Lee — (518) 796-3050',
  email: 'youraccount@eventpipe.com',
  hotels: [
    {
      name: 'Embassy Suites Chicago Downtown',
      stars: 4, address: '511 N Columbus Dr, Chicago, IL, US, 60611', seed: 2,
      checkIn: 'Wed, 06/16/2027 03:00 PM', checkOut: 'Sat, 06/19/2027 11:00 AM',
      rooms: [
        { type: 'Two-Room Suite King', note: '1 King Bed · Sleeps 4', nights: [
          { date: 'Wed, 06/16/2027', qty: 4, price: 269 },
          { date: 'Thu, 06/17/2027', qty: 4, price: 269 },
          { date: 'Fri, 06/18/2027', qty: 1, price: 269 },
        ] },
        { type: 'Two-Room Suite Double', note: '2 Queen Beds · Sleeps 4', nights: [
          { date: 'Wed, 06/16/2027', qty: 1, price: 289 },
        ] },
      ],
    },
    {
      name: 'The Concord Hotel',
      stars: 3.5, address: '540 N State St, Chicago, IL, US, 60654', seed: 0,
      checkIn: 'Wed, 06/16/2027 04:00 PM', checkOut: 'Sat, 06/19/2027 11:00 AM',
      rooms: [
        { type: 'King Studio', note: '1 King Bed · Sleeps 2', nights: [
          { date: 'Wed, 06/16/2027', qty: 2, price: 165 },
          { date: 'Thu, 06/17/2027', qty: 2, price: 165 },
        ] },
      ],
    },
  ],
  policies: [
    { hotel: 'Embassy Suites Chicago Downtown', items: [
      { title: 'Group Cancellation Policy', body: 'Held rooms may be released without charge until the group block release date shown above. After that date, unreleased rooms in the block may be subject to the property’s group cancellation terms.' },
      { title: 'Deposit', body: 'A credit card is required to hold the block. Individual attendees provide payment at booking; no deposit is charged to the group organizer.' },
      { title: 'Additional Policies & Amenities', body: 'Complimentary breakfast is included with every held room. Oversized-vehicle parking is available on request — ask the front desk for the permit.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
      { title: 'Refund Policy', body: 'Refunds for individually booked rooms follow the hotel’s standard cancellation window. Contact us to adjust your block.' },
    ] },
    { hotel: 'The Concord Hotel', items: [
      { title: 'Group Cancellation Policy', body: 'Rooms in this block may be released up to 72 hours before check-in without penalty. Unreleased rooms after that window are charged one night’s rate plus tax.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
    ] },
  ],
}

// Multiple room reservations — one block per reservation (different hotels/dates).
const reservationsData = {
  contactName: 'Alex Smith',
  confirmationId: '72055771948934',
  reservedOn: 'Fri, 06/18/2027 09:02 AM EST',
  guest: 'Alex Smith — (555) 018-2245',
  email: 'youraccount@eventpipe.com',
  hotels: [
    {
      name: 'Hilton Orlando Lake Buena Vista',
      stars: 4, address: '1751 Hotel Plaza Blvd, Orlando, FL, US, 32830', seed: 0,
      checkIn: 'Mon, 06/29/2027 03:00 PM', checkOut: 'Wed, 07/01/2027 11:00 AM',
      rooms: [
        { type: 'King Room', note: 'Room 1 · 2 adults · 1 child', nights: [
          { date: 'Mon, 06/29/2027', qty: 1, price: 301 },
          { date: 'Tue, 06/30/2027', qty: 1, price: 319 },
        ] },
        { type: 'Queen Room', note: 'Room 2 · 1 adult', nights: [
          { date: 'Mon, 06/29/2027', qty: 1, price: 279 },
          { date: 'Tue, 06/30/2027', qty: 1, price: 279 },
        ] },
      ],
    },
    {
      name: 'Omni Orlando Resort at ChampionsGate',
      stars: 4, address: '1500 Masters Blvd, ChampionsGate, FL, US, 33896', seed: 2,
      checkIn: 'Tue, 06/23/2027 03:00 PM', checkOut: 'Wed, 06/24/2027 11:00 AM',
      rooms: [
        { type: 'Double Queen Room', note: 'Room 1 · 1 adult', nights: [
          { date: 'Tue, 06/23/2027', qty: 1, price: 209 },
        ] },
      ],
    },
    {
      name: 'Margaritaville Resort Orlando',
      stars: 4, address: '8000 Fins Up Cir, Kissimmee, FL, US, 34747', seed: 4,
      checkIn: 'Wed, 06/24/2027 03:00 PM', checkOut: 'Thu, 06/25/2027 11:00 AM',
      rooms: [
        { type: 'King Suite', note: 'Room 1 · 1 adult', nights: [
          { date: 'Wed, 06/24/2027', qty: 1, price: 245 },
        ] },
      ],
    },
  ],
  policies: [
    { hotel: 'Hilton Orlando Lake Buena Vista', items: [
      { title: 'Cancellation Policy', body: 'Free cancellation applies to each reservation until the date shown for that hotel. After that, the property’s individual cancellation terms apply per room.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
    ] },
    { hotel: 'Omni Orlando Resort at ChampionsGate', items: [
      { title: 'Cancellation Policy', body: 'This reservation may be cancelled up to 48 hours before check-in for a full refund. Late cancellations are charged one night’s rate plus tax.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
    ] },
    { hotel: 'Margaritaville Resort Orlando', items: [
      { title: 'Cancellation Policy', body: 'Non-refundable rate. Changes and cancellations are not permitted after booking.' },
      { title: 'Amenities Notice', body: AMENITIES_NOTICE },
    ] },
  ],
}

export default {
  title: 'Confirmation/Book Reservation',
  component: ConfirmationPage,
  // holdData is shared with the Group Block story file — not a story itself.
  excludeStories: ['holdData'],
  tags: ['autodocs', 'updated'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Confirmation Page — Book Reservation
The post-checkout success screen for the reservation flow: a success banner, a
**Summary** (contact + confirmation #, Copy Booking Link / Print, a reserved /
guest / email meta grid, and one block per hotel with the rooms and per-night
rates), and a per-hotel **Policies** section.

- **Single Reservation** — one hotel stay.
- **Multiple Reservations** — one block per reservation (different hotels / dates).

Accents use the DS primary (Navy).
` } },
  },
}

/** Single hotel reservation — full page (Global Nav + footer). */
export const SingleReservation = {
  name: 'Single Reservation',
  render: () => ({
    components: { PageFrame, ConfirmationPage },
    setup: () => ({ data: reserveData }),
    template: `<page-frame cart-mode="reserve"><confirmation-page mode="reserve" :data="data" /></page-frame>`,
  }),
}

/** Multiple room reservations — one block per reservation, each with its own
 *  hotel, dates, and rooms. */
export const MultipleReservations = {
  name: 'Multiple Reservations',
  render: () => ({
    components: { PageFrame, ConfirmationPage },
    setup: () => ({ data: reservationsData }),
    template: `<page-frame cart-mode="reserve"><confirmation-page mode="reservations" :data="data" /></page-frame>`,
  }),
}
