<script setup>
// BrandedConfirmation — SAMPLE confirmation screen in the organizer's branding.
// Clearly labelled: no reservation exists behind it.
import { computed } from 'vue'
import PageFrame from '@lib/components/PageFrame.vue'
import ConfirmationPage from '@lib/components/confirmation/ConfirmationPage.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import DemoNotice from './DemoNotice.vue'
import { HOTELS } from '../../data/upstream/hotels.js'
import { confirmationData } from '../../data/upstream/fixtures.js'
import { navBrand, navLogo } from './previewModel.js'

const props = defineProps({
  project: { type: Object, required: true },
  hotel: { type: Object, default: null },
})
const data = computed(() => {
  const h = props.hotel || HOTELS[props.project.pages?.details?.hotelIndex || 0] || HOTELS[0]
  const organizer = props.project.organizer || {}
  const d = confirmationData([h], 'reserve')
  return { ...d, confirmationId: 'DEMO-0000-0000', email: organizer.email || d.email }
})
</script>

<template>
  <brand-theme-provider :brand-kit="project.brandKit" :start-date="project.event.startDate" :end-date="project.event.endDate" class="bp">
    <page-frame :brand="navBrand(project)" :logo="navLogo(project)" cart-mode="reserve" :show-cart="false">
      <div class="bcf__notice">
        <demo-notice variant="inline" title="Sample confirmation — no reservation was made." message="This screen shows what attendees see after booking. Confirmation numbers and details are placeholders." />
      </div>
      <confirmation-page mode="reserve" :data="data" />
    </page-frame>
  </brand-theme-provider>
</template>

<style scoped>
.bcf__notice { padding: 0 24px 8px; }
@media (max-width: 600px) { .bcf__notice { padding: 0 16px; } }
</style>
