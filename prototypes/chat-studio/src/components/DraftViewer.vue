<script setup>
// A draft full size: its three screens in a carousel, Desktop / Mobile, with
// arrows to step through the other drafts and a way to bring it back.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import ScreensCarousel from './presto/ScreensCarousel.vue'
import { draftView, restoreDraft, state } from '../mockAgent.js'
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
function key(e) {
  if (e.key === 'Escape') emit('close')
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
        <div class="dv__left">
          <div class="dv__seg" role="radiogroup" aria-label="Device">
            <button type="button" role="radio" :aria-checked="device === 'desktop'" :class="{ 'is-on': device === 'desktop' }" @click="device = 'desktop'"><Icon name="monitor" :size="16" /> Desktop</button>
            <button type="button" role="radio" :aria-checked="device === 'mobile'" :class="{ 'is-on': device === 'mobile' }" @click="device = 'mobile'"><Icon name="phone" :size="16" /> Mobile</button>
          </div>
        </div>
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
        <ScreensCarousel :key="draft.id" v-model:screen="screen" :view="view" :device="device" />
      </div>
      <!-- Restoring sits at the bottom, after you've looked the draft over. -->
      <footer v-if="draft.snap && !readonly" class="dv__foot">
        <p>Bring this draft back as the current one. Your newer drafts stay in Concepts.</p>
        <button type="button" class="cs-btn-dark" :disabled="state.working" @click="restore"><Icon name="refresh" :size="16" /> Restore this draft</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.dv { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; padding: 24px; background: rgba(3, 10, 38, 0.55); animation: fade 0.18s ease-out; }
@keyframes fade { from { opacity: 0; } }
.dv__panel { width: min(1100px, 100%); max-height: 100%; overflow-y: auto; border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); outline: none; }
/* Three columns: Desktop / Mobile on the left, the draft name in the true centre, close on the right. */
.dv__head { position: sticky; top: 0; z-index: 4; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 14px 18px; border-bottom: 1px solid var(--line); background: var(--surface); }
.dv__nav { display: flex; align-items: center; gap: 12px; }
.dv__name { text-align: center; min-width: 200px; }
.dv__left { display: flex; align-items: center; justify-self: start; }
.dv__kicker { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
.dv__title { margin: 0; font-size: 20px; }
.dv__tools { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.dv__icon { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); cursor: pointer; }
.dv__icon:hover:not(:disabled) { background: var(--surface-3); }
.dv__icon:disabled { opacity: 0.4; cursor: default; }
.dv__seg { display: inline-flex; padding: 2px; border: 1px solid var(--line-bold); border-radius: var(--r); }
.dv__seg button { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 10px; border: 0; border-radius: 2px; background: none; color: var(--ink-2); font-size: 13px; font-weight: 700; cursor: pointer; }
.dv__seg button.is-on { background: var(--pill); color: var(--pill-ink); }
.dv__body { padding: 18px 28px 24px; }
.dv__foot { position: sticky; bottom: 0; z-index: 4; display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 14px 18px; border-top: 1px solid var(--line); background: var(--surface); }
.dv__foot p { flex: 1; margin: 0; font-size: 14px; color: var(--ink-2); }
@media (max-width: 640px) { .dv__head { grid-template-columns: 1fr auto; justify-items: start; } .dv__nav { grid-column: 1 / -1; grid-row: 1; justify-self: center; } .dv__name { min-width: 0; } .dv { padding: 0; } .dv__panel { border-radius: 0; height: 100%; } .dv__body { padding: 14px; } .dv__foot p { display: none; } .dv__foot .cs-btn-dark { flex: 1; justify-content: center; } }
</style>
