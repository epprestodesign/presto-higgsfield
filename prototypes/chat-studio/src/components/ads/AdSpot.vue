<script setup>
// One spot on a Presto page (Banner 1, Skyscraper 2, Leaderboard…) and the ad
// in it, at the spot's size. An empty spot offers "Fill this spot"; a filled
// one has Edit (opens the ad below the row) and Delete (with Undo, below).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Icon.vue'
import AdPreview from './AdPreview.vue'
import { AD_SIZES, PURPOSES, removeAd } from '../../ads.js'

const props = defineProps({
  project: { type: Object, required: true },
  spot: { type: Object, required: true },
  ad: { type: Object, default: null },
  open: { type: Boolean, default: false }, // being edited / filled below the row
})
const emit = defineEmits(['fill', 'edit'])
const W = computed(() => AD_SIZES[props.spot.size].width)
const H = computed(() => AD_SIZES[props.spot.size].height)
const state = computed(() => props.ad?.sizes[props.spot.size] || 'idle')
const purpose = computed(() => PURPOSES.find((p) => p.id === props.ad?.purpose))
// Preview box: the spot's true proportions, scaled down to fit the card.
const stage = ref(null)
const avail = ref(320)
let ro
onMounted(() => { ro = new ResizeObserver(([e]) => { avail.value = Math.floor(e.contentRect.width) }); ro.observe(stage.value) })
onBeforeUnmount(() => ro?.disconnect())
const box = computed(() => ({ maxWidth: Math.min(W.value, avail.value), maxHeight: Math.min(H.value, 300) }))
</script>

<template>
  <article class="sp" :class="[`is-${state}`, { 'is-open': open, 'is-empty': !ad }]">
    <header class="sp__head">
      <b>{{ spot.label }}</b>
      <small>{{ spot.size.replace('x', '×') }}<template v-if="spot.mobile"> · phones {{ spot.mobile.replace('x', '×') }}</template><template v-else> · hidden on phones</template></small>
    </header>

    <div ref="stage" class="sp__stage">
      <AdPreview v-if="ad && state === 'ready'" :ad="ad" :size="spot.size" :max-width="box.maxWidth" :max-height="box.maxHeight" />
      <div v-else-if="ad && state === 'working'" class="sp__working" :style="{ aspectRatio: `${W} / ${H}`, width: `${Math.min(box.maxWidth, box.maxHeight * W / H)}px` }"><span /> Designing…</div>
      <button
        v-else type="button" class="sp__fill" :class="{ 'is-on': open }" :aria-expanded="open"
        :style="{ aspectRatio: `${W} / ${H}`, width: `${Math.min(box.maxWidth, box.maxHeight * W / H)}px` }"
        @click="ad ? emit('edit') : emit('fill')"
      ><Icon name="plus" :size="18" /> <span>{{ ad ? 'Design this ad' : 'Fill this spot' }}</span></button>
    </div>

    <footer v-if="ad" class="sp__foot">
      <span class="sp__name"><b>{{ ad.name }}</b><small>{{ purpose?.label }}<template v-if="ad.overrides?.[spot.size]"> · own changes</template></small></span>
      <span class="sp__acts">
        <button type="button" class="sp__act" :class="{ 'is-on': open }" :aria-expanded="open" :aria-label="`Edit ${ad.name} in ${spot.label}`" @click="emit('edit')"><Icon name="pencil" :size="15" /> Edit</button>
        <button type="button" class="sp__act is-del" :aria-label="`Delete ${ad.name} from ${spot.label}`" @click="removeAd(project, ad)"><Icon name="x" :size="15" /> Delete</button>
      </span>
    </footer>
    <p v-else class="sp__open">Open: a sponsor, your FAQ, About or Sponsors page.</p>
  </article>
</template>

<style scoped>
.sp { min-width: 0; display: grid; gap: 10px; align-content: start; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); }
.sp.is-open { border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.sp.is-empty { border-style: dashed; border-color: var(--line-bold); background: var(--surface-2); }
.sp__head { display: flex; align-items: baseline; justify-content: space-between; gap: 4px 8px; flex-wrap: wrap; }
.sp__head b { font-size: 15px; }
.sp__head small { color: var(--ink-3); font-size: 12px; }
.sp__stage { min-width: 0; display: grid; place-items: center; min-height: 90px; padding: 12px; border-radius: var(--r); background: var(--surface-3); }
.sp__fill { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; max-width: 100%; min-height: 60px; padding: 8px; border: 1.5px dashed var(--line-bold); border-radius: 2px; background: rgba(255, 255, 255, 0.7); color: var(--ink); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.sp__fill:hover, .sp__fill.is-on { border-color: var(--navy-900); background: #fff; }
.sp__working { display: flex; align-items: center; justify-content: center; gap: 8px; max-width: 100%; min-height: 60px; border-radius: 2px; background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0) 0 0 / 200% 100%; animation: shimmer 1.2s linear infinite; color: var(--ink-2); font-size: 13px; }
.sp__working span { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--navy-100); border-top-color: var(--pill); animation: spin 0.8s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
.sp__foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp__name { flex: 1; min-width: 120px; display: grid; }
.sp__name b { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp__name small { color: var(--ink-3); font-size: 12px; }
.sp__acts { display: flex; gap: 4px; }
.sp__act { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.sp__act:hover, .sp__act.is-on { border-color: var(--navy-900); }
.sp__act.is-on { background: var(--navy-50); }
.sp__act.is-del:hover { border-color: #b91c1c; color: #b91c1c; }
.sp__open { margin: 0; color: var(--ink-3); font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .sp__working, .sp__working span { animation: none; } }
</style>
