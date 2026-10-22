<script setup>
// StudioEditor — the page customization studio (spec 4E).
//
//   ┌──────────────── StudioToolbar ────────────────┐
//   │ rail │ panel │          DevicePreview          │
//   └──────┴───────┴─────────────────────────────────┘
//
// Every edit goes through project-store actions; DevicePreview streams the
// project into the iframe'd Preview Host, so changes show immediately. Under
// 900px the sidebar becomes a bottom sheet and the toolbar condenses.
// Emits: 'publish', 'back', 'change-concept', 'edit-sponsors'. Export opens the
// asset preview sheet (ExportDialog) → ZIP of banners, ads and brand files.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { useHistory } from './useHistory.js'
import StudioToolbar from './StudioToolbar.vue'
import ExamplesGallery from './ExamplesGallery.vue'
import ExportDialog from './ExportDialog.vue'
import StudioSidebar from './StudioSidebar.vue'
import DevicePreview from './DevicePreview.vue'

const props = defineProps({
  initialPage: { type: String, default: 'landing' },
  initialDevice: { type: String, default: '' }, // '' → desktop, or mobile on narrow screens
  initialTab: { type: String, default: 'brand' },
  initialSheetOpen: { type: Boolean, default: false }, // narrow layout: start with the panel sheet open
  autosave: { type: Boolean, default: true },
  autosaveMs: { type: Number, default: 1500 },
  previewSrc: { type: String, default: '' }, // override the Preview Host URL (future app: /preview)
  // Deep-link view state (flows/deepLink.js): { page, device, panel, dialog, pdevice }.
  // Wins over the initial* props; every change is emitted as update:view.
  view: { type: Object, default: null },
  showCopyLink: { type: Boolean, default: false },
})
const emit = defineEmits(['publish', 'back', 'change-concept', 'edit-sponsors', 'update:view', 'example', 'copy-link'])

const store = useProjectStore()
const history = useHistory(store)

// ── Responsive shell ─────────────────────────────────────────────────────
const narrowQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 899px)') : null
const narrow = ref(!!narrowQuery?.matches)
const onNarrow = (e) => (narrow.value = e.matches)
onMounted(() => narrowQuery?.addEventListener('change', onNarrow))
onBeforeUnmount(() => narrowQuery?.removeEventListener('change', onNarrow))

const page = ref(props.view?.page || props.initialPage)
const device = ref(props.view?.device || props.initialDevice || (narrow.value ? 'mobile' : 'desktop'))
const tab = ref(props.view?.panel || props.initialTab)
// A deep link naming a panel opens the bottom sheet on phones.
const sheetOpen = ref(props.initialSheetOpen || (!!props.view?.panel && narrow.value))

// ── Industry examples (data/verticals) ───────────────────────────────────
const examplesOpen = ref(false)
const exampleKey = ref('')
function loadExample(key) {
  store.loadSample(key)
  exampleKey.value = key
  page.value = 'landing'
  emit('example', key)
}

const pages = computed(() => ['landing', 'browse', 'details', 'checkout', 'confirmation'].filter((id) => store.pages[id]?.enabled))
watch(pages, (list) => { if (!list.includes(page.value)) page.value = 'landing' })

function focusPage(p) {
  if (store.pages[p]?.enabled) page.value = p
  if (narrow.value) sheetOpen.value = false
}

// ── Asset export (preview sheet → ZIP) ───────────────────────────────────
const exportOpen = ref(false)

// ── Save / autosave ──────────────────────────────────────────────────────
const dirty = computed(() => !store.lastSavedAt || store.project.updatedAt > store.lastSavedAt)
let saveTimer
async function save() {
  clearTimeout(saveTimer)
  await store.saveDraft()
}
watch(
  () => store.project.updatedAt,
  () => {
    if (!props.autosave) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, props.autosaveMs)
  },
)
onBeforeUnmount(() => clearTimeout(saveTimer))

// ── Keyboard shortcuts ───────────────────────────────────────────────────
const isEditable = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
function onKey(e) {
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return
  const k = e.key.toLowerCase()
  if (k === 's') { e.preventDefault(); save(); return }
  // Inside a text field, leave undo/redo to the browser's native field history.
  if (isEditable(e.target)) return
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); history.undo() }
  else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); history.redo() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// ── Full-screen preview ──────────────────────────────────────────────────
const previewOpen = ref(false)
const previewDevice = ref('desktop')
function openPreview() {
  previewDevice.value = device.value === 'mobile' ? 'mobile' : 'desktop'
  previewOpen.value = true
}
// Looking at a full-screen preview counts toward the publishing checklist.
watch([previewOpen, previewDevice], ([open, d]) => {
  if (open && (d === 'desktop' || d === 'mobile')) store.markReviewed(d)
})

const rename = (name) => store.updateEvent({ name })

// ── Deep link (view ⇄ URL) ───────────────────────────────────────────────
if (props.view?.dialog === 'examples') examplesOpen.value = true
if (props.view?.dialog === 'export') exportOpen.value = true
if (props.view?.dialog === 'preview') {
  previewDevice.value = props.view.pdevice || (device.value === 'mobile' ? 'mobile' : 'desktop')
  previewOpen.value = true
}
const dialog = computed(() => (previewOpen.value ? 'preview' : exportOpen.value ? 'export' : examplesOpen.value ? 'examples' : ''))
const currentView = computed(() => ({
  page: page.value,
  device: device.value,
  panel: tab.value,
  dialog: dialog.value,
  pdevice: previewOpen.value ? previewDevice.value : '',
}))
watch(currentView, (v) => emit('update:view', v), { immediate: true })
// Back/forward between links: apply the incoming view.
watch(() => props.view, (v) => {
  if (!v) return
  if (v.page && v.page !== page.value) page.value = v.page
  if (v.device && v.device !== device.value) device.value = v.device
  if (v.panel && v.panel !== tab.value) tab.value = v.panel
  examplesOpen.value = v.dialog === 'examples'
  exportOpen.value = v.dialog === 'export'
  previewOpen.value = v.dialog === 'preview'
  if (v.dialog === 'preview' && v.pdevice) previewDevice.value = v.pdevice
}, { deep: true })
</script>

<template>
  <div class="sed" :class="{ 'sed--narrow': narrow }">
    <StudioToolbar
      class="sed__toolbar"
      :name="store.event.name"
      :pages="pages"
      v-model:page="page"
      v-model:device="device"
      :status="store.status"
      :can-undo="history.canUndo.value"
      :can-redo="history.canRedo.value"
      :saving="store.saving"
      :last-saved-at="store.lastSavedAt"
      :dirty="dirty"
      :compact="narrow"
      @back="emit('back')"
      @rename="rename"
      @undo="history.undo()"
      @redo="history.redo()"
      @save="save"
      @preview="openPreview"
      @publish="emit('publish')"
      @examples="examplesOpen = true"
      @export="exportOpen = true"
      :can-share="showCopyLink"
      @copy-link="emit('copy-link')"
    />

    <div class="sed__body">
      <StudioSidebar
        v-model:tab="tab"
        v-model:open="sheetOpen"
        :layout="narrow ? 'sheet' : 'rail'"
        class="sed__sidebar"
        @change-concept="emit('change-concept')"
        @edit-sponsors="emit('edit-sponsors')"
        @focus-page="focusPage"
      />
      <main class="sed__canvas" aria-label="Live preview">
        <DevicePreview v-model:page="page" :device="device" :src="previewSrc" :padding="narrow ? 14 : 28" backdrop="home" />
      </main>
    </div>

    <ExamplesGallery v-model="examplesOpen" :current-key="exampleKey" @select="loadExample" />
    <ExportDialog v-model="exportOpen" :project="store.project" />

    <q-dialog v-model="previewOpen" maximized transition-show="fade" transition-hide="fade">
      <div class="sed__fullpreview">
        <header class="sed__fp-bar">
          <span class="sed__fp-title">Preview · {{ store.event.name }}</span>
          <div class="sed__fp-seg" role="group" aria-label="Preview device">
            <button
              v-for="d in [{ id: 'desktop', icon: 'desktop_windows', label: 'Desktop' }, { id: 'mobile', icon: 'smartphone', label: 'Mobile' }]"
              :key="d.id"
              type="button"
              class="sed__fp-btn bs-focusable"
              :class="{ 'is-active': previewDevice === d.id }"
              :aria-pressed="previewDevice === d.id"
              @click="previewDevice = d.id"
            ><q-icon :name="d.icon" size="18px" /> {{ d.label }}</button>
          </div>
          <q-btn flat round icon="close" aria-label="Close preview" class="sed__fp-close" v-close-popup />
        </header>
        <div class="sed__fp-body">
          <DevicePreview v-model:page="page" :device="previewDevice" :src="previewSrc" :padding="20" backdrop="home" />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<style scoped>
.sed { position: relative; height: 100vh; height: 100dvh; min-height: 560px; display: grid; grid-template-rows: auto minmax(0, 1fr); background: var(--bs-canvas); color: var(--bs-ink); font-family: var(--bs-font); overflow: hidden; }
.sed__toolbar { position: relative; z-index: 5; }
.sed__body { display: grid; grid-template-columns: 364px minmax(0, 1fr); min-height: 0; }
.sed__sidebar { min-height: 0; }
.sed__canvas {
  position: relative;
  min-width: 0;
  min-height: 0;
  background-color: var(--bs-canvas);
  background-image: radial-gradient(rgb(3 10 38 / 0.07) 1px, transparent 1.2px);
  background-size: 20px 20px;
}
.sed--narrow .sed__body { grid-template-columns: 1fr; padding-bottom: 68px; }

.sed__fullpreview { width: 100%; height: 100%; display: grid; grid-template-rows: 56px minmax(0, 1fr); background: #1B1F2A; }
.sed__fp-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 12px; padding: 0 12px 0 20px; color: #fff; font-family: var(--bs-font); }
.sed__fp-title { font: 700 0.9375rem/1.2 var(--bs-font); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sed__fp-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: var(--bs-radius-md); background: rgb(255 255 255 / 0.08); }
.sed__fp-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 0; border-radius: 7px; background: transparent; color: rgb(255 255 255 / 0.75); font: 700 0.8125rem/1 var(--bs-font); cursor: pointer; }
.sed__fp-btn.is-active { background: #fff; color: var(--bs-ink); }
.sed__fp-close { justify-self: end; color: #fff; }
.sed__fp-body { min-height: 0; }
</style>
