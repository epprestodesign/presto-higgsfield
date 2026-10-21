<script>
// Module scope so defineProps()'s default can reference the team list — a
// script-setup local can't be referenced by the hoisted defineProps().
const DEFAULT_TEAMS = [
  'A3 16 Elite', 'A3 16 Red', 'A3 18 Heat', 'AVC ATL 12 Red', 'AVC ATL 12 White',
  'AVC ATL 13 Blue', 'AVC ATL 13 Gold', 'AVC ATL 13 Red', 'Arsenal U12 Boys Select',
  'Arsenal U14 Girls Gold', 'Bulls U12 Boys Gold', 'Eagles SC 15 Premier',
  'Falcons U10 Boys', 'Phoenix 16 National',
]
</script>

<script setup>
// TeamSelectField — the Team name field on the Book Reservation contact step.
// Supports both event setups (DES-461):
//   • team list SHOWN  → the shared TeamCombobox (type in the field to search,
//     ✓ on the chosen team — same as Group Block, DES-470/471) + "My team isn't
//     listed" + "I'm not with a team".
//   • team list HIDDEN → the add form renders inline as the field.
// "My team isn't listed" swaps the field for the add form (DES-472) with "Pick
// from the team list instead" to go back (DES-468). No Add Team button — the
// typed team is saved with the reservation (DES-473).
// The organizer's qualifiers (Age division · Gender, toggleable, stacked —
// DES-474) are asked for a listed team (DES-462) AND when the guest says
// "I'm not with a team" (DES-469). "I'm not with a team" asks once more (DES-463).
// v-model = team name · v-model:age-division · v-model:gender.
import { ref, computed, watch, nextTick } from 'vue'
import TeamAddForm from './TeamAddForm.vue'
import TeamCombobox from './TeamCombobox.vue'

const AGE_DIVISIONS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'Open']
const GENDERS = ['Boys', 'Girls', 'Coed']
const NOT_WITH_TEAM = "I'm not with a team"

const props = defineProps({
  modelValue: { type: String, default: '' },
  ageDivision: { type: String, default: '' },
  gender: { type: String, default: '' },
  teams: { type: Array, default: () => DEFAULT_TEAMS },
  // Team name missing (red field / panel).
  error: { type: [Boolean, String], default: false },
  // Surface "Required" on empty qualifier fields.
  showErrors: { type: Boolean, default: false },
  // Event setup: hide the registered-team list (scenario 2).
  listHidden: { type: Boolean, default: false },
  // Event setup: which qualifiers the organizer requires.
  askAgeDivision: { type: Boolean, default: true },
  askGender: { type: Boolean, default: true },
  // Storybook: start open / on a given view — list | add | confirm.
  initialOpen: { type: Boolean, default: false },
  initialView: { type: String, default: 'list' },
})
const emit = defineEmits(['update:modelValue', 'update:ageDivision', 'update:gender', 'blur'])

const selected = ref(props.modelValue || '')
watch(() => props.modelValue, (v) => { selected.value = v || '' })
const isNoTeam = computed(() => selected.value === NOT_WITH_TEAM)
const hasTeam = computed(() => !!selected.value && !isNoTeam.value)
const askAny = computed(() => props.askAgeDivision || props.askGender)

// "My team isn't listed" (list shown) → the add form replaces the field.
const isCustom = (v) => !!v && v !== NOT_WITH_TEAM && !props.teams.includes(v)
const custom = ref(props.initialView === 'add' || isCustom(props.modelValue))
const confirming = ref(props.initialView === 'confirm') // DES-463 confirmation step
const formKey = ref(0)
const addForm = ref(null)
watch(() => props.listHidden, () => { custom.value = false; confirming.value = false })

function setDetails (age, gender) {
  emit('update:ageDivision', age || '')
  emit('update:gender', gender || '')
}
function commit (name) {
  selected.value = name
  emit('update:modelValue', name)
}
// Picking a different listed team clears the old qualifiers — they belong to
// the team, so the guest confirms them again.
function pick (name) {
  if (name !== selected.value) setDetails('', '')
  confirming.value = false
  commit(name)
}
// Setting `custom` unmounts the dropdown, so it closes without a blur.
function startCustom () {
  confirming.value = false
  commit(''); setDetails('', '')
  custom.value = true
  formKey.value++
  nextTick(() => addForm.value?.focus())
}
function backToList () { custom.value = false; commit(''); setDetails('', '') }
// Live add form → the typed team + qualifiers are the field's value (DES-473).
function onLive ({ name, ageDivision, gender }) { commit(name); setDetails(ageDivision, gender) }

// "I'm not with a team" → still ask the qualifiers (DES-469).
function chooseNoTeam (close) {
  commit(NOT_WITH_TEAM)
  setDetails('', '')
  confirming.value = false
  close?.()
}
// "Enter my team name" on the confirmation step → back to entering a team.
function enterTeamName () {
  confirming.value = false
  if (props.listHidden) nextTick(() => addForm.value?.focus())
  else startCustom()
}
function addTeamInstead () { commit(''); setDetails('', ''); formKey.value++; nextTick(() => addForm.value?.focus()) }

// Qualifiers below the field — listed team (DES-462) or no team (DES-469).
const showDetails = computed(() => askAny.value && (isNoTeam.value || (!props.listHidden && !custom.value && hasTeam.value)))
const missing = (key) => props.showErrors && !props[key]
const formInitial = computed(() => (hasTeam.value ? { name: selected.value, ageDivision: props.ageDivision, gender: props.gender } : {}))
const comboOptions = computed(() => props.teams)
// Only flag "Required" when the list is dismissed empty — not right after a
// pick, so the follow-up qualifiers don't light up red before they're seen.
function onComboClose () { confirming.value = false; if (!selected.value) emit('blur') }
</script>

<template>
  <div class="tsf" :class="{ 'tsf--hidden': listHidden }">
    <!-- ── TEAM LIST SHOWN (scenario 1) ─────────────────────────────── -->
    <template v-if="!listHidden && !custom">
      <team-combobox :model-value="selected" :options="comboOptions" :error="error" :initial-open="initialOpen" @update:model-value="pick" @close="onComboClose">
        <template #footer="{ close }">
          <button type="button" class="tcb__action tsf__notlisted" @mousedown.prevent @click="startCustom"><q-icon name="add_circle" size="20px" /> My team isn't listed</button>
          <!-- DES-463: one confirmation step before "no team" -->
          <div v-if="confirming" class="tsf__confirm" role="alert">
            <p>Most guests are supporting a team. Please enter a team name if possible.</p>
            <div class="tsf__confirm-actions">
              <button type="button" class="tsf__confirm-btn tsf__confirm-btn--primary" @mousedown.prevent @click="enterTeamName()">Enter my team name</button>
              <button type="button" class="tsf__confirm-btn" @mousedown.prevent @click="chooseNoTeam(close)">No, I'm not with a team</button>
            </div>
          </div>
          <button v-else type="button" class="tcb__subaction tsf__noteam" @mousedown.prevent @click="confirming = true">I'm not with a team</button>
        </template>
      </team-combobox>
    </template>

    <!-- "My team isn't listed" — the add form replaces the field (DES-472) -->
    <div v-else-if="!listHidden && custom" class="tsf__custom">
      <button type="button" class="tsf__pickswitch" @click="backToList"><q-icon name="list" size="18px" /> Pick from the team list instead</button>
      <team-add-form :key="formKey" ref="addForm" live :ask-age-division="askAgeDivision" :ask-gender="askGender" :initial="formInitial" :show-errors="showErrors" @update="onLive" />
    </div>

    <!-- ── TEAM LIST HIDDEN (scenario 2) ────────────────────────────── -->
    <template v-else>
      <div v-if="!isNoTeam" class="tsf__inline" :class="{ 'is-error': error }">
        <team-add-form :key="formKey" ref="addForm" live :ask-age-division="askAgeDivision" :ask-gender="askGender" :initial="formInitial" :show-errors="showErrors" @update="onLive" />
        <div v-if="confirming" class="tsf__confirm" role="alert">
          <p>Most guests are supporting a team. Please enter a team name if possible.</p>
          <div class="tsf__confirm-actions">
            <button type="button" class="tsf__confirm-btn tsf__confirm-btn--primary" @click="enterTeamName()">Enter my team name</button>
            <button type="button" class="tsf__confirm-btn" @click="chooseNoTeam()">No, I'm not with a team</button>
          </div>
        </div>
        <button v-else type="button" class="tsf__noteam" @click="confirming = true">I'm not with a team</button>
      </div>

      <!-- Not with a team + a way back -->
      <div v-else class="tsf__savedrow">
        <q-icon name="person" size="20px" class="tsf__savedrow-icon" />
        <div class="tsf__savedrow-text"><strong>Not with a team</strong></div>
        <button type="button" class="tsf__edit" @click="addTeamInstead">Add a team instead</button>
      </div>
    </template>

    <!-- Qualifiers — a listed team (DES-462) or no team (DES-469); stacked (DES-474) -->
    <div v-if="showDetails" class="tsf__details">
      <div class="tsf__details-h">{{ isNoTeam ? 'Guest details' : 'Additional team details' }}</div>
      <p class="tsf__details-sub">{{ isNoTeam ? "This event's organizer still needs these details, even without a team." : "This event's organizer needs a few more details to identify your team in their records." }}</p>
      <div class="tsf__stack">
        <label v-if="askAgeDivision" class="tsf__field">
          <span>Age division <i class="tsf__req">*</i></span>
          <div class="tsf__selectwrap">
            <select :value="ageDivision" :class="{ 'is-error': missing('ageDivision') }" @change="emit('update:ageDivision', $event.target.value)">
              <option value="" disabled>Select...</option>
              <option v-for="a in AGE_DIVISIONS" :key="a" :value="a">{{ a }}</option>
            </select>
            <q-icon name="unfold_more" size="18px" />
          </div>
          <small v-if="missing('ageDivision')" class="tsf__err">Required</small>
        </label>
        <label v-if="askGender" class="tsf__field">
          <span>Gender <i class="tsf__req">*</i></span>
          <div class="tsf__selectwrap">
            <select :value="gender" :class="{ 'is-error': missing('gender') }" @change="emit('update:gender', $event.target.value)">
              <option value="" disabled>Select...</option>
              <option v-for="g in GENDERS" :key="g" :value="g">{{ g }}</option>
            </select>
            <q-icon name="unfold_more" size="18px" />
          </div>
          <small v-if="missing('gender')" class="tsf__err">Required</small>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tsf { position: relative; }




/* list hidden — "I'm not with a team" link */
.tsf__noteam { width: 100%; height: 40px; margin-top: 6px; border: 0; background: none; color: var(--ds-color-text-subtle); font-family: inherit; font-size: 0.9375rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.tsf__noteam:hover { color: var(--ds-color-text); }
/* DES-468 — "Pick from the team list instead" (same as Group Block) */
.tsf__pickswitch { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px; padding: 0; border: 0; background: none; color: var(--ds-color-link); font-family: inherit; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
.tsf__pickswitch:hover { text-decoration: underline; }

/* DES-463 confirmation step */
.tsf__confirm { margin-top: 10px; padding: 14px 16px; border: 1px solid var(--ds-palette-amber-200); border-radius: var(--ds-radius-md); background: var(--ds-palette-amber-50); text-align: center; }
.tsf__confirm p { margin: 0 0 12px; color: var(--ds-color-text); font-size: 0.875rem; line-height: 1.45; }
.tsf__confirm-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.tsf__confirm-btn { height: 36px; padding: 0 14px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-button); background: var(--ds-color-surface); color: var(--ds-color-text); font-family: inherit; font-weight: 600; font-size: 0.8125rem; cursor: pointer; }
.tsf__confirm-btn:hover { background: var(--ds-palette-slate-100); }
.tsf__confirm-btn--primary { border-color: var(--ds-color-border-brand); color: var(--ds-color-text-brand); font-weight: 700; }

/* DES-462 additional team details */
.tsf__details { margin-top: 16px; }
.tsf__details-h { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ds-color-text-subtle); }
.tsf__details-sub { margin: 4px 0 10px; color: var(--ds-color-text-subtle); font-size: 0.8125rem; line-height: 1.45; }
/* DES-474: stacked vertically */
.tsf__stack { display: flex; flex-direction: column; gap: 14px; }
.tsf__field { display: flex; flex-direction: column; gap: 6px; }
.tsf__field span { font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.tsf__req { color: var(--ds-color-text-danger); font-style: normal; }
.tsf__err { color: var(--ds-color-text-danger); font-size: 0.75rem; font-weight: 500; }
.tsf__selectwrap { position: relative; display: flex; align-items: center; }
.tsf__selectwrap select { width: 100%; height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 38px 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); background: var(--ds-color-surface); outline: none; appearance: none; -webkit-appearance: none; cursor: pointer; }
.tsf__selectwrap select:focus { border-color: var(--ds-color-border-focused); }
.tsf__selectwrap select.is-error { border-color: var(--ds-color-text-danger); }
.tsf__selectwrap .q-icon { position: absolute; right: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }

/* DES-461 list hidden — inline add panel + saved row */
.tsf__inline { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface-sunken); padding: 14px 16px 10px; }
.tsf__inline.is-error { border-color: var(--ds-color-text-danger); }
.tsf__savedrow { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); }
.tsf__savedrow-icon { color: var(--ds-color-text-brand); flex: none; }
.tsf__savedrow-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.tsf__savedrow-text strong { color: var(--ds-color-text); font-size: 0.9375rem; }
.tsf__savedrow-text span { color: var(--ds-color-text-subtle); font-size: 0.8125rem; }
.tsf__edit { border: 0; background: none; padding: 4px 0; color: var(--ds-color-link); font-family: inherit; font-weight: 700; font-size: 0.875rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>