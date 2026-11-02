<script setup>
// StepNav — Back / Continue at the foot of a step. The middle slot holds a
// hint (why Continue is disabled, what the next step does).
defineProps({
  back: { type: String, default: '' }, // label; empty hides it
  next: { type: String, default: '' },
  nextIcon: { type: String, default: 'arrow_forward' },
  nextDisabled: { type: Boolean, default: false },
  nextLoading: { type: Boolean, default: false },
  nextClass: { type: String, default: 'bs-btn--primary' },
})
const emit = defineEmits(['back', 'next'])
</script>

<template>
  <footer class="sn">
    <q-btn v-if="back" unelevated no-caps class="bs-btn bs-btn--ghost" icon="arrow_back" :label="back" @click="emit('back')" />
    <span class="sn__hint bs-caption"><slot /></span>
    <q-btn
      v-if="next" unelevated no-caps class="bs-btn bs-btn--lg" :class="nextClass" :icon-right="nextIcon" :label="next"
      :disable="nextDisabled" :loading="nextLoading" @click="emit('next')"
    />
  </footer>
</template>

<style scoped>
.sn { display: flex; align-items: center; gap: 16px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--bs-line); }
.sn__hint { flex: 1; text-align: right; }
</style>
