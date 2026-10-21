<script setup>
// ReviewFrame — a scaled, device-framed live preview of the booking page for
// the publish "Review" step. Renders the Preview Host in an <iframe> (so
// Presto's media queries see a real desktop/phone window) and pushes the
// current project to it over the preview bridge. If the host isn't reachable
// it falls back to a BrandHero snapshot so the step is never blank.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { previewHostUrl, connectPreviewFrame } from '../../preview/bridge.js'
import { useProjectStore } from '../../stores/project.js'
import { formatDateRange, locationLabel } from '../../models/event.js'
import BrandHero from '../brand/BrandHero.vue'

const props = defineProps({
  device: { type: String, default: 'desktop' }, // 'desktop' | 'mobile'
  page: { type: String, default: 'landing' },
  // Max rendered height of the frame (px); the iframe is scaled to fit.
  maxHeight: { type: Number, default: 520 },
  src: { type: String, default: '' }, // override the host URL (future app: /preview)
  readyTimeoutMs: { type: Number, default: 6000 },
})
const emit = defineEmits(['navigate'])

const project = useProjectStore()
const DEVICE = { desktop: { w: 1280, h: 800 }, mobile: { w: 390, h: 844 } }
const natural = computed(() => DEVICE[props.device] || DEVICE.desktop)

const wrap = ref(null)
const iframe = ref(null)
const width = ref(0)
const state = ref('loading') // 'loading' | 'ready' | 'unavailable'

const scale = computed(() => {
  if (!width.value) return 0.5
  const byWidth = width.value / natural.value.w
  const byHeight = props.maxHeight / natural.value.h
  return Math.min(1, byWidth, props.device === 'mobile' ? byHeight : byWidth)
})
const frameStyle = computed(() => ({
  width: `${natural.value.w}px`,
  height: `${natural.value.h}px`,
  transform: `scale(${scale.value})`,
}))
const boxStyle = computed(() => ({ width: `${natural.value.w * scale.value}px`, height: `${natural.value.h * scale.value}px` }))

let link = null
let ro = null
let poll = null
let timeout = null

onMounted(() => {
  ro = new ResizeObserver(([e]) => { width.value = e.contentRect.width })
  ro.observe(wrap.value)
  link = connectPreviewFrame(iframe.value, () => ({ project: project.project, page: props.page }), {
    onNavigate: (page) => emit('navigate', page),
  })
  poll = setInterval(() => {
    if (link.ready) { state.value = 'ready'; clearInterval(poll); clearTimeout(timeout) }
  }, 200)
  timeout = setTimeout(() => { if (state.value === 'loading') { state.value = 'unavailable'; clearInterval(poll) } }, props.readyTimeoutMs)
})
onBeforeUnmount(() => { link?.destroy(); ro?.disconnect(); clearInterval(poll); clearTimeout(timeout) })

watch(() => [project.project, props.page], () => link?.send(), { deep: true })

const pj = computed(() => project.project)
const url = computed(() => `demo.eventpipe.com/${pj.value.publishing.slug || ''}`)
</script>

<template>
  <div ref="wrap" class="rf" :class="`rf--${device}`">
    <div class="rf__device" :style="boxStyle">
      <!-- Desktop chrome bar -->
      <div v-if="device === 'desktop'" class="rf__chrome" aria-hidden="true">
        <span class="rf__dots"><i /><i /><i /></span>
        <span class="rf__url"><q-icon name="lock" size="11px" /> {{ url }}</span>
      </div>
      <div class="rf__viewport">
        <iframe
          ref="iframe"
          class="rf__iframe"
          :src="src || previewHostUrl()"
          :style="frameStyle"
          :title="`${device === 'mobile' ? 'Mobile' : 'Desktop'} preview of ${pj.event.name}`"
          tabindex="-1"
        />
        <div v-if="state !== 'ready'" class="rf__overlay" :class="`rf__overlay--${state}`">
          <template v-if="state === 'loading'">
            <q-spinner size="28px" color="primary" />
            <span class="bs-caption">Loading live preview…</span>
          </template>
          <template v-else>
            <brand-hero
              :concept="project.selectedConcept"
              :brand-kit="pj.brandKit"
              :headline="pj.pages.landing.hero.headline || pj.event.name"
              :tagline="device === 'desktop' ? pj.pages.landing.hero.tagline : ''"
              :dates="formatDateRange(pj.event.startDate, pj.event.endDate)"
              :location="locationLabel(pj.event)"
              size="card"
              :heading-level="3"
            />
            <p class="bs-caption rf__fallback-note">Live preview unavailable — showing your hero snapshot.</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rf { width: 100%; min-width: 0; display: flex; justify-content: center; overflow: hidden; padding-bottom: 6px; }
.rf__device { position: relative; flex: none; box-sizing: content-box; overflow: hidden; background: #fff; }
.rf--desktop .rf__device { border-radius: 10px; border: 1px solid var(--bs-line-strong); box-shadow: var(--bs-shadow-2); padding-top: 30px; }
.rf--mobile .rf__device { border-radius: 34px; border: 10px solid #0B1220; box-shadow: var(--bs-shadow-3); }
.rf__chrome { position: absolute; inset: 0 0 auto 0; height: 30px; display: flex; align-items: center; gap: 12px; padding: 0 12px; background: var(--bs-surface-2); border-bottom: 1px solid var(--bs-line); }
.rf__dots { display: flex; gap: 5px; }
.rf__dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--bs-line-strong); }
.rf__url { flex: 1; max-width: 360px; margin: 0 auto; height: 18px; border-radius: 6px; background: #fff; border: 1px solid var(--bs-line); font: 400 0.6875rem/16px var(--bs-font); color: var(--bs-ink-soft); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rf__viewport { position: relative; width: 100%; height: 100%; overflow: hidden; }
.rf__iframe { border: 0; display: block; transform-origin: 0 0; background: #fff; pointer-events: auto; }
.rf__overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: var(--bs-surface); padding: 12px; }
.rf__overlay--unavailable { justify-content: flex-start; align-items: stretch; background: var(--bs-surface-2); }
.rf__fallback-note { text-align: center; }
</style>
