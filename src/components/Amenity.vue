<script setup>
// Amenity — a single icon + label amenity item, the atomic unit used wherever
// amenities appear (summary-header popular row, Amenities section, listing/room
// cards, filters). Pass an amenity object from the catalog (src/lib/amenities.js)
// or an explicit icon + label.
import { computed } from 'vue'

const props = defineProps({
  amenity: { type: Object, default: null }, // { icon, label } (from the catalog)
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  size: { type: String, default: 'md' },       // sm | md | lg
  variant: { type: String, default: 'inline' }, // inline | chip
})

const ic = computed(() => props.amenity?.icon || props.icon)
const text = computed(() => props.amenity?.label || props.label)
const iconSize = computed(() => ({ sm: '16px', md: '20px', lg: '24px' }[props.size] || '20px'))
</script>

<template>
  <span class="amty" :class="[`amty--${size}`, `amty--${variant}`]">
    <q-icon :name="ic" :size="iconSize" class="amty__icon" />
    <span class="amty__label">{{ text }}</span>
  </span>
</template>

<style scoped>
.amty { display: inline-flex; align-items: center; gap: 8px; color: var(--ds-color-text); font-weight: 500; line-height: 1.3; }
.amty__icon { color: var(--ds-color-text-subtle); flex: 0 0 auto; }

/* Sizes */
.amty--sm { gap: 6px; font-size: 0.8125rem; }
.amty--md { font-size: 0.9375rem; }
.amty--lg { gap: 10px; font-size: 1rem; }

/* Chip variant — bordered pill for dense, tappable contexts (filters). */
.amty--chip { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-pill); background: var(--ds-color-surface); }
.amty--chip.amty--sm { padding: 5px 12px; }
.amty--chip.amty--md { padding: 7px 14px; }
.amty--chip.amty--lg { padding: 9px 16px; }
.amty--chip .amty__icon { color: var(--ds-color-text); }
</style>
