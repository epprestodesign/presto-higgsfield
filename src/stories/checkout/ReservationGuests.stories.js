// CHECKOUT EXPERIENCE / Components / Reservation Guests — the per-room guest
// forms used inside the Book Reservation contact step.
import { ref } from 'vue'
import ReservationGuests from '../../components/checkout/ReservationGuests.vue'

export default {
  title: 'Checkout Experience/Components/Book Reservation/Reservation Guests',
  component: ReservationGuests,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
Per-room **guest information** forms for the single-reservation contact step —
one form per room from the booking-widget selection, with optional team-name and
event-configurable custom fields. Emits the guest array + validity.
` } } },
}

const wrap = (inner, data) => ({ components: { ReservationGuests }, setup: () => data, template: `<div style="max-width:720px;margin:0 auto;padding:32px">${inner}</div>` })

/** Single room — one guest form. */
export const SingleRoom = { render: () => wrap(`<reservation-guests v-model="v" :rooms="rooms" />`, { v: ref([]), rooms: [{ adults: 2, children: 0 }] }) }

/** Multiple rooms — one form per room. */
export const MultipleRooms = { render: () => wrap(`<reservation-guests v-model="v" :rooms="rooms" />`, { v: ref([]), rooms: [{ adults: 2, children: 1 }, { adults: 1, children: 0 }] }) }
