<script setup>
// TeamAddTeamModal — the "Add a team" element from the Team Name Qualifiers flow,
// extracted as a standalone card so it can be iterated on in isolation. Covers:
// one team, multiple teams ("Add N Teams"), and the duplicate-name error state.
// `inline` renders it as an always-visible card (Storybook); otherwise it hosts
// inside a q-dialog toggled by `modelValue`.
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // Render as a static card (default) vs. a dialog.
  inline: { type: Boolean, default: true },
  modelValue: { type: Boolean, default: false },
  // Seed rows, e.g. ['', ''] for the two-row state or ['Falcons U10'] prefilled.
  initialTeams: { type: Array, default: () => [''] },
  // Registry the entered names are checked against for the duplicate error.
  registry: {
    type: Array,
    default: () => [
      'Arsenal U12 Boys Gold', 'Arsenal U12 Girls Gold', 'Arsenal U12 Boys Select',
      'Arsenal U12 Girls Select', 'Arsenal U14 Boys DPL', 'Arsenal U14 Boys Gold',
      'Arsenal U14 Girls SCSC', 'Arsenal U14 Girls Gold', 'Arsenal U16 Boy Elite',
      'Arsenal Soccer Club', 'Bulls Soccer Club', 'Team 1', 'Team 2',
    ],
  },
})
const emit = defineEmits(['update:modelValue', 'add'])

const newTeams = ref(props.initialTeams.map((name) => ({ name })))
watch(() => props.initialTeams, (v) => { newTeams.value = v.map((name) => ({ name })) })

const isDup = (name) => {
  const v = (name || '').trim().toLowerCase()
  if (v.length < 3) return false
  return props.registry.some((n) => { const x = n.toLowerCase(); return x.includes(v) || v.includes(x) })
}
const addRow = () => newTeams.value.push({ name: '' })
const clearTeams = () => { newTeams.value = [{ name: '' }] }
const addDisabled = computed(() => newTeams.value.some((t) => !t.name.trim() || isDup(t.name)))
const addLabel = computed(() => (newTeams.value.length > 1 ? `Add ${newTeams.value.length} Teams` : 'Add Team'))
const submit = () => {
  emit('add', newTeams.value.map((t) => t.name.trim()).filter(Boolean))
  if (!props.inline) emit('update:modelValue', false)
}
</script>

<template>
  <component
    :is="inline ? 'div' : 'q-dialog'"
    v-bind="inline ? {} : { modelValue, 'onUpdate:modelValue': (v) => emit('update:modelValue', v) }"
  >
    <q-card class="tat" :class="{ 'tat--inline': inline }">
      <q-btn flat dense round icon="arrow_back" class="q-mb-sm" :disable="inline" v-close-popup />
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6" style="font-weight:700">Add a team</div>
        <span class="tat__link" style="font-weight:500" @click="clearTeams">Clear</span>
      </div>

      <div v-for="(t, i) in newTeams" :key="i" class="q-mb-md">
        <q-input v-model="t.name" outlined label="New Team Name" placeholder="Enter team name" :error="isDup(t.name)" hide-bottom-space />
        <div v-if="isDup(t.name)" class="q-mt-sm" style="color:var(--ds-color-text-danger)">
          <div style="font-weight:700">This team name is already registered.</div>
          <div class="text-body2">The name you entered matches a team that's already in our system. Please go back and select the correct team from the previous page, or enter a unique team name if you're booking for a different team.</div>
        </div>
      </div>

      <div class="tat__link q-mb-lg" @click="addRow">
        <q-icon name="add_circle" size="22px" /><span style="font-weight:600">Add another team</span>
      </div>

      <q-btn unelevated color="primary" :label="addLabel" :disable="addDisabled" class="full-width tat__submit" @click="submit" />
    </q-card>
  </component>
</template>

<style scoped>
.tat { width: 640px; max-width: 92vw; border-radius: var(--ds-radius-lg); padding: 20px 24px 24px; box-shadow: var(--ds-shadow-2); }
.tat--inline { box-shadow: var(--ds-shadow-1); }
.tat__link { display: inline-flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; color: var(--ds-color-text-brand); }
.tat__submit { height: 48px; border-radius: var(--ds-radius-button); }
</style>
