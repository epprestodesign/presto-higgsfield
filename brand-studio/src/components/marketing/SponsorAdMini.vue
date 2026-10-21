<script setup>
// SponsorAdMini — lightweight HTML sponsor creative for marketing diagrams.
// (The full, editable creative lives in components/ads.) Always labeled
// "Sponsored"; adapts its layout to the unit's aspect ratio.
import { computed } from 'vue'

const props = defineProps({
  sponsor: { type: Object, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
})
const shape = computed(() => {
  const r = props.width / props.height
  if (r >= 4) return 'wide'
  if (r <= 0.5) return 'tall'
  return 'box'
})
</script>

<template>
  <div
    class="sam" :class="`sam--${shape}`"
    :style="{ width: width + 'px', height: height + 'px', background: sponsor.colors.background, color: sponsor.colors.foreground }"
  >
    <span class="sam__label">Sponsored</span>
    <img v-if="sponsor.logo" :src="sponsor.logo.src" alt="" class="sam__logo" />
    <div class="sam__copy">
      <strong class="sam__name">{{ sponsor.name }}</strong>
      <span v-if="height > 100" class="sam__tag">{{ sponsor.tagline }}</span>
    </div>
    <span class="sam__cta" :style="{ background: sponsor.colors.accent, color: sponsor.colors.background }">{{ sponsor.cta }}</span>
  </div>
</template>

<style scoped>
.sam { position: relative; box-sizing: border-box; overflow: hidden; border-radius: 4px; display: flex; align-items: center; gap: 14px; padding: 14px; font-family: var(--bs-font); }
.sam__label { position: absolute; top: 4px; right: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.75; }
.sam__logo { width: 56px; height: 56px; object-fit: contain; flex: none; }
.sam__copy { display: grid; gap: 4px; min-width: 0; }
.sam__name { font-size: 18px; line-height: 1.1; }
.sam__tag { font-size: 13px; line-height: 1.3; opacity: 0.9; }
.sam__cta { flex: none; padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; white-space: nowrap; }
.sam--wide { justify-content: flex-start; }
.sam--wide .sam__cta { margin-left: auto; }
.sam--tall { flex-direction: column; justify-content: center; text-align: center; padding: 28px 10px; gap: 18px; }
.sam--tall .sam__logo { width: 72px; height: 72px; }
.sam--tall .sam__name { font-size: 20px; }
.sam--tall .sam__cta { white-space: normal; }
.sam--box { flex-direction: column; justify-content: center; text-align: center; }
</style>
