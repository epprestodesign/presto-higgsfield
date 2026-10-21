<script setup>
// PreviewHost — the page loaded INSIDE the Studio's preview <iframe>. It renders
// BrandedSite for whatever project/page the parent posts over the preview
// bridge (preview/bridge.js), and reports in-preview navigation back.
//
// Standalone (opened directly, not embedded) it renders a sample project so the
// story / route is still useful on its own.
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import BrandedSite from './BrandedSite.vue'
import { listenAsPreviewHost } from '../../preview/bridge.js'
import { sampleProject } from '../../data/sampleEvents.js'
import { buildConcept } from '../../providers/ai/conceptFactory.js'

const props = defineProps({
  // Used only when not embedded.
  sample: { type: String, default: 'heartland' },
  initialPage: { type: String, default: 'landing' },
})

function standaloneProject() {
  const p = sampleProject(props.sample)
  const c = buildConcept({ direction: p.brandKit.direction || 'energy', templateIndex: 0, brandKit: p.brandKit, event: p.event })
  p.concepts.items = [c]
  p.concepts.selectedId = c.id
  return p
}

const project = shallowRef(null)
const page = ref(props.initialPage)
const waiting = ref(true)
let link = null
let fallbackTimer = null
// Embedded (bsEmbed=1, see preview/bridge.js) → wait for the Studio's render
// message. As a safety net, fall back to the sample project if none arrives;
// a later message from the parent still takes over.
const FALLBACK_MS = 5000

onMounted(() => {
  link = listenAsPreviewHost(({ project: next, page: nextPage }) => {
    clearTimeout(fallbackTimer)
    project.value = next
    if (nextPage) page.value = nextPage
    waiting.value = false
  })
  const useSample = () => {
    if (project.value) return
    project.value = standaloneProject()
    waiting.value = false
  }
  if (!link.embedded) useSample()
  else fallbackTimer = setTimeout(useSample, FALLBACK_MS)
})
onBeforeUnmount(() => { link?.destroy(); clearTimeout(fallbackTimer) })

const onNavigate = (p) => {
  page.value = p
  link?.navigate(p)
}
</script>

<template>
  <div class="phost">
    <branded-site v-if="project" :project="project" :page="page" @navigate="onNavigate" />
    <div v-else-if="waiting" class="phost__wait" role="status" aria-live="polite">
      <q-spinner size="28px" color="grey-6" />
      <span>Loading preview…</span>
    </div>
  </div>
</template>

<style scoped>
.phost { min-height: 100vh; background: var(--ds-color-surface, #fff); }
.phost__wait { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #64748B; font: 400 0.9375rem 'PT Sans', sans-serif; }
</style>
