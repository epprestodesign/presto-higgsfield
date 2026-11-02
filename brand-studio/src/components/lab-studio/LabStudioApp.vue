<script setup>
// Banner Lab Studio (concept) — Stitch-style flow for Presto:
//   Experience 1 · Home       projects (logo extractions + banners) + composer
//   Experience 2 · Project    agent + canvas (brand kit, banners, mockups)
//                             → ▶ Presto preview modal → export
// Concept data (studioProjects.js): seeded from the Brand Studio examples and
// kept in memory; "building" is a mock agent walking its steps.
import { computed, onBeforeUnmount, ref } from 'vue'
import { studio, getProject, createProject, runBuild } from '../../banner-lab/studioProjects.js'
import StudioHome from './StudioHome.vue'
import StudioWorkspace from './StudioWorkspace.vue'
import AuthScreen from '../auth/AuthScreen.vue'
import { generateBanners } from '../../banner-lab/studioGenerate.js'
import { hf } from '../../providers/higgsfield/client.js'
import { siteFromText, siteLabel } from '../../banner-lab/siteBrand.js'
import AccountMenu from '../auth/AccountMenu.vue'
import * as auth from '../../auth/index.js'

const props = defineProps({
  initialProjectId: { type: String, default: '' },
  // Start at the log-in instead of signed in. With Clerk configured
  // (VITE_CLERK_PUBLISHABLE_KEY), an existing Clerk session skips it.
  requireAuth: { type: Boolean, default: false },
  // Real Higgsfield generation for banner sets (spends credits). Off in
  // Storybook, where sets are simulated from the background library.
  liveGeneration: { type: Boolean, default: false },
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

const generator = props.liveGeneration ? generateBanners : undefined
const projectId = ref(props.initialProjectId)
const user = ref(props.requireAuth ? null : { name: 'Justin Girard', email: 'justin@eventpipe.com' })
// Clerk only: hold the log-in until we know whether there's already a session.
const checkingSession = ref(props.requireAuth && auth.authMode() === 'clerk')
let stopListening = () => {}
if (checkingSession.value) {
  auth.loadAuth()
    .then(() => {
      user.value = auth.currentUser()
      // Once in, keep in step with Clerk: sign-out in another tab, org switches.
      // (Signing in goes through AuthScreen's "You're in" step instead.)
      stopListening = auth.onAuthChange((u) => {
        if (!user.value) return
        user.value = u
        if (!u) projectId.value = ''
      })
    })
    .catch((e) => console.error('[auth] Clerk failed to load', e))
    .finally(() => { checkingSession.value = false })
}
onBeforeUnmount(() => stopListening())
async function signOut() {
  try { await auth.signOut() } catch (e) { console.error('[auth] sign-out failed', e) }
  user.value = null
  projectId.value = ''
}
const project = computed(() => (projectId.value ? getProject(projectId.value) : null))

function create(input) {
  const p = createProject(input)
  projectId.value = p.id
  runBuild(p, { stepMs: props.stepMs, generate: generator })
}
// From the Home prompt. Live (the real app): a website in the prompt and no
// logo attached → fetch the site's logo, colours and fonts first; Logo mode
// with neither asks for one rather than falling back to a sample logo.
const lookingUp = ref(false)
const homeNotice = ref('')
async function createFromHome(input) {
  homeNotice.value = ''
  if (props.liveGeneration && !input.logo) {
    const site = siteFromText(input.prompt)
    if (site) {
      lookingUp.value = true
      homeNotice.value = `Getting the logo from ${siteLabel(site)}…`
      try {
        const brand = await hf.brand(site)
        input = { ...input, logo: { src: brand.logo.src, name: brand.name }, brand }
        homeNotice.value = ''
      } catch (e) {
        homeNotice.value = e?.message || `Couldn’t get a logo from ${siteLabel(site)}. Drop the logo in instead.`
        return
      } finally {
        lookingUp.value = false
      }
    } else if (input.mode === 'logo') {
      homeNotice.value = 'Drop in your logo, or type its website (like espn.com) and I’ll get it.'
      return
    }
  }
  create(input)
}
if (props.buildDemo) create({ modelId: 'auto', references: [], logo: null, ...props.buildDemo })
const count = computed(() => studio.projects.length)
</script>

<template>
  <div class="lsa">
    <div v-if="checkingSession" class="lsa__checking" role="status" aria-label="Checking your session"><q-spinner size="32px" /></div>
    <AuthScreen v-else-if="!user" class="lsa__auth" @signed-in="(u) => (user = u)" />
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
        :initial-logo="homeLogo" :initial-references="homeReferences" :busy="lookingUp" :notice="homeNotice" @open="(id) => (projectId = id)" @create="createFromHome"
      />
    </template>
    <StudioWorkspace v-else :key="project.id" :project="project" :preview-open="previewOpen" :export-open="exportOpen" :preview-page="previewPage" :preview-device="previewDevice" :tutorial-open="tutorialOpen" :generate="generator" :user="user" @home="projectId = ''" @sign-out="signOut" />
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
.lsa__checking { flex: 1; display: grid; place-items: center; color: var(--bs-ink-soft); }
@media (max-width: 600px) { .lsa__top { gap: 4px; padding: 10px 12px; } .lsa__count, .lsa__link { display: none; } }
.lsa > .ws, .lsa > :deep(.ws) { flex: 1; }
</style>
