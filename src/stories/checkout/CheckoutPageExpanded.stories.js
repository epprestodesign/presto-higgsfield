// CHECKOUT EXPERIENCE EXPANDED — the checkout flow fully unfolded: every step
// shown open at once with all fields in their input state, ending in ONE giant
// submit (no per-step "Next"). Two flows: Book Reservation and Group Block.
import { ref, computed } from 'vue'
import { loadImagery } from '../../lib/imagery'
import CheckoutPageExpanded from '../../components/checkout/CheckoutPageExpanded.vue'
import PageFrame from '../../components/PageFrame.vue'

const useHero = (category, seed) => {
  const img = ref('')
  loadImagery().then((lib) => { const arr = lib[category] || lib.rooms || []; if (arr[seed]) img.value = arr[seed].url })
  return img
}

export default {
  title: 'Checkout Experience Expanded/Overview',
  component: CheckoutPageExpanded,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
The **Expanded** checkout renders every step of the "Confirm and pay" flow open
at the same time — all fields visible in their input state — and finishes with a
single giant submit instead of stepping through with per-step "Next" buttons.
Use it to review the complete set of checkout fields on one page.
` } } },
}

/** Book Reservation — Contact information · Payment · Review reservation, all
 *  expanded, one "Book Now" submit. */
export const BookReservation = {
  name: 'Book Reservation',
  render: () => ({
    components: { CheckoutPageExpanded, PageFrame },
    setup() {
      const img = useHero('rooms', 2)
      const cart = {
        heldSeconds: 895,
        hotel: { name: 'The Concord Hotel', address: '750 Tremont St, Boston, MA 02118' },
        imageCategories: ['suites', 'rooms', 'lobby', 'pool', 'dining'], seed: 1,
        checkIn: { date: '06/23/2026', time: '4:00pm' }, checkOut: { date: '06/24/2026', time: '11:00am' }, nights: 1,
        highlights: [{ icon: 'kitchen', label: 'Kitchen' }, { icon: 'ac_unit', label: 'Air conditioning' }, { icon: 'microwave', label: 'Microwave' }],
        roomType: 'Aparthotel', bedConfig: '1 King Bed and 1 Queen Sofa Bed', sleeps: 2, amenities: [{ icon: 'wifi', label: 'Free WiFi' }],
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
            { label: 'Secondary Fee', value: 2 },
            { label: 'Guest Fees', value: 15 },
            { label: 'Resort Fees', value: 45 },
          ],
          subtotals: [{ label: 'Room Cost', value: 432 }, { label: 'Due Today', value: 162 }],
          balanceDue: 270,
        },
        roomsLeft: 1,
      }
      const summary = computed(() => ({
        image: img.value, title: 'The Concord Hotel', subtitle: 'Aparthotel · Sleeps 2', rating: '4.8',
        rrow1: '1 room · 1 night', total: 322.31,
      }))
      return { cart, summary }
    },
    template: `<page-frame cart-mode="reserve" brand="Secure Checkout" minimal-nav><checkout-page-expanded mode="reservation" :cart="cart" :summary="summary" /></page-frame>`,
  }),
}

/** Group Block — Review order · Contact & group information (teams block) ·
 *  Review reservation, all expanded, one "Hold Group Block Now" submit. */
export const GroupBlock = {
  name: 'Group Block',
  render: () => ({
    components: { CheckoutPageExpanded, PageFrame },
    setup() {
      const img = useHero('suites', 1)
      const cart = {
        heldSeconds: 372,
        hotels: [
          { name: 'Embassy Suites Chicago Downtown', imageCategories: ['suites', 'rooms'], seed: 0, rooms: [
            { type: 'Two-Room Suite King', summary: '1 King Bed · Sleeps 4', nights: [{ date: 'Tue, Jun 23', qty: 4, roomsLeft: 6, price: 269 }, { date: 'Wed, Jun 24', qty: 1, roomsLeft: 5, price: 299 }] },
            { type: 'Two-Room Suite Double', summary: '2 Queen Beds · Sleeps 4', price: 289, nights: [{ date: 'Tue, Jun 23', qty: 1, roomsLeft: 5 }, { date: 'Wed, Jun 24', qty: 1, roomsLeft: 4 }] },
          ] },
          { name: 'The Concord Hotel', imageCategories: ['lobby', 'rooms'], seed: 2, rooms: [
            { type: 'King Studio', summary: '1 King Bed · Sleeps 2', price: 165, nights: [{ date: 'Tue, Jun 23', qty: 1, roomsLeft: 6 }] },
          ] },
        ],
      }
      const summary = computed(() => ({
        image: img.value, title: 'Group hold', subtitle: 'Embassy Suites + The Concord',
        rrow1: '8 rooms · 2 hotels', note: 'Rooms held — finish before the timer ends',
      }))
      return { cart, summary }
    },
    template: `<page-frame cart-mode="hold" brand="Secure Checkout" minimal-nav><checkout-page-expanded mode="group" :cart="cart" :summary="summary" :show-teams="true" /></page-frame>`,
  }),
}
