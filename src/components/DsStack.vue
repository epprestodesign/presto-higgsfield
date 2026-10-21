<script setup>
// DsStack — a layout primitive (MUI "Stack" equivalent).
// Quasar has no Stack component, so this is a thin local wrapper over
// Quasar's flexbox utility classes + a gap token. Use it instead of
// hand-writing flex/gutter classes for consistent spacing.
import { computed } from 'vue'

const props = defineProps({
  direction: { type: String, default: 'column' }, // 'row' | 'column'
  gap: { type: [String, Number], default: 4 },     // maps to var(--ds-space-N) when 1..6
  align: { type: String, default: 'stretch' },     // align-items
  justify: { type: String, default: 'start' },     // justify-content
  wrap: { type: Boolean, default: false },
  inline: { type: Boolean, default: false },
})

const gapValue = computed(() => {
  const n = Number(props.gap)
  return n >= 1 && n <= 6 ? `var(--ds-space-${n})` : props.gap
})

const styles = computed(() => ({
  display: props.inline ? 'inline-flex' : 'flex',
  flexDirection: props.direction,
  alignItems: props.align,
  justifyContent: props.justify,
  flexWrap: props.wrap ? 'wrap' : 'nowrap',
  gap: gapValue.value,
}))
</script>

<template>
  <div class="ds-stack" :style="styles">
    <slot />
  </div>
</template>
