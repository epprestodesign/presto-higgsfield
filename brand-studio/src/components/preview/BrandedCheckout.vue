<script setup>
// BrandedCheckout — SIMULATED checkout: the real Presto expanded checkout in the
// organizer's branding, behind a prominent "no payment is taken" notice. Nothing
// typed here is stored or sent; the final CTA only advances the preview to the
// sample confirmation (handled by BrandedSite). Never initiates a real booking.
import { computed } from 'vue'
import PageFrame from '@lib/components/PageFrame.vue'
import CheckoutPageExpanded from '@lib/components/checkout/CheckoutPageExpanded.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import DemoNotice from './DemoNotice.vue'
import { HOTELS } from '../../data/upstream/hotels.js'
import { cartFor, summaryFor } from '../../data/upstream/fixtures.js'
import { navBrand, navLogo } from './previewModel.js'

const props = defineProps({
  project: { type: Object, required: true },
  hotel: { type: Object, default: null },
})
const hotels = computed(() => [props.hotel || HOTELS[props.project.pages?.details?.hotelIndex || 0] || HOTELS[0]])
const cart = computed(() => cartFor(hotels.value, 'reservation'))
const summary = computed(() => summaryFor(hotels.value, 'reservation'))
const emit = defineEmits(['submit'])

// The library's "Book Now" shows a "Reservation confirmed" toast. In a demo that
// would be misleading, so intercept it (capture phase, before the button's own
// handler) and let the host advance to the sample confirmation instead.
function onClickCapture(e) {
  if (e.target instanceof Element && e.target.closest('.ck__submit')) {
    e.stopPropagation()
    e.preventDefault()
    emit('submit')
  }
}
</script>

<template>
  <brand-theme-provider :brand-kit="project.brandKit" :start-date="project.event.startDate" :end-date="project.event.endDate" class="bp">
    <page-frame :brand="navBrand(project)" :logo="navLogo(project)" cart-mode="reserve">
      <div class="bc__notice"><demo-notice variant="inline" /></div>
      <!-- autocomplete off + no form action: nothing here can be submitted anywhere. -->
      <form class="bc" autocomplete="off" @submit.prevent @click.capture="onClickCapture">
        <checkout-page-expanded mode="reservation" :cart="cart" :summary="summary" :show-teams="false" />
      </form>
    </page-frame>
  </brand-theme-provider>
</template>

<style scoped>
.bc__notice { padding: 0 24px 16px; }
@media (max-width: 600px) { .bc__notice { padding: 0 16px 12px; } }
</style>
