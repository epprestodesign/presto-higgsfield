<script setup>
// DsBox — layout primitive (MUI "Box"). Quasar has no Box; this is a styled
// div that consumes spacing/radius/elevation tokens.
import { computed } from 'vue'
const props = defineProps({
  padding: { type: [String, Number], default: 4 }, // 1..6 -> --ds-space-N
  radius: { type: String, default: 'md' },          // sm|md|lg|pill
  bg: { type: String, default: '' },                // brand token, e.g. 'primary'
  elevation: { type: [String, Number], default: 0 },// 0..4 -> --ds-shadow-N
  bordered: { type: Boolean, default: false },
})
const pad = computed(() => {
  const n = Number(props.padding)
  return n >= 1 && n <= 6 ? `var(--ds-space-${n})` : props.padding
})
const styles = computed(() => ({
  padding: pad.value,
  borderRadius: `var(--ds-radius-${props.radius})`,
  boxShadow: Number(props.elevation) ? `var(--ds-shadow-${props.elevation})` : 'none',
  border: props.bordered ? '1px solid rgba(0,0,0,.12)' : 'none',
}))
</script>
<template>
  <div class="ds-box" :class="bg ? `bg-${bg}` : ''" :style="styles"><slot /></div>
</template>
