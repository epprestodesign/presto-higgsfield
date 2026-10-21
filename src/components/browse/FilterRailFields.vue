<script setup>
// FilterRailFields — the ordered stack of Browse filter sections (View Map,
// Exact Matches, Property Name, Parent Brand, Amenities, Search Radius, Budget,
// Min Star Rating, Room Type, Clear All). PRESENTATIONAL only: it owns no state —
// every value is a prop and every change is an event — so the SAME instance data
// can be rendered twice by FilterRail (inline on desktop, inside a DsModal on
// mobile) while staying in sync through the parent's refs.
import ViewMapField from './filter-rail/ViewMapField.vue'
import ExactMatchesField from './filter-rail/ExactMatchesField.vue'
import PropertyNameField from './filter-rail/PropertyNameField.vue'
import ParentBrandField from './filter-rail/ParentBrandField.vue'
import AmenitiesField from './filter-rail/AmenitiesField.vue'
import SearchRadiusField from './filter-rail/SearchRadiusField.vue'
import BudgetField from './filter-rail/BudgetField.vue'
import StarRatingField from './filter-rail/StarRatingField.vue'
import RoomTypeField from './filter-rail/RoomTypeField.vue'

defineProps({
  exactOnly: { type: Boolean, default: false },
  propertyQuery: { type: String, default: '' },
  brandSel: { type: Array, default: () => [] },
  amenitySel: { type: Array, default: () => [] },
  radius: { type: Number, default: 0.25 },
  budget: { type: Object, default: () => ({ basis: 'night', max: '' }) },
  minStars: { type: Number, default: 0 },
  roomSel: { type: Array, default: () => [] },
  // Hide the in-body "Clear All Filters" button (the mobile modal moves Clear all
  // into its footer, so it shouldn't also appear at the bottom of the fields).
  hideClear: { type: Boolean, default: false },
  // Hide the View Map preview. The mobile filters sheet sets this: on phones the
  // map is its own "Map" button next to "Filters" in the list toolbar, so the
  // filters sheet must not carry one (DES-419 / DES-422).
  hideMap: { type: Boolean, default: false },
})
const emit = defineEmits([
  'update:exactOnly', 'update:propertyQuery', 'update:brandSel', 'update:amenitySel',
  'update:radius', 'update:budget', 'update:minStars', 'update:roomSel', 'view-map', 'clear',
])
</script>

<template>
  <div class="frf">
    <!-- VIEW MAP (radius drives both the map preview and the radius slider) -->
    <div v-if="!hideMap" class="frf__section">
      <view-map-field :model-value="radius" @update:model-value="emit('update:radius', $event)" @view-map="emit('view-map')" />
    </div>
    <!-- EXACT MATCHES ONLY -->
    <div class="frf__section frf__section--exact">
      <exact-matches-field :model-value="exactOnly" @update:model-value="emit('update:exactOnly', $event)" />
    </div>
    <!-- SEARCH BY PROPERTY NAME -->
    <div class="frf__section">
      <property-name-field :model-value="propertyQuery" @update:model-value="emit('update:propertyQuery', $event)" />
    </div>
    <!-- PARENT BRAND -->
    <div class="frf__section">
      <parent-brand-field :model-value="brandSel" @update:model-value="emit('update:brandSel', $event)" />
    </div>
    <!-- AMENITIES -->
    <div class="frf__section">
      <amenities-field :model-value="amenitySel" @update:model-value="emit('update:amenitySel', $event)" />
    </div>
    <!-- SEARCH RADIUS -->
    <div class="frf__section">
      <search-radius-field :model-value="radius" @update:model-value="emit('update:radius', $event)" />
    </div>
    <!-- YOUR BUDGET -->
    <div class="frf__section">
      <budget-field :model-value="budget" @update:model-value="emit('update:budget', $event)" />
    </div>
    <!-- MINIMUM STAR RATING -->
    <div class="frf__section">
      <star-rating-field :model-value="minStars" @update:model-value="emit('update:minStars', $event)" />
    </div>
    <!-- ROOM TYPE -->
    <div class="frf__section">
      <room-type-field :model-value="roomSel" @update:model-value="emit('update:roomSel', $event)" />
    </div>
    <!-- CLEAR ALL (hidden in the mobile modal — it lives in the footer there) -->
    <div v-if="!hideClear" class="frf__section frf__section--clear">
      <button type="button" class="frf__clear" @click="emit('clear')">
        <q-icon name="close" size="18px" /> Clear All Filters
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Transparent stack — sections split by hairlines, matching the reference. */
.frf__section { padding: 16px 0; border-top: 1px solid var(--ds-color-border); }
.frf__section:first-child { border-top: 0; padding-top: 0; }
/* Exact Matches is a self-contained card — no divider above it. */
.frf__section--exact { border-top: 0; }
.frf__section--clear { border-top: 1px solid var(--ds-color-border); }

.frf__clear {
  width: 100%; height: 44px; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-radius: var(--ds-radius-button); cursor: pointer;
  background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.9375rem; font-family: inherit;
}
.frf__clear:hover { background: var(--ds-palette-navy-800, #0a1f4d); }
</style>
