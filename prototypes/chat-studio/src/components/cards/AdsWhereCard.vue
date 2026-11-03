<script setup>
// Ads in the chat, 1 of 3: which Presto pages should carry ads, and what the
// ads promote (your About page, FAQ, Sponsors page, and/or sponsors).
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { PAGES, OFFERS } from '../../ads.js'
import { chooseAdPages, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ABOUT = {
  landing: { icon: 'layout', note: 'The event’s own page, below its description' },
  browse: { icon: 'grid', note: 'The list of hotels near the event' },
  details: { icon: 'file', note: 'A hotel’s page, with its rooms' },
}
const done = computed(() => !!props.card.picked)
const picked = ref(props.card.picked ? [...props.card.picked] : [])
const on = (id) => (done.value ? props.card.picked : picked.value).includes(id)
function toggle(id) { if (!done.value) picked.value = on(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] }
const PROMOTE = [
  { id: 'about', label: 'Your About page', icon: 'help' },
  { id: 'faq', label: 'Your FAQ', icon: 'chat' },
  { id: 'sponsors', label: 'Your Sponsors page', icon: 'grid' },
  { id: 'sponsor', label: 'Sponsors’ own ads', icon: 'users' },
]
const promote = ref(props.card.promote ? [...props.card.promote] : ['about', 'sponsor'])
const pOn = (id) => (done.value ? props.card.promote || [] : promote.value).includes(id)
function pToggle(id) { if (!done.value) promote.value = pOn(id) ? promote.value.filter((x) => x !== id) : [...promote.value, id] }
function confirm() { chooseAdPages(props.project, PAGES.filter((p) => picked.value.includes(p.id)).map((p) => p.id), props.card, PROMOTE.filter((x) => promote.value.includes(x.id)).map((x) => x.id)) }
const count = (id) => OFFERS.filter((o) => o.page === id).length
</script>

<template>
  <CardShell kicker="Advertisements" title="Where should ads run?" :aside="done ? 'Confirmed' : `${picked.length} of ${PAGES.length} pages`">
    <p class="aw__q">Which pages?</p>
    <div class="aw" role="group" aria-label="Pages with ads">
      <button
        v-for="pg in PAGES" :key="pg.id" type="button" class="aw__page" :class="{ 'is-on': on(pg.id) }"
        :aria-pressed="on(pg.id)" :disabled="done" @click="toggle(pg.id)"
      >
        <span class="aw__icon"><Icon :name="ABOUT[pg.id].icon" :size="20" /></span>
        <span class="aw__text"><b>{{ pg.label }}</b><small>{{ ABOUT[pg.id].note }} · {{ count(pg.id) }} placements</small></span>
        <span class="aw__check"><Icon v-if="on(pg.id)" name="check" :size="16" /></span>
      </button>
    </div>
    <p class="aw__q">What should the ads promote?</p>
    <div class="cs-tabs" role="group" aria-label="What the ads promote">
      <button
        v-for="x in PROMOTE" :key="x.id" type="button" class="cs-tab" :class="{ 'is-on': pOn(x.id) }"
        :aria-pressed="pOn(x.id)" :disabled="done" @click="pToggle(x.id)"
      ><Icon :name="pOn(x.id) ? 'check' : x.icon" :size="16" /> {{ x.label }}</button>
    </div>
    <div v-if="!done" class="aw__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || !promote.length || state.working" @click="confirm">
        <Icon name="check" :size="16" /> Confirm
      </button>
      <small class="aw__hint">{{ !picked.length ? 'Pick at least one page.' : !promote.length ? 'Pick what the ads promote.' : `${picked.length} ${picked.length === 1 ? 'page' : 'pages'} · ${promote.length} ${promote.length === 1 ? 'kind of ad' : 'kinds of ad'}` }}</small>
    </div>
  </CardShell>
</template>

<style scoped>
.aw__q { margin: 0 0 8px; font-size: 14px; font-weight: 700; color: var(--ink-2); }
.aw + .aw__q { margin-top: 18px; }
.aw__foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.aw { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.aw__page { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.aw__page:hover:not(:disabled) { border-color: var(--line-bold); }
.aw__page.is-on { border-color: var(--pill); background: var(--selected); }
.aw__page:disabled { cursor: default; }
.aw__page:disabled:not(.is-on) { opacity: 0.55; }
.aw__icon { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: var(--r); background: var(--surface-3); color: var(--ink-2); }
.aw__page.is-on .aw__icon { background: var(--pill); color: var(--pill-ink); }
.aw__text { flex: 1; min-width: 0; display: grid; }
.aw__text b { font-size: 15px; }
.aw__text small { color: var(--ink-3); font-size: 12px; }
.aw__check { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border: 1.5px solid var(--line-bold); border-radius: 4px; color: var(--pill-ink); }
.aw__page.is-on .aw__check { background: var(--pill); border-color: var(--pill); }
.aw__hint { color: var(--ink-3); font-size: 13px; }
@media (max-width: 900px) { .aw { grid-template-columns: 1fr; } }
</style>
