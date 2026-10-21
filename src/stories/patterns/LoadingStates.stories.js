/** BROWSE HOTELS / Loading States — skeletons that mirror the hotel listing card
 *  layout (image-left · body · price-right) so the loading view matches the
 *  loaded results exactly. Toggle to compare skeleton vs loaded cards. */
import { ref } from 'vue'
import HotelCardReserve from '../../components/browse/HotelCardReserve.vue'
import HotelCardGroup from '../../components/browse/HotelCardGroup.vue'
import { sampleRooms } from '../browse/_rooms-sample.js'

export default {
  title: 'Browse Hotels/Components/Results/Loading States',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
Result **skeletons mirror the Hotel Listing Card layout** — a left media block, a
middle body (name · stars · availability · distance · Availability toggle), and a
right price rail (label · amount · CTA) — so the loading view matches the loaded
results one-to-one and there's no layout shift when data arrives.

Toggle each story to compare the **skeleton** against the **loaded cards**.
` } } },
}

// A single skeleton row shaped exactly like the horizontal hotel card.
const SKELETON = `
  <div style="display:flex;border:1px solid rgba(0,0,0,0.04);border-radius:12px;overflow:hidden;background:var(--ds-color-surface);box-shadow:0 1px 2px rgba(0,0,0,0.04),0 8px 20px rgba(0,0,0,0.06)">
    <q-skeleton square width="230px" height="212px" animation="wave" />
    <div style="flex:1;min-width:0;padding:20px 24px;display:flex;flex-direction:column;gap:12px">
      <q-skeleton type="text" width="55%" height="26px" animation="wave" />
      <q-skeleton type="text" width="110px" animation="wave" />
      <q-skeleton type="text" width="48%" animation="wave" />
      <q-skeleton type="text" width="36%" animation="wave" />
      <q-skeleton type="text" width="90px" style="margin-top:auto" animation="wave" />
    </div>
    <div style="width:250px;padding:20px 24px;display:flex;flex-direction:column;align-items:flex-end;gap:10px">
      <q-skeleton type="text" width="90px" animation="wave" />
      <q-skeleton type="text" width="120px" height="24px" animation="wave" />
      <q-skeleton type="text" width="150px" animation="wave" />
      <q-skeleton width="150px" height="52px" style="border-radius:8px;margin-top:6px" animation="wave" />
    </div>
  </div>`

const shell = (loadedTemplate, extraComponents = {}) => ({
  components: extraComponents,
  setup: () => ({ loading: ref(true) }),
  template: `
    <div style="max-width:1040px">
      <q-btn dense flat color="primary" :label="loading ? 'Show loaded' : 'Show loading'" @click="loading=!loading" class="q-mb-md" />
      <div style="display:flex;flex-direction:column;gap:20px">
        <template v-if="loading">
          ${SKELETON}${SKELETON}${SKELETON}
        </template>
        <template v-else>
          ${loadedTemplate}
        </template>
      </div>
    </div>`,
})

/** Book Reservation — skeleton ↔ the loaded HotelCardReserve. */
export const BookReservation = {
  name: 'Book Reservation',
  render: () => {
    const s = shell(
      `<hotel-card-reserve v-for="h in cards" :key="h.name" v-bind="h" style="width:100%" />`,
      { HotelCardReserve },
    )
    const base = s.setup
    s.setup = () => ({
      ...base(),
      cards: [
        { name: 'The Grand Riverside Hotel', stars: 4, distance: '0.3 mi from Main Arena', preferred: true, fromNightly: 189, total: 756, availability: 'available', seed: 1, rooms: sampleRooms },
        { name: 'Omni Downtown Suites', stars: 4.5, distance: '0.6 mi from Main Arena', fromNightly: 219, total: 876, availability: 'available', seed: 2, rooms: sampleRooms },
        { name: 'Hampton Inn & Suites', stars: 3, distance: '1.1 mi from Main Arena', fromNightly: 149, total: 596, availability: 'available', seed: 4, rooms: sampleRooms },
      ],
    })
    return s
  },
}

/** Group Block — skeleton ↔ the loaded HotelCardGroup. */
export const GroupBlock = {
  name: 'Group Block',
  render: () => {
    const s = shell(
      `<hotel-card-group v-for="h in cards" :key="h.name" v-bind="h" style="width:100%" />`,
      { HotelCardGroup },
    )
    const base = s.setup
    s.setup = () => ({
      ...base(),
      cards: [
        { name: 'Embassy Suites Downtown', stars: 4, distance: '0.3 mi from Main Arena', preferred: true, startingPrice: 269, availability: 'matches', roomsAvailable: 8, seed: 2, rooms: sampleRooms },
        { name: 'The Grand Riverside Hotel', stars: 4.5, distance: '0.6 mi from Main Arena', startingPrice: 289, availability: 'matches', roomsAvailable: 5, seed: 1, rooms: sampleRooms },
        { name: 'Marriott Marquis', stars: 4.5, distance: '0.7 mi from Main Arena', startingPrice: 299, availability: 'matches', roomsAvailable: 12, seed: 7, rooms: sampleRooms },
      ],
    })
    return s
  },
}
