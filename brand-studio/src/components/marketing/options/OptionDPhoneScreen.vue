<script setup>
// OptionDPhoneScreen — the static Presto page bits shown inside the iPhone
// mockups on homepage Option D. Laid out at 390 design px (IPhone's screen
// width); IPhone scales the whole thing. Purely presentational.
//   variant  'hotels'  branded hero + hotel list with room-block counts
//            'brand'   branded hero + search card (used twice, two brand kits)
//            'updates' guest update composer + sent updates
//            'ads'     branded page with a sponsor 300×250 in the flow
import { computed } from 'vue'
import BrandHero from '../../brand/BrandHero.vue'
import AdCreative from '../../ads/AdCreative.vue'
import { sampleProject } from '../../../data/sampleEvents.js'
import { SAMPLE_SPONSORS } from '../../../data/sponsors.js'
import { formatDateRange, locationLabel } from '../../../models/event.js'

const props = defineProps({
  variant: { type: String, default: 'hotels' },
  sample: { type: String, default: 'heartland' },
  sponsorIndex: { type: Number, default: 0 },
})

const project = computed(() => sampleProject(props.sample))
const hero = computed(() => ({
  brandKit: project.value.brandKit,
  headline: project.value.event.name,
  dates: formatDateRange(project.value.event.startDate, project.value.event.endDate),
  location: locationLabel(project.value.event),
}))
const primary = computed(() => project.value.brandKit.colors?.primary || '#01113E')

// Fictional properties — never real hotel brands.
const HOTELS = [
  { name: 'Fieldhouse Inn & Suites', miles: '0.4 mi', price: 149, left: 12, of: 40 },
  { name: 'The Meridian Park Hotel', miles: '1.1 mi', price: 179, left: 26, of: 60 },
  { name: 'Harbor Lane Suites', miles: '2.3 mi', price: 132, left: 5, of: 30 },
]
const UPDATES = [
  { text: 'Shuttle leaves the hotel lobby at 7:15 tomorrow.', meta: 'Sent to 214 guests · 6:02 pm' },
  { text: 'Room block extended to May 30. Book by Friday!', meta: 'Sent to 214 guests · Tue' },
]
</script>

<template>
  <div class="odp" :style="{ '--odp-brand': primary }">
    <template v-if="variant === 'hotels' || variant === 'brand' || variant === 'ads'">
      <div class="odp__nav">
        <img v-if="project.brandKit.logo?.src" :src="project.brandKit.logo.src" alt="" />
        <span>{{ project.event.name }}</span>
      </div>
      <brand-hero v-bind="hero" size="card" :heading-level="3" class="odp__hero" />
    </template>

    <!-- hotels -->
    <div v-if="variant === 'hotels'" class="odp__body">
      <p class="odp__label">Official hotels · {{ HOTELS.length }}</p>
      <div v-for="h in HOTELS" :key="h.name" class="odp__hotel">
        <span class="odp__thumb" aria-hidden="true" />
        <span class="odp__hotel-main">
          <strong>{{ h.name }}</strong>
          <small>{{ h.miles }} from venue · {{ h.left }} of {{ h.of }} rooms left</small>
          <span class="odp__bar"><span :style="{ width: `${100 - (h.left / h.of) * 100}%` }" /></span>
        </span>
        <span class="odp__price">${{ h.price }}<small>/night</small></span>
      </div>
    </div>

    <!-- brand -->
    <div v-else-if="variant === 'brand'" class="odp__body">
      <div class="odp__search">
        <span><small>Check-in – Check-out</small>{{ hero.dates || 'Select dates' }}</span>
        <span><small>Travelers</small>2 guests, 1 room</span>
        <b>Search hotels</b>
      </div>
      <p class="odp__label">Why book here</p>
      <ul class="odp__ticks">
        <li>Event rates below public prices</li>
        <li>Walk or shuttle to the venue</li>
        <li>Free cancellation on most rooms</li>
      </ul>
    </div>

    <!-- updates -->
    <div v-else-if="variant === 'updates'" class="odp__updates">
      <div class="odp__compose-head"><span>Cancel</span><strong>New guest update</strong><span class="odp__send">Send</span></div>
      <div class="odp__to"><small>To</small><span class="odp__chip">Booked · 186</span><span class="odp__chip">Not booked · 28</span></div>
      <div class="odp__msg"><small>Your message</small>Check-in opens at 3 pm. Show your team badge for the event rate.</div>
      <p class="odp__label">Sent updates</p>
      <div v-for="u in UPDATES" :key="u.text" class="odp__sent">
        <span>{{ u.text }}</span>
        <small>{{ u.meta }}</small>
      </div>
    </div>

    <!-- ads -->
    <div v-if="variant === 'ads'" class="odp__body">
      <p class="odp__label">From our sponsors</p>
      <ad-creative :sponsor="SAMPLE_SPONSORS[sponsorIndex % SAMPLE_SPONSORS.length]" size="300x250" :interactive="false" class="odp__ad" />
    </div>
  </div>
</template>

<style scoped>
.odp { width: 390px; min-height: 100%; background: #fff; font-family: 'Inter', 'PT Sans', sans-serif; color: #0F172A; }
.odp__nav { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #EEF0F4; font-weight: 700; font-size: 15px; }
.odp__nav img { height: 28px; width: auto; }
.odp__nav span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.odp__hero :deep(.bh--card) { aspect-ratio: 16 / 10; }
.odp__body { padding: 16px; display: grid; gap: 10px; }
.odp__label { margin: 4px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748B; }
.odp__hotel { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #EEF0F4; border-radius: 14px; }
.odp__thumb { width: 52px; height: 52px; flex: none; border-radius: 10px; background: linear-gradient(135deg, color-mix(in srgb, var(--odp-brand) 70%, #fff), color-mix(in srgb, var(--odp-brand) 25%, #fff)); }
.odp__hotel-main { flex: 1; min-width: 0; display: grid; gap: 4px; }
.odp__hotel-main strong { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.odp__hotel-main small { font-size: 12px; color: #64748B; }
.odp__bar { height: 5px; border-radius: 99px; background: #EEF0F4; overflow: hidden; }
.odp__bar span { display: block; height: 100%; background: var(--odp-brand); border-radius: inherit; }
.odp__price { font-weight: 800; font-size: 17px; text-align: right; }
.odp__price small { display: block; font-weight: 400; font-size: 11px; color: #64748B; }
.odp__search { display: grid; gap: 8px; padding: 12px; border-radius: 14px; box-shadow: 0 6px 20px rgb(15 23 42 / 0.1); margin-top: -36px; position: relative; background: #fff; }
.odp__search span { display: grid; padding: 8px 10px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 14px; }
.odp__search small { font-size: 11px; color: #64748B; }
.odp__search b { display: grid; place-items: center; height: 42px; border-radius: 8px; background: var(--odp-brand); color: #fff; font-size: 15px; }
.odp__ticks { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 14px; }
.odp__ticks li::before { content: '✓'; color: var(--odp-brand); font-weight: 800; margin-right: 8px; }
.odp__updates { padding: 14px 16px; display: grid; gap: 12px; background: linear-gradient(#F8F7FF, #fff 40%); min-height: 100%; }
.odp__compose-head { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #64748B; }
.odp__compose-head strong { color: #0F172A; font-size: 15px; }
.odp__send { color: #7C3AED; font-weight: 700; }
.odp__to { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 10px 12px; background: #fff; border-radius: 12px; box-shadow: 0 0 0 1px #EEF0F4; font-size: 13px; }
.odp__to small { color: #64748B; margin-right: 4px; }
.odp__chip { padding: 3px 9px; border-radius: 99px; background: #EDE9FE; color: #5B21B6; font-weight: 700; font-size: 12px; }
.odp__msg { display: grid; gap: 4px; padding: 12px; background: #fff; border-radius: 12px; box-shadow: 0 0 0 1px #EEF0F4; font-size: 15px; line-height: 1.35; min-height: 96px; }
.odp__msg small { color: #64748B; font-size: 12px; }
.odp__sent { display: grid; gap: 4px; padding: 12px; background: #fff; border-radius: 12px; box-shadow: 0 0 0 1px #EEF0F4; font-size: 14px; }
.odp__sent small { color: #64748B; font-size: 12px; }
.odp__ad { margin: 0 auto; }
</style>
