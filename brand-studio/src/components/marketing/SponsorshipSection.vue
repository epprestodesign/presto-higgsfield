<script setup>
// SponsorshipSection — sponsored placements as a revenue story. A to-scale
// wireframe of the booking pages shows exactly where IAB units sit (the same
// presets the Studio offers, from references/102126), plus an illustrative
// impressions estimator.
import { ref, computed, watch } from 'vue'
import ScaledFrame from './ScaledFrame.vue'
import SponsorAdMini from './SponsorAdMini.vue'
import { AD_LAYOUT_PRESETS, AD_SIZES } from '../../models/ads.js'
import { SAMPLE_SPONSORS } from '../../data/sponsors.js'

const PAGES = [
  { id: 'browse', label: 'Hotel search' },
  { id: 'details', label: 'Hotel details' },
  { id: 'landing', label: 'Event landing' },
]
const DEFAULT_PRESET = { browse: 'rail-160', details: 'rail-160', landing: 'rectangles' }

const page = ref('browse')
const presetId = ref(DEFAULT_PRESET.browse)
watch(page, (p) => { presetId.value = DEFAULT_PRESET[p] })

const presets = computed(() => AD_LAYOUT_PRESETS[page.value].filter((p) => p.id !== 'none'))
const preset = computed(() => presets.value.find((p) => p.id === presetId.value) || presets.value[0])

// Expand the preset into concrete units per slot, rotating sponsors.
const units = computed(() => {
  let n = 0
  const bySlot = {}
  for (const pl of preset.value.placements) {
    const size = AD_SIZES[pl.size]
    bySlot[pl.slot] = Array.from({ length: pl.count }, () => ({ key: `${pl.slot}-${n}`, sponsor: SAMPLE_SPONSORS[n++ % SAMPLE_SPONSORS.length], ...size }))
  }
  return bySlot
})
const slot = (id) => units.value[id] || []
const railWidth = computed(() => (slot(`${page.value}.rail`)[0]?.width || 0))
const unitCount = computed(() => Object.values(units.value).flat().length)
// Fill the results column so it runs as tall as the rail, like a real page.
const railHeight = computed(() => slot(`${page.value}.rail`).reduce((h, u) => h + u.height + 20, 0))
const resultCards = computed(() => Math.max(4, Math.ceil(railHeight.value / 192)))

const sizeList = computed(() =>
  preset.value.placements.map((p) => `${p.count} × ${AD_SIZES[p.size].name} (${p.size.replace('x', '×')})`),
)

// Illustrative estimator — clearly labeled, not a promise.
const attendees = ref(4000)
const cpm = ref(18)
const VIEWS = { browse: 4, details: 3, landing: 2 } // avg page views per attendee, per page type
const impressions = computed(() => attendees.value * VIEWS[page.value] * unitCount.value)
const value = computed(() => (impressions.value / 1000) * (Number(cpm.value) || 0))
const fmt = (n) => Math.round(n).toLocaleString('en-US')
</script>

<template>
  <section id="sponsorships" class="sp" aria-labelledby="sp-title">
    <div class="sp__grid">
      <div class="sp__copy">
        <p class="bs-eyebrow">Sponsored advertising</p>
        <h2 id="sp-title" class="bs-display-2">Turn hotel searches into sponsor inventory.</h2>
        <p class="bs-lead">
          Every attendee who books a room passes through your booking page. Add sponsor placements to the search and
          hotel pages without getting in the way of room selection, and preview them before you sell them.
        </p>

        <ul class="sp__points">
          <li><q-icon name="crop_free" /> Standard IAB units: billboards, leaderboards, skyscrapers</li>
          <li><q-icon name="label" /> Clear “Sponsored” labeling on every unit</li>
          <li><q-icon name="smartphone" /> Mobile-safe: rails hide, banners resize on phones</li>
          <li><q-icon name="link" /> Sponsor artwork, destination URL and position per placement</li>
        </ul>

        <div class="sp__calc bs-card">
          <div class="sp__calc-head">
            <h3 class="bs-subtitle">Estimate sponsor impressions</h3>
            <span class="bs-pill">Illustrative</span>
          </div>
          <label class="sp__field">
            <span>Expected attendees <b>{{ fmt(attendees) }}</b></span>
            <q-slider v-model="attendees" :min="500" :max="20000" :step="500" color="dark" aria-label="Expected attendees" />
          </label>
          <q-input v-model.number="cpm" type="number" outlined dense prefix="$" label="Sponsor CPM (price per 1,000 impressions)" :min="1" />
          <dl class="sp__out" aria-live="polite">
            <div><dt>Impressions on {{ PAGES.find((p) => p.id === page).label.toLowerCase() }}</dt><dd>{{ fmt(impressions) }}</dd></div>
            <div><dt>Estimated sponsor value</dt><dd>${{ fmt(value) }}</dd></div>
          </dl>
          <p class="bs-caption">Assumes {{ VIEWS[page] }} views per attendee and {{ unitCount }} units on this page. Actual results vary. This preview never serves real ads.</p>
        </div>
      </div>

      <div class="sp__demo">
        <div class="sp__controls">
          <div class="sp__seg" role="radiogroup" aria-label="Page">
            <button
              v-for="p in PAGES" :key="p.id" type="button" role="radio"
              class="sp__seg-btn bs-focusable" :class="{ 'is-on': page === p.id }"
              :aria-checked="page === p.id ? 'true' : 'false'"
              @click="page = p.id"
            >{{ p.label }}</button>
          </div>
          <q-select
            v-model="presetId" :options="presets" option-value="id" option-label="label" emit-value map-options
            outlined dense label="Placement layout" class="sp__preset"
          />
        </div>

        <figure class="sp__wire" :aria-label="`Wireframe of the ${page} page with ${sizeList.join(', ')}`">
          <scaled-frame :design-width="1200">
            <div class="wf" aria-hidden="true">
              <div class="wf__nav"><span class="wf__bar w-30" /><span class="wf__bar w-12 ml-auto" /></div>
              <div class="wf__hero" :class="{ 'wf__hero--tall': page === 'landing' }"><span class="wf__bar wf__bar--light w-36" /></div>
              <div v-if="page !== 'details'" class="wf__search"><span v-for="n in 3" :key="n" class="wf__input" /><span class="wf__btn" /></div>

              <!-- BROWSE -->
              <template v-if="page === 'browse'">
                <div v-if="slot('browse.top').length" class="wf__band"><sponsor-ad-mini v-for="u in slot('browse.top')" :key="u.key" v-bind="u" /></div>
                <div class="wf__cols" :style="{ gridTemplateColumns: railWidth ? `220px 1fr ${railWidth}px` : '220px 1fr' }">
                  <div class="wf__rail"><span class="wf__map" /><span v-for="n in 7" :key="n" class="wf__bar w-80" /></div>
                  <div class="wf__results">
                    <div v-for="n in resultCards" :key="n" class="wf__card"><span class="wf__img" /><span class="wf__lines"><span class="wf__bar w-60" /><span class="wf__bar w-40" /><span class="wf__bar w-30" /></span><span class="wf__price" /></div>
                  </div>
                  <div v-if="railWidth" class="wf__ads"><sponsor-ad-mini v-for="u in slot('browse.rail')" :key="u.key" v-bind="u" /></div>
                </div>
                <div v-if="slot('browse.bottom').length" class="wf__band"><sponsor-ad-mini v-for="u in slot('browse.bottom')" :key="u.key" v-bind="u" /></div>
              </template>

              <!-- DETAILS -->
              <template v-else-if="page === 'details'">
                <div class="wf__gallery"><span class="wf__img wf__img--big" /><span v-for="n in 4" :key="n" class="wf__img" /></div>
                <div class="wf__rooms"><span v-for="n in 3" :key="n" class="wf__room" /></div>
                <div v-if="slot('details.afterRooms').length" class="wf__band"><sponsor-ad-mini v-for="u in slot('details.afterRooms')" :key="u.key" v-bind="u" /></div>
                <div class="wf__cols" :style="{ gridTemplateColumns: railWidth ? `1fr ${railWidth}px` : '1fr' }">
                  <div class="wf__sections"><div v-for="n in Math.max(4, Math.ceil(railHeight / 120))" :key="n" class="wf__section"><span class="wf__bar w-20" /><span class="wf__para"><span class="wf__bar w-90" /><span class="wf__bar w-80" /><span class="wf__bar w-60" /></span></div></div>
                  <div v-if="railWidth" class="wf__ads"><sponsor-ad-mini v-for="u in slot('details.rail')" :key="u.key" v-bind="u" /></div>
                </div>
                <div v-if="slot('details.bottom').length" class="wf__band"><sponsor-ad-mini v-for="u in slot('details.bottom')" :key="u.key" v-bind="u" /></div>
              </template>

              <!-- LANDING -->
              <template v-else>
                <div class="wf__copy"><span v-for="n in 5" :key="n" class="wf__bar" :class="n % 2 ? 'w-80' : 'w-60'" /></div>
                <div class="wf__band wf__band--wrap"><sponsor-ad-mini v-for="u in slot('landing.afterContent')" :key="u.key" v-bind="u" /></div>
              </template>
            </div>
          </scaled-frame>
          <figcaption class="bs-caption sp__caption">{{ sizeList.join(' · ') }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sp { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 9vw, 120px) 24px 0; }
.sp__grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 48px; align-items: start; }
.sp__copy { display: grid; gap: 18px; }
.sp__points { list-style: none; padding: 0; margin: 4px 0; display: grid; gap: 10px; font: 400 0.9375rem/1.4 var(--bs-font); color: var(--bs-ink); }
.sp__points li { display: flex; gap: 10px; align-items: center; }
.sp__points .q-icon { font-size: 20px; color: var(--bs-brand); }
.sp__calc { padding: 20px; display: grid; gap: 14px; }
.sp__calc-head { display: flex; justify-content: space-between; align-items: center; }
.sp__field { display: grid; gap: 4px; font: 400 0.875rem/1.3 var(--bs-font); color: var(--bs-ink-soft); }
.sp__field b { color: var(--bs-ink); }
.sp__out { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sp__out div { padding: 12px; border-radius: var(--bs-radius-sm); background: var(--bs-surface-2); }
.sp__out dt { font: 400 0.8125rem/1.3 var(--bs-font); color: var(--bs-ink-soft); }
.sp__out dd { margin: 4px 0 0; font: 700 1.5rem/1.1 var(--bs-font); color: var(--bs-ink); letter-spacing: -0.02em; }

.sp__demo { display: grid; gap: 14px; }
.sp__controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sp__seg { display: inline-flex; padding: 4px; border-radius: 999px; background: var(--bs-surface-2); border: 1px solid var(--bs-line); }
.sp__seg-btn { min-height: 36px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--bs-ink-soft); font: 700 0.875rem/1 var(--bs-font); cursor: pointer; }
.sp__seg-btn.is-on { background: #fff; color: var(--bs-ink); box-shadow: var(--bs-shadow-1); }
.sp__preset { flex: 1; min-width: 220px; }
.sp__wire { margin: 0; padding: 12px; border-radius: var(--bs-radius-lg); background: var(--bs-surface); border: 1px solid var(--bs-line); box-shadow: var(--bs-shadow-2); }
.sp__caption { margin-top: 10px; text-align: center; }

/* Wireframe at 1200px design width */
.wf { background: #F4F5F8; padding-bottom: 28px; font-family: var(--bs-font); }
.wf__nav { height: 52px; background: #fff; display: flex; align-items: center; padding: 0 28px; border-bottom: 1px solid #E5E7EB; }
.wf__hero { height: 120px; background: #0E1B2C; display: grid; place-items: center; }
.wf__hero--tall { height: 260px; }
.wf__search { display: flex; gap: 12px; padding: 16px 28px; background: #fff; border-bottom: 1px solid #E5E7EB; }
.wf__input { flex: 1; height: 44px; border: 1px solid #D1D5DB; border-radius: 4px; }
.wf__btn { width: 130px; height: 44px; border-radius: 4px; background: #0E1B2C; }
.wf__band { display: flex; justify-content: center; gap: 20px; padding: 24px 28px 0; }
.wf__band--wrap { flex-wrap: wrap; }
.wf__cols { display: grid; gap: 22px; padding: 24px 28px 0; align-items: start; }
.wf__rail { display: grid; gap: 12px; padding: 14px; background: #fff; border-radius: 6px; }
.wf__map { height: 120px; border-radius: 4px; background: #E6EBF2; }
.wf__results { display: grid; gap: 16px; }
.wf__card { height: 176px; display: grid; grid-template-columns: 240px 1fr 160px; gap: 18px; padding: 0 18px 0 0; background: #fff; border-radius: 6px; overflow: hidden; }
.wf__img { display: block; background: linear-gradient(135deg, #CBD5E1, #E2E8F0); border-radius: 4px; height: 100%; }
.wf__card .wf__img { border-radius: 0; }
.wf__lines { display: grid; align-content: center; gap: 12px; }
.wf__price { align-self: end; margin-bottom: 18px; height: 40px; border-radius: 4px; background: #0E1B2C; }
.wf__ads { display: grid; gap: 20px; justify-items: center; }
.wf__gallery { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 130px 130px; gap: 10px; padding: 24px 28px 0; }
.wf__img--big { grid-row: span 2; }
.wf__rooms { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding: 24px 28px 0; }
.wf__room { height: 220px; border-radius: 6px; background: #fff; box-shadow: inset 0 110px 0 #E2E8F0; }
.wf__sections { display: grid; gap: 10px; }
.wf__section { display: grid; grid-template-columns: 240px 1fr; gap: 24px; padding: 22px 0; border-top: 1px solid #E5E7EB; }
.wf__para { display: grid; gap: 10px; }
.wf__copy { max-width: 760px; margin: 0 auto; display: grid; justify-items: center; gap: 14px; padding: 40px 0 8px; }
.wf__bar { display: block; height: 12px; border-radius: 999px; background: #D7DCE4; }
.wf__bar--light { background: rgb(255 255 255 / 0.4); height: 20px; }
.w-12 { width: 12%; } .w-20 { width: 20%; } .w-30 { width: 30%; } .w-36 { width: 360px; } .w-40 { width: 40%; } .w-60 { width: 60%; } .w-80 { width: 80%; } .w-90 { width: 90%; }
.ml-auto { margin-left: auto; }

@media (max-width: 1024px) {
  .sp__grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .sp { padding-inline: 16px; }
  .sp__out { grid-template-columns: 1fr; }
  .sp__seg { width: 100%; }
  .sp__seg-btn { flex: 1; padding: 0 6px; }
}
</style>
