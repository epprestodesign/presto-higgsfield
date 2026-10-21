<script setup>
// AdSlot — renders every placement configured for one page slot (e.g.
// 'browse.rail'): each placement's `count` units, rotating through its sponsors.
// Below 600px the slot swaps to its mobile size (AD_SLOTS[...].mobile) or hides
// entirely when the slot has no mobile size (right rails), so ads never crowd
// the room-selection UX on phones.
import { computed } from 'vue'
import AdCreative from './AdCreative.vue'
import { slotById } from '../../models/ads.js'

const props = defineProps({
  slotId: { type: String, required: true },
  // All placements for the page; only those for slotId render.
  placements: { type: Array, default: () => [] },
  sponsors: { type: Array, default: () => [] },
  interactive: { type: Boolean, default: false },
  // Show empty dimension-labelled boxes when no sponsor is assigned.
  showPlaceholders: { type: Boolean, default: true },
})

const slot = computed(() => slotById(props.slotId))
const vertical = computed(() => /\.rail$/.test(props.slotId))

// Offset rotation per slot so the rail and the billboard don't open on the
// same sponsor.
const offset = computed(() => [...props.slotId].reduce((a, c) => a + c.charCodeAt(0), 0))

const units = computed(() => {
  const out = []
  props.placements
    .filter((p) => p.slot === props.slotId)
    .forEach((p, pi) => {
      const pool = (p.sponsorIds || []).map((id) => props.sponsors.find((s) => s.id === id)).filter(Boolean)
      for (let i = 0; i < (p.count || 1); i++) {
        const sponsor = pool.length ? pool[(i + offset.value) % pool.length] : null
        out.push({ key: `${p.id}-${i}`, size: p.size, sponsor, index: pi * 10 + i })
      }
    })
  return out.filter((u) => u.sponsor || props.showPlaceholders)
})

// Mobile: one unit at the slot's mobile size (first sponsor), or nothing.
const mobileUnit = computed(() => {
  const m = slot.value?.mobile
  if (!m || !units.value.length) return null
  return { ...units.value[0], size: m, key: units.value[0].key + '-m' }
})
</script>

<template>
  <div
    v-if="units.length"
    class="ads"
    :class="{ 'ads--vertical': vertical, 'ads--no-mobile': !mobileUnit }"
    :data-slot="slotId"
  >
    <div class="ads__desktop">
      <ad-creative v-for="u in units" :key="u.key" :sponsor="u.sponsor" :size="u.size" :interactive="interactive" />
    </div>
    <div v-if="mobileUnit" class="ads__mobile">
      <ad-creative :sponsor="mobileUnit.sponsor" :size="mobileUnit.size" :interactive="interactive" />
    </div>
  </div>
</template>

<style scoped>
.ads { width: 100%; }
.ads__desktop { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: 20px; }
.ads--vertical .ads__desktop { flex-direction: column; flex-wrap: nowrap; align-items: center; }
.ads__mobile { display: none; justify-content: center; }

@media (max-width: 600px) {
  .ads__desktop { display: none; }
  .ads__mobile { display: flex; }
  .ads--no-mobile { display: none; }
}
</style>
