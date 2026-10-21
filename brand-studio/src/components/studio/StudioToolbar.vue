<script setup>
// StudioToolbar — the editor's top bar. Presentational: the editor owns state
// and passes it in; every action is an emitted event.
//   left   · back · inline-editable page name · status chip
//   centre · page switcher · device toggle
//   right  · undo / redo · save state · Preview · Publish
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { PAGE_META } from '../../models/pageConfig.js'
import { PROJECT_STATUS } from '../../models/project.js'

const props = defineProps({
  name: { type: String, default: '' },
  pages: { type: Array, default: () => ['landing', 'browse', 'details'] },
  page: { type: String, default: 'landing' },
  device: { type: String, default: 'desktop' },
  status: { type: String, default: 'draft' },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  lastSavedAt: { type: String, default: null },
  dirty: { type: Boolean, default: false },
  // Narrow screens: page + device move to a second row; labels collapse to icons.
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['back', 'rename', 'update:page', 'update:device', 'undo', 'redo', 'save', 'preview', 'publish'])

const DEVICES = [
  { id: 'desktop', icon: 'desktop_windows', label: 'Desktop', width: 1280 },
  { id: 'tablet', icon: 'tablet_mac', label: 'Tablet', width: 768 },
  { id: 'mobile', icon: 'smartphone', label: 'Mobile', width: 390 },
]

const SHORT = { landing: 'Landing', browse: 'Browse hotels', details: 'Hotel details', checkout: 'Checkout', confirmation: 'Confirmation' }
const pageOptions = computed(() => props.pages.map((id) => ({ id, label: SHORT[id] || PAGE_META[id]?.label || id, icon: PAGE_META[id]?.icon })))
const statusMeta = computed(() => PROJECT_STATUS[props.status] || PROJECT_STATUS.draft)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const mod = isMac ? '⌘' : 'Ctrl+'

// ── Inline name editing ──────────────────────────────────────────────────
const editing = ref(false)
const draft = ref('')
const nameInput = ref(null)
async function startRename() {
  draft.value = props.name
  editing.value = true
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}
function commitRename() {
  if (!editing.value) return
  editing.value = false
  const next = draft.value.trim()
  if (next && next !== props.name) emit('rename', next)
}
function cancelRename() { editing.value = false }

// ── "Saved · 2m ago" ─────────────────────────────────────────────────────
const now = ref(Date.now())
let tick
onMounted(() => { tick = setInterval(() => (now.value = Date.now()), 15000) })
onBeforeUnmount(() => clearInterval(tick))
const savedLabel = computed(() => {
  if (props.saving) return 'Saving…'
  if (props.dirty || !props.lastSavedAt) return props.lastSavedAt ? 'Unsaved changes' : 'Not saved yet'
  const s = Math.max(0, Math.round((now.value - new Date(props.lastSavedAt).getTime()) / 1000))
  if (s < 45) return 'Saved · just now'
  if (s < 3600) return `Saved · ${Math.round(s / 60)}m ago`
  return `Saved · ${Math.round(s / 3600)}h ago`
})
const savedIcon = computed(() => (props.saving ? 'sync' : props.dirty || !props.lastSavedAt ? 'cloud_off' : 'cloud_done'))
</script>

<template>
  <header class="stb" :class="{ 'stb--compact': compact }">
    <div class="stb__row" role="toolbar" aria-label="Editor toolbar">
      <!-- LEFT -->
      <div class="stb__group stb__group--left">
        <q-btn flat round dense icon="arrow_back" class="stb__icon" aria-label="Back" @click="emit('back')">
          <q-tooltip>Back</q-tooltip>
        </q-btn>
        <span class="stb__divider" aria-hidden="true" />
        <div class="stb__name">
          <input
            v-if="editing"
            ref="nameInput"
            v-model="draft"
            class="stb__name-input"
            aria-label="Booking page name"
            maxlength="90"
            @keydown.enter.prevent="commitRename"
            @keydown.esc.prevent="cancelRename"
            @blur="commitRename"
          />
          <button v-else type="button" class="stb__name-btn bs-focusable" :title="name" aria-label="Rename booking page" @click="startRename">
            <span class="stb__name-text">{{ name || 'Untitled booking page' }}</span>
            <q-icon name="edit" size="14px" class="stb__name-edit" />
          </button>
          <span v-if="!compact" class="stb__status" :class="`stb__status--${status}`">
            <q-icon :name="statusMeta.icon" size="14px" /> {{ statusMeta.label }}
          </span>
        </div>
      </div>

      <!-- CENTRE (desktop) -->
      <div v-if="!compact" class="stb__group stb__group--centre">
        <div class="stb__seg" role="group" aria-label="Page">
          <button
            v-for="p in pageOptions"
            :key="p.id"
            type="button"
            class="stb__seg-btn bs-focusable"
            :class="{ 'is-active': page === p.id }"
            :aria-pressed="page === p.id"
            @click="emit('update:page', p.id)"
          >{{ p.label }}</button>
        </div>
        <div class="stb__seg stb__seg--icons" role="group" aria-label="Device">
          <button
            v-for="d in DEVICES"
            :key="d.id"
            type="button"
            class="stb__seg-btn bs-focusable"
            :class="{ 'is-active': device === d.id }"
            :aria-pressed="device === d.id"
            :aria-label="`${d.label} preview (${d.width}px)`"
            @click="emit('update:device', d.id)"
          >
            <q-icon :name="d.icon" size="18px" />
            <q-tooltip>{{ d.label }} · {{ d.width }}px</q-tooltip>
          </button>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="stb__group stb__group--right">
        <template v-if="!compact">
          <q-btn flat round dense icon="undo" class="stb__icon" aria-label="Undo" :disable="!canUndo" @click="emit('undo')">
            <q-tooltip>Undo · {{ mod }}Z</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="redo" class="stb__icon" aria-label="Redo" :disable="!canRedo" @click="emit('redo')">
            <q-tooltip>Redo · {{ isMac ? '⇧⌘Z' : 'Ctrl+Shift+Z' }}</q-tooltip>
          </q-btn>
          <span class="stb__divider" aria-hidden="true" />
        </template>
        <button type="button" class="stb__save bs-focusable" :aria-label="`Save draft. ${savedLabel}`" @click="emit('save')">
          <q-icon :name="savedIcon" size="18px" :class="{ 'stb__spin': saving }" />
          <span v-if="!compact" class="stb__save-label" aria-live="polite">{{ savedLabel }}</span>
          <q-tooltip>Save draft · {{ mod }}S</q-tooltip>
        </button>
        <q-btn
          unelevated no-caps
          class="bs-btn bs-btn--ghost stb__btn"
          :icon="compact ? 'visibility' : undefined"
          :label="compact ? undefined : 'Preview'"
          :aria-label="compact ? 'Preview' : undefined"
          @click="emit('preview')"
        />
        <q-btn unelevated no-caps no-wrap class="bs-btn bs-btn--primary stb__btn" icon-right="arrow_forward" label="Publish" @click="emit('publish')" />
      </div>
    </div>

    <!-- Second row on narrow screens -->
    <div v-if="compact" class="stb__row stb__row--sub" role="toolbar" aria-label="Preview controls">
      <q-select
        :model-value="page"
        :options="pageOptions"
        option-value="id"
        option-label="label"
        emit-value
        map-options
        dense
        outlined
        options-dense
        class="stb__page-select"
        aria-label="Page"
        @update:model-value="emit('update:page', $event)"
      />
      <div class="stb__seg stb__seg--icons" role="group" aria-label="Device">
        <button
          v-for="d in DEVICES"
          :key="d.id"
          type="button"
          class="stb__seg-btn bs-focusable"
          :class="{ 'is-active': device === d.id }"
          :aria-pressed="device === d.id"
          :aria-label="`${d.label} preview`"
          @click="emit('update:device', d.id)"
        ><q-icon :name="d.icon" size="18px" /></button>
      </div>
      <q-btn flat round dense icon="undo" aria-label="Undo" :disable="!canUndo" @click="emit('undo')" />
      <q-btn flat round dense icon="redo" aria-label="Redo" :disable="!canRedo" @click="emit('redo')" />
    </div>
  </header>
</template>

<style scoped>
.stb { background: var(--bs-surface); border-bottom: 1px solid var(--bs-line); font-family: var(--bs-font); color: var(--bs-ink); }
.stb__row { height: var(--bs-toolbar-h); display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 16px; padding: 0 12px; }
.stb--compact .stb__row { grid-template-columns: minmax(0, 1fr) auto; height: 56px; gap: 8px; }
.stb__row--sub { display: flex; height: 52px; border-top: 1px solid var(--bs-line); gap: 8px; }
.stb__group { display: flex; align-items: center; gap: 6px; min-width: 0; }
.stb__group--centre { gap: 12px; }
.stb__group--right { justify-content: flex-end; }
.stb__divider { width: 1px; height: 24px; background: var(--bs-line); margin: 0 4px; flex: none; }
.stb__icon { color: var(--bs-ink-soft); }
.stb__icon:hover { color: var(--bs-ink); }

/* name */
.stb__name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.stb__name-btn { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 340px; padding: 6px 8px; border: 1px solid transparent; border-radius: var(--bs-radius-sm); background: none; font: 700 0.9375rem/1.2 var(--bs-font); color: var(--bs-ink); cursor: text; }
.stb__name-btn:hover { border-color: var(--bs-line); background: var(--bs-surface-2); }
.stb__name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stb__name-edit { color: var(--bs-ink-faint); flex: none; }
.stb__name-input { width: 320px; max-width: 100%; padding: 6px 8px; border: 1px solid var(--bs-accent); border-radius: var(--bs-radius-sm); font: 700 0.9375rem/1.2 var(--bs-font); color: var(--bs-ink); box-shadow: var(--bs-ring); outline: none; }
.stb__status { flex: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font: 700 0.75rem/1.3 var(--bs-font); white-space: nowrap; background: var(--bs-surface-2); color: var(--bs-ink-soft); border: 1px solid var(--bs-line); }
.stb__status--ready { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
.stb__status--published { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }

/* segmented controls */
.stb__seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: var(--bs-radius-md); background: var(--bs-surface-2); border: 1px solid var(--bs-line); }
.stb__seg-btn { height: 32px; padding: 0 12px; border: 0; border-radius: 7px; background: transparent; font: 700 0.8125rem/1 var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; transition: background var(--ds-duration-fast) var(--ds-ease-standard), color var(--ds-duration-fast); }
.stb__seg--icons .stb__seg-btn { width: 36px; padding: 0; }
.stb__seg-btn:hover { color: var(--bs-ink); }
.stb__seg-btn.is-active { background: var(--bs-surface); color: var(--bs-brand); box-shadow: var(--bs-shadow-1), 0 0 0 1px var(--bs-line); }

/* save */
.stb__save { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; border: 0; border-radius: var(--bs-radius-sm); background: none; color: var(--bs-ink-soft); font: 400 0.8125rem/1 var(--bs-font); cursor: pointer; white-space: nowrap; }
.stb__save:hover { background: var(--bs-surface-2); color: var(--bs-ink); }
.stb__spin { animation: stb-spin 1s linear infinite; }
@keyframes stb-spin { to { transform: rotate(360deg); } }
.q-btn.stb__btn { min-height: 38px; padding: 0 14px; font-size: 0.875rem; }
.stb--compact .q-btn.stb__btn { padding: 0 10px; }
.stb__page-select { flex: 1; min-width: 0; }
.stb__page-select :deep(.q-field__control) { min-height: 36px; border-radius: var(--bs-radius-sm); }
@media (prefers-reduced-motion: reduce) { .stb__spin { animation: none; } }
</style>
