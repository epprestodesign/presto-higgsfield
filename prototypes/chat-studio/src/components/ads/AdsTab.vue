<script setup>
// A project's Advertisements: 1) pick the banners this event offers (the
// approved placements), 2) make ads — for a sponsor, or pointing at the
// event's own About / Sponsors / FAQ pages — designed with Higgsfield one size
// at a time or as a whole package, or re-fitted from an uploaded ad,
// 3) see them on the real Presto pages.
import { computed, reactive, ref } from 'vue'
import Icon from '../Icon.vue'
import AdSuite from './AdSuite.vue'
import { OFFERS, PAGES, AD_SIZES, PURPOSES, offerMobile, packageSizes, purposeDefaults, createAd, designPackage, designSize } from '../../ads.js'
import { adsChat, state } from '../../mockAgent.js'
import { route } from '../../router.js'

const props = defineProps({ project: { type: Object, required: true } })
const ads = computed(() => props.project.ads)
const sizes = computed(() => packageSizes(ads.value))

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

// ---- 2. New ad
const formOpen = ref(!ads.value.items.length)
const form = reactive({ purpose: 'sponsor', how: 'package', name: '', tagline: '', cta: 'Learn more', url: '', logo: null, logoName: '', upload: null, uploadName: '' })
function pickPurpose(p) {
  form.purpose = p
  Object.assign(form, purposeDefaults(p, props.project.brand))
}
const logoInput = ref(null)
const uploadInput = ref(null)
function onLogo(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) { form.logo = URL.createObjectURL(f); form.logoName = f.name } }
function onUpload(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) { form.upload = URL.createObjectURL(f); form.uploadName = f.name; form.how = 'upload'; if (!form.name) form.name = f.name.replace(/\.[^.]+$/, '') } }
const canCreate = computed(() => sizes.value.length && (form.how === 'upload' ? !!form.upload : !!form.name.trim()))
const HOWS = [
  { id: 'package', label: 'Higgsfield · whole package', icon: 'spark', note: 'Every size at once' },
  { id: 'single', label: 'Higgsfield · one size at a time', icon: 'image', note: 'Design sizes as you go' },
  { id: 'upload', label: 'Upload an existing ad', icon: 'clip', note: 'We re-fit it to every size' },
]

function create() {
  if (!canCreate.value) return
  const ad = createAd(props.project, { ...form, logo: form.purpose === 'sponsor' ? form.logo : null })
  const what = form.purpose === 'sponsor' ? `a sponsor ad for ${ad.name}` : `an ad for our ${PURPOSES.find((p) => p.id === form.purpose).label.toLowerCase()}`
  if (form.how === 'package') {
    adsChat(props.project, `Make ${what}, the whole package`, `Designing **${ad.name}** with Higgsfield in ${sizes.value.length} sizes · about ${sizes.value.length} credits.`, ad.id)
    designPackage(props.project, ad)
  } else if (form.how === 'upload') {
    adsChat(props.project, `Here's an existing ad (${form.uploadName}). Re-fit it for our pages.`, `Re-fitting **${form.uploadName}** to ${sizes.value.length} sizes.`, ad.id)
    designPackage(props.project, ad)
  } else {
    adsChat(props.project, `Make ${what}, one size at a time`, `Starting **${ad.name}** with the largest size. Design the others when you’re ready.`, ad.id)
    designSize(props.project, ad, sizes.value[0])
  }
  Object.assign(form, { name: '', tagline: '', cta: 'Learn more', url: '', logo: null, logoName: '', upload: null, uploadName: '', how: 'package' })
  pickPurpose('sponsor')
  formOpen.value = false
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
        <p class="ad__hint">The approved placements on the Presto pages. Pick the ones this event sells; every ad is made in the sizes they need.</p>
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
        <p class="ad__sum"><b>{{ ads.offers.length }}</b> placements · <b>{{ sizes.length }}</b> sizes per ad<template v-if="sizes.length">: {{ sizes.map((s) => s.replace('x', '×')).join(', ') }}</template></p>
      </section>

      <!-- 2. Ads -->
      <section class="ad__sec" aria-labelledby="ad-items">
        <div class="ad__sechead">
          <h3 id="ad-items"><span>2</span> Ads <small>{{ ads.items.length }}</small></h3>
          <button v-if="!formOpen" type="button" class="cs-btn-dark" @click="formOpen = true"><Icon name="plus" :size="18" /> New ad</button>
        </div>

        <form v-if="formOpen" class="ad__form" @submit.prevent="create">
          <div class="ad__field">
            <span class="ad__label">What it’s for</span>
            <div class="cs-tabs" role="radiogroup" aria-label="What the ad is for">
              <button v-for="p in PURPOSES" :key="p.id" type="button" role="radio" class="cs-tab cs-tab--sm" :class="{ 'is-on': form.purpose === p.id }" :aria-checked="form.purpose === p.id" @click="pickPurpose(p.id)">
                <Icon :name="p.icon" :size="16" /> {{ p.label }}
              </button>
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
            <small v-if="!sizes.length">Pick at least one banner above first.</small>
            <small v-else>{{ form.how === 'upload' ? 'Re-fitted' : 'Made' }} in {{ sizes.length }} sizes{{ form.how === 'upload' ? '' : ` · about ${form.how === 'single' ? 1 : sizes.length} credit${form.how === 'single' ? '' : 's'}` }}</small>
            <button v-if="ads.items.length" type="button" class="cs-btn-ghost" @click="formOpen = false">Cancel</button>
            <button type="submit" class="cs-btn-dark" :disabled="!canCreate || state.working"><Icon name="spark" :size="16" /> Create ad</button>
          </div>
        </form>

        <AdSuite v-for="a in ads.items" :key="a.id" :project="project" :ad="a" />
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
.ad__sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
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
@media (max-width: 900px) { .ad__pages { grid-template-columns: 1fr; } .ad__grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .ad__inner { padding: 20px 14px 48px; } .ad__grid { grid-template-columns: 1fr; } }
</style>
