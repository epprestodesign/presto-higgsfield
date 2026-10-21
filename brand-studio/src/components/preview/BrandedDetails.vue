<script setup>
// BrandedDetails — the real Presto HotelDetailPage (gallery, summary, rooms,
// amenities, policies) in the organizer's branding, under a compact BrandHero,
// with the Details ad slots: billboard after rooms, rail beside the property
// info, billboard at the bottom (references/102126 Screen-4 … Screen-7).
import { computed } from 'vue'
import PageFrame from '@lib/components/PageFrame.vue'
import HotelDetailPage from '@lib/components/details/HotelDetailPage.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrandHero from '../brand/BrandHero.vue'
import AdSlot from '../ads/AdSlot.vue'
import { HOTELS } from '../../data/upstream/hotels.js'
import { detailProps } from '../../data/upstream/fixtures.js'
import { heroProps, adsFor, hasSlot, slotWidth, navBrand, navLogo } from './previewModel.js'

const props = defineProps({
  project: { type: Object, required: true },
  // { name, city, … } — the hotel picked on Browse. Defaults to the sample
  // hotel at pages.details.hotelIndex.
  hotel: { type: Object, default: null },
  interactiveAds: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate'])

const details = computed(() => props.project.pages?.details || {})
const hotelRec = computed(() => props.hotel || HOTELS[details.value.hotelIndex || 0] || HOTELS[0])
const detail = computed(() => {
  const d = detailProps(hotelRec.value, 'reserve')
  if (details.value.roomsTitle) d.roomsTitle = details.value.roomsTitle
  return d
})
const ads = computed(() => adsFor(props.project, 'details'))
const has = (slot) => hasSlot(ads.value.placements, slot)
const hero = computed(() => heroProps(props.project, { size: 'compact' }))
</script>

<template>
  <brand-theme-provider :brand-kit="project.brandKit" :start-date="project.event.startDate" :end-date="project.event.endDate" class="bp">
    <page-frame :brand="navBrand(project)" :logo="navLogo(project)" cart-mode="reserve">
      <brand-hero v-bind="hero" />
      <!-- Keyed on the rail: the page reads its rail slot once at mount. -->
      <hotel-detail-page
        :key="has('details.rail') ? 'rail' : 'norail'"
        v-bind="detail"
        :rail-width="has('details.rail') ? slotWidth(ads.placements, 'details.rail') : 160"
        @back="emit('navigate', 'browse')"
      >
        <template v-if="has('details.afterRooms')" #after-rooms>
          <ad-slot slot-id="details.afterRooms" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
        </template>
        <template v-if="has('details.rail')" #rail>
          <ad-slot slot-id="details.rail" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" :rail-mode="project.ads?.railMode || 'auto'" />
        </template>
        <template v-if="has('details.bottom')" #bottom>
          <ad-slot slot-id="details.bottom" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
        </template>
      </hotel-detail-page>
    </page-frame>
  </brand-theme-provider>
</template>

<style scoped>
/* The page's own rail is sticky as a whole; AdSlot decides what pins (railMode),
   so the rail column just stretches the full height of the results. */
.bp :deep(.hdp__rail) { position: static; align-self: stretch; }
</style>
