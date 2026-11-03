<script setup>
// A real Presto page in an <iframe>: brand-studio's Preview Host at a real
// viewport width (1280 desktop / 390 phone), so Presto's own layouts and
// breakpoints apply — exactly what the live Studio shows. The project (or a
// draft snapshot) is pushed over the preview bridge whenever it changes.
// Frames load only when they scroll into view (each is a full Presto app).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { connectPreviewFrame, previewHostUrl } from '@bs/preview/bridge.js'
import { toPresto } from '../../presto/toPresto.js'

const props = defineProps({
  view: { type: Object, required: true },
  page: { type: String, default: 'landing' }, // landing | browse | details
  width: { type: Number, default: 1280 }, // viewport width in design px
  height: { type: Number, default: 800 }, // viewport height in design px
  fit: { type: Boolean, default: true }, // scale to the container's width
  interactive: { type: Boolean, default: true },
})
const emit = defineEmits(['navigate'])

// In Storybook the host is a story; in the prototype app it's preview.html.
const src = /iframe\.html$/.test(window.location.pathname) ? previewHostUrl() : 'preview.html?bsEmbed=1'

const root = ref(null)
const frame = ref(null)
const show = ref(false)
const ready = ref(false)
const boxW = ref(0)
const scale = computed(() => (props.fit && boxW.value ? boxW.value / props.width : 1))

let link = null
let io = null
let ro = null
const payload = () => ({ project: toPresto(props.view), page: props.page })

// Connect as soon as the iframe exists: the host says "ready" from inside its
// own startup, which can come before the iframe's load event.
watch(frame, (el) => {
  link?.destroy()
  link = el ? connectPreviewFrame(el, payload, { onNavigate: (p) => emit('navigate', p) }) : null
})
// Readiness, to fade the frame in once Presto has rendered.
function onMessage(e) {
  if (e.source === frame.value?.contentWindow && e.data?.type === 'bs-preview:ready') setTimeout(() => { ready.value = true }, 250)
}
watch(() => [JSON.stringify(props.view.copy), props.view.selected?.key, props.view.palette.join(), props.view.look, props.view.font, props.view.logo, props.page], () => link?.send())

onMounted(() => {
  window.addEventListener('message', onMessage)
  ro = new ResizeObserver(([e]) => { boxW.value = e.contentRect.width })
  ro.observe(root.value)
  io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { show.value = true; io.disconnect() } }, { rootMargin: '200px' })
  io.observe(root.value)
})
onBeforeUnmount(() => { link?.destroy(); io?.disconnect(); ro?.disconnect(); window.removeEventListener('message', onMessage) })
</script>

<template>
  <div ref="root" class="pfr" :style="{ height: `${height * scale}px` }">
    <iframe
      v-if="show" ref="frame" :src="src" title="Presto page preview" class="pfr__frame" :class="{ 'is-ready': ready }"
      :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})`, pointerEvents: interactive ? 'auto' : 'none' }"
      :tabindex="interactive ? 0 : -1" loading="lazy"
    />
    <div v-if="!ready" class="pfr__wait" aria-hidden="true"><span /></div>
  </div>
</template>

<style scoped>
.pfr { position: relative; width: 100%; overflow: hidden; background: #fff; }
.pfr__frame { position: absolute; top: 0; left: 0; border: 0; transform-origin: 0 0; background: #fff; opacity: 0; transition: opacity 0.25s; }
.pfr__frame.is-ready { opacity: 1; }
.pfr__wait { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(90deg, #f1f5f9, #f8fafc, #f1f5f9) 0 0 / 200% 100%; animation: shimmer 1.4s linear infinite; }
.pfr__wait span { width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid #d5dcec; border-top-color: #01113e; animation: spin 0.8s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
