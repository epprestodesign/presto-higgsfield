<script setup>
// DisplayAd — advertising slot placeholder. Renders a dashed box in the brand
// (primary) color that labels its own dimensions. Default is 340×215.
const props = defineProps({
  width: { type: Number, default: 340 },
  height: { type: Number, default: 215 },
  // Override the auto label ("Display Ad {w}x{h}").
  label: { type: String, default: '' },
})
</script>

<template>
  <div
    class="dad"
    :style="{ width: width + 'px', height: height + 'px' }"
    role="img"
    :aria-label="label || `Display Ad ${width}x${height}`"
  >
    <span class="dad__label">{{ label || `Display Ad ${width}x${height}` }}</span>
  </div>
</template>

<style scoped>
.dad {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  border: 2px dotted var(--ds-color-background-brand-bold);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-background-brand-bold);
  background: transparent;
}
.dad__label {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}
</style>
