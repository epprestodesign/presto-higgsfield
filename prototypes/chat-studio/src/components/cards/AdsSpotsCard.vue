<script setup>
// Ads in the chat, 4 of 4: the spots on each page, live. Fill a spot with a
// page from the event's site (ranked, hotels first; made right here) or a
// sponsor (opens the form in Advertisements). Filled spots have Edit (into the chat box) and
// Delete (with Undo).
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import AdSpot from '../ads/AdSpot.vue'
import { OFFERS, PAGES, AD_SIZES, spotsOf, adInSpot, restoreAd, spotLabel, adsUi } from '../../ads.js'
import { editInChat, fillSpotInChat, state } from '../../mockAgent.js'
import { route } from '../../router.js'
import { scrapeSite } from '../../siteScrape.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ads = computed(() => props.project.ads)
const spots = computed(() => spotsOf(ads.value))
const filled = computed(() => spots.value.filter((s) => adInSpot(ads.value, s.id)).length)
const pages = computed(() => PAGES.map((pg) => ({
  ...pg,
  offers: OFFERS.filter((o) => o.page === pg.id && ads.value.offers.includes(o.id)).map((o) => ({ ...o, spots: spots.value.filter((s) => s.offer.id === o.id) })),
})).filter((pg) => pg.offers.length))
const shapeOf = (size) => { const r = AD_SIZES[size].width / AD_SIZES[size].height; return r < 0.7 ? 'tall' : r > 2.2 ? 'wide' : 'box' }
const removed = computed(() => Object.entries(ads.value.removed || {}).map(([id, r]) => ({ id, name: r.ad.name, where: spotLabel(ads.value, r.ad) })).filter((r) => r.where))

const menu = ref('') // the spot being filled
const menuSpot = computed(() => spots.value.find((s) => s.id === menu.value))
const site = computed(() => scrapeSite(props.project.brand))
const used = (pageId) => ads.value.items.some((a) => a.link === pageId && spots.value.some((s) => s.id === a.spot))
// Pages not on a spot yet first (in rank order), then the ones already used.
const sitePages = computed(() => [...site.value].sort((a, b) => used(a.id) - used(b.id)))
function fill(purpose) { const sp = menuSpot.value; menu.value = ''; fillSpotInChat(props.project, sp, purpose) }
function sponsor() { adsUi.fill = menu.value; menu.value = ''; route.tab = 'ads' }
</script>

<template>
  <CardShell kicker="Advertisements" title="Your ad spots" :aside="`${filled} of ${spots.length} filled`">
    <p v-if="!spots.length" class="ac__empty">No placements picked yet.</p>
    <p v-for="r in removed" :key="r.id" class="ac__gone" role="status"><b>{{ r.name }}</b> was deleted from {{ r.where }}. <button type="button" @click="restoreAd(project, r.id)">Undo</button></p>
    <section v-for="pg in pages" :key="pg.id" class="ac__page" :aria-label="pg.label">
      <h4>{{ pg.label }}</h4>
      <div v-for="o in pg.offers" :key="o.id" class="ac__row">
        <div class="ac__spots" :class="`is-${shapeOf(o.size)}`">
          <AdSpot
            v-for="sp in o.spots" :key="sp.id" :project="project" :spot="sp" :ad="adInSpot(ads, sp.id)" :open="menu === sp.id"
            @fill="menu = menu === sp.id ? '' : sp.id" @edit="editInChat(project, adInSpot(ads, sp.id))"
          />
        </div>
        <div v-if="menuSpot && menuSpot.offer.id === o.id" class="ac__menu" role="group" :aria-label="`Fill ${menuSpot.label}`">
          <span class="ac__menulabel">Fill <b>{{ menuSpot.label }}</b> with</span>
          <span class="cs-tabs">
            <button v-for="pg in sitePages" :key="pg.id" type="button" class="cs-tab cs-tab--sm" :title="pg.url" :disabled="state.working" @click="fill(pg.id)">
              <Icon name="link" :size="16" /> {{ pg.title }}<small v-if="used(pg.id)"> · again</small>
            </button>
            <button type="button" class="cs-tab cs-tab--sm" @click="sponsor"><Icon name="users" :size="16" /> A sponsor…</button>
          </span>
        </div>
      </div>
    </section>
  </CardShell>
</template>

<style scoped>
.ac__page { display: grid; gap: 10px; }
.ac__page + .ac__page { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
.ac__page h4 { margin: 0; font-size: 15px; }
.ac__row { display: grid; gap: 10px; }
.ac__spots { display: grid; gap: 10px; }
.ac__spots.is-box { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.ac__spots.is-tall { grid-template-columns: repeat(auto-fill, minmax(190px, 220px)); }
.ac__spots.is-wide { grid-template-columns: 1fr; }
.ac__menu { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; border: 1px solid var(--navy-900); border-radius: var(--r); background: var(--surface); }
.ac__menulabel { font-size: 14px; color: var(--ink-2); }
.ac__menu small { color: var(--ink-3); font-weight: 400; }
.ac__empty { margin: 0; color: var(--ink-3); font-size: 14px; }
.ac__gone { margin: 0 0 12px; padding: 10px 12px; border: 1px dashed var(--line-bold); border-radius: var(--r); color: var(--ink-2); font-size: 14px; }
.ac__gone button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
