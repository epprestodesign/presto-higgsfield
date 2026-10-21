<script setup>
// DetailTabs — the section navigation bar for the hotel detail screen
// (Overview / Rooms / Property / Amenities / Policies). Controlled via
// v-model; on the full page each tab scrolls to its section anchor, but the
// component itself is purely presentational (underline-style tab bar).
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  tabs: {
    type: Array,
    default: () => [
      { name: 'overview', label: 'Overview' },
      { name: 'rooms', label: 'Rooms' },
      { name: 'property', label: 'Property' },
      { name: 'amenities', label: 'Amenities' },
      { name: 'policies', label: 'Policies' },
    ],
  },
})
const emit = defineEmits(['update:modelValue', 'select'])

const active = computed(() => props.modelValue || props.tabs[0]?.name)
const select = (name) => { emit('update:modelValue', name); emit('select', name) }
</script>

<template>
  <nav class="dtabs" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.name"
      type="button"
      role="tab"
      class="dtabs__tab"
      :class="{ 'is-active': t.name === active }"
      :aria-selected="t.name === active"
      @click="select(t.name)"
    >{{ t.label }}</button>
  </nav>
</template>

<style scoped>
.dtabs { display: flex; gap: 6px; border-bottom: 1px solid var(--ds-color-border); overflow-x: auto; }
.dtabs__tab { padding: 12px 16px; cursor: pointer; font-family: inherit; font-size: 0.9375rem; font-weight: 500; color: var(--ds-color-text-subtle); background: none; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color var(--ds-duration-fast) var(--ds-ease-standard); }
.dtabs__tab:hover { color: var(--ds-color-text); }
.dtabs__tab.is-active { color: var(--ds-color-text); border-color: var(--ds-palette-slate-900); font-weight: 600; }
</style>
