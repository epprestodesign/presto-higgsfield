<script setup>
// TeamGroupContactBlock — FORK of checkout/GroupTeamsBlock.vue for the Team Name Qualifiers workstream (isolated copy; iterate team-name UX safely).
// Primary contact (names/mobile/email required; org/special optional), then the
// group block's teams flow:
//   1) How many teams? — a typeable number field with up/down (DES-466).
//   2) Add the teams one at a time ("Team k of N") —
//        • team list SHOWN  → the shared TeamCombobox (type in the Team name
//          field to search — DES-477), or "My team isn't listed — type it in"
//          (design doc wording).
//        • team list HIDDEN → type each team's name + the organizer's
//          qualifiers, no dropdown (DES-467).
//   Once every team is in, the step collapses to a confirmed summary with
//   Change count / Edit team list (DES-464).
// "I am not holding for a team" asks once more before skipping (DES-465).
import { ref, reactive, computed, watch } from 'vue'
import PhoneField from '../checkout/PhoneField.vue'
import TeamAddForm from './TeamAddForm.vue'
import TeamCombobox from './TeamCombobox.vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  showErrors: { type: Boolean, default: false },
  // Render the teams block widget. Off → a group block held without team holding
  // (just the block name + primary contact).
  showTeams: { type: Boolean, default: true },
  // Event setup — the same toggles as the Book Reservation flow.
  listHidden: { type: Boolean, default: false }, // team list not shown → type each team
  askAgeDivision: { type: Boolean, default: true },
  askGender: { type: Boolean, default: true },
  // Initial state — lets stories render each edge case of the teams flow.
  initialView: { type: String, default: 'count' }, // count | seq | confirmed
  initialNotHolding: { type: Boolean, default: false },
  initialConfirmSkip: { type: Boolean, default: false },
  initialExpected: { type: Number, default: null },
  // Team names, or { name, ageDivision, gender, custom } objects.
  initialTeams: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const toTeam = (t) => (typeof t === 'string'
  ? { name: t, ageDivision: '', gender: '', custom: false }
  : { name: t.name, ageDivision: t.ageDivision || '', gender: t.gender || '', custom: !!t.custom })
const teamLabel = (t) => [t.name, t.ageDivision, t.gender].filter(Boolean).join(' · ')

const view = ref(['list', 'add'].includes(props.initialView) ? 'seq' : props.initialView)
const notHolding = ref(props.initialNotHolding)
const confirmSkip = ref(props.initialConfirmSkip) // DES-465 confirmation step
const groupBlockName = ref(props.modelValue.groupBlockName || '')
const showSpecial = ref(false)
// DES-466: starts blank (Next stays disabled until a number is entered).
const expected = ref(props.modelValue.expected ?? props.initialExpected ?? '')

// Additional email addresses — beyond the primary contact email (optional).
const additionalEmails = ref([...(props.modelValue.additionalEmails || [])])
const addEmail = () => additionalEmails.value.push('')
const removeEmail = (i) => additionalEmails.value.splice(i, 1)

const clubs = ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Tottenham', 'Everton', 'Leeds United', 'Newcastle', 'Aston Villa', 'Brighton']
const teamAges = ['U10', 'U12', 'U14', 'U16']
const teamGenders = ['Boys', 'Girls']
const available = clubs.flatMap((c) => teamAges.flatMap((a) => teamGenders.map((g) => ({ name: `${c} ${a} ${g}` }))))
const added = ref(props.initialTeams.map(toTeam))
const addedNames = computed(() => added.value.map((t) => t.name))

const contact = reactive({ firstName: '', lastName: '', mobile: '', email: '', organization: '', special: '', orgCountry: 'United States', orgAddress: '', orgCity: '', orgPostal: '', orgState: '', ...(props.modelValue.contact || {}) })

// DES-77: organization address. State/Province options follow the country
// (default United States); country itself has a default so is never "Required".
const orgCountries = ['United States', 'Canada', 'Other']
const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
const CA_PROVINCES = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon']
const orgStateOptions = computed(() => (contact.orgCountry === 'United States' ? US_STATES : contact.orgCountry === 'Canada' ? CA_PROVINCES : []))
const orgStateLabel = computed(() => (contact.orgCountry === 'Canada' ? 'Province' : 'State/Province'))
watch(() => contact.orgCountry, () => { contact.orgState = '' })

// ── Step 1 — team count (DES-466) ──
const expectedN = computed(() => { const n = Number(expected.value); return expected.value !== '' && Number.isInteger(n) && n >= 1 ? n : 0 })
const countValid = computed(() => expectedN.value >= 1)
const inc = () => { expected.value = expectedN.value + 1 }
const dec = () => { expected.value = Math.max(1, expectedN.value - 1) }
function normalizeCount () { if (expected.value !== '' && expectedN.value < 1) expected.value = '' }
function goNext () {
  if (!countValid.value) return
  confirmSkip.value = false
  if (added.value.length >= expectedN.value) view.value = 'confirmed'
  else view.value = 'seq'
}

// ── Step 2 — add the teams one at a time ("Team k of N") ──
// Design doc: "For each team, let the user either select a team name from a
// dropdown or enter a team name" (list shown); list hidden → enter a name only.
const remaining = computed(() => Math.max(0, expectedN.value - added.value.length))
// DES-464: once every team is in, collapse to the confirmed summary.
function maybeConfirm () { if (expectedN.value && added.value.length >= expectedN.value) view.value = 'confirmed' }
const removeTeam = (name) => { added.value = added.value.filter((t) => t.name !== name) }

// List shown → pick from the registered-team dropdown, or type it in.
const seqMode = ref(props.listHidden ? 'type' : 'pick') // pick | type
const seqPick = ref('')
const pickOptions = computed(() => available.map((t) => t.name).filter((n) => !addedNames.value.includes(n)))
function useTypeMode (close) { close?.(); seqMode.value = 'type'; seqPick.value = '' }
function usePickMode () { seqMode.value = 'pick'; seqDraft.value = {}; seqKey.value++; liveTeam.value = null }

// DES-476: just 1 team and it's typed in → no Add button; the team saves with
// the group block (live form). 2+ teams keep Add & Continue / Add & Confirm.
const liveTeam = ref(null)
const isTyping = computed(() => props.listHidden || seqMode.value === 'type')
const liveMode = computed(() => expectedN.value === 1 && added.value.length === 0 && isTyping.value)
const liveValid = computed(() => liveMode.value && !!liveTeam.value?.valid)
function onLive (t) { liveTeam.value = t }
watch(liveMode, (on) => { if (!on) liveTeam.value = null })
const allTeams = computed(() => (liveValid.value
  ? [...added.value, { name: liveTeam.value.name, ageDivision: liveTeam.value.ageDivision, gender: liveTeam.value.gender, custom: true }]
  : added.value))
function onPickAdd () {
  if (!seqPick.value) return
  added.value.push(toTeam(seqPick.value))
  seqPick.value = ''
  maybeConfirm()
}

const seqDraft = ref({})
const seqKey = ref(0)
const seqIndex = computed(() => Math.min(added.value.length + 1, Math.max(expectedN.value, 1)))
const seqDone = computed(() => remaining.value === 0)
const seqProgress = computed(() => (expectedN.value ? Math.round((added.value.length / expectedN.value) * 100) : 0))
const seqHint = computed(() => {
  const k = seqIndex.value, n = expectedN.value
  if (n <= 1) return 'Add your team below.'
  return k >= n ? `Last one! Adding team ${k} of ${n}.` : `Adding team ${k} of ${n} — you'll add the rest next.`
})
const seqLabel = computed(() => (seqIndex.value >= expectedN.value ? 'Add & Confirm ✓' : 'Add & Continue →'))
function onSeqAdd (team) {
  added.value.push({ ...team, custom: true })
  seqDraft.value = {}
  seqKey.value++
  if (!props.listHidden) seqMode.value = 'pick'
  maybeConfirm()
}
// Back steps to the previous team (pulled back into the form), or to the count.
function seqBack () {
  if (!added.value.length) { view.value = 'count'; return }
  const t = added.value.pop()
  if (!props.listHidden && !t.custom) { seqMode.value = 'pick'; seqPick.value = t.name; return }
  seqMode.value = 'type'
  seqDraft.value = t
  seqKey.value++
}

// ── Confirmed summary ──
const editList = () => { view.value = 'seq' }
watch(() => props.listHidden, (hidden) => {
  seqMode.value = hidden ? 'type' : 'pick'
  seqPick.value = ''
})

// ── "I am not holding for a team" (DES-465) ──
const keepTeams = () => { confirmSkip.value = false }
const skipTeams = () => { confirmSkip.value = false; notHolding.value = true }
const undoSkip = () => { notHolding.value = false; view.value = 'count' }

const barTitle = computed(() => {
  if (notHolding.value) return "No team list — guests won't select a team"
  if (view.value === 'confirmed') return `${added.value.length} team${added.value.length === 1 ? '' : 's'} confirmed`
  if (view.value === 'count') return 'Step 1 of 2 — How many teams?'
  return 'Step 2 of 2 — Select and Add Teams'
})

// Primary-contact validation (org + special are optional).
const touched = reactive({})
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
const cShow = (f) => props.showErrors || touched[f]
const cErr = (f) => {
  if (!cShow(f)) return ''
  if (!contact[f]) return 'Required'
  if (f === 'email' && !emailOk.value) return 'Enter a valid email'
  return ''
}
const teamsErr = computed(() => (props.showErrors && allTeams.value.length === 0 ? 'Add at least one team' : ''))
const blockNameErr = computed(() => (props.showErrors && !groupBlockName.value.trim() ? 'Required' : ''))

watch([allTeams, expected, contact, notHolding, groupBlockName, additionalEmails], () => emit('update:modelValue', {
  expected: expectedN.value,
  // Display labels ("Name · U17 · Girls") feed the rail card + Confirmation;
  // teamDetails keeps the structured values.
  teams: allTeams.value.map(teamLabel),
  teamDetails: allTeams.value.map((t) => ({ ...t })),
  contact: { ...contact },
  notHolding: notHolding.value,
  groupBlockName: groupBlockName.value,
  additionalEmails: additionalEmails.value.filter((e) => e.trim()),
}), { deep: true, immediate: true })
</script>

<template>
  <div class="gtb">
    <!-- Group block name (required) — the block's identifier, shown to guests -->
    <label class="gtb__field gtb__field--full gtb__blockname-top">
      <span>Group Block Name <i class="gtb__req">*</i></span>
      <input v-model="groupBlockName" placeholder="e.g. Spring Cup — Eagles SC" :class="{ 'is-error': blockNameErr }" />
      <small v-if="blockNameErr" class="gtb__errmsg">{{ blockNameErr }}</small>
      <small class="gtb__hint">A name for this room block — shown to guests when they book.</small>
    </label>

    <!-- primary contact -->
    <h4 class="gtb__h">Primary contact</h4>
    <div class="gtb__grid">
      <label class="gtb__field">
        <span>First name <i class="gtb__req">*</i></span>
        <input v-model="contact.firstName" placeholder="First name" :class="{ 'is-error': cErr('firstName') }" @blur="touched.firstName = true" />
        <small v-if="cErr('firstName')" class="gtb__errmsg">{{ cErr('firstName') }}</small>
      </label>
      <label class="gtb__field">
        <span>Last name <i class="gtb__req">*</i></span>
        <input v-model="contact.lastName" placeholder="Last name" :class="{ 'is-error': cErr('lastName') }" @blur="touched.lastName = true" />
        <small v-if="cErr('lastName')" class="gtb__errmsg">{{ cErr('lastName') }}</small>
      </label>
      <label class="gtb__field gtb__field--full">
        <span>Email <i class="gtb__req">*</i></span>
        <input v-model="contact.email" type="email" placeholder="youraccount@eventpipe.com" :class="{ 'is-error': cErr('email') }" @blur="touched.email = true" />
        <small v-if="cErr('email')" class="gtb__errmsg">{{ cErr('email') }}</small>
      </label>

      <!-- additional email addresses -->
      <div v-for="(e, i) in additionalEmails" :key="'email-' + i" class="gtb__field gtb__field--full">
        <span>Additional email</span>
        <div class="gtb__emailrow">
          <input v-model="additionalEmails[i]" type="email" placeholder="name@example.com" />
          <button type="button" class="gtb__emailremove" aria-label="Remove email" @click="removeEmail(i)"><q-icon name="close" size="18px" /></button>
        </div>
      </div>
      <div class="gtb__field gtb__field--full">
        <button type="button" class="gtb__addreq" @click="addEmail"><q-icon name="add_circle" size="22px" /> Add another email</button>
      </div>

      <div class="gtb__field gtb__field--full">
        <span>Phone number <i class="gtb__req">*</i></span>
        <phone-field v-model="contact.mobile" :error="!!cErr('mobile')" @blur="touched.mobile = true" />
        <small v-if="cErr('mobile')" class="gtb__errmsg">{{ cErr('mobile') }}</small>
      </div>
      <label class="gtb__field gtb__field--full">
        <span>Organization name <i class="gtb__req">*</i></span>
        <input v-model="contact.organization" placeholder="Organization" :class="{ 'is-error': cErr('organization') }" @blur="touched.organization = true" />
        <small v-if="cErr('organization')" class="gtb__errmsg">{{ cErr('organization') }}</small>
      </label>
      <!-- DES-77: organization address (all required; State/Province follows Country) -->
      <label class="gtb__field gtb__field--full">
        <span>Organization Country <i class="gtb__req">*</i></span>
        <div class="gtb__selectwrap"><select v-model="contact.orgCountry"><option v-for="c in orgCountries" :key="c" :value="c">{{ c }}</option></select><q-icon name="expand_more" size="18px" /></div>
      </label>
      <label class="gtb__field gtb__field--full">
        <span>Organization Address <i class="gtb__req">*</i></span>
        <input v-model="contact.orgAddress" placeholder="Street address" :class="{ 'is-error': cErr('orgAddress') }" @blur="touched.orgAddress = true" />
        <small v-if="cErr('orgAddress')" class="gtb__errmsg">{{ cErr('orgAddress') }}</small>
      </label>
      <label class="gtb__field">
        <span>Organization City <i class="gtb__req">*</i></span>
        <input v-model="contact.orgCity" placeholder="City" :class="{ 'is-error': cErr('orgCity') }" @blur="touched.orgCity = true" />
        <small v-if="cErr('orgCity')" class="gtb__errmsg">{{ cErr('orgCity') }}</small>
      </label>
      <label class="gtb__field">
        <span>Organization Postal Code <i class="gtb__req">*</i></span>
        <input v-model="contact.orgPostal" placeholder="Postal code" :class="{ 'is-error': cErr('orgPostal') }" @blur="touched.orgPostal = true" />
        <small v-if="cErr('orgPostal')" class="gtb__errmsg">{{ cErr('orgPostal') }}</small>
      </label>
      <!-- State/Province: US states or Canada provinces; removed entirely for Other. -->
      <label v-if="contact.orgCountry !== 'Other'" class="gtb__field gtb__field--full">
        <span>Organization {{ orgStateLabel }} <i class="gtb__req">*</i></span>
        <div class="gtb__selectwrap"><select v-model="contact.orgState" @blur="touched.orgState = true"><option value="" disabled>Select {{ orgStateLabel.toLowerCase() }}</option><option v-for="s in orgStateOptions" :key="s" :value="s">{{ s }}</option></select><q-icon name="expand_more" size="18px" /></div>
        <small v-if="cErr('orgState')" class="gtb__errmsg">{{ cErr('orgState') }}</small>
      </label>
      <label v-if="showSpecial" class="gtb__field gtb__field--full"><span>Special requests</span><input v-model="contact.special" placeholder="Additional notes (optional)" /></label>
    </div>
    <div class="gtb__addrow">
      <button v-if="!showSpecial" class="gtb__addreq" @click="showSpecial = true"><q-icon name="add_circle" size="22px" /> Add a special request</button>
    </div>

    <!-- teams flow card (hidden when holding a block without team assignment) -->
    <div v-if="showTeams" class="gtb__flow">
      <div class="gtb__bar">
        <span>{{ barTitle }}</span>
        <button v-if="!notHolding && view !== 'count'" type="button" class="gtb__changecount" @click="view = 'count'">Change count</button>
      </div>

      <!-- DES-465: skipped — no team list -->
      <div v-if="notHolding" class="gtb__panel">
        <p class="gtb__confirmed-h"><q-icon name="check" size="16px" /> Team list confirmed</p>
        <p class="gtb__nolist"><q-icon name="warning" size="17px" /> No team list set — guests will book without selecting a team.</p>
        <div class="gtb__editrow"><button type="button" class="gtb__editlist" @click="undoSkip"><q-icon name="edit" size="15px" /> Edit team list</button></div>
      </div>

      <div v-else class="gtb__panel">
        <!-- STEP 1 — COUNT (DES-466: typeable + up/down) -->
        <template v-if="view === 'count'">
          <h4 class="gtb__qh">How many teams from your organization might share this block?</h4>
          <p class="gtb__qsub">Include every team that might attend — guests will pick from this list when booking so it's important that they can select their specific team. No problem if you add teams that don't end up attending, it's better to add too many than too few.</p>
          <div class="gtb__countrow">
            <div class="gtb__countbox">
              <input v-model.number="expected" class="gtb__countinput" type="number" inputmode="numeric" min="1" placeholder="–" aria-label="Number of teams" @blur="normalizeCount" @keydown.enter.prevent="goNext" />
              <span class="gtb__spin">
                <button type="button" aria-label="Increase" @click="inc"><q-icon name="keyboard_arrow_up" size="16px" /></button>
                <button type="button" aria-label="Decrease" :disabled="expectedN <= 1" @click="dec"><q-icon name="keyboard_arrow_down" size="16px" /></button>
              </span>
            </div>
            <span class="gtb__countlabel">Teams</span>
          </div>
          <q-btn unelevated no-caps class="gtb__nextbtn" :class="{ 'is-disabled': !countValid }" :tabindex="countValid ? 0 : -1" label="Next: Select & Add Teams →" @click="goNext" />
          <!-- DES-465: one more step before skipping the team list -->
          <div v-if="confirmSkip" class="gtb__skipconfirm" role="alert">
            <p>Without a team list, guests won't be able to identify which team they're with. Are you sure you want to skip?</p>
            <div class="gtb__skipconfirm-actions">
              <button type="button" class="gtb__skipbtn gtb__skipbtn--primary" @click="keepTeams">Go back &amp; add teams</button>
              <button type="button" class="gtb__skipbtn" @click="skipTeams">Yes, skip for now</button>
            </div>
          </div>
          <button v-else type="button" class="gtb__notholding" @click="confirmSkip = true">I am not holding for a team</button>
        </template>

        <!-- CONFIRMED (DES-464) -->
        <template v-else-if="view === 'confirmed'">
          <p class="gtb__confirmed-h"><q-icon name="check" size="16px" /> Team list confirmed</p>
          <div class="gtb__chips">
            <span v-for="t in added" :key="t.name" class="gtb__chip gtb__chip--done" :class="{ 'gtb__chip--custom': t.custom }">
              <q-icon :name="t.custom ? 'edit_note' : 'check'" size="15px" />{{ teamLabel(t) }}
            </span>
          </div>
          <p v-if="added.length < expectedN" class="gtb__fewer">{{ added.length }} of {{ expectedN }} teams added — that's fine.</p>
          <div class="gtb__editrow"><button type="button" class="gtb__editlist" @click="editList"><q-icon name="edit" size="15px" /> Edit team list</button></div>
        </template>

        <!-- STEP 2 — one team at a time: list shown → dropdown or type it;
             list hidden → type it (DES-467) -->
        <template v-else-if="view === 'seq'">
          <div class="gtb__progress"><div class="gtb__progress-fill" :style="{ width: seqProgress + '%' }" /></div>
          <template v-if="!seqDone">
            <div class="gtb__seq-eyebrow">Team {{ seqIndex }} of {{ expectedN }}</div>
            <button type="button" class="gtb__back gtb__seq-back" @click="seqBack"><q-icon name="arrow_back" size="20px" /> Add team {{ seqIndex }} of {{ expectedN }}</button>
            <div v-if="added.length" class="gtb__chips gtb__seq-chips">
              <span v-for="t in added" :key="t.name" class="gtb__chip">{{ teamLabel(t) }}<button type="button" aria-label="Remove" @click="removeTeam(t.name)"><q-icon name="close" size="14px" /></button></span>
            </div>
            <div class="gtb__seq-hint">{{ seqHint }}</div>

            <!-- list shown: the shared team dropdown — type in the field to search (DES-477) -->
            <div v-if="!listHidden && seqMode === 'pick'" class="gtb__pick">
              <span class="gtb__pick-label">Team name <i class="gtb__req">*</i></span>
              <team-combobox v-model="seqPick" :options="pickOptions">
                <template #footer="{ close }">
                  <button type="button" class="tcb__action gtb__pick-unlisted" @mousedown.prevent @click="useTypeMode(close)"><q-icon name="add_circle" size="20px" /> My team isn't listed — type it in</button>
                </template>
              </team-combobox>
              <button type="button" class="gtb__pick-add" :class="{ 'is-disabled': !seqPick }" :disabled="!seqPick" @click="onPickAdd">{{ seqLabel }}</button>
            </div>

            <!-- list hidden, or "My team isn't listed": enter the team name -->
            <template v-else>
              <button v-if="!listHidden" type="button" class="gtb__pick-switch" @click="usePickMode"><q-icon name="list" size="18px" /> Pick from the team list instead</button>
              <!-- DES-475: "Team will be saved as" preview · DES-476: 1 team → no button -->
              <team-add-form v-if="liveMode" :key="'live-' + seqKey" live :ask-age-division="askAgeDivision" :ask-gender="askGender" :initial="seqDraft" :show-errors="showErrors" @update="onLive" />
              <team-add-form v-else :key="seqKey" :ask-age-division="askAgeDivision" :ask-gender="askGender" :initial="seqDraft" :submit-label="seqLabel" @submit="onSeqAdd" />
            </template>
            <p v-if="teamsErr" class="gtb__errmsg gtb__errmsg--block">{{ teamsErr }}</p>
          </template>
          <template v-else>
            <div class="gtb__chips gtb__seq-chips">
              <span v-for="t in added" :key="t.name" class="gtb__chip">{{ teamLabel(t) }}<button type="button" aria-label="Remove" @click="removeTeam(t.name)"><q-icon name="close" size="14px" /></button></span>
            </div>
            <q-btn unelevated no-caps class="gtb__confirm" label="Done" @click="view = 'confirmed'" />
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gtb__h { font-size: 1rem; font-weight: 700; color: var(--ds-color-text); margin: 24px 0 12px; }
.gtb__h--first { margin-top: 0; }
.gtb__addrow { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; margin-top: 28px; }
.gtb__addreq { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; padding: 0; color: var(--ds-color-text); font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.gtb__addreq:hover { text-decoration: underline; }

.gtb__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .gtb__grid { grid-template-columns: 1fr; } }
.gtb__grid--mt { margin-top: 14px; }
.gtb__field { display: flex; flex-direction: column; gap: 6px; }
.gtb__field--full { grid-column: 1 / -1; }
.gtb__field span { font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.gtb__req { color: var(--ds-color-text-danger); font-style: normal; }
.gtb__errmsg { color: var(--ds-color-text-danger); font-size: 0.75rem; font-weight: 500; }
.gtb__blockname-top { margin-bottom: 24px; }
.gtb__hint { color: var(--ds-color-text-subtle); font-size: 0.75rem; }
/* additional email row — input + remove button */
.gtb__emailrow { display: flex; align-items: center; gap: 8px; }
.gtb__emailrow input { flex: 1; }
.gtb__emailremove { width: 40px; height: 40px; flex: none; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text-subtle); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.gtb__emailremove:hover { background: var(--ds-palette-slate-100); color: var(--ds-color-text); }
.gtb__errmsg--block { margin: 8px 0 0; }
.gtb input { height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); width: 100%; }
.gtb input:focus { border-color: var(--ds-color-border-focused); }
.gtb input::placeholder { color: var(--ds-color-text-subtlest); }
.gtb input.is-error { border-color: var(--ds-color-text-danger); }

.gtb__selectwrap { position: relative; display: flex; align-items: center; }
.gtb__selectwrap select { width: 100%; height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 38px 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); background: var(--ds-color-surface); outline: none; appearance: none; -webkit-appearance: none; cursor: pointer; }
.gtb__selectwrap select:focus { border-color: var(--ds-color-border-focused); }
.gtb__selectwrap .q-icon { position: absolute; right: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }

/* Teams flow card */
/* No overflow: hidden — the team dropdown must be able to drop past the card. */
.gtb__flow { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); margin-top: 24px; }
.gtb__bar { border-radius: calc(var(--ds-radius-lg) - 1px) calc(var(--ds-radius-lg) - 1px) 0 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--ds-color-background-brand-bold); color: #fff; padding: 14px 18px; font-weight: 600; }
.gtb__changecount { background: none; border: 0; color: #fff; font-weight: 600; cursor: pointer; }
.gtb__changecount:hover { text-decoration: underline; }
.gtb__panel { padding: 20px; }

/* Count step */
.gtb__qh { font-size: 1.0625rem; font-weight: 700; line-height: 1.25; color: var(--ds-color-text); margin: 0 0 8px; }
.gtb__qsub { color: var(--ds-color-text-subtle); font-size: 0.875rem; line-height: 1.5; margin: 0 0 20px; }
.gtb__countrow { display: flex; align-items: center; gap: 12px; }
.gtb__countbox { display: inline-flex; align-items: stretch; height: 50px; width: 76px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); overflow: hidden; }
.gtb__countval { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; color: var(--ds-color-text); }
.gtb__spin { display: flex; flex-direction: column; border-left: 1px solid var(--ds-color-border); }
.gtb__spin button { flex: 1; width: 24px; border: 0; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ds-color-text-subtle); }
.gtb__spin button:first-child { border-bottom: 1px solid var(--ds-color-border); }
.gtb__spin button:hover:not(:disabled) { background: var(--ds-palette-slate-100); color: var(--ds-color-text); }
.gtb__spin button:disabled { opacity: 0.4; cursor: not-allowed; }
.gtb__countlabel { font-weight: 600; color: var(--ds-color-text); }
.gtb__nextbtn { width: 100%; height: 52px; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.9375rem; margin-top: 24px; }
.gtb__nextbtn.is-disabled { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtlest); pointer-events: none; }
.gtb__notholding { display: block; width: 100%; text-align: center; background: none; border: 0; padding: 16px 0 0; color: var(--ds-color-text-subtle); font-weight: 600; font-size: 0.9375rem; cursor: pointer; }
.gtb__notholding:hover { color: var(--ds-color-text); }

/* Chips · buttons */
.gtb__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.gtb__chip { display: inline-flex; align-items: center; gap: 6px; background: var(--ds-palette-slate-100); border-radius: var(--ds-radius-pill); padding: 6px 6px 6px 12px; font-size: 0.875rem; font-weight: 500; color: var(--ds-color-text); }
.gtb__chip button { width: 20px; height: 20px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-200); color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.gtb__empty { color: var(--ds-color-text-subtle); font-size: 0.875rem; padding: 12px 4px; margin: 0; }
.gtb__confirm { height: 44px; padding: 0 22px; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 600; }
.gtb__confirm.is-disabled { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtlest); pointer-events: none; }

/* Add unlisted */
.gtb__back { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; padding: 0 0 14px; color: var(--ds-color-text); font-weight: 700; font-size: 1.0625rem; cursor: pointer; }

/* Not-holding after-state */
.gtb__nothold { display: flex; align-items: flex-start; gap: 12px; color: var(--ds-color-text); }
.gtb__nothold .q-icon { color: var(--ds-color-text-subtle); flex: none; margin-top: 2px; }
.gtb__nothold strong { display: block; font-size: 0.9375rem; }
.gtb__nothold p { margin: 4px 0 0; color: var(--ds-color-text-subtle); font-size: 0.875rem; line-height: 1.45; }
.gtb__undo { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; background: none; border: 0; padding: 0; color: var(--ds-color-text); font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.gtb__undo:hover { text-decoration: underline; }

/* DES-466 — typeable count */
.gtb__countbox .gtb__countinput { flex: 1; width: 100%; min-width: 0; height: auto; border: 0; border-radius: 0; padding: 0 4px; text-align: center; font-weight: 700; font-size: 1.125rem; -moz-appearance: textfield; }
.gtb__countbox .gtb__countinput::-webkit-outer-spin-button,
.gtb__countbox .gtb__countinput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.gtb__countbox:focus-within { border-color: var(--ds-color-border-focused); box-shadow: 0 0 0 1px var(--ds-color-border-focused); }

/* DES-465 — skip confirmation + no-list after-state */
.gtb__skipconfirm { margin-top: 14px; padding: 14px 16px; border: 1px solid var(--ds-palette-amber-200); border-radius: var(--ds-radius-md); background: var(--ds-palette-amber-50); text-align: center; }
.gtb__skipconfirm p { margin: 0 0 12px; color: var(--ds-color-text); font-size: 0.875rem; line-height: 1.45; }
.gtb__skipconfirm-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.gtb__skipbtn { height: 36px; padding: 0 14px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-button); background: var(--ds-color-surface); color: var(--ds-color-text); font-family: inherit; font-weight: 600; font-size: 0.8125rem; cursor: pointer; }
.gtb__skipbtn:hover { background: var(--ds-palette-slate-100); }
.gtb__skipbtn--primary { border-color: var(--ds-color-border-brand); color: var(--ds-color-text-brand); font-weight: 700; }
.gtb__nolist { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--ds-palette-amber-700); font-size: 0.875rem; font-weight: 600; line-height: 1.45; }

/* DES-464 — confirmed summary */
.gtb__confirmed-h { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 12px; color: var(--ds-color-text-success); font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.gtb__chip--done { gap: 6px; padding: 6px 12px; border: 1px solid var(--ds-color-border-brand); background: var(--ds-color-surface); color: var(--ds-color-text-brand); font-weight: 600; }
.gtb__chip--custom { border-color: var(--ds-palette-amber-300); background: var(--ds-palette-amber-50); color: var(--ds-palette-amber-800); }
.gtb__fewer { margin: 10px 0 0; color: var(--ds-color-text-subtle); font-size: 0.8125rem; }
.gtb__editrow { display: flex; justify-content: flex-end; margin-top: 12px; }
.gtb__editlist { display: inline-flex; align-items: center; gap: 4px; border: 0; background: none; padding: 0; color: var(--ds-color-link); font-family: inherit; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
.gtb__editlist:hover { text-decoration: underline; }

/* DES-467 — hidden list, one team at a time */
.gtb__progress { height: 4px; border-radius: var(--ds-radius-pill); background: var(--ds-palette-slate-200); overflow: hidden; margin-bottom: 12px; }
.gtb__progress-fill { height: 100%; background: var(--ds-color-background-brand-bold); transition: width 0.2s ease; }
.gtb__seq-eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ds-color-text-brand); }
.gtb__seq-back { padding: 8px 0 12px; font-size: 1rem; }
.gtb__seq-chips { margin: 0 0 12px; }
.gtb__seq-hint { margin-bottom: 14px; padding: 10px 14px; border-radius: var(--ds-radius-md); background: var(--ds-color-background-brand-subtle, var(--ds-palette-navy-50)); color: var(--ds-color-text-brand); font-size: 0.875rem; }
.gtb__seq-chips + .gtb__confirm { width: 100%; }

/* List shown — per-team dropdown (design doc) */
.gtb__pick { display: flex; flex-direction: column; gap: 6px; }
.gtb__pick-label { font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.gtb__pick-add { width: 100%; height: 52px; margin-top: 14px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; }
.gtb__pick-add:hover { background: var(--ds-palette-navy-800); }
.gtb__pick-add.is-disabled { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtlest); cursor: not-allowed; }
.gtb__pick-switch { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px; padding: 0; border: 0; background: none; color: var(--ds-color-link); font-family: inherit; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
.gtb__pick-switch:hover { text-decoration: underline; }
</style>
