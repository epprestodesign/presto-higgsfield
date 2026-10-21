<script setup>
// DeviceShowcase — the same branded booking page at desktop and phone size.
import ProductPreview from './ProductPreview.vue'

defineProps({ sample: { type: String, default: 'wedding' } })
</script>

<template>
  <section class="ds" aria-labelledby="ds-title">
    <div class="ds__head">
      <p class="bs-eyebrow">Desktop and mobile</p>
      <h2 id="ds-title" class="bs-display-2">Designed for the phone in every attendee’s pocket.</h2>
      <p class="bs-lead">Most event travelers book on their phone. Every layout, hero and sponsor unit has a mobile version, and you can check both before you publish.</p>
    </div>
    <div class="ds__stage">
      <div class="ds__desktop">
        <product-preview :sample="sample" variant="desktop" :design-height="760" />
        <p class="ds__label"><q-icon name="desktop_windows" size="16px" /> Desktop · 1440px</p>
      </div>
      <div class="ds__phone">
        <product-preview :sample="sample" variant="mobile" :design-height="800" />
        <p class="ds__label"><q-icon name="smartphone" size="16px" /> Mobile · 390px</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ds { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 9vw, 120px) 24px 0; }
.ds__head { max-width: 760px; margin: 0 auto 40px; text-align: center; display: grid; gap: 14px; justify-items: center; }
.ds__stage { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 40px; align-items: end; }
.ds__label { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 14px 0 0; font: 700 0.8125rem/1 var(--bs-font); color: var(--bs-ink-soft); }
@media (max-width: 860px) {
  .ds__stage { grid-template-columns: 1fr; }
  .ds__phone { width: min(280px, 80%); margin: 0 auto; }
}
@media (max-width: 640px) {
  .ds { padding-inline: 16px; }
  .ds__desktop { display: none; }
}
</style>
