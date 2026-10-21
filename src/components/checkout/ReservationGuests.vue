<script setup>
// ReservationGuests — the reservation Contact Info step's per-room guest forms.
// Aware of the booking widget's selection: it renders one "Room N — Guest
// Information" block per room (from the `rooms` prop), and pre-seeds the
// Additional Guests for each room from its occupancy (adults + children − 1
// primary), still add/removable. Team Name and Custom Fields are event-
// configurable via props. Emits `update:modelValue` (array, one entry per room)
// and `update:valid`. Required per room: First, Last, Mobile; Team Name when
// enabled; any custom field marked required.
import { reactive, computed, watch } from 'vue'
import PhoneField from './PhoneField.vue'

const props = defineProps({
  // Booking-widget selection: one entry per room (a single reservation).
  rooms: { type: Array, default: () => [{ adults: 1, children: 0 }] },
  // Multiple reservations: [{ name, rooms: [{ adults, children }] }]. When set,
  // rooms are grouped under their reservation/hotel and takes precedence over `rooms`.
  reservations: { type: Array, default: null },
  modelValue: { type: Array, default: () => [] },
  // Event-configurable extra fields.
  teamName: { type: Boolean, default: false },
  // [{ key?, label, type: 'select' | 'text', options?: string[], required?, optional? }]
  customFields: { type: Array, default: () => [] },
  showErrors: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:valid'])

const cfKey = (cf, i) => cf.key || `cf${i}`
const additionalCount = (room) => Math.max(0, (room.adults || 1) + (room.children || 0) - 1)
// DES-93: a valid email is required for the reservation; additional emails are optional.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// DES-94: reservation address. United States / Canada collect a full address
// (address + city + state/province + postal code); "Other" collects none.
const COUNTRIES = ['United States', 'Canada', 'Other']
const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
const CA_PROVINCES = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon']
const collectsAddress = (country) => country !== 'Other'
const stateOptions = (country) => (country === 'United States' ? US_STATES : country === 'Canada' ? CA_PROVINCES : [])
const stateLabel = (country) => (country === 'Canada' ? 'Province' : 'State/Province')

// Build per-room state, hydrating from modelValue when present.
const blank = () => ({ firstName: '', lastName: '' })
const makeRoom = (room, i) => {
  const saved = Array.isArray(props.modelValue) ? props.modelValue[i] : null
  const custom = {}
  props.customFields.forEach((cf, ci) => { custom[cfKey(cf, ci)] = saved?.custom?.[cfKey(cf, ci)] ?? '' })
  const seeded = Array.from({ length: additionalCount(room) }, () => blank())
  return reactive({
    firstName: saved?.firstName ?? '',
    lastName: saved?.lastName ?? '',
    mobile: saved?.mobile ?? '',
    email: saved?.email ?? '',
    additionalEmails: saved?.additionalEmails?.length ? saved.additionalEmails.map((e) => reactive({ value: e.value ?? '' })) : [],
    country: saved?.country ?? 'United States',
    address1: saved?.address1 ?? '',
    address2: saved?.address2 ?? '',
    address3: saved?.address3 ?? '',
    city: saved?.city ?? '',
    state: saved?.state ?? '',
    postal: saved?.postal ?? '',
    hotelRewards: saved?.hotelRewards ?? '',
    specialRequests: saved?.specialRequests ?? '',
    teamName: saved?.teamName ?? '',
    custom,
    additionalGuests: saved?.additionalGuests?.length ? saved.additionalGuests.map((g) => reactive({ ...blank(), ...g })) : seeded,
  })
}
// Flatten the selection into per-room descriptors. With `reservations`, rooms
// are grouped under their reservation/hotel; otherwise it's a flat list (single
// reservation). `roomsData` + the model stay flat (global index), so validation
// and emits are unchanged.
const grouped = Array.isArray(props.reservations) && props.reservations.length > 0
const descriptors = grouped
  ? props.reservations.flatMap((res, ri) => (res.rooms || []).map((rm, idx) => ({ occ: rm, resName: res.name, resIndex: ri, roomInRes: idx, firstInRes: idx === 0 })))
  : props.rooms.map((rm, i) => ({ occ: rm, resName: null, resIndex: 0, roomInRes: i, firstInRes: false }))
const roomsData = reactive(descriptors.map((d, i) => makeRoom(d.occ, i)))
const roomLabel = (i) => `Room ${(grouped ? descriptors[i].roomInRes : i) + 1} — Guest Information`

const touched = reactive({})
const touch = (i, f) => { touched[`${i}.${f}`] = true }
const showErr = (i, f) => props.showErrors || touched[`${i}.${f}`]
const reqErr = (i, f, val) => (showErr(i, f) && !val ? 'Required' : '')

const addGuest = (i) => roomsData[i].additionalGuests.push(reactive(blank()))
const removeGuest = (i, gi) => roomsData[i].additionalGuests.splice(gi, 1)

// DES-93: email — required (valid format); additional emails optional (valid if filled).
const emailErr = (i, val) => {
  if (!showErr(i, 'email')) return ''
  if (!val) return 'Required'
  return EMAIL_RE.test(val) ? '' : 'Enter a valid email address'
}
const addEmail = (i) => roomsData[i].additionalEmails.push(reactive({ value: '' }))
const removeEmail = (i, ei) => roomsData[i].additionalEmails.splice(ei, 1)

// Validity: First, Last, Mobile per room; Team Name when enabled; required customs.
const roomValid = (r) => {
  if (!r.firstName || !r.lastName || !r.mobile) return false
  if (!r.email || !EMAIL_RE.test(r.email)) return false
  if (r.additionalEmails.some((e) => e.value && !EMAIL_RE.test(e.value))) return false
  // DES-94: US/Canada require a full address; "Other" requires nothing.
  if (collectsAddress(r.country) && (!r.address1 || !r.city || !r.state || !r.postal)) return false
  if (props.teamName && !r.teamName) return false
  for (let ci = 0; ci < props.customFields.length; ci++) {
    const cf = props.customFields[ci]
    if (cf.required && !r.custom[cfKey(cf, ci)]) return false
  }
  return true
}
const valid = computed(() => roomsData.length > 0 && roomsData.every(roomValid))

watch(roomsData, () => emit('update:modelValue', roomsData.map((r) => ({ ...r, additionalGuests: r.additionalGuests.map((g) => ({ ...g })), additionalEmails: r.additionalEmails.map((e) => ({ ...e })) }))), { deep: true, immediate: true })
watch(valid, (v) => emit('update:valid', v), { immediate: true })
</script>

<template>
  <div class="rg">
    <template v-for="(room, i) in roomsData" :key="i">
      <h3 v-if="grouped && descriptors[i].firstInRes" class="rg__resh">
        Reservation {{ descriptors[i].resIndex + 1 }}<template v-if="descriptors[i].resName"> — {{ descriptors[i].resName }}</template>
      </h3>
      <section class="rg__room">
        <h4 class="rg__h">{{ roomLabel(i) }}</h4>

      <div class="cgf__grid">
        <label class="cgf__field">
          <span>First name <i class="cgf__req">*</i></span>
          <input v-model="room.firstName" placeholder="First name" :class="{ 'is-error': reqErr(i, 'firstName', room.firstName) }" @blur="touch(i, 'firstName')" />
          <small v-if="reqErr(i, 'firstName', room.firstName)" class="cgf__err">Required</small>
        </label>
        <label class="cgf__field">
          <span>Last name <i class="cgf__req">*</i></span>
          <input v-model="room.lastName" placeholder="Last name" :class="{ 'is-error': reqErr(i, 'lastName', room.lastName) }" @blur="touch(i, 'lastName')" />
          <small v-if="reqErr(i, 'lastName', room.lastName)" class="cgf__err">Required</small>
        </label>

        <div class="cgf__field cgf__field--full">
          <span>Mobile number <i class="cgf__req">*</i></span>
          <phone-field v-model="room.mobile" :error="!!reqErr(i, 'mobile', room.mobile)" @blur="touch(i, 'mobile')" />
          <small v-if="reqErr(i, 'mobile', room.mobile)" class="cgf__err">Required</small>
        </div>

        <!-- Email — DES-93: required email + optional additional email addresses. -->
        <label class="cgf__field cgf__field--full">
          <span>Email address <i class="cgf__req">*</i></span>
          <input type="email" inputmode="email" v-model="room.email" placeholder="you@example.com" :class="{ 'is-error': emailErr(i, room.email) }" @blur="touch(i, 'email')" />
          <small v-if="emailErr(i, room.email)" class="cgf__err">{{ emailErr(i, room.email) }}</small>
        </label>
        <div v-for="(e, ei) in room.additionalEmails" :key="'em' + ei" class="cgf__field cgf__field--full">
          <span>Additional email <em class="rg__opt">(optional)</em></span>
          <div class="rg__emailrow">
            <input type="email" inputmode="email" v-model="e.value" placeholder="name@example.com" :class="{ 'is-error': showErrors && e.value && !EMAIL_RE.test(e.value) }" />
            <button type="button" class="rg__remove" aria-label="Remove email" @click="removeEmail(i, ei)"><q-icon name="close" size="18px" /></button>
          </div>
        </div>
        <div class="cgf__field cgf__field--full">
          <button type="button" class="rg__addbtn" @click="addEmail(i)"><q-icon name="add" size="18px" /> Add another email address</button>
        </div>

        <label class="cgf__field cgf__field--full">
          <span>Hotel rewards #</span>
          <input v-model="room.hotelRewards" placeholder="Optional" />
        </label>

        <label class="cgf__field cgf__field--full">
          <span>Special requests <em class="rg__opt">(optional)</em></span>
          <textarea v-model="room.specialRequests" rows="3" placeholder="Early check-in, accessibility needs, bed preferences…" />
        </label>

        <label v-if="teamName" class="cgf__field cgf__field--full">
          <span>Team name <i class="cgf__req">*</i></span>
          <input v-model="room.teamName" placeholder="Team name" :class="{ 'is-error': reqErr(i, 'teamName', room.teamName) }" @blur="touch(i, 'teamName')" />
          <small v-if="reqErr(i, 'teamName', room.teamName)" class="cgf__err">Required</small>
        </label>

        <div v-for="(cf, ci) in customFields" :key="cfKey(cf, ci)" class="cgf__field cgf__field--full">
          <span>{{ cf.label }} <i v-if="cf.required" class="cgf__req">*</i><em v-else-if="cf.optional" class="rg__opt">(optional)</em></span>
          <div v-if="cf.type === 'select'" class="rg__selectwrap">
            <select v-model="room.custom[cfKey(cf, ci)]" :class="{ 'is-error': cf.required && reqErr(i, `cf-${ci}`, room.custom[cfKey(cf, ci)]) }" @blur="touch(i, `cf-${ci}`)">
              <option value="" disabled>Select</option>
              <option v-for="opt in cf.options || []" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <q-icon name="expand_more" size="20px" class="rg__selecticon" />
          </div>
          <input v-else v-model="room.custom[cfKey(cf, ci)]" :placeholder="cf.optional ? 'Optional' : cf.label" :class="{ 'is-error': cf.required && reqErr(i, `cf-${ci}`, room.custom[cfKey(cf, ci)]) }" @blur="touch(i, `cf-${ci}`)" />
          <small v-if="cf.required && reqErr(i, `cf-${ci}`, room.custom[cfKey(cf, ci)])" class="cgf__err">Required</small>
        </div>

        <!-- Address — DES-94: United States / Canada collect a full address;
             "Other" collects none (only the Country selector shows). -->
        <template v-if="collectsAddress(room.country)">
          <label class="cgf__field cgf__field--full">
            <span>Address Line 1 <i class="cgf__req">*</i></span>
            <input v-model="room.address1" placeholder="Address Line 1" :class="{ 'is-error': reqErr(i, 'address1', room.address1) }" @blur="touch(i, 'address1')" />
            <small v-if="reqErr(i, 'address1', room.address1)" class="cgf__err">Required</small>
          </label>
          <label class="cgf__field cgf__field--full">
            <span>Address Line 2 <em class="rg__opt">(optional)</em></span>
            <input v-model="room.address2" placeholder="Address Line 2" />
          </label>
          <label class="cgf__field cgf__field--full">
            <span>Address Line 3 <em class="rg__opt">(optional)</em></span>
            <input v-model="room.address3" placeholder="Address Line 3" />
          </label>
        </template>

        <div class="cgf__field cgf__field--full">
          <span>Country</span>
          <div class="rg__selectwrap">
            <select v-model="room.country" @change="room.state = ''">
              <option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option>
            </select>
            <q-icon name="expand_more" size="20px" class="rg__selecticon" />
          </div>
        </div>

        <div v-if="collectsAddress(room.country)" class="rg__addrrow">
          <label class="cgf__field">
            <span>City <i class="cgf__req">*</i></span>
            <input v-model="room.city" placeholder="City" :class="{ 'is-error': reqErr(i, 'city', room.city) }" @blur="touch(i, 'city')" />
            <small v-if="reqErr(i, 'city', room.city)" class="cgf__err">Required</small>
          </label>
          <label class="cgf__field">
            <span>{{ stateLabel(room.country) }} <i class="cgf__req">*</i></span>
            <div class="rg__selectwrap">
              <select v-model="room.state" :class="{ 'is-error': reqErr(i, 'state', room.state) }" @blur="touch(i, 'state')">
                <option value="" disabled>Select</option>
                <option v-for="s in stateOptions(room.country)" :key="s" :value="s">{{ s }}</option>
              </select>
              <q-icon name="expand_more" size="20px" class="rg__selecticon" />
            </div>
            <small v-if="reqErr(i, 'state', room.state)" class="cgf__err">Required</small>
          </label>
          <label class="cgf__field">
            <span>Postal Code <i class="cgf__req">*</i></span>
            <input v-model="room.postal" placeholder="Postal Code" :class="{ 'is-error': reqErr(i, 'postal', room.postal) }" @blur="touch(i, 'postal')" />
            <small v-if="reqErr(i, 'postal', room.postal)" class="cgf__err">Required</small>
          </label>
        </div>
      </div>

      <!-- Additional guests -->
      <div class="rg__addl">
        <div class="rg__addl-h">Additional Guests</div>
        <div v-for="(g, gi) in room.additionalGuests" :key="gi" class="rg__guest">
          <label class="cgf__field">
            <span>Guest {{ gi + 1 }} first name</span>
            <input v-model="g.firstName" placeholder="First name" />
          </label>
          <label class="cgf__field">
            <span>Guest {{ gi + 1 }} last name</span>
            <input v-model="g.lastName" placeholder="Last name" />
          </label>
          <button type="button" class="rg__remove" aria-label="Remove guest" @click="removeGuest(i, gi)"><q-icon name="close" size="18px" /></button>
        </div>
        <button type="button" class="rg__addbtn" @click="addGuest(i)"><q-icon name="add" size="18px" /> Add Additional Guest</button>
      </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.rg { display: flex; flex-direction: column; gap: 28px; }
.rg__room { display: flex; flex-direction: column; gap: 14px; }
.rg__resh { font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); margin: 4px 0 -8px; }
.rg__h { font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text); margin: 0; }
.rg__opt { color: var(--ds-color-text-subtle); font-style: normal; font-weight: 400; }

/* Reuse the cgf field grid/input styling for consistency with ContactGroupForm. */
.cgf__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cgf__field { display: flex; flex-direction: column; gap: 6px; }
.cgf__field--full { grid-column: 1 / -1; }
.cgf__field span { font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.cgf__req { color: var(--ds-color-text-danger); font-style: normal; }
.cgf__field > input,
.rg__selectwrap select { height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); background: var(--ds-color-surface); width: 100%; }
.cgf__field > textarea { min-height: 84px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 10px 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; resize: vertical; }
.cgf__field > input:focus,
.cgf__field > textarea:focus,
.rg__selectwrap select:focus { border-color: var(--ds-color-border-focused); }
.cgf__field > input::placeholder,
.cgf__field > textarea::placeholder { color: var(--ds-color-text-subtlest); }
.cgf__field > input.is-error,
.rg__selectwrap select.is-error { border-color: var(--ds-color-text-danger); }
.cgf__err { color: var(--ds-color-text-danger); font-size: 0.75rem; font-weight: 500; }

/* Custom select with chevron */
.rg__selectwrap { position: relative; display: flex; align-items: center; }
.rg__selectwrap select { appearance: none; -webkit-appearance: none; padding-right: 40px; cursor: pointer; }
.rg__selecticon { position: absolute; right: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }

/* Address row (DES-94): City / State / Postal, full-width 3-up. */
.rg__addrrow { grid-column: 1 / -1; display: grid; grid-template-columns: 2fr 1.4fr 1fr; gap: 14px; align-items: start; }
@media (max-width: 560px) { .rg__addrrow, .cgf__grid, .rg__guest { grid-template-columns: 1fr; } }

/* Additional email rows (DES-93): input + remove button. */
.rg__emailrow { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; }
.rg__emailrow input { height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; background: var(--ds-color-surface); width: 100%; }
.rg__emailrow input:focus { border-color: var(--ds-color-border-focused); }
.rg__emailrow input::placeholder { color: var(--ds-color-text-subtlest); }
.rg__emailrow input.is-error { border-color: var(--ds-color-text-danger); }

/* Additional guests */
.rg__addl { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
.rg__addl-h { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: var(--ds-color-text-subtle); }
.rg__guest { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; align-items: end; }
.rg__remove { width: 46px; height: 46px; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text-subtle); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.rg__remove:hover { background: var(--ds-color-surface-sunken); color: var(--ds-color-text); }
.rg__addbtn { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; background: none; border: 0; padding: 4px 0; color: var(--ds-color-text); font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.rg__addbtn:hover { text-decoration: underline; }
</style>
