<script setup>
// Experience 2 · Project — Stitch's canvas for one project: the agent on the
// left, artboards on a zoomable canvas (brand kit, banners at both crops, and
// the real Presto landing page mocked up on desktop and phone), a tool rail,
// zoom, and a prompt bar for follow-ups. ▶ Preview / Export open the Presto
// preview modal.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { revise, toPrestoProject, makeBanners, logoReply, BANNERS_FOR_LOGO, wantsBanners } from '../../banner-lab/studioProjects.js'
import { prestoBannerConcept } from '../../providers/ai/conceptFactory.js'
import AgentPanel from './AgentPanel.vue'
import BrandKitBoard from './BrandKitBoard.vue'
import BannerBoard from './BannerBoard.vue'
import PromptComposer from './PromptComposer.vue'
import TutorialDialog from './TutorialDialog.vue'
import AccountMenu from '../auth/AccountMenu.vue'
import LogoCleanupBoard from './LogoCleanupBoard.vue'
import LogoLooksBoard from './LogoLooksBoard.vue'
import { useLogoLab } from './useLogoLab.js'
import { useHScroll } from './useHScroll.js'
import PrestoPreviewModal from './PrestoPreviewModal.vue'
import ProductPreview from '../marketing/ProductPreview.vue'
import DevicePreview from '../studio/DevicePreview.vue'

const props = defineProps({
  project: { type: Object, required: true },
  previewOpen: { type: Boolean, default: false },
  exportOpen: { type: Boolean, default: false },
  previewPage: { type: String, default: 'landing' },
  previewDevice: { type: String, default: 'desktop' },
  tutorialOpen: { type: Boolean, default: false },
  user: { type: Object, default: null },
  generate: { type: Function, default: undefined }, // live Higgsfield generation (see LabStudioApp)
})
const emit = defineEmits(['home', 'sign-out'])

const building = computed(() => props.project.status === 'building')
const isLogoOnly = computed(() => props.project.kind === 'logo')

// ── Artboards (stage coordinates) ─────────────────────────────────────────
// A logo project is only about the logo: clean it up, pick a look that reads
// on dark banners, see the result. Banners and page mockups come after.
const LOGO_BOARDS = [
  { id: 'cleanup', label: '1 · Clean-up', icon: 'auto_fix_high', x: 0, y: 0, w: 760 },
  { id: 'looks', label: '2 · Looks on dark banners', icon: 'contrast', x: 840, y: 0, w: 1500 },
  { id: 'kit', label: '3 · Brand kit', icon: 'palette', x: 2420, y: 0, w: 460 },
]
// The page mockups (landing on top, hotel details under it), from (x, y).
const pages = (x, y) => [
  { id: 'desktop', label: 'Landing page · Desktop', icon: 'desktop_windows', x, y, w: 960 },
  { id: 'phone', label: 'Landing page · Phone', icon: 'smartphone', x: x + 1040, y, w: 330 },
  // Hotel details at real viewport sizes (iframe preview host, so the phone
  // gets Presto's true mobile layout).
  { id: 'details-desktop', label: 'Hotel details · Desktop', icon: 'hotel', x, y: y + 860, w: 960, h: 700, device: 'desktop' },
  { id: 'details-phone', label: 'Hotel details · Phone', icon: 'smartphone', x: x + 1040, y: y + 860, w: 330, h: 700, device: 'mobile' },
]
// Every prompt makes a set of banners; each set is a frame, oldest to newest
// left to right after the pages, so the canvas is the project's history.
const SET_W = 640
const SET_STRIDE = 720
const setBoards = (x, y) => (props.project.sets || []).map((set, i) => ({
  id: `set:${set.id}`, set, label: `Set ${set.n} · ${set.prompt}`, icon: 'wallpaper', x: x + i * SET_STRIDE, y, w: SET_W,
}))
// A logo project that went on to banners keeps its logo work in view: the
// logo frames on top, the pages and banner sets underneath.
const ROW2 = 1300
const hasLogoWork = computed(() => !!props.project.logoLab)
const layout = computed(() => (isLogoOnly.value ? 'logo' : hasLogoWork.value ? 'full' : 'kit'))
const BOARDS = computed(() => {
  if (layout.value === 'logo') return LOGO_BOARDS
  if (layout.value === 'full') return [...LOGO_BOARDS, ...pages(0, ROW2), ...setBoards(1450, ROW2)]
  return [{ id: 'kit', label: 'Brand kit', icon: 'palette', x: 0, y: 0, w: 460 }, ...pages(520, 0), ...setBoards(1960, 0)]
})
const STAGE_H = computed(() => ({ logo: 1250, full: ROW2 + 860 + 780, kit: 1600 })[layout.value])
const STAGE_W = computed(() => Math.max(...BOARDS.value.map((b) => b.x + b.w)))
// Placeholders only on frames still being made: a set that's generating, and
// everything else only on a brand-new project (finished work stays put).
const pending = (b) => {
  if (b.set) return b.set.status === 'building'
  if (['cleanup', 'looks', 'kit'].includes(b.id) && logoLab.state.methods.length) return false
  return building.value && !props.project.banners.length
}
const selectedBoard = ref('')

const presto = computed(() => toPrestoProject(props.project))
const kit = computed(() => presto.value.brandKit)
const banner = computed(() => props.project.banners.find((b) => b.id === props.project.selectedBannerId) || null)
const concept = computed(() => (banner.value ? prestoBannerConcept(kit.value, { id: banner.value.id, src: banner.value.src, kind: banner.value.kind }) : null))

// Logo clean-up (logo projects): methods → looks, scored on a photo banner too.
const logoLab = useLogoLab(() => props.project, () => kit.value.imagery?.find((i) => i.kind === 'photo')?.src || kit.value.imagery?.[0]?.src || '')

// ── Pan & zoom ────────────────────────────────────────────────────────────
const viewport = ref(null)
const zoom = ref(0.4)
const pan = ref({ x: 0, y: 0 })
const tool = ref('select')
// The open part of the canvas, between the agent panel, the tool rail, the
// top bar and the prompt bar.
const SAFE = { left: 330, right: 90, top: 70, bottom: 150 }
const animating = ref(false)
let animTimer = 0
function animate() {
  animating.value = true
  clearTimeout(animTimer)
  animTimer = setTimeout(() => { animating.value = false }, 380)
}
function fit({ smooth = false } = {}) {
  const el = viewport.value
  if (!el) return
  if (smooth) animate()
  const w = el.clientWidth - SAFE.left - SAFE.right
  const h = el.clientHeight - SAFE.top - SAFE.bottom
  zoom.value = Math.max(0.15, Math.min(1, w / STAGE_W.value, h / STAGE_H.value))
  pan.value = { x: SAFE.left + 20, y: SAFE.top }
  focusedBoard.value = ''
}
onMounted(() => nextTick(fit))

// Double-click a frame to bring it into full view (Shift+2 does the same for
// the selected frame; Esc, Shift+1 or double-clicking empty canvas fits all).
const boardEls = {}
const focusedBoard = ref('')
const isMockup = (b) => ['desktop', 'phone', 'details-desktop', 'details-phone'].includes(b.id)
function zoomToBoard(id, { max = 1.5 } = {}) {
  const el = viewport.value
  const b = BOARDS.value.find((x) => x.id === id)
  const node = boardEls[id]
  if (!el || !b || !node) return
  const pad = 24
  const w = el.clientWidth - SAFE.left - SAFE.right - pad * 2
  const h = el.clientHeight - SAFE.top - SAFE.bottom - pad * 2
  // Unscaled sizes (offset* ignore the stage transform). The label keeps a
  // ~13px on-screen size at any zoom, so it's measured in screen px.
  const art = node.querySelector('.ws__art')
  const bw = art.offsetWidth
  const label = 34
  const z = Math.max(0.1, Math.min(max, w / bw, (h - label) / art.offsetHeight))
  const bh = art.offsetHeight + label / z
  animate()
  zoom.value = z
  pan.value = {
    x: SAFE.left + pad + (w - bw * z) / 2 - b.x * z,
    y: SAFE.top + pad + Math.max(0, (h - bh * z) / 2) - b.y * z,
  }
  selectedBoard.value = id
  focusedBoard.value = id
}
function onCanvasDblClick(e) {
  if (e.target === viewport.value || e.target.classList?.contains('ws__stage')) fit({ smooth: true })
}
watch(layout, () => nextTick(() => fit({ smooth: true })))
function zoomBy(f, cx, cy) {
  const el = viewport.value.getBoundingClientRect()
  const px = (cx ?? el.width / 2), py = (cy ?? el.height / 2)
  const z = Math.max(0.1, Math.min(2, zoom.value * f))
  pan.value = { x: px - ((px - pan.value.x) * z) / zoom.value, y: py - ((py - pan.value.y) * z) / zoom.value }
  zoom.value = z
}
function onWheel(e) {
  e.preventDefault()
  if (e.ctrlKey || e.metaKey) {
    const r = viewport.value.getBoundingClientRect()
    zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top)
  } else {
    pan.value = { x: pan.value.x - e.deltaX, y: pan.value.y - e.deltaY }
  }
}
// Holding Space switches to the hand until it's released (as in Figma).
const spaceHeld = ref(false)
const activeTool = computed(() => (spaceHeld.value ? 'hand' : tool.value))
function onBoardDown(e, id) {
  if (activeTool.value === 'hand') return // let it bubble: the canvas pans
  e.stopPropagation()
  selectedBoard.value = id
}
let drag = null
const dragging = ref(false)
function onDown(e) {
  const empty = e.target === viewport.value || e.target.classList?.contains('ws__stage')
  if (empty && activeTool.value !== 'hand') selectedBoard.value = '' // clicking empty canvas clears the selection
  if (activeTool.value !== 'hand' && !empty) return
  drag = { x: e.clientX, y: e.clientY, pan: { ...pan.value } }
  dragging.value = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', () => { drag = null; dragging.value = false; window.removeEventListener('pointermove', onMove) }, { once: true })
}
function onMove(e) { if (drag) pan.value = { x: drag.pan.x + e.clientX - drag.x, y: drag.pan.y + e.clientY - drag.y } }

const TOOLS = [
  { id: 'select', icon: 'near_me', label: 'Select', key: 'V' },
  { id: 'hand', icon: 'pan_tool', label: 'Hand · hold Space', key: 'H' },
]
const typing = (el) => el?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"], .q-dialog, .q-menu')
// ⌘/Ctrl + = / − zoom the canvas (not the browser page), ⌘/Ctrl + 0 fits
// everything, as in Figma. Works while the prompt has focus too; not in dialogs.
function onZoomKey(e) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.target?.closest?.('.q-dialog')) return false
  const k = e.key
  const inOut = k === '=' || k === '+' ? 1.25 : k === '-' || k === '_' ? 1 / 1.25 : 0
  if (inOut) { e.preventDefault(); animate(); zoomBy(inOut); return true }
  if (k === '0') { e.preventDefault(); fit({ smooth: true }); return true }
  return false
}
function onKeyDown(e) {
  if (onZoomKey(e)) return
  if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'Space') {
    e.preventDefault() // no page scroll, no "click" on a focused button
    spaceHeld.value = true
  } else if (!e.repeat && (e.key === 'v' || e.key === 'h')) {
    tool.value = e.key === 'h' ? 'hand' : 'select'
  } else if (e.key === 'Escape' && !preview.value && (focusedBoard.value || selectedBoard.value)) {
    selectedBoard.value = ''
    fit({ smooth: true })
  } else if (e.shiftKey && e.code === 'Digit1') {
    fit({ smooth: true })
  } else if (e.shiftKey && e.code === 'Digit2' && selectedBoard.value) {
    zoomToBoard(selectedBoard.value)
  }
}
function onKeyUp(e) { if (e.code === 'Space') spaceHeld.value = false }
const releaseSpace = () => { spaceHeld.value = false }
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', releaseSpace)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', releaseSpace)
})

// ── Follow-ups ────────────────────────────────────────────────────────────
const text = ref('')
const model = ref('auto')
// A chip fills the prompt with its full description; the user reads or edits
// it, then sends with Enter or the arrow.
// What a prompt edits: the logo when a logo frame is selected, banners when a
// banner set is, otherwise it's worked out from the words.
const LOGO_FRAMES = ['cleanup', 'looks', 'kit']
const editTarget = computed(() => (LOGO_FRAMES.includes(selectedBoard.value) ? 'logo' : selectedBoard.value.startsWith('set:') ? 'banners' : ''))
const LOGO_WORDS = /\b(logo|isolate|cut ?out|extract|remove (the )?(black |dark |light |white )?background|black background|transparent|knock ?out|trace|svg|vector|white version|outline|glow|drop shadow|white box|plate|badge|lettering|wordmark|gradient|add (it |them )?back|remove (more|less))\b/i
const BANNER_WORDS = /\b(banners?|background|backdrop|hero|scene|photo|set)\b/i
function routeFor(t) {
  // Asking for banners always makes banners, whichever frame is selected.
  if (wantsBanners(t)) return isLogoOnly.value ? 'make' : 'banners'
  if (editTarget.value === 'logo') return 'logo'
  if (editTarget.value === 'banners') return isLogoOnly.value ? 'make' : 'banners'
  if (hasLogoWork.value && LOGO_WORDS.test(t)) return 'logo'
  if (isLogoOnly.value) return BANNER_WORDS.test(t) ? 'make' : 'logo'
  return 'banners'
}
const LOGO_SUGGEST = [
  { label: 'Isolate the logo from its background', prompt: 'Isolate the logo from its background so only the lettering and artwork are left, on a transparent background.' },
  { label: 'Use the white version', prompt: 'Use the white version of the logo on dark banners.' },
  { label: 'Use the SVG trace', prompt: 'Use the SVG trace so the logo is sharp at every size.' },
  { label: 'Put it in a white box', prompt: 'Put the logo on a white box so it keeps its colours on dark banners.' },
]
const SUGGEST = computed(() => (editTarget.value === 'logo' && !isLogoOnly.value ? LOGO_SUGGEST : isLogoOnly.value
  ? [
      { label: 'Make banners for this logo', prompt: BANNERS_FOR_LOGO(props.project, lookLabel.value) },
      ...LOGO_SUGGEST,
    ]
  : [
      { label: 'Make it darker and moodier', prompt: 'Make the banner darker and moodier: deepen the shadows, lower the overall exposure and cool the colour slightly, keeping the center especially dark and calm so the white logo and text stand out.' },
      { label: 'Try an abstract version on brand colours', prompt: 'Try an abstract version built on the brand colours: soft gradients and gentle geometric shapes on a deep navy base, brighter toward the edges, with a dark, quiet center and no text.' },
      { label: 'More space in the center for the logo', prompt: 'Give the logo more room: move the main subject out to the left and right edges and leave a wide, dark, low-detail area across the middle of the banner.' },
      { label: 'Show the crowd, softly out of focus', prompt: 'Add a crowd in the background, softly out of focus with shallow depth of field, lit by warm venue lights, so it adds atmosphere without pulling attention from the center.' },
    ]))
const composer = ref(null)
const chips = useHScroll()
function useSuggestion(sg) {
  text.value = sg.prompt
  composer.value?.focus()
}
const lookLabel = computed(() => logoLab.state.looks.find((l) => l.id === props.project.logoLab?.lookId)?.label || '')
async function send(t = text.value) {
  if (!t.trim() || building.value) return
  text.value = ''
  const route = routeFor(t)
  if (route === 'logo') { await logoReply(props.project, t, { pick: logoLab.pick, methods: logoLab.state.methods, tune: logoLab.tune, current: logoLab.current }); return }
  if (route === 'make') { await makeBanners(props.project, { text: t, modelId: model.value }, { generate: props.generate }); return }
  // A new set: zoom to its frame while it builds, and again when it's done.
  const set = await revise(props.project, { text: t, modelId: model.value }, { generate: props.generate, onSet: (s) => nextTick(() => zoomToBoard(`set:${s.id}`, { max: 1 })) })
  nextTick(() => zoomToBoard(`set:${set.id}`))
}
const history = computed(() => [...(props.project.sets || [])].reverse())
const setThumbs = (set) => props.project.banners.filter((b) => b.setId === set.id).slice(-3).reverse()
/** A button on an agent message (e.g. "Make banners with this logo"): fill the prompt to read and send. */
function onAgentAction(action) {
  if (action.id === 'make-banners') {
    text.value = BANNERS_FOR_LOGO(props.project, lookLabel.value)
    composer.value?.focus()
  }
}

const tutorial = ref(props.tutorialOpen)
const preview = ref(props.previewOpen || props.exportOpen)
const previewPanel = ref(props.exportOpen)
const previewPage = ref(props.previewPage)
const previewDevice = ref(props.previewDevice)
/** Open the Presto preview; double-clicking a mockup opens that page on that device. */
function openPreview(withExport, board = null) {
  previewPanel.value = withExport
  if (board) {
    previewPage.value = board.id.startsWith('details') ? 'details' : 'landing'
    previewDevice.value = board.id === 'phone' || board.device === 'mobile' ? 'phone' : 'desktop'
  }
  preview.value = true
}
</script>

<template>
  <div class="ws">
    <header class="ws__top">
      <q-btn flat round dense icon="menu" aria-label="All projects" @click="emit('home')" />
      <strong class="ws__name">{{ project.name }}</strong>
      <span class="ws__kind bs-pill">{{ project.kind === 'logo' ? 'Logo extraction' : project.kind === 'banner' ? 'Banners' : 'Logo + banners' }}</span>
      <span class="ws__spacer" />
      <q-btn v-if="history.length" unelevated no-caps class="bs-btn bs-btn--ghost ws__btn" icon="history" :label="`${history.length} set${history.length === 1 ? '' : 's'}`" aria-label="Banner set history">
        <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
          <div class="ws-hist">
            <p class="ws-hist__title">Banner sets · newest first</p>
            <button
              v-for="set in history" :key="set.id" v-close-popup type="button" class="ws-hist__item"
              :disabled="set.status === 'building'" @click="zoomToBoard(`set:${set.id}`)"
            >
              <span class="ws-hist__thumbs">
                <img v-for="t in setThumbs(set)" :key="t.id" :src="t.src" alt="" />
                <q-spinner v-if="set.status === 'building'" size="16px" />
              </span>
              <span class="ws-hist__text">
                <strong>Set {{ set.n }}<template v-if="setThumbs(set).some((t) => t.id === project.selectedBannerId)"> · on the pages</template></strong>
                <span>{{ set.prompt }}</span>
              </span>
            </button>
          </div>
        </q-menu>
      </q-btn>
      <q-btn unelevated no-caps class="bs-btn bs-btn--ghost ws__btn" icon="ios_share" label="Export" :disable="building" @click="openPreview(true)"><q-tooltip>Every graphic for the chosen concept</q-tooltip></q-btn>
      <q-btn unelevated no-caps class="bs-btn bs-btn--primary ws__btn" icon="play_arrow" label="Preview" :disable="building" @click="openPreview(false)"><q-tooltip>The real Presto pages with this logo and banner</q-tooltip></q-btn>
      <AccountMenu :user="user" @sign-out="emit('sign-out')" />
    </header>

    <div ref="viewport" class="ws__canvas" :class="{ 'is-hand': activeTool === 'hand', 'is-dragging': dragging }" @wheel="onWheel" @pointerdown="onDown" @dblclick="onCanvasDblClick">
      <div class="ws__stage" :class="{ 'is-anim': animating }" :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: `${STAGE_W}px`, height: `${STAGE_H}px` }">
        <section
          v-for="b in BOARDS" :key="b.id" :ref="(el) => (boardEls[b.id] = el)" class="ws__board" :class="{ 'is-on': selectedBoard === b.id }"
          :style="{ left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px` }" @pointerdown="onBoardDown($event, b.id)"
          @dblclick.stop="zoomToBoard(b.id)"
        >
          <p class="ws__label" :class="{ 'ws__label--set': b.set }" :style="{ fontSize: `${Math.max(13, 13 / zoom)}px`, maxWidth: `${b.w}px` }" :title="b.label">
            <q-icon :name="b.icon" /> <span class="ws__label-text">{{ b.label }}</span>
            <button
              v-if="isMockup(b) && !building" type="button" class="ws__open" :title="`Open ${b.label} in the Presto preview`"
              @pointerdown.stop @dblclick.stop @click.stop="openPreview(false, b)"
            ><q-icon name="play_arrow" /><span v-if="zoom >= 0.5"> Preview</span></button>
          </p>
          <div class="ws__art" :class="`ws__art--${b.id}`">
            <!-- Live page mockups (some are iframes) would swallow clicks; the shield lets the canvas select and zoom them -->
            <div v-if="isMockup(b) && !building" class="ws__shield" />
            <div v-if="pending(b)" class="ws__skel" :class="`ws__skel--${b.id}`"><span /><span /><span /></div>
            <LogoCleanupBoard v-else-if="b.id === 'cleanup'" :lab="logoLab.state" :selected="project.logoLab?.methodId || ''" @select="logoLab.chooseMethod" @tune="logoLab.tune" />
            <LogoLooksBoard v-else-if="b.id === 'looks'" :lab="logoLab.state" :selected="project.logoLab?.lookId || ''" @select="logoLab.chooseLook" />
            <BrandKitBoard v-else-if="b.id === 'kit'" :project="project" />
            <BannerBoard v-else-if="b.set" :project="project" :set="b.set" @select="(id) => (project.selectedBannerId = id)" />
            <div v-else-if="b.device" class="ws__device" :style="{ height: `${b.h}px` }">
              <DevicePreview :project="presto" page="details" :device="b.device" :padding="0" />
            </div>
            <ProductPreview v-else-if="b.id === 'desktop'" :key="`d-${project.selectedBannerId}`" :sample="project.key" :presto-project="presto" :brand-kit="kit" :concept="concept" variant="desktop" :design-height="860" />
            <ProductPreview v-else :key="`m-${project.selectedBannerId}`" :sample="project.key" :presto-project="presto" :brand-kit="kit" :concept="concept" variant="mobile" :design-height="700" />
          </div>
        </section>
      </div>
    </div>

    <AgentPanel :project="project" @action="onAgentAction" />

    <nav class="ws__tools" aria-label="Canvas tools">
      <q-btn
        v-for="t in TOOLS" :key="t.id" round flat dense :icon="t.icon" :class="{ 'is-on': activeTool === t.id }" :aria-label="t.label"
        :aria-keyshortcuts="t.key" :aria-pressed="activeTool === t.id" @click="tool = t.id"
      ><q-tooltip anchor="center left" self="center right">{{ t.label }} <kbd class="ws__kbd">{{ t.key }}</kbd></q-tooltip></q-btn>
    </nav>

    <div class="ws__bottom">
      <p v-if="editTarget" class="ws__ctx">
        <q-icon :name="editTarget === 'logo' ? 'auto_fix_high' : 'wallpaper'" size="16px" />
        Editing: <strong>{{ editTarget === 'logo' ? 'Logo' : BOARDS.find((b) => b.id === selectedBoard)?.label.split(' · ')[0] || 'Banners' }}</strong>
        <span v-if="editTarget === 'logo' && logoLab.current()" class="ws__ctx-what">
          <img :src="logoLab.current().url" alt="" /> {{ logoLab.current().label }}
        </span>
        <button type="button" aria-label="Stop editing this frame" @click="selectedBoard = ''"><q-icon name="close" size="14px" /></button>
      </p>
      <div :ref="(el) => (chips.el.value = el)" class="ws__suggest hs" :class="chips.classes.value" @scroll="chips.onScroll" @wheel="chips.onWheel">
        <button v-for="(sg, i) in SUGGEST" :key="sg.label" type="button" class="ws__chip" :class="{ 'is-on': text === sg.prompt }" :disabled="building" @click="useSuggestion(sg)">{{ sg.label }} <span>{{ i + 1 }}</span></button>
      </div>
      <PromptComposer ref="composer" v-model:text="text" v-model:model="model" compact :show-mode="false" :droppable="false" :busy="building" placeholder="What would you like to change or create?" @submit="send()" />
    </div>

    <div class="ws__zoom">
      <q-btn round flat dense size="sm" icon="remove" aria-label="Zoom out (⌘ −)" @click="zoomBy(1 / 1.2)" />
      <button type="button" class="ws__pct" title="Fit all frames (Shift+1)" @click="fit({ smooth: true })">{{ Math.round(zoom * 100) }}%</button>
      <q-btn round flat dense size="sm" icon="add" aria-label="Zoom in (⌘ +)" @click="zoomBy(1.2)" />
      <q-btn round flat dense size="sm" icon="help_outline" aria-label="Canvas help: open the quick tour" @click="tutorial = true">
        <q-tooltip class="ws-help-tip" anchor="top end" self="bottom end" :offset="[0, 10]">
          <ul>
            <li><span>Pan</span><span><kbd>Space</kbd> + drag, or scroll</span></li>
            <li><span>Zoom</span><span><kbd>⌘ +</kbd> <kbd>⌘ −</kbd> or <kbd>⌘</kbd> + scroll</span></li>
            <li><span>Fit everything</span><span><kbd>⌘ 0</kbd> or <kbd>Esc</kbd></span></li>
            <li><span>Zoom to a frame</span><span>Double-click it</span></li>
            <li><span>Open a page</span><span>▶ Preview on a mockup</span></li>
          </ul>
          <p>Click for a quick tour</p>
        </q-tooltip>
      </q-btn>
    </div>

    <TutorialDialog v-model="tutorial" />
    <PrestoPreviewModal v-if="!building" v-model="preview" :project="project" :initial-panel="previewPanel" :initial-page="previewPage" :initial-device="previewDevice" :key="`pm-${previewPanel}-${previewPage}-${previewDevice}`" />
  </div>
</template>

<style scoped>
.ws { position: relative; height: 100%; overflow: hidden; font-family: var(--bs-font); background: #eceef2 radial-gradient(circle, rgb(3 10 38 / 0.12) 1px, transparent 1.2px) 0 0 / 18px 18px; }
.ws__top { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.ws__name { font-size: 0.9375rem; color: var(--bs-ink); }
.ws__kind { font-size: 0.6875rem; }
.ws__spacer { flex: 1; }
.ws__play { background: #fff; border: 1px solid var(--bs-line); }
.ws__btn { min-height: 36px !important; padding: 0 14px !important; background: #fff !important; }
.ws__btn.bs-btn--primary { background: var(--bs-ink) !important; color: #fff !important; }
.ws__btn.bs-btn--primary:hover { background: #1e293b !important; }
.ws__canvas { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
.ws__canvas.is-hand { cursor: grab; }
.ws__canvas.is-dragging { cursor: grabbing; }
.ws__stage.is-anim { transition: transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1); }
.ws__art { position: relative; }
.ws__shield { position: absolute; inset: 0; z-index: 2; cursor: default; }
.ws__open { margin-left: 0.6em; display: inline-flex; align-items: center; gap: 0.2em; border: 0; background: transparent; padding: 0.15em 0.5em; border-radius: 999px; font: inherit; font-weight: 600; color: var(--bs-accent); cursor: pointer; }
.ws__open:hover { background: var(--bs-accent-soft); }
/* With the hand, the mockups (some are iframes) mustn't catch the drag */
.ws__canvas.is-hand .ws__stage { pointer-events: none; }
.ws__kbd { margin-left: 6px; padding: 1px 5px; border-radius: 4px; background: rgb(255 255 255 / 0.18); font: 600 0.6875rem var(--bs-font); }
.ws__stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.ws__board { position: absolute; }
.ws__label { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; color: var(--bs-ink-soft); font-weight: 600; white-space: nowrap; }
/* Like Figma: a frame's name is clipped to the frame's width. */
.ws__label-text { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ws__open { flex: none; }
.ws__label .q-icon { flex: none; }
.ws__art { background: #fff; border-radius: 16px; box-shadow: var(--bs-shadow-2); overflow: hidden; }
.ws__board.is-on .ws__art { outline: 3px solid #3b82f6; outline-offset: 4px; }
.ws__art--desktop, .ws__art--phone, .ws__art--details-desktop, .ws__art--details-phone { background: transparent; box-shadow: none; overflow: visible; }
.ws__device { position: relative; }
.ws__device :deep(.dvp) { background: transparent; }
.ws__skel { display: grid; gap: 14px; padding: 18px; min-height: 420px; }
.ws__skel--desktop { min-height: 680px; background: #fff; border-radius: 16px; }
.ws__skel--phone { min-height: 640px; background: #fff; border-radius: 36px; }
.ws__skel span { border-radius: 10px; background: linear-gradient(90deg, #eef0f4 25%, #f7f8fa 50%, #eef0f4 75%) 0 0 / 200% 100%; animation: ws-shimmer 1.4s infinite; }
.ws__skel span:first-child { height: 160px; } .ws__skel span:nth-child(2) { height: 90px; } .ws__skel span:nth-child(3) { height: 120px; }
@keyframes ws-shimmer { to { background-position: -200% 0; } }
.ws__tools { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); z-index: 5; display: grid; gap: 4px; padding: 6px; border-radius: 14px; background: #fff; border: 1px solid var(--bs-line); box-shadow: var(--bs-shadow-2); }
.ws__tools .q-btn { color: var(--bs-ink-soft); }
.ws__tools .q-btn.is-on { background: var(--bs-ink); color: #fff; }
.ws__bottom { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(640px, calc(100% - 700px)); min-width: 420px; z-index: 5; display: grid; gap: 8px; }
.ws__suggest { display: flex; gap: 8px; }
.ws__ctx { margin: 0; justify-self: start; display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border-radius: 999px; background: var(--bs-accent-soft); color: var(--bs-accent); font: 500 0.75rem var(--bs-font); }
.ws__ctx strong { font-weight: 700; }
.ws__ctx-what { display: inline-flex; align-items: center; gap: 5px; padding-left: 6px; margin-left: 2px; border-left: 1px solid rgb(124 58 237 / 0.25); color: var(--bs-ink); }
.ws__ctx-what img { width: 28px; height: 18px; object-fit: contain; border-radius: 3px; background: repeating-conic-gradient(#e8ebf0 0% 25%, #fff 0% 50%) 50% / 6px 6px; }
.ws__ctx button { display: grid; place-items: center; width: 20px; height: 20px; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; }
.ws__ctx button:hover { background: rgb(124 58 237 / 0.12); }
.ws__chip { flex: none; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--bs-line); background: rgb(255 255 255 / 0.85); border-radius: 999px; padding: 5px 6px 5px 12px; font: 500 0.75rem var(--bs-font); color: var(--bs-ink); cursor: pointer; }
.ws__chip span { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--bs-surface-2); font-size: 0.6875rem; color: var(--bs-ink-soft); }
.ws__chip:disabled { opacity: 0.5; cursor: default; }
.ws__chip { transition: background-color 0.15s, border-color 0.15s, color 0.15s; }
.ws__chip:focus-visible { outline: 2px solid var(--bs-accent); outline-offset: 2px; }
.ws__chip.is-on { background: var(--bs-accent-soft); border-color: var(--bs-accent); color: var(--bs-accent); }
.ws__chip.is-on span { background: #fff; color: var(--bs-accent); }
.ws__zoom { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 12px; background: #fff; border: 1px solid var(--bs-line); }
.ws__pct { border: 0; background: var(--bs-surface-2); border-radius: 8px; padding: 4px 8px; font: 600 0.75rem var(--bs-font); color: var(--bs-ink); cursor: pointer; }
</style>

<style>
/* Set history menu + help tooltip render outside this component (Quasar portal). */
.ws-hist { width: 340px; max-height: 60vh; overflow-y: auto; padding: 8px; font-family: var(--bs-font); }
.ws-hist__title { margin: 4px 8px 8px; font: 600 0.6875rem var(--bs-font); letter-spacing: 0.06em; text-transform: uppercase; color: var(--bs-ink-soft); }
.ws-hist__item { width: 100%; display: grid; grid-template-columns: 96px 1fr; gap: 10px; align-items: center; text-align: left; padding: 8px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; font: inherit; color: var(--bs-ink); }
.ws-hist__item:hover { background: var(--bs-surface-2); }
.ws-hist__item:disabled { cursor: default; opacity: 0.7; }
.ws-hist__thumbs { display: grid; gap: 2px; align-content: center; justify-items: center; min-height: 40px; }
.ws-hist__thumbs img { width: 96px; height: 18px; object-fit: cover; border-radius: 3px; display: block; }
.ws-hist__text { display: grid; gap: 2px; min-width: 0; font-size: 0.8125rem; }
.ws-hist__text span { color: var(--bs-ink-soft); font-size: 0.75rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ws-help-tip { padding: 12px 14px !important; border-radius: 12px !important; background: #0f172a !important; font: 400 0.8125rem/1.4 var(--bs-font) !important; }
.ws-help-tip ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; min-width: 260px; }
.ws-help-tip li { display: flex; justify-content: space-between; gap: 18px; }
.ws-help-tip li > span:first-child { color: #cbd5e1; }
.ws-help-tip kbd { padding: 1px 6px; border-radius: 5px; background: rgb(255 255 255 / 0.14); font: 600 0.75rem var(--bs-font); }
.ws-help-tip p { margin: 10px 0 0; padding-top: 9px; border-top: 1px solid rgb(255 255 255 / 0.14); color: #c4b5fd; font-weight: 600; }
</style>
