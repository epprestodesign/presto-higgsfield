<script setup>
// AdSlot — renders every placement configured for one page slot (e.g.
// 'browse.rail'): each placement's `count` units, rotating through its sponsors.
// Below 600px the slot swaps to its mobile size (AD_SLOTS[...].mobile) or hides
// entirely when the slot has no mobile size (right rails), so ads never crowd
// the room-selection UX on phones.
//
// Right rails (vertical slots) follow `railMode` (models/ads.js RAIL_MODES):
// the rail is pinned only when all of its units fit the viewport, so a tall
// rail (e.g. 2 × 160×600) scrolls and every unit gets seen; 'always' pins the
// last unit of a tall rail; 'off' never pins. The page's own sticky rail is
// neutralised by the Branded* wrappers so these rules apply.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AdCreative from './AdCreative.vue'
import { slotById, AD_SIZES } from '../../models/ads.js'

const props = defineProps({
  slotId: { type: String, required: true },
  // All placements for the page; only those for slotId render.
  placements: { type: Array, default: () => [] },
  sponsors: { type: Array, default: () => [] },
  interactive: { type: Boolean, default: false },
  // Show empty dimension-labelled boxes when no sponsor is assigned.
  showPlaceholders: { type: Boolean, default: true },
  railMode: { type: String, default: 'auto' }, // auto | always | off
  stickyTop: { type: Number, default: 24 },
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

// ── Rail pinning ─────────────────────────────────────────────────────────
const GAP = 20
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
const onResize = () => (vh.value = window.innerHeight)
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
const railHeight = computed(() => units.value.reduce((n, u, i) => n + (AD_SIZES[u.size]?.height || 0) + (i ? GAP : 0), 0))
const fits = computed(() => railHeight.value + props.stickyTop * 2 <= vh.value)
// 'all' → the whole stack pins · 'last' → only the last unit pins · 'none'
const pin = computed(() => {
  if (!vertical.value || props.railMode === 'off') return 'none'
  if (fits.value) return 'all'
  return props.railMode === 'always' && units.value.length > 1 ? 'last' : 'none'
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
    :data-pin="vertical ? pin : undefined"
    :style="{ '--ads-top': `${stickyTop}px` }"
  >
    <div class="ads__desktop" :class="{ 'is-pinned': pin === 'all', 'is-pin-last': pin === 'last' }">
      <template v-for="(u, i) in units" :key="u.key">
        <div v-if="pin === 'last' && i === units.length - 1" class="ads__pin">
          <ad-creative :sponsor="u.sponsor" :size="u.size" :interactive="interactive" />
        </div>
        <ad-creative v-else :sponsor="u.sponsor" :size="u.size" :interactive="interactive" />
      </template>
    </div>
    <div v-if="mobileUnit" class="ads__mobile">
      <ad-creative :sponsor="mobileUnit.sponsor" :size="mobileUnit.size" :interactive="interactive" />
    </div>
  </div>
</template>

<style scoped>
.ads { width: 100%; }
.ads__desktop { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: 20px; }
.ads--vertical { height: 100%; flex: 1 1 auto; width: 100%; }
.ads--vertical .ads__desktop { flex-direction: column; flex-wrap: nowrap; align-items: center; }
.ads--vertical .ads__desktop.is-pinned,
.ads__pin { position: sticky; top: var(--ads-top, 24px); }
/* The last unit travels down the full rail column. */
.ads--vertical .ads__desktop.is-pin-last { height: 100%; justify-content: flex-start; }
.ads__mobile { display: none; justify-content: center; }

@media (max-width: 600px) {
  .ads__desktop { display: none; }
  .ads__mobile { display: flex; }
  .ads--no-mobile { display: none; }
}
</style>
