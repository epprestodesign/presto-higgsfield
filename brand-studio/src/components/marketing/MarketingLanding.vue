<script setup>
// MarketingLanding — the Presto Brand Studio marketing site (spec §4A).
// Emits: start (Create Your Booking Page), sample(key), lead(payload), signin.
import MarketingNav from './MarketingNav.vue'
import MarketingHero from './MarketingHero.vue'
import EventTypeShowcase from './EventTypeShowcase.vue'
import IndustriesSection from './IndustriesSection.vue'
import HowItWorks from './HowItWorks.vue'
import CustomizationDemo from './CustomizationDemo.vue'
import SponsorshipSection from './SponsorshipSection.vue'
import DeviceShowcase from './DeviceShowcase.vue'
import LeadCapture from './LeadCapture.vue'
import MarketingFaq from './MarketingFaq.vue'
import MarketingFooter from './MarketingFooter.vue'

const emit = defineEmits(['start', 'sample', 'lead', 'signin'])
</script>

<template>
  <div class="ml">
    <a href="#ml-main" class="ml__skip">Skip to content</a>
    <marketing-nav @start="emit('start')" @signin="emit('signin')" />
    <main id="ml-main">
      <marketing-hero @start="emit('start')" @sample="emit('sample', $event)" />
      <event-type-showcase @sample="emit('sample', $event)" />
      <industries-section @sample="emit('sample', $event)" />
      <how-it-works @start="emit('start')" />
      <customization-demo />
      <sponsorship-section />
      <device-showcase />
      <lead-capture @lead="emit('lead', $event)" @start="emit('start')" />
      <marketing-faq />
    </main>
    <marketing-footer @start="emit('start')" />
  </div>
</template>

<style scoped>
.ml { background: var(--bs-canvas); color: var(--bs-ink); font-family: var(--bs-font); min-height: 100vh; }
.ml__skip { position: absolute; left: 12px; top: -60px; z-index: 100; padding: 10px 14px; border-radius: 6px; background: var(--bs-ink); color: #fff; font-weight: 700; text-decoration: none; }
.ml__skip:focus { top: 12px; }
:global(html:has(.ml)) { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { :global(html:has(.ml)) { scroll-behavior: auto; } }
</style>
