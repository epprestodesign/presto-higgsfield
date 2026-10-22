<script setup>
// FlowApp — the end-to-end Brand Studio journey, stitched from the real
// screens: marketing → intake → brand → concepts → studio → publish → demo,
// plus the dashboard. Used by the standalone prototype app (hash-routed, so the
// phone's back button works) and by the Brand Studio / Flows story.
//
// Demo assist: auto-fill (tap any empty field to fill it with sample data) and
// a "Skip with sample" shortcut on every step.
//
// Deep links (flows/deepLink.js): each screen's view state is mirrored into the
// hash — e.g. #/studio?example=heartland&concept=0&page=browse&panel=ads — so
// any view can be shared as feedback and reopened exactly ("Copy link").
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from '../stores/project.js'
import { useGenerationStore } from '../stores/generation.js'
import { useSessionStore } from '../stores/session.js'
import { enableDemoAutofill, personaFromSample } from './demoAutofill.js'
import { getVertical } from '../data/verticals/index.js'
import { getSampleEvent, ALL_EXAMPLES } from '../data/sampleEvents.js'
import { VERTICALS } from '../data/verticals/index.js'
import { conceptsFor } from '../stories/_helpers.js'
import { parseHash, buildHash, shareUrl } from './deepLink.js'
// Homepage = Option E (Group Booking); Option A (MarketingLanding) stays in Storybook.
import HomeOptionE from '../components/marketing/options/HomeOptionE.vue'
import IntakeWizard from '../components/intake/IntakeWizard.vue'
import BrandDiscovery from '../components/brand-kit/BrandDiscovery.vue'
import ConceptStudio from '../components/concepts/ConceptStudio.vue'
import StudioEditor from '../components/studio/StudioEditor.vue'
import PublishFlow from '../components/publish/PublishFlow.vue'
import PublishedDemoPage from '../components/publish/PublishedDemoPage.vue'
import ProjectDashboard from '../components/account/ProjectDashboard.vue'
import SponsorEditor from '../components/ads/SponsorEditor.vue'

const props = defineProps({
  // Mirror the current step in location.hash (prototype app). Off in Storybook.
  syncHash: { type: Boolean, default: false },
  initialStep: { type: String, default: 'home' },
  autofill: { type: Boolean, default: true },
})

const $q = useQuasar()
const project = useProjectStore()
const generation = useGenerationStore()
const session = useSessionStore()

// Steps that show the journey progress bar, in order.
const JOURNEY = [
  { id: 'intake', label: 'Event' },
  { id: 'brand', label: 'Brand' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'studio', label: 'Customize' },
  { id: 'publish', label: 'Publish' },
]
const STEPS = ['home', ...JOURNEY.map((s) => s.id), 'demo', 'dashboard']

const step = ref(STEPS.includes(props.initialStep) ? props.initialStep : 'home')
const journeyIndex = computed(() => JOURNEY.findIndex((s) => s.id === step.value))
// Full-bleed screens bring their own chrome.
const showBar = computed(() => ['intake', 'brand', 'concepts', 'publish'].includes(step.value))

// ── Navigation (+ hash sync / deep links) ─────────────────────────────────
const params = ref({})
const readRoute = () => {
  const r = parseHash(window.location.hash)
  return STEPS.includes(r.step) ? r : null
}
function writeHash(replace = false) {
  if (!props.syncHash) return
  const url = buildHash(step.value, params.value)
  if (url === window.location.hash) return
  replace ? history.replaceState(null, '', url) : history.pushState(null, '', url)
}
// The example + concept follow you between steps; view params belong to a screen.
const carried = (p) => ({ example: p.example, concept: p.concept })
function go(next, { replace = false, params: p } = {}) {
  if (!STEPS.includes(next)) return
  step.value = next
  params.value = p ?? carried(params.value)
  writeHash(replace)
  window.scrollTo({ top: 0, behavior: 'instant' })
}
/** Update view params in place (no new history entry). */
function setParams(patch) {
  params.value = { ...params.value, ...patch }
  writeHash(true)
}

/** Load the example a link names (+ its concepts, selecting `concept`). */
const loadedExample = ref('')
function applyExample(p) {
  if (!p.example || !getSampleEvent(p.example)) return false
  if (loadedExample.value !== p.example || !project.project.concepts.items.length) {
    project.loadSample(p.example)
    project.setConcepts(conceptsFor(project.project))
    loadedExample.value = p.example
  }
  const items = project.project.concepts.items
  const i = Math.min(Number(p.concept || 0), items.length - 1)
  if (items[i] && project.project.concepts.selectedId !== items[i].id) project.selectConcept(items[i].id)
  return true
}
const onPop = () => {
  const r = readRoute()
  if (!r) return
  applyExample(r.params)
  step.value = r.step
  params.value = r.params
}

// Selected concept → concept=N, so concept-specific feedback links reopen it.
watch(() => project.project.concepts.selectedId, (id) => {
  if (!['concepts', 'studio', 'publish'].includes(step.value)) return
  const i = project.project.concepts.items.findIndex((c) => c.id === id)
  setParams({ concept: i >= 0 ? String(i) : '' })
})

async function copyLink() {
  const url = shareUrl(buildHash(step.value, params.value))
  try { await navigator.clipboard.writeText(url) } catch { window.prompt('Copy this link', url) }
  $q.notify({ message: 'Link to this view copied', caption: url.replace(/^https?:\/\//, ''), icon: 'link', color: 'dark', timeout: 2200, position: 'top' })
}

// ── Demo assist ───────────────────────────────────────────────────────────
const autofillOn = ref(props.autofill)
let disposeAutofill = null
const toggleAutofill = (on) => {
  disposeAutofill?.()
  // Tap-to-fill follows the industry picked in intake step 1.
  const persona = () => {
    const v = getVertical(project.project.event.vertical)
    return personaFromSample(v ? getSampleEvent(v.sample || v.id) : null)
  }
  disposeAutofill = on ? enableDemoAutofill({ persona, onFill: () => $q.notify({ message: 'Filled with sample data', icon: 'auto_fix_high', color: 'dark', timeout: 900, position: 'top', group: false }) }) : null
}
watch(autofillOn, toggleAutofill)

/** Jump ahead with a complete sample project (for "just show me" taps). */
function useSample({ key = 'heartland', to = 'concepts', withConcepts = false } = {}) {
  project.loadSample(key)
  loadedExample.value = key
  if (withConcepts) {
    // Concept 0 is the Presto Banner (Brand Signature) on the example's own banner.
    const items = conceptsFor(project.project)
    project.setConcepts(items)
    project.selectConcept(items[0].id)
  }
  go(to, { params: { example: key, concept: withConcepts ? '0' : '' } })
}
function skipStep() {
  if (step.value === 'intake') { if (!project.project.event.name) project.loadSample('heartland'); go('brand') }
  else if (step.value === 'brand') go('concepts')
  else if (step.value === 'concepts') {
    if (!project.selectedConcept) {
      const items = conceptsFor(project.project)
      project.setConcepts(items)
      project.selectConcept(items[0].id)
    }
    go('studio')
  }
}

// ── Screen events ─────────────────────────────────────────────────────────
const hostOf = (url) => { try { return new URL(url).hostname } catch { return '' } }
/** The example whose site this is (for a brand that stays consistent end to end). */
function exampleForSite(url) {
  const host = hostOf(url)
  const s = host && ALL_EXAMPLES.find((x) => hostOf(x.event.websiteUrl || '') === host)
  if (!s) return null
  const vertical = s.vertical || VERTICALS.find((v) => v.sample === s.key)?.id || ''
  return { sample: s, vertical }
}

function startNew(opts = {}) {
  project.reset()
  project.persistence.clear?.()
  loadedExample.value = ''
  // "Paste your website" on the homepage → carried into the brand step. A known
  // example site also sets its industry, so tap-to-fill, the intake example
  // logo, the brand scan and the concept imagery all use that one brand.
  const websiteUrl = typeof opts?.websiteUrl === 'string' ? opts.websiteUrl.trim() : ''
  if (websiteUrl) {
    const full = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`
    const match = exampleForSite(full)
    project.updateEvent({ websiteUrl: full, ...(match ? { vertical: match.vertical, category: match.sample.event.category } : {}) })
    $q.notify({ message: `We'll pull your brand from ${websiteUrl.replace(/^https?:\/\//i, '')}`, icon: 'auto_awesome', color: 'dark', timeout: 2200, position: 'top' })
  }
  go('intake', { params: {} })
}
function onFix(target) {
  const map = { intake: 'intake', brand: 'brand', concepts: 'concepts', studio: 'studio' }
  go(map[target] || 'studio')
}
function openProject(id) {
  const p = session.projects.find((x) => x.id === id)
  if (p) project.load(JSON.parse(JSON.stringify(p)))
  loadedExample.value = ''
  go('studio', { params: {} })
}
const sponsorsOpen = ref(false)

onMounted(async () => {
  toggleAutofill(autofillOn.value)
  if (props.syncHash) {
    window.addEventListener('popstate', onPop)
    const restored = await project.restoreDraft().catch(() => false)
    const r = readRoute()
    // A link naming an example loads it (overriding the draft); other deep
    // links into the journey need a saved project, else fall back to home.
    const hasExample = r ? applyExample(r.params) : false
    if (r && (hasExample || restored || ['home', 'intake', 'dashboard'].includes(r.step))) {
      step.value = r.step
      params.value = r.params
      writeHash(true)
    } else go(step.value, { replace: true })
  }
})
onBeforeUnmount(() => { disposeAutofill?.(); window.removeEventListener('popstate', onPop) })
</script>

<template>
  <div class="fa" :class="{ 'fa--bar': showBar }">
    <!-- Journey bar -->
    <header v-if="showBar" class="fa__bar">
      <button type="button" class="fa__home bs-focusable" aria-label="Brand Studio home" @click="go('home')">
        <q-icon name="auto_awesome" size="18px" /> <span>Brand Studio</span>
      </button>
      <ol class="fa__steps" :aria-label="`Step ${journeyIndex + 1} of ${JOURNEY.length}`">
        <li v-for="(s, i) in JOURNEY" :key="s.id" :class="{ 'is-done': i < journeyIndex, 'is-current': i === journeyIndex }" :aria-current="i === journeyIndex ? 'step' : undefined">
          <span class="fa__dot" aria-hidden="true" />
          <span class="fa__label">{{ s.label }}</span>
        </li>
      </ol>
      <button
        type="button" class="fa__fill bs-focusable" :aria-pressed="autofillOn"
        :title="autofillOn ? 'Tap-to-fill is on: tap an empty field to fill it with sample data' : 'Tap-to-fill is off'"
        @click="autofillOn = !autofillOn"
      >
        <q-icon name="auto_fix_high" size="16px" /><span>Fill {{ autofillOn ? 'on' : 'off' }}</span>
      </button>
      <button v-if="syncHash" type="button" class="fa__link bs-focusable" aria-label="Copy link to this view" title="Copy link to this view (for feedback)" @click="copyLink">
        <q-icon name="link" size="18px" />
      </button>
      <button v-if="['intake', 'brand', 'concepts'].includes(step)" type="button" class="fa__skip bs-focusable" @click="skipStep">
        Skip <q-icon name="fast_forward" size="16px" />
      </button>
    </header>

    <main class="fa__screen">
      <home-option-e v-if="step === 'home'" :example="params.example || 'heartland'" @example="(key) => setParams({ example: key, concept: '' })" @start="startNew" @sample="(key) => useSample({ key: key || 'heartland', to: 'studio', withConcepts: true })" @signin="go('dashboard')" />

      <intake-wizard
        v-else-if="step === 'intake'" :initial-step="Math.max(0, Number(params.step || 1) - 1)"
        @step="(n) => setParams({ step: String(n + 1) })" @complete="go('brand')" @cancel="go('home')"
      />

      <brand-discovery v-else-if="step === 'brand'" @next="go('concepts')" @back="go('intake')" />

      <concept-studio v-else-if="step === 'concepts'" @next="go('studio')" @back="go('brand')" @signup="go('publish')" />

      <studio-editor
        v-else-if="step === 'studio'"
        :view="params"
        @update:view="setParams"
        @example="(key) => { loadedExample = key; setParams({ example: key, concept: '' }) }"
        :show-copy-link="syncHash"
        @copy-link="copyLink"
        @publish="go('publish')" @back="go('concepts')" @change-concept="go('concepts')" @edit-sponsors="sponsorsOpen = true"
      />

      <publish-flow
        v-else-if="step === 'publish'"
        @back="go('studio')" @fix="onFix" @open-demo="go('demo')" @done="go('dashboard')"
      />

      <published-demo-page v-else-if="step === 'demo'" :project="project.project" @create="startNew()" />

      <project-dashboard v-else-if="step === 'dashboard'" @open="openProject" @new="startNew()" @preview="go('demo')" @sign-out="session.signOut(); go('home')" />
    </main>

    <q-dialog v-model="sponsorsOpen" :maximized="$q.screen.lt.sm">
      <q-card class="fa__sponsors">
        <q-card-section class="row items-center no-wrap">
          <div class="bs-title col">Sponsors</div>
          <q-btn v-close-popup flat round dense icon="close" aria-label="Close" />
        </q-card-section>
        <q-card-section class="q-pt-none"><sponsor-editor @saved="sponsorsOpen = false" /></q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.fa { min-height: 100vh; min-height: 100dvh; background: var(--bs-canvas); }
.fa__bar {
  position: sticky; top: 0; z-index: 2000;
  display: flex; align-items: center; gap: 12px;
  height: 52px; padding: 0 12px; padding-top: env(safe-area-inset-top);
  background: rgb(255 255 255 / 0.92); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--bs-line);
  font-family: var(--bs-font);
}
.fa__home { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; padding: 6px; border-radius: 8px; font: 700 0.875rem var(--bs-font); color: var(--bs-ink); cursor: pointer; white-space: nowrap; }
.fa__home .q-icon { color: var(--bs-accent); }
.fa__steps { flex: 1; display: flex; justify-content: center; gap: 4px; list-style: none; margin: 0; padding: 0; min-width: 0; }
.fa__steps li { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; font: 700 0.75rem var(--bs-font); color: var(--bs-ink-faint); }
.fa__steps li.is-done { color: var(--bs-ink-soft); }
.fa__steps li.is-current { color: var(--bs-brand); background: var(--ds-palette-navy-50); }
.fa__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; opacity: 0.6; }
.is-current .fa__dot { opacity: 1; }
.fa__skip { display: inline-flex; align-items: center; gap: 2px; border: 1px solid var(--bs-line); background: var(--bs-surface); border-radius: 999px; padding: 6px 12px; min-height: 32px; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); cursor: pointer; white-space: nowrap; }

.fa__fill { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--bs-accent-line); background: var(--bs-accent-soft); color: var(--bs-accent); border-radius: 999px; padding: 6px 10px; min-height: 32px; font: 700 0.8125rem var(--bs-font); cursor: pointer; white-space: nowrap; }
.fa__fill[aria-pressed='false'] { background: var(--bs-surface); color: var(--bs-ink-soft); border-color: var(--bs-line); }
.fa__link { display: inline-grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--bs-line); background: var(--bs-surface); border-radius: 999px; color: var(--bs-ink); cursor: pointer; flex: none; }
.fa__sponsors { width: min(960px, 100vw); max-width: 100vw; }

/* Phones: compact bar — dots only, current label shown. */
@media (max-width: 640px) {
  .fa__home span { display: none; }
  .fa__steps li { padding: 4px; }
  .fa__steps li .fa__label { display: none; }
  .fa__steps li.is-current .fa__label { display: inline; }
  .fa__bar { gap: 6px; padding-inline: 8px; }
  .fa__fill span, .fa__skip { font-size: 0.75rem; }
}
</style>
