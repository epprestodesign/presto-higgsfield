<script setup>
// Ads in the chat, 1 of 4: which Presto pages carry ads, and which pages of
// the event's own site they link to: scraped and ranked for what helps guests
// most (travel and hotels first), plus spots left for sponsors' own ads.
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { PAGES, OFFERS } from '../../ads.js'
import { chooseAdPages, state } from '../../mockAgent.js'
import { scrapeSite, defaultLinks, KIND_LABEL } from '../../siteScrape.js'

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
const site = computed(() => scrapeSite(props.project.brand))
const KIND_ICON = { travel: 'map', venue: 'layout', schedule: 'sun', faq: 'chat', about: 'help', sponsors: 'grid' }
const promote = ref(props.card.promote ? [...props.card.promote] : [...defaultLinks(site.value), 'sponsor'])
const pOn = (id) => (done.value ? props.card.promote || [] : promote.value).includes(id)
function pToggle(id) { if (!done.value) promote.value = pOn(id) ? promote.value.filter((x) => x !== id) : [...promote.value, id] }
const links = computed(() => promote.value.filter((x) => x !== 'sponsor').length)
function confirm() { chooseAdPages(props.project, PAGES.filter((p) => picked.value.includes(p.id)).map((p) => p.id), props.card, [...site.value.filter((x) => promote.value.includes(x.id)).map((x) => x.id), ...(promote.value.includes('sponsor') ? ['sponsor'] : [])]) }
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
    <p v-if="project.brand.noSite" class="aw__q">What should they link to? <small>No website, so they link to the event’s own Presto pages</small></p>
    <p v-else class="aw__q">Which pages of {{ project.brand.website }} should they link to? <small>Ranked by what helps guests most, hotels first</small></p>
    <ol class="aw__links" aria-label="Pages found on the event's website">
      <li v-for="x in site" :key="x.id" v-show="!done || pOn(x.id)">
        <button type="button" class="aw__link" :class="{ 'is-on': pOn(x.id) }" :aria-pressed="pOn(x.id)" :disabled="done" @click="pToggle(x.id)">
          <span class="aw__rank">{{ x.rank }}</span>
          <span class="aw__ltext">
            <b>{{ x.title }} <em>{{ KIND_LABEL[x.kind] }}</em></b>
            <small>{{ x.found }}</small>
            <code>{{ x.where }}</code>
          </span>
          <span class="aw__check"><Icon v-if="pOn(x.id)" name="check" :size="16" /></span>
        </button>
      </li>
    </ol>
    <div class="cs-tabs aw__spon">
      <button type="button" class="cs-tab cs-tab--sm" :class="{ 'is-on': pOn('sponsor') }" :aria-pressed="pOn('sponsor')" :disabled="done" @click="pToggle('sponsor')"><Icon :name="pOn('sponsor') ? 'check' : 'users'" :size="16" /> Leave spots for sponsors’ own ads</button>
    </div>
    <div v-if="!done" class="aw__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || !promote.length || state.working" @click="confirm">
        <Icon name="check" :size="16" /> Confirm
      </button>
      <small class="aw__hint">{{ !picked.length ? 'Pick where ads run.' : !promote.length ? 'Pick at least one page to link to.' : `${picked.length} ${picked.length === 1 ? 'page' : 'pages'} · ${links} ${links === 1 ? 'link' : 'links'}${promote.includes('sponsor') ? ' + sponsors' : ''}` }}</small>
    </div>
  </CardShell>
</template>

<style scoped>
.aw__q { margin: 0 0 8px; font-size: 14px; font-weight: 700; color: var(--ink-2); }
.aw + .aw__q { margin-top: 18px; }
.aw__q small { margin-left: 6px; color: var(--ink-3); font-weight: 400; }
.aw__links { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.aw__link { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.aw__link:hover:not(:disabled) { border-color: var(--line-bold); }
.aw__link.is-on { border-color: var(--pill); background: var(--selected); }
.aw__link:disabled { cursor: default; }
.aw__rank { display: grid; place-items: center; width: 24px; height: 24px; flex: none; border-radius: 50%; background: var(--surface-3); color: var(--ink-2); font-size: 12px; font-weight: 700; }
.aw__link.is-on .aw__rank { background: var(--pill); color: var(--pill-ink); }
.aw__ltext { flex: 1; min-width: 0; display: grid; gap: 2px; }
.aw__ltext b { font-size: 14px; }
.aw__ltext em { margin-left: 4px; padding: 0 6px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-style: normal; font-size: 11px; font-weight: 700; line-height: 18px; }
.aw__ltext small { color: var(--ink-2); font-size: 12px; }
.aw__ltext code { color: var(--ink-3); font: 11px/1.4 ui-monospace, monospace; }
.aw__spon { margin-top: 10px; }
@media (max-width: 900px) { .aw__links { grid-template-columns: 1fr; } }
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
.aw__page.is-on .aw__check, .aw__link.is-on .aw__check { background: var(--pill); border-color: var(--pill); }
.aw__hint { color: var(--ink-3); font-size: 13px; }
@media (max-width: 900px) { .aw { grid-template-columns: 1fr; } }
</style>
