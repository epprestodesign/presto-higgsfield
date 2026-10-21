// PATTERNS / Hotel Map — map-only listings view with price-pill markers.
import { ref } from 'vue'
import HotelMap from '../../components/HotelMap.vue'
import DsModal from '../../components/DsModal.vue'
import { getImages } from '../../lib/imagery'

// Vary popup imagery across categories (instant local fallback set).
const cats = ['exterior', 'lobby', 'rooms', 'pool', 'dining', 'spa']
const img = (i) => (getImages(cats[i % cats.length])[0] || {}).url

// Sample Nashville-area hotels with real-ish coordinates.
// `url` points to each hotel's details page (placeholder routes for now — the
// popup image + name link here for future navigation).
const hotels = [
  { id: '1', name: 'Hilton Nashville Downtown', location: 'Nashville, TN', lat: 36.1567, lng: -86.7790, price: 250, rating: 4.5, reviews: 120, image: img(0), url: '#/hotels/hilton-nashville-downtown' },
  { id: '2', name: 'Omni Nashville Hotel', location: 'Nashville, TN', lat: 36.1583, lng: -86.7758, price: 289, rating: 4.6, reviews: 980, image: img(1), url: '#/hotels/omni-nashville' },
  { id: '3', name: 'The Hermitage Hotel', location: 'Nashville, TN', lat: 36.1652, lng: -86.7836, price: 415, rating: 4.8, reviews: 540, image: img(2), url: '#/hotels/the-hermitage' },
  { id: '4', name: 'JW Marriott Nashville', location: 'Nashville, TN', lat: 36.1554, lng: -86.7812, price: 332, rating: 4.7, reviews: 760, image: img(3), url: '#/hotels/jw-marriott-nashville' },
  { id: '5', name: 'The Bellwether Nashville', location: 'Nashville, TN', lat: 36.1499, lng: -86.7920, price: 198, rating: null, reviews: 0, image: img(4), url: '#/hotels/the-bellwether' },
  { id: '6', name: 'Gaylord Opryland Resort', location: 'Nashville, TN', lat: 36.2114, lng: -86.6947, price: 276, rating: 4.4, reviews: 3200, image: img(5), url: '#/hotels/gaylord-opryland' },
]

export default {
  title: 'Browse Hotels/Components/Left Rail/Hotel Map',
  component: HotelMap,
  tags: ['autodocs'],
  argTypes: {
    zoom: { control: { type: 'range', min: 3, max: 18 } },
    height: { control: 'text' },
  },
  parameters: { docs: { description: { component: `
## Overview
**Hotel Map** plots hotel listings on a Google Map, one **price-pill marker** per
hotel. Clicking a pill selects it (inverts to the brand color) and opens a popup
card with photo, name, rating, and nightly price. The map auto-fits its bounds to
all pins.

**Key handling:** the Maps JS key comes from \`VITE_GOOGLE_MAPS_API_KEY\`
(gitignored \`.env\` locally; a GitHub Actions secret for the deployed build). When
no key is present the component renders a styled fallback instead of failing.

**Props:** \`hotels\` (with \`lat\`/\`lng\`/\`price\`/…), \`center\`, \`zoom\`, \`currency\`,
\`mapId\`, \`height\`.
` } } },
}

// The event/tournament venue — a pulsing dot the map stays centered on.
const eventLocation = { lat: 36.1592, lng: -86.7785, label: 'Tournament venue' }

/** Map with six Nashville hotels; price pills + click-to-open popup cards.
 *  A pulsing "event location" dot anchors the center of the viewport. */
export const Default = {
  render: () => ({ components: { HotelMap }, setup: () => ({ hotels, eventLocation }), template: '<hotel-map :hotels="hotels" :event-location="eventLocation" :zoom="13" height="560px" />' }),
}

/** A small result set (two hotels). */
export const FewListings = {
  render: () => ({ components: { HotelMap }, setup: () => ({ hotels: hotels.slice(0, 2) }), template: '<hotel-map :hotels="hotels" height="440px" />' }),
}

// --- Dense dataset to demonstrate clustering ---
const NAMES = ['The Westin', 'Thompson', 'Bobby Hotel', 'Noelle', 'Union Station', 'Holston House', '21c Museum', 'Dream Nashville', 'Aloft', 'Cambria', 'Hyatt Place', 'AC Hotel', 'Margaritaville', 'Fairlane', 'Drury Plaza', 'Kimpton Aertson', 'Graduate', 'Hutton', 'Sheraton Grand', 'Renaissance']
let cid = 100
// Build `n` hotels in a tight pocket around a center so they cluster.
const pocket = (clat, clng, n) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2
  const r = 0.0006 + (i % 3) * 0.0004
  cid += 1
  return {
    id: String(cid), name: NAMES[cid % NAMES.length], location: 'Nashville, TN',
    lat: clat + Math.sin(a) * r, lng: clng + Math.cos(a) * r,
    price: 180 + ((cid * 37) % 260), rating: 4 + (((cid * 13) % 10) / 10), reviews: 60 + (cid * 7) % 1500,
    image: img(cid % 6), url: '#/hotels/' + cid,
  }
})
const manyHotels = [
  ...pocket(36.1585, -86.7770, 7), // downtown core
  ...pocket(36.1510, -86.7900, 6), // The Gulch
  ...pocket(36.1665, -86.7705, 5), // riverfront / east
  ...pocket(36.1700, -86.7500, 3), // farther east
]

/** Many hotels grouped into black count bubbles; click a cluster to zoom in &
 *  expand it into individual price pills. */
export const Clustered = {
  render: () => ({ components: { HotelMap }, setup: () => ({ hotels: manyHotels, eventLocation }), template: '<hotel-map :hotels="hotels" :event-location="eventLocation" :zoom="13" height="560px" />' }),
}

/**
 * **Search radius** — a slider drives a circular search area centered on the
 * event location. The `searchRadius` (miles) draws a `google.maps.Circle` that
 * resizes live and auto-fits the map as you drag. Hotels stay visible; the
 * circle is purely a visual indicator of where the search is looking.
 */
export const SearchRadius = {
  render: () => ({
    components: { HotelMap },
    setup: () => ({ hotels: manyHotels, eventLocation, radius: ref(5) }),
    template: `
      <div>
        <div style="max-width:440px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <label style="font-weight:600;color:var(--ds-color-text)">Search radius</label>
            <strong style="font-variant-numeric:tabular-nums;color:var(--ds-color-text)">{{ radius }} mi</strong>
          </div>
          <q-slider v-model="radius" :min="0.25" :max="25" :step="0.25" :label-value="radius + ' mi'" label color="dark" track-color="grey-4" />
        </div>
        <hotel-map :hotels="hotels" :event-location="eventLocation" :search-radius="radius" @update:search-radius="radius = $event" radius-unit="mi" :radius-min="0.25" :radius-step="0.25" :zoom="12" height="560px" />
      </div>`,
  }),
}

/**
 * **Map dialog** — a fullscreen "Expand map" modal that combines clustered hotel
 * listings, the pulsing event location, and the **search-radius** slider in the
 * header. Drag the slider to resize the radius circle live; zoom in to expand a
 * cluster into individual price pills.
 */
export const MapDialog = {
  name: 'Map Dialog',
  render: () => ({
    components: { HotelMap, DsModal },
    setup: () => ({ hotels: manyHotels, eventLocation, open: ref(true), radius: ref(5) }),
    template: `
      <div style="min-height:100vh;background:var(--ds-palette-neutral-100);padding:32px 24px">
        <button type="button" @click="open = true" style="display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border:1px solid var(--ds-color-border-bold);border-radius:10px;background:var(--ds-color-surface);color:var(--ds-color-text);font-weight:600;cursor:pointer;font-family:inherit">
          <q-icon name="open_in_full" size="18px" /> Expand map
        </button>

        <!-- DsModal owns the backdrop / card / header / close / ESC / scroll-lock.
             flush = edge-to-edge body so the map fills it; the slider floats over. -->
        <ds-modal v-model="open" title="Hotels near the venue"
          :subtitle="hotels.length + ' hotels · searching within ' + radius + ' mi'"
          aria-label="Hotels map" size="fullscreen" flush>
          <hotel-map :hotels="hotels" :event-location="eventLocation" :search-radius="radius" @update:search-radius="radius = $event" radius-unit="mi" :radius-min="0.25" :radius-step="0.25" :zoom="12" height="100%" cluster />
          <!-- Floating, shadowed search-radius control at the bottom center.
               Two-way bound: ⌘-scroll to zoom and the slider tracks the view. -->
          <div style="position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:5;width:min(440px,86%);background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-lg);box-shadow:0 10px 30px rgba(0,0,0,.22);padding:14px 22px 6px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
              <span style="font-weight:700;color:var(--ds-color-text)">Search radius</span>
              <strong style="color:var(--ds-color-text);font-variant-numeric:tabular-nums">{{ radius }} mi</strong>
            </div>
            <q-slider v-model="radius" :min="0.25" :max="25" :step="0.25" :label-value="radius + ' mi'" label color="dark" track-color="grey-4" />
          </div>
        </ds-modal>
      </div>`,
  }),
}
