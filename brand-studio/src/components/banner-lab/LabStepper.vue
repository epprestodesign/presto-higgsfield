<script setup>
// LabStepper — the numbered steps across the top of a Banner Lab mode. Done
// steps show a check; any step that's available can be clicked; the rest wait
// until the steps before them are done.
const props = defineProps({
  steps: { type: Array, required: true }, // [{ id, label, hint }]
  current: { type: String, required: true },
  available: { type: Function, required: true }, // (id) => boolean
  label: { type: String, default: 'Steps' },
})
const emit = defineEmits(['go'])
const index = (id) => props.steps.findIndex((s) => s.id === id)
const state = (id) => (id === props.current ? 'current' : index(id) < index(props.current) && props.available(id) ? 'done' : props.available(id) ? 'open' : 'locked')
</script>

<template>
  <nav class="ls" :aria-label="label">
    <ol>
      <li v-for="(st, i) in steps" :key="st.id" :class="`ls__step ls__step--${state(st.id)}`">
        <button
          type="button" class="ls__btn bs-focusable" :disabled="state(st.id) === 'locked'"
          :aria-current="st.id === current ? 'step' : undefined" @click="emit('go', st.id)"
        >
          <span class="ls__num" aria-hidden="true">
            <q-icon v-if="state(st.id) === 'done'" name="check" size="16px" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="ls__text">
            <strong>{{ st.label }}</strong>
            <small>{{ st.hint }}</small>
          </span>
        </button>
        <span v-if="i < steps.length - 1" class="ls__line" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ls ol { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; }
.ls__step { display: flex; align-items: center; flex: 1 1 0; min-width: 0; }
.ls__step:last-child { flex: 0 0 auto; }
.ls__btn { display: flex; align-items: center; gap: 10px; border: 0; background: none; padding: 6px 8px; border-radius: 12px; cursor: pointer; text-align: left; font-family: var(--bs-font); min-width: 0; }
.ls__btn:disabled { cursor: default; }
.ls__btn:not(:disabled):hover { background: var(--bs-surface-2); }
.ls__num {
  flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%;
  font: 700 0.875rem var(--bs-font); border: 2px solid var(--bs-line-strong); color: var(--bs-ink-soft); background: var(--bs-surface);
}
.ls__text { display: grid; min-width: 0; }
.ls__text strong { font-size: 0.875rem; color: var(--bs-ink); white-space: nowrap; }
.ls__text small { font-size: 0.75rem; color: var(--bs-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ls__line { flex: 1; height: 2px; min-width: 16px; margin: 0 6px; background: var(--bs-line); border-radius: 2px; }
.ls__step--current .ls__num { border-color: var(--bs-brand); background: var(--bs-brand); color: #fff; }
.ls__step--done .ls__num { border-color: var(--bs-success); background: var(--bs-success); color: #fff; }
.ls__step--done .ls__line { background: var(--bs-success); }
.ls__step--locked .ls__text strong, .ls__step--locked .ls__text small { color: var(--bs-ink-faint); }
@media (max-width: 900px) {
  .ls__text small { display: none; }
  .ls__step:not(.ls__step--current) .ls__text { display: none; }
}
</style>
