// CHECKOUT EXPERIENCE / Checkout Page — Airbnb-style stepped checkout with a
// sticky order summary. Two variants: group/team hold and single reservation.
import { ref, computed } from 'vue'
import { loadImagery } from '../../lib/imagery'
import CheckoutPage from '../../components/checkout/CheckoutPage.vue'
import PageFrame from '../../components/PageFrame.vue'
import { THREE_FEES } from '../secondaryFeesFixture'

const useHero = (category, seed) => {
  const img = ref('')
  loadImagery().then((lib) => { const arr = lib[category] || lib.rooms || []; if (arr[seed]) img.value = arr[seed].url })
  return img
}

export default {
  title: 'Checkout Experience/Book Reservation',
  component: CheckoutPage,
  tags: ['autodocs', 'updated'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
The **Checkout Page** (Book Reservation) is the Airbnb-style "Confirm and pay"
flow: a left stepped accordion (Review order → Contact info → Payment → Review
reservation) beside a sticky **Order Summary**. Covers a single reservation and
Multiple Room Reservations. The **Add a payment method** step uses the
Instacart-style payment dialogs.
` } } },
}

/** Single reservation checkout — contact only, no group step. Rendered as a
 *  full page inside the app shell (Global Nav + footer). */
export const Page = {
  name: 'Book Reservation',
  render: () => ({
    components: { CheckoutPage, PageFrame },
    setup() {
      const img = useHero('rooms', 2)
      const cart = {
        heldSeconds: 895,
        hotel: { name: 'The Concord Hotel', address: '750 Tremont St, Boston, MA 02118' },
        imageCategories: ['suites', 'rooms', 'lobby', 'pool', 'dining'], seed: 1,
        checkIn: { date: '06/23/2026', time: '4:00pm' }, checkOut: { date: '06/24/2026', time: '11:00am' }, nights: 1,
        highlights: [{ icon: 'kitchen', label: 'Kitchen' }, { icon: 'ac_unit', label: 'Air conditioning' }, { icon: 'microwave', label: 'Microwave' }],
        roomType: 'Aparthotel', bedConfig: '1 King Bed and 1 Queen Sofa Bed', sleeps: 2, amenities: [{ icon: 'wifi', label: 'Free WiFi' }],
        // DES-85: itemized breakdown — `lines` enables CartReview's detailed layout.
        priceDetails: {
          nights: 1, rooms: 1, rate: 164.78, subtotal: 164.78, taxes: 47.53, propertyFee: 110.0, total: 322.31,
          lines: [
            { label: 'Check In', value: 'Wed, 03/31/2027', text: true },
            { label: 'Check Out', value: 'Sat, 04/03/2027', text: true },
            { label: 'Wed, 03/31/2027', value: 110 },
            { label: 'Thu, 04/01/2027', value: 115 },
            { label: 'Fri, 04/02/2027', value: 120 },
            { label: 'Booking Fee', value: 10 },
            { label: 'Taxes', value: 15 },
            { label: 'Guest Fees', value: 15 },
          ],
          // DES-456: the three secondary custom fees, replacing the single
          // ad-hoc "Secondary Fee" line this demo used to carry. They're charged
          // at booking, so their $43 sits inside Due Today (115 + 43 = 158).
          secondaryFees: THREE_FEES,
          subtotals: [
            { label: 'Room Cost', value: 385 },
            { label: 'Due Today', value: 158 },
          ],
          balanceDue: 270,
        },
        roomsLeft: 1,
      }
      const summary = computed(() => ({
        image: img.value,
        title: 'The Concord Hotel',
        subtitle: 'Aparthotel · Sleeps 2',
        rating: '4.8',
        cancellation: 'Free cancellation before Jun 20, 2026.',
        rrow1: '1 room · 1 night',
        rows: [
          { label: 'Dates', value: 'Jun 23 – 24, 2026', change: true },
          { label: 'Guests', value: '2 adults', change: true },
        ],
        priceLines: [
          { label: '1 night × $164.78', value: 164.78 },
          { label: 'Taxes', value: 47.53 },
          { label: 'Property fee', value: 110 },
        ],
        secondaryFees: THREE_FEES,
        total: 365.31, // 322.31 + $43 in secondary fees
        note: 'Rare find! This room is usually booked',
      }))
      return { cart, summary }
    },
    template: `<page-frame cart-mode="reserve" brand="Secure Checkout" minimal-nav><checkout-page mode="reservation" :cart="cart" :summary="summary" timer-top /></page-frame>`,
  }),
}

/** Multiple room reservations — several hotels booked together. The rail shows
 *  the `reservations` cart (per-night rows, no steppers); Contact Info groups
 *  guest forms by reservation/hotel. */
export const MultipleRoomReservations = {
  name: 'Multiple Room Reservations',
  render: () => ({
    components: { CheckoutPage, PageFrame },
    setup() {
      const img = useHero('suites', 0)
      const cart = {
        heldSeconds: 895, taxRate: 0.12, feePerNight: 0,
        // DES-456: multiple reservations carry the fees at cart level — the rail
        // has no single priceDetails to hang them off.
        secondaryFees: THREE_FEES,
        hotels: [
          { name: 'Hilton Orlando Lake Buena Vista', imageCategories: ['suites', 'rooms'], seed: 0, rooms: [
            { type: 'King Bedroom', summary: '1 King Bed · Sleeps 2', price: 301, adults: 2, children: 0, nights: [
              { date: 'Tue, Jun 23', price: 301 }, { date: 'Wed, Jun 24', price: 301 }, { date: 'Thu, Jun 25', price: 319 }] },
            { type: 'Double Queen Bedroom', summary: '2 Queen Beds · Sleeps 4', price: 363, adults: 3, children: 1, nights: [
              { date: 'Tue, Jun 23', price: 363 }, { date: 'Wed, Jun 24', price: 363 }] },
          ] },
          { name: 'Omni Orlando Resort', imageCategories: ['lobby', 'rooms'], seed: 2, rooms: [
            { type: 'Studio Suite', summary: '1 King Bed + Sofa · Sleeps 3', price: 401, adults: 2, children: 0, nights: [
              { date: 'Tue, Jun 23', price: 401 }, { date: 'Wed, Jun 24', price: 401 }, { date: 'Thu, Jun 25', price: 429 }] },
          ] },
        ],
      }
      const summary = computed(() => ({
        image: img.value,
        title: 'Multiple reservations',
        subtitle: 'Hilton + Omni · Orlando',
        rrow1: '3 rooms · 2 hotels',
        rows: [
          { label: 'Dates', value: 'Jun 23 – 25, 2026', change: true },
          { label: 'Rooms', value: '3 rooms · 2 hotels', change: true },
        ],
        priceLines: [
          { label: 'Room charges', value: 2557 },
          { label: 'Taxes', value: 306.84 },
        ],
        total: 2863.84,
        note: 'Rooms held — finish before the timer ends',
      }))
      return { cart, summary }
    },
    template: `<page-frame cart-mode="reserve" brand="Secure Checkout" minimal-nav><checkout-page mode="reservations" :cart="cart" :summary="summary" timer-top /></page-frame>`,
  }),
}
