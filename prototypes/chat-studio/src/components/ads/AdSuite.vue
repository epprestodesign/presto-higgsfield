<script setup>
// One ad across every size the event offers: each size is ready (preview),
// being designed, or waiting — design it on its own or the whole package.
// Changes are asked for in plain words underneath. Hover a finished size to
// Edit it (it's attached to the ask box as context, and the change applies to
// that size only unless you tick "every size") or Delete it (with Undo).
import { computed, nextTick, ref } from 'vue'
import Icon from '../Icon.vue'
import AdPreview from './AdPreview.vue'
import { AD_SIZES, PURPOSES, packageSizes, designSize, designPackage, reviseAd, removeSize } from '../../ads.js'
import { adsChat } from '../../mockAgent.js'

const props = defineProps({
  project: { type: Object, required: true },
  ad: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
const sizes = computed(() => packageSizes(props.project.ads))
const purpose = computed(() => PURPOSES.find((p) => p.id === props.ad.purpose))
const state = (s) => props.ad.sizes[s] || 'idle'
const idle = computed(() => sizes.value.filter((s) => state(s) === 'idle'))
const working = computed(() => sizes.value.some((s) => state(s) === 'working'))
const ready = computed(() => sizes.value.filter((s) => state(s) === 'ready').length)
const how = computed(() => (props.ad.how === 'upload' ? 'Re-fitted from your upload' : 'Designed with Higgsfield'))

function one(size) { designSize(props.project, props.ad, size) }
function all() {
  adsChat(props.project, `Design the whole package for ${props.ad.name}`, `Designing **${props.ad.name}** in ${idle.value.length} more ${idle.value.length === 1 ? 'size' : 'sizes'}.`, props.ad.id)
  designPackage(props.project, props.ad)
}

const ask = ref('')
const askBox = ref(null)
const CHIPS = ['Darker', 'Use our event colours', 'Shorter line', 'Change the button']
const sizeName = (s) => `${s.replace('x', '×')} ${AD_SIZES[s].name}`

// Edit: the size you're tweaking rides along with the request as context.
const ctx = ref('')
const everySize = ref(false)
function edit(s) {
  ctx.value = s
  everySize.value = false
  nextTick(() => { askBox.value?.focus(); askBox.value?.closest('.as__ask')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) })
}
function revise(text) {
  const t = (text || ask.value).trim()
  if (!t || working.value) return
  const one = ctx.value && !everySize.value ? ctx.value : null
  const extra = ctx.value ? { adRef: { adId: props.ad.id, size: ctx.value } } : {}
  adsChat(
    props.project,
    ctx.value ? `${t}` : `${props.ad.name}: ${t}`,
    one ? `Updated **${props.ad.name}** in the ${sizeName(one)} only. The other sizes are unchanged.` : `Updated **${props.ad.name}** in every finished size.`,
    props.ad.id, extra,
  )
  reviseAd(props.project, props.ad, t, one)
  ask.value = ''
  ctx.value = ''
}

// Delete: the size goes back to "Design this size", with Undo.
const undo = ref(null) // { size, fn }
function remove(s) {
  if (ctx.value === s) ctx.value = ''
  undo.value = { size: s, fn: removeSize(props.project, props.ad, s) }
}
function restore() { undo.value?.fn(); undo.value = null }
</script>

<template>
  <article class="as" :class="{ 'is-compact': compact }">
    <header class="as__head">
      <span class="as__mark"><img v-if="ad.logo" :src="ad.logo" alt="" /><Icon v-else :name="purpose?.icon || 'image'" :size="20" /></span>
      <span class="as__name">
        <b>{{ ad.name }}</b>
        <small><span class="as__badge">{{ purpose?.label }}</span> {{ how }}<template v-if="ad.url"> · <a :href="ad.url" target="_blank" rel="noopener sponsored">{{ ad.url.replace(/^https?:\/\//, '') }}</a></template></small>
      </span>
      <span class="as__count">{{ ready }} of {{ sizes.length }} sizes</span>
      <button v-if="idle.length" type="button" class="cs-btn-dark as__all" :disabled="working" @click="all">
        <Icon name="spark" :size="16" /> Design the whole package
      </button>
    </header>

    <p v-if="!sizes.length" class="as__empty">Pick the banners you offer above to see this ad in each size.</p>
    <ul v-else class="as__grid">
      <li v-for="s in sizes" :key="s" class="as__tile" :class="`is-${state(s)}`">
        <div class="as__stage">
          <AdPreview v-if="state(s) === 'ready'" :ad="ad" :size="s" :max-width="compact ? 220 : 280" :max-height="compact ? 150 : 190" />
          <div v-else-if="state(s) === 'working'" class="as__working" :style="{ aspectRatio: `${AD_SIZES[s].width} / ${AD_SIZES[s].height}` }"><span /> Designing…</div>
          <button v-else-if="!(undo && undo.size === s)" type="button" class="as__design" :disabled="working" @click="one(s)">
            <Icon name="spark" :size="18" /> Design this size
          </button>
          <span v-if="state(s) === 'ready' && !compact" class="as__acts">
            <button type="button" class="as__act" :aria-label="`Edit the ${sizeName(s)}`" @click="edit(s)"><Icon name="pencil" :size="15" /> Edit</button>
            <button type="button" class="as__act is-del" :aria-label="`Delete the ${sizeName(s)}`" @click="remove(s)"><Icon name="x" :size="15" /> Delete</button>
          </span>
          <span v-if="undo && undo.size === s && state(s) === 'idle'" class="as__undo">Deleted · <button type="button" @click="restore">Undo</button></span>
        </div>
        <small><b>{{ s.replace('x', '×') }}</b> {{ AD_SIZES[s].name }}<em v-if="ad.overrides?.[s]"> · own changes</em></small>
      </li>
    </ul>

    <div v-if="!compact && ready" class="as__ask">
      <div class="as__chips cs-tabs">
        <button v-for="c in CHIPS" :key="c" type="button" class="cs-tab cs-tab--sm" :disabled="working" @click="revise(c)">{{ c }}</button>
      </div>
      <div v-if="ctx" class="as__ctx">
        <span class="as__ctxthumb"><AdPreview :ad="ad" :size="ctx" :max-width="132" :max-height="56" /></span>
        <span class="as__ctxtext"><b>Editing the {{ sizeName(ctx) }}</b><small>Attached as context for this change</small></span>
        <label class="as__every"><input v-model="everySize" type="checkbox" /> Apply to every size</label>
        <button type="button" class="as__ctxx" aria-label="Remove the attached banner" @click="ctx = ''"><Icon name="x" :size="16" /></button>
      </div>
      <form class="as__input" @submit.prevent="revise()">
        <input
          ref="askBox" v-model="ask" type="text" :placeholder="ctx ? `What should change in the ${sizeName(ctx)}?` : `Ask for changes to ${ad.name}…`"
          :aria-label="ctx ? `Ask for changes to the ${sizeName(ctx)}` : `Ask for changes to ${ad.name}`" @keydown.esc="ctx = ''"
        />
        <button type="submit" class="as__send" :disabled="!ask.trim() || working" aria-label="Send"><Icon name="up" :size="16" /></button>
      </form>
    </div>
  </article>
</template>

<style scoped>
.as { display: grid; gap: 14px; padding: 18px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow); }
.as__head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.as__mark { display: grid; place-items: center; width: 44px; height: 44px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: #fff; color: var(--ink-2); overflow: hidden; }
.as__mark img { max-width: 34px; max-height: 34px; object-fit: contain; }
.as__name { flex: 1; min-width: 200px; display: grid; }
.as__name b { font-size: 17px; }
.as__name small { color: var(--ink-3); font-size: 13px; }
.as__name a { color: var(--ink-2); }
.as__badge { display: inline-block; padding: 0 8px; margin-right: 4px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-weight: 700; font-size: 12px; line-height: 20px; }
.as__count { font-size: 13px; color: var(--ink-3); white-space: nowrap; }
.as__all { min-height: 40px; }
.as__empty { margin: 0; color: var(--ink-3); font-size: 14px; }
.as__grid { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
.as__tile { display: grid; gap: 6px; }
.as__stage { position: relative; display: grid; place-items: center; min-width: 140px; min-height: 90px; padding: 10px; border-radius: var(--r); background: var(--surface-3); }
.as__tile small { font-size: 12px; color: var(--ink-3); }
.as__tile small b { color: var(--ink-2); }
.as__working { display: flex; align-items: center; justify-content: center; gap: 8px; width: 160px; max-height: 190px; border-radius: 2px; background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0) 0 0 / 200% 100%; animation: shimmer 1.2s linear infinite; color: var(--ink-2); font-size: 13px; }
.as__working span { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--navy-100); border-top-color: var(--pill); animation: spin 0.8s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
.as__design { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border: 1px dashed var(--line-bold); border-radius: var(--r); background: var(--surface); color: var(--ink); font-weight: 700; font-size: 14px; cursor: pointer; }
.as__design:hover:not(:disabled) { border-color: var(--pill); }
.as__design:disabled { opacity: 0.5; cursor: default; }
.as__acts { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
.as__stage:hover .as__acts, .as__acts:focus-within { opacity: 1; }
.as__act { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; font-weight: 700; box-shadow: var(--shadow); cursor: pointer; }
.as__act:hover { border-color: var(--navy-900); }
.as__act.is-del:hover { border-color: #b91c1c; color: #b91c1c; }
.as__undo { font-size: 13px; color: var(--ink-2); }
.as__undo button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.as__tile small em { font-style: normal; color: var(--navy-900); font-weight: 700; }
.as__ctx { display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 10px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
.as__ctxthumb { display: grid; place-items: center; width: 140px; height: 60px; flex: none; border-radius: 2px; background: var(--surface-3); }
.as__ctxtext { flex: 1; min-width: 0; display: grid; }
.as__ctxtext b { font-size: 14px; }
.as__ctxtext small { font-size: 12px; color: var(--ink-3); }
.as__every { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); white-space: nowrap; cursor: pointer; }
.as__ctxx { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 50%; background: none; color: var(--ink-3); cursor: pointer; }
.as__ctxx:hover { background: var(--surface-3); color: var(--ink); }
.as__ask { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
.as__input { display: flex; gap: 8px; }
.as__input input { flex: 1; min-height: 40px; padding: 8px 12px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); font: inherit; color: var(--ink); }
.as__input input:focus { outline: none; border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.as__send { display: grid; place-items: center; width: 40px; border: 0; border-radius: var(--r); background: var(--pill); color: var(--pill-ink); cursor: pointer; }
.as__send:disabled { background: var(--surface-3); color: var(--ink-3); cursor: default; }
.is-compact { padding: 14px; box-shadow: none; }
</style>
