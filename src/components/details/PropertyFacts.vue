<script setup>
// PropertyFacts — the block production shows on the PHONE hotel-details page
// between "About this property" and "Select Your Room" (DES-420 / DES-423):
//   popular amenities (2-up icon grid) → "See All Amenities >" →
//   Check In / Check Out → mini map card with "View Map" + address → distance
//
// On desktop these same facts live inside HotelSummaryHeader (name block on the
// left, map on the right). Rather than duplicate that layout, HotelDetailPage
// renders the header in `compact` mode on phones and drops this block in after
// the About copy, which is the production reading order.
import { ref } from 'vue'
import Amenity from '../Amenity.vue'
import HotelMap from '../HotelMap.vue'
import DsModal from '../DsModal.vue'

const props = defineProps({
  name: { type: String, default: '' },
  amenities: { type: Array, default: () => [] },   // [{ icon, label }]
  checkInTime: { type: String, default: '' },
  checkOutTime: { type: String, default: '' },
  address: { type: String, default: '' },
  distance: { type: String, default: '' },
  lat: { type: Number, default: 28.5383 },
  lng: { type: Number, default: -81.3792 },
})
const emit = defineEmits(['see-all-amenities'])

const mapOpen = ref(false)
const mapHotels = [{ id: 0, name: props.name, location: props.address, lat: props.lat, lng: props.lng, price: null }]
</script>

<template>
  <section class="pf">
    <!-- Popular amenities — 2-up icon grid, no heading (production shows the
         icons directly under the About copy). -->
    <div v-if="amenities.length" class="pf__amenities">
      <amenity v-for="a in amenities" :key="a.key || a.label" :amenity="a" size="md" />
    </div>
    <button v-if="amenities.length" type="button" class="pf__seeall" @click="emit('see-all-amenities')">
      See All Amenities &gt;
    </button>

    <!-- Check In / Check Out — two columns, label above the time. -->
    <div v-if="checkInTime || checkOutTime" class="pf__times">
      <div v-if="checkInTime" class="pf__time">
        <div class="pf__timelabel">Check In</div>
        <div class="pf__timevalue">{{ checkInTime }}</div>
      </div>
      <div v-if="checkOutTime" class="pf__time">
        <div class="pf__timelabel">Check Out</div>
        <div class="pf__timevalue">{{ checkOutTime }}</div>
      </div>
    </div>

    <!-- Mini map card — map, then a "View Map" link and the street address. -->
    <div class="pf__mapcard">
      <hotel-map :hotels="mapHotels" :center="{ lat, lng }" :zoom="13" height="150px" :zoom-control="false" />
      <div class="pf__mapfoot">
        <button type="button" class="pf__viewmap" @click="mapOpen = true">View Map</button>
        <div v-if="address" class="pf__address">{{ address }}</div>
      </div>
    </div>

    <div v-if="distance" class="pf__distance">
      <q-icon name="place" size="18px" /> <span>{{ distance }}</span>
    </div>

    <ds-modal v-model="mapOpen" :title="name || 'Property location'" :subtitle="address" size="fullscreen" flush>
      <hotel-map :hotels="mapHotels" :center="{ lat, lng }" :zoom="14" height="100%" />
    </ds-modal>
  </section>
</template>

<style scoped>
.pf { display: flex; flex-direction: column; gap: 16px; }

.pf__amenities { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }

.pf__seeall {
  align-self: flex-start; padding: 0; border: 0; background: none; cursor: pointer;
  font-family: inherit; font-size: 0.9375rem; font-weight: 700; color: var(--ds-color-link);
}
.pf__seeall:hover { text-decoration: underline; }

.pf__times { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.pf__timelabel { font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text); }
.pf__timevalue { margin-top: 2px; color: var(--ds-color-text); }

.pf__mapcard {
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md);
  overflow: hidden; background: var(--ds-color-surface);
}
.pf__mapfoot { padding: 10px 12px; text-align: center; }
.pf__viewmap {
  padding: 0; border: 0; background: none; cursor: pointer; font-family: inherit;
  font-size: 0.9375rem; font-weight: 700; color: var(--ds-color-link);
}
.pf__viewmap:hover { text-decoration: underline; }
.pf__address { margin-top: 4px; font-size: 0.875rem; color: var(--ds-color-text); }

.pf__distance { display: inline-flex; align-items: center; gap: 6px; color: var(--ds-color-text); font-size: 0.9375rem; }
.pf__distance :deep(.q-icon) { color: var(--ds-color-text-brand); }
</style>
