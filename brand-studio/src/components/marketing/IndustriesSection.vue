<script setup>
// IndustriesSection — "Built for every kind of group travel": every vertical's
// example booking page (data/verticals), each opening in the Studio.
import ExamplesGallery from '../studio/ExamplesGallery.vue'

const emit = defineEmits(['sample'])
</script>

<template>
  <section id="industries" class="ind" aria-labelledby="ind-title">
    <div class="ind__head">
      <p class="bs-eyebrow">Industries</p>
      <h2 id="ind-title" class="bs-display-2">Built for every kind of group travel.</h2>
      <p class="bs-lead">Pick a theme to start from.</p>
    </div>
    <examples-gallery inline minimal class="ind__gallery" @select="emit('sample', $event)" />
  </section>
</template>

<style scoped>
.ind { max-width: 1240px; margin: 0 auto; padding: 96px 24px 24px; }
.ind__head { max-width: 760px; display: grid; gap: 14px; margin-bottom: 8px; }
.ind__gallery { padding: 0; background: transparent; }
.ind__gallery :deep(.xg__head) { display: none; }
@media (max-width: 600px) { .ind { padding: 64px 16px 8px; } }
</style>
