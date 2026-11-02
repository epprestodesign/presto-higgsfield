<script setup>
// PageCopyDialog — edit the text on the Presto page banner: the headline,
// the subheadline (dates · place) and the second subheadline (tagline), each
// with a switch to show or hide it. A live preview shows the landing banner
// and the shorter hotel-page banner; Save writes `project.copy`, which every
// page mockup and the Presto preview read.
import { computed, ref, watch } from 'vue'
import BrandHero from '../brand/BrandHero.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import ScaledFrame from '../marketing/ScaledFrame.vue'
import { toPrestoProject } from '../../banner-lab/studioProjects.js'
import { COPY_LINES, defaultCopy, normalizeCopy, isDefaultCopy } from '../../banner-lab/pageCopy.js'
import { heroProps } from '../preview/previewModel.js'
import { prestoBannerConcept } from '../../providers/ai/conceptFactory.js'

const props = defineProps({
  project: { type: Object, required: true },
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save'])

// The event's own wording, to fill the fields and to fall back on.
const defaults = computed(() => defaultCopy(toPrestoProject({ ...props.project, copy: null })))

const draft = ref(null)
function load() {
  const c = normalizeCopy(props.project.copy)
  draft.value = {
    text: Object.fromEntries(COPY_LINES.map((l) => [l.id, c[l.id] || defaults.value[l.id]])),
    show: { ...c.show },
  }
}
watch(() => props.modelValue, (open) => { if (open) load() }, { immediate: true })

/** The draft as a saved copy: text equal to the event's own is stored as '' (follows the event). */
const asCopy = computed(() => {
  if (!draft.value) return null
  const out = { show: { ...draft.value.show } }
  for (const l of COPY_LINES) {
    const t = (draft.value.text[l.id] || '').trim()
    out[l.id] = t === defaults.value[l.id] ? '' : t
  }
  return normalizeCopy(out)
})
const changed = computed(() => JSON.stringify(asCopy.value) !== JSON.stringify(normalizeCopy(props.project.copy)))
const allDefault = computed(() => isDefaultCopy(asCopy.value))

// Live preview, with the selected banner.
const presto = computed(() => toPrestoProject({ ...props.project, copy: asCopy.value }))
const kit = computed(() => presto.value.brandKit)
const banner = computed(() => props.project.banners.find((b) => b.id === props.project.selectedBannerId) || null)
const concept = computed(() => (banner.value ? prestoBannerConcept(kit.value, { id: banner.value.id, src: banner.value.src, kind: banner.value.kind }) : undefined))
const landing = computed(() => ({ ...heroProps(presto.value, { size: 'landing' }), ...(concept.value ? { concept: concept.value } : {}), headingLevel: 3 }))
const compact = computed(() => ({ ...heroProps(presto.value, { size: 'compact' }), ...(concept.value ? { concept: concept.value } : {}), headingLevel: 3 }))
const nothingShown = computed(() => draft.value && !Object.values(draft.value.show).some(Boolean))

function reset() {
  draft.value = { text: { ...defaults.value }, show: { headline: true, meta: true, tagline: true } }
}
function close() { emit('update:modelValue', false) }
function save() {
  emit('save', allDefault.value ? null : asCopy.value)
  close()
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="draft" class="pc" role="document" aria-labelledby="pc-title">
      <header class="pc__top">
        <span>
          <h2 id="pc-title" class="pc__title">Page text</h2>
          <p class="pc__sub">The words on the banner across the Presto pages. Switch a line off to hide it.</p>
        </span>
        <q-btn flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <div class="pc__preview" aria-label="Preview">
        <p class="pc__plabel">Landing page</p>
        <!-- At the real desktop page width, scaled to fit, so it reads like the page. -->
        <ScaledFrame :design-width="1280" class="pc__hero">
          <BrandThemeProvider :brand-kit="kit" inert><BrandHero v-bind="landing" /></BrandThemeProvider>
        </ScaledFrame>
        <p class="pc__plabel">Hotel listings and hotel details</p>
        <ScaledFrame :design-width="1280" class="pc__hero">
          <BrandThemeProvider :brand-kit="kit" inert><BrandHero v-bind="compact" /></BrandThemeProvider>
        </ScaledFrame>
        <p v-if="nothingShown" class="pc__warn"><q-icon name="info" size="16px" /> Every line is off: the banner shows only the logo and image.</p>
      </div>

      <div class="pc__lines">
        <div v-for="l in COPY_LINES" :key="l.id" class="pc__line" :class="{ 'is-off': !draft.show[l.id] }">
          <q-toggle v-model="draft.show[l.id]" dense color="primary" :aria-label="`Show the ${l.label.toLowerCase()}`" />
          <div class="pc__field">
            <q-input
              v-model="draft.text[l.id]" outlined dense :label="l.label" :disable="!draft.show[l.id]" :placeholder="defaults[l.id]"
              :maxlength="l.id === 'headline' ? 60 : 120" :data-line="l.id"
            />
            <small>{{ l.hint }}</small>
          </div>
        </div>
      </div>

      <footer class="pc__actions">
        <button type="button" class="pc__reset" :disabled="allDefault" @click="reset"><q-icon name="restart_alt" size="16px" /> Use the event’s wording</button>
        <span class="pc__spacer" />
        <q-btn unelevated no-caps class="bs-btn bs-btn--ghost" label="Cancel" @click="close" />
        <q-btn unelevated no-caps class="bs-btn bs-btn--primary" label="Save" :disable="!changed" @click="save" />
      </footer>
    </div>
  </q-dialog>
</template>

<style scoped>
.pc { width: min(760px, calc(100vw - 32px)); max-width: none !important; max-height: calc(100vh - 48px); overflow-y: auto; background: #fff; border-radius: 18px; font-family: var(--bs-font); }
.pc__top { display: flex; align-items: flex-start; gap: 12px; padding: 18px 18px 12px 22px; }
.pc__top > span { flex: 1; }
.pc__title { margin: 0; font: 700 1.125rem/1.3 var(--bs-font); color: var(--bs-ink); }
.pc__sub { margin: 4px 0 0; font-size: 0.8125rem; color: var(--bs-ink-soft); }
.pc__preview { display: grid; gap: 6px; margin: 0 22px; padding: 12px; border-radius: 14px; background: var(--bs-surface-2); }
.pc__plabel { margin: 4px 0 0; font: 700 0.6875rem var(--bs-font); letter-spacing: 0.06em; text-transform: uppercase; color: var(--bs-ink-faint); }
.pc__hero { display: block; border-radius: 10px; overflow: hidden; }
.pc__warn { margin: 4px 0 0; display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--bs-ink-soft); }
.pc__lines { display: grid; gap: 14px; padding: 18px 22px 6px; }
.pc__line { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
.pc__line > .q-toggle { margin-top: 8px; }
.pc__field { display: grid; gap: 4px; min-width: 0; }
.pc__field small { color: var(--bs-ink-faint); font-size: 0.75rem; }
.pc__line.is-off .pc__field small { opacity: 0.6; }
.pc__actions { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 14px 18px 16px 22px; background: #fff; border-top: 1px solid var(--bs-line); margin-top: 12px; }
.pc__spacer { flex: 1; }
.pc__reset { display: inline-flex; align-items: center; gap: 4px; border: 0; background: none; padding: 0; font: 600 0.8125rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.pc__reset:disabled { color: var(--bs-ink-faint); cursor: default; }
</style>
