<script setup>
// MapDialog — the full-screen Browse Hotels map (DsModal + HotelMap + a floating
// search-radius slider). Extracted from ViewMapField so the SAME dialog can be
// opened from two places without duplicating the map data or the radius wiring:
//   • desktop → the filter rail's "View Map" preview button (ViewMapField)
//   • phones  → the "Map" button in the list page's Filters/Map bar (DES-419),
//     which is where the map lives now that the filters sheet no longer carries one.
// `v-model` is the open state; `v-model:radius` is the shared search radius.
import { computed } from 'vue'
import HotelMap from '../HotelMap.vue'
import DsModal from '../DsModal.vue'
import { mapHotels, eventLocation } from './map-sample.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  radius: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue', 'update:radius'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// The dialog's radius stays usable even when the rail's value is 0 (Any).
const dialogRadius = computed({
  get: () => props.radius || 5,
  set: (v) => emit('update:radius', v),
})

</script>

<template>
  <ds-modal
    v-model="open"
    title="Hotels near the venue"
    :subtitle="mapHotels.length + ' hotels · searching within ' + dialogRadius + ' mi'"
    aria-label="Hotels map"
    size="fullscreen"
    flush
  >
    <hotel-map
      :hotels="mapHotels"
      :event-location="eventLocation"
      :zoom="12"
      height="100%"
      radius-unit="mi"
      :radius-min="0.25"
      :radius-step="0.25"
      :search-radius="dialogRadius"
      @update:search-radius="dialogRadius = $event"
      cluster
    />
    <!-- Floating, shadowed search-radius control at the bottom center. -->
    <div class="mdlg__radius">
      <div class="mdlg__radius-head">
        <span>Search radius</span>
        <strong>{{ dialogRadius }} mi</strong>
      </div>
      <q-slider v-model="dialogRadius" :min="0.25" :max="25" :step="0.25" :label-value="dialogRadius + ' mi'" label color="dark" track-color="grey-4" />
    </div>
  </ds-modal>
</template>

<style scoped>
/* Floating radius control inside the dialog */
.mdlg__radius {
  position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 5;
  width: min(440px, 86%); background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg);
  box-shadow: 0 10px 30px rgba(0,0,0,.22); padding: 14px 22px 6px;
}
.mdlg__radius-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
.mdlg__radius-head span { font-weight: 700; color: var(--ds-color-text); }
.mdlg__radius-head strong { color: var(--ds-color-text); font-variant-numeric: tabular-nums; }
</style>
