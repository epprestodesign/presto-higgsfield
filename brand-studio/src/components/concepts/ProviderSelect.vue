<script setup>
// ProviderSelect — which image model makes the artwork. Only the demo
// generator is live; real providers need the secure EventPipe backend
// (keys never reach the browser), so they show as "Coming soon".
import { computed } from 'vue'
import { providerStatus } from '../../providers/ai/index.js'

const props = defineProps({
  modelValue: { type: String, default: 'mock' },
})
const emit = defineEmits(['update:modelValue'])
const providers = computed(() => providerStatus())
const current = computed(() => providers.value.find((p) => p.id === props.modelValue) || providers.value[0])
</script>

<template>
  <q-btn flat no-caps class="ps bs-btn" :aria-label="`Image model: ${current.label}. Change`">
    <q-icon name="memory" size="18px" class="ps__icon" aria-hidden="true" />
    <span class="ps__label">{{ current.label }}</span>
    <q-icon name="expand_more" size="18px" aria-hidden="true" />
    <q-menu anchor="bottom right" self="top right">
      <q-list style="width: 320px" class="ps__list">
        <q-item-label header class="ps__header">Image model</q-item-label>
        <q-item
          v-for="p in providers"
          :key="p.id"
          v-close-popup
          :clickable="p.available"
          :disable="!p.available"
          :active="p.id === modelValue"
          active-class="ps__active"
          @click="p.available && emit('update:modelValue', p.id)"
        >
          <q-item-section>
            <q-item-label class="ps__name">{{ p.label }}</q-item-label>
            <q-item-label caption>{{ p.note }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <span v-if="p.id === modelValue" class="bs-pill bs-pill--ai">Active</span>
            <span v-else-if="!p.available" class="bs-pill">Coming soon</span>
          </q-item-section>
        </q-item>
        <q-item-label caption class="ps__foot">
          Real models run through a secure EventPipe backend with usage limits — API keys never reach your browser.
        </q-item-label>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<style scoped>
.ps { color: var(--bs-ink); border: 1px solid var(--bs-line); background: var(--bs-surface); min-height: 40px; gap: 6px; }
.ps :deep(.q-btn__content) { gap: 6px; }
.ps__icon { color: var(--bs-accent); }
.ps__label { font-weight: 700; font-size: 0.875rem; }
.ps__header { font-weight: 700; color: var(--bs-ink); }
.ps__name { font-weight: 700; }
.ps__active { background: var(--bs-accent-soft); color: var(--bs-ink); }
.ps__foot { padding: 10px 16px 12px; line-height: 1.4; }
</style>
