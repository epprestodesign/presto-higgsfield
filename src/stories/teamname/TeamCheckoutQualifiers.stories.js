// TEAM NAME QUALIFIERS / Book Reservation / Checkout Contact & Qualifiers — the
// reservation contact step: per-room guest info carrying the Guest type, the
// Team name (searchable select), and additional guests. Single reservation +
// multiple room reservations.
import { ref } from 'vue'
import TeamReservationGuests from '../../components/teamname/TeamReservationGuests.vue'

export default {
  title: 'Team Name Qualifiers/Book Reservation/Checkout Contact & Qualifiers',
  component: TeamReservationGuests,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
## Checkout Contact & Qualifiers — Book Reservation

Per-room guest information for the Book Reservation flow: the required **Guest
type** (above), the **Team name** searchable select (listed teams, or add an
unlisted team with Age division + Gender), then additional guests.

- **Reservation** — a single stay (rooms from the booking widget).
- **Multiple Room Reservations** — guest forms grouped by reservation / hotel.
` } } },
}

// The event's required per-guest field(s). Age division + Gender are captured by
// the Team name select, so Guest type is the standalone qualifier here.
const QUALIFIERS = [
  { key: 'guestType', label: 'Guest type', type: 'select', options: ['Athlete', 'Coach', 'Parent / Guardian', 'Team Staff', 'Other'], required: true },
]

const wrap = (inner, data) => ({ components: { TeamReservationGuests }, setup: () => data, template: `<div style="max-width:720px;margin:0 auto;padding:32px">${inner}</div>` })

/** Single reservation — 3 travelers across 2 rooms, from the booking widget. */
export const Reservation = {
  name: 'Reservation',
  render: () => wrap(
    `<team-reservation-guests :rooms="rooms" :team-name="true" :custom-fields="qualifiers" v-model="m" />`,
    { m: ref([]), rooms: [{ adults: 2, children: 0 }, { adults: 1, children: 0 }], qualifiers: QUALIFIERS },
  ),
}

/** Multiple Room Reservations — guest forms grouped by reservation/hotel. */
export const MultipleRoomReservations = {
  name: 'Multiple Room Reservations',
  render: () => wrap(
    `<team-reservation-guests :reservations="reservations" :team-name="true" :custom-fields="qualifiers" v-model="m" />`,
    {
      m: ref([]),
      qualifiers: QUALIFIERS,
      reservations: [
        { name: 'Hilton Orlando Lake Buena Vista', rooms: [{ adults: 2, children: 0 }, { adults: 3, children: 1 }] },
        { name: 'Omni Orlando Resort', rooms: [{ adults: 2, children: 0 }] },
      ],
    },
  ),
}

/** DES-461 scenario 2 — the event hides the team list, so Team name is the
 *  inline add-team form (name + Age division + Gender). */
export const ReservationListHidden = {
  name: 'Reservation — Hidden Team List',
  render: () => wrap(
    `<team-reservation-guests :rooms="rooms" :team-name="true" :team-list-hidden="true" :custom-fields="qualifiers" v-model="m" />`,
    { m: ref([]), rooms: [{ adults: 2, children: 0 }], qualifiers: QUALIFIERS },
  ),
}
