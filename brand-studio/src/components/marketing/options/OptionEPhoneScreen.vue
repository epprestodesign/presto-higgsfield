<script setup>
// OptionEPhoneScreen — static mobile booking page for the Option E phone:
// branded hero (compact) + room-block pickup per hotel. Fictional data.
import BrandHero from '../../brand/BrandHero.vue'

defineProps({
  hero: { type: Object, required: true }, // previewModel.heroProps() shape
  primary: { type: String, default: '#01113E' },
})

const HOTELS = [
  { name: 'Fieldhouse Inn & Suites', booked: 38, total: 40, rate: 149 },
  { name: 'The Meridian Park Hotel', booked: 41, total: 60, rate: 179 },
  { name: 'Harbor Lane Suites', booked: 12, total: 30, rate: 132 },
]
</script>

<template>
  <div class="oeps">
    <brand-hero v-bind="hero" size="compact" :heading-level="3" class="oeps__hero" />
    <div class="oeps__body">
      <p class="oeps__eyebrow">Room block</p>
      <p class="oeps__big"><strong>91</strong> of 130 rooms booked</p>
      <div class="oeps__bar"><span :style="{ width: '70%', background: primary }" /></div>
      <ul class="oeps__list">
        <li v-for="h in HOTELS" :key="h.name">
          <span class="oeps__name">{{ h.name }}</span>
          <span class="oeps__meta">{{ h.booked }}/{{ h.total }} · ${{ h.rate }}/night</span>
          <span class="oeps__mini"><span :style="{ width: `${(h.booked / h.total) * 100}%`, background: primary }" /></span>
        </li>
      </ul>
      <p class="oeps__chip"><span class="oeps__dot" /> 6 new bookings today</p>
    </div>
  </div>
</template>

<style scoped>
.oeps { background: #fff; font-family: 'Inter', 'PT Sans', sans-serif; color: #0B1220; min-height: 100%; }
.oeps__hero { --bh-min: 0; }
.oeps__hero:deep(.bh) { min-height: 170px; }
.oeps__body { padding: 20px 20px 28px; display: grid; gap: 10px; }
.oeps__eyebrow { margin: 0; font: 700 13px/1 'Inter', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; }
.oeps__big { margin: 0; font-size: 22px; }
.oeps__big strong { font-size: 34px; }
.oeps__bar, .oeps__mini { display: block; height: 10px; border-radius: 99px; background: #EEF0F4; overflow: hidden; }
.oeps__bar span, .oeps__mini span { display: block; height: 100%; border-radius: inherit; }
.oeps__list { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 14px; }
.oeps__list li { display: grid; gap: 4px; padding: 14px; border: 1px solid #ECEDF1; border-radius: 14px; }
.oeps__name { font-weight: 700; font-size: 17px; }
.oeps__meta { font-size: 14px; color: #6B7280; }
.oeps__mini { height: 6px; margin-top: 4px; }
.oeps__chip { justify-self: start; margin: 6px 0 0; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 99px; background: #0B1220; color: #fff; font-size: 14px; font-weight: 700; }
.oeps__dot { width: 8px; height: 8px; border-radius: 50%; background: #34D399; }
</style>
