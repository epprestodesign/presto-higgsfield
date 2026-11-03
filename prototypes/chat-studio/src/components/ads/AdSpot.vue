<script setup>
// One spot on a Presto page (Banner 1, Skyscraper 2, Leaderboard…) and the ad
// in it, at the spot's size. An empty spot offers "Fill this spot"; a filled
// one has Edit (opens the ad below the row), Delete (with Undo, below) and
// the Higgsfield model that made it, with "Try another model".
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { MODELS, modelById, AD_TYPES, typeById } from '../../imageModels.js'
import Icon from '../Icon.vue'
import AdPreview from './AdPreview.vue'
import { AD_SIZES, PURPOSES, removeAd, useModel, useType } from '../../ads.js'

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
const gen = computed(() => props.ad?.gen?.[props.spot.size])
const models = ref(false)
const looks = ref(false)
function pick(id) { models.value = false; useModel(props.project, props.ad, id) }
function look(id) { looks.value = false; useType(props.project, props.ad, id) }
function menuOut(e) { if (!e.currentTarget.contains(e.relatedTarget)) { models.value = false; looks.value = false } }
// The project's picked looks first in the menu.
const lookList = computed(() => { const mine = props.project.ads.looks || []; return [...AD_TYPES].sort((a, b) => mine.includes(b.id) - mine.includes(a.id)) })
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
      <span v-if="gen" class="sp__model" @focusout="menuOut" @keydown.esc="models = false; looks = false">
        <button type="button" class="sp__modelbtn" :aria-expanded="looks" :aria-label="`Look: ${typeById(ad.type)?.label || 'none'}. Change look`" @click="looks = !looks; models = false">
          <Icon name="palette" :size="14" /> {{ typeById(ad.type)?.label || 'Pick a look' }} <Icon name="down" :size="14" />
        </button>
        <span v-if="looks" class="sp__menu is-looks" role="menu" :aria-label="`Change the look of ${ad.name}`">
          <small class="sp__menuhead">Change look</small>
          <button v-for="t in lookList" :key="t.id" type="button" role="menuitemradio" :aria-checked="ad.type === t.id" :class="{ 'is-on': ad.type === t.id }" :disabled="state === 'working'" @click="look(t.id)">
            <b>{{ t.label }}<em v-if="(project.ads.looks || []).includes(t.id)"> · your pick</em></b><small>{{ t.note }}</small>
          </button>
        </span>
        <button type="button" class="sp__modelbtn" :aria-expanded="models" :title="`Made with ${modelById(gen.model).label}: ${gen.why}`" @click="models = !models; looks = false">
          <Icon name="spark" :size="14" /> {{ modelById(gen.model).label }} <Icon name="down" :size="14" />
        </button>
        <span v-if="models" class="sp__menu" role="menu" :aria-label="`Try another model for ${ad.name}`">
          <small class="sp__menuhead">Try another model</small>
          <button v-for="m in MODELS" :key="m.id" type="button" role="menuitemradio" :aria-checked="gen.model === m.id" :class="{ 'is-on': gen.model === m.id }" :disabled="state === 'working'" @click="pick(m.id)">
            <b>{{ m.label }}</b><small>{{ m.note }}</small>
          </button>
          <button v-if="ad.model" type="button" role="menuitem" class="sp__menuauto" @click="pick(null)"><b>Let the agent pick</b><small>Best model for each size</small></button>
        </span>
      </span>
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
.sp__model { position: relative; flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 4px; }
.sp__menu.is-looks { max-height: 320px; overflow-y: auto; }
.sp__menu button b em { color: var(--ink-3); font-style: normal; font-weight: 400; }
.sp__modelbtn { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 8px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.sp__modelbtn:hover, .sp__modelbtn[aria-expanded='true'] { border-color: var(--navy-900); color: var(--ink); }
.sp__menu { position: absolute; left: 0; top: calc(100% + 4px); z-index: 30; display: grid; width: min(300px, 80vw); padding: 6px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); }
.sp__menuhead { padding: 4px 8px 6px; color: var(--ink-3); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.sp__menu button { display: grid; gap: 1px; padding: 7px 8px; border: 0; border-radius: var(--r); background: none; text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.sp__menu button:hover, .sp__menu button.is-on { background: var(--selected); }
.sp__menu button b { font-size: 13px; }
.sp__menu button small { color: var(--ink-3); font-size: 12px; }
.sp__menuauto { border-top: 1px solid var(--line) !important; border-radius: 0 0 var(--r) var(--r) !important; margin-top: 4px; }
.sp__open { margin: 0; color: var(--ink-3); font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .sp__working, .sp__working span { animation: none; } }
</style>
