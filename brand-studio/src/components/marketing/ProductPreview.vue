<script setup>
// ProductPreview — a realistic branded Presto booking page for a sample event,
// built from the REAL Presto components (GlobalNav, BookingWidget,
// HotelCardGroup) themed through BrandThemeProvider and fronted by BrandHero.
// `variant="desktop"` renders a 1200px page scaled into a browser frame;
// `variant="mobile"` renders a 390px page inside a phone frame.
import { computed } from 'vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrandHero from '../brand/BrandHero.vue'
import BrowserFrame from './BrowserFrame.vue'
import PhoneFrame from './PhoneFrame.vue'
import ScaledFrame from './ScaledFrame.vue'
import GlobalNav from '@lib/components/GlobalNav.vue'
import BookingWidget from '@lib/components/BookingWidget.vue'
import HotelCardGroup from '@lib/components/browse/HotelCardGroup.vue'
import { sampleProject } from '../../data/sampleEvents.js'
import { buildConcept, prestoBannerConcept } from '../../providers/ai/conceptFactory.js'
import { getImage } from '../../assets/imagery/index.js'
import { HOTELS, groupAvailability } from '../../data/upstream/hotels.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

const props = defineProps({
  sample: { type: String, default: 'heartland' },
  // Optional overrides so callers (CustomizationDemo) can drive the theme live.
  brandKit: { type: Object, default: null },
  concept: { type: Object, default: null },
  variant: { type: String, default: 'desktop' }, // 'desktop' | 'mobile'
  designHeight: { type: Number, default: 860 },
  hotels: { type: Number, default: 3 },
  headline: { type: String, default: '' },
})

const project = computed(() => sampleProject(props.sample))
const kit = computed(() => props.brandKit || project.value.brandKit)
const event = computed(() => project.value.event)

// Concept: explicit override, else the Presto banner standard on the kit's
// generated banner, else the kit's preferred direction (template 0).
const TEMPLATE = { signature: 0, energy: 0, premium: 0 }
const concept = computed(() => {
  if (props.concept) return props.concept
  const banner = getImage(kit.value.bannerImageId)
  if (banner) return prestoBannerConcept(kit.value, banner)
  return buildConcept({ direction: kit.value.direction, templateIndex: TEMPLATE[kit.value.direction] ?? 0, brandKit: kit.value, event: event.value })
})

const hero = computed(() => ({
  concept: concept.value,
  brandKit: kit.value,
  headline: props.headline || event.value.name,
  tagline: project.value.pages.landing.hero.tagline,
  dates: formatDateRange(event.value.startDate, event.value.endDate),
  location: locationLabel(event.value),
}))

// Featured hotels — real cards fed by the prototype's mock hotel database.
const cards = computed(() =>
  HOTELS.filter((h) => h.availability !== 'unavailable')
    .slice(0, props.hotels)
    .map((h) => ({
      name: h.name,
      city: h.city,
      stars: h.stars,
      distance: h.distance,
      preferred: h.preferred,
      refundable: h.refundable,
      startingPrice: h.startingPrice,
      fromNightly: h.fromNightly,
      total: h.total,
      availability: groupAvailability(h.availability),
      roomsAvailable: h.roomsAvailable,
      rooms: h.rooms,
      seed: h.seed,
      imageCategories: h.imageCategories,
    })),
)

const navBrand = computed(() => project.value.organizer.organization || event.value.name)
const slug = computed(() => `demo.eventpipe.com/${project.value.publishing.slug}`)
</script>

<template>
  <browser-frame v-if="variant === 'desktop'" :url="slug" :label="`Desktop preview of the ${event.name} booking page`">
    <scaled-frame :design-width="1200" :design-height="designHeight">
      <brand-theme-provider :brand-kit="kit" class="pp" inert>
        <global-nav :brand="navBrand" :show-cart="false" />
        <brand-hero v-bind="hero" :heading-level="2" />
        <div class="pp__widget">
          <booking-widget mode="" :tabs="false" :show-teams="event.category === 'sports'" />
        </div>
        <section class="pp__hotels">
          <h3 class="pp__h">Official event hotels</h3>
          <div class="pp__grid">
            <hotel-card-group v-for="c in cards" :key="c.name" v-bind="c" flow="group" orientation="vertical" cta-label="Choose your room" />
          </div>
        </section>
      </brand-theme-provider>
    </scaled-frame>
  </browser-frame>

  <phone-frame v-else :label="`Mobile preview of the ${event.name} booking page`" :screen-height="designHeight">
    <brand-theme-provider :brand-kit="kit" class="pp pp--mobile" inert>
      <brand-hero v-bind="hero" :heading-level="2" />
      <section class="pp__hotels">
        <h3 class="pp__h">Official event hotels</h3>
        <hotel-card-group v-for="c in cards.slice(0, 2)" :key="c.name" v-bind="c" flow="group" orientation="vertical" cta-label="Choose your room" />
      </section>
    </brand-theme-provider>
  </phone-frame>
</template>

<style scoped>
/* Mock pages are decorative: `inert` keeps them out of the tab order / AT. */
.pp { display: block; background: var(--ds-color-surface-sunken); min-height: 100%; pointer-events: none; user-select: none; }
.pp__widget { max-width: 1040px; margin: -40px auto 0; padding: 0 24px; position: relative; z-index: 2; }
.pp__widget :deep(.bw) { background: #fff; box-shadow: var(--ds-shadow-2); }
.pp__hotels { max-width: 1120px; margin: 0 auto; padding: 36px 24px 24px; }
.pp__h { font-family: var(--brand-font-heading); font-size: 1.5rem; margin: 0 0 18px; color: var(--ds-color-text); }
.pp__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
/* Presto's vertical card is fixed at 320px; let it fill the preview column. */
.pp :deep(.hc--vertical) { width: 100%; }
.pp--mobile .pp__hotels { padding: 20px 14px; display: grid; gap: 16px; }
.pp--mobile .pp__h { font-size: 1.2rem; margin: 0; }
</style>
