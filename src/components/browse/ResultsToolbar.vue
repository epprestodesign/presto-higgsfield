<script setup>
// ResultsToolbar — the Browse Hotels results header that sits at the top of the
// results (hotel-card) column: a live property count on the left and the Sort By
// control on the right.
//
// The count line composes up to three clauses, in this order:
//   "N properties available (M filters applied) — searching for R rooms"
//     • "(M filters applied)" — shown when filtersApplied > 0 (accent link);
//       clicking it emits `clear-filters`.
//     • "— searching for R rooms" — the Group Block hint: the block is looking to
//       hold R rooms across the selected nights.
// Both accent clauses commonly appear together in the filtered "0 matches" state.
import SortDropdown from './SortDropdown.vue'

defineProps({
  count: { type: Number, default: 0 },
  // When > 0, render the "(N filters applied)" accent clause.
  filtersApplied: { type: Number, default: 0 },
  // When > 0, render the Group Block "searching for N rooms" clause.
  rooms: { type: Number, default: 0 },
  modelValue: { type: String, default: 'distance' }, // sort value
})
defineEmits(['update:modelValue', 'clear-filters'])
</script>

<template>
  <div class="rtb">
    <div class="rtb__count">
      <strong>{{ count }}</strong> properties available<button
        v-if="filtersApplied > 0"
        type="button"
        class="rtb__filters"
        @click="$emit('clear-filters')"
      >({{ filtersApplied }} {{ filtersApplied === 1 ? 'filter' : 'filters' }} applied)</button><span
        v-if="rooms > 0"
        class="rtb__rooms"
      >
        — searching for {{ rooms }} {{ rooms === 1 ? 'room' : 'rooms' }}</span>
    </div>

    <sort-dropdown
      :model-value="modelValue"
      variant="box"
      label="Sort By"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.rtb {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.rtb__count { font-size: 1.0625rem; color: var(--ds-color-text-subtle); }
.rtb__count strong { color: var(--ds-color-text); font-weight: 700; }
.rtb__rooms { color: var(--ds-color-link); font-weight: 600; }
.rtb__filters {
  margin-left: 6px; padding: 0; border: 0; background: none; cursor: pointer;
  font: inherit; color: var(--ds-color-link); font-weight: 600;
}
.rtb__filters:hover { text-decoration: underline; }
</style>
