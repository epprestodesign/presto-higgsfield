<script setup>
// Banner Lab Studio (concept) — Stitch-style flow for Presto:
//   Experience 1 · Home       projects (logo extractions + banners) + composer
//   Experience 2 · Project    agent + canvas (brand kit, banners, mockups)
//                             → ▶ Presto preview modal → export
// Concept data (studioProjects.js): seeded from the Brand Studio examples and
// kept in memory; "building" is a mock agent walking its steps.
import { computed, ref } from 'vue'
import { studio, getProject, createProject, runBuild } from '../../banner-lab/studioProjects.js'
import StudioHome from './StudioHome.vue'
import StudioWorkspace from './StudioWorkspace.vue'
import AuthScreen from '../auth/AuthScreen.vue'
import AccountMenu from '../auth/AccountMenu.vue'

const props = defineProps({
  initialProjectId: { type: String, default: '' },
  // Start at the log-in (Banner Lab auth, mock Clerk) instead of signed in.
  requireAuth: { type: Boolean, default: false },
  // Story hooks
  modelMenuOpen: { type: Boolean, default: false },
  homeText: { type: String, default: '' },
  homeMode: { type: String, default: 'banner' },
  homeLogo: { type: Object, default: null },
  homeReferences: { type: Array, default: () => [] },
  previewOpen: { type: Boolean, default: false },
  exportOpen: { type: Boolean, default: false },
  previewPage: { type: String, default: 'landing' },
  previewDevice: { type: String, default: 'desktop' },
  tutorialOpen: { type: Boolean, default: false },
  buildDemo: { type: Object, default: null }, // start a project on mount: { prompt, mode }
  stepMs: { type: Number, default: 650 },
})

const projectId = ref(props.initialProjectId)
const user = ref(props.requireAuth ? null : { name: 'Justin Girard', email: 'justin@eventpipe.com' })
function signOut() { user.value = null; projectId.value = '' }
const project = computed(() => (projectId.value ? getProject(projectId.value) : null))

function create(input) {
  const p = createProject(input)
  projectId.value = p.id
  runBuild(p, { stepMs: props.stepMs })
}
if (props.buildDemo) create({ modelId: 'auto', references: [], logo: null, ...props.buildDemo })
const count = computed(() => studio.projects.length)
</script>

<template>
  <div class="lsa">
    <AuthScreen v-if="!user" class="lsa__auth" @signed-in="(u) => (user = u)" />
    <template v-else-if="!project">
      <header class="lsa__top">
        <span class="lsa__brand">Banner Lab <span class="lsa__beta">BETA</span></span>
        <span class="lsa__spacer" />
        <a href="#" class="lsa__link" @click.prevent><q-icon name="article" size="18px" /> Docs</a>
        <span class="lsa__count bs-caption">{{ count }} projects</span>
        <q-btn round flat dense icon="redeem" aria-label="What’s new" />
        <q-btn round flat dense icon="more_vert" aria-label="More" />
        <AccountMenu :user="user" @sign-out="signOut" />
      </header>
      <StudioHome
        class="lsa__home" :model-menu-open="modelMenuOpen" :initial-text="homeText" :initial-mode="homeMode"
        :initial-logo="homeLogo" :initial-references="homeReferences" @open="(id) => (projectId = id)" @create="create"
      />
    </template>
    <StudioWorkspace v-else :key="project.id" :project="project" :preview-open="previewOpen" :export-open="exportOpen" :preview-page="previewPage" :preview-device="previewDevice" :tutorial-open="tutorialOpen" :user="user" @home="projectId = ''" @sign-out="signOut" />
  </div>
</template>

<style scoped>
.lsa { height: 100vh; display: flex; flex-direction: column; background: #eceef2 radial-gradient(circle, rgb(3 10 38 / 0.08) 1px, transparent 1.2px) 0 0 / 18px 18px; font-family: var(--bs-font); }
.lsa__top { display: flex; align-items: center; gap: 12px; padding: 12px 20px; }
.lsa__brand { white-space: nowrap; font: 500 1.375rem var(--bs-font); letter-spacing: -0.02em; color: var(--bs-ink); display: inline-flex; align-items: center; gap: 8px; }
.lsa__beta { font: 700 0.625rem var(--bs-font); letter-spacing: 0.08em; padding: 2px 7px; border: 1px solid var(--bs-ink-soft); border-radius: 999px; color: var(--bs-ink-soft); }
.lsa__spacer { flex: 1; }
.lsa__link { display: inline-flex; align-items: center; gap: 4px; font: 500 0.8125rem var(--bs-font); color: var(--bs-ink); text-decoration: none; }
.lsa__home { flex: 1; min-height: 0; }
.lsa__auth { flex: 1; }
@media (max-width: 600px) { .lsa__top { gap: 4px; padding: 10px 12px; } .lsa__count, .lsa__link { display: none; } }
.lsa > .ws, .lsa > :deep(.ws) { flex: 1; }
</style>
