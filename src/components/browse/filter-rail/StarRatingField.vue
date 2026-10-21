<script setup>
// StarRatingField — title + 1★–5★ toggle buttons + status label.
// `v-model` is the minimum star number (0 = no minimum).
import { computed } from 'vue'

const props = defineProps({ modelValue: { type: Number, default: 0 } })
const emit = defineEmits(['update:modelValue'])

const minStars = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const starLabel = computed(() => (minStars.value ? `${minStars.value}★ minimum & up` : 'No minimum set'))
</script>

<template>
  <div>
    <h3 class="fr__title">Minimum Star Rating</h3>
    <div class="fr__stars">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        :class="['fr__star', { 'is-on': minStars === n }]"
        @click="minStars = minStars === n ? 0 : n"
      >
        {{ n }}<q-icon name="star" size="15px" />
      </button>
    </div>
    <p class="fr__sub">{{ starLabel }}</p>
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
.fr__sub { margin: 4px 0 0; font-size: 0.875rem; color: var(--ds-color-text-subtle); line-height: 1.35; }

/* Star rating */
.fr__stars { display: flex; gap: 8px; }
.fr__star {
  flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; gap: 2px;
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: transparent;
  cursor: pointer; font-weight: 700; color: var(--ds-color-text); font-size: 0.875rem;
}
.fr__star .q-icon { color: var(--ds-color-text-subtle); }
.fr__star.is-on { border-color: var(--ds-color-background-brand-bold); background: var(--ds-color-background-brand-bold); color: #fff; }
.fr__star.is-on .q-icon { color: #fff; }
</style>
