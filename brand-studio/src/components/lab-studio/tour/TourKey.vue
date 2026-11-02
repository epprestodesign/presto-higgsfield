<script setup>
// A keyboard key cap (with an optional hint beside it) for the tour SVGs.
import { computed } from 'vue'
const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
})
const w = computed(() => Math.max(34, 20 + props.label.length * 8.2))
</script>

<template>
  <g class="tour-key" :transform="`translate(${x} ${y})`">
    <rect class="tour-key__edge" x="0" y="2" :width="w" height="30" rx="7" />
    <rect class="tour-key__cap" x="0.5" y="0.5" :width="w - 1" height="29" rx="6.5" />
    <text class="tour-key__text" :x="w / 2" y="20" text-anchor="middle">{{ label }}</text>
    <text v-if="hint" class="tour-key__hint" :x="w + 8" y="20">{{ hint }}</text>
  </g>
</template>
