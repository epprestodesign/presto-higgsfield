<script setup>
// UsageMeter — free generations left for this visitor. At zero it becomes the
// sign-up nudge (accounts get more; server-side limits arrive in Phase 3).
import { computed } from 'vue'

const props = defineProps({
  used: { type: Number, default: 0 },
  limit: { type: Number, default: 12 },
})
const emit = defineEmits(['signup'])
const remaining = computed(() => Math.max(0, props.limit - props.used))
const ratio = computed(() => (props.limit ? remaining.value / props.limit : 0))
const low = computed(() => remaining.value > 0 && ratio.value <= 0.25)
</script>

<template>
  <div class="um" :class="{ 'um--empty': remaining === 0, 'um--low': low }">
    <div class="um__text">
      <q-icon name="bolt" size="16px" aria-hidden="true" />
      <span v-if="remaining > 0"><strong>{{ remaining }}</strong> of {{ limit }} free generations left</span>
      <span v-else><strong>No free generations left</strong></span>
    </div>
    <div class="um__track" role="meter" :aria-valuenow="remaining" aria-valuemin="0" :aria-valuemax="limit" :aria-label="`${remaining} of ${limit} free generations left`">
      <div class="um__fill" :style="{ width: ratio * 100 + '%' }" />
    </div>
    <q-btn v-if="remaining === 0 || low" flat dense no-caps class="um__cta" :label="remaining === 0 ? 'Create a free account' : 'Get more'" @click="emit('signup')" />
  </div>
</template>

<style scoped>
.um { display: flex; align-items: center; gap: 10px; font: 400 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.um__text { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.um__text .q-icon { color: var(--bs-accent); }
.um__track { width: 84px; height: 6px; border-radius: 999px; background: var(--bs-line); overflow: hidden; flex: none; }
.um__fill { height: 100%; background: var(--bs-accent); border-radius: inherit; transition: width var(--ds-duration-base) var(--ds-ease-standard); }
.um--low .um__fill { background: var(--bs-warning); }
.um--empty .um__text { color: var(--bs-danger); }
.um--empty .um__text .q-icon { color: var(--bs-danger); }
.um__cta { color: var(--bs-accent); font-weight: 700; }
</style>
