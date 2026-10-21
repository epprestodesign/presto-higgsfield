<script setup>
// ViewMapField — the embedded HotelMap preview (Nashville sample data) with a
// full-width "View Map" button that opens the full-screen map dialog (MapDialog).
// `v-model` is the search radius, two-way synced across the preview circle, the
// dialog map, and the dialog's floating radius slider.
import { ref, computed } from 'vue'
import HotelMap from '../../HotelMap.vue'
import MapDialog from '../MapDialog.vue'
import { mapHotels, eventLocation } from '../map-sample.js'

const props = defineProps({ modelValue: { type: Number, default: 0 } })
const emit = defineEmits(['update:modelValue', 'view-map'])

const radius = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const open = ref(false)
function viewMap () {
  open.value = true
  emit('view-map')
}
</script>

<template>
  <div class="fr__map-wrap">
    <hotel-map
      :hotels="mapHotels"
      :event-location="eventLocation"
      :zoom="12"
      height="200px"
      :zoom-control="false"
      :radius-min="0.25"
      :radius-step="0.25"
      v-model:search-radius="radius"
    />
    <button type="button" class="fr__map-btn" @click="viewMap">
      <q-icon name="map" size="18px" /> View Map
    </button>
  </div>

  <!-- Full-screen map dialog — shared with the phone "Map" button (MapDialog). -->
  <map-dialog v-model="open" v-model:radius="radius" />
</template>

<style scoped>
/* View Map — HotelMap preview with a full-width footer button */
.fr__map-wrap {
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04); background: var(--ds-color-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06);
}
.fr__map-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 48px; padding: 0 18px;
  border: 0; border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  color: var(--ds-color-text); font-weight: 700; font-size: 0.9375rem; cursor: pointer;
}
.fr__map-btn:hover { background: var(--ds-palette-navy-50, #eef1f7); }
</style>
