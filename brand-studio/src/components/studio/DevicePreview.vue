<script setup>
// DevicePreview — the live, branded booking page inside an <iframe> (the
// Preview Host, see preview/bridge.js), framed as desktop / tablet / phone.
//
// The iframe gets a REAL viewport width (1280 / 768 / 390) so Presto's media
// queries and Quasar's $q.screen behave exactly as on a device; it is then
// CSS-scaled to fit the canvas. Every project change is pushed to the host
// (rAF-throttled), and clicks inside the preview that navigate are followed.
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { previewHostUrl, connectPreviewFrame } from '../../preview/bridge.js'
import { PAGE_META } from '../../models/pageConfig.js'

const props = defineProps({
  page: { type: String, default: 'landing' },
  device: { type: String, default: 'desktop' }, // desktop | tablet | mobile
  project: { type: Object, default: null }, // defaults to the project store
  src: { type: String, default: '' },
  padding: { type: Number, default: 28 },
  connectTimeoutMs: { type: Number, default: 12000 },
})
const emit = defineEmits(['update:page', 'ready'])

const store = useProjectStore()
const doc = computed(() => props.project || store.project)

const DEVICES = {
  desktop: { w: 1280, h: null, chrome: 36, bezel: 0, label: 'Desktop' },
  tablet: { w: 768, h: 1024, chrome: 36, bezel: 0, label: 'Tablet' },
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
  const availH = Math.max(200, box.value.h - props.padding * 2 - s.bezel * 2 - s.chrome)
  if (!s.h) {
    // Desktop: fit width, fill the available height.
    const scale = Math.min(1, availW / s.w)
    return { scale, w: s.w, h: Math.round(availH / scale) }
  }
  const scale = Math.min(1, availW / s.w, availH / s.h)
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
const frameTitle = computed(() => `Branded booking page preview — ${PAGE_META[props.page]?.label || props.page}, ${spec.value.label.toLowerCase()}`)
</script>

<template>
  <div ref="stage" class="dvp" :class="`dvp--${device}`">
    <div class="dvp__device" :class="`dvp__device--${device}`">
      <!-- Browser chrome (desktop / tablet) -->
      <div v-if="spec.chrome" class="dvp__chrome" :style="{ width: viewportStyle.width }" aria-hidden="true">
        <span class="dvp__dots"><i /><i /><i /></span>
        <span class="dvp__url"><q-icon name="lock" size="12px" /> {{ urlLabel }}</span>
        <span class="dvp__zoom">{{ zoom }}</span>
      </div>
      <div v-else class="dvp__notch" aria-hidden="true" />

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
    </div>
  </div>
</template>

<style scoped>
.dvp { position: relative; width: 100%; height: 100%; min-height: 0; display: flex; align-items: flex-start; justify-content: center; padding-top: v-bind('props.padding + "px"'); overflow: hidden; }
.dvp--mobile, .dvp--tablet { align-items: center; padding-top: 0; }
.dvp__device { display: flex; flex-direction: column; align-items: center; }
.dvp__device--desktop, .dvp__device--tablet { border-radius: 10px; overflow: hidden; box-shadow: var(--bs-shadow-3); background: var(--bs-surface); }

.dvp__chrome { height: 36px; display: grid; grid-template-columns: 60px minmax(0, 1fr) 60px; align-items: center; padding: 0 12px; gap: 8px; background: #EEF0F4; border-bottom: 1px solid var(--bs-line); box-sizing: border-box; }
.dvp__dots { display: flex; gap: 6px; }
.dvp__dots i { width: 10px; height: 10px; border-radius: 50%; background: #D1D5DB; }
.dvp__url { justify-self: center; display: inline-flex; align-items: center; gap: 4px; max-width: 100%; padding: 4px 12px; border-radius: 6px; background: #fff; font: 400 0.75rem/1.2 var(--bs-font); color: var(--bs-ink-soft); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dvp__zoom { justify-self: end; font: 700 0.6875rem/1 var(--bs-font); color: var(--bs-ink-faint); }

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
