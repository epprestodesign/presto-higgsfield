<script setup>
// Chat Studio — prototype of a chat-first Banner Lab. Rail on the left (New
// project, Banners / Logos / Pages, History); a project is one vertical
// conversation on the right. Every view has a deep link (see router.js and
// #/map). Standalone: mock data only, no auth, database or generation.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import './styles.css'
import ProjectRail from './components/ProjectRail.vue'
import HomeHero from './components/HomeHero.vue'
import TeamFeed from './components/TeamFeed.vue'
import LibraryView from './components/LibraryView.vue'
import MapView from './components/MapView.vue'
import ProjectThread from './components/ProjectThread.vue'
import Icon from './components/Icon.vue'
import { state, activeProject, createProject, seed, projectBySlug } from './mockAgent.js'
import { route, go, startRouter } from './router.js'

const props = defineProps({
  /** Open this sample on load: 'heartland', 'fintech', 'wedding', 'golf'. */
  openBrand: { type: String, default: '' },
  /** Send this as a new project on load (watch the agent work). */
  autoPrompt: { type: String, default: '' },
  theme: { type: String, default: 'light' },
  /** 1 = normal pacing, 0.4 = faster. */
  speed: { type: Number, default: 1 },
})

const theme = ref(props.theme)
const dark = ref(false)
let mq
function syncSystem() { dark.value = mq?.matches }
const resolved = computed(() => (theme.value === 'system' ? (dark.value ? 'dark' : 'light') : theme.value))
watch(() => props.theme, (t) => { theme.value = t })

const railOpen = ref(false)
const project = computed(() => activeProject())

async function start(text, opts) {
  railOpen.value = false
  await createProject(text, opts)
}

// The route decides what's on screen.
const ready = ref(false)
watch(() => [route.view, route.project, route.library, ready.value], () => {
  if (!ready.value) return
  if (route.view === 'new') {
    if (route.prompt && !state.working) start(route.prompt, { mode: route.mode })
    else go({ view: 'home' })
    return
  }
  const p = route.view === 'project' ? projectBySlug(route.project) : null
  if (route.view === 'project' && !p) { go({ view: 'home' }); return }
  state.activeId = p?.id || null
  state.library = route.view === 'library' ? route.library : null
}, { immediate: true })

onMounted(async () => {
  mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  syncSystem()
  mq?.addEventListener?.('change', syncSystem)
  await seed()
  state.speed = props.speed
  startRouter()
  // Storybook / ?open= / ?prompt= entry points (when the URL has no #/ route).
  if (!location.hash || location.hash === '#/') {
    if (props.openBrand) go({ view: 'project', project: props.openBrand })
    else if (props.autoPrompt) go({ view: 'new', prompt: props.autoPrompt })
  }
  ready.value = true
})
onBeforeUnmount(() => mq?.removeEventListener?.('change', syncSystem))
</script>

<template>
  <div class="cs" :data-theme="resolved" :class="{ 'rail-open': railOpen }">
    <div class="cs__rail">
      <ProjectRail :theme="theme" @theme="theme = $event" @navigate="railOpen = false" />
    </div>
    <div v-if="railOpen" class="cs__scrim" @click="railOpen = false" />

    <main class="cs__main">
      <button type="button" class="cs__menu" aria-label="Show projects" @click="railOpen = true"><Icon name="sidebar" /></button>
      <ProjectThread v-if="project" :key="project.id" :project="project" />
      <LibraryView v-else-if="state.library" :kind="state.library" />
      <MapView v-else-if="route.view === 'map'" />
      <div v-else class="cs__home"><HomeHero :working="state.working" @send="start" /><TeamFeed /></div>
    </main>

    <transition name="toast"><p v-if="state.toast" class="cs__toast" role="status">{{ state.toast }}</p></transition>
  </div>
</template>

<style scoped>
.cs__rail { min-height: 0; }
.cs__main { position: relative; min-width: 0; min-height: 0; }
.cs__home { height: 100%; overflow-y: auto; scrollbar-gutter: stable; }
.cs__menu { display: none; }
.cs__toast { position: absolute; left: 50%; bottom: 112px; transform: translateX(-50%); z-index: 40; margin: 0; padding: 10px 18px; border-radius: 999px; background: var(--pill); color: var(--pill-ink); font-size: 14px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
@media (max-width: 900px) {
  .cs__rail { position: absolute; inset: 0 auto 0 0; width: min(320px, 86vw); z-index: 30; transform: translateX(-100%); transition: transform 0.25s ease; }
  .cs.rail-open .cs__rail { transform: none; box-shadow: 20px 0 60px rgba(0, 0, 0, 0.2); }
  .cs__scrim { position: absolute; inset: 0; z-index: 25; background: rgba(10, 12, 20, 0.35); }
  .cs__menu { display: grid; place-items: center; position: absolute; top: 14px; left: 12px; z-index: 5; width: 42px; height: 42px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); cursor: pointer; }
  .cs__main :deep(.ph) { padding-left: 66px; }
}
</style>
