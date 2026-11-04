<script setup>
// One ad in every size the event offers, laid out as a mosaic at true
// proportions: skyscrapers down the left, leaderboards and billboards stacked
// on the right, rectangles in a row, phone banners at the bottom. Sizes not
// designed yet are dashed outlines. Hover a size (or use the arrows / ← →) and
// it comes forward while the rest dim, like the banner and logo stacks. Click
// to open the event's Advertisements.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Icon.vue'
import AdPreview from './AdPreview.vue'
import { AD_SIZES, adSizes, readySizes } from '../../ads.js'

const props = defineProps({
  ad: { type: Object, required: true },
  project: { type: Object, required: true },
  label: { type: String, required: true },
})
const emit = defineEmits(['open'])

// The mosaic is laid out on a 640 × 400 stage, then scaled to the card.
const W = 640
const H = 400
const PAD = 22
const GAP = 14
const sizes = computed(() => {
  const all = new Set([...adSizes(props.project.ads, props.ad), ...readySizes(props.ad)])
  return [...all].filter((s) => AD_SIZES[s])
})
const ready = (s) => props.ad.sizes[s] === 'ready'
const ratio = (s) => AD_SIZES[s].width / AD_SIZES[s].height
const kindOf = (s) => (ratio(s) < 0.7 ? 'tall' : AD_SIZES[s].width <= 320 && AD_SIZES[s].height <= 100 ? 'phone' : ratio(s) > 2.2 ? 'wide' : 'box')

const tiles = computed(() => {
  const by = { tall: [], wide: [], box: [], phone: [] }
  for (const s of sizes.value) by[kindOf(s)].push(s)
  const out = []
  const innerH = H - PAD * 2 - 14 // room for the dots
  // Left: skyscrapers, full height, side by side.
  let x = PAD
  for (const s of by.tall.slice(0, 2)) {
    const h = innerH
    const w = h * ratio(s)
    out.push({ s, x, y: PAD, w, h })
    x += w + GAP
  }
  for (const s of by.tall.slice(2)) by.box.push(s)
  // Right: rows (each wide size, then the boxes, then the phone sizes), scaled to fit.
  const left = by.tall.length ? x : PAD
  const RW = W - PAD - left
  const rows = [...by.wide.map((s) => [s]), ...(by.box.length ? [by.box] : []), ...(by.phone.length ? [by.phone] : [])]
  const rowH = (row) => { const each = (RW - GAP * (row.length - 1)) / row.length; return Math.min(...row.map((s) => each / ratio(s))) }
  const gaps = GAP * Math.max(0, rows.length - 1)
  const natural = rows.reduce((t, r) => t + rowH(r), 0) || 1
  const k = Math.min(1, (innerH - gaps) / natural)
  let y = PAD + (innerH - natural * k - gaps) / 2
  for (const row of rows) {
    const h = rowH(row) * k
    const widths = row.map((s) => h * ratio(s))
    let cx = left + (RW - widths.reduce((a, b) => a + b, 0) - GAP * (row.length - 1)) / 2
    row.forEach((s, i) => { out.push({ s, x: cx, y, w: widths[i], h }); cx += widths[i] + GAP })
    y += h + GAP
  }
  // Reading order for the arrows: left to right, top to bottom.
  return out.sort((a, b) => (Math.abs(a.x - b.x) > 40 ? a.x - b.x : a.y - b.y))
})

const at = ref(-1) // -1 = nothing focused
const hover = ref(false)
const focus = computed(() => tiles.value[at.value])
function step(by) { const n = tiles.value.length; at.value = ((at.value < 0 ? (by > 0 ? -1 : 0) : at.value) + by + n) % n }
function key(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1) } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
}
function leave() { hover.value = false; at.value = -1 }
const caption = computed(() => focus.value && `${AD_SIZES[focus.value.s].name} · ${focus.value.s.replace('x', '×')}${ready(focus.value.s) ? '' : ' · not designed yet'}`)
const done = computed(() => sizes.value.filter(ready).length)

// Scale the stage to the card's width.
const root = ref(null)
const scale = ref(1)
let ro
onMounted(() => {
  ro = new ResizeObserver(([e]) => { scale.value = e.contentRect.width / W })
  ro.observe(root.value)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div ref="root" class="am" :class="{ 'is-hover': hover, 'has-focus': at >= 0 }" @pointerenter="hover = true" @pointerleave="leave">
    <button
      type="button" class="am__open"
      :aria-label="`Open ${label}. ${done} of ${sizes.length} sizes designed.${caption ? ` Showing ${caption}.` : ''} Use the arrow keys to go through the sizes.`"
      @click="emit('open')" @keydown="key" @focus="hover = true" @blur="leave"
    >
      <span class="am__stage" :style="{ width: `${W}px`, height: `${H}px`, transform: `scale(${scale})` }">
        <span
          v-for="(t, i) in tiles" :key="t.s" class="am__tile" :class="{ 'is-focus': i === at, 'is-empty': !ready(t.s) }"
          :style="{ left: `${t.x}px`, top: `${t.y}px`, width: `${t.w}px`, height: `${t.h}px` }"
          @pointerenter="at = i"
        >
          <AdPreview v-if="ready(t.s)" :ad="ad" :size="t.s" :max-width="t.w" :max-height="t.h" />
          <span v-else class="am__ghost"><b>{{ t.s.replace('x', '×') }}</b><small v-if="t.h > 40">Not designed yet</small></span>
        </span>
      </span>
    </button>

    <button type="button" class="am__arrow is-prev" aria-label="Previous size" tabindex="-1" @click.stop="step(-1)"><Icon name="left" :size="18" /></button>
    <button type="button" class="am__arrow is-next" aria-label="Next size" tabindex="-1" @click.stop="step(1)"><Icon name="right" :size="18" /></button>
    <div class="am__foot" aria-hidden="true">
      <span class="am__dots"><i v-for="(t, i) in tiles" :key="t.s" :class="{ 'is-on': i === at, 'is-empty': !ready(t.s) }" /></span>
      <span class="am__cap">{{ caption || `${done} of ${sizes.length} sizes designed` }}</span>
    </div>
  </div>
</template>

<style scoped>
.am { position: relative; aspect-ratio: 16 / 10; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface-3); overflow: hidden; }
.am.is-hover { box-shadow: var(--shadow-overlay); border-color: var(--line-bold); }
.am__open { position: absolute; inset: 0; padding: 0; border: 0; background: none; cursor: pointer; }
.am__open:focus-visible { outline: 2px solid var(--navy-900); outline-offset: -4px; border-radius: var(--r-card); }
.am__stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.am__tile { position: absolute; display: grid; place-items: center; transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease; }
.am__tile :deep(.ap) { box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12), 0 10px 26px rgba(15, 23, 42, 0.14); }
.am.has-focus .am__tile:not(.is-focus) { opacity: 0.35; filter: saturate(0.6); }
.am__tile.is-focus { z-index: 2; transform: scale(1.08); }
.am__tile.is-focus :deep(.ap) { box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18), 0 22px 48px rgba(15, 23, 42, 0.28); }
.am__ghost { display: grid; place-items: center; align-content: center; gap: 2px; width: 100%; height: 100%; border: 1.5px dashed var(--line-bold); border-radius: 2px; background: rgba(255, 255, 255, 0.6); color: var(--ink-3); text-align: center; }
.am__ghost b { font-size: 13px; color: var(--ink-2); }
.am__ghost small { font-size: 11px; }
.am__arrow { position: absolute; top: 46%; z-index: 5; display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface); color: var(--ink); box-shadow: var(--shadow); cursor: pointer; opacity: 0; transition: opacity 0.2s; }
.am__arrow.is-prev { left: 10px; }
.am__arrow.is-next { right: 10px; }
.am.is-hover .am__arrow { opacity: 1; }
.am__foot { position: absolute; left: 0; right: 0; bottom: 8px; z-index: 5; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 12px; color: var(--ink-2); pointer-events: none; }
.am__dots { display: inline-flex; gap: 4px; }
.am__dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line-bold); transition: background 0.2s, width 0.2s; }
.am__dots i.is-empty { background: none; box-shadow: inset 0 0 0 1px var(--line-bold); }
.am__dots i.is-on { width: 16px; border-radius: 3px; background: var(--navy-900); box-shadow: none; }
.am__cap { white-space: nowrap; }
@media (hover: none) { .am__arrow { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .am__tile { transition: none; } }
</style>
