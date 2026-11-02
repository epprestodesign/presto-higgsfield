<script setup>
// Presto Banner Lab — a standalone prototype with two modes behind one switcher:
//   Logo                make a logo Presto-ready (transparent, vector, sized)
//   Background graphics describe + reference → optimized Higgsfield prompt →
//                       generate → fit to 1440×400 / 1440×240 → export
// Like WhatTheFont, an image can be dropped anywhere on the page or pasted;
// it goes to whichever mode is open. Deep links: #/logo, #/background.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createBannerLab, MODES } from '../../banner-lab/useBannerLab.js'
import LogoMode from './LogoMode.vue'
import BackgroundMode from './BackgroundMode.vue'

const props = defineProps({
  sampleMode: { type: Boolean, default: false },
  initialMode: { type: String, default: '' },
  syncHash: { type: Boolean, default: false },
})

const lab = createBannerLab({ sampleMode: props.sampleMode })
const s = lab.s
if (props.initialMode) s.mode = props.initialMode

// ── Deep links: #/<mode>/<step> ───────────────────────────────────────────
// A step that isn't open yet (e.g. #/logo/vector before a logo exists) falls
// back to the mode's current step.
const hashFor = () => `#/${s.mode}/${s.mode === 'logo' ? s.logoStep : s.bgStep}`
function fromHash() {
  const m = /^#\/(logo|background)(?:\/([a-z]+))?/.exec(window.location.hash)
  if (!m) return
  s.mode = m[1]
  if (m[2]) (m[1] === 'logo' ? lab.goLogo : lab.goBg)(m[2])
  if (window.location.hash !== hashFor()) history.replaceState(null, '', hashFor())
}
if (props.syncHash) {
  fromHash()
  watch(hashFor, (h) => { if (window.location.hash !== h) history.pushState(null, '', h) }, { immediate: true })
}
// Each step starts at the top of the page.
watch(() => [s.mode, s.logoStep, s.bgStep], () => window.scrollTo({ top: 0, behavior: 'smooth' }))

// ── Drop anywhere / paste ────────────────────────────────────────────────
const dragging = ref(false)
let depth = 0
const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files')
function onEnter(e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; dragging.value = true }
function onOver(e) { if (hasFiles(e)) e.preventDefault() }
function onLeave(e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) dragging.value = false }
function onDrop(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
  depth = 0
  dragging.value = false
  lab.dropFiles(e.dataTransfer.files)
}
function onPaste(e) {
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) return
  const files = [...(e.clipboardData?.files || [])]
  if (files.length) { e.preventDefault(); lab.dropFiles(files) }
}

onMounted(() => {
  lab.checkHealth()
  window.addEventListener('dragenter', onEnter)
  window.addEventListener('dragover', onOver)
  window.addEventListener('dragleave', onLeave)
  window.addEventListener('drop', onDrop)
  window.addEventListener('paste', onPaste)
  if (props.syncHash) {
    window.addEventListener('hashchange', fromHash)
    window.addEventListener('popstate', fromHash)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onEnter)
  window.removeEventListener('dragover', onOver)
  window.removeEventListener('dragleave', onLeave)
  window.removeEventListener('drop', onDrop)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('hashchange', fromHash)
  window.removeEventListener('popstate', fromHash)
})
</script>

<template>
  <div class="bl">
    <header class="bl__top">
      <div class="bl__brand">
        <span class="bl__mark" aria-hidden="true"><q-icon name="auto_awesome" size="18px" /></span>
        <span><strong>Presto Banner Lab</strong><small>Prototype</small></span>
      </div>

      <nav class="bl__switch" role="tablist" aria-label="What are you making?">
        <button
          v-for="m in MODES" :key="m.id" type="button" role="tab" class="bl__tab bs-focusable"
          :class="{ 'is-on': s.mode === m.id }" :aria-selected="s.mode === m.id" @click="s.mode = m.id"
        >
          <q-icon :name="m.icon" size="20px" />
          <span><strong>{{ m.label }}</strong><small>{{ m.hint }}</small></span>
        </button>
      </nav>

      <div class="bl__status">
        <span v-if="!s.health.checked" class="bs-pill">Checking…</span>
        <span v-else-if="lab.live.value" class="bs-pill bs-pill--ai" :title="`Key ${s.health.keyId}`"><q-icon name="bolt" size="14px" /> Live · Higgsfield</span>
        <span v-else class="bs-pill" :title="s.health.proxy ? 'Add HIGGSFIELD_API_KEY_ID and _SECRET to .env' : 'Static build: no API access'"><q-icon name="science" size="14px" /> Sample mode</span>
        <q-toggle v-if="s.health.configured" v-model="s.forceSample" dense size="sm" color="primary" label="Samples" />
      </div>
    </header>

    <main class="bl__main">
      <LogoMode v-if="s.mode === 'logo'" />
      <BackgroundMode v-else />
    </main>

    <div v-if="dragging" class="bl__drop" aria-hidden="true">
      <div>
        <q-icon name="file_download" size="48px" />
        <p>{{ s.mode === 'logo' ? 'Drop your logo' : 'Drop reference images' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bl { min-height: 100vh; background: var(--bs-canvas); font-family: var(--bs-font); }
.bl__top {
  position: sticky; top: 0; z-index: 20; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px;
  padding: 10px 24px; background: rgb(255 255 255 / 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--bs-line);
}
.bl__brand { display: flex; align-items: center; gap: 10px; }
.bl__mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--bs-brand); color: #fff; }
.bl__brand strong { display: block; font-size: 0.9375rem; color: var(--bs-ink); }
.bl__brand small { font-size: 0.75rem; color: var(--bs-ink-soft); }
.bl__switch { display: flex; gap: 4px; padding: 4px; border-radius: 14px; background: var(--bs-surface-2); border: 1px solid var(--bs-line); }
.bl__tab {
  display: flex; align-items: center; gap: 10px; padding: 8px 16px; border: 0; border-radius: 10px; background: transparent;
  cursor: pointer; text-align: left; font-family: var(--bs-font); color: var(--bs-ink-soft);
}
.bl__tab strong { display: block; font-size: 0.9375rem; }
.bl__tab small { display: block; font-size: 0.75rem; }
.bl__tab.is-on { background: var(--bs-surface); color: var(--bs-ink); box-shadow: var(--bs-shadow-1); }
.bl__tab.is-on .q-icon { color: var(--bs-accent); }
.bl__status { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
.bl__main { max-width: 1240px; margin: 0 auto; padding: 40px 24px 80px; }
.bl__drop {
  position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; background: rgb(3 10 38 / 0.55);
  pointer-events: none;
}
.bl__drop > div {
  display: grid; justify-items: center; gap: 8px; padding: 40px 60px; border-radius: var(--bs-radius-xl);
  border: 3px dashed #fff; color: #fff; font: 700 1.25rem var(--bs-font); background: rgb(124 58 237 / 0.35);
}
.bl__drop p { margin: 0; }
.bl__main :deep(.bl-step__head) { margin-bottom: 20px; }
.bl__main :deep(.bl-step__head .bs-title) { margin-top: 6px; }
.bl__main :deep(.bl-step__head .bs-body) { margin-top: 6px; max-width: 720px; }
.bl__main :deep(.bl-check) {
  aspect-ratio: 1; display: grid; place-items: center; overflow: hidden; border-radius: var(--bs-radius-md); border: 1px solid var(--bs-line);
  background: repeating-conic-gradient(#e7e9ef 0% 25%, #fff 0% 50%) 50% / 16px 16px;
}
.bl__main :deep(.bl-check img) { max-width: 82%; max-height: 82%; object-fit: contain; transition: transform 0.2s ease; }
.bl__main :deep(.bl-check--wide) { aspect-ratio: 4 / 3; }
@media (max-width: 900px) {
  .bl__top { grid-template-columns: 1fr auto; }
  .bl__switch { grid-column: 1 / -1; grid-row: 2; justify-self: stretch; }
  .bl__tab { flex: 1; }
  .bl__tab small { display: none; }
}
</style>
