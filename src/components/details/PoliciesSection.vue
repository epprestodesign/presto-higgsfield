<script setup>
// PoliciesSection — the property policies block on the hotel detail screen:
// check-in / check-out windows, children & extra beds, and any other terms.
// Each policy is a labelled heading + body copy.
import DsSectionHeader from '../DsSectionHeader.vue'

defineProps({
  title: { type: String, default: 'Property Policies' },
  subtitle: { type: String, default: '' },
  // [{ title, body }]
  policies: { type: Array, default: () => [] },
})
</script>

<template>
  <section class="pol">
    <ds-section-header :title="title" :subtitle="subtitle" />
    <dl class="pol__list">
      <div v-for="p in policies" :key="p.title" class="pol__item">
        <dt class="pol__term">{{ p.title }}</dt>
        <dd class="pol__body">{{ p.body }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.pol { display: flex; flex-direction: column; gap: 16px; }
.pol__list { margin: 0; display: flex; flex-direction: column; gap: 16px; }
.pol__item { display: flex; flex-direction: column; gap: 4px; }
.pol__term { font-weight: 700; color: var(--ds-color-text); font-size: 0.9375rem; }
.pol__body { margin: 0; color: var(--ds-color-text-subtle); font-size: 0.9375rem; line-height: 1.55; }
</style>
