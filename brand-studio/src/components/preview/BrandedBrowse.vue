<script setup>
// BrandedBrowse — the real Presto HotelListPage (filters, sort, map, results
// states) in the organizer's branding, with a compact BrandHero band and the
// Browse ad slots: billboard/leaderboard above + below results, skyscraper rail.
import { computed } from 'vue'
import PageFrame from '@lib/components/PageFrame.vue'
import HotelListPage from '@lib/components/browse/HotelListPage.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrandHero from '../brand/BrandHero.vue'
import AdSlot from '../ads/AdSlot.vue'
import { heroProps, adsFor, hasSlot, slotWidth, navBrand, navLogo, searchDates } from './previewModel.js'

const props = defineProps({
  project: { type: Object, required: true },
  interactiveAds: { type: Boolean, default: false },
})

const browse = computed(() => props.project.pages?.browse || {})
const ads = computed(() => adsFor(props.project, 'browse'))
const has = (slot) => hasSlot(ads.value.placements, slot)
const hero = computed(() => heroProps(props.project, { size: 'compact' }))
const ev = computed(() => props.project.event || {})
const showTeams = computed(() => !!props.project.pages?.landing?.sections?.widget?.showTeams)
</script>

<template>
  <brand-theme-provider :brand-kit="project.brandKit" :start-date="project.event.startDate" :end-date="project.event.endDate" class="bp">
    <page-frame :brand="navBrand(project)" :logo="navLogo(project)" cart-mode="reserve">
      <hotel-list-page
        flow="reserve"
        :show-teams="showTeams"
        :state="browse.resultsState || 'full'"
        :event-name="hero.headline"
        :event-dates="hero.dates"
        :search-location="ev.city || ''"
        :search-dates="searchDates(project)"
        :card-cta-label="browse.cardCta || ''"
        :rail-width="has('browse.rail') ? slotWidth(ads.placements, 'browse.rail') : null"
      >
        <template #hero>
          <brand-hero v-bind="hero" />
        </template>
        <template v-if="has('browse.top')" #results-top>
          <ad-slot slot-id="browse.top" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
        </template>
        <template v-if="has('browse.rail')" #rail>
          <ad-slot slot-id="browse.rail" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
        </template>
        <template v-if="has('browse.bottom')" #results-bottom>
          <ad-slot slot-id="browse.bottom" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
        </template>
      </hotel-list-page>
    </page-frame>
  </brand-theme-provider>
</template>
