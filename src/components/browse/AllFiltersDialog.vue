<script setup>
// AllFiltersDialog — an Airbnb-style "All filters" modal that consolidates every
// browse filter into one scrollable, accordion experience. Each section is a
// collapsible `Filter`; the footer shows a live, anticipatable result count
// ("Show N results") plus "Clear all". Controlled: v-model (open) + the filter
// values via `filters` (v-model:filters); the parent computes `resultCount`
// from those values so the count updates live as the user adjusts filters.
import DsModal from '../DsModal.vue'
import BrowseFilter from './Filter.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Combined filter values, keyed by section key (e.g. { roomType, budget, ... }).
  filters: { type: Object, default: () => ({}) },
  // Live count shown in the footer; null hides the number.
  resultCount: { type: Number, default: null },
  title: { type: String, default: 'Filters' },
  // Accordion sections. `plain` renders inline (no collapse); `open` starts expanded.
  sections: {
    type: Array,
    default: () => [
      { key: 'propertySearch', type: 'propertySearch', plain: true },
      { key: 'roomType', type: 'roomType', open: true },
      { key: 'budget', type: 'budget', open: true, props: { histogram: [3, 6, 10, 14, 18, 16, 12, 9, 6, 4, 3, 2] } },
      { key: 'amenities', type: 'amenities', open: true },
      { key: 'starRating', type: 'starRating' },
      { key: 'guestRating', type: 'guestRating' },
      { key: 'hotelClass', type: 'hotelClass' },
      { key: 'brands', type: 'brands' },
    ],
  },
})
const emit = defineEmits(['update:modelValue', 'update:filters', 'clear', 'apply'])

const setVal = (key, v) => emit('update:filters', { ...props.filters, [key]: v })
const clearAll = () => { emit('update:filters', {}); emit('clear') }
const apply = (close) => { emit('apply'); close() }
</script>

<template>
  <ds-modal
    :model-value="modelValue"
    :title="title"
    :z-index="4000"
    size="md"
    header-align="center"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="afd__body">
      <div v-for="s in sections" :key="s.key" class="afd__section" :class="{ 'afd__section--plain': s.plain }">
        <browse-filter
          :type="s.type"
          :collapsible="!s.plain"
          :default-open="!!s.open"
          :model-value="filters[s.key]"
          v-bind="s.props || {}"
          @update:model-value="setVal(s.key, $event)"
        />
      </div>
    </div>

    <template #footer="{ close }">
      <button type="button" class="afd__clear" @click="clearAll">Clear all</button>
      <button type="button" class="afd__apply" @click="apply(close)">
        {{ resultCount != null ? `Show ${resultCount.toLocaleString('en-US')} result${resultCount === 1 ? '' : 's'}` : 'Show results' }}
      </button>
    </template>
  </ds-modal>
</template>

<style scoped>
/* The modal shell (backdrop, card, header, footer chrome) lives in DsModal.
   These rules style only the All-Filters body + footer content. */
.afd__section { padding: 18px 0; }
.afd__section + .afd__section { border-top: 1px solid var(--ds-color-border); }

.afd__clear { background: none; border: 0; padding: 8px 4px; font-family: inherit; font-size: 1rem; font-weight: 700; color: var(--ds-color-text); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.afd__apply { height: 48px; padding: 0 24px; border: 0; border-radius: var(--ds-radius-md); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; }
.afd__apply:hover { filter: brightness(1.12); }
</style>
