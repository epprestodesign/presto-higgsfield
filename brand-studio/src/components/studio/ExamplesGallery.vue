<script setup>
// ExamplesGallery — browse every industry vertical's example booking page
// (data/verticals) and load one into the Studio. Each card shows the real
// Presto banner (Higgsfield-generated background + live logo and copy).
import { computed, ref } from 'vue'
import BrandHero from '../brand/BrandHero.vue'
import { VERTICAL_EXAMPLES, VERTICAL_GROUPS } from '../../data/verticals/index.js'
import { sampleProject } from '../../data/sampleEvents.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Render inline (stories / pages) instead of in a dialog.
  inline: { type: Boolean, default: false },
  currentKey: { type: String, default: '' },
  // Minimal cards (homepage): logo + event name on the banner, industry name
  // underneath — no dates, taglines or pitch copy.
  minimal: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'select'])

const group = ref('all')
const query = ref('')

const cards = computed(() =>
  VERTICAL_EXAMPLES.map((v) => {
    const p = sampleProject(v.sampleKey)
    return {
      ...v,
      eventName: p.event.name,
      hero: {
        brandKit: p.brandKit,
        headline: p.event.name,
        tagline: props.minimal ? '' : p.pages.landing.hero.tagline,
        dates: props.minimal ? '' : formatDateRange(p.event.startDate, p.event.endDate),
        location: props.minimal ? '' : locationLabel(p.event),
      },
    }
  }),
)
const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return cards.value.filter((c) => (group.value === 'all' || c.group === group.value) && (!q || `${c.label} ${c.eventName} ${c.pitch}`.toLowerCase().includes(q)))
})
const counts = computed(() => Object.fromEntries(VERTICAL_GROUPS.map((g) => [g.id, cards.value.filter((c) => c.group === g.id).length])))

function pick(card) {
  emit('select', card.sampleKey)
  emit('update:modelValue', false)
}
</script>

<template>
  <component :is="inline ? 'div' : 'q-dialog'" :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <section class="xg" :class="{ 'xg--inline': inline, 'xg--minimal': minimal }" aria-labelledby="xg-title">
      <header class="xg__head">
        <div>
          <p class="bs-eyebrow">Examples</p>
          <h2 id="xg-title" class="bs-title">Start from an industry</h2>
          <p class="bs-caption">{{ cards.length }} ready-made booking pages. Logos and banners generated with Higgsfield. Pick one to load it into the Studio.</p>
        </div>
        <q-btn v-if="!inline" v-close-popup flat round dense icon="close" aria-label="Close examples" />
      </header>

      <div class="xg__filters">
        <q-input v-model="query" dense outlined clearable placeholder="Search industries" class="xg__search" aria-label="Search industries">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <div class="xg__chips" role="radiogroup" aria-label="Industry group">
          <button type="button" role="radio" class="xg__chip bs-focusable" :aria-checked="group === 'all'" @click="group = 'all'">All <span>{{ cards.length }}</span></button>
          <button v-for="g in VERTICAL_GROUPS" :key="g.id" type="button" role="radio" class="xg__chip bs-focusable" :aria-checked="group === g.id" @click="group = g.id">
            <q-icon :name="g.icon" size="16px" /> {{ g.label }} <span>{{ counts[g.id] }}</span>
          </button>
        </div>
      </div>

      <ul class="xg__grid">
        <li v-for="c in visible" :key="c.id">
          <button type="button" class="xg__card bs-focusable" :class="{ 'is-current': c.sampleKey === currentKey }" @click="pick(c)">
            <brand-hero v-bind="c.hero" size="card" :heading-level="3" class="xg__hero" />
            <span class="xg__meta">
              <span class="xg__label"><q-icon :name="c.icon" size="16px" /> {{ c.label }}</span>
              <span v-if="!minimal" class="xg__pitch">{{ c.pitch }}</span>
            </span>
            <span v-if="c.sampleKey === currentKey" class="bs-pill bs-pill--ai xg__current">Open now</span>
          </button>
        </li>
      </ul>
      <p v-if="!visible.length" class="bs-body xg__empty">No industries match “{{ query }}”.</p>
    </section>
  </component>
</template>

<style scoped>
/* Quasar only re-enables pointer events on `.q-dialog__inner > div`; this root is a <section>. */
.xg { pointer-events: all; width: min(1180px, 100vw); max-height: 92vh; overflow: auto; background: var(--bs-canvas); border-radius: var(--bs-radius-lg); padding: 24px; font-family: var(--bs-font); }
.xg--inline { width: auto; max-height: none; border-radius: 0; }
.xg__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.xg__head .bs-title { margin-top: 6px; }
.xg__head .bs-caption { margin-top: 6px; max-width: 62ch; }
.xg__filters { display: grid; gap: 12px; margin: 18px 0 16px; }
.xg__search { max-width: 360px; }
.xg__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.xg__chip { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--bs-line); background: var(--bs-surface); font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); cursor: pointer; }
.xg__chip span { font-weight: 400; color: var(--bs-ink-soft); }
.xg__chip[aria-checked='true'] { background: var(--bs-ink); color: #fff; border-color: var(--bs-ink); }
.xg__chip[aria-checked='true'] span { color: rgb(255 255 255 / 0.7); }
.xg__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.xg__card { position: relative; width: 100%; display: grid; text-align: left; padding: 0; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); overflow: hidden; cursor: pointer; transition: transform var(--ds-duration-fast, 150ms) ease, box-shadow var(--ds-duration-fast, 150ms) ease; }
.xg__card:hover { transform: translateY(-2px); box-shadow: var(--bs-shadow-2); }
.xg__card.is-current { border-color: var(--bs-accent); box-shadow: 0 0 0 2px var(--bs-accent); }
.xg__hero { pointer-events: none; }
.xg__meta { display: grid; gap: 4px; padding: 12px 14px 14px; }
.xg__label { display: inline-flex; align-items: center; gap: 6px; font: 700 0.9375rem var(--bs-font); color: var(--bs-ink); }
.xg__label .q-icon { color: var(--bs-accent); }
.xg__pitch { font-size: 0.8125rem; line-height: 1.45; color: var(--bs-ink-soft); }
.xg--minimal .xg__meta { padding: 10px 14px; }
.xg--minimal .xg__label { font-size: 0.875rem; }
.xg--minimal :deep(.bh--card .bh__content) { padding-block: 20px; gap: 10px; }
.xg--minimal :deep(.bh--card .bh__headline) { font-size: clamp(18px, 5cqi, 24px); }
.xg__current { position: absolute; top: 10px; right: 10px; }
.xg__empty { padding: 24px 0; }
@media (prefers-reduced-motion: reduce) { .xg__card { transition: none; } .xg__card:hover { transform: none; } }
@media (max-width: 600px) { .xg { padding: 16px; border-radius: 0; max-height: none; } .xg__grid { grid-template-columns: 1fr; } }
</style>
