<script setup>
// PropertyNameField — title + search input. `v-model` is a string.
import { computed } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const propertyQuery = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div>
    <h3 class="fr__title">Search by Property Name</h3>
    <q-input v-model="propertyQuery" outlined dense placeholder="e.g. Marriott">
      <template #prepend><q-icon name="search" /></template>
    </q-input>
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
</style>
