<script setup>
// TeamStepContactInfo — FORK of checkout/steps/StepContactInfo.vue for the Team
// Name Qualifiers prototype. Same variant logic, but renders the FORKED contact
// components so the prototype exercises our team-name work:
//   group        → TeamGroupContactBlock (teams flow + Age/Gender qualifiers)
//   reservation  → TeamReservationGuests (team name + qualifier custom fields)
//   reservations → TeamReservationGuests grouped by reservation/hotel
import { computed, ref } from 'vue'
import TeamReservationGuests from './TeamReservationGuests.vue'
import TeamGroupContactBlock from './TeamGroupContactBlock.vue'

const props = defineProps({
  mode: { type: String, default: 'group' }, // group | reservation | reservations
  modelValue: { type: [Object, Array], default: () => ({}) },
  rooms: { type: Array, default: () => [{ adults: 1, children: 0 }] },
  reservations: { type: Array, default: null },
  teamName: { type: Boolean, default: false },
  teamListHidden: { type: Boolean, default: false },
  askAgeDivision: { type: Boolean, default: true },
  askGender: { type: Boolean, default: true },
  customFields: { type: Array, default: () => [] },
  showTeams: { type: Boolean, default: true },
  flat: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'next'])

const showErrors = ref(false)
const resValid = ref(false)
const valid = computed(() => {
  if (props.mode !== 'group') return resValid.value
  const m = props.modelValue || {}
  const c = m.contact || {}
  const teamsOk = !props.showTeams || m.notHolding || (m.teams && m.teams.length)
  const blockOk = (m.groupBlockName || '').trim()
  return !!(c.firstName && c.lastName && c.mobile && c.email && c.organization && blockOk && teamsOk)
})
const onNext = () => { if (valid.value) emit('next'); else { showErrors.value = true } }
</script>

<template>
  <div class="step">
    <team-group-contact-block v-if="mode === 'group'" :model-value="modelValue" :show-teams="showTeams" :show-errors="showErrors" :list-hidden="teamListHidden" :ask-age-division="askAgeDivision" :ask-gender="askGender" @update:model-value="emit('update:modelValue', $event)" />
    <team-reservation-guests
      v-else
      :rooms="rooms" :reservations="reservations" :team-name="teamName" :custom-fields="customFields" :team-list-hidden="teamListHidden" :ask-age-division="askAgeDivision" :ask-gender="askGender"
      :model-value="Array.isArray(modelValue) ? modelValue : []"
      :show-errors="showErrors"
      @update:model-value="emit('update:modelValue', $event)"
      @update:valid="resValid = $event"
    />
    <q-btn v-if="!flat" unelevated no-caps class="step__next" label="Next" @click="onNext" />
  </div>
</template>

<style scoped>
.step__next { margin-top: 20px; height: 48px; padding: 0 28px; border-radius: var(--ds-radius-md); background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 600; }
</style>
