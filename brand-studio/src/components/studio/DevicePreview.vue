<script setup>
// DevicePreview — the live, branded booking page inside an <iframe> (the
// Preview Host, see preview/bridge.js), framed as desktop / tablet / phone.
// Desktop and tablet sit in the realistic ChromeWindow (sized 1:1 with the
// page, like a real browser screenshot), optionally on a backdrop (`backdrop`):
// 'home' = the homepage's airy look — light canvas + tilted, softly blurred
// Higgsfield lifestyle tiles (Option E art); 'lavender' / 'dune' = Higgsfield
// wallpapers.
//
// The iframe gets a REAL viewport width (1280 / 768 / 390) so Presto's media
// queries and Quasar's $q.screen behave exactly as on a device; it is then
// CSS-scaled to fit the canvas. Every project change is pushed to the host
// (rAF-throttled), and clicks inside the preview that navigate are followed.
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { previewHostUrl, connectPreviewFrame } from '../../preview/bridge.js'
import { PAGE_META } from '../../models/pageConfig.js'
import ChromeWindow from '../devices/ChromeWindow.vue'
import { STUDIO_WALLPAPERS } from '../../assets/studio/index.js'
import { OPTION_E_ART } from '../../assets/marketing/option-e/index.js'

const props = defineProps({
  page: { type: String, default: 'landing' },
  device: { type: String, default: 'desktop' }, // desktop | tablet | mobile
  project: { type: Object, default: null }, // defaults to the project store
  src: { type: String, default: '' },
  padding: { type: Number, default: 28 },
  connectTimeoutMs: { type: Number, default: 12000 },
  // Behind the browser window: '' (none) | 'home' | 'lavender' | 'dune'
  backdrop: { type: String, default: '' },
})
const emit = defineEmits(['update:page', 'ready'])

const store = useProjectStore()
const doc = computed(() => props.project || store.project)

// chrome = ChromeWindow tab strip + toolbar in design px (scales with the page).
const CHROME_H = 85
const DEVICES = {
  desktop: { w: 1280, h: null, chrome: CHROME_H, bezel: 0, label: 'Desktop' },
  tablet: { w: 768, h: 1024, chrome: CHROME_H, bezel: 0, label: 'Tablet' },
  mobile: { w: 390, h: 844, chrome: 0, bezel: 12, label: 'Mobile' },
}
const spec = computed(() => DEVICES[props.device] || DEVICES.desktop)

// ── Fit-to-canvas scaling ────────────────────────────────────────────────
const stage = ref(null)
const box = ref({ w: 0, h: 0 })
let ro
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    const r = entry.contentRect
    box.value = { w: r.width, h: r.height }
  })
  if (stage.value) ro.observe(stage.value)
})
onBeforeUnmount(() => ro?.disconnect())

const layout = computed(() => {
  const s = spec.value
  const availW = Math.max(200, box.value.w - props.padding * 2 - s.bezel * 2)
  const availH = Math.max(200, box.value.h - props.padding * 2 - s.bezel * 2)
  if (!s.h) {
    // Desktop: fit width, fill the available height (minus the scaled chrome).
    const scale = Math.min(1, availW / s.w)
    return { scale, w: s.w, h: Math.round((availH - s.chrome * scale) / scale) }
  }
  const scale = Math.min(1, availW / s.w, availH / (s.h + s.chrome))
  return { scale, w: s.w, h: s.h }
})
const zoom = computed(() => `${Math.round(layout.value.scale * 100)}%`)
const viewportStyle = computed(() => ({ width: `${layout.value.w * layout.value.scale}px`, height: `${layout.value.h * layout.value.scale}px` }))
const iframeStyle = computed(() => ({ width: `${layout.value.w}px`, height: `${layout.value.h}px`, transform: `scale(${layout.value.scale})` }))

// ── Bridge ───────────────────────────────────────────────────────────────
const frame = ref(null)
const frameKey = ref(0)
const status = ref('connecting') // connecting | ready | timeout
const hostSrc = computed(() => props.src || previewHostUrl())
let link = null
let timeout = null
let raf = 0

function onReadyMessage(e) {
  if (e.origin !== window.location.origin || e.source !== frame.value?.contentWindow) return
  if (e.data?.type === 'bs-preview:ready') {
    status.value = 'ready'
    clearTimeout(timeout)
    emit('ready')
  }
}

function connect() {
  link?.destroy()
  clearTimeout(timeout)
  status.value = 'connecting'
  if (!frame.value) return
  link = connectPreviewFrame(frame.value, () => ({ project: doc.value, page: props.page }), {
    onNavigate: (page) => page && page !== props.page && emit('update:page', page),
  })
  timeout = setTimeout(() => { if (status.value !== 'ready') status.value = 'timeout' }, props.connectTimeoutMs)
}

function push() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    link?.send()
  })
}

onMounted(() => {
  window.addEventListener('message', onReadyMessage)
  connect()
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onReadyMessage)
  link?.destroy()
  clearTimeout(timeout)
  cancelAnimationFrame(raf)
})
watch(doc, push, { deep: true })
watch(() => props.page, push)

async function retry() {
  frameKey.value++
  await nextTick()
  connect()
}

const urlLabel = computed(() => {
  const slug = doc.value?.publishing?.slug || 'your-event'
  const path = props.page === 'landing' ? '' : `/${props.page === 'browse' ? 'hotels' : props.page}`
  return `demo.eventpipe.com/${slug}${path}`
})
const pageTitle = computed(() => doc.value?.event?.name || 'Booking page')
const favicon = computed(() => doc.value?.brandKit?.logo?.src || '')
const wallpaper = computed(() => STUDIO_WALLPAPERS[props.backdrop] || '')
// Homepage mosaic, framing the window: tiles peek out around its edges.
const HOME_TILES = [
  { art: 'tile-team', x: -3, y: 6, w: 22, r: -7, ratio: '3 / 4' },
  { art: 'tile-room', x: 14, y: -4, w: 13, r: 4, blur: 2, ratio: '4 / 3' },
  { art: 'tile-wedding', x: -4, y: 58, w: 24, r: 5, ratio: '4 / 3' },
  { art: 'tile-breakfast', x: 12, y: 88, w: 12, r: -8, blur: 2.5, ratio: '4 / 3' },
  { art: 'tile-conference', x: 80, y: -3, w: 23, r: 6, ratio: '4 / 3' },
  { art: 'tile-nurses', x: 68, y: 90, w: 10, r: -5, blur: 3, ratio: '3 / 4' },
  { art: 'tile-crew', x: 84, y: 40, w: 19, r: -5, ratio: '3 / 4' },
  { art: 'tile-reunion', x: 86, y: 80, w: 15, r: 6, blur: 1.5, ratio: '3 / 4' },
]
const homeTiles = computed(() => (props.backdrop === 'home' ? HOME_TILES.filter((t) => OPTION_E_ART[t.art]) : []))
const frameTitle = computed(() => `Branded booking page preview — ${PAGE_META[props.page]?.label || props.page}, ${spec.value.label.toLowerCase()}`)
</script>

<template>
  <div ref="stage" class="dvp" :class="[`dvp--${device}`, { 'dvp--backdrop': wallpaper, 'dvp--home': backdrop === 'home' }]" :style="wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined">
    <div v-if="homeTiles.length" class="dvp__tiles" aria-hidden="true">
      <span
        v-for="t in homeTiles" :key="t.art" class="dvp__tile"
        :style="{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, aspectRatio: t.ratio, transform: `rotate(${t.r}deg)`, filter: `blur(${(t.blur || 0) + 3}px) grayscale(0.55) saturate(0.7)` }"
      ><img :src="OPTION_E_ART[t.art]" alt="" loading="lazy" /></span>
    </div>
    <span v-if="spec.chrome" class="dvp__zoom" aria-hidden="true">{{ zoom }}</span>
    <component
      :is="spec.chrome ? ChromeWindow : 'div'"
      class="dvp__device"
      :class="`dvp__device--${device}`"
      v-bind="spec.chrome ? { url: urlLabel, title: pageTitle, favicon, faviconColor: doc?.brandKit?.colors?.primary, designWidth: spec.w, label: `${spec.label} browser preview` } : {}"
      :style="spec.chrome ? { width: viewportStyle.width } : undefined"
    >
      <div v-if="!spec.chrome" class="dvp__notch" aria-hidden="true" />

      <div class="dvp__viewport" :style="viewportStyle">
        <iframe
          :key="frameKey"
          ref="frame"
          class="dvp__iframe"
          :src="hostSrc"
          :title="frameTitle"
          :style="iframeStyle"
          @load="status !== 'ready' && link?.send()"
        />
        <transition name="dvp-fade">
          <div v-if="status !== 'ready'" class="dvp__overlay" :class="`is-${status}`" role="status" aria-live="polite">
            <template v-if="status === 'connecting'">
              <div class="dvp__skeleton" aria-hidden="true">
                <div class="dvp__sk dvp__sk--hero" />
                <div class="dvp__sk dvp__sk--bar" />
                <div class="dvp__sk dvp__sk--line" />
                <div class="dvp__sk dvp__sk--line dvp__sk--short" />
              </div>
              <div class="dvp__msg"><q-spinner size="18px" /> Connecting live preview…</div>
            </template>
            <template v-else>
              <q-icon name="wifi_tethering_off" size="28px" />
              <p class="dvp__msg-title">The preview didn’t load</p>
              <p class="dvp__msg-sub">Your edits are kept. Reload the preview to try again.</p>
              <q-btn unelevated no-caps class="bs-btn bs-btn--ghost" icon="refresh" label="Reload preview" @click="retry" />
            </template>
          </div>
        </transition>
      </div>
    </component>
  </div>
</template>

<style scoped>
.dvp { position: relative; width: 100%; height: 100%; min-height: 0; display: flex; align-items: flex-start; justify-content: center; padding-top: v-bind('props.padding + "px"'); overflow: hidden; }
.dvp--mobile, .dvp--tablet { align-items: center; padding-top: 0; }
.dvp__device { display: flex; flex-direction: column; align-items: center; }
.dvp--backdrop { background-size: cover; background-position: center; }
/* 'home' — the homepage (Option E) look: airy white canvas, soft accent glows,
   tilted lifestyle tiles framing the window. */
.dvp--home { background: radial-gradient(60% 50% at 12% 20%, rgb(124 58 237 / 0.07), transparent 70%), radial-gradient(55% 45% at 88% 85%, rgb(37 99 235 / 0.07), transparent 70%), #F7F8FB; }
/* Kept quiet so the tiles never compete with the example page in the window:
   blurred, desaturated, low opacity, washed toward the canvas. */
.dvp__tiles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.dvp__tiles::after { content: ''; position: absolute; inset: 0; background: rgb(247 248 251 / 0.35); }
.dvp__tile { position: absolute; display: block; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 24px rgb(15 23 42 / 0.06); opacity: 0.32; }
.dvp__tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dvp__device { position: relative; z-index: 1; }
.dvp__device--desktop, .dvp__device--tablet { flex: none; display: block; }
.dvp__zoom { position: absolute; right: 12px; bottom: 10px; z-index: 1; padding: 3px 8px; border-radius: 999px; background: rgb(255 255 255 / 0.8); backdrop-filter: blur(6px); font: 700 0.6875rem/1 var(--bs-font); color: var(--bs-ink-soft); }

.dvp__device--mobile { padding: 12px; border-radius: 52px; background: #0B0F19; box-shadow: var(--bs-shadow-3), inset 0 0 0 2px #2A2F3A; position: relative; }
.dvp__device--mobile .dvp__viewport { border-radius: 40px; }
.dvp__notch { position: absolute; top: 20px; left: 50%; width: 96px; height: 26px; margin-left: -48px; border-radius: 20px; background: #0B0F19; z-index: 3; }

.dvp__viewport { position: relative; overflow: hidden; background: #fff; }
.dvp__iframe { display: block; border: 0; transform-origin: 0 0; background: #fff; }

.dvp__overlay { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #fff; text-align: center; padding: 24px; color: var(--bs-ink-soft); font-family: var(--bs-font); }
.dvp__skeleton { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 16px; padding: 0 0 24px; }
.dvp__sk { background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%); background-size: 200% 100%; animation: dvp-shimmer 1.4s linear infinite; border-radius: 6px; }
.dvp__sk--hero { height: 38%; border-radius: 0; }
.dvp__sk--bar { height: 56px; margin: -40px 8% 0; box-shadow: var(--bs-shadow-2); background-color: #fff; }
.dvp__sk--line { height: 14px; margin: 0 20%; }
.dvp__sk--short { margin-right: 40%; }
.dvp__msg { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: var(--bs-surface); box-shadow: var(--bs-shadow-2); font: 700 0.8125rem/1 var(--bs-font); color: var(--bs-ink); }
.dvp__msg-title { margin: 4px 0 0; font: 700 1rem/1.3 var(--bs-font); color: var(--bs-ink); }
.dvp__msg-sub { margin: 0 0 8px; font: 400 0.875rem/1.4 var(--bs-font); }
.dvp-fade-leave-active { transition: opacity var(--ds-duration-base) var(--ds-ease-standard); }
.dvp-fade-leave-to { opacity: 0; }
@keyframes dvp-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .dvp__sk { animation: none; } }
</style>
