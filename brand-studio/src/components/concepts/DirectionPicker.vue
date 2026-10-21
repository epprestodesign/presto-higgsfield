<script setup>
// DirectionPicker — choose which of the three creative directions to explore.
// Multi-select (checkbox semantics); at least one stays on.
import { CREATIVE_DIRECTIONS } from '../../models/brandKit.js'

const props = defineProps({
  modelValue: { type: Array, default: () => CREATIVE_DIRECTIONS.map((d) => d.id) },
  disabled: { type: Boolean, default: false },
  // The Brand Kit's current direction — marked "Suggested for you".
  suggested: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const SWATCH = {
  signature: 'linear-gradient(135deg, var(--ds-palette-navy-900), var(--ds-palette-navy-500))',
  energy: 'repeating-linear-gradient(115deg, var(--ds-palette-amber-400, #FBBF24) 0 6px, var(--ds-palette-navy-950) 6px 20px)',
  premium: 'linear-gradient(160deg, #E9E4DA, #B9A88A)',
}

const isOn = (id) => props.modelValue.includes(id)
function toggle(id) {
  if (props.disabled) return
  const on = isOn(id)
  if (on && props.modelValue.length === 1) return // keep at least one
  emit('update:modelValue', on ? props.modelValue.filter((x) => x !== id) : [...props.modelValue, id])
}
</script>

<template>
  <fieldset class="dp" :disabled="disabled">
    <legend class="bs-sr-only">Creative directions to explore</legend>
    <button
      v-for="d in CREATIVE_DIRECTIONS"
      :key="d.id"
      type="button"
      role="checkbox"
      class="dp__card bs-focusable"
      :class="{ 'dp__card--on': isOn(d.id) }"
      :aria-checked="isOn(d.id)"
      :aria-disabled="disabled || (isOn(d.id) && modelValue.length === 1)"
      @click="toggle(d.id)"
    >
      <span class="dp__swatch" :style="{ background: SWATCH[d.id] }" aria-hidden="true">
        <q-icon :name="d.icon" size="22px" />
      </span>
      <span class="dp__body">
        <span class="dp__name">
          {{ d.name }}
          <span v-if="suggested === d.id" class="bs-pill bs-pill--ai dp__suggested">Suggested</span>
        </span>
        <span class="dp__summary">{{ d.summary }}</span>
        <span class="dp__desc">{{ d.description }}</span>
      </span>
      <span class="dp__check" aria-hidden="true">
        <q-icon :name="isOn(d.id) ? 'check_circle' : 'radio_button_unchecked'" size="22px" />
      </span>
    </button>
  </fieldset>
</template>

<style scoped>
.dp { border: 0; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.dp__card {
  position: relative; display: flex; flex-direction: column; gap: 14px; text-align: left;
  padding: 16px; border-radius: var(--bs-radius-lg); border: 1.5px solid var(--bs-line);
  background: var(--bs-surface); color: var(--bs-ink); cursor: pointer; font-family: var(--bs-font);
  transition: border-color var(--ds-duration-fast) var(--ds-ease-standard), box-shadow var(--ds-duration-fast) var(--ds-ease-standard), transform var(--ds-duration-fast);
}
.dp__card:hover { border-color: var(--bs-line-strong); box-shadow: var(--bs-shadow-2); }
.dp__card--on { border-color: var(--bs-accent); box-shadow: 0 0 0 3px var(--bs-accent-soft); }
.dp:disabled .dp__card { cursor: not-allowed; opacity: 0.7; }
.dp__swatch { height: 64px; border-radius: var(--bs-radius-md); display: flex; align-items: flex-end; justify-content: flex-end; padding: 8px; color: #fff; }
.dp__swatch .q-icon { background: rgb(0 0 0 / 0.35); border-radius: 999px; padding: 6px; }
.dp__body { display: flex; flex-direction: column; gap: 4px; padding-right: 22px; }
.dp__name { font-weight: 700; font-size: 1.0625rem; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dp__suggested { font-size: 0.6875rem; padding: 2px 8px; }
.dp__summary { font-weight: 700; font-size: 0.875rem; color: var(--bs-ink-soft); }
.dp__desc { font-size: 0.8125rem; line-height: 1.45; color: var(--bs-ink-soft); }
.dp__check { position: absolute; right: 14px; bottom: 14px; color: var(--bs-ink-faint); }
.dp__card--on .dp__check { color: var(--bs-accent); }
@media (max-width: 860px) {
  .dp { grid-template-columns: 1fr; }
  .dp__card { flex-direction: row; align-items: center; }
  .dp__swatch { width: 56px; height: 56px; flex: none; }
  .dp__desc { display: none; }
  .dp__check { position: static; margin-left: auto; }
  .dp__body { padding-right: 0; }
}
</style>
