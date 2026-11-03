<script setup>
// A draft full size: its three screens in a carousel, Desktop / Mobile, with
// arrows to step through the other drafts. At the bottom: change the logo
// (its look, or upload a new one), bring an older draft back, and export the
// graphics for this draft.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import ScreensCarousel from './presto/ScreensCarousel.vue'
import LogoMark from './LogoMark.vue'
import ExportCard from './cards/ExportCard.vue'
import { draftView, restoreDraft, state, LOGO_LOOKS, uploadLogo } from '../mockAgent.js'
import { route } from '../router.js'

const props = defineProps({
  project: { type: Object, required: true },
  draft: { type: Object, required: true },
  /** Someone else's work: no draft numbers, no restore. */
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'restored', 'go'])
// Device and screen live in the route, so a link opens this exact view.
const device = computed({ get: () => route.device, set: (d) => { route.device = d } })
const screen = computed({ get: () => route.screen, set: (s) => { route.screen = s } })
const view = computed(() => draftView(props.project, props.draft))
const i = computed(() => props.project.drafts.indexOf(props.draft))
const dialog = ref(null)

function restore() { restoreDraft(props.project, props.draft); emit('restored') }

// Logo: the look applies to the draft you're looking at (the live project for
// the current draft). A new logo goes through the chat and becomes a new draft,
// which the viewer then shows.
function setLook(id) { view.value.look = id }
const picker = ref(null)
function onLogoFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  uploadLogo(props.project, f)
  route.draft = props.project.drafts.length || route.draft
}
const banner = computed(() => (view.value.selected || view.value.brand.images[0]).src)

// Export graphics (?sheet=export).
const exporting = computed({ get: () => route.sheet === 'export', set: (v) => { route.sheet = v ? 'export' : '' } })
function key(e) {
  if (e.key === 'Escape') { if (exporting.value) exporting.value = false; else emit('close') }
  if (e.key === 'ArrowLeft' && e.altKey && i.value > 0) emit('go', props.project.drafts[i.value - 1])
  if (e.key === 'ArrowRight' && e.altKey && i.value < props.project.drafts.length - 1) emit('go', props.project.drafts[i.value + 1])
}
onMounted(() => { document.addEventListener('keydown', key); dialog.value?.focus() })
onBeforeUnmount(() => document.removeEventListener('keydown', key))
</script>

<template>
  <div class="dv" @click.self="emit('close')">
    <section ref="dialog" class="dv__panel" role="dialog" aria-modal="true" :aria-label="`Draft ${draft.n}`" tabindex="-1">
      <header class="dv__head">
        <span class="dv__spacer" aria-hidden="true" />
        <div class="dv__nav">
          <button v-if="!readonly" type="button" class="dv__icon" :disabled="i <= 0" aria-label="Older draft" @click="emit('go', project.drafts[i - 1])"><Icon name="left" :size="18" /></button>
          <div class="dv__name">
            <p class="dv__kicker"><template v-if="readonly">From your team</template><template v-else>Draft {{ draft.n }} of {{ project.drafts.length }}<span v-if="!draft.snap"> · Current</span></template></p>
            <h2 class="dv__title">{{ draft.label }}</h2>
          </div>
          <button v-if="!readonly" type="button" class="dv__icon" :disabled="i >= project.drafts.length - 1" aria-label="Newer draft" @click="emit('go', project.drafts[i + 1])"><Icon name="right" :size="18" /></button>
        </div>
        <div class="dv__tools">
          <button type="button" class="dv__icon" aria-label="Close" @click="emit('close')"><Icon name="x" :size="18" /></button>
        </div>
      </header>
      <div class="dv__body">
        <ScreensCarousel :key="draft.id" v-model:screen="screen" :view="view" :device="device">
          <template #toolbar>
            <div class="cs-tabs" role="radiogroup" aria-label="Device">
              <button type="button" role="radio" :aria-checked="device === 'desktop'" class="cs-tab" :class="{ 'is-on': device === 'desktop' }" @click="device = 'desktop'"><Icon name="monitor" :size="16" /> Desktop</button>
              <button type="button" role="radio" :aria-checked="device === 'mobile'" class="cs-tab" :class="{ 'is-on': device === 'mobile' }" @click="device = 'mobile'"><Icon name="phone" :size="16" /> Mobile</button>
            </div>
          </template>
        </ScreensCarousel>
      </div>
      <!-- Actions sit at the bottom, after you've looked the draft over. -->
      <footer class="dv__foot">
        <div v-if="!readonly" class="dv__logo">
          <span class="dv__label">Logo</span>
          <div class="cs-tabs" role="radiogroup" aria-label="Logo look">
            <button
              v-for="l in LOGO_LOOKS" :key="l.id" type="button" role="radio" class="cs-tab cs-tab--sm" :class="{ 'is-on': view.look === l.id }"
              :aria-checked="view.look === l.id" :title="l.note" @click="setLook(l.id)"
            >
              <span class="dv__stage" :style="{ backgroundImage: `url(${banner})` }"><LogoMark :project="view" :look="l.id" :size="20" /></span>
              {{ l.label }}
            </button>
            <button type="button" class="cs-tab cs-tab--sm" :disabled="state.working" @click="picker.click()"><Icon name="clip" :size="16" /> Add a new logo</button>
            <input ref="picker" type="file" accept="image/*" hidden aria-label="Choose a logo file" @change="onLogoFile" />
          </div>
        </div>
        <div class="dv__actions">
          <button v-if="draft.snap && !readonly" type="button" class="cs-btn-ghost dv__restore" :disabled="state.working" title="Bring this draft back as the current one. Newer drafts stay in Concepts." @click="restore">
            <Icon name="refresh" :size="16" /> Restore this draft
          </button>
          <button type="button" class="cs-btn-dark" @click="exporting = true"><Icon name="download" :size="18" /> Export graphics</button>
        </div>
      </footer>

      <!-- Export graphics: the files for this draft. -->
      <div v-if="exporting" class="dv__sheet" @click.self="exporting = false">
        <div class="dv__sheetbox" role="dialog" aria-modal="true" aria-label="Export graphics">
          <button type="button" class="dv__icon dv__sheetclose" aria-label="Close export" @click="exporting = false"><Icon name="x" :size="18" /></button>
          <ExportCard :project="view" />
          <p class="dv__sheetnote">From {{ readonly ? draft.label : `draft ${draft.n} · ${draft.label}` }}: the logo as it shows on this draft, and its banner, sized for Presto.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dv { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; padding: 24px; background: rgba(3, 10, 38, 0.55); animation: fade 0.18s ease-out; }
@keyframes fade { from { opacity: 0; } }
.dv__panel { width: min(1100px, 100%); max-height: 100%; overflow-y: auto; border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); outline: none; }
/* Three columns so the draft name sits in the true centre, with close on the right. */
.dv__head { position: sticky; top: 0; z-index: 4; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 14px 18px; border-bottom: 1px solid var(--line); background: var(--surface); }
.dv__nav { display: flex; align-items: center; gap: 12px; }
.dv__name { text-align: center; min-width: 200px; }
.dv__kicker { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
.dv__title { margin: 0; font-size: 20px; }
.dv__tools { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.dv__icon { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); cursor: pointer; }
.dv__icon:hover:not(:disabled) { background: var(--surface-3); }
.dv__icon:disabled { opacity: 0.4; cursor: default; }
.dv__body { padding: 18px 28px 24px; }
.dv__foot { position: sticky; bottom: 0; z-index: 4; display: flex; align-items: center; gap: 12px 16px; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid var(--line); background: var(--surface); }
.dv__logo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dv__label { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.dv__stage { display: grid; place-items: center; width: 34px; height: 24px; margin-left: -6px; border-radius: 999px; background: center / cover; }
.dv__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.dv__restore { min-height: 44px; }
.dv__sheet { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px; background: rgba(3, 10, 38, 0.45); }
.dv__sheetbox { position: relative; width: min(620px, 100%); max-height: 100%; overflow-y: auto; }
.dv__sheetclose { position: absolute; top: 16px; right: 16px; z-index: 1; }
.dv__sheetbox :deep(.card__aside) { margin-right: 48px; }
.dv__sheetnote { margin: 10px 4px 0; font-size: 13px; color: #fff; }
@media (max-width: 640px) { .dv__head { grid-template-columns: 1fr auto; } .dv__spacer { display: none; } .dv__nav { justify-self: start; } .dv__name { min-width: 0; } .dv { padding: 0; } .dv__panel { border-radius: 0; height: 100%; } .dv__body { padding: 14px; } .dv__actions { width: 100%; } .dv__actions > * { flex: 1; justify-content: center; } .dv__sheet { padding: 12px; } }
</style>
