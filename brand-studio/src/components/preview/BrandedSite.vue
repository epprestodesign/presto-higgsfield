<script setup>
// BrandedSite — the organizer's whole booking site as a clickable demo:
// landing → browse → details → (simulated) checkout → (sample) confirmation.
//
// Contract (stable — used by PreviewHost, the Studio editor and the published
// demo):  props { project, page }  ·  emits navigate(page)
// `page` is controlled when the parent updates it on `navigate`; otherwise the
// site navigates itself (uncontrolled), so it also works standalone.
//
// The Presto page components don't emit navigation events, so (like the
// presto-2026 prototype) one capture-phase click handler on the site root maps
// CTA clicks to pages. Disabled pages (pages.checkout/confirmation.enabled =
// false) show an inline "not part of this demo" toast instead.
import { ref, watch, computed, nextTick } from 'vue'
import BrandedLanding from './BrandedLanding.vue'
import BrandedBrowse from './BrandedBrowse.vue'
import BrandedDetails from './BrandedDetails.vue'
import BrandedCheckout from './BrandedCheckout.vue'
import BrandedConfirmation from './BrandedConfirmation.vue'
import DemoNotice from './DemoNotice.vue'
import { HOTELS } from '../../data/upstream/hotels.js'

const props = defineProps({
  project: { type: Object, required: true },
  page: { type: String, default: 'landing' },
  interactiveAds: { type: Boolean, default: false },
  showDemoNotice: { type: Boolean, default: true },
})
const emit = defineEmits(['navigate'])

const PAGES = { landing: BrandedLanding, browse: BrandedBrowse, details: BrandedDetails, checkout: BrandedCheckout, confirmation: BrandedConfirmation }
const current = ref(PAGES[props.page] ? props.page : 'landing')
watch(() => props.page, (p) => { if (PAGES[p]) current.value = p })

const hotel = ref(null)
const toast = ref('')
let toastTimer = null
const root = ref(null)

const enabled = (page) => page === 'landing' || props.project.pages?.[page]?.enabled !== false

function go(page) {
  if (!PAGES[page]) return
  if (!enabled(page)) {
    toast.value = page === 'checkout'
      ? 'Checkout isn’t part of this demo. Attendees would continue to a secure checkout here.'
      : 'This step isn’t part of this demo.'
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = '' }, 3800)
    return
  }
  toast.value = ''
  current.value = page
  emit('navigate', page)
  nextTick(() => {
    const el = root.value
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
  })
}

const hotelFromCard = (card, nameSel) => {
  const name = card.querySelector(nameSel)?.textContent?.trim()
  if (!name) return null
  return HOTELS.find((h) => h.name === name) || { name, city: props.project.event?.city || '', seed: name.length }
}

function onClickCapture(e) {
  const t = e.target
  if (!(t instanceof Element)) return
  // Never let a preview link leave the page (ads are non-interactive here too).
  const a = t.closest('a[href]')
  if (a && !props.interactiveAds && (a.getAttribute('href') || '').startsWith('#')) e.preventDefault()

  if (t.closest('.gnav__brand')) { e.preventDefault(); go('landing'); return }

  const page = current.value
  if (page === 'landing' && t.closest('.bw__search')) { go('browse'); return }
  if (page === 'browse') {
    const card = t.closest('.hc')
    if (card && (t.closest('.hc__name') || t.closest('.hc__cta'))) {
      hotel.value = hotelFromCard(card, '.hc__name')
      go('details')
      return
    }
    const hcard = t.closest('.hch')
    if (hcard && !t.closest('.hch__availtoggle')) {
      hotel.value = hotelFromCard(hcard, '.hch__name')
      go('details')
    }
    return
  }
  if (page === 'details') {
    const cta = t.closest('.rcr__cta, .rcg__cta')
    if (cta && !cta.disabled) go('checkout')
    return
  }
  if (page === 'checkout') {
    const rail = t.closest('.ck__railbtn')
    if (rail) go(/start over/i.test(rail.textContent || '') ? 'landing' : 'details')
    return
  }
  if (page === 'confirmation' && t.closest('.conf__banner-cta')) go('landing')
}

const Current = computed(() => PAGES[current.value])
const pageProps = computed(() => {
  const base = { project: props.project }
  if (current.value === 'landing' || current.value === 'browse' || current.value === 'details') base.interactiveAds = props.interactiveAds
  if (['details', 'checkout', 'confirmation'].includes(current.value)) base.hotel = hotel.value
  return base
})

defineExpose({ go, current })
</script>

<template>
  <div ref="root" class="bsite" :data-page="current" @click.capture="onClickCapture">
    <component :is="Current" v-bind="pageProps" @navigate="go" @submit="go('confirmation')" />
    <transition name="bsite-toast">
      <div v-if="toast" class="bsite__toast" role="status">{{ toast }}</div>
    </transition>
    <demo-notice v-if="showDemoNotice" />
  </div>
</template>

<style scoped>
.bsite { position: relative; min-height: 100%; }
.bsite__toast {
  position: fixed; left: 50%; bottom: 60px; z-index: 40; transform: translateX(-50%);
  max-width: min(440px, calc(100vw - 32px)); padding: 12px 16px; border-radius: 10px;
  background: #0F172A; color: #fff; font: 400 0.875rem/1.4 'PT Sans', sans-serif;
  box-shadow: 0 10px 30px rgb(3 10 38 / 0.3);
}
.bsite-toast-enter-active, .bsite-toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.bsite-toast-enter-from, .bsite-toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
@media (prefers-reduced-motion: reduce) { .bsite-toast-enter-active, .bsite-toast-leave-active { transition: none; } }
</style>
