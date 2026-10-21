<script setup>
// MarketingHero — headline, primary/secondary CTAs and the product stage: a
// real branded Presto page in a browser frame with the same page on a phone.
import ProductPreview from './ProductPreview.vue'

defineProps({
  sample: { type: String, default: 'lakeshore' },
  phoneSample: { type: String, default: 'lakeshore' },
})
const emit = defineEmits(['start', 'sample'])
</script>

<template>
  <section id="top" class="mh" aria-labelledby="mh-title">
    <div class="mh__copy">
      <p class="mh__kicker"><span class="bs-pill bs-pill--ai"><q-icon name="auto_awesome" size="14px" /> AI-assisted creative concepts</span></p>
      <h1 id="mh-title" class="bs-display-1 mh__title">Your event’s hotel booking page, branded in seconds.</h1>
      <p class="bs-lead mh__lead">
        Add your logo, colors and photos. Brand Studio turns them into a complete Presto booking site with a landing
        page, hotel search and room details. Customize it, preview it on any device, and share a live demo.
      </p>
      <div class="mh__ctas">
        <q-btn unelevated no-caps class="bs-btn bs-btn--lg bs-btn--primary" label="Create Your Booking Page" icon-right="arrow_forward" @click="emit('start')" />
        <q-btn unelevated no-caps class="bs-btn bs-btn--lg bs-btn--ghost" label="See a sample" @click="emit('sample', sample)" />
      </div>
      <ul class="mh__proof" aria-label="What to expect">
        <li><q-icon name="check" size="16px" /> Free to try, no account needed</li>
        <li><q-icon name="check" size="16px" /> Desktop and mobile previews</li>
        <li><q-icon name="check" size="16px" /> Shareable demo link</li>
      </ul>
    </div>

    <div class="mh__stage">
      <div class="mh__desktop"><product-preview :sample="sample" variant="desktop" :design-height="820" /></div>
      <div class="mh__phone"><product-preview :sample="phoneSample" variant="mobile" :design-height="760" /></div>
      <p class="mh__caption bs-caption">Live preview built from the real Presto booking components. Sample event, mock hotel data.</p>
    </div>
  </section>
</template>

<style scoped>
.mh {
  position: relative;
  padding: clamp(48px, 8vw, 96px) 24px 0;
  background:
    radial-gradient(circle at 1px 1px, rgb(3 10 38 / 0.07) 1px, transparent 0) 0 0 / 22px 22px,
    linear-gradient(180deg, #fff 0%, var(--bs-canvas) 100%);
  overflow: hidden;
}
.mh__copy { max-width: 880px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 22px; }
.mh__kicker { margin: 0; }
.mh__title { max-width: 16ch; }
.mh__lead { max-width: 62ch; }
.mh__ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 6px; }
.mh__proof { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 22px; list-style: none; padding: 0; margin: 0; font: 400 0.875rem/1.4 var(--bs-font); color: var(--bs-ink-soft); }
.mh__proof li { display: inline-flex; align-items: center; gap: 6px; }
.mh__proof .q-icon { color: var(--bs-success); }

.mh__stage { position: relative; max-width: 1180px; margin: clamp(40px, 6vw, 72px) auto 0; padding-bottom: 56px; }
.mh__desktop { width: 88%; }
.mh__phone { position: absolute; right: 0; bottom: 40px; width: 24%; min-width: 220px; }
.mh__caption { text-align: center; margin-top: 18px; width: 88%; }

@media (max-width: 760px) {
  .mh { padding-inline: 16px; }
  .mh__ctas { flex-direction: column; align-self: stretch; }
  .mh__ctas .q-btn { width: 100%; }
  .mh__desktop { display: none; }
  .mh__phone { position: static; width: min(300px, 86%); min-width: 0; margin: 0 auto; }
  .mh__caption { width: auto; }
}
</style>
