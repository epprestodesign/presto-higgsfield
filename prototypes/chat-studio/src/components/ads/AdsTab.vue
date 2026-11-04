<script setup>
// A project's Advertisements: 1) pick the banners this event offers (the
// approved placements), 2) make ads — for a sponsor, or pointing at the
// event's own About / Sponsors / FAQ pages — page by page, one ad per spot
// (Banner 1, 2, 3 on the landing page, each skyscraper…), each made just for
// its spot's size, designed with Higgsfield or re-fitted from an uploaded ad.
// See them on the real Presto pages from the header.
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../Icon.vue'
import AdSuite from './AdSuite.vue'
import AdSpot from './AdSpot.vue'
import { OFFERS, PAGES, AD_SIZES, PURPOSES, offerMobile, purposeDefaults, createAd, designPackage, restoreAd, spotsOf, adInSpot, spotLabel, pageLabel, adSizes, adsUi } from '../../ads.js'
import { adsChat, packageAds, state, nextLook } from '../../mockAgent.js'
import { AD_TYPES } from '../../imageModels.js'
import { route } from '../../router.js'

const props = defineProps({ project: { type: Object, required: true } })
const ads = computed(() => props.project.ads)
// Deleted ads, offered back (Undo) where they were.
const removed = computed(() => Object.entries(ads.value.removed || {}).map(([id, r]) => ({ id, name: r.ad.name, where: spotLabel(ads.value, r.ad) })))

// ---- Spots, page by page
const spots = computed(() => spotsOf(ads.value))
const filled = computed(() => spots.value.filter((s) => adInSpot(ads.value, s.id)).length)
const PLURAL = { Banner: 'banners', Skyscraper: 'skyscrapers', Leaderboard: 'leaderboard', Billboard: 'billboard' }
const pagesWithSpots = computed(() => PAGES.map((pg) => {
  const offers = OFFERS.filter((o) => o.page === pg.id && ads.value.offers.includes(o.id)).map((o) => ({ ...o, spots: spots.value.filter((s) => s.offer.id === o.id) }))
  const summary = offers.map((o) => { const k = o.spots[0].label.replace(/ \d+$/, ''); return o.count > 1 ? `${o.count} ${PLURAL[k] || k.toLowerCase() + 's'}` : `1 ${k.toLowerCase()}` }).join(' · ')
  return { ...pg, offers, summary }
}).filter((pg) => pg.offers.length))
const shapeOf = (size) => { const r = AD_SIZES[size].width / AD_SIZES[size].height; return r < 0.7 ? 'tall' : r > 2.2 ? 'wide' : 'box' }
const PAGE_LABEL = pageLabel
// Ads whose spot was turned off above.
const unplaced = computed(() => ads.value.items.filter((a) => !a.spot || !spots.value.some((s) => s.id === a.spot)))

// Edit: the ad opens below its row (details, sizes, changes).
const editId = ref('')
const editing = computed(() => ads.value.items.find((a) => a.id === editId.value) || null)
function toggleEdit(ad) { fillId.value = ''; editId.value = editId.value === ad?.id ? '' : ad?.id || '' }
// Package every ad: designs what's missing, then the files land in the chat.
function packageAll() {
  const live = ads.value.items.filter((a) => !unplaced.value.includes(a))
  packageAds(props.project, live, `Looks good, package all ${live.length} ads`)
  route.tab = 'chat'
}

// ---- 1. Offered banners
function toggleOffer(id) {
  const i = ads.value.offers.indexOf(id)
  if (i >= 0) ads.value.offers.splice(i, 1)
  else ads.value.offers.push(id)
}
const offersBy = (page) => OFFERS.filter((o) => o.page === page)
// A size thumbnail: the unit's shape, scaled to fit 64 × 48.
function shape(size) {
  const { width: w, height: h } = AD_SIZES[size]
  const s = Math.min(64 / w, 48 / h)
  return { width: `${Math.max(6, w * s)}px`, height: `${Math.max(4, h * s)}px` }
}

// ---- 2. Fill a spot
const fillId = ref('')
const fillSpot = computed(() => spots.value.find((s) => s.id === fillId.value) || null)
const fillSizes = computed(() => (fillSpot.value ? [fillSpot.value.size, ...(fillSpot.value.mobile ? [fillSpot.value.mobile] : [])] : []))
// Looks for the form: the project's picks first; the next one in turn is preselected.
const lookList = computed(() => { const mine = ads.value.looks || []; return [...AD_TYPES].sort((a, b) => mine.includes(b.id) - mine.includes(a.id)) })
function openFill(sp) {
  editId.value = ''
  fillId.value = fillId.value === sp.id ? '' : sp.id
  form.type = nextLook(props.project)
  if (fillId.value) nextTick(() => document.querySelector('.ad__form')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}
// "A sponsor…" in the chat opens this form on that spot.
function takeFill() { const sp = spots.value.find((s) => s.id === adsUi.fill); adsUi.fill = ''; if (sp && !adInSpot(ads.value, sp.id)) { fillId.value = ''; openFill(sp) } }
onMounted(takeFill)
watch(() => adsUi.fill, (v) => { if (v) takeFill() })
const form = reactive({ type: '', purpose: 'sponsor', how: 'package', name: '', tagline: '', cta: 'Learn more', url: '', logo: null, logoName: '', upload: null, uploadName: '' })
function pickPurpose(p) {
  form.purpose = p
  Object.assign(form, purposeDefaults(p, props.project.brand))
}
const logoInput = ref(null)
const uploadInput = ref(null)
function onLogo(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) { form.logo = URL.createObjectURL(f); form.logoName = f.name } }
function onUpload(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) { form.upload = URL.createObjectURL(f); form.uploadName = f.name; form.how = 'upload'; if (!form.name) form.name = f.name.replace(/\.[^.]+$/, '') } }
const canCreate = computed(() => !!fillSpot.value && (form.how === 'upload' ? !!form.upload : !!form.name.trim()))
const HOWS = [
  { id: 'package', label: 'Design with Higgsfield', icon: 'spark', note: 'Made for this spot' },
  { id: 'upload', label: 'Upload an existing ad', icon: 'clip', note: 'We re-fit it to this spot' },
]

function create() {
  if (!canCreate.value) return
  const sp = fillSpot.value
  const ad = createAd(props.project, { ...form, logo: form.purpose === 'sponsor' ? form.logo : null, spot: sp.id })
  const where = `${sp.label} on the ${pageLabel(sp.page).toLowerCase()}`
  const what = form.purpose === 'sponsor' ? `a sponsor ad for ${ad.name}` : `an ad for our ${PURPOSES.find((p) => p.id === form.purpose).label.toLowerCase()}`
  const sizesTxt = `${sp.size.replace('x', '×')}${sp.mobile ? `, and ${sp.mobile.replace('x', '×')} for phones` : ''}`
  if (form.how === 'upload') adsChat(props.project, `Here's an existing ad (${form.uploadName}). Put it in ${where}.`, `Re-fitting **${form.uploadName}** for ${where} (${sizesTxt}).`, ad.id)
  else adsChat(props.project, `Make ${what} for ${where}`, `Designing **${ad.name}** with Higgsfield for ${where} (${sizesTxt}) · about ${adSizes(ads.value, ad).length} credits.`, ad.id)
  designPackage(props.project, ad)
  Object.assign(form, { name: '', tagline: '', cta: 'Learn more', url: '', logo: null, logoName: '', upload: null, uploadName: '', how: 'package' })
  pickPurpose('sponsor')
  fillId.value = ''
}

// ---- 3. On the pages
function preview(screen) {
  const n = props.project.drafts.length
  if (!n) return
  route.tab = 'concepts'
  route.draft = n
  route.screen = screen
}
</script>

<template>
  <div class="ad">
    <div class="ad__inner">
      <header class="ad__head">
        <div>
          <h2>Advertisements</h2>
          <p>Ads that run on {{ project.name }}’s Presto pages: your sponsors, and links to your own pages.</p>
        </div>
        <div class="cs-tabs">
          <button type="button" class="cs-tab" :disabled="!project.drafts.length" @click="preview('browse')"><Icon name="layout" :size="18" /> See them on the pages</button>
        </div>
      </header>

      <!-- 1. Offered banners -->
      <section class="ad__sec" aria-labelledby="ad-offers">
        <h3 id="ad-offers"><span>1</span> Banners you offer</h3>
        <p class="ad__hint">The approved placements on the Presto pages. Pick the ones this event sells; each one adds ad spots below.</p>
        <div class="ad__pages">
          <div v-for="pg in PAGES" :key="pg.id" class="ad__page">
            <p class="ad__pagelabel">{{ pg.label }}</p>
            <button
              v-for="o in offersBy(pg.id)" :key="o.id" type="button" class="ad__offer" :class="{ 'is-on': ads.offers.includes(o.id) }"
              :aria-pressed="ads.offers.includes(o.id)" @click="toggleOffer(o.id)"
            >
              <span class="ad__shape"><i :style="shape(o.size)" /></span>
              <span class="ad__offertext">
                <b>{{ o.label }}</b>
                <small>{{ o.size.replace('x', '×') }} {{ AD_SIZES[o.size].name }} · {{ offerMobile(o) ? `phones: ${offerMobile(o).replace('x', '×')}` : 'hidden on phones' }}</small>
              </span>
              <span class="ad__check"><Icon v-if="ads.offers.includes(o.id)" name="check" :size="16" /></span>
            </button>
          </div>
        </div>
        <p class="ad__sum"><b>{{ ads.offers.length }}</b> placements · <b>{{ spots.length }}</b> ad spots</p>
      </section>

      <!-- 2. Ads, page by page: each spot holds its own ad -->
      <section class="ad__sec" aria-labelledby="ad-items">
        <div class="ad__sechead">
          <h3 id="ad-items"><span>2</span> Ads by page <small>{{ filled }} of {{ spots.length }} spots filled</small></h3>
          <button v-if="ads.items.length" type="button" class="cs-tab" :disabled="state.working" @click="packageAll"><Icon name="download" :size="18" /> Package all ads</button>
        </div>
        <p class="ad__hint">Each spot holds its own ad, made just for that size (and its phone size). Fill a spot with a sponsor, or with a link to your FAQ, About or Sponsors page.</p>
        <p v-if="!spots.length" class="ad__gone">Pick at least one placement above to get ad spots.</p>
        <p v-for="r in removed" :key="r.id" class="ad__gone" role="status"><b>{{ r.name }}</b> was deleted{{ r.where ? ` from ${r.where}` : '' }}. <button type="button" @click="restoreAd(project, r.id)">Undo</button></p>

        <section v-for="pg in pagesWithSpots" :key="pg.id" class="ad__bypage" :aria-labelledby="`ad-pg-${pg.id}`">
          <h4 :id="`ad-pg-${pg.id}`">{{ pg.label }} <small>{{ pg.summary }}</small></h4>
          <div v-for="o in pg.offers" :key="o.id" class="ad__row">
            <p class="ad__rowlabel">{{ o.label }}</p>
            <div class="ad__spots" :class="`is-${shapeOf(o.size)}`">
              <AdSpot
                v-for="sp in o.spots" :key="sp.id" :project="project" :spot="sp" :ad="adInSpot(ads, sp.id)"
                :open="fillId === sp.id || (!!editId && adInSpot(ads, sp.id)?.id === editId)"
                @fill="openFill(sp)" @edit="toggleEdit(adInSpot(ads, sp.id))"
              />
            </div>
            <form v-if="fillSpot && fillSpot.offer.id === o.id" class="ad__form" @submit.prevent="create">
              <p class="ad__formtitle"><b>Fill {{ fillSpot.label }}</b> · {{ PAGE_LABEL(fillSpot.page) }} · {{ fillSpot.size.replace('x', '×') }}<template v-if="fillSpot.mobile"> (phones {{ fillSpot.mobile.replace('x', '×') }})</template></p>
              <div class="ad__field">
                <span class="ad__label">What it’s for</span>
                <div class="cs-tabs" role="radiogroup" aria-label="What the ad is for">
                  <button v-for="p in PURPOSES" :key="p.id" type="button" role="radio" class="cs-tab cs-tab--sm" :class="{ 'is-on': form.purpose === p.id }" :aria-checked="form.purpose === p.id" @click="pickPurpose(p.id)">
                    <Icon :name="p.icon" :size="16" /> {{ p.label }}
                  </button>
                </div>
              </div>
              <div v-if="form.how !== 'upload'" class="ad__field">
                <span class="ad__label">Look</span>
                <div class="cs-tabs" role="radiogroup" aria-label="The ad's look">
                  <button v-for="t in lookList" :key="t.id" type="button" role="radio" class="cs-tab cs-tab--sm" :class="{ 'is-on': form.type === t.id }" :aria-checked="form.type === t.id" :title="t.note" @click="form.type = t.id">{{ t.label }}</button>
                </div>
              </div>
              <div class="ad__field">
                <span class="ad__label">How to make it</span>
                <div class="cs-tabs" role="radiogroup" aria-label="How to make the ad">
                  <button v-for="h in HOWS" :key="h.id" type="button" role="radio" class="cs-tab cs-tab--sm" :class="{ 'is-on': form.how === h.id }" :aria-checked="form.how === h.id" :title="h.note" @click="h.id === 'upload' && !form.upload ? uploadInput.click() : (form.how = h.id)">
                    <Icon :name="h.icon" :size="16" /> {{ h.label }}
                  </button>
                </div>
                <input ref="uploadInput" type="file" accept="image/*" hidden aria-label="Choose an ad file" @change="onUpload" />
                <p v-if="form.how === 'upload' && form.upload" class="ad__upload"><img :src="form.upload" alt="" /> {{ form.uploadName }} <button type="button" class="ad__link" @click="uploadInput.click()">Change</button></p>
              </div>
              <div class="ad__grid">
                <label class="ad__input"><span>{{ form.purpose === 'sponsor' ? 'Sponsor name' : 'Headline' }}</span><input v-model="form.name" type="text" maxlength="40" /></label>
                <label class="ad__input"><span>Short line</span><input v-model="form.tagline" type="text" maxlength="90" /></label>
                <label class="ad__input"><span>Button</span><input v-model="form.cta" type="text" maxlength="24" /></label>
                <label class="ad__input"><span>Link</span><input v-model="form.url" type="url" placeholder="https://" /></label>
              </div>
              <div v-if="form.purpose === 'sponsor'" class="ad__field">
                <span class="ad__label">Sponsor logo</span>
                <p class="ad__upload">
                  <img v-if="form.logo" :src="form.logo" alt="" />
                  <button type="button" class="cs-tab cs-tab--sm" @click="logoInput.click()"><Icon name="clip" :size="16" /> {{ form.logo ? form.logoName : 'Upload a logo' }}</button>
                </p>
                <input ref="logoInput" type="file" accept="image/*" hidden aria-label="Choose a sponsor logo" @change="onLogo" />
              </div>
              <div class="ad__formfoot">
                <small>{{ form.how === 'upload' ? 'Re-fitted to' : 'Made for' }} this spot{{ fillSpot.mobile ? ' and phones' : '' }}{{ form.how === 'upload' ? '' : ` · about ${fillSizes.length} credit${fillSizes.length === 1 ? '' : 's'}` }}</small>
                <button type="button" class="cs-btn-ghost" @click="fillId = ''">Cancel</button>
                <button type="submit" class="cs-btn-dark" :disabled="!canCreate || state.working"><Icon name="spark" :size="16" /> Create ad</button>
              </div>
            </form>
            <div v-if="editing && editing.spot && editing.spot.startsWith(`${o.id}#`)" class="ad__editing">
              <AdSuite :project="project" :ad="editing" />
              <button type="button" class="cs-btn-ghost ad__done" @click="editId = ''">Done</button>
            </div>
          </div>
        </section>

        <template v-if="unplaced.length">
          <h4 class="ad__unplaced">Not on the pages <small>Their spots are turned off above</small></h4>
          <AdSuite v-for="a in unplaced" :key="a.id" :project="project" :ad="a" />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ad { height: 100%; overflow-y: auto; scrollbar-gutter: stable; background: var(--surface-2); }
.ad__inner { width: min(1100px, 100%); margin: 0 auto; padding: 28px 28px 72px; display: grid; gap: 28px; }
.ad__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ad__head h2 { margin: 0; font-size: 24px; }
.ad__head p { margin: 4px 0 0; color: var(--ink-2); }
.ad__sec { display: grid; gap: 12px; }
.ad__sec h3 { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 18px; }
.ad__sec h3 > span { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--pill); color: var(--pill-ink); font-size: 13px; }
.ad__sec h3 small { padding: 0 8px; border-radius: 999px; background: var(--surface-3); color: var(--ink-2); font-size: 13px; line-height: 22px; }
.ad__sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ad__secacts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ad__gone { margin: 0; padding: 12px 14px; border: 1px dashed var(--line-bold); border-radius: var(--r); color: var(--ink-2); font-size: 14px; }
.ad__gone button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.ad__hint { margin: -4px 0 4px; color: var(--ink-2); font-size: 14px; }
.ad__pages { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.ad__page { display: grid; gap: 8px; align-content: start; }
.ad__pagelabel { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.ad__offer { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; cursor: pointer; }
.ad__offer:hover { border-color: var(--line-bold); }
.ad__offer.is-on { border-color: var(--pill); background: var(--selected); }
.ad__shape { display: grid; place-items: center; width: 72px; height: 56px; flex: none; border-radius: var(--r); background: var(--surface-3); }
.ad__shape i { display: block; border-radius: 1px; background: var(--navy-200); }
.ad__offer.is-on .ad__shape i { background: var(--pill); }
.ad__offertext { flex: 1; display: grid; min-width: 0; }
.ad__offertext b { font-size: 14px; }
.ad__offertext small { color: var(--ink-3); font-size: 12px; }
.ad__check { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border: 1.5px solid var(--line-bold); border-radius: 4px; color: var(--pill-ink); }
.ad__offer.is-on .ad__check { background: var(--pill); border-color: var(--pill); }
.ad__sum { margin: 0; font-size: 14px; color: var(--ink-2); }
.ad__form { display: grid; gap: 16px; padding: 18px; border: 1px solid var(--line-bold); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow); }
.ad__field { display: grid; gap: 8px; }
.ad__label, .ad__input span { font-size: 13px; font-weight: 700; color: var(--ink-2); }
.ad__grid { display: grid; grid-template-columns: 1fr 1.6fr 1fr 1.4fr; gap: 12px; }
.ad__input { display: grid; gap: 4px; }
.ad__input input { min-height: 40px; padding: 8px 12px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); font: inherit; color: var(--ink); }
.ad__input input:focus { outline: none; border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.ad__upload { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 14px; color: var(--ink-2); }
.ad__upload img { height: 40px; max-width: 120px; object-fit: contain; border-radius: 2px; background: #fff; border: 1px solid var(--line); }
.ad__link { border: 0; background: none; color: var(--accent); font-weight: 700; cursor: pointer; }
.ad__formfoot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
.ad__formfoot small { margin-right: auto; color: var(--ink-3); }
.ad__formtitle { margin: 0; font-size: 14px; color: var(--ink-2); }
.ad__formtitle b { color: var(--ink); font-size: 16px; }
.ad__bypage { display: grid; gap: 14px; padding: 18px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); }
.ad__bypage h4, .ad__unplaced { display: flex; align-items: baseline; gap: 10px; margin: 0; font-size: 17px; }
.ad__bypage h4 small, .ad__unplaced small { color: var(--ink-3); font-size: 13px; font-weight: 400; }
.ad__row { display: grid; gap: 10px; }
.ad__row + .ad__row { padding-top: 14px; border-top: 1px solid var(--line); }
.ad__rowlabel { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.ad__spots { display: grid; gap: 12px; }
.ad__spots.is-box { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
.ad__spots.is-tall { grid-template-columns: repeat(auto-fill, minmax(220px, 260px)); }
.ad__spots.is-wide { grid-template-columns: 1fr; }
.ad__editing { display: grid; gap: 8px; justify-items: end; }
.ad__editing > :first-child { justify-self: stretch; }
@media (max-width: 900px) { .ad__pages { grid-template-columns: 1fr; } .ad__grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .ad__inner { padding: 20px 14px 48px; } .ad__grid { grid-template-columns: 1fr; } }
</style>
