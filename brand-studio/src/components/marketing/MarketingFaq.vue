<script setup>
// MarketingFaq — honest answers, including the demo-only boundaries.
defineProps({
  items: {
    type: Array,
    default: () => [
      { q: 'Is this a live booking site?', a: 'Not yet. Brand Studio creates a branded demo of your Presto booking site using sample hotels and rates. Nothing in the demo takes reservations or payments. When you’re ready, EventPipe sets up your real room blocks and live inventory.' },
      { q: 'Do I need an account to start?', a: 'No. Enter your event details and explore the full editor right away. Create a free account when you want to save your work or publish a shareable demo link, and your progress comes with you.' },
      { q: 'How does the AI creative work?', a: 'Brand Studio proposes three creative directions and six banner concepts from your logo, colors and photos. Your logo, headlines and buttons stay as editable text and are never baked into generated artwork.' },
      { q: 'Can I use my own photos and logo?', a: 'Yes. Upload SVG, PNG, JPG or WebP files. Only upload images you have the rights to use; you keep ownership of everything you upload.' },
      { q: 'How do sponsor ads work?', a: 'You choose where sponsor units appear on the search and hotel pages, then add each sponsor’s artwork, link and label. In the demo they are a visual preview only; no ad server is connected and no tracking runs.' },
      { q: 'What does it cost?', a: 'Designing and previewing your page is free. Pricing for a live booking site depends on your event and room blocks; an EventPipe specialist will walk you through it.' },
    ],
  },
})
</script>

<template>
  <section id="faq" class="fq" aria-labelledby="fq-title">
    <div class="fq__head">
      <p class="bs-eyebrow">FAQ</p>
      <h2 id="fq-title" class="bs-display-2">Questions organizers ask.</h2>
    </div>
    <div class="fq__list bs-card">
      <q-expansion-item
        v-for="(it, i) in items" :key="i"
        :label="it.q" header-class="fq__q" expand-icon-class="fq__icon"
        :group="'faq'" :default-opened="i === 0"
      >
        <p class="bs-body fq__a">{{ it.a }}</p>
      </q-expansion-item>
    </div>
  </section>
</template>

<style scoped>
.fq { max-width: 880px; margin: 0 auto; padding: clamp(64px, 9vw, 120px) 24px 0; }
.fq__head { display: grid; gap: 14px; margin-bottom: 28px; }
.fq__list { overflow: hidden; }
.fq__list :deep(.q-expansion-item + .q-expansion-item) { border-top: 1px solid var(--bs-line); }
.fq__list :deep(.fq__q) { min-height: 64px; padding: 0 20px; font: 700 1.0625rem/1.3 var(--bs-font); color: var(--bs-ink); }
.fq__a { padding: 0 20px 20px; max-width: 68ch; }
@media (max-width: 640px) { .fq { padding-inline: 16px; } }
</style>
