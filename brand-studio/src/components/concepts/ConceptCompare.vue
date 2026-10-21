<script setup>
// ConceptCompare — 2–3 concepts side by side, each shown as the landing hero
// AND the compact Browse/Details band, so organizers judge the whole system,
// then pick the winner. On phones the columns become a swipeable row.
import BrandHero from '../brand/BrandHero.vue'
import { getDirection } from '../../models/brandKit.js'

defineProps({
  concepts: { type: Array, default: () => [] },
  brandKit: { type: Object, required: true },
  copy: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['pick', 'remove'])
</script>

<template>
  <section class="cmp" aria-label="Compare concepts">
    <div v-if="concepts.length < 2" class="cmp__empty">
      <q-icon name="compare" size="36px" aria-hidden="true" />
      <p class="bs-subtitle">Pick two or three concepts to compare</p>
      <p class="bs-caption">Use the compare toggle on any concept card.</p>
    </div>

    <div v-else class="cmp__grid" :style="{ '--cols': concepts.length }" role="radiogroup" aria-label="Choose the winning concept">
      <article v-for="c in concepts" :key="c.id" class="cmp__col" :class="{ 'cmp__col--win': c.id === selectedId }" :aria-labelledby="`cmp-${c.id}`">
        <header class="cmp__head">
          <div>
            <p class="bs-eyebrow">{{ getDirection(c.direction).name }}</p>
            <h3 :id="`cmp-${c.id}`" class="bs-subtitle">{{ c.title }}</h3>
          </div>
          <q-btn flat round dense icon="close" :aria-label="`Remove ${c.title} from compare`" @click="emit('remove', c)" />
        </header>

        <figure class="cmp__fig">
          <figcaption class="cmp__cap">Event landing</figcaption>
          <brand-hero :concept="c" :brand-kit="brandKit" v-bind="copy" size="landing" :heading-level="4" aria-hidden="true" />
        </figure>
        <figure class="cmp__fig">
          <figcaption class="cmp__cap">Browse &amp; hotel details band</figcaption>
          <brand-hero :concept="c" :brand-kit="brandKit" :headline="copy.headline" :tagline="copy.tagline" :show-logo="copy.showLogo" size="compact" :heading-level="4" aria-hidden="true" />
        </figure>
        <p class="bs-body cmp__why">{{ c.rationale }}</p>

        <q-btn
          unelevated no-caps
          class="bs-btn cmp__pick"
          :class="c.id === selectedId ? 'bs-btn--primary' : 'bs-btn--ghost'"
          role="radio"
          :aria-checked="c.id === selectedId"
          :icon="c.id === selectedId ? 'emoji_events' : undefined"
          :label="c.id === selectedId ? 'Winner selected' : 'Pick this one'"
          @click="emit('pick', c)"
        />
      </article>
    </div>
  </section>
</template>

<style scoped>
.cmp { font-family: var(--bs-font); }
.cmp__empty { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; padding: 48px 16px; color: var(--bs-ink-faint); border: 1.5px dashed var(--bs-line-strong); border-radius: var(--bs-radius-lg); }
.cmp__grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 16px; }
.cmp__col { display: flex; flex-direction: column; gap: 12px; padding: 14px; background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg); box-shadow: var(--bs-shadow-1); }
.cmp__col--win { border-color: var(--bs-brand); box-shadow: 0 0 0 2px var(--bs-brand), var(--bs-shadow-2); }
.cmp__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.cmp__head .bs-eyebrow { margin-bottom: 6px; }
.cmp__fig { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.cmp__fig :deep(.bh) { border-radius: var(--bs-radius-md); }
.cmp__fig :deep(.bh--landing) { min-height: 0; aspect-ratio: 16 / 9; }
.cmp__cap { font: 700 0.6875rem/1 var(--bs-font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--bs-ink-faint); }
.cmp__why { flex: 1; }
@media (max-width: 860px) {
  .cmp__grid { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 86%; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; }
  .cmp__col { scroll-snap-align: start; }
}
</style>
