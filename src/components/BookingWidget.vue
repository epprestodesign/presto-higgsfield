<script setup>
// BookingWidget — interactive tabbed tournament booking search.
// Modes: 'reservations' (team + dates + travelers) | 'group' (team(s) + rooms needed).
// Features: working tabs (toggle via `tabs`), team search popover with live filter,
// add-a-team MODAL with duplicate-name error, custom dual-month date range
// (DateRangeCalendar) + flexible pills, travelers steppers. Flat; DS tokens.
import { ref, reactive, computed } from 'vue'
import DateRangeCalendar from './DateRangeCalendar.vue'

const props = defineProps({
  mode: { type: String, default: 'reservations' },
  tabs: { type: Boolean, default: true },
  // Force the far-left "Booking type" dropdown selector. NOTE: the dropdown is
  // now the DEFAULT for the tabs-less layout (shown whenever `tabs` is false and
  // `modeRadio` is off), so this prop is only needed to force it on explicitly.
  modeDropdown: { type: Boolean, default: false },
  // When true, hide the tabs and offer the flow selector as a radio-button pair
  // above the fields (alternate-layout exploration).
  modeRadio: { type: Boolean, default: false },
  // When false, hide the Registered Team(s) field — the "Core" booking widget
  // (generic hotel search: booking type + dates + travelers).
  showTeams: { type: Boolean, default: true },
  // When false, hide the mode selector (tabs / radio / "Booking type" dropdown)
  // entirely — used where the flow is already fixed (e.g. Browse Hotels).
  showMode: { type: Boolean, default: true },
  // When true, always show the Check-in – Check-out field (default: only in
  // 'reservations' mode). Used on Browse Hotels where dates apply to both flows.
  showDates: { type: Boolean, default: false },
  // Seed the group "Rooms Needed" field (e.g. carried from the landing search).
  initialRooms: { type: Number, default: null },
})
const mode = ref(props.mode)
const modeOptions = [
  { label: 'Book Reservations', value: 'reservations' },
  { label: 'Hold Rooms for Group or Team', value: 'group' },
]
// The tabs-less layout surfaces the flow selector as a "Booking type" dropdown
// by default; `modeDropdown` keeps working as an explicit opt-in, and `modeRadio`
// (or tabs) takes precedence when chosen.
const showModeSelect = computed(() => props.showMode && (props.modeDropdown || (!props.tabs && !props.modeRadio)))

// --- Teams ---
const clubs = [
  { name: 'Arsenal Soccer Club', teams: ['Arsenal U12 Boys Gold', 'Arsenal U12 Girls Gold', 'Arsenal U12 Boys Select', 'Arsenal U12 Girls Select', 'Arsenal U14 Boys DPL', 'Arsenal U14 Boys Gold', 'Arsenal U14 Girls SCSC', 'Arsenal U14 Girls Gold', 'Arsenal U16 Boy Elite'] },
  { name: 'Bulls Soccer Club', teams: ['Bulls U12 Boys Gold', 'Bulls U12 Girls Gold', 'Bulls U12 Boys Select', 'Bulls U12 Girls Select', 'Bulls U14 Boys DPL'] },
]
const myTeams = ['Team 1', 'Team 2']
const groupsForMulti = [{ label: 'My Teams', teams: myTeams }, ...clubs.map((c) => ({ label: 'All of ' + c.name, teams: c.teams }))]
const allNames = [...clubs.flatMap((c) => c.teams), ...clubs.map((c) => c.name)]

const selectedTeam = ref('Arsenal U12 Boys Select')
const checked = reactive({})
;['Team 1', 'Team 2', 'Arsenal U12 Girls Gold', 'Arsenal U12 Boys Select', 'Arsenal U12 Girls Select'].forEach((t) => { checked[t] = true })
const checkedCount = computed(() => Object.values(checked).filter(Boolean).length)
const teamLabel = computed(() => {
  if (mode.value === 'reservations') return selectedTeam.value || 'Select team'
  const n = checkedCount.value
  return n === 0 ? 'Select teams' : n === 1 ? Object.keys(checked).find((k) => checked[k]) : 'Multiple Teams'
})

const teamQuery = ref('')
const match = (t) => t.toLowerCase().includes(teamQuery.value.trim().toLowerCase())
// Bold the matched substring in result labels (case-insensitive).
const highlight = (text) => {
  const q = teamQuery.value.trim()
  if (!q) return text
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${esc})`, 'gi'), '<strong>$1</strong>')
}
const filteredClubs = computed(() => clubs.map((c) => ({ name: c.name, teams: c.teams.filter(match) })).filter((c) => c.teams.length))
const filteredGroups = computed(() => groupsForMulti.map((g) => ({ label: g.label, teams: g.teams.filter(match) })).filter((g) => g.teams.length))
const teamMenuOpen = ref(false)

// --- Add-a-team modal ---
const addDialog = ref(false)
const newTeams = ref([{ name: '' }])
const openAddDialog = () => { teamMenuOpen.value = false; newTeams.value = [{ name: '' }]; addDialog.value = true }
const addRow = () => newTeams.value.push({ name: '' })
const clearTeams = () => { newTeams.value = [{ name: '' }] }
const isDup = (name) => {
  const v = (name || '').trim().toLowerCase()
  if (v.length < 3) return false
  return allNames.some((n) => { const x = n.toLowerCase(); return x.includes(v) || v.includes(x) })
}
const addDisabled = computed(() => newTeams.value.some((t) => !t.name.trim() || isDup(t.name)))
const addLabel = computed(() => (newTeams.value.length > 1 ? `Add ${newTeams.value.length} Teams` : 'Add Team'))

// --- Dates ---
// DES-91: default the range to the current date + 7 days through + 10 days, so
// the field always shows a live, near-future stay (not a stale hardcoded date).
const dstr = (offset) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
const range = ref({ from: dstr(7), to: dstr(10) })
const flex = ref('Exact dates')
const flexOptions = ['Exact dates', '± 1 day', '± 2 days', '± 3 days', '± 7 days']
// Clear the selected date range (mobile dialog footer "Clear").
const clearDates = () => { range.value = { from: null, to: null }; flex.value = 'Exact dates' }
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (s) => { const [, m, d] = s.split('/'); return `${MON[+m - 1]} ${+d}` }
const dateLabel = computed(() => {
  const r = range.value
  if (r && r.from && r.to) return r.from.slice(5, 7) === r.to.slice(5, 7) ? `${fmt(r.from)} – ${+r.to.slice(8, 10)}` : `${fmt(r.from)} – ${fmt(r.to)}`
  return r && r.from ? fmt(r.from) : 'Add dates'
})

// --- Travelers / Rooms ---
const newRoom = () => ({ adults: 1, children: 0 })
const rooms = reactive([newRoom()])
const roomFields = [
  { key: 'adults', label: 'Adults', caption: '', min: 1 },
  { key: 'children', label: 'Children', caption: 'Ages 0 to 17', min: 0 },
]
const stepRoom = (i, k, d, min = 0) => { rooms[i][k] = Math.max(min, rooms[i][k] + d) }
const addRoom = () => rooms.push(newRoom())
const removeRoom = (i) => rooms.splice(i, 1)
// Reset to a single default room (mobile dialog footer "Clear").
const clearTravelers = () => { rooms.splice(0, rooms.length, newRoom()) }
const travelersTotal = computed(() => rooms.reduce((s, r) => s + r.adults + r.children, 0))
const travelersLabel = computed(() => `${travelersTotal.value} traveler${travelersTotal.value !== 1 ? 's' : ''}, ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`)

// Group Block swaps the Travelers popover for a simple "Rooms Needed" number input.
// DES-80: no default — the organizer must enter how many rooms they need.
// Seeded from `initialRooms` when a value carries over from the landing search.
const roomsNeeded = ref(props.initialRooms ?? null)
</script>

<template>
  <div class="bw">
    <div v-if="showMode && tabs && !modeDropdown && !modeRadio" class="bw__tabs">
      <span :class="['bw__tab', { 'bw__tab--active': mode === 'reservations' }]" @click="mode = 'reservations'">Book Reservations</span>
      <span :class="['bw__tab', { 'bw__tab--active': mode === 'group' }]" @click="mode = 'group'">Hold Rooms for Group or Team</span>
    </div>

    <!-- RADIO SELECTOR (alternate-layout exploration) -->
    <div v-if="showMode && modeRadio" class="bw__radios">
      <q-radio v-model="mode" val="reservations" label="Book Reservations" color="primary" />
      <q-radio v-model="mode" val="group" label="Hold Rooms for Group or Team" color="primary" />
    </div>

    <div v-if="showMode && ((tabs && !modeDropdown && !modeRadio) || modeRadio)" class="bw__divider" />

    <div class="bw__fields">
      <!-- MODE DROPDOWN — farthest-left flow selector; default for tabs-less layout -->
      <div v-if="showModeSelect" class="bw__field bw__field--mode col">
        <q-select outlined stack-label class="bw__input" label="Booking Type" emit-value map-options
          :model-value="mode" :options="modeOptions" popup-content-class="bw-menu"
          @update:model-value="mode = $event">
          <template #prepend><q-icon name="tune" /></template>
        </q-select>
      </div>

      <!-- TEAM — DES-91: on the landing widget the booking type starts blank; the
           team field only appears once a booking type is chosen (it's contextual
           to the flow). In fixed-flow contexts `mode` is always set, so it shows. -->
      <div v-if="showTeams && !!mode" class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer"
          :label="mode === 'group' ? 'Registered Team(s)' : 'Registered Team Name'" :model-value="teamLabel">
          <template #prepend><q-icon name="sports_soccer" /></template>
        </q-input>
        <q-menu v-model="teamMenuOpen" class="bw-menu" :offset="[0, 8]">
          <div style="width:360px">
            <div class="row items-center justify-between" style="padding:12px 16px 6px">
              <div class="text-subtitle1" style="font-weight:600">Search Teams</div>
              <q-btn flat dense round icon="close" size="sm" v-close-popup />
            </div>
            <div style="padding:0 16px 8px">
              <q-input v-model="teamQuery" outlined dense clearable placeholder="Filter by name, age or gender">
                <template #prepend><q-icon name="search" /></template>
              </q-input>
            </div>
            <div style="max-height:300px;overflow:auto;padding:0 16px 8px">
              <template v-if="mode === 'reservations'">
                <template v-for="club in filteredClubs" :key="club.name">
                  <div class="text-caption text-grey-7 q-mt-sm q-mb-xs">{{ club.name }}</div>
                  <div v-for="t in club.teams" :key="t" class="q-py-sm"><q-radio v-model="selectedTeam" :val="t" color="primary" dense><span v-html="highlight(t)" /></q-radio></div>
                </template>
                <div v-if="!filteredClubs.length" class="text-grey-7 q-py-md">No teams match "{{ teamQuery }}"</div>
              </template>
              <template v-else>
                <template v-for="g in filteredGroups" :key="g.label">
                  <q-checkbox :model-value="g.teams.every((t) => checked[t])" @update:model-value="(v) => g.teams.forEach((t) => (checked[t] = v))" :label="g.label" color="primary" dense class="q-mt-sm" style="font-weight:600" />
                  <div style="margin-left:24px">
                    <div v-for="t in g.teams" :key="t" class="q-py-sm"><q-checkbox v-model="checked[t]" color="primary" dense><span v-html="highlight(t)" /></q-checkbox></div>
                  </div>
                </template>
                <div v-if="!filteredGroups.length" class="text-grey-7 q-py-md">No teams match "{{ teamQuery }}"</div>
              </template>
            </div>
            <div class="bw__link" style="padding:12px 16px;border-top:1px solid var(--ds-color-border)" @click="openAddDialog">
              <q-icon name="add_circle" size="20px" /><span>Dont see your team in the list? Add them</span>
            </div>
          </div>
        </q-menu>
      </div>

      <!-- DATES -->
      <!-- DES-88: show Check-in–Check-out in Group Block too (with Rooms Needed).
           DES-91: also show when the booking type is still blank (landing default). -->
      <div v-if="showDates || !mode || mode === 'reservations' || mode === 'group'" class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer" label="Check-in - Check-out" :model-value="dateLabel">
          <template #prepend><q-icon name="calendar_month" /></template>
        </q-input>
        <q-menu class="bw-menu bw-menu--full" :offset="[0, 8]">
          <div class="bw-dialogwrap">
            <div class="bw-dialoghead">
              <span class="bw-dialoghead__title">Select dates</span>
              <button class="bw-dialoghead__close" type="button" v-close-popup aria-label="Close"><q-icon name="close" size="24px" /></button>
            </div>
            <div class="bw-dialogbody">
              <date-range-calendar v-model="range" />
              <q-separator class="q-mt-md" />
              <div class="row q-gutter-sm q-mt-md justify-start">
                <q-btn v-for="f in flexOptions" :key="f" :outline="flex !== f" :color="flex === f ? 'primary' : 'grey-8'" rounded dense no-caps padding="6px 18px" :label="f" @click="flex = f" />
              </div>
            </div>
            <div class="bw-dialogfoot">
              <button type="button" class="bw-dialogclear" @click="clearDates">Clear</button>
              <q-btn unelevated color="primary" label="Done" v-close-popup class="bw-dialogdonebtn" />
            </div>
          </div>
        </q-menu>
      </div>

      <!-- ROOMS NEEDED (Group Block) — replaces the Travelers popover -->
      <div v-if="mode === 'group'" class="bw__field col">
        <q-input outlined stack-label type="number" min="1" class="bw__input"
          label="Rooms Needed" placeholder="Enter number of rooms" v-model.number="roomsNeeded">
          <template #prepend><q-icon name="meeting_room" /></template>
        </q-input>
      </div>

      <!-- TRAVELERS (Book Reservations) -->
      <div v-else class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer" label="Travelers" :model-value="travelersLabel">
          <template #prepend><q-icon name="group" /></template>
        </q-input>
        <q-menu class="bw-menu bw-menu--full" :offset="[0, 8]">
          <div class="bw-dialogwrap" style="width:380px">
            <div class="bw-dialoghead">
              <span class="bw-dialoghead__title">Travelers</span>
              <button class="bw-dialoghead__close" type="button" v-close-popup aria-label="Close"><q-icon name="close" size="24px" /></button>
            </div>
            <div class="bw-dialogbody">
              <div v-for="(room, i) in rooms" :key="i" :class="{ 'q-mt-lg': i > 0 }">
                <div class="text-subtitle1 q-mb-xs" style="font-weight:700">Room {{ i + 1 }}</div>
                <div v-for="f in roomFields" :key="f.key" class="row items-center justify-between q-py-sm">
                  <div>
                    <div class="text-body1" style="font-weight:500">{{ f.label }}</div>
                    <div v-if="f.caption" class="text-caption text-grey-7">{{ f.caption }}</div>
                  </div>
                  <div class="row items-center no-wrap q-gutter-sm">
                    <q-btn round outline icon="remove" class="bw__step" :disable="room[f.key] <= f.min" @click="stepRoom(i, f.key, -1, f.min)" />
                    <div style="width:28px;text-align:center;font-weight:500">{{ room[f.key] }}</div>
                    <q-btn round outline icon="add" class="bw__step" @click="stepRoom(i, f.key, 1, f.min)" />
                  </div>
                </div>
                <div v-if="rooms.length > 1" class="row justify-end q-mt-xs">
                  <span class="bw__link" @click="removeRoom(i)">Remove room</span>
                </div>
              </div>
              <div class="row justify-end q-mt-md">
                <span class="bw__link" @click="addRoom"><q-icon name="add_circle" size="20px" /><span>Add another room</span></span>
              </div>
            </div>
            <div class="bw-dialogfoot">
              <button type="button" class="bw-dialogclear" @click="clearTravelers">Clear</button>
              <q-btn unelevated color="primary" label="Done" v-close-popup class="bw-dialogdonebtn" />
            </div>
          </div>
        </q-menu>
      </div>

      <q-btn unelevated color="primary" label="Search" class="bw__search" />
    </div>

    <div v-if="tabs && showTeams" class="bw__add" @click="openAddDialog">
      <q-icon name="add_circle" size="20px" /><span>Dont see your team in the list? Add them</span>
    </div>

    <!-- ADD A TEAM — full modal -->
    <q-dialog v-if="showTeams" v-model="addDialog">
      <q-card class="bw-dialog" style="width:640px;max-width:92vw;border-radius:var(--ds-radius-lg);padding:20px 24px 24px">
        <q-btn flat dense round icon="arrow_back" class="q-mb-sm" v-close-popup />
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6" style="font-weight:700">Add a team</div>
          <span class="bw__link" style="font-weight:500" @click="clearTeams">Clear</span>
        </div>
        <div v-for="(t, i) in newTeams" :key="i" class="q-mb-md">
          <q-input v-model="t.name" outlined label="New Team Name" :error="isDup(t.name)" hide-bottom-space />
          <div v-if="isDup(t.name)" class="q-mt-sm" style="color:var(--ds-color-text-danger)">
            <div style="font-weight:700">This team name is already registered.</div>
            <div class="text-body2">The name you entered matches a team that's already in our system. Please go back and select the correct team from the previous page, or enter a unique team name if you're booking for a different team.</div>
          </div>
        </div>
        <div class="bw__link q-mb-lg" @click="addRow"><q-icon name="add_circle" size="22px" /><span style="font-weight:600">Add another team</span></div>
        <q-btn unelevated color="primary" :label="addLabel" :disable="addDisabled" v-close-popup class="full-width" style="height:48px;border-radius:var(--ds-radius-button)" />
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.bw { background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 24px 28px 22px; }
.bw__tabs { display: flex; gap: 28px; }
.bw__tab { font-weight: 500; color: var(--ds-color-text-subtle); padding-bottom: 12px; cursor: pointer; }
.bw__tab--active { color: var(--ds-color-text); border-bottom: 2px solid var(--ds-color-text); }
.bw__divider { height: 1px; background: var(--ds-color-border); margin: 0 -28px 20px; }
.bw__radios { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 28px; padding-bottom: 16px; }
.bw__field { position: relative; }
.bw__fields { display: flex; align-items: center; gap: 12px; flex-wrap: nowrap; }
.bw__search { height: 56px; padding: 0 28px; border-radius: var(--ds-radius-button); }
/* Dropdown variant: the mode selector grows equally with the other fields. */
.bw__field--mode { min-width: 0; }
.bw__add { display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 0.875rem; font-weight: 500; cursor: pointer; width: fit-content; color: var(--ds-color-text-brand); }
.bw__link { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; color: var(--ds-color-text-brand); }
.bw__step { width: 40px; min-width: 40px; height: 40px; min-height: 40px; font-size: 13px; border-radius: 50%; }

/* Phones (<600px): the horizontal field row stacks; the search button and each
   field go full-width so nothing overflows a 360–390px screen. */
@media (max-width: 600px) {
  /* Interior on phones (16px); the divider bleeds to the same edge. */
  .bw { padding: 16px; }
  .bw__divider { margin: 0 -16px 20px; }
  .bw__tabs { gap: 18px; overflow-x: auto; }
  .bw__fields { flex-direction: column; align-items: stretch; gap: 10px; }
  .bw__fields > * { width: 100%; }
  .bw__search { width: 100%; height: 52px; }
}
.bw__step :deep(.q-icon) { font-size: 22px; }
</style>

<style>
.bw-menu { box-shadow: var(--ds-shadow-1) !important; border: 1px solid var(--ds-color-border); }
.bw-dialog { box-shadow: var(--ds-shadow-2); }
/* Full-window dialog header/footer — mobile only. */
.bw-dialoghead, .bw-dialogfoot { display: none; }
/* Desktop popover padding (mobile turns this wrapper into a flex column). */
.bw-dialogwrap { padding: 20px 32px 24px; }

/* Phones: the popovers have fixed 360/380px inner widths — cap them to the
   viewport so they don't overflow a 360–390px screen (wide content scrolls). */
@media (max-width: 600px) {
  .bw-menu { max-width: 96vw; }
  .bw-menu > div { width: auto !important; max-width: 92vw; overflow-x: auto; }
  /* Flagged popovers (Travelers, Dates) become a full-window dialog on phones. */
  .bw-menu--full.q-menu {
    position: fixed !important; inset: 0 !important;
    width: 100vw !important; height: 100dvh !important;
    max-width: 100vw !important; max-height: 100dvh !important;
    transform: none !important; border-radius: 0 !important;
  }
  .bw-menu--full > div {
    width: 100% !important; max-width: 100% !important; height: 100%;
    overflow-y: auto; box-sizing: border-box; padding: 20px 16px;
  }
  /* The dates dialog becomes a flex column: fixed header, scrollable body, fixed
     footer — same shell convention as the Filters modal. */
  .bw-menu--full > .bw-dialogwrap { padding: 0 !important; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .bw-menu--full .bw-dialogbody { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
  .bw-menu--full .bw-dialoghead { display: flex; align-items: center; justify-content: space-between; flex: none; margin: 0; padding: 14px 16px; border-bottom: 1px solid var(--ds-color-border); }
  .bw-menu--full .bw-dialoghead__title { font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }
  .bw-menu--full .bw-dialoghead__close { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  /* Fixed footer: Clear (left, text) + Done (right, filled). */
  .bw-menu--full .bw-dialogfoot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex: none;
    padding: 12px 16px; background: var(--ds-color-surface); border-top: 1px solid var(--ds-color-border);
  }
  .bw-menu--full .bw-dialogclear {
    background: none; border: 0; padding: 8px 4px; font-family: inherit; font-size: 1rem;
    font-weight: 700; color: var(--ds-color-text); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
  }
  .bw-menu--full .bw-dialogdonebtn { height: 48px; padding: 0 28px; border-radius: var(--ds-radius-button); }
}
/* Quasar dashes the outline of readonly outlined fields; our triggers are
   readonly by design — keep the border solid. */
.bw__input.q-field--outlined .q-field__control:before { border-style: solid; }
</style>
