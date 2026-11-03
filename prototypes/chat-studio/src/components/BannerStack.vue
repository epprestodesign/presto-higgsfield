<script setup>
// One project's landing-page banners as a stack (newest in front, like the
// Pages stacks). Hover and the back ones lift so you can peek at them; move
// across the card to flip through, or use the arrows / ← →. Click the front one
// to open the project.
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  banners: { type: Array, required: true }, // newest first: { key, src, filter, set, mood, kind }
  label: { type: String, required: true },
})
const emit = defineEmits(['open'])
const at = ref(0)
const hover = ref(false)
const n = computed(() => props.banners.length)
watch(n, () => { if (at.value >= n.value) at.value = 0 })
const front = computed(() => props.banners[at.value])

// Depth of each banner from the front (0), wrapping round.
const depth = (i) => (i - at.value + n.value) % n.value
const SHOW = 3
function style(i) {
  const d = depth(i)
  const lift = hover.value ? 19 : 14
  const top = (hover.value ? 44 : 40) - Math.min(d, SHOW) * lift
  return {
    top: `${top}%`,
    width: `${86 - Math.min(d, SHOW) * 8}%`,
    zIndex: n.value - d,
    opacity: d < SHOW ? 1 : 0,
    filter: d ? `brightness(${1 - d * 0.08})` : undefined,
  }
}
function step(by) { at.value = (at.value + by + n.value) % n.value }
function scrub(e) {
  if (n.value < 2 || e.pointerType === 'touch') return
  const r = e.currentTarget.getBoundingClientRect()
  at.value = Math.min(n.value - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n.value)))
}
function key(e) {
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1) } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
}
const caption = computed(() => front.value && [`Set ${front.value.set}`, front.value.mood, front.value.kind].filter(Boolean).join(' · '))
</script>

<template>
  <div class="bs" :class="{ 'is-hover': hover }" @pointerenter="hover = true" @pointerleave="hover = false" @pointermove="scrub">
    <button
      type="button" class="bs__open" :aria-label="`Open ${label}. Banner ${at + 1} of ${n}: ${caption}. Use the arrow keys to flip through.`"
      @click="emit('open', front)" @keydown="key" @focus="hover = true" @blur="hover = false"
    >
      <span
        v-for="(b, i) in banners" :key="b.key" class="bs__layer" :class="{ 'is-front': i === at }" :style="style(i)"
      ><img :src="b.src" alt="" :style="{ filter: b.filter || undefined }" /></span>
    </button>

    <template v-if="n > 1">
      <button type="button" class="bs__arrow is-prev" aria-label="Previous banner" tabindex="-1" @click.stop="step(-1)"><Icon name="left" :size="18" /></button>
      <button type="button" class="bs__arrow is-next" aria-label="Next banner" tabindex="-1" @click.stop="step(1)"><Icon name="right" :size="18" /></button>
      <div class="bs__foot" aria-hidden="true">
        <span class="bs__dots"><i v-for="(b, i) in banners" :key="b.key" :class="{ 'is-on': i === at }" /></span>
        <span class="bs__cap">{{ at + 1 }} / {{ n }} · {{ caption }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bs { position: relative; aspect-ratio: 16 / 10; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface-3); overflow: hidden; }
.bs.is-hover { box-shadow: var(--shadow-overlay); border-color: var(--line-bold); }
.bs__open { position: absolute; inset: 0; padding: 0; border: 0; background: none; cursor: pointer; }
.bs__open:focus-visible { outline: 2px solid var(--navy-900); outline-offset: -4px; border-radius: var(--r-card); }
.bs__layer { position: absolute; left: 50%; aspect-ratio: 1440 / 500; overflow: hidden; border-radius: var(--r); border: 1px solid rgba(15, 23, 42, 0.08); background: #0b1220; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1), 0 14px 34px rgba(15, 23, 42, 0.18); transform: translateX(-50%); transition: top 0.35s ease, width 0.35s ease, opacity 0.35s ease, filter 0.35s ease; }
.bs__layer img { display: block; width: 100%; height: 100%; object-fit: cover; }
.bs__arrow { position: absolute; top: 58%; z-index: 50; display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface); color: var(--ink); box-shadow: var(--shadow); cursor: pointer; opacity: 0; transition: opacity 0.2s; }
.bs__arrow.is-prev { left: 10px; }
.bs__arrow.is-next { right: 10px; }
.bs.is-hover .bs__arrow { opacity: 1; }
.bs__foot { position: absolute; left: 0; right: 0; bottom: 8px; z-index: 50; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 12px; color: var(--ink-2); pointer-events: none; }
.bs__dots { display: inline-flex; gap: 4px; }
.bs__dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line-bold); transition: background 0.2s, width 0.2s; }
.bs__dots i.is-on { width: 16px; border-radius: 3px; background: var(--navy-900); }
.bs__cap { opacity: 0; transition: opacity 0.2s; white-space: nowrap; }
.bs.is-hover .bs__cap { opacity: 1; }
@media (hover: none) { .bs__arrow { opacity: 1; } .bs__cap { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .bs__layer { transition: none; } }
</style>
