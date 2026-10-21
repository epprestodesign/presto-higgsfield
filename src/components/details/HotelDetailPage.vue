<script setup>
// HotelDetailPage — the full hotel detail screen, composed from the Hotel
// Details building blocks: a photo gallery (DsImageList), a sticky DetailTabs
// nav that scrolls to each section, the HotelSummaryHeader, the RoomsCarousel
// ("Select Your Room"), and the About / Amenities / Policies sections.
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { loadImagery } from '../../lib/imagery'
import GalleryHero from './GalleryHero.vue'
import DetailTabs from './DetailTabs.vue'
import HotelSummaryHeader from './HotelSummaryHeader.vue'
import PropertyFacts from './PropertyFacts.vue'
import RoomsCarousel from './RoomsCarousel.vue'
import AboutProperty from './AboutProperty.vue'
import AmenitiesSection from './AmenitiesSection.vue'
import PoliciesSection from './PoliciesSection.vue'
import BookingWidget from '../BookingWidget.vue'

const props = defineProps({
  // Summary header
  name: { type: String, default: 'Hotel Name' },
  stars: { type: Number, default: 0 },
  address: { type: String, default: '' },
  distance: { type: String, default: '' },
  score: { type: Number, default: null },
  reviews: { type: Number, default: null },
  ratingLabel: { type: String, default: '' },
  preferred: { type: Boolean, default: false },
  lowRateGuarantee: { type: Boolean, default: false },
  checkInTime: { type: String, default: '' },
  checkOutTime: { type: String, default: '' },
  popularAmenities: { type: Array, default: () => [] },
  lat: { type: Number, default: 28.5383 },
  lng: { type: Number, default: -81.3792 },

  // Gallery
  galleryCategories: { type: Array, default: () => ['exterior', 'rooms', 'dining', 'suites', 'bar', 'pool', 'lobby', 'spa', 'bathroom'] },
  seed: { type: Number, default: 0 },

  // Optional booking widget under the Global Nav (no hotel-details header/hero).
  // showWidget → renders the widget band; widgetShowTeams → Teams vs Core widget.
  showWidget: { type: Boolean, default: false },
  widgetShowTeams: { type: Boolean, default: true },
  showDetailHeader: { type: Boolean, default: true }, // gallery + tabs + summary

  // Rooms
  rooms: { type: Array, default: () => [] },
  roomsFlow: { type: String, default: 'reserve' }, // 'reserve' | 'group'
  roomsTitle: { type: String, default: 'Select Your Room' },
  roomsSubtitle: { type: String, default: '' },
  // DES-453: up to three secondary custom fees for this hotel — surfaced in the
  // room cards' Price Details modal.
  secondaryFees: { type: Array, default: null },

  // Sections. `about` accepts a string (one paragraph) or an array of paragraphs.
  about: { type: [String, Array], default: '' },
  amenityGroups: { type: Array, default: () => [] },
  policies: { type: Array, default: () => [] },
})
const emit = defineEmits(['back'])
const widgetMode = computed(() => (props.roomsFlow === 'group' ? 'group' : 'reservations'))

// Phones follow production's details order (DES-420 / DES-423): hero with an
// overlaid circular back button → name + stars → About → PropertyFacts
// (amenities · check-in/out · map · distance) → Select Your Room. No tab bar.
const $q = useQuasar()
const isPhone = computed(() => $q.screen.lt.sm)

// About copy: array → paragraphs, string → single paragraph.
const aboutText = computed(() => (Array.isArray(props.about) ? '' : props.about))
const aboutParagraphs = computed(() => (Array.isArray(props.about) ? props.about : []))

const tabs = [
  { name: 'overview', label: 'Overview' },
  { name: 'rooms', label: 'Rooms' },
  { name: 'property', label: 'Property' },
  { name: 'amenities', label: 'Amenities' },
  { name: 'policies', label: 'Policies' },
]
const activeTab = ref('overview')
const root = ref(null)

const onTab = (name) => {
  if (name === 'overview') { root.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
  const el = root.value?.querySelector(`#hdp-${name}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Gallery images sourced from the local imagery library by category.
const gallery = ref([])
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
onMounted(async () => {
  const lib = await loadImagery()
  const out = []
  props.galleryCategories.forEach((c, k) => {
    const arr = lib[c]
    if (arr && arr.length) { const e = arr[(props.seed + k) % arr.length]; out.push({ src: e.url, title: cap(c) }) }
  })
  gallery.value = out
})
</script>

<template>
  <div ref="root" class="hdp">
    <!-- Optional booking widget under the Global Nav (no hotel-details header) -->
    <div v-if="showWidget" class="hdp__searchband">
      <booking-widget
        :mode="widgetMode" :tabs="false" :show-mode="false"
        :show-teams="widgetShowTeams" :show-dates="true"
      />
    </div>

    <!-- Back to results. On phones this is a circular arrow overlaid on the hero
         (production), so it renders inside the gallery block instead. -->
    <button v-if="!isPhone" type="button" class="hdp__back" @click="emit('back')">
      <q-icon name="chevron_left" size="22px" /> Back to Hotel listing
    </button>

    <template v-if="showDetailHeader">
      <!-- Photo hero gallery -->
      <div class="hdp__hero">
        <gallery-hero :images="gallery" :all-images="gallery" />
        <button v-if="isPhone" type="button" class="hdp__backfab" aria-label="Back to hotel listing" @click="emit('back')">
          <q-icon name="arrow_back" size="22px" />
        </button>
      </div>

      <!-- Section nav — production's phone page has no tab bar. -->
      <div v-if="!isPhone" class="hdp__tabs">
        <detail-tabs v-model="activeTab" :tabs="tabs" @select="onTab" />
      </div>

      <!-- Summary -->
      <hotel-summary-header
        :name="name" :stars="stars" :address="address" :distance="distance"
        :score="score" :reviews="reviews" :rating-label="ratingLabel"
        :preferred="preferred" :low-rate-guarantee="lowRateGuarantee"
        :check-in-time="checkInTime" :check-out-time="checkOutTime"
        :amenities="popularAmenities" :lat="lat" :lng="lng"
        :compact="isPhone"
      />
    </template>

    <!-- Property / About — grouped with the summary's Popular Amenities -->
    <section id="hdp-property" class="hdp__section">
      <about-property
        :title="isPhone ? 'About this property' : 'More about the property'"
        :text="aboutText"
        :paragraphs="aboutParagraphs"
      />
    </section>

    <!-- Phones: the facts the compact header dropped — amenities, check-in/out,
         map + address, distance (DES-420 / DES-423). -->
    <section v-if="isPhone && showDetailHeader" class="hdp__section hdp__section--facts">
      <property-facts
        :name="name" :amenities="popularAmenities"
        :check-in-time="checkInTime" :check-out-time="checkOutTime"
        :address="address" :distance="distance" :lat="lat" :lng="lng"
        @see-all-amenities="onTab('amenities')"
      />
    </section>

    <!-- Rooms -->
    <section id="hdp-rooms" class="hdp__section hdp__section--ruled">
      <rooms-carousel :rooms="rooms" :flow="roomsFlow" :title="roomsTitle" :subtitle="roomsSubtitle" :secondary-fees="secondaryFees" />
    </section>

    <!-- Amenities -->
    <section id="hdp-amenities" class="hdp__section hdp__section--ruled">
      <amenities-section :groups="amenityGroups" />
    </section>

    <!-- Policies -->
    <section id="hdp-policies" class="hdp__section hdp__section--ruled">
      <policies-section :policies="policies" />
    </section>
  </div>
</template>

<style scoped>
.hdp { max-width: 1180px; margin: 0 auto; padding: 18px 24px 60px; display: flex; flex-direction: column; }
/* Booking widget band — full-bleed white strip directly under the Global Nav. */
.hdp__searchband { margin: -18px calc(50% - 50vw) 20px; padding: 12px max(24px, calc(50vw - 50%)); background: var(--ds-color-surface); border-bottom: 1px solid var(--ds-color-border); }
.hdp__searchband :deep(.bw) { border: 0; border-radius: 0; padding: 8px 0; }

.hdp__back { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; margin: 0 0 16px; padding: 6px 0; background: none; border: 0; color: var(--ds-color-text); font-family: inherit; font-size: 1.125rem; font-weight: 700; cursor: pointer; }
.hdp__back:hover { color: var(--ds-color-text-brand); }
.hdp__back .q-icon { color: inherit; }
.hdp__tabs { position: sticky; top: 0; z-index: 5; background: var(--ds-color-surface); margin: 24px 0; }
/* Hero wrapper — positioning context for the phone back button. */
.hdp__hero { position: relative; }
.hdp__backfab {
  position: absolute; top: 12px; left: 12px; z-index: 3;
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 50%; background: #fff; color: var(--ds-color-text);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.3); cursor: pointer;
}
/* Phones: near-edge-to-edge gutters. */
@media (max-width: 600px) {
  .hdp { padding: 0 16px 16px; }
  /* The hero runs square to the screen edges under the nav, like production, with
     breathing room before the header badges ("Preferred Hotel" / "Lowest Rate
     Guarantee") and the name block beneath it. */
  .hdp__hero { margin: 0 -16px 24px; }
  .hdp__section--facts { padding-top: 20px; }
  /* Tabs stay sticky; the sticky offset is a var the host can set so they stick
     BELOW an app nav (the prototype sets it to the nav height). Bleed the bar's
     background full-width (labels stay inset) so content scrolling under it is
     fully covered edge-to-edge. */
  .hdp__tabs { top: var(--hdp-tabs-top, 0); margin-inline: -16px; padding-inline: 16px; }
}
.hdp__section { padding-top: 28px; }
.hdp__section--ruled { margin-top: 20px; border-top: 1px solid var(--ds-color-border); padding-top: 32px; }
</style>
