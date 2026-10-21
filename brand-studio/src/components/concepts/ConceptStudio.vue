<script setup>
// ConceptStudio — the "Creative concepts" step. Pick directions → generate six
// concepts (2 per direction) through the AI provider abstraction → favorite,
// compare, regenerate, branch variations, preview on desktop/mobile → select
// one. The selected concept drives the hero on every booking page.
//
// Contract: emits 'next' (only once a concept is selected), 'back', 'signup'.
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from '../../stores/project.js'
import { useGenerationStore } from '../../stores/generation.js'
import { CREATIVE_DIRECTIONS, getDirection } from '../../models/brandKit.js'
import { useHeroCopy } from './useHeroCopy.js'
import DirectionPicker from './DirectionPicker.vue'
import ConceptCard from './ConceptCard.vue'
import ConceptCompare from './ConceptCompare.vue'
import ConceptPreviewDialog from './ConceptPreviewDialog.vue'
import GenerationStatus from './GenerationStatus.vue'
import UsageMeter from './UsageMeter.vue'
import ProviderSelect from './ProviderSelect.vue'

const props = defineProps({
  // Hide the step header/footer when embedded (e.g. inside the Studio editor).
  embedded: { type: Boolean, default: false },
  stepLabel: { type: String, default: 'Step 3 of 5' },
})
const emit = defineEmits(['next', 'back', 'signup'])

const $q = useQuasar()
const project = useProjectStore()
const gen = useGenerationStore()
const copy = useHeroCopy()

const directions = ref(CREATIVE_DIRECTIONS.map((d) => d.id))
const providerId = ref('mock')
const filter = ref('all') // all | favorites | signature | energy | premium
const sort = ref('recommended')
const pending = ref(null) // { kind, conceptId? } for the in-flight job
const lastRequest = ref(null)
const previewConcept = ref(null)
const previewOpen = ref(false)
const compareOpen = ref(false)

const concepts = computed(() => project.project.concepts)
const items = computed(() => concepts.value.items)
const byId = (id) => items.value.find((c) => c.id === id)
const hasResults = computed(() => items.value.length > 0)
const selectedId = computed(() => concepts.value.selectedId)
const selected = computed(() => project.selectedConcept)
const compareItems = computed(() => concepts.value.compareIds.map(byId).filter(Boolean))
const generatingSet = computed(() => gen.busy && pending.value?.kind === 'concepts')
const variationsFor = computed(() => (gen.busy && pending.value?.kind === 'variations' ? pending.value.conceptId : null))
const regeneratingId = computed(() => (gen.busy && pending.value?.kind === 'regenerate' ? pending.value.conceptId : null))
const conceptCount = computed(() => directions.value.length * 2)

// Variations sit right after their parent ("recommended" order).
const ordered = computed(() => {
  const list = items.value
  if (sort.value === 'newest') return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (sort.value === 'direction') {
    const rank = (d) => CREATIVE_DIRECTIONS.findIndex((x) => x.id === d)
    return [...list].sort((a, b) => rank(a.direction) - rank(b.direction))
  }
  const roots = list.filter((c) => !c.parentId || !byId(c.parentId))
  return roots.flatMap((r) => [r, ...list.filter((c) => c.parentId === r.id)])
})
const visible = computed(() => {
  if (filter.value === 'all') return ordered.value
  if (filter.value === 'favorites') return ordered.value.filter((c) => concepts.value.favoriteIds.includes(c.id))
  return ordered.value.filter((c) => c.direction === filter.value)
})
const filters = computed(() => [
  { value: 'all', label: 'All', count: items.value.length },
  { value: 'favorites', label: 'Favorites', icon: 'favorite', count: concepts.value.favoriteIds.length },
  ...CREATIVE_DIRECTIONS.map((d) => ({ value: d.id, label: d.name, count: items.value.filter((c) => c.direction === d.id).length })),
])
const parentTitle = (c) => (c.parentId ? byId(c.parentId)?.title || 'an earlier concept' : '')

// ── Actions ────────────────────────────────────────────────────────────────
async function run(kind, request, conceptId) {
  pending.value = { kind, conceptId }
  lastRequest.value = { kind, request, conceptId }
  try {
    const job = await request()
    if (job?.status === 'succeeded') {
      const n = job.results?.length || 0
      const msg = kind === 'concepts' ? `${n} concepts ready` : kind === 'variations' ? `${n} variations added` : 'Concept regenerated'
      $q.notify({ message: msg, icon: 'auto_awesome', color: 'deep-purple-7', timeout: 1800, position: 'bottom', classes: props.embedded ? '' : 'cs-notify--above-footer' })
    }
  } finally {
    pending.value = null
  }
}

function generate() {
  const go = () => run('concepts', () => gen.generateConcepts([...directions.value]))
  if (!hasResults.value) return go()
  $q.dialog({
    title: 'Generate a new set?',
    message: 'This replaces the current concepts. Favorites and your selection will be cleared.',
    cancel: { flat: true, noCaps: true, label: 'Keep current' },
    ok: { unelevated: true, noCaps: true, color: 'deep-purple-7', label: 'Generate new set' },
    persistent: false,
  }).onOk(go)
}
const regenerate = (c) => run('regenerate', () => gen.regenerate(c), c.id)
const variations = (c) => run('variations', () => gen.generateVariations(c, 3), c.id)
const retry = () => lastRequest.value && run(lastRequest.value.kind, lastRequest.value.request, lastRequest.value.conceptId)

function select(c) { project.selectConcept(c.id) }
function openPreview(c) { previewConcept.value = c; previewOpen.value = true }
function pickWinner(c) {
  project.selectConcept(c.id)
  compareOpen.value = false
  $q.notify({ message: `${c.title} selected`, icon: 'emoji_events', color: 'dark', timeout: 1600, position: 'bottom' })
}
</script>

<template>
  <div class="cs" :class="{ 'cs--embedded': embedded }">
    <!-- Header -->
    <header v-if="!embedded" class="cs__header">
      <div class="cs__intro">
        <p class="bs-eyebrow">{{ stepLabel }} · Creative concepts</p>
        <h1 class="bs-display-2">Choose your look</h1>
        <p class="bs-lead">We’ll design six banner concepts from your brand kit across three creative directions. Pick a favorite — you can fine-tune everything in the editor.</p>
      </div>
      <div class="cs__meta">
        <provider-select v-model="providerId" />
        <usage-meter :used="gen.used" :limit="gen.limit" @signup="emit('signup')" />
      </div>
    </header>

    <!-- Directions + generate -->
    <section class="cs__directions" aria-labelledby="cs-dir-title">
      <div class="cs__section-head">
        <h2 id="cs-dir-title" class="bs-subtitle">Creative directions</h2>
        <span class="bs-caption">{{ directions.length }} of 3 selected · {{ conceptCount }} concepts</span>
      </div>
      <direction-picker v-model="directions" :suggested="project.brandKit.direction" :disabled="gen.busy" />
      <div class="cs__generate">
        <q-btn
          unelevated no-caps
          class="bs-btn bs-btn--lg bs-btn--ai cs__go"
          icon="auto_awesome"
          :label="hasResults ? 'Generate a new set' : `Generate ${conceptCount} concepts`"
          :loading="generatingSet"
          :disable="gen.busy || gen.remaining === 0"
          @click="generate"
        >
          <template #loading><q-spinner-dots size="22px" /> <span class="q-ml-sm">Generating…</span></template>
        </q-btn>
        <p class="bs-caption cs__fine">Uses 1 free generation · artwork only, your text stays editable</p>
      </div>
    </section>

    <!-- Live status / errors -->
    <generation-status
      v-if="gen.active && (gen.busy || gen.active.status === 'failed')"
      class="cs__status"
      :job="gen.active"
      :label="pending?.kind === 'variations' ? 'Generating variations' : pending?.kind === 'regenerate' ? 'Regenerating concept' : 'Generating concepts'"
      @cancel="gen.cancel()"
      @retry="retry"
      @dismiss="gen.dismissError()"
    >
      <template #limit-action>
        <q-btn v-if="gen.active?.error?.code === 'usage_limit'" unelevated no-caps class="bs-btn bs-btn--primary" label="Create a free account" @click="emit('signup')" />
      </template>
    </generation-status>

    <!-- Gallery -->
    <section class="cs__gallery" aria-labelledby="cs-gal-title">
      <div v-if="hasResults || generatingSet" class="cs__toolbar">
        <h2 id="cs-gal-title" class="bs-subtitle">Concepts</h2>
        <div class="cs__filters" role="group" aria-label="Filter concepts">
          <button
            v-for="f in filters"
            :key="f.value"
            type="button"
            class="cs__chip bs-focusable"
            :class="{ 'cs__chip--on': filter === f.value }"
            :aria-pressed="filter === f.value"
            @click="filter = f.value"
          >
            <q-icon v-if="f.icon" :name="f.icon" size="14px" aria-hidden="true" />
            {{ f.label }} <span class="cs__count">{{ f.count }}</span>
          </button>
        </div>
        <div class="cs__tools">
          <q-select
            v-model="sort" dense outlined emit-value map-options options-dense
            class="cs__sort" label="Sort"
            :options="[{ label: 'Recommended', value: 'recommended' }, { label: 'Newest first', value: 'newest' }, { label: 'By direction', value: 'direction' }]"
          />
          <q-btn
            unelevated no-caps
            class="bs-btn"
            :class="compareItems.length >= 2 ? 'bs-btn--primary' : 'bs-btn--ghost'"
            icon="compare"
            :label="`Compare${compareItems.length ? ` (${compareItems.length})` : ''}`"
            :disable="compareItems.length < 2"
            @click="compareOpen = true"
          />
        </div>
      </div>
      <h2 v-else id="cs-gal-title" class="bs-sr-only">Concepts</h2>

      <!-- Skeletons while the first/new set generates -->
      <div v-if="generatingSet" class="cs__grid" aria-hidden="true">
        <div v-for="n in conceptCount" :key="'sk' + n" class="cs__skel">
          <div class="cs__skel-media"><span class="cs__shimmer" /></div>
          <div class="cs__skel-body">
            <q-skeleton type="text" width="55%" height="22px" animation="wave" />
            <q-skeleton type="text" width="90%" animation="wave" />
            <q-skeleton type="text" width="70%" animation="wave" />
            <q-skeleton type="rect" height="44px" animation="wave" style="border-radius: 6px" />
          </div>
        </div>
      </div>

      <!-- Results -->
      <div
        v-else-if="hasResults"
        class="cs__grid"
        role="radiogroup"
        aria-label="Concepts — choose one"
      >
        <template v-for="c in visible" :key="c.id">
          <concept-card
            :concept="c"
            :brand-kit="project.brandKit"
            :copy="copy"
            :selected="c.id === selectedId"
            :favorite="concepts.favoriteIds.includes(c.id)"
            :compared="concepts.compareIds.includes(c.id)"
            :compare-disabled="compareItems.length >= 3"
            :busy="regeneratingId === c.id"
            :locked="gen.busy"
            :parent-title="parentTitle(c)"
            @select="select"
            @favorite="project.toggleFavorite($event.id)"
            @compare="project.toggleCompare($event.id)"
            @regenerate="regenerate"
            @variations="variations"
            @preview="openPreview"
          />
          <!-- Variation skeletons appear right after their parent -->
          <template v-if="variationsFor === c.id">
            <div v-for="n in 3" :key="'vs' + n" class="cs__skel cs__skel--var" aria-hidden="true">
              <div class="cs__skel-media"><span class="cs__shimmer" /><span class="cs__skel-tag">Variation {{ n }}</span></div>
              <div class="cs__skel-body">
                <q-skeleton type="text" width="50%" height="22px" animation="wave" />
                <q-skeleton type="text" width="85%" animation="wave" />
              </div>
            </div>
          </template>
        </template>
        <div v-if="!visible.length" class="cs__nofilter">
          <q-icon name="filter_alt_off" size="28px" aria-hidden="true" />
          <p class="bs-body">{{ filter === 'favorites' ? 'No favorites yet — tap the heart on any concept.' : 'No concepts in this direction.' }}</p>
          <q-btn flat no-caps label="Show all concepts" @click="filter = 'all'" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="cs__empty">
        <div class="cs__empty-art" aria-hidden="true">
          <span class="cs__ghost cs__ghost--a" /><span class="cs__ghost cs__ghost--b" /><span class="cs__ghost cs__ghost--c" />
          <q-icon name="auto_awesome" size="34px" class="cs__empty-spark" />
        </div>
        <h3 class="bs-title">Your concepts will appear here</h3>
        <p class="bs-body">Choose the directions to explore, then generate. It takes a few seconds and doesn’t change your brand kit.</p>
      </div>
    </section>

    <!-- Footer -->
    <footer v-if="!embedded" class="cs__footer">
      <q-btn flat no-caps class="bs-btn" icon="arrow_back" label="Back" @click="emit('back')" />
      <div class="cs__footer-sel" aria-live="polite">
        <template v-if="selected">
          <span class="cs__sel-dot" :style="{ background: selected.treatment.background }" aria-hidden="true" />
          <span><strong>{{ selected.title }}</strong> · {{ getDirection(selected.direction).name }}</span>
        </template>
        <span v-else class="bs-caption">Select a concept to continue</span>
      </div>
      <q-btn
        unelevated no-caps
        class="bs-btn bs-btn--lg bs-btn--primary"
        icon-right="arrow_forward"
        label="Customize my page"
        :disable="!selected"
        @click="emit('next', selected)"
      />
    </footer>

    <!-- Dialogs -->
    <concept-preview-dialog
      v-model="previewOpen"
      :concept="previewConcept"
      :brand-kit="project.brandKit"
      :copy="copy"
      :site-url="project.event.websiteUrl"
      :selected="previewConcept?.id === selectedId"
      :show-teams="project.event.category === 'sports'"
      @select="select"
    />
    <q-dialog v-model="compareOpen" full-width>
      <div class="cs__compare-dialog">
        <header class="cs__compare-head">
          <h2 class="bs-title">Compare concepts</h2>
          <q-btn v-close-popup flat round icon="close" aria-label="Close compare" />
        </header>
        <concept-compare
          :concepts="compareItems"
          :brand-kit="project.brandKit"
          :copy="copy"
          :selected-id="selectedId"
          @pick="pickWinner"
          @remove="project.toggleCompare($event.id)"
        />
      </div>
    </q-dialog>
  </div>
</template>

<style scoped>
.cs { --cs-pad: clamp(16px, 3vw, 40px); background: var(--bs-canvas); min-height: 100%; font-family: var(--bs-font); color: var(--bs-ink); display: flex; flex-direction: column; }
.cs__header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; padding: var(--cs-pad) var(--cs-pad) 8px; max-width: 1360px; width: 100%; margin: 0 auto; }
.cs__intro { display: flex; flex-direction: column; gap: 10px; max-width: 700px; }
.cs__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }

.cs__directions, .cs__gallery, .cs__status { max-width: 1360px; width: calc(100% - 2 * var(--cs-pad)); margin: 0 auto; }
.cs__directions { margin-top: 24px; padding: 20px; background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-xl); box-shadow: var(--bs-shadow-1); display: flex; flex-direction: column; gap: 14px; }
.cs__section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.cs__generate { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.cs__go { box-shadow: 0 8px 24px rgb(124 58 237 / 0.28); }
.cs__fine { color: var(--bs-ink-faint); }
.cs__status { margin-top: 16px; }

.cs__gallery { margin-top: 28px; padding-bottom: 32px; flex: 1; }
.cs__toolbar { display: flex; align-items: center; gap: 12px 16px; flex-wrap: wrap; margin-bottom: 16px; }
.cs__filters { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.cs__chip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px; border-radius: 999px;
  border: 1px solid var(--bs-line); background: var(--bs-surface); color: var(--bs-ink-soft); font: 700 0.8125rem var(--bs-font); cursor: pointer;
}
.cs__chip:hover { border-color: var(--bs-line-strong); color: var(--bs-ink); }
.cs__chip--on { background: var(--bs-ink); border-color: var(--bs-ink); color: #fff; }
.cs__count { font-variant-numeric: tabular-nums; opacity: 0.7; font-weight: 400; }
.cs__tools { display: flex; gap: 8px; align-items: center; }
.cs__sort { min-width: 160px; background: var(--bs-surface); }

.cs__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 20px; }

.cs__skel { border-radius: var(--bs-radius-lg); overflow: hidden; background: var(--bs-surface); border: 1px solid var(--bs-line); }
.cs__skel--var { border-style: dashed; border-color: var(--bs-accent-line); }
.cs__skel-media { position: relative; aspect-ratio: 16 / 7; background: linear-gradient(120deg, var(--ds-palette-violet-100), var(--ds-palette-navy-50)); overflow: hidden; }
.cs__shimmer { position: absolute; inset: 0; background: linear-gradient(100deg, transparent 20%, rgb(255 255 255 / 0.6) 50%, transparent 80%); animation: cs-shimmer 1.4s linear infinite; transform: translateX(-100%); }
@keyframes cs-shimmer { to { transform: translateX(100%); } }
.cs__skel-tag { position: absolute; left: 10px; top: 10px; padding: 3px 8px; border-radius: 999px; background: var(--bs-accent); color: #fff; font: 700 0.6875rem var(--bs-font); }
.cs__skel-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }

.cs__nofilter { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 40px 16px; color: var(--bs-ink-faint); text-align: center; }

.cs__empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 48px 16px; border: 1.5px dashed var(--bs-line-strong); border-radius: var(--bs-radius-xl); background: rgb(255 255 255 / 0.6); }
.cs__empty .bs-body { max-width: 460px; }
.cs__empty-art { position: relative; width: 260px; height: 120px; margin-bottom: 8px; }
.cs__ghost { position: absolute; width: 150px; height: 84px; border-radius: 12px; box-shadow: var(--bs-shadow-2); }
.cs__ghost--a { left: 0; top: 24px; background: linear-gradient(135deg, var(--ds-palette-navy-900), var(--ds-palette-navy-500)); transform: rotate(-8deg); }
.cs__ghost--b { left: 55px; top: 6px; background: repeating-linear-gradient(115deg, #F5B700 0 6px, #0E1B2C 6px 22px); z-index: 1; }
.cs__ghost--c { right: 0; top: 28px; background: linear-gradient(160deg, #E9E4DA, #B9A88A); transform: rotate(8deg); }
.cs__empty-spark { position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%); color: #fff; background: var(--bs-accent); padding: 10px; border-radius: 999px; box-shadow: 0 0 0 6px rgb(124 58 237 / 0.18); }

/* Footer — fixed to the viewport (sticky-bottom on the last child of a page-height
   column is unreliable in Safari / embedded webviews); .cs reserves its height. */
.cs:not(.cs--embedded) { padding-bottom: calc(var(--cs-footer-h) + env(safe-area-inset-bottom)); }
.cs { --cs-footer-h: 77px; }
.cs__footer {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 1500; display: flex; align-items: center; gap: 16px;
  padding: 12px var(--cs-pad); padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgb(255 255 255 / 0.94); backdrop-filter: blur(8px); border-top: 1px solid var(--bs-line);
  box-shadow: 0 -4px 16px rgb(15 23 42 / 0.06);
}
.cs__footer-sel { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 0.9375rem; color: var(--bs-ink); min-width: 0; }
.cs__footer-sel > span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs__sel-dot { width: 14px; height: 14px; border-radius: 4px; flex: none; box-shadow: 0 0 0 1px var(--bs-line-strong); }

.cs__compare-dialog { background: var(--bs-canvas); border-radius: var(--bs-radius-xl); padding: 20px; max-height: 92vh; overflow: auto; }
.cs__compare-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }

@media (max-width: 860px) {
  .cs__meta { align-items: flex-start; width: 100%; flex-direction: row; justify-content: space-between; flex-wrap: wrap; }
  .cs__directions { padding: 14px; border-radius: var(--bs-radius-lg); }
  .cs__go { width: 100%; }
  .cs__filters { flex-wrap: nowrap; overflow-x: auto; flex-basis: 100%; order: 3; padding-bottom: 2px; }
  .cs__chip { flex: none; }
  .cs__tools { margin-left: auto; }
}
@media (max-width: 600px) {
  .cs { --cs-footer-h: 112px; }
  .cs__footer { flex-wrap: wrap; gap: 8px; }
  .cs__footer-sel { order: -1; flex-basis: 100%; justify-content: flex-start; }
  .cs__footer .bs-btn--lg { flex: 1; }
  .cs__sort { min-width: 130px; }
}
@media (prefers-reduced-motion: reduce) { .cs__shimmer { animation: none; } }
</style>

<style>
/* Toasts render in a body-level portal — lift them above the fixed step footer. */
.cs-notify--above-footer { margin-bottom: 96px !important; }
@media (max-width: 860px) { .cs-notify--above-footer { margin-bottom: 128px !important; } }
</style>
