// CHECKOUT EXPERIENCE / Steps / Contact Info / Book Reservation — step 2.
import { ref } from 'vue'
import StepContactInfo from '../../components/checkout/steps/StepContactInfo.vue'

export default {
  title: 'Checkout Experience/Components/Book Reservation/Contact Info',
  component: StepContactInfo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 2 — Book Reservation: contact + guests staying (per-room Guest Information). Multiple Room Reservations groups guest forms by reservation/hotel.' } } },
}

const wrap = (inner, data) => ({ components: { StepContactInfo }, setup: () => data, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

/**
 * Reservation — per-room **Guest Information**. Aware of the booking widget's
 * selection via `rooms` ("3 travelers, 2 rooms" → Room 1 with 2 adults, Room 2
 * with 1 adult). Each room's Additional Guests are pre-seeded from occupancy
 * (adults + children − 1 primary) and stay add/removable. Team Name and the
 * Custom Fields are event-configurable.
 */
export const Reservation = {
  render: () => wrap(
    `<step-contact-info mode="reservation" :rooms="rooms" :team-name="true" :custom-fields="customFields" v-model="m" />`,
    {
      m: ref([]),
      // From the booking widget: 3 travelers across 2 rooms.
      rooms: [{ adults: 2, children: 0 }, { adults: 1, children: 0 }],
      customFields: [
        { key: 'cf1', label: 'Custom Field 1', type: 'select', options: ['Option 1', 'Option 2', 'Option 3'], required: true },
        { key: 'cf2', label: 'Custom Field 2', type: 'text', optional: true },
      ],
    },
  ),
}

/**
 * Multiple Room Reservations — guest forms **grouped by reservation/hotel**.
 * Each reservation's rooms appear under its own header; Additional Guests are
 * still pre-seeded from each room's occupancy.
 */
export const MultipleRoomReservations = {
  name: 'Multiple Room Reservations',
  render: () => wrap(
    `<step-contact-info mode="reservations" :reservations="reservations" v-model="m" />`,
    {
      m: ref([]),
      reservations: [
        { name: 'Hilton Orlando Lake Buena Vista', rooms: [{ adults: 2, children: 0 }, { adults: 3, children: 1 }] },
        { name: 'Omni Orlando Resort', rooms: [{ adults: 2, children: 0 }] },
      ],
    },
  ),
}
