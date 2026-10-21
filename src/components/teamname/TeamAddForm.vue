<script setup>
// TeamAddForm — the "add your team" form shared by both team-name workflows:
//   • "My team isn't listed" → replaces the Team name field (DES-472)
//   • list hidden → rendered inline as the Team name field (DES-461)
// Org / Team name + the organizer's qualifiers (Age division · Gender, each
// toggleable, stacked vertically — DES-474) and a live "TEAM WILL BE SAVED AS"
// preview. Two modes:
//   • live   → no button; emits `update` as the guest types and the team is
//              saved with the reservation / group block (DES-473 / DES-476).
//   • submit → an Add button (disabled until filled) emits `submit`; used when
//              a group block adds several teams one after another.
import { reactive, computed, ref, watch } from 'vue'

const AGE_DIVISIONS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'Open']
const GENDERS = ['Boys', 'Girls', 'Coed']

const props = defineProps({
  askAgeDivision: { type: Boolean, default: true },
  askGender: { type: Boolean, default: true },
  // Prefill when editing an already-added team: { name, ageDivision, gender }.
  initial: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: 'Add Team' },
  showPreview: { type: Boolean, default: true },
  // No button — emit `update` on every change (DES-473 / DES-476).
  live: { type: Boolean, default: false },
  // Live mode: flag empty required fields.
  showErrors: { type: Boolean, default: false },
})
const emit = defineEmits(['submit', 'update'])

const form = reactive({
  name: props.initial.name || '',
  ageDivision: props.initial.ageDivision || '',
  gender: props.initial.gender || '',
})
const asked = computed(() => [props.askAgeDivision && 'Age division', props.askGender && 'Gender'].filter(Boolean))
const savedAs = computed(() => [
  form.name.trim(),
  props.askAgeDivision ? form.ageDivision : '',
  props.askGender ? form.gender : '',
].filter(Boolean).join(' · '))
const valid = computed(() => !!form.name.trim()
  && (!props.askAgeDivision || !!form.ageDivision)
  && (!props.askGender || !!form.gender))
const reqBy = computed(() => (asked.value.length ? `${asked.value.join(' and ')} required by this event's organizer` : ''))

const values = () => ({
  name: form.name.trim(),
  ageDivision: props.askAgeDivision ? form.ageDivision : '',
  gender: props.askGender ? form.gender : '',
})
const nameInput = ref(null)
function submit () {
  if (props.live || !valid.value) return
  emit('submit', values())
}
// Live mode: every edit flows straight out ({ ...values, valid }).
watch(() => [form.name, form.ageDivision, form.gender, props.askAgeDivision, props.askGender], () => {
  if (props.live) emit('update', { ...values(), valid: valid.value })
})
const missing = (f) => props.live && props.showErrors && !form[f].trim()
defineExpose({ focus: () => nameInput.value?.focus() })
</script>

<template>
  <div class="taf">
    <label class="taf__field">
      <span>Org / Team name <i class="taf__req">*</i></span>
      <input ref="nameInput" v-model="form.name" type="text" placeholder="e.g. Augusta Arsenal Volleyball Club" :class="{ 'is-error': missing('name') }" @keydown.enter.prevent="submit" />
    </label>

    <div v-if="asked.length" class="taf__stack">
      <label v-if="askAgeDivision" class="taf__field">
        <span>Age division <i class="taf__req">*</i></span>
        <div class="taf__selectwrap">
          <select v-model="form.ageDivision" :class="{ 'is-error': missing('ageDivision') }"><option value="" disabled>Select...</option><option v-for="a in AGE_DIVISIONS" :key="a" :value="a">{{ a }}</option></select>
          <q-icon name="unfold_more" size="18px" />
        </div>
      </label>
      <label v-if="askGender" class="taf__field">
        <span>Gender <i class="taf__req">*</i></span>
        <div class="taf__selectwrap">
          <select v-model="form.gender" :class="{ 'is-error': missing('gender') }"><option value="" disabled>Select...</option><option v-for="g in GENDERS" :key="g" :value="g">{{ g }}</option></select>
          <q-icon name="unfold_more" size="18px" />
        </div>
      </label>
    </div>

    <div v-if="showPreview" class="taf__saved">
      <span class="taf__saved-h">TEAM WILL BE SAVED AS</span>
      <span class="taf__saved-v" :class="{ 'taf__saved-v--empty': !savedAs }">{{ savedAs || 'Fill in the fields above...' }}</span>
    </div>
    <p v-if="reqBy" class="taf__reqby">{{ reqBy }}</p>
    <button v-if="!live" type="button" class="taf__add" :class="{ 'is-disabled': !valid }" :disabled="!valid" @click="submit">{{ submitLabel }}</button>
  </div>
</template>

<style scoped>
.taf__field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.taf__field span { font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.taf__req { color: var(--ds-color-text-danger); font-style: normal; }
.taf__field input { height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); background: var(--ds-color-surface); outline: none; }
.taf__field input:focus { border-color: var(--ds-color-border-focused); }
/* DES-474: Age division + Gender stacked vertically */
.taf__stack { display: flex; flex-direction: column; }
.taf__field input.is-error, .taf__selectwrap select.is-error { border-color: var(--ds-color-text-danger); }
.taf__selectwrap { position: relative; display: flex; align-items: center; }
.taf__selectwrap select { width: 100%; height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 38px 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); background: var(--ds-color-surface); outline: none; appearance: none; -webkit-appearance: none; cursor: pointer; }
.taf__selectwrap select:focus { border-color: var(--ds-color-border-focused); }
.taf__selectwrap .q-icon { position: absolute; right: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }
.taf__saved { background: var(--ds-color-background-brand-subtle, var(--ds-palette-navy-50)); border-radius: var(--ds-radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.taf__saved-h { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: var(--ds-color-text-brand); }
.taf__saved-v { font-size: 1rem; font-weight: 700; color: var(--ds-color-text-brand); }
.taf__saved-v--empty { font-weight: 400; font-style: italic; color: var(--ds-color-text-subtle); }
.taf__reqby { text-align: center; color: var(--ds-color-text-subtle); font-size: 0.8125rem; margin: 14px 0; }
.taf__add { width: 100%; height: 52px; margin-top: 14px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; }
.taf__reqby + .taf__add { margin-top: 0; }
.taf__add:hover { background: var(--ds-palette-navy-800); }
.taf__add.is-disabled { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtlest); cursor: not-allowed; }
</style>
