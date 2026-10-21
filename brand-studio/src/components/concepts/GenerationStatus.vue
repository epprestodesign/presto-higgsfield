<script setup>
// GenerationStatus — the live strip shown while a job runs (stage + progress,
// announced politely to screen readers) and the error state with Retry.
import { computed } from 'vue'

const props = defineProps({
  job: { type: Object, default: null }, // GenerationJob snapshot
  label: { type: String, default: 'Generating concepts' },
})
const emit = defineEmits(['cancel', 'retry', 'dismiss'])

const running = computed(() => props.job && ['queued', 'running'].includes(props.job.status))
const failed = computed(() => props.job?.status === 'failed')
const pct = computed(() => Math.round((props.job?.progress || 0) * 100))
const limitHit = computed(() => props.job?.error?.code === 'usage_limit')
</script>

<template>
  <div v-if="running" class="gs gs--running" role="status" aria-live="polite">
    <div class="gs__spark" aria-hidden="true"><q-icon name="auto_awesome" size="22px" /></div>
    <div class="gs__main">
      <div class="gs__row">
        <strong class="gs__label">{{ label }}</strong>
        <span class="gs__stage">{{ job.stage || 'Starting' }}…</span>
        <span class="gs__pct">{{ pct }}%</span>
      </div>
      <q-linear-progress
        :value="job.progress || 0"
        rounded size="6px" color="deep-purple-6" track-color="deep-purple-1" class="gs__bar"
        :aria-label="`${label}: ${pct}%`"
      />
    </div>
    <q-btn flat no-caps class="bs-btn gs__cancel" label="Cancel" @click="emit('cancel')" />
  </div>

  <div v-else-if="failed" class="gs gs--error" role="alert">
    <div class="gs__spark gs__spark--error" aria-hidden="true"><q-icon :name="limitHit ? 'lock' : 'error_outline'" size="22px" /></div>
    <div class="gs__main">
      <strong class="gs__label">{{ limitHit ? 'Free generations used up' : 'That generation didn’t finish' }}</strong>
      <p class="gs__msg">{{ job.error?.message }}</p>
    </div>
    <div class="gs__btns">
      <q-btn v-if="!limitHit" unelevated no-caps class="bs-btn bs-btn--ai" icon="refresh" label="Try again" @click="emit('retry')" />
      <slot name="limit-action" />
      <q-btn flat round dense icon="close" aria-label="Dismiss" @click="emit('dismiss')" />
    </div>
  </div>
</template>

<style scoped>
.gs { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--bs-radius-lg); font-family: var(--bs-font); }
.gs--running { background: var(--bs-accent-soft); border: 1px solid var(--bs-accent-line); }
.gs--error { background: #FEF2F2; border: 1px solid #FECACA; }
.gs__spark { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex: none; background: var(--bs-accent); color: #fff; animation: gs-pulse 1.6s ease-in-out infinite; }
.gs__spark--error { background: var(--bs-danger); animation: none; }
@keyframes gs-pulse { 50% { box-shadow: 0 0 0 8px rgb(124 58 237 / 0.12); } }
.gs__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.gs__row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.gs__label { color: var(--bs-ink); font-size: 0.9375rem; }
.gs__stage { color: var(--ds-palette-violet-700); font-size: 0.875rem; }
.gs__pct { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--bs-ink-soft); font-size: 0.8125rem; font-weight: 700; }
.gs__msg { margin: 0; color: #7F1D1D; font-size: 0.875rem; }
.gs__btns { display: flex; align-items: center; gap: 6px; }
.gs__cancel { color: var(--bs-ink); }
@media (max-width: 600px) {
  .gs { flex-wrap: wrap; }
  .gs--error .gs__btns { width: 100%; justify-content: flex-end; }
}
@media (prefers-reduced-motion: reduce) { .gs__spark { animation: none; } }
</style>
