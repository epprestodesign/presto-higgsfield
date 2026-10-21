<script setup>
// DemoBanner — the sticky honesty strip on every published demo page. It is
// deliberately not dismissible: a demo must never be mistaken for a live
// booking site with real rates or working checkout.
defineProps({
  ctaLabel: { type: String, default: 'Create your own' },
  ctaHref: { type: String, default: '' },
  sticky: { type: Boolean, default: true },
})
const emit = defineEmits(['create'])
</script>

<template>
  <div class="db" :class="{ 'db--sticky': sticky }" role="region" aria-label="Demo notice">
    <div class="db__inner">
      <span class="db__badge"><q-icon name="science" size="14px" aria-hidden="true" /> Demo</span>
      <p class="db__text">
        <span class="db__full">Demo created with <strong>Presto Brand Studio</strong> · Rates and availability are illustrative · Bookings are disabled</span>
        <span class="db__short">Illustrative rates · Bookings disabled</span>
      </p>
      <q-btn
        unelevated no-caps dense
        class="db__cta"
        :label="ctaLabel"
        icon-right="arrow_forward"
        :href="ctaHref || undefined"
        @click="!ctaHref && emit('create')"
      />
    </div>
  </div>
</template>

<style scoped>
.db { background: var(--ds-palette-navy-950); color: #fff; font-family: var(--bs-font); z-index: 3000; }
.db--sticky { position: sticky; top: 0; }
.db__inner { max-width: 1400px; margin: 0 auto; min-height: 44px; padding: 6px 16px; display: flex; align-items: center; gap: 12px; }
.db__badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; background: #FDE68A; color: #3B2A00; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; flex: none; }
.db__text { margin: 0; flex: 1; min-width: 0; font-size: 0.875rem; line-height: 1.35; color: rgb(255 255 255 / 0.92); }
.db__text strong { color: #fff; }
.db__short { display: none; }
.db__cta { flex: none; background: #fff; color: var(--ds-palette-navy-950); border-radius: var(--bs-radius-sm); padding: 4px 12px; min-height: 32px; font-size: 0.8125rem; }
@media (max-width: 760px) {
  .db__full { display: none; }
  .db__short { display: inline; }
  .db__inner { gap: 8px; padding: 6px 10px; }
}
</style>
