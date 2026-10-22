<script setup>
// ConceptPanel — the creative concept currently driving the hero treatment,
// and every other concept to swap to in place (an AI moment → violet). With no
// concepts yet, 'change-concept' asks the host to create them.
import { computed } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { getDirection } from '../../../models/brandKit.js'
import { formatDateRange } from '../../../models/event.js'
import BrandHero from '../../brand/BrandHero.vue'
import PanelGroup from './PanelGroup.vue'
import { conceptWithHero } from '../../../theme/heroConcept.js'

const emit = defineEmits(['change-concept'])
const store = useProjectStore()
const concept = computed(() => conceptWithHero(store.selectedConcept, store.brandKit))
const direction = computed(() => (concept.value ? getDirection(concept.value.direction) : null))
const alternatives = computed(() => store.project.concepts.items.filter((c) => c.id !== store.project.concepts.selectedId))
const dates = computed(() => formatDateRange(store.event.startDate, store.event.endDate))
</script>

<template>
  <div class="cnp">
    <PanelGroup title="Current concept">
      <template v-if="concept">
        <div class="cnp__card">
          <BrandHero
            :concept="concept"
            :brand-kit="store.brandKit"
            :headline="store.pages.landing.hero.headline || store.event.name"
            :dates="dates"
            size="card"
            :heading-level="4"
          />
        </div>
        <div class="cnp__meta">
          <span class="bs-pill bs-pill--ai"><q-icon :name="direction.icon" size="14px" /> {{ direction.name }}</span>
          <h4 class="cnp__title">{{ concept.title }}</h4>
          <p class="cnp__why">{{ concept.rationale }}</p>
        </div>
      </template>
      <div v-else class="cnp__empty">
        <q-icon name="auto_awesome" size="26px" />
        <p class="cnp__empty-title">No concept selected</p>
        <p class="cnp__why">Your pages use a clean default banner from your Brand Kit until you pick a concept below.</p>
      </div>
      <q-btn
        v-if="!store.project.concepts.items.length"
        unelevated
        no-caps
        class="bs-btn bs-btn--ai cnp__btn"
        icon="auto_awesome"
        :label="'Create concepts'"
        @click="emit('change-concept')"
      />
    </PanelGroup>

    <PanelGroup v-if="alternatives.length" title="All concepts" hint="Three directions, two treatments each. Tap one to use it on every page.">
      <div class="cnp__alts">
        <button
          v-for="alt in alternatives"
          :key="alt.id"
          type="button"
          class="cnp__alt bs-focusable"
          :aria-label="`Use concept ${alt.title}`"
          @click="store.selectConcept(alt.id)"
        >
          <span class="cnp__alt-frame">
            <span class="cnp__alt-scale">
              <BrandHero :concept="alt" :brand-kit="store.brandKit" :headline="store.event.name" size="card" :show-dates="false" :heading-level="5" />
            </span>
          </span>
          <span class="cnp__alt-label">{{ alt.title }}</span>
        </button>
      </div>
    </PanelGroup>
  </div>
</template>

<style scoped>
.cnp { font-family: var(--bs-font); }
.cnp__card { border-radius: var(--bs-radius-md); overflow: hidden; box-shadow: var(--bs-shadow-2); }
.cnp__meta { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.cnp__title { margin: 2px 0 0; font: 700 1rem/1.25 var(--bs-font); color: var(--bs-ink); }
.cnp__why { margin: 0; font: 400 0.8125rem/1.45 var(--bs-font); color: var(--bs-ink-soft); }
.cnp__empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; padding: 20px 12px; border: 1px dashed var(--bs-accent-line); border-radius: var(--bs-radius-md); background: var(--bs-accent-soft); color: var(--bs-accent); }
.cnp__empty-title { margin: 4px 0 0; font: 700 0.9375rem/1.3 var(--bs-font); color: var(--bs-ink); }
.q-btn.cnp__btn { min-height: 40px; }
.cnp__alts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cnp__alt { display: flex; flex-direction: column; gap: 4px; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; border-radius: var(--bs-radius-sm); }
/* Thumbnails render the card at 2× width and scale down, so type stays in proportion. */
.cnp__alt-frame { position: relative; display: block; width: 100%; aspect-ratio: 16 / 7; overflow: hidden; border-radius: var(--bs-radius-sm); box-shadow: 0 0 0 1px var(--bs-line); transition: box-shadow var(--ds-duration-fast); }
.cnp__alt-scale { position: absolute; top: 0; left: 0; width: 200%; transform: scale(0.5); transform-origin: 0 0; pointer-events: none; }
.cnp__alt:hover .cnp__alt-frame { box-shadow: 0 0 0 2px var(--bs-brand); }
.cnp__alt-label { font: 700 0.75rem/1.25 var(--bs-font); color: var(--bs-ink-soft); }
</style>
