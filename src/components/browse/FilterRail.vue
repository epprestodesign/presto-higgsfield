<script setup>
// FilterRail — the Browse Hotels left-rail filter MODULE. It owns all the filter
// state and renders the field stack (FilterRailFields) TWICE from the same refs:
//   • desktop → inline in the left column
//   • phones  → inside a full-screen DsModal (same shell as the Price Details /
//     Availability dialogs) opened by the "Filters" trigger, with a sticky
//     "Show N results" footer.
// Rendering one shared state into both keeps desktop + mobile perfectly in sync.
import { ref, computed, watch } from 'vue'
import DsModal from '../DsModal.vue'
import FilterRailFields from './FilterRailFields.vue'
import MapDialog from './MapDialog.vue'

// `exactOnly` is lifted so the page can react to it (the filtered edge case).
const props = defineProps({
  exactOnly: { type: Boolean, default: false },
  // Live result count — shown in the mobile dialog's "Show N results" CTA.
  resultCount: { type: Number, default: null },
  // Opens the full-screen map. The rail owns `radius`, so it also owns the map
  // dialog; the page's phone-only "Map" button drives this through v-model
  // (DES-419 / DES-422).
  mapOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['view-map', 'update:exactOnly', 'update:filters', 'update:mapOpen'])

// Mobile dialog open state.
const open = ref(false)

const mapOpen = computed({
  get: () => props.mapOpen,
  set: (v) => emit('update:mapOpen', v),
})

const exactOnly = computed({
  get: () => props.exactOnly,
  set: (v) => emit('update:exactOnly', v),
})
const propertyQuery = ref('')
const brandSel = ref([])
const amenitySel = ref([])
// Default to a tight 0.25-mile radius on load so the map isn't crowded.
const radius = ref(0.25)
const budget = ref({ basis: 'night', max: '' })
const minStars = ref(0)
const roomSel = ref([])

function clearAll () {
  exactOnly.value = false
  propertyQuery.value = ''
  brandSel.value = []
  amenitySel.value = []
  radius.value = 0.25
  budget.value = { basis: 'night', max: '' }
  minStars.value = 0
  roomSel.value = []
}

// Relay the full filter set to the page (which filters + sorts the listings)
// whenever anything changes. immediate so the page starts with a known baseline.
watch([propertyQuery, brandSel, amenitySel, radius, budget, minStars, roomSel], () => {
  emit('update:filters', {
    propertyQuery: propertyQuery.value,
    brands: [...brandSel.value],
    amenities: [...amenitySel.value],
    radius: radius.value,
    budget: { ...budget.value },
    minStars: minStars.value,
    roomTypes: [...roomSel.value],
  })
}, { deep: true, immediate: true })

const showLabel = computed(() =>
  props.resultCount == null
    ? 'Show results'
    : `Show ${props.resultCount.toLocaleString('en-US')} result${props.resultCount === 1 ? '' : 's'}`
)

// Number of active filters — shown as a badge on the "Filters" chip (replaces the
// tune icon with a white count in a primary-colour circle once any filter is set).
const activeCount = computed(() => {
  let n = 0
  if (exactOnly.value) n++
  if (propertyQuery.value.trim()) n++
  n += brandSel.value.length
  n += amenitySel.value.length
  if (radius.value !== 0.25) n++
  if (budget.value && budget.value.max !== '' && budget.value.max != null) n++
  if (minStars.value > 0) n++
  n += roomSel.value.length
  return n
})
</script>

<template>
  <div class="fr">
    <!-- Mobile-only trigger (hidden on desktop) — opens the DS modal. -->
    <button type="button" class="fr__toggle" :aria-expanded="open" @click="open = true">
      <span>
        <span v-if="activeCount > 0" class="fr__count">{{ activeCount }}</span>
        <q-icon v-else name="tune" size="18px" />
        Filters
      </span>
      <q-icon name="expand_more" size="22px" />
    </button>

    <!-- Desktop: the field stack rendered inline as the left column. -->
    <filter-rail-fields
      class="fr__inline"
      :exact-only="exactOnly"
      :property-query="propertyQuery"
      :brand-sel="brandSel"
      :amenity-sel="amenitySel"
      :radius="radius"
      :budget="budget"
      :min-stars="minStars"
      :room-sel="roomSel"
      @update:exact-only="exactOnly = $event"
      @update:property-query="propertyQuery = $event"
      @update:brand-sel="brandSel = $event"
      @update:amenity-sel="amenitySel = $event"
      @update:radius="radius = $event"
      @update:budget="budget = $event"
      @update:min-stars="minStars = $event"
      @update:room-sel="roomSel = $event"
      @view-map="emit('view-map')"
      @clear="clearAll"
    />

    <!-- Phones: the SAME fields inside the design-system modal (matches the
         Price Details / Availability dialog chrome). -->
    <ds-modal
      v-model="open"
      title="Filters"
      header-align="center"
      size="fullscreen"
      :z-index="4000"
    >
      <filter-rail-fields
        hide-clear
        hide-map
        :exact-only="exactOnly"
        :property-query="propertyQuery"
        :brand-sel="brandSel"
        :amenity-sel="amenitySel"
        :radius="radius"
        :budget="budget"
        :min-stars="minStars"
        :room-sel="roomSel"
        @update:exact-only="exactOnly = $event"
        @update:property-query="propertyQuery = $event"
        @update:brand-sel="brandSel = $event"
        @update:amenity-sel="amenitySel = $event"
        @update:radius="radius = $event"
        @update:budget="budget = $event"
        @update:min-stars="minStars = $event"
        @update:room-sel="roomSel = $event"
        @view-map="emit('view-map')"
        @clear="clearAll"
      />
      <template #footer="{ close }">
        <button type="button" class="fr__clearall" @click="clearAll">Clear all</button>
        <button type="button" class="fr__showresults" @click="close">{{ showLabel }}</button>
      </template>
    </ds-modal>

    <!-- The full-screen map, driven by the page's phone-only "Map" button. Lives
         here because the rail owns `radius`, so panning the radius in the map and
         in the Search Radius filter stay one value. -->
    <map-dialog v-model="mapOpen" v-model:radius="radius" />
  </div>
</template>

<style scoped>
.fr { background: transparent; }

/* Desktop: inline rail visible, the mobile trigger hidden. */
.fr__toggle { display: none; }

/* Modal footer (DsModal lays it out space-between): "Clear all" text button on
   the left, filled "Show N results" on the right — matching the reference. */
.fr__clearall {
  background: none; border: 0; padding: 8px 4px; font-family: inherit; font-size: 1rem;
  font-weight: 700; color: var(--ds-color-text); text-decoration: underline; text-underline-offset: 3px;
  cursor: pointer;
}
.fr__showresults {
  height: 48px; padding: 0 28px; border: 0; border-radius: var(--ds-radius-button);
  background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit;
  font-weight: 700; font-size: 1rem; cursor: pointer;
}
.fr__showresults:hover { background: var(--ds-palette-navy-800, #0a1f4d); }

/* Active-filter count badge on the "Filters" chip (replaces the tune icon). */
.fr__count {
  width: 22px; height: 22px; flex: none; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: var(--ds-color-background-brand-bold); color: #fff;
  font-size: 0.75rem; font-weight: 700; line-height: 1;
}

/* Phones: hide the inline rail, show the "Filters" trigger (a box matching the
   Sort control; HotelListPage's filter bar sets its final height/border). */
@media (max-width: 600px) {
  .fr__inline { display: none; }
  .fr__toggle {
    display: flex; align-items: center; justify-content: space-between; width: 100%; height: 56px;
    padding: 0 16px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-button);
    background: var(--ds-color-surface); color: var(--ds-color-text); font-family: inherit;
    font-weight: 700; font-size: 0.9375rem; cursor: pointer;
  }
  .fr__toggle > span { display: inline-flex; align-items: center; gap: 8px; }
}
</style>
