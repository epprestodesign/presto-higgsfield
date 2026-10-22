<script setup>
// OptionBPhoneScreen — static mini booking-page content for the iPhone mockups
// on homepage Option B. Rendered at 390 design px inside IPhone's ScaledFrame.
//   mode="brand"    branded hero + palette + type
//   mode="hotels"   compact banner + hotel list with event rates
//   mode="block"    room-block tracker
//   mode="ads"      hotel list with sponsor units between results
import { computed } from 'vue'
import BrandHero from '../../brand/BrandHero.vue'
import AdCreative from '../../ads/AdCreative.vue'
import { getFont } from '../../../theme/fonts.js'
import { SAMPLE_SPONSORS } from '../../../data/sponsors.js'
import { posterById } from './OptionBData.js'

const props = defineProps({
  mode: { type: String, default: 'hotels' },
  poster: { type: String, default: 'youth-sports' },
})

const p = computed(() => posterById(props.poster))
const colors = computed(() => p.value.hero.brandKit.colors || {})
const heading = computed(() => getFont(p.value.hero.brandKit.typography?.heading).label)

// Fictional properties — rates are illustrative.
const HOTELS = [
  { name: 'The Foundry Hotel', meta: '0.4 mi from venue · Free breakfast', rate: 149, was: 189 },
  { name: 'Riverside Suites', meta: '0.9 mi · Pool · Shuttle', rate: 132, was: 165 },
  { name: 'Parkline Inn & Lofts', meta: '1.2 mi · Kitchenettes', rate: 118, was: 142 },
  { name: 'Hartwell Grand', meta: '1.6 mi · Spa · Valet', rate: 204, was: 249 },
]
const BLOCKS = [
  { name: 'The Foundry Hotel', held: 120, booked: 104 },
  { name: 'Riverside Suites', held: 80, booked: 61 },
  { name: 'Parkline Inn & Lofts', held: 60, booked: 33 },
]
const total = computed(() => BLOCKS.reduce((n, b) => ({ held: n.held + b.held, booked: n.booked + b.booked }), { held: 0, booked: 0 }))
</script>

<template>
  <div class="ops" :style="{ '--ops-primary': colors.primary, '--ops-accent': colors.accent || colors.secondary }">
    <div class="ops__nav">
      <img v-if="p.hero.brandKit.logo?.src" :src="p.hero.brandKit.logo.src" alt="" class="ops__nav-logo" />
      <span class="ops__nav-name">{{ p.eventName }}</span>
    </div>

    <template v-if="mode === 'brand'">
      <brand-hero v-bind="p.hero" size="card" :heading-level="3" class="ops__hero ops__hero--tall" />
      <div class="ops__pad">
        <p class="ops__label">Brand kit</p>
        <div class="ops__swatches">
          <span v-for="k in ['primary', 'secondary', 'accent']" :key="k" :style="{ background: colors[k] }" />
        </div>
        <p class="ops__label">Headings</p>
        <p class="ops__font">{{ heading }}</p>
        <div class="ops__search"><span>Check-in · Check-out</span><span class="ops__btn">Search</span></div>
      </div>
    </template>

    <template v-else-if="mode === 'block'">
      <div class="ops__pad">
        <p class="ops__label">Room block</p>
        <p class="ops__big">{{ Math.round((total.booked / total.held) * 100) }}% booked</p>
        <p class="ops__sub">{{ total.booked }} of {{ total.held }} room-nights · 18 days to cutoff</p>
        <div class="ops__bar"><i :style="{ width: `${(total.booked / total.held) * 100}%` }" /></div>
        <ul class="ops__blocks">
          <li v-for="b in BLOCKS" :key="b.name">
            <span class="ops__bname">{{ b.name }}</span>
            <span class="ops__bnum">{{ b.booked }}/{{ b.held }}</span>
            <span class="ops__bar ops__bar--thin"><i :style="{ width: `${(b.booked / b.held) * 100}%` }" /></span>
          </li>
        </ul>
        <div class="ops__toast"><q-icon name="notifications_active" size="16px" /> 6 new bookings today</div>
      </div>
    </template>

    <template v-else>
      <brand-hero v-bind="p.hero" size="card" :heading-level="3" class="ops__hero" />
      <ul class="ops__hotels">
        <template v-for="(h, i) in HOTELS" :key="h.name">
          <li class="ops__hotel">
            <span class="ops__thumb" :style="{ backgroundImage: `url(${p.photo})`, backgroundPosition: `${20 + i * 25}% 50%` }" />
            <span class="ops__hinfo">
              <strong>{{ h.name }}</strong>
              <span>{{ h.meta }}</span>
            </span>
            <span class="ops__rate"><s>${{ h.was }}</s> ${{ h.rate }}</span>
          </li>
          <li v-if="mode === 'ads' && i === 1" class="ops__ad">
            <ad-creative :sponsor="SAMPLE_SPONSORS[0]" size="320x100" :interactive="false" />
          </li>
        </template>
      </ul>
      <div v-if="mode === 'ads'" class="ops__ad ops__ad--box">
        <ad-creative :sponsor="SAMPLE_SPONSORS[1]" size="300x250" :interactive="false" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.ops { width: 390px; min-height: 100%; background: #fff; color: #0F172A; text-align: left; font-family: 'PT Sans', sans-serif; }
.ops__nav { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 16px; border-bottom: 1px solid #E2E8F0; }
.ops__nav-logo { height: 28px; width: auto; }
.ops__nav-name { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ops__hero :deep(.bh--card) { aspect-ratio: 16 / 10; }
.ops__hero--tall :deep(.bh--card) { aspect-ratio: 4 / 3; }
.ops__pad { padding: 18px 16px; display: grid; gap: 10px; }
.ops__label { margin: 6px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748B; }
.ops__swatches { display: flex; gap: 8px; }
.ops__swatches span { width: 52px; height: 52px; border-radius: 12px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08); }
.ops__font { margin: 0; font-size: 22px; font-weight: 700; }
.ops__search { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 8px 8px 14px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; color: #64748B; }
.ops__btn { padding: 8px 14px; border-radius: 4px; background: var(--ops-primary); color: #fff; font-weight: 700; }
.ops__hotels { list-style: none; margin: 0; padding: 6px 16px 16px; display: grid; gap: 0; }
.ops__hotel { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #EEF2F6; }
.ops__thumb { width: 64px; height: 64px; border-radius: 8px; background-size: 360% auto; background-color: #E2E8F0; }
.ops__hinfo { display: grid; gap: 2px; min-width: 0; }
.ops__hinfo strong { font-size: 15px; }
.ops__hinfo span { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ops__rate { font-size: 16px; font-weight: 700; color: var(--ops-primary); text-align: right; }
.ops__rate s { display: block; font-size: 11px; font-weight: 400; color: #94A3B8; }
.ops__ad { display: flex; justify-content: center; padding: 12px 0; border-bottom: 1px solid #EEF2F6; }
.ops__ad--box { border: 0; padding: 4px 16px 20px; }
.ops__big { margin: 0; font-size: 40px; font-weight: 700; line-height: 1; color: var(--ops-primary); }
.ops__sub { margin: 0; font-size: 13px; color: #64748B; }
.ops__bar { display: block; height: 12px; border-radius: 999px; background: #EEF2F6; overflow: hidden; }
.ops__bar i { display: block; height: 100%; border-radius: inherit; background: var(--ops-accent); }
.ops__bar--thin { height: 6px; grid-column: 1 / -1; }
.ops__blocks { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 16px; }
.ops__blocks li { display: grid; grid-template-columns: 1fr auto; gap: 6px; font-size: 14px; }
.ops__bname { font-weight: 700; }
.ops__bnum { color: #64748B; font-variant-numeric: tabular-nums; }
.ops__toast { margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding: 10px 14px; border-radius: 999px; background: #0F172A; color: #fff; font-size: 13px; font-weight: 700; }
</style>
