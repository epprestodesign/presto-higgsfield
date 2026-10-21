<script setup>
// ExactMatchesField — title + subtitle + toggle. `v-model` is a boolean.
import { computed } from 'vue'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const exactOnly = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="fr__exact">
    <q-toggle v-model="exactOnly" color="primary" size="sm" />
    <div class="fr__exact-text">
      <h3 class="fr__title">Exact Matches Only</h3>
      <p class="fr__sub">Hide hotels that don't match all filters</p>
    </div>
  </div>
</template>

<style scoped>
.fr__title {
  margin: 0 0 2px;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ds-color-text-brand);
}
.fr__sub { margin: 3px 0 0; font-size: 0.875rem; color: var(--ds-color-text-subtle); line-height: 1.35; }

/* Exact matches — a self-contained bordered card (the title is a toggle label,
   not a section header). */
.fr__exact {
  display: flex; align-items: center; justify-content: flex-start; gap: 12px;
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface); padding: 14px 16px;
}
.fr__exact > .q-toggle { flex: 0 0 auto; }
.fr__exact-text { flex: 1; min-width: 0; }
.fr__exact .fr__title { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.25; }
</style>
