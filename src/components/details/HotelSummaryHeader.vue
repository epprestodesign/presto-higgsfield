<script setup>
// HotelSummaryHeader — the top block of the hotel detail screen: name + star
// class, address/distance, guest score (DsRating), popular amenities, and a
// mini-map (HotelMap) pinned to the property. Composes existing DS components.
import { computed } from 'vue'
import DsRating from '../DsRating.vue'
import HotelMap from '../HotelMap.vue'
import Amenity from '../Amenity.vue'

const props = defineProps({
  name: { type: String, default: 'Hotel Name' },
  stars: { type: Number, default: 0 },            // star class (0 hides)
  address: { type: String, default: '' },
  distance: { type: String, default: '' },        // e.g. "2.4 mi from venue"
  score: { type: Number, default: null },          // guest score (null hides)
  scoreMax: { type: Number, default: 5 },
  reviews: { type: Number, default: null },
  ratingLabel: { type: String, default: '' },      // e.g. "Excellent"
  preferred: { type: Boolean, default: false },     // "Preferred Hotel" badge
  lowRateGuarantee: { type: Boolean, default: false }, // "Lowest Rate Guarantee" badge
  checkInTime: { type: String, default: '' },       // e.g. "3:00 PM"
  checkOutTime: { type: String, default: '' },      // e.g. "11:00 AM"
  amenities: { type: Array, default: () => [] },    // [{ icon, label }]
  // Mini-map
  lat: { type: Number, default: 28.5383 },
  lng: { type: Number, default: -81.3792 },
  showMap: { type: Boolean, default: true },
  mapHeight: { type: String, default: '220px' },
  // Phones (DES-420 / DES-423): production's details page leads with just the
  // name + star class, then the About copy, and only afterwards the amenities /
  // check-in times / map. In compact mode this header renders the name block
  // alone and PropertyFacts carries the rest, further down the page.
  compact: { type: Boolean, default: false },
})

const starList = computed(() => Array.from({ length: 5 }, (_, i) => i < props.stars))
const mapHotels = computed(() => [{ id: 0, name: props.name, location: props.address, lat: props.lat, lng: props.lng, price: null }])
const metaLine = computed(() => [props.address, props.distance].filter(Boolean).join(' · '))
</script>

<template>
  <header class="dhead">
    <div class="dhead__info">
      <div v-if="preferred || lowRateGuarantee" class="dhead__badges">
        <span v-if="preferred" class="dhead__badge dhead__badge--pref">Preferred Hotel</span>
        <span v-if="lowRateGuarantee" class="dhead__badge dhead__badge--lrg"><q-icon name="verified" size="15px" /> Lowest Rate Guarantee</span>
      </div>

      <div class="dhead__name">
        <span>{{ name }}</span>
        <span v-if="stars" class="dhead__stars" :title="`${stars}-star hotel`">
          <q-icon v-for="(on, i) in starList" :key="i" :name="on ? 'star' : 'star_border'" size="20px" />
        </span>
      </div>

      <template v-if="!compact">
        <div v-if="metaLine" class="dhead__addr">{{ metaLine }}</div>

        <div v-if="score != null" class="dhead__rating">
          <ds-rating :score="score" :max="scoreMax" :reviews="reviews" :label="ratingLabel" />
        </div>

        <div v-if="checkInTime || checkOutTime" class="dhead__times">
          <span v-if="checkInTime"><q-icon name="login" size="18px" /> Check-in: <strong>{{ checkInTime }}</strong></span>
          <span v-if="checkOutTime"><q-icon name="logout" size="18px" /> Check-out: <strong>{{ checkOutTime }}</strong></span>
        </div>

        <template v-if="amenities.length">
          <div class="dhead__poplabel">Popular Amenities</div>
          <div class="dhead__pop">
            <amenity v-for="a in amenities" :key="a.key || a.label" :amenity="a" size="md" />
          </div>
        </template>
      </template>
    </div>

    <div v-if="showMap && !compact" class="dhead__map">
      <hotel-map :hotels="mapHotels" :center="{ lat, lng }" :zoom="14" :height="mapHeight" />
    </div>
  </header>
</template>

<style scoped>
.dhead { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; }
.dhead__info { flex: 1; min-width: 0; }
.dhead__badges { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.dhead__badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; padding: 5px 12px; border-radius: var(--ds-radius-pill); }
.dhead__badge--pref { background: var(--ds-color-background-brand-bold); color: #fff; }
.dhead__badge--lrg { color: var(--ds-color-text-success); border: 1px solid var(--ds-color-text-success); background: transparent; }

.dhead__name { font-size: 1.75rem; font-weight: 700; line-height: 1.2; color: var(--ds-color-text); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dhead__stars { display: inline-flex; color: var(--ds-palette-slate-900); }
.dhead__addr { color: var(--ds-color-text-subtle); margin-top: 6px; }
.dhead__rating { margin-top: 14px; }
.dhead__times { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 14px; color: var(--ds-color-text); font-size: 0.9375rem; }
.dhead__times span { display: inline-flex; align-items: center; gap: 6px; }
.dhead__times strong { font-weight: 700; }
.dhead__times .q-icon { color: var(--ds-color-text-brand); }
.dhead__poplabel { font-weight: 600; color: var(--ds-color-text); margin-top: 20px; }
.dhead__pop { display: flex; flex-wrap: wrap; gap: 14px 28px; margin-top: 14px; }
.dhead__map { flex: 0 0 300px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }

@media (max-width: 860px) {
  .dhead { flex-direction: column; }
  .dhead__map { flex: 1 1 auto; width: 100%; }
}
</style>
