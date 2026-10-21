<script setup>
// BrandScanPanel — "Scan my website": URL → staged extraction progress →
// suggestion card with explicit, per-item approval. Nothing touches the Brand
// Kit until the organizer presses "Apply selected". Undo is offered after.
import { ref, reactive, computed, onMounted, onBeforeUnmount, useId } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { getFont } from '../../theme/fonts.js'
import { EXTRACTION_STAGES, extractBrandFromUrl } from './mockBrandExtractor.js'

const props = defineProps({
  initialUrl: { type: String, default: '' },
  autoScan: { type: Boolean, default: false },
  delayMs: { type: Number, default: 650 },
})

const project = useProjectStore()
const id = useId()
const url = ref(props.initialUrl || project.event.websiteUrl || '')
const state = ref('idle') // idle | scanning | ready | error | applied
const stageIndex = ref(-1)
const suggestion = ref(null)
const error = ref('')
const pick = reactive({ logo: true, colors: true, fonts: true })
const undoSnapshot = ref(null)
let controller = null

const CONF = { high: 'High confidence', medium: 'Likely match', low: 'Low confidence' }

async function scan() {
  error.value = ''
  suggestion.value = null
  state.value = 'scanning'
  stageIndex.value = 0
  controller = new AbortController()
  try {
    const s = await extractBrandFromUrl(url.value, {
      delayMs: props.delayMs,
      signal: controller.signal,
      onStage: (i) => { stageIndex.value = i },
    })
    suggestion.value = s
    pick.logo = !!s.logo
    pick.colors = true
    pick.fonts = true
    stageIndex.value = EXTRACTION_STAGES.length
    state.value = 'ready'
  } catch (e) {
    if (e.code === 'canceled') { state.value = 'idle'; return }
    error.value = e.message
    state.value = 'error'
  }
}

const cancel = () => controller?.abort()

const anyPicked = computed(() => pick.logo || pick.colors || pick.fonts)

function apply() {
  const s = suggestion.value
  const bk = project.brandKit
  undoSnapshot.value = JSON.parse(JSON.stringify({ logo: bk.logo, logoOnDark: bk.logoOnDark, colors: bk.colors, typography: bk.typography, source: bk.source }))
  const patch = {}
  if (pick.logo && s.logo) { patch.logo = s.logo; patch.logoOnDark = s.logoOnDark }
  if (pick.colors) patch.colors = { ...bk.colors, ...s.colors }
  if (pick.fonts) patch.typography = { ...s.typography }
  project.applyBrandSuggestion(patch)
  if (s.url && !project.event.websiteUrl) project.updateEvent({ websiteUrl: s.url })
  state.value = 'applied'
}

function undo() {
  if (undoSnapshot.value) project.updateBrandKit(undoSnapshot.value)
  undoSnapshot.value = null
  state.value = 'ready'
}

const reset = () => { state.value = 'idle'; suggestion.value = null; error.value = '' }

const liveMessage = computed(() => {
  if (state.value === 'scanning' && EXTRACTION_STAGES[stageIndex.value]) return `${EXTRACTION_STAGES[stageIndex.value].label}…`
  if (state.value === 'ready') return 'Suggestions are ready to review.'
  if (state.value === 'applied') return 'Suggestions applied to your brand kit.'
  if (state.value === 'error') return error.value
  return ''
})

onMounted(() => { if (props.autoScan && url.value) scan() })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="scan" :aria-labelledby="`${id}-title`">
    <div class="scan__glow" aria-hidden="true" />
    <div class="scan__head">
      <span class="bs-pill bs-pill--ai"><q-icon name="auto_awesome" size="14px" /> Brand discovery</span>
      <h2 :id="`${id}-title`" class="bs-title">Scan your website for a head start</h2>
      <p class="bs-body">We’ll read your public homepage and suggest a logo, colors and fonts. You review everything before it’s used.</p>
    </div>

    <p class="bs-sr-only" role="status" aria-live="polite">{{ liveMessage }}</p>

    <!-- IDLE / ERROR: URL input -->
    <form v-if="state === 'idle' || state === 'error'" class="scan__form" novalidate @submit.prevent="scan">
      <q-input
        v-model="url"
        outlined
        dense
        bg-color="white"
        type="url"
        inputmode="url"
        label="Website"
        placeholder="yourevent.com"
        class="scan__input"
        autocomplete="url"
        :error="state === 'error'"
        :error-message="error"
        :aria-invalid="state === 'error'"
      >
        <template #prepend><q-icon name="language" /></template>
      </q-input>
      <q-btn type="submit" no-caps unelevated class="bs-btn bs-btn--ai scan__go" icon="travel_explore" :label="state === 'error' ? 'Try again' : 'Scan my website'" :disable="!url.trim()" />
    </form>
    <p v-if="state === 'idle' || state === 'error'" class="scan__fine"><q-icon name="lock" size="14px" /> Public pages only. We never sign in, and nothing changes until you approve it.</p>

    <!-- SCANNING -->
    <div v-else-if="state === 'scanning'" class="scan__progress">
      <ol class="scan__stages">
        <li v-for="(s, i) in EXTRACTION_STAGES" :key="s.id" :class="{ 'is-done': i < stageIndex, 'is-active': i === stageIndex }">
          <span class="scan__stage-ic">
            <q-icon v-if="i < stageIndex" name="check" size="16px" />
            <q-spinner v-else-if="i === stageIndex" size="16px" />
            <span v-else class="scan__stage-dot" />
          </span>
          {{ s.label }}
        </li>
      </ol>
      <q-linear-progress :value="(stageIndex + 0.5) / EXTRACTION_STAGES.length" rounded size="6px" class="scan__bar" color="purple-7" track-color="white" :aria-label="`Scanning ${url}`" />
      <div class="scan__row">
        <span class="bs-caption">Scanning {{ url.replace(/^https?:\/\//, '') }}</span>
        <q-btn flat no-caps dense class="bs-btn" label="Cancel" @click="cancel" />
      </div>
    </div>

    <!-- READY: review + approve -->
    <div v-else-if="state === 'ready' && suggestion" class="scan__result">
      <p class="scan__found"><q-icon name="check_circle" size="18px" /> Here’s what we found on <strong>{{ suggestion.hostname }}</strong>. Choose what to use.</p>
      <div class="scan__items">
        <div class="scan__item" :class="{ 'is-off': !pick.logo }">
          <span class="scan__item-body">
            <span class="scan__item-title"><q-checkbox v-model="pick.logo" :disable="!suggestion.logo" dense label="Logo" class="scan__check" /> <span class="scan__conf" :class="`is-${suggestion.confidence.logo}`">{{ CONF[suggestion.confidence.logo] }}</span></span>
            <span class="scan__logo"><img v-if="suggestion.logo" :src="suggestion.logo.src" :alt="suggestion.logo.alt" /><span v-else class="bs-caption">No logo found</span></span>
          </span>
        </div>
        <div class="scan__item" :class="{ 'is-off': !pick.colors }">
          <span class="scan__item-body">
            <span class="scan__item-title"><q-checkbox v-model="pick.colors" dense label="Colors" class="scan__check" /> <span class="scan__conf" :class="`is-${suggestion.confidence.colors}`">{{ CONF[suggestion.confidence.colors] }}</span></span>
            <span class="scan__swatches">
              <span v-for="role in ['primary', 'secondary', 'accent', 'ink']" :key="role" class="scan__sw">
                <i :style="{ background: suggestion.colors[role] }" /><span>{{ role }}<br /><code>{{ suggestion.colors[role] }}</code></span>
              </span>
            </span>
          </span>
        </div>
        <div class="scan__item" :class="{ 'is-off': !pick.fonts }">
          <span class="scan__item-body">
            <span class="scan__item-title"><q-checkbox v-model="pick.fonts" dense label="Fonts" class="scan__check" /> <span class="scan__conf" :class="`is-${suggestion.confidence.fonts}`">{{ CONF[suggestion.confidence.fonts] }}</span></span>
            <span class="scan__fonts">
              <span :style="{ fontFamily: getFont(suggestion.typography.heading).family }" class="scan__font-h">{{ getFont(suggestion.typography.heading).label }}</span>
              <span :style="{ fontFamily: getFont(suggestion.typography.body).family }" class="scan__font-b">Body · {{ getFont(suggestion.typography.body).label }}</span>
            </span>
          </span>
        </div>
      </div>
      <ul v-if="suggestion.notes?.length" class="scan__notes">
        <li v-for="n in suggestion.notes" :key="n">{{ n }}</li>
      </ul>
      <div class="scan__actions">
        <q-btn no-caps unelevated class="bs-btn bs-btn--ai" icon="done_all" label="Apply selected" :disable="!anyPicked" @click="apply" />
        <q-btn no-caps unelevated class="bs-btn bs-btn--ghost" label="Keep mine" @click="reset" />
      </div>
    </div>

    <!-- APPLIED -->
    <div v-else-if="state === 'applied'" class="scan__applied">
      <q-icon name="task_alt" size="22px" />
      <span><strong>Suggestions applied.</strong> Fine-tune anything below — every page updates instantly.</span>
      <q-btn flat no-caps dense class="bs-btn" icon="undo" label="Undo" @click="undo" />
      <q-btn flat no-caps dense class="bs-btn" label="Scan again" @click="reset" />
    </div>
  </section>
</template>

<style scoped>
.scan {
  position: relative; overflow: hidden; isolation: isolate;
  padding: clamp(18px, 3vw, 28px); border-radius: var(--bs-radius-lg);
  background: linear-gradient(135deg, #FBFAFF 0%, var(--bs-accent-soft) 100%);
  border: 1px solid var(--bs-accent-line);
  display: flex; flex-direction: column; gap: 14px;
}
.scan__glow { position: absolute; z-index: -1; right: -80px; top: -120px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(closest-side, rgb(124 58 237 / 0.16), transparent); }
.scan__head { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; max-width: 62ch; }
.scan__form { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.scan__input { flex: 1 1 260px; }
.scan__go { min-height: 40px; }
.scan__fine { margin: -6px 0 0; display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--bs-ink-soft); }

.scan__progress { display: flex; flex-direction: column; gap: 12px; }
.scan__stages { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
.scan__stages li { display: flex; align-items: center; gap: 8px; font: 700 0.875rem var(--bs-font); color: var(--bs-ink-faint); }
.scan__stages li.is-active { color: var(--bs-accent); }
.scan__stages li.is-done { color: var(--bs-ink); }
.scan__stage-ic { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: #fff; border: 1px solid var(--bs-accent-line); flex: none; }
.scan__stages li.is-done .scan__stage-ic { background: var(--bs-accent); border-color: var(--bs-accent); color: #fff; }
.scan__stage-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bs-line-strong); }
.scan__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

.scan__result { display: flex; flex-direction: column; gap: 12px; }
.scan__found { margin: 0; display: flex; gap: 6px; align-items: center; font-size: 0.9375rem; color: var(--bs-ink); }
.scan__found .q-icon { color: var(--bs-accent); }
.scan__items { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.scan__item { display: flex; padding: 12px; background: #fff; border: 1.5px solid var(--bs-accent); border-radius: var(--bs-radius-md); transition: opacity var(--ds-duration-fast), border-color var(--ds-duration-fast); }
.scan__item.is-off { border-color: var(--bs-accent-line); }
.scan__item.is-off .scan__logo, .scan__item.is-off .scan__swatches, .scan__item.is-off .scan__fonts { opacity: 0.45; }
.scan__check :deep(.q-checkbox__label) { font-weight: 700; }
.scan__item-body { display: flex; flex-direction: column; gap: 8px; min-width: 0; flex: 1; }
.scan__item-title { display: flex; align-items: center; justify-content: space-between; gap: 6px; font: 700 0.875rem var(--bs-font); color: var(--bs-ink); }
.scan__conf { font-size: 0.6875rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--ds-color-background-success); color: var(--ds-color-text-success); }
.scan__conf.is-medium { background: var(--ds-color-background-info); color: var(--ds-color-text-info); }
.scan__conf.is-low { background: var(--ds-color-background-warning); color: var(--ds-color-text-warning); }
.scan__logo { display: grid; place-items: center; height: 64px; border-radius: var(--bs-radius-sm); background: repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%) 50% / 12px 12px; }
.scan__logo img { max-height: 52px; max-width: 80%; object-fit: contain; }
.scan__swatches { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.scan__sw { display: flex; gap: 6px; align-items: center; font-size: 0.75rem; line-height: 1.2; color: var(--bs-ink-soft); text-transform: capitalize; }
.scan__sw i { width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgb(3 10 38 / 0.12); flex: none; }
.scan__sw code { font-size: 0.6875rem; text-transform: uppercase; color: var(--bs-ink); }
.scan__fonts { display: flex; flex-direction: column; gap: 2px; }
.scan__font-h { font-size: 1.375rem; font-weight: 700; color: var(--bs-ink); line-height: 1.1; }
.scan__font-b { font-size: 0.8125rem; color: var(--bs-ink-soft); }
.scan__notes { margin: 0; padding-left: 18px; font-size: 0.8125rem; color: var(--bs-ink-soft); line-height: 1.5; }
.scan__actions { display: flex; gap: 8px; flex-wrap: wrap; }
.scan__applied { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.9375rem; color: var(--bs-ink); }
.scan__applied > .q-icon { color: var(--bs-accent); }
</style>
