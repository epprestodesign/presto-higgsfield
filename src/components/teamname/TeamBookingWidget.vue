<script setup>
// TeamBookingWidget — FORK of BookingWidget.vue for the "Team Name Qualifiers"
// workstream. Identical behaviour to the shipped widget, but lives in the
// teamname/ area so team-name UX (the Search Teams popover, add-a-team flow,
// qualifiers) can be iterated on WITHOUT touching the rigid shared component.
// Global (unscoped) menu/dialog classes are prefixed `tbw-` so this fork's
// popover/modal styling is fully independent of the live widget.
import { ref, reactive, computed } from 'vue'
import DateRangeCalendar from '../DateRangeCalendar.vue'

const props = defineProps({
  mode: { type: String, default: 'reservations' },
  tabs: { type: Boolean, default: true },
  modeDropdown: { type: Boolean, default: false },
  modeRadio: { type: Boolean, default: false },
  showTeams: { type: Boolean, default: true },
  showMode: { type: Boolean, default: true },
  showDates: { type: Boolean, default: false },
  initialRooms: { type: Number, default: null },
})
const mode = ref(props.mode)
const modeOptions = [
  { label: 'Book Reservations', value: 'reservations' },
  { label: 'Hold Rooms for Group or Team', value: 'group' },
]
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
const dstr = (offset) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
const range = ref({ from: dstr(7), to: dstr(10) })
const flex = ref('Exact dates')
const flexOptions = ['Exact dates', '± 1 day', '± 2 days', '± 3 days', '± 7 days']
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
const clearTravelers = () => { rooms.splice(0, rooms.length, newRoom()) }
const travelersTotal = computed(() => rooms.reduce((s, r) => s + r.adults + r.children, 0))
const travelersLabel = computed(() => `${travelersTotal.value} traveler${travelersTotal.value !== 1 ? 's' : ''}, ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`)

const roomsNeeded = ref(props.initialRooms ?? null)
</script>

<template>
  <div class="bw">
    <div v-if="showMode && tabs && !modeDropdown && !modeRadio" class="bw__tabs">
      <span :class="['bw__tab', { 'bw__tab--active': mode === 'reservations' }]" @click="mode = 'reservations'">Book Reservations</span>
      <span :class="['bw__tab', { 'bw__tab--active': mode === 'group' }]" @click="mode = 'group'">Hold Rooms for Group or Team</span>
    </div>

    <div v-if="showMode && modeRadio" class="bw__radios">
      <q-radio v-model="mode" val="reservations" label="Book Reservations" color="primary" />
      <q-radio v-model="mode" val="group" label="Hold Rooms for Group or Team" color="primary" />
    </div>

    <div v-if="showMode && ((tabs && !modeDropdown && !modeRadio) || modeRadio)" class="bw__divider" />

    <div class="bw__fields">
      <div v-if="showModeSelect" class="bw__field bw__field--mode col">
        <q-select outlined stack-label class="bw__input" label="Booking Type" emit-value map-options
          :model-value="mode" :options="modeOptions" popup-content-class="tbw-menu"
          @update:model-value="mode = $event">
          <template #prepend><q-icon name="tune" /></template>
        </q-select>
      </div>

      <!-- TEAM — the Team Name Qualifiers focus. Single-select (reservations) or
           multi-select (group), filterable by name / age / gender. -->
      <div v-if="showTeams && !!mode" class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer"
          :label="mode === 'group' ? 'Registered Team(s)' : 'Registered Team Name'" :model-value="teamLabel">
          <template #prepend><q-icon name="sports_soccer" /></template>
        </q-input>
        <q-menu v-model="teamMenuOpen" class="tbw-menu" :offset="[0, 8]">
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

      <div v-if="showDates || !mode || mode === 'reservations' || mode === 'group'" class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer" label="Check-in - Check-out" :model-value="dateLabel">
          <template #prepend><q-icon name="calendar_month" /></template>
        </q-input>
        <q-menu class="tbw-menu tbw-menu--full" :offset="[0, 8]">
          <div class="tbw-dialogwrap">
            <div class="tbw-dialoghead">
              <span class="tbw-dialoghead__title">Select dates</span>
              <button class="tbw-dialoghead__close" type="button" v-close-popup aria-label="Close"><q-icon name="close" size="24px" /></button>
            </div>
            <div class="tbw-dialogbody">
              <date-range-calendar v-model="range" />
              <q-separator class="q-mt-md" />
              <div class="row q-gutter-sm q-mt-md justify-start">
                <q-btn v-for="f in flexOptions" :key="f" :outline="flex !== f" :color="flex === f ? 'primary' : 'grey-8'" rounded dense no-caps padding="6px 18px" :label="f" @click="flex = f" />
              </div>
            </div>
            <div class="tbw-dialogfoot">
              <button type="button" class="tbw-dialogclear" @click="clearDates">Clear</button>
              <q-btn unelevated color="primary" label="Done" v-close-popup class="tbw-dialogdonebtn" />
            </div>
          </div>
        </q-menu>
      </div>

      <div v-if="mode === 'group'" class="bw__field col">
        <q-input outlined stack-label type="number" min="1" class="bw__input"
          label="Rooms Needed" placeholder="Enter number of rooms" v-model.number="roomsNeeded">
          <template #prepend><q-icon name="meeting_room" /></template>
        </q-input>
      </div>

      <div v-else class="bw__field col">
        <q-input outlined stack-label readonly class="bw__input cursor-pointer" label="Travelers" :model-value="travelersLabel">
          <template #prepend><q-icon name="group" /></template>
        </q-input>
        <q-menu class="tbw-menu tbw-menu--full" :offset="[0, 8]">
          <div class="tbw-dialogwrap" style="width:380px">
            <div class="tbw-dialoghead">
              <span class="tbw-dialoghead__title">Travelers</span>
              <button class="tbw-dialoghead__close" type="button" v-close-popup aria-label="Close"><q-icon name="close" size="24px" /></button>
            </div>
            <div class="tbw-dialogbody">
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
            <div class="tbw-dialogfoot">
              <button type="button" class="tbw-dialogclear" @click="clearTravelers">Clear</button>
              <q-btn unelevated color="primary" label="Done" v-close-popup class="tbw-dialogdonebtn" />
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
      <q-card class="tbw-dialog" style="width:640px;max-width:92vw;border-radius:var(--ds-radius-lg);padding:20px 24px 24px">
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
.bw__field--mode { min-width: 0; }
.bw__add { display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 0.875rem; font-weight: 500; cursor: pointer; width: fit-content; color: var(--ds-color-text-brand); }
.bw__link { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; color: var(--ds-color-text-brand); }
.bw__step { width: 40px; min-width: 40px; height: 40px; min-height: 40px; font-size: 13px; border-radius: 50%; }

@media (max-width: 600px) {
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
.tbw-menu { box-shadow: var(--ds-shadow-1) !important; border: 1px solid var(--ds-color-border); }
.tbw-dialog { box-shadow: var(--ds-shadow-2); }
.tbw-dialoghead, .tbw-dialogfoot { display: none; }
.tbw-dialogwrap { padding: 20px 32px 24px; }

@media (max-width: 600px) {
  .tbw-menu { max-width: 96vw; }
  .tbw-menu > div { width: auto !important; max-width: 92vw; overflow-x: auto; }
  .tbw-menu--full.q-menu {
    position: fixed !important; inset: 0 !important;
    width: 100vw !important; height: 100dvh !important;
    max-width: 100vw !important; max-height: 100dvh !important;
    transform: none !important; border-radius: 0 !important;
  }
  .tbw-menu--full > div {
    width: 100% !important; max-width: 100% !important; height: 100%;
    overflow-y: auto; box-sizing: border-box; padding: 20px 16px;
  }
  .tbw-menu--full > .tbw-dialogwrap { padding: 0 !important; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .tbw-menu--full .tbw-dialogbody { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
  .tbw-menu--full .tbw-dialoghead { display: flex; align-items: center; justify-content: space-between; flex: none; margin: 0; padding: 14px 16px; border-bottom: 1px solid var(--ds-color-border); }
  .tbw-menu--full .tbw-dialoghead__title { font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }
  .tbw-menu--full .tbw-dialoghead__close { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .tbw-menu--full .tbw-dialogfoot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex: none;
    padding: 12px 16px; background: var(--ds-color-surface); border-top: 1px solid var(--ds-color-border);
  }
  .tbw-menu--full .tbw-dialogclear {
    background: none; border: 0; padding: 8px 4px; font-family: inherit; font-size: 1rem;
    font-weight: 700; color: var(--ds-color-text); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
  }
  .tbw-menu--full .tbw-dialogdonebtn { height: 48px; padding: 0 28px; border-radius: var(--ds-radius-button); }
}
.bw__input.q-field--outlined .q-field__control:before { border-style: solid; }
</style>
