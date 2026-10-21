<script setup>
// AdPresetThumb — a tiny schematic of a page with its ad positions, so a
// preset reads at a glance ("rail ×2", "billboard after rooms").
import { computed } from 'vue'

const props = defineProps({
  page: { type: String, required: true }, // landing | browse | details
  placements: { type: Array, default: () => [] },
})

const has = (slot) => props.placements.find((p) => p.slot === `${props.page}.${slot}`)
const rail = computed(() => has('rail'))
const railCount = computed(() => Math.min(rail.value?.count || 0, 3))
const railNarrow = computed(() => rail.value?.size === '120x600')
const top = computed(() => has('top'))
const bottom = computed(() => has('bottom') || has('afterContent'))
const mid = computed(() => has('afterRooms'))
const short = (p) => (p?.size || '').endsWith('x90')
const rects = computed(() => {
  const ac = has('afterContent')
  return ac && ac.size === '300x250' ? ac.count : 0
})
</script>

<template>
  <svg class="apt" viewBox="0 0 72 52" aria-hidden="true">
    <rect x="0.5" y="0.5" width="71" height="51" rx="4" class="apt__page" />
    <rect x="0.5" y="0.5" width="71" height="9" rx="4" class="apt__hero" />
    <rect x="0.5" y="6" width="71" height="3.5" class="apt__hero" />
    <!-- content column -->
    <g v-if="page === 'browse'">
      <rect x="5" :y="top ? 21 : 14" width="12" height="20" rx="1.5" class="apt__block" />
      <rect x="20" :y="top ? 21 : 14" :width="rail ? (railNarrow ? 37 : 34) : 47" height="6" rx="1.5" class="apt__block" />
      <rect x="20" :y="top ? 29 : 22" :width="rail ? (railNarrow ? 37 : 34) : 47" height="6" rx="1.5" class="apt__block" />
      <rect v-if="!top" x="20" y="30" :width="rail ? (railNarrow ? 37 : 34) : 47" height="6" rx="1.5" class="apt__block" />
    </g>
    <g v-else-if="page === 'details'">
      <rect x="5" y="13" width="62" height="9" rx="1.5" class="apt__block" />
      <rect x="5" y="25" width="19" height="7" rx="1.5" class="apt__block" />
      <rect x="27" y="25" width="19" height="7" rx="1.5" class="apt__block" />
      <rect x="49" y="25" width="18" height="7" rx="1.5" class="apt__block" />
      <rect x="5" :y="mid ? 43 : 35" :width="rail ? 50 : 62" height="5" rx="1.5" class="apt__block" />
    </g>
    <g v-else>
      <rect x="14" y="12" width="44" height="5" rx="1.5" class="apt__block" />
      <rect x="18" y="20" width="36" height="3" rx="1" class="apt__block" />
      <rect x="18" y="25" width="36" height="3" rx="1" class="apt__block" />
    </g>

    <!-- ads -->
    <rect v-if="top" x="10" y="12" width="52" :height="short(top) ? 4 : 7" rx="1" class="apt__ad" />
    <template v-if="rail">
      <rect
        v-for="n in railCount"
        :key="n"
        :x="railNarrow ? 61 : 58"
        :y="page === 'details' ? 34 + (n - 1) * 8 : (top ? 21 : 14) + (n - 1) * 9"
        :width="railNarrow ? 6 : 9"
        height="7"
        rx="1"
        class="apt__ad"
      />
    </template>
    <rect v-if="mid" x="10" y="35" width="52" height="6" rx="1" class="apt__ad" />
    <template v-if="rects">
      <rect v-for="n in rects" :key="n" :x="9 + (n - 1) * 19" y="33" width="16" height="13" rx="1" class="apt__ad" />
    </template>
    <rect v-else-if="bottom" x="10" :y="short(bottom) ? 44 : 41" width="52" :height="short(bottom) ? 4 : 7" rx="1" class="apt__ad" />
  </svg>
</template>

<style scoped>
.apt { width: 100%; height: auto; display: block; }
.apt__page { fill: #fff; stroke: var(--bs-line-strong); }
.apt__hero { fill: var(--bs-ink-faint); opacity: 0.45; }
.apt__block { fill: var(--bs-line); }
.apt__ad { fill: #34D399; opacity: 0.9; }
</style>
