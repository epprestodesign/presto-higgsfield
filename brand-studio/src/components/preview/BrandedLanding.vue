<script setup>
// BrandedLanding — the organizer's event landing page: the real Presto
// LandingPage, themed by the Brand Kit, with the selected concept's BrandHero,
// the Studio's section order / visibility / copy, and sponsor ads.
import { computed } from 'vue'
import LandingPage from '@lib/components/LandingPage.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrandHero from '../brand/BrandHero.vue'
import AdSlot from '../ads/AdSlot.vue'
import { heroProps, adsFor, hasSlot, navBrand, navLogo } from './previewModel.js'

const props = defineProps({
  project: { type: Object, required: true },
  interactiveAds: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate'])

const landing = computed(() => props.project.pages?.landing || {})
const sec = computed(() => landing.value.sections || {})
const ads = computed(() => adsFor(props.project, 'landing'))
const showAds = computed(() => hasSlot(ads.value.placements, 'landing.afterContent'))

const order = computed(() => landing.value.sectionOrder || null)
const hidden = computed(() => {
  const h = Object.entries(sec.value).filter(([, v]) => v && v.visible === false).map(([k]) => k)
  if (!showAds.value) h.push('ads')
  return h
})
// The widget is pulled 48px up onto the hero — pad the hero when it directly follows.
const widgetFirst = computed(() => (order.value || ['widget']).find((id) => !hidden.value.includes(id)) === 'widget')

const hero = computed(() => heroProps(props.project, { size: 'landing' }))
</script>

<template>
  <brand-theme-provider :brand-kit="project.brandKit" :start-date="project.event.startDate" :end-date="project.event.endDate" class="bp">
    <landing-page
      :brand="navBrand(project)"
      :logo="navLogo(project)"
      :event-name="hero.headline"
      :event-dates="hero.dates"
      :intro="sec.intro?.paragraphs || []"
      :benefits="sec.benefits?.items || []"
      :attending-title="sec.attending?.title || ''"
      :attending="sec.attending?.items || []"
      :event-info-title="sec.eventInfo?.title || ''"
      :event-info="{ dates: sec.eventInfo?.dates || hero.dates, lines: sec.eventInfo?.lines || [] }"
      :closing="sec.closing?.paragraphs || []"
      :show-teams="!!sec.widget?.showTeams"
      :section-order="order"
      :hidden-sections="hidden"
      :ads="0"
    >
      <template #hero>
        <div class="bl__hero" :class="{ 'bl__hero--tucked': widgetFirst }">
          <brand-hero v-bind="hero" @cta="emit('navigate', 'browse')" />
        </div>
      </template>
      <template #ads>
        <ad-slot slot-id="landing.afterContent" :placements="ads.placements" :sponsors="ads.sponsors" :interactive="interactiveAds" />
      </template>
    </landing-page>
  </brand-theme-provider>
</template>

<style scoped>
/* Leave room for the booking widget tucked 48px onto the hero (phones: 8px). */
.bl__hero--tucked :deep(.bh__content) { padding-bottom: calc(clamp(20px, 5cqi, 56px) + 48px); }
@media (max-width: 600px) {
  .bl__hero--tucked :deep(.bh__content) { padding-bottom: calc(clamp(20px, 5cqi, 56px) + 8px); }
}
</style>
