<script setup>
// DsContainer — centered, max-width page wrapper (MUI "Container").
// Quasar's QPage needs QLayout; this is a standalone equivalent.
import { computed } from 'vue'
const props = defineProps({
  size: { type: String, default: 'md' }, // sm|md|lg|xl|full
  padding: { type: [String, Number], default: 4 },
})
const maxWidth = computed(() => ({ sm: '640px', md: '960px', lg: '1280px', xl: '1536px', full: '100%' }[props.size] || '960px'))
const pad = computed(() => {
  const n = Number(props.padding)
  return n >= 1 && n <= 6 ? `var(--ds-space-${n})` : props.padding
})
</script>
<template>
  <div class="ds-container" :style="{ maxWidth, margin: '0 auto', padding: pad, width: '100%' }"><slot /></div>
</template>
